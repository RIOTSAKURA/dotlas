import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  MAP_W, MAP_H, GW, GH, CELL, px, py,
  decodeRings, splitAntimeridianRings, rasterizeLand, distanceField,
} from "./geometry.mjs";
import { sampleDots, DOT_SPACING, dotsToSvg, ridgeLineSvg, mixHex, clamp01, buildAccents, ensureComponentDots, ensureRingDots } from "./stipple.mjs";
import { CARDS, CARDS_ENABLED, PLACES, RIDGES, renderCardsHtml } from "./content.mjs";
import { buildChina } from "./china.mjs";
import { renderPage } from "./template.mjs";

const topo = JSON.parse(readFileSync(new URL("../data/land-110m.json", import.meta.url), "utf8"));
const rings = splitAntimeridianRings(decodeRings(topo));
const land = rasterizeLand(rings);
const distCoast = distanceField((i) => !land[i]);

const dots = sampleDots(land, distCoast);
dots.push(...ensureComponentDots(dots, {
  gw: GW, gh: GH, cell: CELL, land, distCoast,
  spacing: DOT_SPACING, coastFade: 26,
}));
dots.push(...ensureRingDots(dots, rings, { px, py }, {
  gw: GW, gh: GH, cell: CELL, distCoast,
  spacing: DOT_SPACING, coastFade: 26,
}));
const dotSvg = dotsToSvg(dots);
const ridgeSvg = ridgeLineSvg(RIDGES, { px, py });
const { accents, svg: accentSvg } = buildAccents(PLACES, land);
const cardsHtml = CARDS_ENABLED ? renderCardsHtml(CARDS) : "";
const mapH = Math.round(MAP_H * 100) / 100;
const dotCount = dots.length;

const china = buildChina();
const chinaH = Math.round(china.proj.height * 100) / 100;

const html = renderPage({
  mapH, dotSvg, ridgeSvg, accentSvg, cardsHtml, dotCount,
  china: { svg: china.svg, h: chinaH, dotCount: china.dots.length },
});
writeFileSync(new URL("../index.html", import.meta.url), html);

mkdirSync(new URL("../build/", import.meta.url), { recursive: true });
const preview = {
  world: {
    map: { x: 320, y: 244.8, w: 960, h: 960 * (MAP_H / MAP_W) },
    dots: dots.map((d) => [d.x, d.y, d.r, mixHex(clamp01(d.t))]),
    accents: accents.map((a) => [a.x, a.y]),
  },
  china: {
    map: { x: 384, y: 117, w: 832, h: 832 / china.proj.aspect },
    dots: china.dots.map((d) => [d.x, d.y, d.r, mixHex(clamp01(d.t))]),
    accents: china.accents.map((a) => [a.x, a.y]),
    inset: {
      x: 800, y: chinaH - 26 - Math.round(china.inset.h * 10) / 10,
      w: china.inset.w, h: Math.round(china.inset.h * 10) / 10,
      dots: china.inset.dots.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]),
    },
  },
  cards: CARDS_ENABLED
    ? CARDS.map((c) => {
        const w = (c.w / 100) * 1600;
        const photoH = w / aspectRatio(c.ar);
        const h = photoH + 56;
        return { x: (c.left / 100) * 1600, y: (c.top / 100) * 900, w, h, rot: c.rot, caption: c.caption };
      })
    : [],
};
writeFileSync(new URL("../build/preview.json", import.meta.url), JSON.stringify(preview));

let landCells = 0;
for (let i = 0; i < land.length; i++) landCells += land[i];
const ascii = [];
const cols = 110, rows = Math.round((cols * MAP_H) / MAP_W / 2.05);
for (let j = 0; j < rows; j++) {
  let line = "";
  for (let i = 0; i < cols; i++) {
    const mx = ((i + 0.5) / cols) * MAP_W;
    const my = ((j + 0.5) / rows) * MAP_H;
    const idx = Math.floor(my / CELL) * GW + Math.floor(mx / CELL);
    line += land[idx] ? "#" : " ";
  }
  ascii.push(line);
}
console.log(ascii.join("\n"));
console.log(`land ${(landCells / (GW * GH) * 100).toFixed(1)}%  dots ${dotCount}  map 1000x${mapH}`);
console.log(`china dots ${china.dots.length} (+${china.inset.dots.length} inset)  map 1000x${chinaH}`);

function aspectRatio(ar) {
  const [a, b] = ar.split("/").map(Number);
  return a / b;
}
