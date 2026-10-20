// ============================================================
// Tipos del generador de cartas visuales profesionales
// ============================================================

export type CardCategory =
  | "tarot"
  | "coleccionable"
  | "cumpleanos"
  | "agradecimiento"
  | "invitacion"
  | "presentacion"
  | "producto"
  | "felicitacion"
  | "anuncio"
  | "menu"
  | "certificado"
  | "personalizada";

export type AspectRatio = "portrait" | "landscape" | "square";

export type LayoutType =
  | "clasico"
  | "moderno"
  | "minimalista"
  | "lujo"
  | "organico"
  | "tipografico";

export interface Palette {
  id: string;
  name: string;
  primary: string; // fondo principal
  secondary: string; // panel/acento suave
  accent: string; // color de acento (bordes, detalles)
  text: string; // texto principal
  subtle: string; // texto secundario
  dark?: boolean; // true si el fondo es oscuro
}

export interface DecorativeElement {
  kind: "frame" | "corner-ornament" | "divider" | "dots" | "lines" | "arc" | "none";
}

export interface VisualBlock {
  role: "title" | "subtitle" | "body" | "highlight" | "footer" | "tagline";
  text: string;
}

export interface CardDesign {
  id: string;
  title: string;
  category: CardCategory;
  aspect: AspectRatio;
  paletteId: string;
  layout: LayoutType;
  blocks: VisualBlock[];
  decoration: DecorativeElement;
  createdAt: number;
  /** origen: "ia" | "manual" | "plantilla" */
  source: string;
  /** prompt usado para generarla (si viene de IA) */
  prompt?: string;
  modelUsed?: string;
}

// ------------------------------------------------------------
// Proveedores de IA
// ------------------------------------------------------------

export type ProviderKind =
  | "openai-compatible"
  | "anthropic"
  | "google-gemini"
  | "ollama"
  | "custom";

export interface ApiStyle {
  chat: boolean; // estilo /v1/chat/completions
  embeddings: boolean; // estilo /v1/embeddings
  models: boolean; // estilo /v1/models (array .data)
}

export interface AIProvider {
  id: string;
  name: string;
  kind: ProviderKind;
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
  headers?: Record<string, string>;
  apiStyle?: ApiStyle;
  enabled: boolean;
  createdAt: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
}

export interface GenerateRequest {
  providerId: string;
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  signal?: AbortSignal;
}

export interface AIProviderAdapter {
  label: string;
  buildUrl(p: AIProvider, capability: "chat" | "models"): string;
  buildHeaders(p: AIProvider): Record<string, string>;
  buildChatBody(p: AIProvider, req: GenerateRequest): any;
  parseChatResponse(json: any): string;
  parseModels(json: any): string[];
}
