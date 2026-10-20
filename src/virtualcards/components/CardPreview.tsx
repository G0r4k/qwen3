// ============================================================
// CardPreview: renderiza una CardDesign como SVG puro.
// El mismo componente sirve para vista en miniatura, editor
// y exportación a PNG (serializando el SVG -> canvas).
// ============================================================

import { forwardRef, useMemo } from "react";
import DOMPurify from "dompurify";
import type { CardDesign, Palette } from "../types";
import { ASPECTS, paletteById } from "../cardPresets";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

interface Props {
  card: CardDesign;
  scale?: number; // ancho en px del contenedor
  className?: string;
}

function esc(s: string): string {
  return DOMPurify.sanitize(s, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/** Divide texto en líneas que caben en maxChars */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur.trim());
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[,.;:]?$/, "…");
    return kept;
  }
  return lines;
}

function fontFor(layout: CardDesign["layout"], role: string): { family: string; weight: number; italic?: boolean; tracking?: number } {
  switch (layout) {
    case "clasico":
      return { family: SERIF, weight: role === "title" ? 700 : 400 };
    case "lujo":
      return { family: SERIF, weight: role === "title" ? 600 : 300, tracking: role === "title" ? 3 : 0.5 };
    case "minimalista":
      return { family: SANS, weight: role === "title" ? 300 : 300, tracking: role === "title" ? 2 : 0 };
    case "organico":
      return { family: SERIF, weight: role === "title" ? 600 : 400, italic: role !== "title" };
    case "tipografico":
      return { family: SANS, weight: role === "title" ? 900 : 500, tracking: role === "title" ? -1 : 0 };
    case "moderno":
    default:
      return { family: SANS, weight: role === "title" ? 800 : 400 };
  }
}

export const CardPreview = forwardRef<SVGSVGElement, Props>(function CardPreview(
  { card, scale, className },
  ref
) {
  const aspect = ASPECTS.find((a) => a.id === card.aspect) || ASPECTS[0];
  const W = aspect.w;
  const H = aspect.h;
  const pal: Palette = useMemo(() => paletteById(card.paletteId), [card.paletteId]);

  const M = Math.round(W * 0.085); // margen
  const innerW = W - M * 2;

  const titleSize = Math.round(W / (card.layout === "tipografico" ? 9 : 11));
  const bodySize = Math.round(W / 26);
  const smallSize = Math.round(W / 34);

  const byRole = (r: string) => card.blocks.filter((b) => b.role === r);
  const subtitle = byRole("subtitle")[0];
  const bodies = byRole("body");
  const highlight = byRole("highlight")[0];
  const footer = byRole("footer")[0];
  const tagline = byRole("tagline")[0];

  // ---- fondo según layout ----
  const bg = (() => {
    const p = pal.primary, s = pal.secondary;
    switch (card.layout) {
      case "moderno":
        return `linear-gradient(135deg, ${p} 0%, ${s} 100%)`;
      case "minimalista":
        return p;
      case "lujo":
        return `radial-gradient(circle at 50% 20%, ${s} 0%, ${p} 70%)`;
      case "organico":
        return `linear-gradient(160deg, ${p} 40%, ${s} 100%)`;
      case "tipografico":
        return p;
      case "clasico":
      default:
        return `linear-gradient(180deg, ${p} 0%, ${s} 100%)`;
    }
  })();

  // ---- decoración ----
  const deco = card.decoration.kind;
  const frameInset = deco === "frame" || deco === "corner-ornament" ? Math.round(W * 0.035) : 0;

  // posiciones verticales fluidas
  const titleLines = wrap(card.title, Math.round(innerW / (titleSize * 0.55)), 2);
  let y = M + titleSize * (card.layout === "minimalista" ? 1.4 : 1.1);

  const elements: React.ReactNode[] = [];
  const push = (node: React.ReactNode) => elements.push(node);

  // título
  titleLines.forEach((ln, i) => {
    const f = fontFor(card.layout, "title");
    const centeredTitle = card.layout === "minimalista" || card.layout === "lujo";
    push(
      <text
        key={`t${i}`}
        x={centeredTitle ? W / 2 : M}
        y={y + i * titleSize * 1.12}
        fontFamily={f.family}
        fontWeight={f.weight}
        fontStyle={f.italic ? "italic" : "normal"}
        letterSpacing={f.tracking ?? 0}
        fontSize={titleSize}
        fill={pal.text}
        textAnchor={centeredTitle ? "middle" : "start"}
      >
        {esc(ln)}
      </text>
    );
  });
  y += titleLines.length * titleSize * 1.12;

  // divider bajo el título
  if (deco === "divider" || card.layout === "clasico" || card.layout === "lujo") {
    y += titleSize * 0.35;
    const dw = card.layout === "minimalista" ? innerW * 0.2 : innerW * 0.45;
    push(
      <line
        key="div"
        x1={W / 2 - dw / 2}
        y1={y}
        x2={W / 2 + dw / 2}
        y2={y}
        stroke={pal.accent}
        strokeWidth={card.layout === "lujo" ? 1.5 : 2}
        opacity={0.9}
      />
    );
    if (card.layout === "lujo") {
      push(<circle key="divc" cx={W / 2} cy={y} r={3} fill={pal.accent} />);
    }
    y += titleSize * 0.45;
  } else {
    y += titleSize * 0.6;
  }

  // subtitle
  if (subtitle) {
    const f = fontFor(card.layout, "subtitle");
    const size = Math.round(bodySize * 1.05);
    const lines = wrap(subtitle.text, Math.round(innerW / (size * 0.52)), 2);
    const centered = card.layout === "minimalista" || card.layout === "lujo";
    lines.forEach((ln, i) => {
      push(
        <text
          key={`s${i}`}
          x={centered ? W / 2 : M}
          y={y + size * (i + 0.9)}
          fontFamily={f.family}
          fontSize={size}
          fontWeight={f.weight}
          letterSpacing={card.layout === "minimalista" ? 2 : 0.5}
          fill={pal.subtle}
          textAnchor={centered ? "middle" : "start"}
        >
          {esc(ln.toUpperCase())}
        </text>
      );
    });
    y += lines.length * size * 1.25 + size * 0.4;
  }

  // panel central decorativo (para layouts con art area)
  const hasArtPanel = ["clasico", "lujo"].includes(card.layout) || deco === "arc";
  const artH = Math.round(H * 0.24);
  if (hasArtPanel && y + artH < H - M - bodySize * 6) {
    push(
      <g key="art">
        <rect
          x={M}
          y={y}
          width={innerW}
          height={artH}
          rx={card.layout === "moderno" ? 16 : 6}
          fill={pal.secondary}
          stroke={pal.accent}
          strokeOpacity={0.5}
          strokeWidth={1.5}
        />
        {/* motivo geométrico central */}
        <g transform={`translate(${W / 2}, ${y + artH / 2})`} stroke={pal.accent} fill="none" strokeWidth={1.4} opacity={0.85}>
          <circle r={artH * 0.26} />
          <circle r={artH * 0.16} />
          {[...Array(8)].map((_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={Math.cos(a) * artH * 0.3}
                y1={Math.sin(a) * artH * 0.3}
                x2={Math.cos(a) * artH * 0.42}
                y2={Math.sin(a) * artH * 0.42}
              />
            );
          })}
        </g>
      </g>
    );
    y += artH + bodySize * 1.4;
  }

  // body blocks
  for (const b of bodies.slice(0, 2)) {
    const f = fontFor(card.layout, "body");
    const lh = bodySize * 1.5;
    const lines = wrap(b.text, Math.round(innerW / (bodySize * 0.52)), 5);
    const centered = card.layout === "minimalista" || card.layout === "lujo" || card.layout === "clasico";
    lines.forEach((ln, i) => {
      push(
        <text
          key={`b${b.text}-${i}`}
          x={centered ? W / 2 : M}
          y={y + lh * (i + 0.8)}
          fontFamily={f.family}
          fontSize={bodySize}
          fontWeight={f.weight}
          fontStyle={f.italic ? "italic" : "normal"}
          fill={pal.text}
          opacity={0.92}
          textAnchor={centered ? "middle" : "start"}
        >
          {esc(ln)}
        </text>
      );
    });
    y += lines.length * lh + bodySize * 0.5;
  }

  // highlight (chip/píldora)
  if (highlight) {
    const size = Math.round(bodySize * 0.95);
    const chipW = Math.min(innerW, highlight.text.length * size * 0.62 + size * 2.4);
    const chipH = size * 2.3;
    const cx = card.layout === "moderno" || card.layout === "minimalista" ? M : W / 2 - chipW / 2;
    push(
      <g key="hl">
        <rect
          x={cx}
          y={y}
          width={chipW}
          height={chipH}
          rx={chipH / 2}
          fill={pal.accent}
          opacity={card.layout === "minimalista" ? 0.15 : 0.95}
        />
        <text
          x={cx + chipW / 2}
          y={y + chipH / 2 + size * 0.36}
          fontFamily={SANS}
          fontSize={size}
          fontWeight={700}
          fill={card.layout === "minimalista" ? pal.accent : pal.dark ? "#111111" : "#ffffff"}
          textAnchor="middle"
        >
          {esc(highlight.text)}
        </text>
      </g>
    );
    y += chipH + size;
  }

  // tagline
  if (tagline) {
    push(
      <text key="tg" x={M} y={y + smallSize} fontFamily={SANS} fontSize={smallSize} letterSpacing={1.5} fill={pal.subtle}>
        {esc(tagline.text.toUpperCase())}
      </text>
    );
  }

  // footer anclado abajo
  if (footer) {
    push(
      <text
        key="ft"
        x={W / 2}
        y={H - M - (deco === "dots" ? smallSize * 1.6 : 0)}
        fontFamily={fontFor(card.layout, "footer").family}
        fontSize={smallSize}
        fill={pal.subtle}
        textAnchor="middle"
        letterSpacing={1}
      >
        {esc(footer.text)}
      </text>
    );
  }

  // decorations
  if (deco === "frame") {
    push(
      <rect key="fr" x={frameInset} y={frameInset} width={W - frameInset * 2} height={H - frameInset * 2} rx={4} fill="none" stroke={pal.accent} strokeWidth={2} opacity={0.8} />
    );
    push(
      <rect key="fr2" x={frameInset + 6} y={frameInset + 6} width={W - (frameInset + 6) * 2} height={H - (frameInset + 6) * 2} rx={2} fill="none" stroke={pal.accent} strokeWidth={0.75} opacity={0.45} />
    );
  }
  if (deco === "corner-ornament") {
    const c = frameInset;
    const L = Math.round(W * 0.07);
    const corners = [
      [c, c, 1, 1],
      [W - c, c, -1, 1],
      [c, H - c, 1, -1],
      [W - c, H - c, -1, -1],
    ];
    corners.forEach(([x, yy, dx, dy], i) => {
      push(
        <path
          key={`co${i}`}
          d={`M ${x + (dx as number) * L} ${yy} L ${x} ${yy} L ${x} ${yy + (dy as number) * L}`}
          fill="none"
          stroke={pal.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      );
    });
  }
  if (deco === "dots") {
    [...Array(5)].forEach((_, i) => {
      push(<circle key={`d${i}`} cx={W / 2 + (i - 2) * smallSize * 1.6} cy={H - M * 0.55} r={2.2} fill={pal.accent} opacity={0.8} />);
    });
  }
  if (deco === "lines") {
    push(<line key="l1" x1={M} y1={H - M * 1.8} x2={W - M} y2={H - M * 1.8} stroke={pal.accent} strokeWidth={1} opacity={0.6} />);
    push(<line key="l2" x1={M} y1={H - M * 1.5} x2={W - M} y2={H - M * 1.5} stroke={pal.accent} strokeWidth={2.5} opacity={0.9} />);
  }
  if (deco === "arc") {
    push(<path key="arc" d={`M ${M} ${M * 0.6} Q ${W / 2} ${-H * 0.06} ${W - M} ${M * 0.6}`} fill="none" stroke={pal.accent} strokeWidth={2} opacity={0.55} />);
    push(<path key="arc2" d={`M ${M} ${H - M * 0.6} Q ${W / 2} ${H + H * 0.06} ${W - M} ${H - M * 0.6}`} fill="none" stroke={pal.accent} strokeWidth={2} opacity={0.55} />);
  }

  // marca de agua si es layout tipográfico: título gigante fantasma
  if (card.layout === "tipografico") {
    push(
      <text
        key="ghost"
        x={W / 2}
        y={H * 0.92}
        fontFamily={SANS}
        fontWeight={900}
        fontSize={Math.round(W / 5)}
        fill={pal.text}
        opacity={0.06}
        textAnchor="middle"
      >
        {esc(card.title.split(" ")[0] || "")}
      </text>
    );
  }

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width={scale ?? "100%"}
      height={scale ? undefined : "100%"}
      className={className}
      style={{
        display: "block",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        background: bg,
        maxHeight: scale ? undefined : "100%",
      }}
    >
      {elements}
    </svg>
  );
});
