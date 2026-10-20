// ============================================================
// App principal del generador de cartas visuales con IA.
// ============================================================

import { useMemo, useState } from "react";
import { BrainCircuit, GalleryVerticalEnd, Image as ImageIcon, Plus, Sparkles, Trash2 } from "lucide-react";
import type { CardDesign } from "./types";
import { useCardStore } from "./store";
import { CATEGORIES, categoryInfo } from "./cardPresets";
import GeneratorForm from "./components/GeneratorForm";
import ProviderManager from "./components/ProviderManager";
import CardEditor from "./components/CardEditor";
import { CardPreview } from "./components/CardPreview";
import { registerCardSvg } from "./utils/exporters";
import { useEffect, useRef } from "react";

function Thumb({ card, onOpen }: { card: CardDesign; onOpen: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    registerCardSvg(card.id, ref.current);
  }, [card.id]);
  const cat = categoryInfo(card.category);
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition hover:border-violet-500/60 hover:bg-slate-900"
    >
      <div className="h-44 w-full overflow-hidden rounded-lg">
        <div className="mx-auto h-full" style={{ aspectRatio: "1" }}>
          <CardPreview ref={ref} card={card} className="h-full w-full object-contain" />
        </div>
      </div>
      <div className="w-full">
        <p className="truncate text-sm font-semibold text-white">{cat.emoji} {card.title}</p>
        <p className="text-[10px] text-slate-500">
          {card.modelUsed || card.source} · {new Date(card.createdAt).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}

export default function VirtualCardsApp() {
  const cards = useCardStore((s) => s.cards);
  const addCards = useCardStore((s) => s.addCards);
  const removeCard = useCardStore((s) => s.removeCard);
  const providers = useCardStore((s) => s.providers);

  const [showProviders, setShowProviders] = useState(false);
  const [editing, setEditing] = useState<CardDesign | null>(null);
  const [filter, setFilter] = useState<string>("todas");

  const filtered = useMemo(
    () => (filter === "todas" ? cards : cards.filter((c) => c.category === filter)),
    [cards, filter]
  );

  // mantener `editing` sincronizado con el store al editar en vivo
  const liveEditing = editing ? cards.find((c) => c.id === editing.id) ?? null : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-400" />
            <div>
              <h1 className="text-lg font-black tracking-tight">CartasIA Studio</h1>
              <p className="text-[11px] text-slate-400">Cartas visuales profesionales potenciadas por IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:block">
              {providers.length} API{providers.length !== 1 ? "s" : ""} conectada{providers.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowProviders(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-violet-500"
            >
              <BrainCircuit className="h-4 w-4 text-violet-400" /> APIs de IA
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[380px_1fr]">
        {/* Panel izquierdo: generador */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-300">
            <Plus className="h-4 w-4" /> Crear cartas
          </h2>
          <GeneratorForm onGenerated={(cs) => addCards(cs)} />
        </section>

        {/* Panel derecho: galería */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
              <GalleryVerticalEnd className="h-4 w-4" /> Galería ({cards.length})
            </h2>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilter("todas")}
                className={`rounded-full px-2.5 py-1 text-[11px] ${filter === "todas" ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                Todas
              </button>
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setFilter(c.id)}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${filter === c.id ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                  {c.emoji}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-800 py-20 text-center">
              <ImageIcon className="h-10 w-10 text-slate-700" />
              <p className="max-w-xs text-sm text-slate-500">
                Aún no hay cartas. Conecta una API de IA y describe un concepto para generar tu primera carta visual.
              </p>
              <button onClick={() => setShowProviders(true)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500">
                Conectar mi primera API
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((c) => (
                <div key={c.id} className="relative">
                  <Thumb card={c} onOpen={() => setEditing(c)} />
                  <button
                    title="Eliminar"
                    onClick={() => removeCard(c.id)}
                    className="absolute right-4 top-1 rounded-md bg-slate-800/80 p-1 text-slate-500 opacity-0 transition hover:bg-red-900/70 hover:text-red-300 group-hover:opacity-100 [.group:hover_&]:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showProviders && <ProviderManager onClose={() => setShowProviders(false)} />}
      {liveEditing && <CardEditor card={liveEditing} onClose={() => setEditing(null)} />}
    </div>
  );
}
