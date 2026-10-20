import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AcentoIA, Categoria, ConfigEstablecimiento, MenuData, Plato, ProyectoResumen, TemaId, Vista,
} from '../types';
import { DEFAULT_AI_SETTINGS, generarMenuConIA, type AISettings } from '../lib/ai';

let counter = 0;
const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

interface State {
  vista: Vista;
  proyectos: ProyectoResumen[];
  activoId: string | null;
  generando: boolean;
  error: string | null;
  ai: AISettings;
  mostrarAjustesIA: boolean;

  setVista: (v: Vista) => void;
  setAi: (patch: Partial<AISettings>) => void;
  toggleAjustesIA: () => void;

  crearMenu: (cfg: ConfigEstablecimiento) => Promise<void>;
  abrirProyecto: (id: string) => void;
  eliminarProyecto: (id: string) => void;
  duplicarProyecto: (id: string) => void;

  actualizar: (fn: (d: MenuData) => MenuData) => void;
  setTema: (t: TemaId) => void;
  setAcento: (hex: string, tono?: string, motivo?: string) => void;
  setAcentosIA: (a: AcentoIA[]) => void;
  upsertPlato: (p: Plato) => void;
  eliminarPlato: (id: string) => void;
  toggleDestacado: (id: string) => void;
  upsertCategoria: (c: Categoria) => void;
  eliminarCategoria: (id: string) => void;
  reordenarCategorias: (ids: string[]) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      vista: 'home',
      proyectos: [],
      activoId: null,
      generando: false,
      error: null,
      ai: DEFAULT_AI_SETTINGS,
      mostrarAjustesIA: false,

      setVista: (vista) => set({ vista }),
      setAi: (patch) => set((s) => ({ ai: { ...s.ai, ...patch } })),
      toggleAjustesIA: () => set((s) => ({ mostrarAjustesIA: !s.mostrarAjustesIA })),

      crearMenu: async (cfg) => {
        set({ generando: true, error: null });
        try {
          const gen = await generarMenuConIA(cfg, get().ai);
          const now = Date.now();
          const data: MenuData = {
            config: cfg,
            categorias: gen.categorias,
            platos: gen.platos,
            temaId: gen.temaSugerido,
            acentosIA: gen.acentosIA,
            notasChef: gen.notasChef,
            creado: now,
            actualizado: now,
          };
          const id = uid();
          set((s) => ({
            proyectos: [{ id, data }, ...s.proyectos],
            activoId: id,
            vista: 'editor',
            generando: false,
          }));
        } catch (e: any) {
          set({ generando: false, error: e?.message ?? 'Error generando el menú' });
        }
      },

      abrirProyecto: (id) => set({ activoId: id, vista: 'editor' }),
      eliminarProyecto: (id) => set((s) => {
        const proyectos = s.proyectos.filter((p) => p.id !== id);
        return { proyectos, activoId: s.activoId === id ? (proyectos[0]?.id ?? null) : s.activoId };
      }),
      duplicarProyecto: (id) => set((s) => {
        const src = s.proyectos.find((p) => p.id === id);
        if (!src) return {};
        const nuevo: ProyectoResumen = {
          id: uid(),
          data: { ...structuredClone(src.data), config: { ...src.data.config, nombre: src.data.config.nombre + ' (copia)' }, actualizado: Date.now() },
        };
        return { proyectos: [nuevo, ...s.proyectos] };
      }),

      actualizar: (fn) => set((s) => {
        if (!s.activoId) return {};
        return {
          proyectos: s.proyectos.map((p) =>
            p.id === s.activoId ? { ...p, data: { ...fn(p.data), actualizado: Date.now() } } : p
          ),
        };
      }),

      setTema: (temaId) => get().actualizar((d) => ({ ...d, temaId })),

      setAcento: (hex, tono, motivo) =>
        get().actualizar((d) => {
          const acentos = d.acentosIA.length ? [...d.acentosIA] : [{ tono: tono ?? 'Acento principal', hex, motivo: motivo ?? '' }];
          acentos[0] = { tono: tono ?? acentos[0].tono, hex, motivo: motivo ?? acentos[0].motivo };
          return { ...d, acentosIA: acentos };
        }),

      setAcentosIA: (acentosIA) => get().actualizar((d) => ({ ...d, acentosIA })),

      upsertPlato: (plato) =>
        get().actualizar((d) => {
          const existe = d.platos.some((p) => p.id === plato.id);
          return { ...d, platos: existe ? d.platos.map((p) => (p.id === plato.id ? plato : p)) : [...d.platos, plato] };
        }),

      eliminarPlato: (id) => get().actualizar((d) => ({ ...d, platos: d.platos.filter((p) => p.id !== id) })),

      toggleDestacado: (id) =>
        get().actualizar((d) => ({ ...d, platos: d.platos.map((p) => (p.id === id ? { ...p, destacado: !p.destacado } : p)) })),

      upsertCategoria: (cat) =>
        get().actualizar((d) => {
          const existe = d.categorias.some((c) => c.id === cat.id);
          return { ...d, categorias: existe ? d.categorias.map((c) => (c.id === cat.id ? cat : c)) : [...d.categorias, cat] };
        }),

      eliminarCategoria: (id) =>
        get().actualizar((d) => ({
          ...d,
          categorias: d.categorias.filter((c) => c.id !== id),
          platos: d.platos.filter((p) => p.categoriaId !== id),
        })),

      reordenarCategorias: (ids) =>
        get().actualizar((d) => ({
          ...d,
          categorias: d.categorias.map((c) => ({ ...c, orden: ids.indexOf(c.id) })).sort((a, b) => a.orden - b.orden),
        })),
    }),
    {
      name: 'menuvivo-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ proyectos: s.proyectos, activoId: s.activoId, ai: s.ai }),
    }
  )
);

export function usarActivo(): MenuData | null {
  return useStore((s) => s.proyectos.find((p) => p.id === s.activoId)?.data ?? null);
}
