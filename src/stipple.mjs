import { MAP_W, MAP_H, GW, GH, CELL, px, py, snapToLand } from "./geometry.mjs";

export const DOT_SPACING = 4.2;
export const GREY = [0xa9, 0xae, 0xb8], NAVY = [0x1a, 0x2b, 0x4c];
export const COLOR_STEPS = 10;
export const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function mixHex(u) {
  const c = GREY.map((g, k) => Math.round(g + (NAVY[k] - g) * Math.pow(u, 1.12)));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function sampleDots(land, distCoast) {
  return sampleDotsGrid({
    w: MAP_W, h: MAP_H, gw: GW, gh: GH, cell: CELL,
    land, distCoast,
    spacing: DOT_SPACING, coastFade: 26,
  });
}

export function sampleDotsGrid({ w, h, gw, gh, cell, land, distCoast, spacing, coastFade, sizeRatio = 0.3 }) {
  const dots = [];
  const S = spacing;
  const R = S * sizeRatio;
  const cols = Math.max(1, Math.floor(w / S));
  const rows = Math.max(1, Math.floor(h / S));
  const x0 = (w - (cols - 1) * S) / 2;
  const y0 = (h - (rows - 1) * S) / 2;
  for (let j = 0; j < rows; j++) {
    const y = y0 + j * S;
    const gj = Math.floor(y / cell);
    if (gj < 0 || gj >= gh) continue;
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * S;
      const gi = Math.floor(x / cell);
      if (gi < 0 || gi >= gw) continue;
      const idx = gj * gw + gi;
      if (!land[idx]) continue;
      const inland = Math.min(1, distCoast[idx] / coastFade);
      const t = clamp01(0.15 + 0.85 * inland);
      dots.push({
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: Math.round(R * 100) / 100,
        t,
      });
    }
  }
  return dots;
}

export function ridgeLineSvg(lines, proj, { width = 1.4, gap = 5, opacity = 0.28 } = {}) {
  return lines
    .map((line) => {
      const pts = line
        .map(([lon, lat]) => `${proj.px(lon).toFixed(1)},${proj.py(lat).toFixed(1)}`)
        .join(" ");
      return `<polyline points="${pts}" fill="none" stroke="#1A2B4C" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="0.1 ${gap}"/>`;
    })
    .join("");
}

export function ensureComponentDots(dots, { gw, gh, cell, land, distCoast, spacing, coastFade, sizeRatio = 0.3 }) {
  const comp = new Int32Array(gw * gh).fill(-1);
  const comps = [];
  const stack = [];
  for (let i0 = 0; i0 < gw * gh; i0++) {
    if (!land[i0] || comp[i0] !== -1) continue;
    const id = comps.length;
    const cells = [];
    comp[i0] = id;
    stack.push(i0);
    while (stack.length) {
      const c = stack.pop();
      cells.push(c);
      const ci = c % gw, cj = (c / gw) | 0;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const ni = ci + di, nj = cj + dj;
          if (ni < 0 || ni >= gw || nj < 0 || nj >= gh) continue;
          const n = nj * gw + ni;
          if (land[n] && comp[n] === -1) { comp[n] = id; stack.push(n); }
        }
      }
    }
    comps.push(cells);
  }
  const has = new Set();
  for (const d of dots) {
    const gi = Math.min(gw - 1, Math.max(0, Math.floor(d.x / cell)));
    const gj = Math.min(gh - 1, Math.max(0, Math.floor(d.y / cell)));
    const id = comp[gj * gw + gi];
    if (id >= 0) has.add(id);
  }
  const extra = [];
  const R = spacing * sizeRatio;
  for (let id = 0; id < comps.length; id++) {
    if (has.has(id)) continue;
    const cells = comps[id];
    let sx = 0, sy = 0;
    for (const c of cells) { sx += c % gw; sy += (c / gw) | 0; }
    const cx = sx / cells.length, cy = sy / cells.length;
    let best = -1, bd = 1e9;
    for (const c of cells) {
      const d = ((c % gw) - cx) ** 2 + (((c / gw) | 0) - cy) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    const gi = best % gw, gj = (best / gw) | 0;
    const t = clamp01(0.15 + 0.85 * Math.min(1, distCoast[best] / coastFade));
    extra.push({
      x: Math.round((gi + 0.5) * cell * 10) / 10,
      y: Math.round((gj + 0.5) * cell * 10) / 10,
      r: Math.round(R * 100) / 100,
      t,
    });
  }
  return extra;
}

export function ensureRingDots(dots, rings, proj, { gw, gh, cell, distCoast, spacing, coastFade, sizeRatio = 0.3 }) {
  const extra = [];
  const limit = (spacing * 3) ** 2;
  const near = (spacing * 0.8) ** 2;
  for (const ring of rings) {
    let cx = 0, cy = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const [lon, lat] of ring) {
      const X = proj.px(lon), Y = proj.py(lat);
      cx += X; cy += Y;
      if (X < x0) x0 = X; if (X > x1) x1 = X;
      if (Y < y0) y0 = Y; if (Y > y1) y1 = Y;
    }
    cx /= ring.length; cy /= ring.length;
    if (cx < 0 || cx > proj.width || cy < 0 || cy > proj.height) continue;
    if ((x1 - x0) ** 2 + (y1 - y0) ** 2 > limit) continue;
    let close = false;
    for (const d of [...dots, ...extra]) {
      if ((d.x - cx) ** 2 + (d.y - cy) ** 2 < near) { close = true; break; }
    }
    if (close) continue;
    const gi = Math.floor(cx / cell), gj = Math.floor(cy / cell);
    const idx = gi >= 0 && gi < gw && gj >= 0 && gj < gh ? gj * gw + gi : -1;
    const isLand = idx >= 0 && distCoast[idx] > 0;
    const t = isLand ? clamp01(0.15 + 0.85 * Math.min(1, distCoast[idx] / coastFade)) : 0.25;
    extra.push({
      x: Math.round(cx * 10) / 10,
      y: Math.round(cy * 10) / 10,
      r: Math.round(spacing * sizeRatio * 100) / 100,
      t,
    });
  }
  return extra;
}

export function dotsColorGroups(dots) {
  const NB = COLOR_STEPS;
  const groups = Array.from({ length: NB }, () => []);
  for (const d of dots) {
    const b = Math.max(0, Math.min(NB - 1, Math.round(d.t * (NB - 1))));
    groups[b].push(d);
  }
  return groups
    .map((g, b) => {
      if (!g.length) return "";
      return (
        `<g fill="${mixHex(b / (NB - 1))}">` +
        g.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}"/>`).join("") +
        `</g>`
      );
    })
    .join("");
}

export function dotsToSvg(dots) {
  return dotsColorGroups(dots);
}

export function buildAccents(places, land, proj = { px, py }, gw = GW, gh = GH, cell = CELL, s = 1) {
  const accents = places.map((p, k) => {
    let [x, y] = snapToLand(land, proj.px(p.lon), proj.py(p.lat), gw, gh, cell);
    x = Math.round(x * 10) / 10;
    y = Math.round(y * 10) / 10;
    return { p, x, y, k };
  });
  const fmt = (v) => String(Number(v.toFixed(2)));
  const svg = accents
    .map(
      ({ x, y, k }) =>
        `<g><circle class="halo" cx="${x}" cy="${y}" r="${fmt(12 * s)}" fill="#1A2B4C" opacity="0.05"/>` +
        `<circle class="ring" cx="${x}" cy="${y}" r="${fmt(6.6 * s)}" fill="none" stroke="#1A2B4C" stroke-width="1" style="--d:${(k * 0.9).toFixed(1)}s"/>` +
        `<circle cx="${x}" cy="${y}" r="${fmt(2.5 * s)}" fill="#1A2B4C"/></g>`
    )
    .join("");
  return { accents, svg };
}
