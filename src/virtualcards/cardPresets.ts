// ============================================================
// Paletas, categorías y prompts para el generador de cartas.
// La IA ELIGE entre estas paletas registradas; el renderer
// sólo conoce estos ids (a prueba de colores inventados).
// ============================================================

import type { CardCategory, LayoutType, Palette } from "./types";

export const PALETTES: Palette[] = [
  { id: "midnight-gold", name: "Medianoche & Oro", primary: "#0e1123", secondary: "#1b2140", accent: "#d4af37", text: "#f5f1e4", subtle: "#9aa3c7", dark: true },
  { id: "celestial", name: "Celestial", primary: "#141a3a", secondary: "#232c5c", accent: "#8ea6ff", text: "#eef1ff", subtle: "#a9b4dd", dark: true },
  { id: "mystic-violet", name: "Violeta Místico", primary: "#221033", secondary: "#3a1d55", accent: "#c084fc", text: "#f3e9ff", subtle: "#b79ad4", dark: true },
  { id: "crimson-noir", name: "Carmesí Noir", primary: "#1a0a0e", secondary: "#3d1220", accent: "#e0596a", text: "#ffeef0", subtle: "#c79aa2", dark: true },
  { id: "emerald-lux", name: "Esmeralda Lujo", primary: "#062a24", secondary: "#0c4a3e", accent: "#34d399", text: "#eafff7", subtle: "#8fc7bb", dark: true },
  { id: "ocean-deep", name: "Océano Profundo", primary: "#07203a", secondary: "#0e3a5f", accent: "#38bdf8", text: "#eaf7ff", subtle: "#8ab6d4", dark: true },
  { id: "sunset-rose", name: "Atardecer Rosado", primary: "#fdf1f4", secondary: "#fadce3", accent: "#d96c8c", text: "#4a1f2f", subtle: "#a06b7c" },
  { id: "forest-sage", name: "Salvia del Bosque", primary: "#f2f5ee", secondary: "#dde7d2", accent: "#5a7d4f", text: "#26331f", subtle: "#6f7d63" },
  { id: "warm-paper", name: "Papel Cálido", primary: "#faf6ee", secondary: "#efe6d3", accent: "#b08d57", text: "#3b3226", subtle: "#8a7a61" },
  { id: "coral-energy", name: "Coral Energético", primary: "#fff4ef", secondary: "#ffdcc9", accent: "#f4623a", text: "#42201a", subtle: "#9c6a5b" },
  { id: "royal-purple", name: "Púrpura Real", primary: "#f5f0fa", secondary: "#e5d7f0", accent: "#7c3aed", text: "#2e1a47", subtle: "#7a6893" },
  { id: "mono-chic", name: "Mono Chic", primary: "#111214", secondary: "#232529", accent: "#e8e6e1", text: "#f7f6f3", subtle: "#8d8f94", dark: true },
  { id: "sky-dream", name: "Sueño Celeste", primary: "#eef6fb", secondary: "#d6eaf5", accent: "#3d8fb5", text: "#1d3b4c", subtle: "#6a8b9c" },
  { id: "honey-amber", name: "Ámbar Miel", primary: "#fff8e7", secondary: "#fceabb", accent: "#c98a12", text: "#4a3808", subtle: "#94804d" },
  { id: "neon-cyber", name: "Neón Ciber", primary: "#0a0a14", secondary: "#161628", accent: "#22d3ee", text: "#e8feff", subtle: "#7fd4de", dark: true },
  { id: "terracotta", name: "Terracota", primary: "#fbeee6", secondary: "#f2d5c4", accent: "#b45f3f", text: "#43241a", subtle: "#956752" },
];

export function paletteById(id: string): Palette {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}

export interface CategoryInfo {
  id: CardCategory;
  label: string;
  emoji: string;
  description: string;
  guidance: string; // se inyecta en el system prompt
}

export const CATEGORIES: CategoryInfo[] = [
  { id: "tarot", label: "Tarot / Oráculo", emoji: "🔮", description: "Cartas de tarot y oráculos con simbolismo místico.", guidance: "Diseña una carta de tarot/oráculo: título evocador en mayúsculas, un símbolo o arquetipo central descrito como highlight breve, mensaje interpretativo conciso (2-3 líneas) y footer con numeración o palo." },
  { id: "coleccionable", label: "Coleccionable (TCG)", emoji: "🃏", description: "Cartas coleccionables estilo juego de mesa/TGC.", guidance: "Diseña una carta coleccionable: nombre épico, tipo/clase como subtitle, habilidad destacada como highlight, descripción de efecto en body (máx 3 líneas), valores (ataque/defensa) como tagline corta y footer con rareza/número." },
  { id: "cumpleanos", label: "Cumpleaños", emoji: "🎂", description: "Felicitaciones de cumpleaños festivas.", guidance: "Diseña una tarjeta de cumpleaños alegre: saludo personalizado como title, edad o motivo como subtitle, mensaje cálido y divertido en body, detalle destacado como highlight y footer con firma." },
  { id: "agradecimiento", label: "Agradecimiento", emoji: "💐", description: "Notas de gracias elegantes.", guidance: "Diseña una tarjeta de agradecimiento elegante: 'Gracias' o similar como title, motivo como subtitle, mensaje sincero breve en body y footer con remitente." },
  { id: "invitacion", label: "Invitación", emoji: "💌", description: "Invitaciones a eventos con datos claros.", guidance: "Diseña una invitación: evento como title, fecha/lugar como subtitle, detalles clave en body (máx 3 líneas), highlight con hora o dress code, footer con RSVP." },
  { id: "presentacion", label: "Presentación / Negocio", emoji: "💼", description: "Mini tarjetas de presentación o propuesta.", guidance: "Diseña una carta de presentación profesional: nombre/empresa como title, cargo como subtitle, propuesta de valor en body (máx 3 líneas), highlight con logro o dato clave, footer con contacto." },
  { id: "producto", label: "Producto", emoji: "🛍️", description: "Fichas visuales de producto.", guidance: "Diseña una ficha de producto: nombre del producto como title, categoría como subtitle, beneficios en body (máx 3 líneas cortas), precio u oferta como highlight, footer con marca." },
  { id: "felicitacion", label: "Felicitación", emoji: "🎉", description: "Logros, éxitos y celebraciones.", guidance: "Diseña una felicitación por un logro: enhorabuena como title, ocasión como subtitle, mensaje motivador en body y footer con firma." },
  { id: "anuncio", label: "Anuncio", emoji: "📣", description: "Lanzamientos y avisos con gancho.", guidance: "Diseña un anuncio: gancho impactante como title, subtítulo explicativo, detalles en body (máx 3 líneas), llamada a la acción como highlight, footer con web/contacto." },
  { id: "menu", label: "Menú / Receta", emoji: "🍽️", description: "Cartas de platos o recetas.", guidance: "Diseña una carta de menú/receta: plato como title, tipo o región como subtitle, ingredientes o descripción gastronómica en body (máx 3 líneas), maridaje o dato chef como highlight, footer con restaurante." },
  { id: "certificado", label: "Certificado", emoji: "🏅", description: "Reconocimientos y diplomas visuales.", guidance: "Diseña un certificado visual: 'Certificado' como title, mérito como subtitle, texto formal en body, destinatario como highlight, footer con emisor y fecha." },
  { id: "personalizada", label: "Personalizada", emoji: "✨", description: "Cualquier otro concepto creativo.", guidance: "Diseña una carta visual libremente creativa adaptada al concepto solicitado, con jerarquía tipográfica clara." },
];

export const LAYOUTS: Array<{ id: LayoutType; label: string }> = [
  { id: "clasico", label: "Clásico" },
  { id: "moderno", label: "Moderno" },
  { id: "minimalista", label: "Minimalista" },
  { id: "lujo", label: "Lujo" },
  { id: "organico", label: "Orgánico" },
  { id: "tipografico", label: "Tipográfico" },
];

export const ASPECTS = [
  { id: "portrait", label: "Vertical", w: 640, h: 896 },
  { id: "landscape", label: "Horizontal", w: 896, h: 640 },
  { id: "square", label: "Cuadrada", w: 768, h: 768 },
] as const;

export function categoryInfo(id: CardCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

// ------------------------------------------------------------
// Prompts
// ------------------------------------------------------------

export function buildSystemPrompt(category: CardCategory): string {
  const cat = categoryInfo(category);
  const paletteLines = PALETTES.map(
    (p) => `- ${p.id}: ${p.name}${p.dark ? " (oscuro)" : " (claro)"}`
  ).join("\n");
  return `Eres un diseñador gráfico senior especializado en cartas visuales profesionales.
CATEGORÍA: ${cat.label}. ${cat.guidance}

Debes responder SOLO con un objeto JSON válido (sin markdown, sin comentarios), con esta estructura EXACTA:
{
  "title": "título principal corto (máx 40 caracteres)",
  "paletteId": "un id de la lista de paletas",
  "layout": "clasico|moderno|minimalista|lujo|organico|tipografico",
  "decoration": "frame|corner-ornament|divider|dots|lines|arc|none",
  "blocks": [
    {"role":"subtitle","text":"..."},
    {"role":"body","text":"..."},
    {"role":"highlight","text":"..."},
    {"role":"footer","text":"..."}
  ]
}

REGLAS:
- "blocks" debe tener entre 2 y 5 bloques. Roles permitidos: subtitle, body, highlight, footer, tagline.
- body: máximo 220 caracteres. highlight: máximo 60. footer: máximo 50. subtitle: máximo 80.
- Escribe el contenido en el idioma del prompt del usuario.
- paletteId DEBE ser uno exactamente de esta lista:\n${paletteLines}
- Nada de texto legal, ni notas del modelo, solo el JSON.`;
}

export function buildUserPrompt(concept: string, extras: string[]): string {
  const parts = [`Concepto de la carta: "${concept.trim()}"`];
  if (extras.length) parts.push(`Detalles solicitados: ${extras.join("; ")}`);
  parts.push("Genera ahora el JSON de la carta.");
  return parts.join("\n");
}
