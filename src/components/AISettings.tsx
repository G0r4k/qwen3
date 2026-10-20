import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BrainCircuit, KeyRound, Globe2, Cpu, Zap, ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';

const PRESETS = [
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'Groq (gratis y rápido)', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { label: 'Ollama local', baseUrl: 'http://localhost:11434/v1', model: 'llama3.1' },
  { label: 'Together AI', baseUrl: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free' },
];

export default function AISettingsModal() {
  const open = useStore((s) => s.mostrarAjustesIA);
  const toggle = useStore((s) => s.toggleAjustesIA);
  const ai = useStore((s) => s.ai);
  const setAi = useStore((s) => s.setAi);
  const [mostrarKey, setMostrarKey] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={toggle}>
      <motion.div initial={{ opacity: 0, scale: .95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="mv-card rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <BrainCircuit className="w-7 h-7 text-fuchsia-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">Ajustes de IA</h2>
            <p className="text-sm text-zinc-400 mt-1">
              MenúVivo funciona con un <strong>motor creativo local</strong> sin configuración.
              Si conectás una API compatible con OpenAI Chat Completions, la generación pasa a tu modelo.
            </p>
          </div>
          <button onClick={toggle} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-zinc-400 mb-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Proveedores rápidos
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => setAi({ baseUrl: p.baseUrl, model: p.model })}
                className={`text-left rounded-xl border p-2.5 text-xs transition ${ai.baseUrl === p.baseUrl ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 hover:border-white/30'}`}>
                <div className="font-semibold">{p.label}</div>
                <div className="text-zinc-500 truncate">{p.model}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Field icon={<KeyRound className="w-4 h-4" />} label="API Key">
            <div className="flex gap-2">
              <input type={mostrarKey ? 'text' : 'password'} value={ai.apiKey} onChange={(e) => setAi({ apiKey: e.target.value })}
                placeholder="sk-… (se guarda solo en tu navegador)" className="fld" />
              <button onClick={() => setMostrarKey(!mostrarKey)} className="text-xs px-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white shrink-0">
                {mostrarKey ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </Field>
          <Field icon={<Globe2 className="w-4 h-4" />} label="Base URL">
            <input value={ai.baseUrl} onChange={(e) => setAi({ baseUrl: e.target.value })} className="fld" placeholder="https://api.openai.com/v1" />
          </Field>
          <Field icon={<Cpu className="w-4 h-4" />} label="Modelo">
            <input value={ai.model} onChange={(e) => setAi({ model: e.target.value })} className="fld" placeholder="gpt-4o-mini" />
          </Field>
        </div>

        <div className="text-[11px] text-zinc-500 leading-relaxed">
          La clave queda en <code>localStorage</code>, nunca sale de tu dispositivo salvo hacia el endpoint que configures.
          {' '}<a className="text-fuchsia-400 inline-flex items-center gap-1" href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Keys gratis en Groq <ExternalLink className="w-3 h-3" /></a>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <span className={`text-xs font-semibold ${ai.apiKey.trim() ? 'text-emerald-400' : 'text-zinc-500'}`}>
            ● {ai.apiKey.trim() ? `IA externa activa (${ai.model})` : 'Sin clave → motor local'}
          </span>
          <button onClick={toggle} className="mv-btn mv-btn-primary !py-2 !px-5 text-sm">Guardar</button>
        </div>
      </motion.div>

      <style>{`.fld { width:100%; background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:.6rem .9rem; color:#f5f0e8; outline:none; font-size:14px; }
      .fld:focus { border-color:#22d3ee; box-shadow:0 0 0 3px rgba(34,211,238,.12);} }`}</style>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-zinc-400 mb-1.5">{icon}{label}</label>
      {children}
    </div>
  );
}
