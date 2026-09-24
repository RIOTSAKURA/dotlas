export function renderPage({ mapH, dotSvg, ridgeSvg, accentSvg, cardsHtml, dotCount, china, photoPops }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dotlas — a quiet atlas of places</title>
<link rel="icon" href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F9F8F6"/><circle cx="50" cy="50" r="24" fill="%231A2B4C"/></svg>'>
<style>
:root{--cream:#F9F8F6;--ink:#1A2B4C;--serif:"Didot","Bodoni MT","Playfair Display",Georgia,"Times New Roman",serif;--sans:"Avenir Next","Helvetica Neue",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{margin:0;box-sizing:border-box}
html,body{height:100%}
body{background:var(--cream);display:grid;place-items:center;font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased}
.stage{position:relative;width:min(100vw,177.78vh);aspect-ratio:16/9;container-type:size;overflow:hidden;touch-action:none;background:radial-gradient(120% 95% at 50% 42%,rgba(255,255,255,.55),rgba(255,255,255,0) 58%),var(--cream)}
.stage.dragging{user-select:none;-webkit-user-select:none}
.grain{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:multiply;opacity:.6}
.vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 105% at 50% 50%,rgba(26,43,76,0) 62%,rgba(26,43,76,.055) 100%)}
.frame{position:absolute;inset:2.1cqw;border:1px solid rgba(26,43,76,.10);pointer-events:none}
.cross{position:absolute;width:.8cqw;height:.8cqw;pointer-events:none;opacity:.38}
.cross::before,.cross::after{content:"";position:absolute;background:var(--ink)}
.cross::before{left:50%;top:0;width:1px;height:100%}
.cross::after{top:50%;left:0;height:1px;width:100%}
.wordmark{position:absolute;left:4.8cqw;top:4.4cqw;user-select:none}
.wordmark .logo{display:flex;align-items:center;font-size:1.7cqw;font-weight:600;letter-spacing:.34em;line-height:1}
.wordmark .logo svg{width:.52cqw;height:.52cqw;margin:0 .3cqw .06cqw .12cqw;flex:none}
.wordmark .tag{margin-top:1.1cqw;font-size:.64cqw;font-weight:500;letter-spacing:.34em;text-transform:uppercase;color:rgba(26,43,76,.50)}
.volume{position:absolute;right:4.8cqw;top:4.8cqw;font-size:.64cqw;font-weight:500;letter-spacing:.34em;text-transform:uppercase;color:rgba(26,43,76,.50)}
.map,.map-cn{position:absolute;will-change:transform,opacity}
.map{left:20%;top:27.2%;width:60%;opacity:0}
.map-cn{left:24%;top:13%;width:52%;opacity:1;animation:settle 1.15s cubic-bezier(.22,1,.36,1) backwards}
.map svg,.map-cn svg{display:block;width:100%;height:auto;overflow:visible}
.cn-stage{position:relative;display:block;width:100%;transition:transform .65s cubic-bezier(.22,1,.36,1)}
.map-cn .cn-base{display:block;width:100%;height:auto;overflow:visible;transition:opacity .5s ease}
.map-cn .pv{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;transition:transform .3s cubic-bezier(.22,1,.36,1),opacity .5s ease}
.map-cn .pv.lift{transform:translateY(-12px) scale(1.06)}
.map-cn .pv.lift > g,.map-cn .pv.active > g{fill:#1A2B4C}
.map-cn .pv.lift circle,.map-cn .pv.active circle{stroke:#F9F8F6;stroke-width:1.2;paint-order:stroke}
.map-cn .cn-hit{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.map-cn .cn-hit .hit{fill:transparent;pointer-events:fill;cursor:pointer}
.map-cn .cn-markers{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;opacity:0;transition:opacity .4s ease}
.map-cn .cn-markers .mks{display:none}
.map-cn .cn-markers .mk{cursor:pointer}
.map-cn .cn-accents{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;transition:opacity .5s ease}
.cn-stage.zoomed .pv:not(.active){opacity:0.13}
.cn-stage.zoomed .cn-base{opacity:0.22}
.cn-stage.zoomed .cn-accents{opacity:0}
.cn-stage.zoomed .cn-markers{opacity:1;pointer-events:auto}
.cn-stage.zoomed .cn-markers .mks.on{display:block}
.photo-pop{position:absolute;inset:0;pointer-events:none;z-index:3}
.photo-pop .card{opacity:0;transition:opacity .35s ease;left:0;top:0;animation:none}
.photo-pop .card.on{opacity:1}
.map-cn .cn-accents{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.map .ring,.map-cn .ring{transform-box:fill-box;transform-origin:center;animation:pulse 4.6s cubic-bezier(.45,0,.55,1) infinite;animation-delay:var(--d,0s)}
@keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.12;transform:scale(1.5)}}
@keyframes settle{from{opacity:0;transform:scale(1.05)}to{opacity:1;transform:scale(1)}}
.cards{position:absolute;inset:0;opacity:0}
.card{position:absolute;width:var(--w);background:#fff;padding:1.05cqw 1.05cqw 1.3cqw;rotate:var(--rot);box-shadow:0 1px 2px rgba(26,43,76,.05),0 5px 12px rgba(26,43,76,.06),0 18px 38px rgba(26,43,76,.10),0 40px 80px rgba(26,43,76,.07);animation:drift var(--dur) cubic-bezier(.45,0,.55,1) var(--delay) infinite alternate;transition:translate .5s ease,box-shadow .5s ease}
.card:hover{translate:0 -.9cqw;box-shadow:0 1px 2px rgba(26,43,76,.05),0 8px 18px rgba(26,43,76,.08),0 26px 52px rgba(26,43,76,.12),0 56px 110px rgba(26,43,76,.09)}
.card .photo{aspect-ratio:var(--ar);background:linear-gradient(178deg,#EFEBE6,#E5E1DA);overflow:hidden}
.card .photo svg{display:block;width:100%;height:100%}
.card figcaption{margin:1.3cqw .2cqw .2cqw;text-align:center;font-size:.58cqw;font-weight:500;letter-spacing:.3em;text-transform:uppercase;color:rgba(26,43,76,.54)}
@keyframes drift{from{transform:translateY(-.35cqw)}to{transform:translateY(.5cqw)}}
.fig,.folio,.serif-line{display:grid}
.fig span,.folio span,.serif-line span{grid-area:1/1}
.fig{position:absolute;left:4.8cqw;bottom:4.8cqw;font-size:.62cqw;font-weight:500;letter-spacing:.3em;text-transform:uppercase;color:rgba(26,43,76,.52)}
.folio{position:absolute;right:4.8cqw;bottom:4.8cqw;font-size:.62cqw;font-weight:500;letter-spacing:.3em;text-transform:uppercase;color:rgba(26,43,76,.52)}
.folio span{justify-self:end}
.serif-line{position:absolute;left:50%;bottom:4.2cqw;transform:translateX(-50%);font-family:var(--serif);font-style:italic;font-size:1.4cqw;letter-spacing:.05em;color:rgba(26,43,76,.62);white-space:nowrap}
.serif-line span{justify-self:center}
.fig .b,.folio .b,.serif-line .b{opacity:0}
.hint{position:absolute;left:50%;bottom:10.6%;transform:translateX(-50%);display:flex;align-items:center;gap:.9cqw;font-size:.62cqw;font-weight:500;letter-spacing:.3em;text-transform:uppercase;color:rgba(26,43,76,.48);user-select:none;pointer-events:none}
.hint .wheel{width:.92cqw;height:1.5cqw;border:1px solid rgba(26,43,76,.42);border-radius:.46cqw;position:relative;overflow:hidden;flex:none}
.hint .wheel i{position:absolute;left:50%;top:.16cqw;width:.24cqw;height:.24cqw;margin-left:-.12cqw;border-radius:50%;background:rgba(26,43,76,.55);animation:wheelDot 1.9s ease-in-out infinite}
@keyframes wheelDot{0%{transform:translateY(0);opacity:0}30%{opacity:1}65%{transform:translateY(.75cqw);opacity:1}100%{transform:translateY(.75cqw);opacity:0}}
@media (prefers-reduced-motion:reduce){.card,.map .ring,.map-cn .ring,.map-cn .cn-markers .ring,.hint .wheel i{animation:none}.map-cn{animation:none}.map-cn .pv{transition:none}.cn-stage{transition:none}}
</style>
</head>
<body>
<div class="stage" id="stage">
  <svg class="grain" aria-hidden="true"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch" seed="11"/><feColorMatrix values="0 0 0 0 0.10 0 0 0 0 0.11 0 0 0 0 0.15 0 0 0 0.05 0"/></filter><rect width="100%" height="100%" filter="url(#grain)"/></svg>
  <div class="vignette"></div>
  <div class="frame"></div>
  <span class="cross" style="left:calc(2.1cqw - .4cqw);top:calc(2.1cqw - .4cqw)"></span>
  <span class="cross" style="right:calc(2.1cqw - .4cqw);top:calc(2.1cqw - .4cqw)"></span>
  <span class="cross" style="left:calc(2.1cqw - .4cqw);bottom:calc(2.1cqw - .4cqw)"></span>
  <span class="cross" style="right:calc(2.1cqw - .4cqw);bottom:calc(2.1cqw - .4cqw)"></span>
  <header class="wordmark">
    <div class="logo"><span>d</span><svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.2" fill="currentColor"/></svg><span>tlas</span></div>
    <div class="tag">A Quiet Atlas of Places</div>
  </header>
  <div class="volume">Vol. 01 — MMXXVI</div>
  <div class="map" id="mapWorld" role="img" aria-label="World map drawn in stippled dots, denser and darker inland">
    <svg viewBox="0 0 1000 ${mapH}">
      ${ridgeSvg}
      ${dotSvg}
      ${accentSvg}
    </svg>
  </div>
  <div class="map-cn" id="mapChina" role="img" aria-label="Map of China drawn in stippled dots, denser and darker inland">
    <div class="cn-stage" id="cnStage">
    ${china.svg}
    </div>
  </div>
  <div class="cards" id="cards">
      ${cardsHtml}
  </div>
  <div class="photo-pop" id="photoPops">
      ${photoPops}
  </div>
  <div class="hint" id="hint"><span class="wheel"><i></i></span><span>Scroll — zoom out to the world</span></div>
  <div class="fig"><span class="a">Fig. 01 — China in ${china.dotCount.toLocaleString("en-US")} Points</span><span class="b">Fig. 02 — The World in ${dotCount.toLocaleString("en-US")} Points</span></div>
  <div class="serif-line"><span class="a">of dots &amp; the middle kingdom</span><span class="b">of dots &amp; distant places</span></div>
  <div class="folio"><span class="a">39.90° N — 116.40° E</span><span class="b">35.01° N — 135.77° E</span></div>
</div>
<script>
(() => {
  const stage = document.getElementById("stage");
  const world = document.getElementById("mapWorld");
  const cn = document.getElementById("mapChina");
  const cards = document.getElementById("cards");
  const hint = document.getElementById("hint");
  const aEls = stage.querySelectorAll(".fig .a,.serif-line .a,.folio .a");
  const bEls = stage.querySelectorAll(".fig .b,.serif-line .b,.folio .b");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let z = 0, zt = 0, last = performance.now(), idle = 0, dismissed = false;
  let unlift = () => {};
  let zoomed = null;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  function apply() {
    const fw = smooth(0.32, 0.72, z);
    const fc = smooth(0.26, 0.66, z);
    world.style.opacity = fw.toFixed(3);
    world.style.transform = "scale(" + (0.94 + 0.06 * fw).toFixed(4) + ")";
    world.setAttribute("aria-hidden", fw < 0.5 ? "true" : "false");
    world.style.pointerEvents = fw > 0.5 ? "" : "none";
    if (fw > 0.5 && zoomed) unzoom();
    cn.style.opacity = (1 - fc).toFixed(3);
    cn.style.transform = "scale(" + (1 - 0.1 * fc).toFixed(4) + ")";
    cn.setAttribute("aria-hidden", fw >= 0.5 ? "true" : "false");
    cn.style.pointerEvents = fw > 0.5 || zoomed ? "" : "none";
    if (fw > 0.5) unlift();
    const fCards = smooth(0.55, 0.88, z);
    cards.style.opacity = fCards.toFixed(3);
    cards.style.pointerEvents = fCards > 0.5 ? "" : "none";
    const ft = smooth(0.42, 0.62, z);
    aEls.forEach((el) => (el.style.opacity = (1 - ft).toFixed(3)));
    bEls.forEach((el) => (el.style.opacity = ft.toFixed(3)));
    hint.style.opacity = zoomed ? 0 : (dismissed ? 0 : clamp(1 - z * 4, 0, 1)).toFixed(3);
  }

  function tick(now) {
    const k = reduced ? 1 : 1 - Math.exp(-(now - last) * 0.009);
    z += (zt - z) * k;
    if (Math.abs(zt - z) < 0.0004) z = zt;
    apply();
    last = now;
    requestAnimationFrame(tick);
  }

  function nudge(d) {
    zt = clamp(zt + d, 0, 1);
    if (zt > 0.6) dismissed = true;
    clearTimeout(idle);
    idle = setTimeout(() => { zt = zt < 0.5 ? 0 : 1; }, 380);
  }

  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (zoomed) { unzoom(); return; }
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? stage.clientHeight : 1;
    nudge((e.deltaY * unit) / 380);
  }, { passive: false });

  const pts = new Map();
  let dragY = null, pinchD = 0;

  window.addEventListener("pointerdown", (e) => {
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) {
      const [p1, p2] = [...pts.values()];
      pinchD = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      dragY = null;
    } else if (pts.size === 1) {
      dragY = e.clientY;
    }
    stage.classList.add("dragging");
  });

  window.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinchD > 0) {
      if (zoomed) { unzoom(); pinchD = 0; return; }
      const [p1, p2] = [...pts.values()];
      const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      nudge(-(d / pinchD - 1) * 2.2);
      pinchD = d;
    } else if (dragY != null) {
      const dy = e.clientY - dragY;
      dragY = e.clientY;
      if (dy === 0) return;
      if (zoomed) { unzoom(); return; }
      nudge(-dy / 260);
    }
  });

  const release = (e) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinchD = 0;
    if (pts.size === 0) { dragY = null; stage.classList.remove("dragging"); }
    else if (pts.size === 1) { dragY = [...pts.values()][0][1]; }
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  const pvByName = new Map();
  cn.querySelectorAll(".pv[data-p]").forEach((s) => pvByName.set(s.dataset.p, s));
  let lifted = null;
  unlift = () => {
    if (lifted) { lifted.classList.remove("lift"); lifted = null; }
  };
  cn.querySelectorAll(".cn-hit .hit").forEach((h) => {
    h.addEventListener("mouseenter", () => {
      if (zoomed) return;
      unlift();
      const svg = pvByName.get(h.dataset.p);
      if (svg) { svg.classList.add("lift"); lifted = svg; }
    });
    h.addEventListener("mouseleave", unlift);
    h.addEventListener("click", (e) => {
      e.stopPropagation();
      const svg = pvByName.get(h.dataset.p);
      if (svg) zoomTo(svg);
    });
  });

  const cnStage = document.getElementById("cnStage");
  const pops = document.getElementById("photoPops");
  const popFigs = pops ? [...pops.querySelectorAll(".card")] : [];

  function hidePop() {
    popFigs.forEach((f) => f.classList.remove("on"));
  }

  function showPop(cardIdx, mk) {
    const fig = popFigs[cardIdx];
    if (!fig) return;
    const r = mk.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const w = fig.offsetWidth || 170;
    const hgt = fig.offsetHeight || 210;
    let x = clamp(r.left + r.width / 2 - sr.left, w / 2 + 24, sr.width - w / 2 - 24);
    let y = r.top - 16 - sr.top;
    let below = false;
    if (y - hgt < 10) { y = r.bottom - sr.top + 16; below = true; }
    fig.style.left = x + "px";
    fig.style.top = y + "px";
    fig.style.transform = below ? "translate(-50%, 0)" : "translate(-50%, -100%)";
    popFigs.forEach((f) => f.classList.toggle("on", f === fig));
  }

  function zoomTo(svg) {
    if (zoomed === svg) return;
    hidePop();
    if (zoomed) zoomed.classList.remove("active");
    unlift();
    const cx = +svg.dataset.cx, cy = +svg.dataset.cy;
    const w = +svg.dataset.w, h = +svg.dataset.h;
    const box = cn.getBoundingClientRect();
    const k = box.width / 1000;
    const s = clamp(Math.min((0.82 * box.width) / (w * k), (0.74 * box.height) / (h * k)), 1.6, 3.4);
    const dx = s * (box.width / 2 - cx * k);
    const dy = s * (box.height / 2 - cy * k);
    cnStage.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
    cnStage.classList.add("zoomed");
    cn.querySelectorAll(".mks").forEach((g) => g.classList.toggle("on", g.dataset.p === svg.dataset.p));
    svg.classList.add("active");
    zoomed = svg;
  }

  function unzoom() {
    hidePop();
    cnStage.style.transform = "";
    cnStage.classList.remove("zoomed");
    cn.querySelectorAll(".mks.on").forEach((g) => g.classList.remove("on"));
    if (zoomed) { zoomed.classList.remove("active"); zoomed = null; }
  }

  cn.querySelectorAll(".cn-markers .mk").forEach((mk) => {
    mk.addEventListener("mouseenter", () => showPop(+mk.dataset.card, mk));
    mk.addEventListener("mouseleave", hidePop);
    mk.addEventListener("click", (e) => e.stopPropagation());
  });

  window.addEventListener("click", (e) => {
    if (zoomed && !e.target.closest(".hit") && !e.target.closest(".mk")) unzoom();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && zoomed) unzoom();
  });

  apply();
  requestAnimationFrame(tick);
})();
</script>
</body>
</html>
`;
}
