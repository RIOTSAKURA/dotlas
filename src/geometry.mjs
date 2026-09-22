export const MAP_W = 1000;
export const LAT_TOP = 84, LAT_BOT = -58;
export const MAP_H = (MAP_W * (LAT_TOP - LAT_BOT)) / 360;
export const GW = 500, GH = Math.round(MAP_H / (MAP_W / GW));
export const CELL = MAP_W / GW;
export const px = (lon) => ((lon + 180) / 360) * MAP_W;
export const py = (lat) => ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * MAP_H;

export function makeEquirect({ lon0, lon1, latTop, latBot, phi0 = 0, width = 1000 }) {
  const cosP = Math.cos((phi0 * Math.PI) / 180);
  const wDeg = (lon1 - lon0) * cosP;
  const hDeg = latTop - latBot;
  const k = width / wDeg;
  return {
    width,
    height: k * hDeg,
    aspect: wDeg / hDeg,
    px: (lon) => (lon - lon0) * cosP * k,
    py: (lat) => (latTop - lat) * k,
  };
}

export function ringsToEdges(rings, proj) {
  const edges = [];
  for (const pts of rings) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const x1 = proj.px(a[0]), y1 = proj.py(a[1]), x2 = proj.px(b[0]), y2 = proj.py(b[1]);
      if (Math.abs(y1 - y2) > 1e-9) edges.push([x1, y1, x2, y2]);
    }
  }
  return edges;
}

export function fillScanlines(edges, gw, gh, cell) {
  const grid = new Uint8Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    const y = (j + 0.5) * cell;
    const xs = [];
    for (const [x1, y1, x2, y2] of edges) {
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      let i0 = Math.ceil(xs[k] / cell - 0.5);
      let i1 = Math.floor(xs[k + 1] / cell - 0.5);
      if (i0 < 0) i0 = 0;
      if (i1 > gw - 1) i1 = gw - 1;
      for (let i = i0; i <= i1; i++) grid[j * gw + i] = 1;
    }
  }
  return grid;
}

export function geojsonRings(features) {
  const rings = [];
  for (const f of features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    for (const poly of polys) {
      for (const ring of poly) rings.push(ring);
    }
  }
  return rings;
}

export function decodeRings(topo) {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  const arcs = topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map((d) => {
      x += d[0]; y += d[1];
      return [x * sx + tx, y * sy + ty];
    });
  });
  const rings = [];
  for (const geom of topo.objects.land.geometries) {
    const polys = geom.type === "Polygon" ? [geom.arcs] : geom.arcs;
    for (const poly of polys) {
      for (const ringIdx of poly) {
        const pts = [];
        for (const i of ringIdx) {
          const arc = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
          for (let k = pts.length ? 1 : 0; k < arc.length; k++) pts.push(arc[k]);
        }
        rings.push(pts);
      }
    }
  }
  return rings;
}

export function rasterizeLand(rings) {
  return fillScanlines(ringsToEdges(rings, { px, py }), GW, GH, CELL);
}

export function distanceField(isZero, gw = GW, gh = GH, cell = CELL) {
  const INF = 1e7;
  const d = new Float32Array(gw * gh);
  for (let i = 0; i < d.length; i++) d[i] = isZero(i) ? 0 : INF;
  const A = 3, B = 4;
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const idx = j * gw + i;
      let v = d[idx];
      if (i > 0) v = Math.min(v, d[idx - 1] + A);
      if (j > 0) {
        v = Math.min(v, d[idx - gw] + A);
        if (i > 0) v = Math.min(v, d[idx - gw - 1] + B);
        if (i < gw - 1) v = Math.min(v, d[idx - gw + 1] + B);
      }
      d[idx] = v;
    }
  }
  for (let j = gh - 1; j >= 0; j--) {
    for (let i = gw - 1; i >= 0; i--) {
      const idx = j * gw + i;
      let v = d[idx];
      if (i < gw - 1) v = Math.min(v, d[idx + 1] + A);
      if (j < gh - 1) {
        v = Math.min(v, d[idx + gw] + A);
        if (i < gw - 1) v = Math.min(v, d[idx + gw + 1] + B);
        if (i > 0) v = Math.min(v, d[idx + gw - 1] + B);
      }
      d[idx] = v;
    }
  }
  const s = cell / 3;
  for (let i = 0; i < d.length; i++) d[i] *= s;
  return d;
}

function unwrapRing(ring) {
  const out = [[ring[0][0], ring[0][1]]];
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0];
    const prev = out[i - 1][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

function clipLon(ring, S, keepLess) {
  const out = [];
  const inside = (lon) => (keepLess ? lon <= S : lon >= S);
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const ina = inside(a[0]), inb = inside(b[0]);
    if (ina) out.push(a);
    if (ina !== inb) {
      const t = (S - a[0]) / (b[0] - a[0]);
      out.push([S, a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

function normalizeRing(ring) {
  for (const off of [0, 360, -360]) {
    let min = 1e9, max = -1e9;
    for (const [lon] of ring) {
      min = Math.min(min, lon + off); max = Math.max(max, lon + off);
    }
    if (min >= -180 && max <= 180) {
      return ring.map(([lon, lat]) => [lon + off, lat]);
    }
  }
  return null;
}

export function splitAntimeridianRings(rings) {
  const out = [];
  for (const ring of rings) {
    const u = unwrapRing(ring);
    let min = 1e9, max = -1e9;
    for (const [lon] of u) {
      min = Math.min(min, lon); max = Math.max(max, lon);
    }
    if (max - min < 1e-9) continue;
    let parts = [u];
    for (let S = 180 + 360 * Math.ceil((min - 180) / 360); S < max; S += 360) {
      const next = [];
      for (const part of parts) {
        let pMin = 1e9, pMax = -1e9;
        for (const [lon] of part) { pMin = Math.min(pMin, lon); pMax = Math.max(pMax, lon); }
        if (pMin < S && pMax > S) {
          next.push(clipLon(part, S, true), clipLon(part, S, false));
        } else {
          next.push(part);
        }
      }
      parts = next;
    }
    for (const part of parts) {
      if (part.length < 3) continue;
      const n = normalizeRing(part);
      if (n) out.push(n);
    }
  }
  return out;
}

export function snapToLand(land, x, y, gw = GW, gh = GH, cell = CELL) {
  const gi = Math.floor(x / cell), gj = Math.floor(y / cell);
  if (land[gj * gw + gi]) return [x, y];
  for (let rad = 1; rad <= 8; rad++) {
    for (let dj = -rad; dj <= rad; dj++) {
      for (let di = -rad; di <= rad; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== rad) continue;
        const i = gi + di, j = gj + dj;
        if (i < 0 || i >= gw || j < 0 || j >= gh) continue;
        if (land[j * gw + i]) return [(i + 0.5) * cell, (j + 0.5) * cell];
      }
    }
  }
  return [x, y];
}
