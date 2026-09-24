export const PLACES = [
  { name: "Kyoto", lon: 135.77, lat: 35.01 },
  { name: "Patagonia", lon: -72.9, lat: -50.6 },
  { name: "Oslo", lon: 10.75, lat: 59.91 },
  { name: "Lisbon", lon: -9.14, lat: 38.72 },
  { name: "Hokkaido", lon: 142.65, lat: 43.31 },
];

export const RIDGES = [
  [[-152, 64], [-148, 61], [-143, 60]],
  [[-152, 61], [-146, 60], [-137, 58], [-128, 51], [-120, 48], [-114, 44], [-108, 40], [-106, 35], [-105, 31]],
  [[-123, 48], [-120, 42], [-118, 37]],
  [[-106, 26], [-103, 23], [-100, 20]],
  [[-84, 34], [-81, 36], [-78, 38], [-75, 41], [-72, 44]],
  [[-74, 8], [-77, 2], [-78, -4], [-75, -10], [-70, -16], [-69, -22], [-70, -28], [-71, -34], [-72, -40], [-71, -46], [-73, -52]],
  [[-8, 32], [-5, 33], [-2, 34]],
  [[5, 44], [8, 46], [12, 47], [16, 47]],
  [[19, 49], [22, 46], [25, 45]],
  [[6, 58], [8, 61], [12, 64], [16, 68]],
  [[58, 52], [59, 57], [60, 62], [62, 67]],
  [[40, 44], [45, 42], [48, 41]],
  [[46, 35], [50, 32], [54, 29]],
  [[70, 36], [75, 34], [79, 31], [84, 29], [89, 28], [94, 29]],
  [[82, 32], [90, 33], [98, 33], [102, 32]],
  [[76, 42], [84, 45], [92, 49], [98, 52]],
  [[128, 66], [132, 62], [136, 60]],
  [[137, 35], [140, 38]],
  [[37, 9], [39, 6], [40, 3]],
  [[30, -27], [28, -30], [26, -32]],
  [[147, -38], [149, -34], [151, -29], [153, -25]],
  [[168, -44], [171, -43], [174, -41]],
  [[134, -4], [140, -6], [146, -8]],
];

export const CHINA_PLACES = [
  { name: "Beijing", lon: 116.40, lat: 39.90 },
  { name: "Shanghai", lon: 121.47, lat: 31.23 },
  { name: "Chengdu", lon: 104.07, lat: 30.57 },
  { name: "Lhasa", lon: 91.11, lat: 29.65 },
  { name: "Urumqi", lon: 87.62, lat: 43.79 },
];

export const CHINA_RIDGES = [
  [[79, 31], [82, 29.5], [86, 28.5], [90, 28.2], [94, 28.5], [96.5, 29]],
  [[75.5, 36.8], [79, 35.8], [83, 35.5], [87, 36], [91, 36.5]],
  [[73.8, 41.5], [78, 42.3], [83, 43], [88, 43.4], [93, 43.2]],
  [[86.5, 48.5], [90, 48.7], [94.5, 48.9]],
  [[93, 38.8], [97, 38.7], [101, 38.2]],
  [[97.5, 27.8], [99.5, 29.5], [101, 31.5], [102.5, 33.5]],
  [[103.5, 33.8], [107, 33.8], [110.5, 33.4]],
  [[113.4, 35.2], [113.8, 37.5], [114.6, 40.2]],
  [[106.5, 41], [110.5, 41.6], [114.5, 41.6], [118.5, 40.8]],
  [[119.5, 50.3], [121.3, 47.2], [122.8, 45.2]],
  [[126.5, 48.2], [127.8, 45.3], [128.8, 42.3]],
  [[125.8, 41.8], [128, 41.5], [130.3, 41.8]],
  [[107.5, 31.5], [108.8, 29.5], [110, 27.8]],
  [[116.5, 27.5], [117.5, 26], [118.5, 24.5]],
  [[110, 25.2], [113, 24.6], [116, 24.4]],
  [[121, 24.3], [121.4, 23.2], [121.8, 22.6]],
  [[108.8, 19.2], [109.6, 18.7]],
  [[80.5, 31.5], [85, 30.8], [89.5, 30.2]],
];

export const CARDS_ENABLED = false;

export const CARDS = [
  {
    id: "kyoto", left: 6.9, top: 15, w: 13.4, rot: -6.5, dur: "8.4s", delay: "0s",
    ar: "4/5", vb: "0 0 320 400", caption: "Kyoto · 11.24",
    art: `<circle cx="228" cy="86" r="34" fill="#1A2B4C" opacity="0.12"/>` +
      `<path d="M0 400V258L52 196 96 236 150 172 204 224 258 190 320 240V400Z" fill="#D3CFC8"/>` +
      `<path d="M0 400V312L64 252 118 292 180 232 246 288 320 246V400Z" fill="#B9B5AE"/>`,
  },
  {
    id: "patagonia", left: 5.6, top: 53, w: 14.6, rot: 4, dur: "9.6s", delay: "1.6s",
    ar: "1/1", vb: "0 0 400 400", caption: "Patagonia · 01.25",
    art: `<circle cx="96" cy="112" r="26" fill="#1A2B4C" opacity="0.10"/>` +
      `<path d="M0 400V330L80 262 160 300 240 252 320 292 400 258V400Z" fill="#D8D4CD"/>` +
      `<path d="M0 400V296H58L92 118 126 296H168L204 150 238 296H284L322 132 356 296H400V400Z" fill="#C2BEB7"/>`,
  },
  {
    id: "oslo", left: 76.8, top: 10.8, w: 11.2, rot: 6, dur: "7.8s", delay: "0.8s",
    ar: "4/5", vb: "0 0 320 400", caption: "Oslo · 03.26",
    art: `<circle cx="88" cy="96" r="30" fill="#1A2B4C" opacity="0.10"/>` +
      `<path d="M0 400V236L48 190 104 226 156 178 214 220 268 186 320 216V400Z" fill="#D5D1CA"/>` +
      `<rect x="0" y="300" width="320" height="100" fill="#C9C5BE"/>` +
      `<rect x="60" y="318" width="70" height="4" rx="2" fill="#1A2B4C" opacity="0.16"/>` +
      `<rect x="78" y="338" width="52" height="4" rx="2" fill="#1A2B4C" opacity="0.12"/>` +
      `<rect x="66" y="358" width="60" height="4" rx="2" fill="#1A2B4C" opacity="0.08"/>` +
      `<path d="M0 400V318L96 274 200 400Z" fill="#A5A19A"/>`,
  },
  {
    id: "lisbon", left: 77.6, top: 44.4, w: 12.8, rot: -4.5, dur: "10.2s", delay: "2.2s",
    ar: "5/4", vb: "0 0 400 320", caption: "Lisbon · 06.25",
    art: `<circle cx="306" cy="74" r="30" fill="#1A2B4C" opacity="0.12"/>` +
      `<path d="M0 320V214Q40 168 92 204T186 196Q232 158 284 198T400 186V320Z" fill="#CFCBC4"/>` +
      `<path d="M0 320V258Q70 214 148 252T310 246Q356 226 400 250V320Z" fill="#B7B3AC"/>`,
  },
  {
    id: "hokkaido", left: 73.8, top: 66, w: 10.6, rot: 7.5, dur: "7.2s", delay: "3s",
    ar: "1/1", vb: "0 0 400 400", caption: "Hokkaido · 12.24",
    art: `<circle cx="118" cy="100" r="28" fill="#1A2B4C" opacity="0.12"/>` +
      `<path d="M0 400V300Q100 258 200 300T400 292V400Z" fill="#D6D2CB"/>` +
      `<polygon points="296,296 284,332 308,332" fill="#9C988F"/>` +
      `<polygon points="324,304 315,330 333,330" fill="#9C988F"/>` +
      `<path d="M0 400V336Q100 300 200 336T400 330V400Z" fill="#C3BFB8"/>` +
      `<path d="M0 400V372Q100 344 200 372T400 368V400Z" fill="#B2AEA7"/>`,
  },
];

export function renderPhotoPops(cards) {
  return cards
    .map(
      (c, i) =>
        `<figure class="card pop" data-i="${i}" style="--w:13cqw;--rot:${c.rot}deg;--dur:${c.dur};--delay:${c.delay};--ar:${c.ar}">` +
        `<div class="photo"><svg viewBox="${c.vb}" preserveAspectRatio="xMidYMid slice">${c.art}</svg></div>` +
        `<figcaption>${c.caption}</figcaption></figure>`
    )
    .join("");
}

export function renderCardsHtml(cards) {
  return cards.map(
    (c) => `<figure class="card" style="left:${c.left}%;top:${c.top}%;--w:${c.w}%;--rot:${c.rot}deg;--dur:${c.dur};--delay:${c.delay};--ar:${c.ar}">` +
      `<div class="photo"><svg viewBox="${c.vb}" preserveAspectRatio="xMidYMid slice">${c.art}</svg></div>` +
      `<figcaption>${c.caption}</figcaption></figure>`
  ).join("\n      ");
}
