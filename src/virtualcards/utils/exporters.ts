// ============================================================
// Exportación de cartas: PNG (SVG->canvas), SVG, PDF y PPTX.
// ============================================================

import { saveAs } from "file-saver";
import type { CardDesign } from "../types";
import { ASPECTS } from "../cardPresets";

export function svgElementToString(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // fondo inline para que el rasterizado lo conserve (gradiente CSS -> <defs>)
  const vb = clone.viewBox.baseVal;
  const bg = svg.style.background || "";
  let defs = "";
  if (bg.includes("radial-gradient")) {
    const colors = bg.match(/#[0-9a-fA-F]{3,8}/g) || ["#ffffff"];
    defs = `<defs><radialGradient id="cbg" cx="50%" cy="20%" r="95%">${colors
      .map((c, i) => `<stop offset="${colors.length === 1 ? 0 : (i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`)
      .join("")}</radialGradient></defs>`;
  } else if (bg.includes("linear-gradient")) {
    const degMatch = bg.match(/(\d+)deg/);
    const deg = degMatch ? parseInt(degMatch[1]) : 180;
    const colors = bg.match(/#[0-9a-fA-F]{3,8}/g) || ["#ffffff"];
    defs = `<defs><linearGradient id="cbg" gradientTransform="rotate(${deg}, 0.5, 0.5)">${colors
      .map((c, i) => `<stop offset="${colors.length === 1 ? 0 : (i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`)
      .join("")}</linearGradient></defs>`;
  }
  const fill = defs ? "url(#cbg)" : bg || "#ffffff";
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", String(vb.width));
  rect.setAttribute("height", String(vb.height));
  rect.setAttribute("fill", fill.startsWith("url") ? "#000000" : fill);
  if (defs) {
    clone.insertAdjacentHTML("afterbegin", defs);
    rect.setAttribute("fill", "url(#cbg)");
  }
  clone.insertBefore(rect, clone.firstChild?.nextSibling ?? null);
  return new XMLSerializer().serializeToString(clone);
}

function download(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

export function exportSVG(svg: SVGSVGElement, card: CardDesign) {
  const str = svgElementToString(svg);
  download(new Blob([str], { type: "image/svg+xml;charset=utf-8" }), `${slug(card.title)}.svg`);
}

export async function rasterize(svg: SVGSVGElement, multiplier: number): Promise<HTMLCanvasElement> {
  const vb = svg.viewBox.baseVal;
  const w = vb.width * multiplier;
  const h = vb.height * multiplier;
  const str = svgElementToString(svg);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(str)}`;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo rasterizar el SVG."));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

export async function exportPNG(svg: SVGSVGElement, card: CardDesign, multiplier = 2) {
  const canvas = await rasterize(svg, multiplier);
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) download(blob, `${slug(card.title)}@${multiplier}x.png`);
      resolve();
    }, "image/png");
  });
}

export async function exportPDF(cards: CardDesign[]) {
  // rasteriza cada carta registrada y abre una ventana lista para imprimir/guardar como PDF
  const win = window.open("", "_blank");
  if (!win) throw new Error("Permite las ventanas emergentes para exportar a PDF.");
  const images: string[] = [];
  for (const c of cards) {
    const el = findSvgForCard(c.id);
    if (!el) continue;
    const canvas = await rasterize(el, 2);
    images.push(canvas.toDataURL("image/png"));
  }
  win.document.write(`<html><head><title>Cartas</title><style>
    @page { margin: 12mm; }
    body { font-family: sans-serif; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10mm; }
    img { width: 100%; border-radius: 8px; }
    </style></head><body><div class="grid">${images
    .map((src) => `<img src="${src}" />`)
    .join("")}</div>
    <script>window.onload = () => setTimeout(() => { window.print(); }, 300);</script>
    </body></html>`);
  win.document.close();
}

// ------------------------------------------------------------
// PPTX: una carta por diapositiva
// ------------------------------------------------------------
export async function exportPPTX(cards: CardDesign[], getSvgById: (id: string) => SVGSVGElement | null) {
  const pptxgen = (await import("pptxgenjs")).default;
  const pres = new pptxgen();
  for (const card of cards) {
    const svg = getSvgById(card.id);
    if (!svg) continue;
    const canvas = await rasterize(svg, 2);
    const data = canvas.toDataURL("image/png");
    const aspect = ASPECTS.find((a) => a.id === card.aspect)!;
    const isLandscape = aspect.w >= aspect.h;
    pres.defineLayout({ name: `L_${card.id}`, width: isLandscape ? 13.33 : 7.5, height: isLandscape ? 7.5 : 13.33 });
    pres.layout = `L_${card.id}`;
    const slide = pres.addSlide();
    const maxW = isLandscape ? 9 : 6.5;
    const ratio = aspect.h / aspect.w;
    const w = maxW;
    const h = w * ratio;
    slide.addImage({ data, x: (isLandscape ? 13.33 : 7.5) / 2 - w / 2, y: (isLandscape ? 7.5 : 13.33) / 2 - h / 2, w, h });
  }
  await pres.writeFile({ fileName: "cartas.pptx" });
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "carta";
}

// registro temporal de nodos SVG renderizados para exportación múltiple
const svgRegistry = new Map<string, WeakRef<SVGSVGElement>>();
export function registerCardSvg(id: string, el: SVGSVGElement | null) {
  if (el) svgRegistry.set(id, new WeakRef(el));
}
function findSvgForCard(id: string): SVGSVGElement | null {
  return svgRegistry.get(id)?.deref() ?? null;
}
