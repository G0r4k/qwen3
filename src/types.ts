// ==== MenúVivo - Tipos del dominio ====

export type EstablecimientoTipo = 'restaurante' | 'bar' | 'boliche' | 'cafeteria' | 'pub';

export type TemaId = 'organico' | 'neon' | 'clasico' | 'minimal' | 'brutalista' | 'glamour';

export interface Paleta {
  bg: string;          // fondo principal
  surface: string;     // superficie / tarjetas
  text: string;        // texto principal
  muted: string;       // texto secundario
  accent: string;      // acento principal (se sobreescribe con el color de IA)
  accent2: string;     // acento secundario
  fontDisplay: string; // tipografía para títulos
  fontBody: string;    // tipografía para cuerpo
}

export interface Tema {
  id: TemaId;
  nombre: string;
  descripcion: string;
  paleta: Paleta;
  efectos: {
    glass?: boolean;
    glow?: boolean;
    grain?: boolean;
    serifDisplay?: boolean;
    radius: number; // px
  };
}

export interface AcentoIA {
  tono: string;     // ej. "Terracota tostado"
  hex: string;      // color generado por la IA
  motivo: string;   // explicación breve
}

export interface Plato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: string;
  tags: string[];
  destacado: boolean;
  emoji: string;
  maridaje?: string;
  generadoPorIA: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  emoji: string;
  orden: number;
}

export interface ConfigEstablecimiento {
  nombre: string;
  tipo: EstablecimientoTipo;
  slogan: string;
  ciudad: string;
  vibe: string;             // palabras clave del estilo buscado
  presupuesto: 'economico' | 'medio' | 'premium';
  restricciones: string[];  // dietas contempladas
}

export interface MenuData {
  config: ConfigEstablecimiento;
  categorias: Categoria[];
  platos: Plato[];
  temaId: TemaId;
  acentosIA: AcentoIA[];
  notasChef: string;
  creado: number;
  actualizado: number;
}

export interface ProyectoResumen {
  id: string;
  data: MenuData;
}

export type Vista = 'home' | 'crear' | 'editor' | 'preview';
