// ============================================================
// Cliente unificado para llamar a cualquier proveedor de IA.
// Incluye fallbacks robustos de parsing JSON para modelos
// pequeños que devuelven texto con markdown/errores menores.
// ============================================================

import type { AIProvider, GenerateRequest } from "../types";
import { getAdapter } from "./adapters";

export class AIError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AIError";
    this.status = status;
  }
}

async function doFetch(url: string, headers: Record<string, string>, body: any, signal?: AbortSignal) {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const t = await res.text();
      detail = t.slice(0, 300);
    } catch {
      /* ignore */
    }
    throw new AIError(`HTTP ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`, res.status);
  }
  return res.json();
}

/** Llama al proveedor y devuelve el texto de la respuesta */
export async function chatCompletion(p: AIProvider, req: GenerateRequest): Promise<string> {
  const adapter = getAdapter(p.kind);
  let url = adapter.buildUrl(p, "chat");
  let body = adapter.buildChatBody(p, req);

  // Gemini incluye el modelo en la URL
  if (p.kind === "google-gemini") {
    url = url.replace(
      /models\/[^:/]+:generateContent/,
      `models/${encodeURIComponent(req.model || p.defaultModel)}:generateContent`
    );
    delete body.__geminiModel;
  }

  const headers = adapter.buildHeaders(p);
  const json = await doFetch(url, headers, body, req.signal);
  return adapter.parseChatResponse(json);
}

/** Obtiene la lista de modelos del proveedor */
export async function listModels(p: AIProvider): Promise<string[]> {
  const adapter = getAdapter(p.kind);
  const url = adapter.buildUrl(p, "models");
  const headers = adapter.buildHeaders(p);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new AIError(`No se pudieron listar modelos: HTTP ${res.status}`, res.status);
  }
  const json = await res.json();
  return adapter.parseModels(json);
}

/** Test rápido de conectividad con un prompt mínimo */
export async function testProvider(p: AIProvider, model: string): Promise<{ ok: boolean; message: string }> {
  try {
    const text = await chatCompletion(p, {
      providerId: p.id,
      model,
      prompt: "Responde únicamente con la palabra: OK",
      maxTokens: 10,
      temperature: 0,
    });
    return { ok: true, message: `Conexión correcta. Respuesta: "${text.trim().slice(0, 60)}"` };
  } catch (e: any) {
    const msg = e?.name === "TypeError" 
      ? `Error de red/CORS al conectar con ${p.baseUrl}. Verifica que la API esté accesible desde el navegador.`
      : e?.message || String(e);
    return { ok: false, message: msg };
  }
}

// ------------------------------------------------------------
// Parsing tolerante a fallos de JSON (modelos pequeños)
// ------------------------------------------------------------
export function stripCodeFence(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fence && fence[1].trim()) return fence[1].trim();
  return t;
}

/** Extrae el primer objeto/array JSON balanceado del texto */
export function extractJson(text: string): any {
  const cleaned = stripCodeFence(text);
  // intento directo
  try {
    return JSON.parse(cleaned);
  } catch {
    /* sigue */
  }
  // buscar primer { o [ y hacer match balanceado (ignorando strings)
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error("La respuesta no contiene JSON.");
  const open = cleaned[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) {
        const slice = cleaned.slice(start, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          // último recurso: quitar trailing commas
          const fixed = slice.replace(/,\s*([}\]])/g, "$1");
          return JSON.parse(fixed);
        }
      }
    }
  }
  throw new Error("JSON incompleto en la respuesta del modelo.");
}
