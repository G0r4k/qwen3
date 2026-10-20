// ============================================================
// Validación/normalización de la respuesta de la IA a CardDesign.
// Tolera errores de modelos pequeños: ids de paleta inventados,
// layouts desconocidos, bloques faltantes, textos largos, etc.
// ============================================================

import type { CardCategory, CardDesign, VisualBlock } from "../types";
import { PALETTES, paletteById } from "../cardPresets";

const LAYOUT_IDS = ["clasico", "moderno", "minimalista", "lujo", "organico", "tipografico"];
const DECO_IDS = ["frame", "corner-ornament", "divider", "dots", "lines", "arc", "none"];
const BLOCK_ROLES = ["title", "subtitle", "body", "highlight", "footer", "tagline"];

const LIMITS: Record<string, number> = {
  subtitle: 90,
  body: 240,
  highlight: 70,
  footer: 60,
  tagline: 60,
};

function clamp(text: string, max: number): string {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Intenta casar un paletteId inventado con uno real (por nombre/color aproximado) */
function matchPalette(raw: unknown): string {
  const s = String(raw || "").toLowerCase().trim();
  // coincidencia exacta
  if (PALETTES.some((p) => p.id === s)) return s;
  // coincidencia parcial por id o nombre
  const byName = PALETTES.find((p) => p.name.toLowerCase().includes(s) || s.includes(p.id));
  if (byName) return byName.id;
  // ¿devolvió un color hex? mapear al más cercano
  const hex = s.match(/#?([0-9a-f]{6})/);
  if (hex) {
    const r = parseInt(hex[1].slice(0, 2), 16);
    const g = parseInt(hex[1].slice(2, 4), 16);
    const b = parseInt(hex[1].slice(4, 6), 16);
    let best = PALETTES[0];
    let bestDist = Infinity;
    for (const p of PALETTES) {
      const pr = parseInt(p.primary.slice(1, 3), 16);
      const pg = parseInt(p.primary.slice(3, 5), 16);
      const pb = parseInt(p.primary.slice(5, 7), 16);
      const d = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return best.id;
  }
  return PALETTES[Math.floor(Math.random() * PALETTES.length)].id;
}

export function normalizeCardResponse(
  json: any,
  opts: { category: CardCategory; aspect: CardDesign["aspect"]; prompt: string; modelUsed: string }
): CardDesign {
  const pal = paletteById(matchPalette(json?.paletteId ?? json?.palette ?? json?.colors));

  const layout = LAYOUT_IDS.includes(String(json?.layout)) ? json.layout : "clasico";
  const decoKind = DECO_IDS.includes(String(json?.decoration?.kind ?? json?.decoration))
    ? (json?.decoration?.kind ?? json?.decoration)
    : "frame";

  let title = clamp(json?.title || json?.name || "Carta sin título", 40);

  const rawBlocks = Array.isArray(json?.blocks) ? json.blocks : [];
  const blocks: VisualBlock[] = [];
  for (const b of rawBlocks) {
    const role = BLOCK_ROLES.includes(String(b?.role)) ? b.role : "body";
    const text = clamp(b?.text || "", LIMITS[role] || 120);
    if (!text) continue;
    // evitar duplicar el título como bloque
    if (role !== "title" && text.toLowerCase() === title.toLowerCase()) continue;
    blocks.push({ role, text });
  }

  // Si no vino ningún block, generar fallback razonable desde campos sueltos
  if (blocks.length === 0) {
    if (json?.subtitle) blocks.push({ role: "subtitle", text: clamp(json.subtitle, 90) });
    if (json?.body || json?.description) blocks.push({ role: "body", text: clamp(json.body || json.description, 240) });
    if (json?.highlight) blocks.push({ role: "highlight", text: clamp(json.highlight, 70) });
    if (json?.footer) blocks.push({ role: "footer", text: clamp(json.footer, 60) });
  }

  // asegurar al menos un body
  if (!blocks.some((b) => b.role === "body") && blocks.length === 0) {
    blocks.push({ role: "body", text: "Una carta generada automáticamente." });
  }

  return {
    id: crypto.randomUUID(),
    title,
    category: opts.category,
    aspect: opts.aspect,
    paletteId: pal.id,
    layout,
    blocks,
    decoration: { kind: decoKind },
    createdAt: Date.now(),
    source: "ia",
    prompt: opts.prompt,
    modelUsed: opts.modelUsed,
  };
}
