// Renderizador del menú virtual: convierte MenuData + Tema en HTML/CSS autocontenido.
// Se usa tanto para el preview en vivo (iframe) como para la exportación standalone.

import type { MenuData, Tema } from '../types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function formatPrecio(n: number): string {
  return '$' + n.toLocaleString('es-AR');
}

export function renderMenuHTML(data: MenuData, tema: Tema, opts: { standalone?: boolean; editable?: boolean } = {}): string {
  const { config, categorias, platos, acentosIA, notasChef } = data;
  const p = tema.paleta;
  const accent = acentosIA[0]?.hex ?? p.accent;
  const accent2 = acentosIA[1]?.hex ?? p.accent2;
  const glow = tema.efectos.glow;
  const glass = tema.efectos.glass;
  const radius = tema.efectos.radius;
  const hardEdge = tema.id === 'brutalista';

  const cats = [...categorias].sort((a, b) => a.orden - b.orden);
  const destacados = platos.filter((x) => x.destacado);

  const seccionesHTML = cats.map((c) => {
    const items = platos.filter((pl) => pl.categoriaId === c.id);
    if (!items.length) return '';
    const filas = items.map((pl) => `
      <div class="plato ${pl.destacado ? 'destacado' : ''}">
        <div class="plato-head">
          <span class="plato-emoji">${esc(pl.emoji)}</span>
          <div class="plato-titulo">
            <h4>${esc(pl.nombre)}${pl.destacado ? `<span class="badge">★ ${hardEdge ? 'LA CASA' : 'de la casa'}</span>` : ''}</h4>
            <div class="dots"></div>
            <span class="precio">${formatPrecio(pl.precio)}</span>
          </div>
        </div>
        <p class="desc">${esc(pl.descripcion)}</p>
        ${(pl.tags.length || pl.maridaje) ? `
        <div class="meta">
          ${pl.tags.map((t) => `<span class="tag">#${esc(t.toLowerCase().replace(/\s+/g, '-'))}</span>`).join('')}
          ${pl.maridaje ? `<span class="maridaje">🥂 ${esc(pl.maridaje)}</span>` : ''}
        </div>` : ''}
      </div>`).join('');
    return `
      <section class="seccion" id="cat-${esc(c.id)}">
        <header class="sec-head">
          <span class="sec-emoji">${esc(c.emoji)}</span>
          <div>
            <h3>${esc(c.nombre)}</h3>
            ${c.descripcion ? `<p class="sec-desc">${esc(c.descripcion)}</p>` : ''}
          </div>
        </header>
        <div class="grid">${filas}</div>
      </section>`;
  }).join('');

  const navChips = cats.map((c) => `<a href="#cat-${esc(c.id)}" class="chip">${esc(c.emoji)} ${esc(c.nombre)}</a>`).join('');

  const body = `
  <div class="hero">
    ${config.slogan ? `<div class="kicker">${esc(config.slogan)}</div>` : ''}
    <h1>${esc(config.nombre)}</h1>
    <div class="sub">${esc(tipoLabel(config.tipo))}${config.ciudad ? ` · ${esc(config.ciudad)}` : ''}</div>
    ${notasChef ? `<p class="chef">${esc(notasChef)}</p>` : ''}
  </div>
  <nav class="chips">${navChips}</nav>
  ${destacados.length && !hardEdge ? `
  <aside class="feature">
    <div class="feature-label">Recomendación de la IA · favoritos de la casa</div>
    <div class="feature-grid">
      ${destacados.slice(0, 3).map((d) => `
        <div class="feature-card">
          <div class="f-emoji">${esc(d.emoji)}</div>
          <div><strong>${esc(d.nombre)}</strong><br/><span class="f-desc">${esc(d.descripcion)}</span></div>
          <div class="f-price">${formatPrecio(d.precio)}</div>
        </div>`).join('')}
    </div>
  </aside>` : ''}
  ${seccionesHTML}
  <footer class="pie">
    <div class="pie-nombre">${esc(config.nombre)}</div>
    <div>Carta diseñada con <strong>MenúVivo</strong> ✦ ${new Date().getFullYear()}</div>
  </footer>`;

  const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: ${p.bg}; color: ${p.text};
    font-family: ${p.fontBody}; line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 980px; margin: 0 auto; padding: clamp(16px, 4vw, 40px); position: relative; }
  ${tema.efectos.grain ? `body::before { content:""; position:fixed; inset:0; pointer-events:none; opacity:.05;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }` : ''}
  ${glow ? `.hero h1 { text-shadow: 0 0 24px ${accent}66, 0 0 60px ${accent}33; } .precio { color: ${accent}; text-shadow: 0 0 12px ${accent}88; }` : `.precio { color: ${accent}; }`}

  .hero { text-align: center; padding: clamp(32px, 7vw, 72px) 8px clamp(20px, 4vw, 40px); }
  .kicker { letter-spacing: .35em; text-transform: uppercase; font-size: 12px; color: ${accent}; font-weight: 700; margin-bottom: 14px; }
  .hero h1 {
    font-family: ${p.fontDisplay}; font-weight: ${hardEdge ? 400 : 700};
    font-size: clamp(40px, 9vw, 84px); line-height: 1.02;
    ${hardEdge ? `text-transform: uppercase; letter-spacing: -0.01em;` : ''}
    ${tema.efectos.serifDisplay ? `font-style: normal;` : ''}
  }
  .sub { margin-top: 12px; color: ${p.muted}; font-size: 15px; letter-spacing: .08em; text-transform: uppercase; }
  .chef { max-width: 620px; margin: 22px auto 0; font-family: ${p.fontDisplay}; font-size: clamp(16px, 2.4vw, 20px); color: ${p.text}; opacity: .85; font-style: italic; }

  .chips { display: flex; gap: 10px; overflow-x: auto; padding: 14px 4px 26px; scrollbar-width: none; position: sticky; top: 0; z-index: 5; background: linear-gradient(${p.bg} 70%, transparent); }
  .chips::-webkit-scrollbar { display: none; }
  .chip {
    flex: 0 0 auto; text-decoration: none; color: ${p.text}; font-size: 13px; font-weight: 600;
    padding: 8px 16px; border-radius: ${hardEdge ? 0 : 999}px;
    border: ${hardEdge ? `2px solid ${p.text}` : `1px solid ${accent}55`};
    ${glass ? `background: ${p.surface}33; backdrop-filter: blur(8px);` : `background: ${p.surface};`}
    transition: all .18s ease;
  }
  .chip:hover { background: ${accent}; color: ${p.bg}; border-color: ${accent}; transform: translateY(-2px); }

  .feature { margin: 8px 0 40px; padding: 22px; border-radius: ${radius}px;
    ${glass ? `background: linear-gradient(140deg, ${accent}22, ${accent2}18); backdrop-filter: blur(12px); border: 1px solid ${accent}44;` : `background: ${p.surface}; border: 2px solid ${accent};`}
    ${glow ? `box-shadow: 0 0 40px ${accent}22 inset, 0 10px 40px rgba(0,0,0,.35);` : ''} }
  .feature-label { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: ${accent}; font-weight: 700; margin-bottom: 14px; }
  .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .feature-card { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: ${Math.max(radius - 4, 0)}px; background: ${p.bg}aa; }
  .f-emoji { font-size: 26px; }
  .f-desc { color: ${p.muted}; font-size: 13px; }
  .f-price { margin-left: auto; font-weight: 700; color: ${accent}; white-space: nowrap; }

  .seccion { margin-bottom: 46px; }
  .sec-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
  .sec-emoji { font-size: 30px; }
  .sec-head h3 { font-family: ${p.fontDisplay}; font-size: clamp(24px, 4.5vw, 34px); font-weight: ${hardEdge ? 400 : 700}; ${hardEdge ? 'text-transform: uppercase;' : ''} }
  .sec-desc { color: ${p.muted}; font-size: 13px; }
  .sec-head::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, ${accent}66, transparent); }

  .grid { display: grid; grid-template-columns: 1fr; gap: ${hardEdge ? '2px' : '10px'}; }
  @media (min-width: 720px) { .grid { grid-template-columns: 1fr 1fr; column-gap: 34px; } }

  .plato { padding: ${hardEdge ? '16px' : '14px 16px'}; border-radius: ${radius}px;
    transition: transform .18s ease, background .18s ease; }
  .plato:hover { ${glass ? `background: ${p.surface}55;` : `background: ${p.surface};`} transform: translateY(-2px); }
  .plato.destacado { ${glass ? `background: ${accent}14;` : `background: ${p.surface};`} border: 1px solid ${accent}44; }
  .plato-head { display: flex; gap: 12px; align-items: baseline; }
  .plato-emoji { font-size: 20px; }
  .plato-titulo { display: flex; align-items: baseline; gap: 8px; flex: 1; flex-wrap: wrap; }
  .plato h4 { font-family: ${p.fontDisplay}; font-size: 17px; font-weight: 600; ${hardEdge ? 'text-transform: uppercase; font-family: ' + p.fontBody + '; letter-spacing: .02em;' : ''} }
  .dots { flex: 1; min-width: 20px; border-bottom: 2px dotted ${p.muted}55; transform: translateY(-4px); }
  .badge { margin-left: 8px; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: ${p.bg}; background: ${accent}; padding: 2px 8px; border-radius: ${hardEdge ? 0 : 999}px; vertical-align: middle; font-family: ${p.fontBody}; }
  .precio { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .desc { color: ${p.muted}; font-size: 13.5px; margin: 6px 0 0 32px; }
  .meta { margin: 8px 0 0 32px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .tag { font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: ${accent2}; border: 1px solid ${accent2}66; padding: 2px 8px; border-radius: ${hardEdge ? 0 : 999}px; }
  .maridaje { font-size: 12px; color: ${p.muted}; font-style: italic; }

  .pie { text-align: center; padding: 50px 0 30px; color: ${p.muted}; font-size: 13px; border-top: 1px solid ${p.muted}33; margin-top: 20px; }
  .pie-nombre { font-family: ${p.fontDisplay}; font-size: 22px; color: ${p.text}; margin-bottom: 6px; }
  `;

  const inner = `<div class="wrap">${body}</div>`;

  if (opts.standalone) {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(config.nombre)} — Menú</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
<style>${css}</style></head><body>${inner}</body></html>`;
  }
  return `<style>${css}</style>${inner}`;
}

export function tipoLabel(t: string): string {
  return ({ restaurante: 'Restaurante', bar: 'Bar', boliche: 'Boliche', cafeteria: 'Cafetería', pub: 'Pub' } as Record<string, string>)[t] ?? t;
}
