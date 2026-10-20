// ============================================================
// Adaptadores de proveedores de IA.
// Diseñados para que CUALQUIER API compatible se pueda conectar:
//  - openai-compatible: OpenAI, Groq, Together, Fireworks, Mistral,
//    DeepSeek, OpenRouter, LM Studio, vLLM, LocalAI, etc.
//  - anthropic: Claude Messages API
//  - google-gemini: generateContent
//  - ollama: /api/chat + /api/tags
//  - custom: rutas configurables estilo OpenAI para APIs exóticas
// ============================================================

import type { AIProvider, AIProviderAdapter, GenerateRequest } from "../types";

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

/** Añade /v1 si el baseUrl no lo incluye ya y el proveedor lo usa por defecto */
function withV1(base: string): string {
  const b = base.replace(/\/+$/, "");
  if (/\/v1$/.test(b) || /\/v\d+$/.test(b)) return b;
  return `${b}/v1`;
}

// ------------------------------------------------------------
// OpenAI-compatible (y derivados)
// ------------------------------------------------------------
export const openaiAdapter: AIProviderAdapter = {
  label: "OpenAI-compatible",
  buildUrl(p, capability) {
    const style = p.apiStyle;
    if (style && !style.chat && capability === "chat") {
      // API "custom" sin estilo chat estándar -> endpoint configurable
      return joinUrl(withV1(p.baseUrl), "chat/completions");
    }
    if (capability === "models") return joinUrl(withV1(p.baseUrl), "models");
    return joinUrl(withV1(p.baseUrl), "chat/completions");
  },
  buildHeaders(p) {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (p.apiKey) {
      h["Authorization"] = `Bearer ${p.apiKey}`;
      // Algunas APIs (Azure-style o proxies) usan api-key header
      if (p.kind === "openai-compatible" && /azure/i.test(p.baseUrl)) {
        h["api-key"] = p.apiKey;
      }
    }
    return { ...h, ...(p.headers || {}) };
  },
  buildChatBody(_p, req) {
    const messages: any[] = [];
    if (req.system) messages.push({ role: "system", content: req.system });
    messages.push({ role: "user", content: req.prompt });
    return {
      model: req.model,
      messages,
      temperature: req.temperature ?? 0.8,
      max_tokens: req.maxTokens ?? 2048,
      stream: false,
    };
  },
  parseChatResponse(json) {
    const text =
      json?.choices?.[0]?.message?.content ??
      json?.choices?.[0]?.text ??
      json?.output_text ??
      null;
    if (typeof text !== "string") {
      throw new Error("Respuesta sin formato reconocido (choices[0].message.content).");
    }
    return text;
  },
  parseModels(json) {
    const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : [];
    return arr.map((m: any) => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean);
  },
};

// ------------------------------------------------------------
// Anthropic (Claude Messages API)
// ------------------------------------------------------------
export const anthropicAdapter: AIProviderAdapter = {
  label: "Anthropic (Claude)",
  buildUrl(p, capability) {
    if (capability === "models") return joinUrl(p.baseUrl, "v1/models");
    return joinUrl(p.baseUrl, "v1/messages");
  },
  buildHeaders(p) {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
    if (p.apiKey) h["x-api-key"] = p.apiKey;
    return { ...h, ...(p.headers || {}) };
  },
  buildChatBody(_p, req) {
    return {
      model: req.model,
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.8,
      system: req.system || undefined,
      messages: [{ role: "user", content: req.prompt }],
    };
  },
  parseChatResponse(json) {
    const parts = json?.content;
    if (Array.isArray(parts)) {
      const text = parts
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      if (text) return text;
    }
    throw new Error("Respuesta Anthropic sin contenido de texto.");
  },
  parseModels(json) {
    const arr = Array.isArray(json?.data) ? json.data : [];
    return arr.map((m: any) => m.id || m.name).filter(Boolean);
  },
};

// ------------------------------------------------------------
// Google Gemini (generateContent)
// ------------------------------------------------------------
export const geminiAdapter: AIProviderAdapter = {
  label: "Google Gemini",
  buildUrl(p, capability) {
    const key = p.apiKey ? `?key=${encodeURIComponent(p.apiKey)}` : "";
    if (capability === "models") {
      return joinUrl(p.baseUrl, `v1beta/models${p.apiKey ? `?key=${encodeURIComponent(p.apiKey)}` : ""}`);
    }
    return joinUrl(p.baseUrl, `v1beta/models/${encodeURIComponent(p.defaultModel || "gemini-pro")}:generateContent${key}`);
  },
  buildHeaders(p) {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (p.apiKey) h["x-goog-api-key"] = p.apiKey;
    return { ...h, ...(p.headers || {}) };
  },
  buildChatBody(p, req) {
    const body: any = {
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      generationConfig: {
        temperature: req.temperature ?? 0.8,
        maxOutputTokens: req.maxTokens ?? 2048,
      },
    };
    if (req.system) body.systemInstruction = { parts: [{ text: req.system }] };
    // La URL lleva el modelo; devolvemos marker para que el cliente lo use
    return { __geminiModel: req.model || p.defaultModel, ...body };
  },
  parseChatResponse(json) {
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("");
    if (!text) throw new Error("Respuesta Gemini sin candidatos/texto.");
    return text;
  },
  parseModels(json) {
    const arr = Array.isArray(json?.models) ? json.models : [];
    return arr
      .filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m: any) => (m.name || "").replace(/^models\//, ""))
      .filter(Boolean);
  },
};

// ------------------------------------------------------------
// Ollama (local, sin clave)
// ------------------------------------------------------------
export const ollamaAdapter: AIProviderAdapter = {
  label: "Ollama (local)",
  buildUrl(p, capability) {
    if (capability === "models") return joinUrl(p.baseUrl, "api/tags");
    return joinUrl(p.baseUrl, "api/chat");
  },
  buildHeaders(p) {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (p.apiKey) h["Authorization"] = `Bearer ${p.apiKey}`;
    return { ...h, ...(p.headers || {}) };
  },
  buildChatBody(_p, req) {
    const messages: any[] = [];
    if (req.system) messages.push({ role: "system", content: req.system });
    messages.push({ role: "user", content: req.prompt });
    return {
      model: req.model,
      messages,
      stream: false,
      options: {
        temperature: req.temperature ?? 0.8,
        num_predict: req.maxTokens ?? 2048,
      },
    };
  },
  parseChatResponse(json) {
    const text = json?.message?.content ?? json?.response;
    if (typeof text !== "string") throw new Error("Respuesta Ollama sin mensaje.");
    return text;
  },
  parseModels(json) {
    const arr = Array.isArray(json?.models) ? json.models : [];
    return arr.map((m: any) => m.name || m.model).filter(Boolean);
  },
};

// ------------------------------------------------------------
// Custom: rutas totalmente configurables (estilo OpenAI por defecto)
// ------------------------------------------------------------
export const customAdapter: AIProviderAdapter = {
  label: "API personalizada",
  buildUrl(p, capability) {
    const style = p.apiStyle;
    if (capability === "models") {
      if (style && !style.models) throw new Error("Este proveedor no expone lista de modelos.");
      return joinUrl(withV1(p.baseUrl), "models");
    }
    if (style && !style.chat) throw new Error("Proveedor sin soporte de chat configurado.");
    return joinUrl(withV1(p.baseUrl), "chat/completions");
  },
  buildHeaders(p) {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (p.apiKey) h["Authorization"] = `Bearer ${p.apiKey}`;
    return { ...h, ...(p.headers || {}) };
  },
  buildChatBody(p, req) {
    return openaiAdapter.buildChatBody(p, req);
  },
  parseChatResponse(json) {
    return openaiAdapter.parseChatResponse(json);
  },
  parseModels(json) {
    return openaiAdapter.parseModels(json);
  },
};

// ------------------------------------------------------------
// Registry
// ------------------------------------------------------------
const adapters: Record<string, AIProviderAdapter> = {
  "openai-compatible": openaiAdapter,
  anthropic: anthropicAdapter,
  "google-gemini": geminiAdapter,
  ollama: ollamaAdapter,
  custom: customAdapter,
};

export function getAdapter(kind: string): AIProviderAdapter {
  return adapters[kind] || openaiAdapter;
}

export const PROVIDER_PRESETS: Array<{
  kind: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  needsKey: boolean;
  hint?: string;
}> = [
  { kind: "openai-compatible", name: "OpenAI", baseUrl: "https://api.openai.com", defaultModel: "gpt-4o-mini", needsKey: true },
  { kind: "openai-compatible", name: "Groq", baseUrl: "https://api.groq.com/openai", defaultModel: "llama-3.3-70b-versatile", needsKey: true },
  { kind: "openai-compatible", name: "Together AI", baseUrl: "https://api.together.xyz", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free", needsKey: true },
  { kind: "openai-compatible", name: "Fireworks", baseUrl: "https://api.fireworks.ai/inference", defaultModel: "accounts/fireworks/models/llama-v3p1-8b-instruct", needsKey: true },
  { kind: "openai-compatible", name: "DeepSeek", baseUrl: "https://api.deepseek.com", defaultModel: "deepseek-chat", needsKey: true },
  { kind: "openai-compatible", name: "Mistral", baseUrl: "https://api.mistral.ai", defaultModel: "mistral-small-latest", needsKey: true },
  { kind: "openai-compatible", name: "OpenRouter", baseUrl: "https://openrouter.ai/api", defaultModel: "meta-llama/llama-3.3-70b-instruct:free", needsKey: true },
  { kind: "openai-compatible", name: "LM Studio (local)", baseUrl: "http://localhost:1234/v1", defaultModel: "local-model", needsKey: false, hint: "Sirve tu modelo en LM Studio con servidor local activado." },
  { kind: "anthropic", name: "Anthropic (Claude)", baseUrl: "https://api.anthropic.com", defaultModel: "claude-sonnet-4-20250514", needsKey: true },
  { kind: "google-gemini", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com", defaultModel: "gemini-2.0-flash", needsKey: true },
  { kind: "ollama", name: "Ollama (local)", baseUrl: "http://localhost:11434", defaultModel: "llama3.2", needsKey: false, hint: "Necesitas Ollama corriendo en local (ollama serve)." },
  { kind: "custom", name: "API personalizada", baseUrl: "", defaultModel: "", needsKey: false, hint: "Cualquier endpoint estilo OpenAI (/v1/chat/completions). Configura headers extra si es necesario." },
];
