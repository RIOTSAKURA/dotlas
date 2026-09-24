import { readFileSync } from "node:fs";
import {
  makeEquirect, ringsToEdges, fillScanlines, geojsonRings, distanceField,
} from "./geometry.mjs";
import { sampleDotsGrid, dotsColorGroups, buildAccents, ridgeLineSvg, mixHex, ensureComponentDots, ensureRingDots } from "./stipple.mjs";
import { CHINA_PLACES, CHINA_RIDGES, CARDS } from "./content.mjs";

export const CHINA_WINDOW = { lon0: 73, lon1: 135.5, latTop: 54.5, latBot: 15.5, phi0: 35, width: 1000 };
export const CHINA_GRID_W = 1400;
export const CHINA_DOTS = { spacing: 5.6, coastFade: 32 };
const ACCENT_SCALE = 1.15;

const INSET = { lon0: 105.5, lon1: 122.5, latTop: 21.9, latBot: 2.2, phi0: 12, width: 200 };
const INSET_POS = { x: 800, margin: 26 };

function loadProvinces(proj) {
  const gj = JSON.parse(readFileSync(new URL("../data/china-provinces.json", import.meta.url), "utf8"));
  const out = [];
  for (const f of gj.features) {
    const name = f.properties.name;
    if (!name) continue;
    const polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    const rings = [];
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const poly of polys) {
      const pts = poly[0].map(([lon, lat]) => [proj.px(lon), proj.py(lat)]);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [x, y] of pts) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (x0 < bx0) bx0 = x0; if (x1 > bx1) bx1 = x1;
      if (y0 < by0) by0 = y0; if (y1 > by1) by1 = y1;
      rings.push({ pts, x0, y0, x1, y1 });
    }
    const cx = ((bx0 + bx1) / 2 / proj.width) * 100;
    const cy = ((by0 + by1) / 2 / proj.height) * 100;
    out.push({ name, rings, origin: `${cx.toFixed(2)}% ${cy.toFixed(2)}%`, bbox: { x0: bx0, y0: by0, x1: bx1, y1: by1 } });
  }
  return out;
}

function pip(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const yi = pts[i][1], yj = pts[j][1];
    if ((yi > y) !== (yj > y)) {
      const xi = pts[i][0], xj = pts[j][0];
      if (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

function provinceAt(provinces, x, y) {
  for (const p of provinces) {
    for (const r of p.rings) {
      if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) continue;
      if (pip(r.pts, x, y)) return p.name;
    }
  }
  return "";
}

function simplifyDP(pts, tol) {
  const n = pts.length;
  if (n < 3) return pts;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    const ax = pts[a][0], ay = pts[a][1], dx = pts[b][0] - ax, dy = pts[b][1] - ay;
    const len2 = dx * dx + dy * dy || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const t = ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / len2;
      const d = Math.hypot(pts[i][0] - (ax + t * dx), pts[i][1] - (ay + t * dy));
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function hitD(p, tol = 1.2, minDiag = 8) {
  let d = "";
  for (const r of p.rings) {
    if (Math.hypot(r.x1 - r.x0, r.y1 - r.y0) < minDiag) continue;
    const s = simplifyDP(r.pts, tol);
    d += `M${s.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
  }
  return d;
}

function dashEnds(ring) {
  let a = ring[0], b = ring[ring.length - 1], maxD = -1;
  for (let i = 0; i < ring.length; i++) {
    for (let j = i + 1; j < ring.length; j++) {
      const dx = ring[i][0] - ring[j][0], dy = ring[i][1] - ring[j][1];
      const d = dx * dx + dy * dy;
      if (d > maxD) { maxD = d; a = ring[i]; b = ring[j]; }
    }
  }
  return [a, b];
}

function dottedLine(x1, y1, x2, y2, width, gap, opacity) {
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#1A2B4C" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="0.1 ${gap}"/>`;
}

function nineDashSvg(proj, insetProj) {
  const gj = JSON.parse(readFileSync(new URL("../data/china-provinces.json", import.meta.url), "utf8"));
  const jd = gj.features.find((f) => !f.properties.name && f.properties.adcode === "100000_JD");
  if (!jd) return { main: "", inset: "" };
  const polys = jd.geometry.type === "MultiPolygon" ? jd.geometry.coordinates : [jd.geometry.coordinates];
  const main = [];
  const inset = [];
  for (const poly of polys) {
    const [[alon, alat], [blon, blat]] = dashEnds(poly[0]);
    const clon = (alon + blon) / 2, clat = (alat + blat) / 2;
    if (clon >= INSET.lon0 && clon <= INSET.lon1 && clat >= INSET.latBot && clat <= INSET.latTop) {
      inset.push(dottedLine(insetProj.px(alon), insetProj.py(alat), insetProj.px(blon), insetProj.py(blat), 1.6, 3.2, 0.5));
    } else {
      main.push(dottedLine(proj.px(alon), proj.py(alat), proj.px(blon), proj.py(blat), 1.9, 5, 0.42));
    }
  }
  return { main: main.join(""), inset: inset.join("") };
}

function pickMarkers(list, count) {
  if (list.length <= count) return list.map((d) => [d.x, d.y]);
  const picked = [[list[0].x, list[0].y]];
  while (picked.length < count) {
    let best = null, bd = -1;
    for (const d of list) {
      let md = 1e9;
      for (const [px, py] of picked) md = Math.min(md, (d.x - px) ** 2 + (d.y - py) ** 2);
      if (md > bd) { bd = md; best = [d.x, d.y]; }
    }
    picked.push(best);
  }
  return picked;
}

export function buildChina() {
  const proj = makeEquirect(CHINA_WINDOW);
  const gw = CHINA_GRID_W;
  const cell = proj.width / gw;
  const gh = Math.round(proj.height / cell);
  const h = Math.round(proj.height * 100) / 100;

  const topo = JSON.parse(readFileSync(new URL("../data/china.json", import.meta.url), "utf8"));
  const rings = geojsonRings(topo.features);

  const land = fillScanlines(ringsToEdges(rings, proj), gw, gh, cell);
  const distCoast = distanceField((i) => !land[i], gw, gh, cell);

  const dots = sampleDotsGrid({
    w: proj.width, h: proj.height, gw, gh, cell,
    land, distCoast,
    ...CHINA_DOTS,
  });
  dots.push(...ensureComponentDots(dots, {
    gw, gh, cell, land, distCoast,
    spacing: CHINA_DOTS.spacing, coastFade: CHINA_DOTS.coastFade,
  }));
  dots.push(...ensureRingDots(dots, rings, proj, {
    gw, gh, cell, distCoast,
    spacing: CHINA_DOTS.spacing, coastFade: CHINA_DOTS.coastFade,
  }));

  const provinces = loadProvinces(proj);
  const provOf = dots.map((d) => provinceAt(provinces, d.x, d.y));

  const byProv = new Map();
  const orphans = [];
  for (let i = 0; i < dots.length; i++) {
    const p = provOf[i];
    if (!p) { orphans.push(dots[i]); continue; }
    if (!byProv.has(p)) byProv.set(p, []);
    byProv.get(p).push(dots[i]);
  }

  const ridgeSvg = ridgeLineSvg(CHINA_RIDGES, proj, { width: 1.9, gap: 6.5, opacity: 0.3 });
  const insetProj = makeEquirect(INSET);
  const dashes = nineDashSvg(proj, insetProj);
  const inset = buildInset(rings, dashes.inset);
  const insetGroup = `<g class="inset" transform="translate(${INSET_POS.x},${(proj.height - INSET_POS.margin - inset.h).toFixed(1)})">${inset.svg}</g>`;

  const baseSvg = `<svg class="cn-base" aria-hidden="true" viewBox="0 0 1000 ${h}">${ridgeSvg}${dashes.main}${dotsColorGroups(orphans)}${insetGroup}</svg>`;

  const provSvgs = provinces
    .map((p) => {
      const list = byProv.get(p.name);
      if (!list) return "";
      const b = p.bbox;
      const attrs = `data-cx="${((b.x0 + b.x1) / 2).toFixed(1)}" data-cy="${((b.y0 + b.y1) / 2).toFixed(1)}" data-w="${(b.x1 - b.x0).toFixed(1)}" data-h="${(b.y1 - b.y0).toFixed(1)}"`;
      return `<svg class="pv" data-p="${p.name}" ${attrs} aria-hidden="true" viewBox="0 0 1000 ${h}" style="transform-origin:${p.origin}">${dotsColorGroups(list)}</svg>`;
    })
    .join("");

  let cardIdx = 0;
  const markerGroups = provinces
    .map((p) => {
      const list = byProv.get(p.name);
      if (!list) return "";
      const marks = pickMarkers(list, 3)
        .map(([x, y]) => {
          const ci = cardIdx++ % CARDS.length;
          return `<g class="mk" data-card="${ci}"><circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#1A2B4C" opacity="0.05"/><circle class="ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="none" stroke="#1A2B4C" stroke-width="1"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#1A2B4C"/></g>`;
        })
        .join("");
      return `<g class="mks" data-p="${p.name}">${marks}</g>`;
    })
    .join("");
  const markersSvg = `<svg class="cn-markers" aria-hidden="true" viewBox="0 0 1000 ${h}">${markerGroups}</svg>`;

  const hitSvg = `<svg class="cn-hit" aria-hidden="true" viewBox="0 0 1000 ${h}">` +
    provinces.map((p) => {
      const d = hitD(p);
      return d ? `<path class="hit" data-p="${p.name}" d="${d}"/>` : "";
    }).join("") +
    `</svg>`;

  const { accents, svg: accentMarks } = buildAccents(CHINA_PLACES, land, proj, gw, gh, cell, ACCENT_SCALE);
  const accentsSvg = `<svg class="cn-accents" aria-hidden="true" viewBox="0 0 1000 ${h}">${accentMarks}</svg>`;

  const svg = baseSvg + provSvgs + hitSvg + markersSvg + accentsSvg;
  return { proj, land, gw, gh, cell, dots, accents, svg, inset };
}

function buildInset(rings, dashSvg = "") {
  const proj = makeEquirect(INSET);
  const gw = 400;
  const cell = proj.width / gw;
  const gh = Math.round(proj.height / cell);

  const inside = (lon, lat) => lon >= INSET.lon0 && lon <= INSET.lon1 && lat >= INSET.latBot && lat <= INSET.latTop;
  const inRings = rings.filter((ring) => ring.some(([lon, lat]) => inside(lon, lat)));

  const land = fillScanlines(ringsToEdges(inRings, proj), gw, gh, cell);

  const dots = [];
  const S = 4.6;
  const cols = Math.max(1, Math.floor(proj.width / S));
  const rows = Math.max(1, Math.floor(proj.height / S));
  const x0 = (proj.width - (cols - 1) * S) / 2;
  const y0 = (proj.height - (rows - 1) * S) / 2;
  for (let j = 0; j < rows; j++) {
    const y = y0 + j * S;
    const gj = Math.floor(y / cell);
    if (gj < 0 || gj >= gh) continue;
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * S;
      const gi = Math.floor(x / cell);
      if (gi < 0 || gi >= gw) continue;
      if (land[gj * gw + gi]) dots.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
    }
  }
  for (const ring of inRings) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, cx = 0, cy = 0;
    for (const [lon, lat] of ring) {
      const px = proj.px(lon), py = proj.py(lat);
      x0 = Math.min(x0, px); x1 = Math.max(x1, px);
      y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      cx += px; cy += py;
    }
    if (x1 - x0 < 1.8 && y1 - y0 < 1.8) dots.push([cx / ring.length, cy / ring.length]);
  }

  const frame = `<rect x="0" y="0" width="${INSET.width}" height="${proj.height.toFixed(1)}" fill="none" stroke="#1A2B4C" stroke-opacity="0.38" stroke-width="1" stroke-dasharray="0.1 4.6" stroke-linecap="round"/>`;
  const label = `<text x="${(INSET.width - 8).toFixed(1)}" y="${(proj.height - 8).toFixed(1)}" text-anchor="end" font-size="12" letter-spacing="3" fill="#1A2B4C" fill-opacity="0.55">南海诸岛</text>`;
  const dotsSvg = `<g fill="${mixHex(0.55)}">` +
    dots.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.1"/>`).join("") +
    `</g>`;
  return { svg: frame + label + dotsSvg + dashSvg, dots, w: INSET.width, h: proj.height };
}
