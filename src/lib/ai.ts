// ==== Motor de IA de MenúVivo ====
// Estrategia "Bring Your Own AI": si el usuario configura una API key (OpenAI, Groq o
// cualquier endpoint compatible con /chat/completions), se usa el modelo real.
// Si no hay clave, un motor generativo local (gramáticas culinarias + hashing
// determinístico sobre el brief) produce resultados coherentes y estéticos.

import type {
  AcentoIA, Categoria, ConfigEstablecimiento, EstablecimientoTipo, Plato, TemaId,
} from '../types';

export interface AISettings {
  apiKey: string;
  baseUrl: string; // ej https://api.openai.com/v1 | https://api.groq.com/openai/v1
  model: string;   // ej gpt-4o-mini | llama-3.3-70b-versatile
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- utilidades determinísticas ----------
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Rng {
  private r: () => number;
  constructor(seedText: string) { this.r = mulberry32(hashStr(seedText)); }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.r() * arr.length)]; }
  int(min: number, max: number): number { return min + Math.floor(this.r() * (max - min + 1)); }
  chance(p: number): boolean { return this.r() < p; }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// ---------- color helpers ----------
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ---------- bancos de contenido culinario ----------
type Cocina = 'italiana' | 'mediterranea' | 'asiatica' | 'carne' | 'mar' | 'vegetal' | 'parrilla' | 'fusion';

const COCINAS: Cocina[] = ['italiana', 'mediterranea', 'asiatica', 'carne', 'mar', 'vegetal', 'parrilla', 'fusion'];

function inferirCocinas(cfg: ConfigEstablecimiento, rng: Rng): Cocina[] {
  const v = cfg.vibe.toLowerCase();
  const set = new Set<Cocina>();
  if (/italia|pasta|pizza|risotto|toscan/.test(v)) { set.add('italiana'); set.add('mediterranea'); }
  if (/mediterr|griega|espa|tapas|levanti/.test(v)) set.add('mediterranea');
  if (/asia|japones|sushi|ramen|tailand|kore|woka/.test(v)) set.add('asiatica');
  if (/parrill|asado|brasa|steak|hamburg/.test(v)) set.add('parrilla');
  if (/marisc|pesca|surf|río|rio|cevich|atún|atun|salmón|salmon/.test(v)) set.add('mar');
  if (/vegg|vegana|veget|plant|huerta|orgán|organ/.test(v)) set.add('vegetal');
  if (/carn/.test(v)) set.add('carne');
  if (/fus|de autor|moderna|nuevo/.test(v)) set.add('fusion');
  while (set.size < 2) set.add(rng.pick(COCINAS));
  return [...set];
}

const ADJ = ['ahumado', 'confitado', 'curado', 'laqueado', 'sellado', 'en escabeche', 'a la brasa', 'al horno de barro', 'fermentado', 'acaramelado', 'ahumado en madera', 'a la sal', 'bajo cocción', 'al wok', 'crudo', 'tatemado', 'deshidratado', 'en crosta', 'al vacío', 'carbonizado'];
const COMP = 'puré rústico, crema de estación, emulsión de hierbas, reducción de vinos, chutney de la casa, aliño de semillas, polvo de vegetales, gelée cítrica, mayonesa de humo, coulis de frutos rojos, escuma de parmesano, aceite de ajo negro, chips de raíz, brotes de temporada, manteca de hierbas, vinagreta tibia, caldo concentrado, papas confitas, gratinado fino, ensalada ácida';
const FIN = 'cracker de masa madre, aceite de ají molido, semillas tostadas, láminas de queso curado, polvo de aceituna, brotes micro, reducción balsámica, ralladura de limón, pimienta de timut, flor de sal, pimentón ahumado, avellanas crocantes, hierbas frescas, crema agria curada, gremolata, chimichurri seco, tuiles de parmesano';

function platoNombre(rng: Rng, cocina: Cocina, tipo: EstablecimientoTipo): { nombre: string; desc: string; emoji: string } {
  const adj = rng.pick(ADJ);
  const fem = (x: string) => x.replace(/o$/, 'a'); // concordancia aproximada para proteínas femeninas
  const comp = rng.pick(COMP.split(', '));
  const fin = rng.pick(FIN.split(', '));
  const plant = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

  const carnes = ['lomo','ojo de bife','vacío','cordero','cerdo ibérico','pulled pork','pollo de campo','pato','mollejas','chorizo criollo'];
  const mares = ['trucha','lubina','langostinos','pulpo','mejillones','ravioles de mar','atún','vieiras','calamar','ceviche'];
  const vege = ['remolacha','berenjena','coliflor','zapallo','hinojo','borraja','portobellos','chauchas','papa helada','batata asada','cardos','morrón'];
  const pastas = ['tagliatelle','raviolones','gnocchi','pappardelle','tortelli','cappelletti','pici','linguine'];

  const roll = rng.int(0, 9);
  let nombre = '', desc = '', emoji = '🍽️';

  if (cocina === 'parrilla' || ((cocina === 'carne') && roll < 6)) {
    const c = rng.pick(carnes.filter(Boolean));
    nombre = plant(`${c} ${rng.pick(['a la brasa','al punto','ahumadoa','en cocción lenta','tatemadoa','a la parrilla'])}`);
    desc = `${plant(rng.pick(['corte madurado 30 días','corte seleccionado del día','pieza premium','corte de la casa']))} con ${comp}, ${fin}.`;
    emoji = '🥩';
  } else if (cocina === 'mar') {
    const m = rng.pick(mares);
    nombre = plant(`${m} ${fem(rng.pick(ADJ))}`);
    desc = `${plant(m)} sobre ${comp}, terminado con ${fin}.`;
    emoji = '🦐';
  } else if (cocina === 'vegetal') {
    const v = rng.pick(vege);
    nombre = plant(`${v} ${fem(rng.pick(ADJ))}`);
    desc = `${plant(v)} de huerta con ${comp} y ${fin}.`;
    emoji = '🥗';
  } else if (cocina === 'italiana') {
    if (roll < 5) {
      const p = rng.pick(pastas);
      nombre = plant(`${p} ${rng.pick(['de la abuela','al ragù lento','con mantequilla y salvia','del huerto','con crema de azafrán'])}`);
      desc = `Amasado en casa, servido con ${comp} y ${fin}.`;
    } else {
      nombre = plant(`Pizza ${rng.pick(['cuatro quesos','de masa madre 48h','nixromà','con burrata y tomates secos','al pesto de albahaca'])}`);
      desc = `Horno de leña, ${comp}, finalizada con ${fin}.`;
    }
    emoji = '🍝';
  } else if (cocina === 'asiatica') {
    const bases = ['Bao de pulled ', 'Ramen de miso ', 'Curry ', 'Gyozas ', 'Poké ', 'Udon saltado ', 'Dumplings '];
    const rellenos = ['cerdo laqueado', 'verduras wok', 'pollo jengibre', 'salmón', 'tofu ahumado', 'langostinos tinta'];
    nombre = plant(`${rng.pick(bases)}${rng.pick(rellenos)}`);
    desc = `Salsa de la casa con ${comp}, ${fin}.`;
    emoji = '🥟';
  } else if (cocina === 'mediterranea') {
    const platosM = ['Burrata ', 'Carpaccio de ', 'Pintxos de ', 'Tabla de ', 'Escabeche de ', 'Falafel '];
    const extras = ['tomates de la costa', 'betarraga ahumada', 'berenjena confitada', 'quesos curados', 'pulpo', 'garbanzos especiados'];
    nombre = plant(`${rng.pick(platosM)}${rng.pick(extras)}`);
    desc = `Aceite de oliva primer prensado, ${comp}, ${fin}.`;
    emoji = '🫒';
  } else { // fusion
    const proteina = rng.pick([...carnes.filter(Boolean), ...mares, ...vege]);
    nombre = plant(`${proteina} ${adj} · guiño ${rng.pick(['nippo','andino','árabe','criollo','nórdico','mediterráneo'])}`);
    desc = `${plant(comp)} como puente, coronado con ${fin}.`;
    emoji = '🥢';
  }

  if (tipo === 'cafeteria' && rng.chance(0.5)) {
    const cafe = ['Latte de vainilla tostada','Flat white de origen único','Espresso tónic','Cappuccino de pistacho','Cold brew 18hs','Mocha blanco','Affogato de dulce de leche'];
    nombre = rng.pick(cafe); desc = 'Granos de especialidad tostados a semana, extracción calibrada.'; emoji = '☕';
  }
  return { nombre, desc, emoji };
}

function postrePlato(rng: Rng): { nombre: string; desc: string; emoji: string } {
  const base = ['Chocolate 70%','Dulce de leche','Limón y albahaca','Frutas de estación','Caramelo quemado','Pistacho','Almendra y miel','Maracuyá'];
  const forma = ['texturas','torta húmeda','vaso frío','sinfonía','de la abuela','en teja','semifreddo','tercio'];
  const nombre = `${rng.pick(base)} ${rng.pick(forma)}`;
  const desc = `Helado artesanal de la casa, ${rng.pick(COMP.split(', '))} y ${rng.pick(FIN.split(', '))}.`;
  return { nombre, desc, emoji: '🍰' };
}

function coctelPlato(rng: Rng, tipo: EstablecimientoTipo): { nombre: string; desc: string; emoji: string } {
  const spirits = ['Gin','Ron añejo','Whisky ahumado','Vodka','Mezcal','Aperol','Campari','Cachaça','Pisco','Vermouth'];
  const notas = ['toronja y romero','lima kaffir y chile','pomelo rosa','lavanda y miel','jengibre fermentado','cereza negra','anís estrellado','bergamota','maracuyá asada','higo y nuez'];
  const nombre = `${rng.pick(spirits)} ${rng.pick(notas)} ${rng.pick(['sour','fizz','tonic','spritz','old fashioned','mule'])}`;
  const desc = tipo === 'boliche'
    ? `Servido en copa fría, ${rng.pick(['twist de cítricos','espuma aromática','hielo cristal','ramo de hieras'])}. Gradación media-alta.`
    : `Balance entre dulzor y amargor, ${rng.pick(['bruma cítrica','rodaja deshidratada','azúcar rubia en borde','sal de humo'])}.`;
  return { nombre, desc, emoji: '🍸' };
}

function cervezaPlato(rng: Rng): { nombre: string; desc: string; emoji: string } {
  const estilos = ['IPA de lúpulo cítrico','Stout imperial','Pale ale de la casa','Golden ale','Portera ahumada','Session IPA','Red lager','Weissbier'];
  const hops = ['Mosaic','Citra','Simcoe','Saaz','Hallertau','Cascade'];
  const nombre = `${rng.pick(estilos)}`;
  const desc = `Elaborada en ${rng.pick(['tanque propio','barrica de roble','pequeños lotes'])}, lúpulo ${rng.pick(hops)}. ${rng.int(4,9)}.${rng.int(0,9)}° ABV.`;
  return { nombre, desc, emoji: '🍺' };
}

// ---------- generación de menú ----------
export interface MenuGenerado {
  categorias: Categoria[];
  platos: Plato[];
  acentosIA: AcentoIA[];
  notasChef: string;
  temaSugerido: TemaId;
}

function sugerirTema(cfg: ConfigEstablecimiento, rng: Rng): TemaId {
  const v = cfg.vibe.toLowerCase();
  if (cfg.tipo === 'boliche') return /lounge|premium|champagne|vip/.test(v) ? 'glamour' : 'neon';
  if (cfg.tipo === 'bar' || cfg.tipo === 'pub') return /industrial|cerve|street|rock/.test(v) ? 'brutalista' : (/coctel|autor|lounge/.test(v) ? 'glamour' : 'neon');
  if (cfg.tipo === 'cafeteria') return /minimal|nordic|especialty/.test(v) ? 'minimal' : 'organico';
  // restaurante
  if (/clásic|classic|bistró|bistro|cantina|parrill|tradicion/.test(v)) return 'clasico';
  if (/modern|minimal|nordic|clean/.test(v)) return 'minimal';
  if (/autor|organic|huerta|campo|cálido|calido/.test(v)) return 'organico';
  return rng.pick(['organico', 'clasico', 'minimal'] as TemaId[]);
}

function generarAcentos(cfg: ConfigEstablecimiento, rng: Rng): AcentoIA[] {
  const familias: { tono: string; h: number; motivo: string }[] = [
    { tono: 'Terracota tostada', h: 16, motivo: 'evoca horno de barro, cerámica y cocina lenta' },
    { tono: 'Verde albahaca', h: 130, motivo: 'frescura de huerta y hierbas cortadas al momento' },
    { tono: 'Ámbar de barrica', h: 38, motivo: 'whisky, caramelo y maderas nobles' },
    { tono: 'Magenta eléctrica', h: 315, motivo: 'luz de neón, noche y pista de baile' },
    { tono: 'Cian láser', h: 190, motivo: 'hielo seco, cócteles futuristas y contraste nocturno' },
    { tono: 'Oro champagne', h: 46, motivo: 'brindis, celebración y lujo contenido' },
    { tono: 'Rojo vino profundo', h: 350, motivo: 'decanters, salsas reducidas y sobremesa larga' },
    { tono: 'Azul eléctrico', h: 235, motivo: 'juventud, música electrónica y madrugada' },
    { tono: 'Verde oliva curado', h: 80, motivo: 'aceite nuevo, tierra y mercado de productores' },
  ];
  const dark = cfg.tipo === 'boliche' || cfg.tipo === 'bar' || /noche|neon|neón|electr/.test(cfg.vibe);
  const pool = dark ? familias.filter(f => [315,190,46,350,235].includes(f.h)) : familias.filter(f => ![315,190,235].includes(f.h));
  const elegidas = rng.shuffle(pool.length >= 3 ? pool : familias).slice(0, 3);
  return elegidas.map((f, i) => ({
    tono: f.tono,
    hex: hslToHex(f.h + rng.int(-8, 8), i === 0 ? 0.68 : 0.55, i === 0 ? 0.46 : 0.55),
    motivo: f.motivo,
  }));
}

function rangoPrecio(presupuesto: ConfigEstablecimiento['presupuesto'], categoria: string): [number, number] {
  const base: Record<string, [number, number]> = {
    entradas: [1800, 5200], principales: [4200, 12500], pastas: [4500, 11000],
    parrilla: [6500, 18000], postres: [2200, 4800], cafetería: [1800, 4200],
    coctelería: [4200, 9500], cervecería: [2200, 5200], 'sin alcohol': [1800, 4200], crudo: [5200, 12000],
  };
  let [lo, hi] = base[categoria] ?? [3000, 9000];
  if (presupuesto === 'economico') { lo *= 0.6; hi *= 0.7; }
  if (presupuesto === 'premium') { lo *= 1.5; hi *= 1.8; }
  return [Math.round(lo / 100) * 100, Math.round(hi / 100) * 100];
}

const MARIDAJES = ['Malbec de Gualtallary, altura y fruta negra','Garnacha fresca con hielo','Sidra seca de manzana verde','Chardonnay sin barrica, cítrico','IPA jugosa de la casa','Negroni clásico como digestivo','Vermouth casero con naranja quemada','Tannat joven para la grasa','Pinot Noir de clima frío','Spritz de aperitivo al atardecer','Agua con gas y limón quemado','Cerveza negra para el postre'];

export function generarMenuLocal(cfg: ConfigEstablecimiento): MenuGenerado {
  const rng = new Rng(JSON.stringify(cfg) + '|menuvivo-v1');
  const cocinas = inferirCocinas(cfg, rng);
  const esBoliche = cfg.tipo === 'boliche';
  const esBar = cfg.tipo === 'bar' || cfg.tipo === 'pub';
  const esCafe = cfg.tipo === 'cafeteria';

  const categorias: Categoria[] = [];
  const pushCat = (id: string, nombre: string, emoji: string, desc: string) =>
    categorias.push({ id, nombre, emoji, descripcion: desc, orden: categorias.length });

  if (esCafe) {
    pushCat('cafeteria', 'Café & Espresso', '☕', 'Origen único, tueste propio');
    pushCat('brunch', 'Brunch & Tostadas', '🥐', 'Todo empieza bien con masa madre');
    pushCat('dulces', 'Dulcería de autor', '🍰', 'Pastelería fina de vitrina');
    pushCat('frios', 'Bebidas frías', '🧊', 'Cold brew, licuados y sodas');
  } else if (esBoliche) {
    pushCat('signatures', 'Cócteles de Autor', '🍸', 'La firma de la casa');
    pushCat('clasicos', 'Clásicos Revisitados', '🥃', 'Recetario eterno, técnica nueva');
    pushCat('sin', 'Sin Alcohol', '🌿', 'Que nadie se quede afuera');
    pushCat('bocado', 'Para picar', '🍢', 'Bocados de una mano, ritmo de otra');
    pushCat('compartir', 'Para Compartir', '🍕', 'Mesas largas, noches largas');
  } else if (esBar) {
    pushCat('cerveceria', 'Cervecería Artesanal', '🍺', 'Draft rotativo de productores locales');
    pushCat('cocteleria', 'Coctelería', '🍸', 'Equilibrados, medidos, pensados');
    pushCat('fingers', 'Finger Food', '🍤', 'Lo que se come con una mano');
    pushCat('platos', 'Del Fuego', '🔥', 'Cocina de bar con carácter');
    pushCat('postres', 'Dulce Final', '🍮', 'Pequeños pecados');
  } else {
    pushCat('entradas', 'Para Empezar', '🥖', 'Bienvenida de la casa');
    pushCat('crudos', 'De la Barra', '🐟', 'Crudos, curados y escabeches');
    pushCat('principales', 'Principales', '🍽️', 'El corazón del menú');
    if (cocinas.includes('parrilla') || cocinas.includes('carne')) pushCat('parrilla', 'Del Asador', '🥩', 'Fuego, humo y paciencia');
    if (cocinas.includes('italiana')) pushCat('pastas', 'Pastas Amasadas', '🍝', 'Harina, huevo y tiempo');
    pushCat('postres', 'Postres', '🍰', 'El cierre perfecto');
    pushCat('vinos', 'Copa & Botella', '🍷', 'Selección de sommellerie');
  }

  const platos: Plato[] = [];
  const addPlato = (catId: string, gen: { nombre: string; desc: string; emoji: string }, extraTags: string[] = []) => {
    const cat = categorias.find(c => c.id === catId)!;
    const [lo, hi] = rangoPrecio(cfg.presupuesto, cat.nombre.toLowerCase());
    const rngP = new Rng(catId + gen.nombre);
    platos.push({
      id: `${catId}-${platos.length}`,
      nombre: gen.nombre,
      descripcion: gen.desc,
      precio: rngP.int(lo / 100, hi / 100) * 100,
      categoriaId: catId,
      tags: extraTags,
      destacado: false,
      emoji: gen.emoji,
      maridaje: !esCafe && rngP.chance(0.45) ? rngPick(MARIDAJES, catId + gen.nombre) : undefined,
      generadoPorIA: true,
    });
  };
  const rngPick = (arr: string[], seed: string) => arr[hashStr(seed) % arr.length];

  const porCategoria: Record<string, number> = {};
  for (const c of categorias) porCategoria[c.id] = esBoliche ? rng.int(4, 6) : rng.int(3, 5);

  for (const cat of categorias) {
    const n = porCategoria[cat.id];
    for (let i = 0; i < n; i++) {
      const cocina = cocinas[(i + hashStr(cat.id)) % cocinas.length];
      if (cat.id === 'signatures' || cat.id === 'clasicos' || cat.id === 'cocteleria' || cat.id === 'cocteles')
        addPlato(cat.id, coctelPlato(rng, cfg.tipo));
      else if (cat.id === 'sin')
        addPlato(cat.id, { nombre: `${rngPick(['Shrub de pomelo','Tónica botánica','Colada de coco y lima','Matcha frío','Ginger beer casera'], cat.id + i)}`, desc: 'Sin alcohol, con toda la ceremonia.', emoji: '🌿' }, ['sin alcohol']);
      else if (cat.id === 'cerveceria')
        addPlato(cat.id, cervezaPlato(rng), rng.chance(0.3) ? ['local'] : []);
      else if (cat.id === 'vinos')
        addPlato(cat.id, { nombre: rngPick(['Malbec Reserva, Mendoza','Torrontés de Altura','Cabernet Franc del Valle Central','Bonarda de Yerbera Vieja','Chardonnay Battonage','Pinot Noir de la Patagonia','Merlot Roble','Negramaro Blend'], cat.id + i), desc: rngPick(['Crianza 12 meses en roble francés.','Viñedo único, cosecha manual.','Fermentación con levaduras indígenas.','Leva contacto breve con pieles.'], cat.id + i), emoji: '🍷' });
      else if (cat.id === 'cafeteria')
        addPlato(cat.id, { nombre: rngPick(['Latte de vainilla tostada','Flat white de origen único','Espresso tónic','Cappuccino de pistacho','Cold brew 18hs','Mocha blanco','Affogato de dulce de leche','Espresso doble','Cortado clásico'], cat.id + i), desc: 'Granos de especialidad tostados a semana, extracción calibrada.', emoji: '☕' });
      else if (cat.id === 'postres' || cat.id === 'dulces' || cat.id === 'dulce final'.toLowerCase())
        addPlato(cat.id, postrePlato(rng));
      else if (cat.id === 'frios')
        addPlato(cat.id, { nombre: rngPick(['Limonada de jengibre y menta','Licuado de frutos rojos','Kombucha de durazno','Soda italiana de pepino','Iced latte de maple'], cat.id + i), desc: 'Recién hecho, azúcar justa, hielo filtrado.', emoji: '🧃' }, ['sin alcohol']);
      else if (cat.id === 'brunch' || cat.id === 'compartir' || cat.id === 'bocado' || cat.id === 'fingers')
        addPlato(cat.id, platoNombre(rng, rng.pick(cocinas), cfg.tipo));
      else
        addPlato(cat.id, platoNombre(rng, cocina, cfg.tipo));
    }
  }

  // Tags dietarios según restricciones declaradas
  for (const p of platos) {
    if (cfg.restricciones.includes('vegano') && /remolacha|berenjena|coliflor|zapallo|hinojo|portobello|chauchas|batata|morrón|verduras|tofu|falafel|hummus|palta|quinoa/i.test(p.nombre + p.descripcion)) p.tags.push('vegano');
    if (cfg.restricciones.includes('sin gluten') && !/pan|pasta|pizza|tarta|galleta|malta|weissbier/i.test(p.nombre)) p.tags.push('sin gluten');
  }

  // Destacados: 1 por categoría máxima, 3-5 totales
  const destacados = new Set<string>();
  for (const c of categorias) {
    const cps = platos.filter(p => p.categoriaId === c.id);
    if (cps.length) {
      const sel = cps[hashStr(c.id + cfg.nombre) % cps.length];
      sel.destacado = true; destacados.add(sel.id);
    }
    if (destacados.size >= 5) break;
  }

  const notasChef = generarNotasChef(cfg, rng);
  return { categorias, platos, acentosIA: generarAcentos(cfg, rng), notasChef, temaSugerido: sugerirTema(cfg, rng) };
}

function generarNotasChef(cfg: ConfigEstablecimiento, rng: Rng): string {
  const openings = [
    `En ${cfg.nombre} creemos que comer es un acto narrativo`,
    `${cfg.nombre} nació de una obsesión simple: producto honesto y fuego paciente`,
    `Esta carta es un mapa afectivo: cada plato recuerda un viaje, una sobremesa, una estación`,
  ];
  const middles = [
    'Trabajamos con productores cercanos y cambiamos la carta cuando el mercado lo pide',
    'La técnica está al servicio del sabor, nunca al revés',
    'Buscamos el equilibrio entre lo que la tradición manda y lo que la curiosidad sugiere',
  ];
  const closers = [
    cfg.tipo === 'boliche' ? 'Que la noche empiece despacio y termine tarde.' :
    cfg.tipo === 'cafeteria' ? 'Te esperamos con la primera taza caliente.' :
    'Levantá la mano y pedí recomendación: nos encanta hacerlo.',
  ];
  return `${rng.pick(openings)}, ${cfg.ciudad ? `en ${cfg.ciudad}. ` : ''}${rng.pick(middles)}. ${cfg.slogan ? `"${cfg.slogan}". ` : ''}${rng.pick(closers)}`;
}

// ---------- API real (OpenAI-compatible) ----------
async function chatComplete(settings: AISettings, system: string, user: string, jsonMode: boolean): Promise<string> {
  const res = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.9,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text().catch(() => '')}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

const SYSTEM_CHEF = `Sos el chef creativo y director de arte gastronómico de "MenúVivo", una app que diseña menús virtuales sumamente estéticos para restaurantes, bares, boliches y cafeterías en español rioplatense. Generás cartas apetitosas, originales, con descripciones sensoriales breves (máx 90 caracteres), nombres evocadores y precios realistas en pesos argentinos. Respondés SOLO JSON válido.`;

export async function generarMenuConIA(cfg: ConfigEstablecimiento, settings: AISettings): Promise<MenuGenerado> {
  if (settings.apiKey.trim()) {
    try {
      const user = `Brief: establecimiento "${cfg.nombre}" (${cfg.tipo}) en ${cfg.ciudad || 'Argentina'}. Slogan: "${cfg.slogan}". Vibe/estética: ${cfg.vibe}. Presupuesto: ${cfg.presupuesto}. Restricciones a contemplar: ${cfg.restricciones.join(', ') || 'ninguna'}.
Devolver JSON: {"categorias":[{"id","nombre","descripcion","emoji","orden"}],"platos":[{"id","nombre","descripcion","precio","categoriaId","tags":[],"destacado":bool,"emoji","maridaje"}],"acentosIA":[{"tono","hex","motivo"}],"notasChef":"texto de 2 a 4 frases","temaSugerido":"organico|neon|clasico|minimal|brutalista|glamour"}. Entre 5 y 6 categorías acordes al tipo de local, 3 a 6 platos por categoría, 3 acentos de color con hex válidos.`;
      const raw = await chatComplete(settings, SYSTEM_CHEF, user, true);
      const j = JSON.parse(raw);
      const categorias: Categoria[] = (j.categorias ?? []).map((c: any, i: number) => ({
        id: String(c.id ?? `cat-${i}`), nombre: String(c.nombre ?? 'Sección'), descripcion: c.descripcion, emoji: String(c.emoji ?? '🍽️'), orden: Number(c.orden ?? i),
      }));
      const platos: Plato[] = (j.platos ?? []).map((p: any, i: number) => ({
        id: String(p.id ?? `p-${i}`), nombre: String(p.nombre), descripcion: String(p.descripcion), precio: Number(p.precio) || 0,
        categoriaId: String(p.categoriaId ?? categorias[0]?.id), tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
        destacado: !!p.destacado, emoji: String(p.emoji ?? '🍽️'), maridaje: p.maridaje ? String(p.maridaje) : undefined, generadoPorIA: true,
      }));
      const acentosIA: AcentoIA[] = (j.acentosIA ?? []).map((a: any) => ({ tono: String(a.tono), hex: /^#[0-9a-fA-F]{6}$/.test(a.hex) ? a.hex : '#b4552d', motivo: String(a.motivo ?? '') }));
      if (categorias.length >= 3 && platos.length >= 6 && acentosIA.length >= 1) {
        const validTema = ['organico','neon','clasico','minimal','brutalista','glamour'];
        return {
          categorias, platos, acentosIA,
          notasChef: String(j.notasChef ?? ''),
          temaSugerido: validTema.includes(j.temaSugerido) ? j.temaSugerido : sugerirTema(cfg, new Rng(cfg.nombre)),
        };
      }
    } catch (e) {
      console.warn('IA externa falló, usando motor local:', e);
    }
  }
  // fallback local con animación de "pensamiento"
  await sleep(900 + Math.random() * 700);
  return generarMenuLocal(cfg);
}

export async function regenerarPlatoConIA(plato: Plato, contexto: string, settings: AISettings): Promise<Partial<Plato>> {
  if (settings.apiKey.trim()) {
    try {
      const user = `Reinventá este plato de ${contexto}. Devolver JSON {"nombre","descripcion","precio","emoji","maridaje"}. Actual: ${JSON.stringify(plato)}`;
      const raw = await chatComplete(settings, SYSTEM_CHEF, user, true);
      const j = JSON.parse(raw);
      return {
        nombre: j.nombre ? String(j.nombre) : undefined,
        descripcion: j.descripcion ? String(j.descripcion) : undefined,
        precio: Number(j.precio) || undefined,
        emoji: j.emoji ? String(j.emoji) : undefined,
        maridaje: j.maridaje ? String(j.maridaje) : undefined,
      };
    } catch { /* cae al local */ }
  }
  await sleep(500);
  const rng = new Rng(plato.id + Date.now());
  const cocinas = inferirCocinas({ nombre: contexto, tipo: 'restaurante', slogan: '', ciudad: '', vibe: contexto, presupuesto: 'medio', restricciones: [] }, rng);
  const g = rng.chance(0.2) ? postrePlato(rng) : platoNombre(rng, rng.pick(cocinas), 'restaurante');
  return { nombre: g.nombre, descripcion: g.desc, emoji: g.emoji };
}

export async function regenerarPaletaConIA(cfg: ConfigEstablecimiento, settings: AISettings): Promise<AcentoIA[]> {
  if (settings.apiKey.trim()) {
    try {
      const user = `Sugerí 3 colores de acento para el menú digital de "${cfg.nombre}" (${cfg.tipo}, vibe: ${cfg.vibe}). Devolver JSON {"acentosIA":[{"tono","hex","motivo"}]} con hex válidos y buen contraste.`;
      const raw = await chatComplete(settings, SYSTEM_CHEF, user, true);
      const j = JSON.parse(raw);
      const arr = (j.acentosIA ?? []).map((a: any) => ({ tono: String(a.tono), hex: /^#[0-9a-fA-F]{6}$/.test(a.hex) ? a.hex : '#b4552d', motivo: String(a.motivo ?? '') }));
      if (arr.length >= 2) return arr.slice(0, 3);
    } catch { /* local */ }
  }
  await sleep(400);
  return generarAcentos(cfg, new Rng(cfg.nombre + Date.now()));
}
