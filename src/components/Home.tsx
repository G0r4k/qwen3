import { motion } from 'framer-motion';
import { Sparkles, Plus, Trash2, Copy, ArrowRight, BrainCircuit, UtensilsCrossed, FileCode2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TEMAS } from '../lib/temas';
import { tipoLabel } from '../lib/render';

export default function Home() {
  const proyectos = useStore((s) => s.proyectos);
  const setVista = useStore((s) => s.setVista);
  const abrir = useStore((s) => s.abrirProyecto);
  const eliminar = useStore((s) => s.eliminarProyecto);
  const duplicar = useStore((s) => s.duplicarProyecto);
  const toggleAjustesIA = useStore((s) => s.toggleAjustesIA);
  const tieneAI = useStore((s) => !!s.ai.apiKey.trim());

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative px-6 pt-16 pb-10 text-center overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-zinc-300 mb-6 backdrop-blur">
            <BrainCircuit className="w-4 h-4 text-fuchsia-400" />
            Potenciado por IA · {tieneAI ? `modelo ${useStore.getState().ai.model}` : 'motor creativo local'}
            <button onClick={toggleAjustesIA} className="underline decoration-fuchsia-500/60 hover:text-white ml-1">configurar</button>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            Cartas que dan <span className="mv-shimmer">agua</span>.
            <br />Diseñadas por <span className="mv-shimmer">IA</span>.
          </h1>
          <p className="max-w-xl mx-auto mt-5 text-zinc-400 text-lg">
            MenúVivo crea menús virtuales sumamente estéticos para restaurantes, bares y boliches:
            platos, precios, maridajes, paletas cromáticas y temas visuales listos para compartir o exportar como HTML.
          </p>
          <div className="flex justify-center gap-3 mt-8">
            <button onClick={() => setVista('crear')} className="mv-btn mv-btn-primary text-base">
              <Sparkles className="w-5 h-5" /> Crear menú con IA
            </button>
          </div>
        </motion.div>

        {/* mockups flotantes decorativos */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-8 flex justify-center gap-6 hidden lg:flex opacity-90">
          {(['neon', 'organico', 'glamour'] as const).map((t, i) => (
            <motion.div key={t} className="mv-float w-44 h-56 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
              style={{ background: TEMAS[t].paleta.bg, animationDelay: `${i * 1.2}s` }}>
              <div className="p-3 space-y-2">
                <div className="h-2.5 w-3/4 rounded-full" style={{ background: TEMAS[t].paleta.text, opacity: .85 }} />
                <div className="h-1.5 w-1/2 rounded-full" style={{ background: TEMAS[t].paleta.accent }} />
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex justify-between gap-2 pt-2 border-t" style={{ borderColor: TEMAS[t].paleta.muted + '33' }}>
                    <div className="space-y-1 flex-1">
                      <div className="h-1.5 w-4/5 rounded" style={{ background: TEMAS[t].paleta.text, opacity: .6 }} />
                      <div className="h-1 w-3/5 rounded" style={{ background: TEMAS[t].paleta.muted, opacity: .5 }} />
                    </div>
                    <div className="h-1.5 w-8 rounded self-start mt-0.5" style={{ background: TEMAS[t].paleta.accent }} />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LISTA DE PROYECTOS */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4 mt-10">
          <h2 className="text-sm font-bold uppercase tracking-[.2em] text-zinc-400 flex items-center gap-2">
            <FileCode2 className="w-4 h-4" /> Mis menús ({proyectos.length})
          </h2>
          <button onClick={() => setVista('crear')} className="text-sm text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>

        {proyectos.length === 0 ? (
          <div className="mv-card rounded-2xl p-10 text-center text-zinc-400">
            Todavía no hay menús. <button onClick={() => setVista('crear')} className="underline text-white">Creá el primero</button> en menos de un minuto ✨
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proyectos.map((p, i) => {
              const tema = TEMAS[p.data.temaId];
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}
                  className="mv-card rounded-2xl p-4 group hover:border-white/25 transition cursor-pointer"
                  onClick={() => abrir(p.id)}>
                  <div className="flex items-center gap-2 mb-3">
                    {[p.data.acentosIA[0]?.hex ?? tema.paleta.accent, tema.paleta.accent2, tema.paleta.bg].map((c, j) => (
                      <span key={j} className="w-4 h-4 rounded-full border border-white/15" style={{ background: c }} />
                    ))}
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-zinc-500">{tema.nombre}</span>
                  </div>
                  <div className="font-bold text-lg truncate" style={{ fontFamily: tema.paleta.fontDisplay }}>{p.data.config.nombre}</div>
                  <div className="text-xs text-zinc-500 mb-3">{tipoLabel(p.data.config.tipo)} · {p.data.platos.length} platos</div>
                  <div className="flex items-center gap-1">
                    <span className="ml-auto text-xs text-fuchsia-400 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">Abrir <ArrowRight className="w-3.5 h-3.5" /></span>
                    <button title="Duplicar" onClick={(e) => { e.stopPropagation(); duplicar(p.id); }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-cyan-300 hover:bg-white/5"><Copy className="w-4 h-4" /></button>
                    <button title="Eliminar" onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar este menú?')) eliminar(p.id); }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4 mt-14 text-sm">
          {[
            { icon: <UtensilsCrossed className="w-5 h-5" />, t: 'Carta completa generada', d: 'Secciones, platos con descripción sensorial, precios calibrados y maridajes sugeridos.' },
            { icon: <Sparkles className="w-5 h-5" />, t: 'Estética decidida por IA', d: 'Paletas cromáticas con fundamento, tipografías y 6 temas: orgánico, neón, clásico, minimal, brutalista y glamour.' },
            { icon: <FileCode2 className="w-5 h-5" />, t: 'Exportable y responsive', d: 'Descargá un HTML autocontenido listo para subir a cualquier hosting o enviar por WhatsApp.' },
          ].map((f) => (
            <div key={f.t} className="mv-card rounded-2xl p-5">
              <div className="text-cyan-300 mb-2">{f.icon}</div>
              <div className="font-semibold mb-1">{f.t}</div>
              <div className="text-zinc-500 text-[13px] leading-relaxed">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
