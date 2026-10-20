import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, UtensilsCrossed, Wine, Coffee, PartyPopper, Beer, ArrowRight, BrainCircuit } from 'lucide-react';
import type { ConfigEstablecimiento, EstablecimientoTipo } from '../types';
import { useStore } from '../store/useStore';

const TIPOS: { id: EstablecimientoTipo; label: string; icon: any; hint: string }[] = [
  { id: 'restaurante', label: 'Restaurante', icon: UtensilsCrossed, hint: 'Cocina de autor, bistró, parrilla' },
  { id: 'bar', label: 'Bar', icon: Wine, hint: 'Coctelería, wine bar, tapas' },
  { id: 'boliche', label: 'Boliche', icon: PartyPopper, hint: 'Nachos, pista, madrugada' },
  { id: 'pub', label: 'Pub', icon: Beer, hint: 'Cervezas, finger food' },
  { id: 'cafeteria', label: 'Cafetería', icon: Coffee, hint: 'Especialty coffee & brunch' },
];

const VIBES = ['cálido y de autor', 'nocturno y eléctrico', 'minimal y nórdico', 'clásico elegante', 'industrial y cruda', 'glamour lounge', 'mediterráneo soleado', 'fusión asiática'];

export default function Create() {
  const crearMenu = useStore((s) => s.crearMenu);
  const generando = useStore((s) => s.generando);
  const error = useStore((s) => s.error);
  const setVista = useStore((s) => s.setVista);
  const toggleAjustesIA = useStore((s) => s.toggleAjustesIA);
  const tieneAI = useStore((s) => !!s.ai.apiKey.trim());

  const [cfg, setCfg] = useState<ConfigEstablecimiento>({
    nombre: '', tipo: 'restaurante', slogan: '', ciudad: '', vibe: '', presupuesto: 'medio', restricciones: [],
  });

  const set = <K extends keyof ConfigEstablecimiento>(k: K, v: ConfigEstablecimiento[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const puedeCrear = cfg.nombre.trim().length > 1 && !generando;

  const submit = () => {
    if (!puedeCrear) return;
    crearMenu({ ...cfg, nombre: cfg.nombre.trim(), vibe: cfg.vibe.trim() || 'moderno y apetitoso' });
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => setVista('home')} className="text-sm text-zinc-400 hover:text-white mb-6">← Volver</button>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <BrainCircuit className="w-7 h-7 text-fuchsia-400" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contanos de tu lugar</h1>
          </div>
          <p className="text-zinc-400 mb-8">
            La IA diseña la carta completa: secciones, platos, descripciones sensoriales, precios, maridajes,
            paleta de colores y el tema visual ideal. {tieneAI ? 'Usando tu modelo configurado ⚡' : 'Modo IA local activo — podés conectar tu API key en Ajustes.'}
            {' '}<button onClick={toggleAjustesIA} className="underline decoration-fuchsia-500/60 hover:text-white">Ajustes de IA</button>
          </p>
        </motion.div>

        <div className="space-y-6">
          <Field label="Nombre del establecimiento *">
            <input value={cfg.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Fuego Lento, La Confitería, Club Nocturna…"
              className="input" autoFocus />
          </Field>

          <Field label="Tipo de local">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TIPOS.map((t) => (
                <button key={t.id} onClick={() => set('tipo', t.id)}
                  className={`rounded-xl border p-3 text-center transition ${cfg.tipo === t.id ? 'border-fuchsia-500 bg-fuchsia-500/15 shadow-[0_0_24px_rgba(255,46,166,.2)]' : 'border-white/10 bg-white/[.03] hover:border-white/25'}`}>
                  <t.icon className={`w-5 h-5 mx-auto mb-1 ${cfg.tipo === t.id ? 'text-fuchsia-400' : 'text-zinc-400'}`} />
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{t.hint}</div>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Slogan (opcional)">
              <input value={cfg.slogan} onChange={(e) => set('slogan', e.target.value)} placeholder="Ej: fuego, vino y sobremesa" className="input" />
            </Field>
            <Field label="Ciudad (opcional)">
              <input value={cfg.ciudad} onChange={(e) => set('ciudad', e.target.value)} placeholder="Ej: Buenos Aires" className="input" />
            </Field>
          </div>

          <Field label="Vibe / estilo buscado">
            <input value={cfg.vibe} onChange={(e) => set('vibe', e.target.value)} placeholder="Palabras clave: italiana rústica, noche neón, huerta orgánica…" className="input" />
            <div className="flex flex-wrap gap-2 mt-2">
              {VIBES.map((v) => (
                <button key={v} onClick={() => set('vibe', v)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${cfg.vibe === v ? 'border-cyan-400 text-cyan-300 bg-cyan-400/10' : 'border-white/10 text-zinc-400 hover:border-white/30'}`}>
                  {v}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Nivel de precios">
            <div className="grid grid-cols-3 gap-2">
              {(['economico', 'medio', 'premium'] as const).map((b) => (
                <button key={b} onClick={() => set('presupuesto', b)}
                  className={`rounded-xl border py-2.5 text-sm font-semibold capitalize transition ${cfg.presupuesto === b ? 'border-amber-400 bg-amber-400/15 text-amber-300' : 'border-white/10 bg-white/[.03] text-zinc-400 hover:border-white/25'}`}>
                  {b === 'economico' ? 'Económico' : b}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Restricciones a contemplar">
            <div className="flex flex-wrap gap-2">
              {['vegano', 'vegetariano', 'sin gluten', 'sin lactosa', 'halal'].map((r) => {
                const on = cfg.restricciones.includes(r);
                return (
                  <button key={r} onClick={() => set('restricciones', on ? cfg.restricciones.filter((x) => x !== r) : [...cfg.restricciones, r])}
                    className={`text-sm px-4 py-2 rounded-full border transition ${on ? 'border-emerald-400 text-emerald-300 bg-emerald-400/10' : 'border-white/10 text-zinc-400 hover:border-white/30'}`}>
                    {on ? '✓ ' : '+ '}{r}
                  </button>
                );
              })}
            </div>
          </Field>

          {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3">{error}</div>}

          <button onClick={submit} disabled={!puedeCrear}
            className="mv-btn mv-btn-primary w-full justify-center text-lg disabled:opacity-40 disabled:cursor-not-allowed">
            {generando ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" /> La IA está componiendo tu menú…
              </>
            ) : (
              <>Generar menú con IA <ArrowRight className="w-5 h-5" /></>
            )}
          </button>

          {generando && (
            <div className="mt-6 space-y-2">
              {['Analizando el brief y el vibe…', 'Definiendo secciones de la carta…', 'Componiendo platos y descripciones sensoriales…', 'Calibrando precios y maridajes…', 'Eligiendo paleta cromática y tipografía…'].map((msg, i) => (
                <motion.div key={msg} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.45 }}
                  className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" /> {msg}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`.input { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: .7rem 1rem; color: #f5f0e8; outline: none; transition: border .15s; }
      .input:focus { border-color: #ff2ea6; box-shadow: 0 0 0 3px rgba(255,46,166,.15); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-[.18em] text-zinc-400 mb-2">{label}</label>
      {children}
    </div>
  );
}
