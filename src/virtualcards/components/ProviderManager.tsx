// ============================================================
// ProviderManager: conectar, probar y gestionar cualquier API de IA.
// ============================================================

import { useState } from "react";
import { BrainCircuit, CheckCircle2, Loader2, Plus, RefreshCw, Trash2, X, XCircle } from "lucide-react";
import type { AIProvider, ModelInfo } from "../types";
import { useCardStore } from "../store";
import { PROVIDER_PRESETS, getAdapter } from "../providers/adapters";
import { listModels, testProvider } from "../providers/client";

interface Props {
  onClose: () => void;
}

export default function ProviderManager({ onClose }: Props) {
  const { providers, addProvider, removeProvider, toggleProvider, updateProvider } = useCardStore();
  const [presetIdx, setPresetIdx] = useState(0);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState(PROVIDER_PRESETS[0].baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState(PROVIDER_PRESETS[0].defaultModel);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [models, setModels] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const preset = PROVIDER_PRESETS[presetIdx];

  function selectPreset(i: number) {
    setPresetIdx(i);
    const p = PROVIDER_PRESETS[i];
    setName(p.name);
    setBaseUrl(p.baseUrl);
    setDefaultModel(p.defaultModel);
    setError(null);
  }

  function save() {
    if (!baseUrl.trim()) {
      setError("La URL base es obligatoria.");
      return;
    }
    if (!/^https?:\/\//i.test(baseUrl.trim())) {
      setError("La URL debe empezar por http:// o https://");
      return;
    }
    const provider: AIProvider = {
      id: crypto.randomUUID(),
      name: name.trim() || preset.name,
      kind: preset.kind as AIProvider["kind"],
      baseUrl: baseUrl.trim().replace(/\/+$/, ""),
      apiKey: apiKey.trim() || undefined,
      defaultModel: defaultModel.trim(),
      enabled: true,
      createdAt: Date.now(),
    };
    addProvider(provider);
    setName("");
    setApiKey("");
    setError(null);
  }

  async function runTest(p: AIProvider) {
    setBusyId(p.id);
    setResults((r) => ({ ...r, [p.id]: { ok: false, message: "Probando…" } }));
    const model = p.defaultModel || (models[p.id]?.[0] ?? "");
    const res = await testProvider(p, model || "default");
    setResults((r) => ({ ...r, [p.id]: res }));
    setBusyId(null);
  }

  async function refreshModels(p: AIProvider) {
    setBusyId(p.id);
    try {
      const ms = await listModels(p);
      setModels((m) => ({ ...m, [p.id]: ms }));
      if (ms.length && !p.defaultModel) {
        updateProvider(p.id, { defaultModel: ms[0] });
      }
    } catch (e: any) {
      setResults((r) => ({ ...r, [p.id]: { ok: false, message: e?.message || String(e) } }));
    }
    setBusyId(null);
  }

  const allModels: ModelInfo[] = providers.flatMap((p) =>
    (models[p.id] || (p.defaultModel ? [p.defaultModel] : [])).map((m) => ({
      id: m,
      name: m,
      providerId: p.id,
      providerName: p.name,
    }))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <BrainCircuit className="h-6 w-6 text-violet-400" /> Conectar APIs de IA
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          Soporta cualquier API compatible con OpenAI (OpenAI, Groq, Together, DeepSeek, Mistral, OpenRouter, LM Studio,
          vLLM…), Anthropic, Google Gemini, Ollama local y endpoints personalizados. Las claves se guardan solo en tu
          navegador (localStorage).
        </p>

        {/* Presets */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROVIDER_PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => selectPreset(i)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                presetIdx === i
                  ? "border-violet-500 bg-violet-500/15 text-violet-200"
                  : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500"
              }`}
            >
              <span className="block font-semibold">{p.name}</span>
              <span className="block truncate text-xs text-slate-500">{p.kind}</span>
            </button>
          ))}
        </div>

        {/* Formulario */}
        <div className="mb-4 space-y-3 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
          {preset.hint && <p className="text-xs text-amber-300/90">💡 {preset.hint}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-400">
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={preset.name}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
            </label>
            <label className="block text-xs text-slate-400">
              Modelo por defecto {preset.needsKey ? "" : "(opcional)"}
              <input value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} placeholder={preset.defaultModel}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
            </label>
          </div>
          <label className="block text-xs text-slate-400">
            URL base
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.ejemplo.com/v1"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
          </label>
          <label className="block text-xs text-slate-400">
            API Key {preset.needsKey ? "(requerida)" : "(opcional)"}
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={save} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
            <Plus className="h-4 w-4" /> Añadir proveedor
          </button>
        </div>

        {/* Lista de proveedores */}
        <div className="space-y-3">
          {providers.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
              Aún no hay proveedores conectados. Elige uno arriba y pulsa «Añadir proveedor».
            </p>
          )}
          {providers.map((p) => {
            const res = results[p.id];
            const pm = models[p.id];
            return (
              <div key={p.id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {p.name}{" "}
                      <span className="ml-1 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">
                        {getAdapter(p.kind).label}
                      </span>
                    </p>
                    <p className="truncate text-xs text-slate-400">{p.baseUrl}{p.apiKey ? " • clave configurada" : " • sin clave"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Activar/desactivar" onClick={() => toggleProvider(p.id)}
                      className={`rounded-lg px-2 py-1 text-xs font-medium ${p.enabled ? "bg-emerald-600/20 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                      {p.enabled ? "Activo" : "Inactivo"}
                    </button>
                    <button title="Probar conexión" disabled={busyId === p.id} onClick={() => runTest(p)}
                      className="flex items-center gap-1 rounded-lg bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600 disabled:opacity-50">
                      {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Probar
                    </button>
                    <button title="Listar modelos" disabled={busyId === p.id} onClick={() => refreshModels(p)}
                      className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600 disabled:opacity-50">
                      Modelos
                    </button>
                    <button title="Eliminar" onClick={() => removeProvider(p.id)}
                      className="rounded-lg bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-800/60">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {res && (
                  <p className={`mt-2 flex items-start gap-1.5 text-xs ${res.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {res.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    {res.message}
                  </p>
                )}
                {pm && pm.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pm.slice(0, 12).map((m) => (
                      <button key={m} onClick={() => updateProvider(p.id, { defaultModel: m })}
                        className={`rounded px-2 py-0.5 text-[11px] ${p.defaultModel === m ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                        {m}
                      </button>
                    ))}
                    {pm.length > 12 && <span className="text-[11px] text-slate-500">+{pm.length - 12} más</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allModels.length > 0 && (
          <p className="mt-4 text-xs text-slate-500">
            {allModels.length} modelo(s) disponibles para generar cartas desde los proveedores activos.
          </p>
        )}
      </div>
    </div>
  );
}
