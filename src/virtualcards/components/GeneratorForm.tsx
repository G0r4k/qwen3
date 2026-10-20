// ============================================================
// Generador: formulario de concepto + llamada a la IA elegida.
// Permite generar 1-N cartas en paralelo con cualquier proveedor.
// ============================================================

import { useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import type { AspectRatio, CardCategory, CardDesign } from "../types";
import { useCardStore } from "../store";
import { ASPECTS, CATEGORIES, buildSystemPrompt, buildUserPrompt } from "../cardPresets";
import { chatCompletion, extractJson } from "../providers/client";
import { normalizeCardResponse } from "../utils/normalize";

interface Props {
  onGenerated: (cards: CardDesign[]) => void;
}

const TONES = ["Místico", "Elegante", "Divertido", "Minimalista", "Épico", "Cálido", "Corporativo", "Vintage"];
const LANGUAGES = ["Español", "English", "Português", "Français", "Deutsch"];

export default function GeneratorForm({ onGenerated }: Props) {
  const { providers } = useCardStore();
  const enabled = useMemo(() => providers.filter((p) => p.enabled), [providers]);

  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState<CardCategory>("tarot");
  const [aspect, setAspect] = useState<AspectRatio>("portrait");
  const [tone, setTone] = useState<string>("");
  const [language, setLanguage] = useState("Español");
  const [count, setCount] = useState(3);
  const [providerId, setProviderId] = useState(enabled[0]?.id ?? "");
  const [model, setModel] = useState(enabled[0]?.defaultModel ?? "");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRaw, setLastRaw] = useState<string | null>(null);

  const provider = enabled.find((p) => p.id === providerId) ?? enabled[0];

  async function generate() {
    setError(null);
    setLastRaw(null);
    if (!concept.trim()) {
      setError("Describe el concepto de la carta.");
      return;
    }
    if (!provider) {
      setError("No hay proveedores de IA activos. Conecta uno primero en «APIs de IA».");
      return;
    }
    const extras: string[] = [];
    if (tone) extras.push(`tono ${tone.toLowerCase()}`);
    extras.push(`redacta todo el texto en idioma ${language}`);

    const system = buildSystemPrompt(category);
    const user = buildUserPrompt(concept, extras);

    setBusy(true);
    setProgress({ done: 0, total: count });
    const results: CardDesign[] = [];
    let firstError: string | null = null;
    let rawSample: string | null = null as string | null;

    await Promise.all(
      Array.from({ length: count }).map(async (_, i) => {
        try {
          // temperatura variada para que las N cartas sean distintas
          const temp = 0.6 + (i * 0.4) % 0.7;
          const text = await chatCompletion(provider, {
            providerId: provider.id,
            model: model || provider.defaultModel,
            prompt: user,
            system,
            temperature: temp,
            maxTokens: 1024,
          });
          rawSample = rawSample ?? text;
          const json = extractJson(text);
          results.push(
            normalizeCardResponse(json, {
              category,
              aspect,
              prompt: `${concept}${tone ? ` (${tone})` : ""}`,
              modelUsed: `${provider.name}/${model || provider.defaultModel}`,
            })
          );
        } catch (e: any) {
          firstError = firstError || e?.message || String(e);
        }
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      })
    );

    setBusy(false);
    setProgress(null);
    if (results.length > 0) {
      onGenerated(results);
      if (firstError) setError(`Se generaron ${results.length} de ${count} cartas. Problema parcial: ${firstError}`);
    } else {
      setLastRaw(rawSample ? rawSample.slice(0, 500) : null);
      setError(firstError || "La IA no devolvió un diseño válido. Prueba con otro modelo o simplifica el concepto.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Proveedor / modelo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-400">
          Proveedor de IA
          <select
            value={provider?.id ?? ""}
            onChange={(e) => {
              setProviderId(e.target.value);
              const p = enabled.find((x) => x.id === e.target.value);
              setModel(p?.defaultModel ?? "");
            }}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
          >
            {enabled.length === 0 && <option value="">— sin proveedores conectados —</option>}
            {enabled.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.kind})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-400">
          Modelo
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={provider?.defaultModel || "nombre-del-modelo"}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
          />
        </label>
      </div>

      {/* Concepto */}
      <label className="block text-xs font-medium text-slate-400">
        Concepto de la carta
        <textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          rows={3}
          placeholder='Ej.: "La Luna" — carta de tarot sobre intuición y sueños, con símbolo de cangrejo emergiendo del agua…'
          className="mt-1 w-full resize-none rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
        />
      </label>

      {/* Categoría */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-400">Tipo de carta</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              title={c.description}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                category === c.id
                  ? "border-violet-500 bg-violet-600/25 text-violet-200"
                  : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formato / tono / idioma / cantidad */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="block text-xs font-medium text-slate-400">
          Formato
          <select value={aspect} onChange={(e) => setAspect(e.target.value as AspectRatio)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500">
            {ASPECTS.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-400">
          Tono
          <select value={tone} onChange={(e) => setTone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500">
            <option value="">Libre (lo elige la IA)</option>
            {TONES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-400">
          Idioma
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500">
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-400">
          Cantidad
          <input type="number" min={1} max={6} value={count}
            onChange={(e) => setCount(Math.min(6, Math.max(1, parseInt(e.target.value) || 1)))}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-xs text-red-300">
          ⚠️ {error}
          {lastRaw && (
            <details className="mt-1">
              <summary className="cursor-pointer text-red-400/80">Ver respuesta cruda del modelo</summary>
              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-red-200/70">{lastRaw}</pre>
            </details>
          )}
        </div>
      )}

      <button
        onClick={generate}
        disabled={busy || !provider}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando… {progress ? `${progress.done}/${progress.total}` : ""}
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" /> Generar {count} carta{count > 1 ? "s" : ""} con IA
          </>
        )}
      </button>

      {!provider && (
        <p className="flex items-center justify-center gap-1 text-center text-xs text-amber-400">
          <Sparkles className="h-3.5 w-3.5" /> Conecta al menos una API de IA para empezar.
        </p>
      )}
    </div>
  );
}
