import { Download, ArrowLeft } from 'lucide-react';
import { useStore, usarActivo } from '../store/useStore';
import { TEMAS } from '../lib/temas';
import { renderMenuHTML } from '../lib/render';

export default function FullPreview() {
  const data = usarActivo();
  const setVista = useStore((s) => s.setVista);
  if (!data) return null;
  const tema = TEMAS[data.temaId];

  const exportar = () => {
    const html = renderMenuHTML(data, tema, { standalone: true });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-${data.config.nombre.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-black/40 backdrop-blur shrink-0">
        <button onClick={() => setVista('editor')} className="mv-btn mv-btn-ghost !py-1.5 !px-4 text-sm"><ArrowLeft className="w-4 h-4" /> Editor</button>
        <span className="text-sm text-zinc-400 truncate">{data.config.nombre} — vista completa del menú virtual</span>
        <button onClick={exportar} className="mv-btn mv-btn-primary !py-1.5 !px-4 text-sm ml-auto"><Download className="w-4 h-4" /> Exportar HTML</button>
      </header>
      <main className="flex-1 min-h-0">
        <iframe title="Menú completo" className="w-full h-full border-0" srcDoc={renderMenuHTML(data, tema)} sandbox="allow-same-origin" />
      </main>
    </div>
  );
}
