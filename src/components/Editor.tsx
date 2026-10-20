import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Trash2, Plus, Star, Wand2, Download, Monitor, Smartphone,
  Palette, ChevronDown, ChevronUp, Eye, RotateCcw,
} from 'lucide-react';
import type { Categoria, Plato } from '../types';
import { useStore, usarActivo } from '../store/useStore';
import { TEMAS, listaTemas } from '../lib/temas';
import { regenerarPaletaConIA, regenerarPlatoConIA } from '../lib/ai';
import { renderMenuHTML, tipoLabel } from '../lib/render';
import Preview from './Preview';

export default function Editor() {
  const data = usarActivo();
  const setVista = useStore((s) => s.setVista);
  const toggleAjustesIA = useStore((s) => s.toggleAjustesIA);
  const tieneAI = useStore((s) => !!s.ai.apiKey.trim());

  const setTema = useStore((s) => s.setTema);
  const setAcento = useStore((s) => s.setAcento);
  const setAcentosIA = useStore((s) => s.setAcentosIA);
  const upsertPlato = useStore((s) => s.upsertPlato);
  const eliminarPlato = useStore((s) => s.eliminarPlato);
  const toggleDestacado = useStore((s) => s.toggleDestacado);
  const upsertCategoria = useStore((s) => s.upsertCategoria);
  const eliminarCategoria = useStore((s) => s.eliminarCategoria);
  const reordenarCategorias = useStore((s) => s.reordenarCategorias);
  const actualizar = useStore((s) => s.actualizar);
  const ai = useStore((s) => s.ai);

  const [device, setDevice] = useState<'auto' | 'mobile' | 'desktop'>('auto');
  const [regenPalette, setRegenPalette] = useState(false);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        No hay menú activo. <button onClick={() => setVista('crear')} className="ml-2 underline text-fuchsia-400">Crear uno</button>
      </div>
    );
  }

  const tema = TEMAS[data.temaId];
  const cats = [...data.categorias].sort((a, b) => a.orden - b.orden);

  const exportarHTML = () => {
    const html = renderMenuHTML(data, tema, { standalone: true });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-${data.config.nombre.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nuevaCategoria = () => {
    const id = `cat-${Date.now().toString(36)}`;
    upsertCategoria({ id, nombre: 'Nueva sección', emoji: '🍽️', descripcion: '', orden: data.categorias.length });
  };

  const nuevoPlato = (categoriaId: string) => {
    const p: Plato = {
      id: `${categoriaId}-${Date.now().toString(36)}`, nombre: 'Plato sin nombre', descripcion: 'Descripción provisoria',
      precio: 5000, categoriaId, tags: [], destacado: false, emoji: '🍽️', generadoPorIA: false,
    };
    upsertPlato(p);
  };

  const moverCat = (i: number, dir: -1 | 1) => {
    const ids = cats.map((c) => c.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reordenarCategorias(ids);
  };

  const regenPaleta = async () => {
    setRegenPalette(true);
    try {
      const acentos = await regenerarPaletaConIA(data.config, ai);
      setAcentosIA(acentos);
    } finally { setRegenPalette(false); }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Barra superior */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur shrink-0">
        <button onClick={() => setVista('home')} className="text-zinc-400 hover:text-white text-sm">← Proyectos</button>
        <div className="min-w-0">
          <input
            value={data.config.nombre}
            onChange={(e) => actualizar((d) => ({ ...d, config: { ...d.config, nombre: e.target.value } }))}
            className="bg-transparent font-bold text-lg outline-none border-b border-transparent focus:border-fuchsia-500/50 w-full truncate"
          />
          <div className="text-[11px] text-zinc-500">{tipoLabel(data.config.tipo)} · {data.platos.length} platos · {cats.length} secciones</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex rounded-full border border-white/10 overflow-hidden text-xs">
            {(['mobile', 'auto', 'desktop'] as const).map((d) => (
              <button key={d} onClick={() => setDevice(d)}
                className={`px-3 py-1.5 flex items-center gap-1 ${device === d ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/5'}`}>
                {d === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : d === 'desktop' ? <Monitor className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {d === 'mobile' ? 'Móvil' : d === 'desktop' ? 'Desktop' : 'Auto'}
              </button>
            ))}
          </div>
          <button onClick={() => setVista('preview')} className="mv-btn mv-btn-ghost !py-2 !px-4 text-sm"><Eye className="w-4 h-4" /> Full</button>
          <button onClick={exportarHTML} className="mv-btn mv-btn-primary !py-2 !px-4 text-sm"><Download className="w-4 h-4" /> Exportar HTML</button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Panel de control */}
        <aside className="w-[420px] max-w-full overflow-y-auto border-r border-white/10 bg-black/20 p-4 space-y-5 shrink-0">
          {/* Tema */}
          <section>
            <SectionTitle icon={<Palette className="w-4 h-4" />}>Tema visual sugerido por IA</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {listaTemas.map((t) => {
                const on = t.id === data.temaId;
                const pal = t.paleta;
                return (
                  <button key={t.id} onClick={() => setTema(t.id)}
                    className={`rounded-xl border p-2.5 text-left transition overflow-hidden relative ${on ? 'border-fuchsia-500 shadow-[0_0_20px_rgba(255,46,166,.25)]' : 'border-white/10 hover:border-white/30'}`}>
                    <div className="flex gap-1 mb-2">
                      {[pal.bg, pal.surface, on ? (data.acentosIA[0]?.hex ?? pal.accent) : pal.accent, pal.accent2].map((c, i) => (
                        <span key={i} className="w-5 h-5 rounded-full border border-black/20" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="text-xs font-bold" style={{ fontFamily: pal.fontDisplay }}>{t.nombre}</div>
                    <div className="text-[10px] text-zinc-500 leading-snug mt-0.5 line-clamp-2">{t.descripcion}</div>
                    {on && <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-fuchsia-400">ACTIVO</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Paleta IA */}
          <section>
            <SectionTitle icon={<Sparkles className="w-4 h-4" />}>Paleta generada por IA
              <button onClick={regenPaleta} disabled={regenPalette}
                className="ml-auto text-[11px] flex items-center gap-1 text-cyan-300 hover:text-cyan-200 disabled:opacity-50">
                <Wand2 className={`w-3.5 h-3.5 ${regenPalette ? 'animate-spin' : ''}`} /> Regenerar
              </button>
            </SectionTitle>
            <div className="space-y-2">
              {data.acentosIA.map((a, i) => (
                <label key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] p-2 cursor-pointer hover:border-white/25">
                  <input type="color" value={a.hex}
                    onChange={(e) => (i === 0 ? setAcento(e.target.value) : setAcentosIA(data.acentosIA.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x))))}
                    className="w-10 h-10 rounded-lg border-0 bg-transparent cursor-pointer p-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{a.tono} <span className="text-zinc-500 font-mono text-xs ml-1">{a.hex}</span></div>
                    <div className="text-[11px] text-zinc-500 italic truncate">{a.motivo}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Notas del chef */}
          <section>
            <SectionTitle icon={<RotateCcw className="w-4 h-4" />}>Notas del chef (texto de portada)</SectionTitle>
            <textarea
              value={data.notasChef}
              onChange={(e) => actualizar((d) => ({ ...d, notasChef: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fuchsia-500/50"
            />
          </section>

          {/* Categorías y platos */}
          <section>
            <SectionTitle icon={<Plus className="w-4 h-4" />}>Carta
              <button onClick={nuevaCategoria} className="ml-auto text-[11px] text-emerald-300 hover:text-emerald-200">+ Sección</button>
            </SectionTitle>
            <div className="space-y-3">
              {cats.map((c, idx) => (
                <CategoriaCard
                  key={c.id} cat={c} idx={idx} count={cats.length}
                  platos={data.platos.filter((p) => p.categoriaId === c.id)}
                  onMove={moverCat}
                  onEditCat={(patch) => upsertCategoria({ ...c, ...patch })}
                  onDeleteCat={() => eliminarCategoria(c.id)}
                  onAddPlato={() => nuevoPlato(c.id)}
                  contexto={`${data.config.nombre}, ${data.config.tipo}`}
                  ai={ai}
                  upsertPlato={upsertPlato} eliminarPlato={eliminarPlato} toggleDestacado={toggleDestacado}
                />
              ))}
            </div>
          </section>

          <p className="text-[11px] text-zinc-600 pb-6">
            {tieneAI ? '⚡ IA externa conectada.' : '🧠 Motor creativo local activo. Conectá una API key compatible con OpenAI (OpenAI, Groq, Together, Ollama…) en '}
            <button onClick={toggleAjustesIA} className="underline text-fuchsia-400">Ajustes de IA</button>{!tieneAI ? ' para usar tu modelo.' : ''}
          </p>
        </aside>

        {/* Preview en vivo */}
        <main className="flex-1 min-w-0">
          <Preview data={data} tema={tema} device={device} />
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-zinc-300 mb-2.5">
      <span className="text-fuchsia-400">{icon}</span>{children}
    </h3>
  );
}

function CategoriaCard(props: {
  cat: Categoria; idx: number; count: number; platos: Plato[];
  onMove: (i: number, d: -1 | 1) => void;
  onEditCat: (patch: Partial<Categoria>) => void;
  onDeleteCat: () => void;
  onAddPlato: () => void;
  contexto: string;
  ai: any;
  upsertPlato: (p: Plato) => void;
  eliminarPlato: (id: string) => void;
  toggleDestacado: (id: string) => void;
}) {
  const { cat, idx, count, platos } = props;
  const [open, setOpen] = useState(idx === 0);
  const [regenId, setRegenId] = useState<string | null>(null);

  const regenPlato = async (p: Plato) => {
    setRegenId(p.id);
    try {
      const patch = await regenerarPlatoConIA(p, props.contexto, props.ai);
      props.upsertPlato({ ...p, ...patch, generadoPorIA: true } as Plato);
    } finally { setRegenId(null); }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <input value={cat.emoji} onChange={(e) => props.onEditCat({ emoji: e.target.value })} className="w-10 bg-transparent text-center text-lg outline-none rounded-lg focus:bg-white/10" />
        <input value={cat.nombre} onChange={(e) => props.onEditCat({ nombre: e.target.value })} className="flex-1 bg-transparent font-semibold text-sm outline-none" />
        <div className="flex items-center gap-0.5 text-zinc-500">
          <button onClick={() => props.onMove(idx, -1)} disabled={idx === 0} className="p-1 hover:text-white disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={() => props.onMove(idx, 1)} disabled={idx === count - 1} className="p-1 hover:text-white disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
        </div>
        <button onClick={() => setOpen(!open)} className="text-zinc-400 hover:text-white p-1">
          <span className="text-[10px] mr-1">{platos.length}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button onClick={props.onDeleteCat} title="Eliminar sección" className="text-zinc-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-2.5 pb-2.5 space-y-2">
              <input value={cat.descripcion ?? ''} placeholder="Descripción breve de la sección…"
                onChange={(e) => props.onEditCat({ descripcion: e.target.value })}
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fuchsia-500/40" />
              {platos.map((p) => (
                <PlatoRow key={p.id} plato={p} regenerating={regenId === p.id}
                  onRegen={() => regenPlato(p)}
                  onChange={(patch) => props.upsertPlato({ ...p, ...patch })}
                  onDelete={() => props.eliminarPlato(p.id)}
                  onStar={() => props.toggleDestacado(p.id)} />
              ))}
              <button onClick={props.onAddPlato} className="w-full text-xs text-emerald-300 hover:text-emerald-200 border border-dashed border-emerald-500/30 rounded-lg py-2">+ Agregar plato</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlatoRow({ plato, onChange, onDelete, onStar, onRegen, regenerating }: {
  plato: Plato; regenerating: boolean;
  onChange: (patch: Partial<Plato>) => void; onDelete: () => void; onStar: () => void; onRegen: () => void;
}) {
  return (
    <div className={`rounded-lg border p-2 space-y-1.5 ${plato.destacado ? 'border-amber-400/40 bg-amber-400/[.06]' : 'border-white/10 bg-black/20'}`}>
      <div className="flex gap-1.5 items-center">
        <input value={plato.emoji} onChange={(e) => onChange({ emoji: e.target.value })} className="w-8 bg-transparent text-center outline-none rounded focus:bg-white/10" />
        <input value={plato.nombre} onChange={(e) => onChange({ nombre: e.target.value })} className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none" />
        <input type="number" value={plato.precio} onChange={(e) => onChange({ precio: Number(e.target.value) || 0 })}
          className="w-20 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-right outline-none" />
      </div>
      <textarea value={plato.descripcion} onChange={(e) => onChange({ descripcion: e.target.value })} rows={2}
        className="w-full bg-transparent border border-white/10 rounded-md px-2 py-1 text-xs outline-none focus:border-fuchsia-500/40 resize-none" />
      <div className="flex gap-1.5 items-center">
        <input value={plato.maridaje ?? ''} placeholder="Maridaje sugerido… (opcional)" onChange={(e) => onChange({ maridaje: e.target.value || undefined })}
          className="flex-1 min-w-0 bg-transparent border border-white/10 rounded-md px-2 py-1 text-[11px] outline-none" />
        <button onClick={onStar} title="Destacar" className={`p-1.5 rounded-md ${plato.destacado ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-500 hover:text-amber-300'}`}><Star className="w-4 h-4" fill={plato.destacado ? 'currentColor' : 'none'} /></button>
        <button onClick={onRegen} disabled={regenerating} title="Reinventar con IA" className="p-1.5 rounded-md text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-50"><Wand2 className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-md text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
