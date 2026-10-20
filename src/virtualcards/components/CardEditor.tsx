// ============================================================
// CardEditor: ver una carta grande, editarla manualmente
// (textos, paleta, layout, decoración, formato) y exportarla.
// ============================================================

import { useEffect, useRef } from "react";
import { Download, FileImage, FolderUp, Layers, Pencil, Trash2 } from "lucide-react";
import type { AspectRatio, CardDesign, LayoutType } from "../types";
import { useCardStore } from "../store";
import { ASPECTS, LAYOUTS, PALETTES, paletteById } from "../cardPresets";
import { CardPreview } from "./CardPreview";
import { exportPDF, exportPNG, exportPPTX, exportSVG, registerCardSvg } from "../utils/exporters";

interface Props {
  card: CardDesign;
  onClose: () => void;
}

export default function CardEditor({ card, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const updateCard = useCardStore((s) => s.updateCard);
  const removeCard = useCardStore((s) => s.removeCard);
  const cards = useCardStore((s) => s.cards);

  useEffect(() => {
    registerCardSvg(card.id, svgRef.current);
  }, [card.id]);

  const pal = paletteById(card.paletteId);

  function setBlock(index: number, text: string) {
    const blocks = card.blocks.map((b, i) => (i === index ? { ...b, text } : b));
    updateCard(card.id, { blocks });
  }

  async function doExport(kind: "png" | "svg" | "pdf" | "pptx") {
    if (!svgRef.current) return;
    if (kind === "png") await exportPNG(svgRef.current, card, 2);
    if (kind === "svg") exportSVG(svgRef.current, card);
    if (kind === "pdf") await exportPDF(cards);
    if (kind === "pptx") await exportPPTX(cards, (id) => (id === card.id ? svgRef.current : null));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col gap-4 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vista previa */}
        <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-xl bg-slate-950/60 p-4">
          <div className="max-h-[70vh] w-full max-w-sm">
            <CardPreview ref={svgRef} card={card} />
          </div>
        </div>

        {/* Panel de edición */}
        <div className="w-full shrink-0 space-y-4 overflow-y-auto lg:w-80">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-white">
              <Pencil className="h-4 w-4 text-violet-400" /> Editar carta
            </h3>
            <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">Cerrar ✕</button>
          </div>

          <label className="block text-xs font-medium text-slate-400">
            Título
            <input
              value={card.title}
              onChange={(e) => updateCard(card.id, { title: e.target.value.slice(0, 40) })}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
            />
          </label>

          {/* Textos por bloque */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">Textos</p>
            {card.blocks.map((b, i) => (
              <div key={i}>
                <span className="text-[10px] uppercase tracking-wide text-slate-500">{b.role}</span>
                <textarea
                  value={b.text}
                  rows={b.role === "body" ? 3 : 1}
                  onChange={(e) => setBlock(i, e.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
            ))}
          </div>

          {/* Paleta */}
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">Paleta ({pal.name})</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  title={p.name}
                  onClick={() => updateCard(card.id, { paletteId: p.id })}
                  className={`h-8 rounded-md border-2 transition ${p.id === card.paletteId ? "border-violet-400 scale-105" : "border-transparent hover:border-slate-500"}`}
                  style={{ background: `linear-gradient(135deg, ${p.primary} 55%, ${p.accent})` }}
                />
              ))}
            </div>
          </div>

          {/* Layout */}
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">Estilo</p>
            <div className="flex flex-wrap gap-1.5">
              {LAYOUTS.map((l) => (
                <button key={l.id} onClick={() => updateCard(card.id, { layout: l.id as LayoutType })}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${l.id === card.layout ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Decoración */}
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">Decoración</p>
            <div className="flex flex-wrap gap-1.5">
              {(["frame", "corner-ornament", "divider", "dots", "lines", "arc", "none"] as const).map((d) => (
                <button key={d} onClick={() => updateCard(card.id, { decoration: { kind: d } })}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${d === card.decoration.kind ? "bg-fuchsia-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">Formato</p>
            <div className="flex gap-1.5">
              {ASPECTS.map((a) => (
                <button key={a.id} onClick={() => updateCard(card.id, { aspect: a.id as AspectRatio })}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${a.id === card.aspect ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {card.modelUsed && (
            <p className="text-[10px] text-slate-500">Generada por: {card.modelUsed}</p>
          )}

          {/* Exportar */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
            <button onClick={() => doExport("png")} className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600">
              <FileImage className="h-3.5 w-3.5" /> PNG @2x
            </button>
            <button onClick={() => doExport("svg")} className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600">
              <Download className="h-3.5 w-3.5" /> SVG
            </button>
            <button onClick={() => doExport("pdf")} className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600">
              <FolderUp className="h-3.5 w-3.5" /> PDF (todas)
            </button>
            <button onClick={() => doExport("pptx")} className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600">
              <Layers className="h-3.5 w-3.5" /> PPTX (todas)
            </button>
          </div>

          <button
            onClick={() => { removeCard(card.id); onClose(); }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-950/60 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/60"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar carta
          </button>
        </div>
      </div>
    </div>
  );
}
