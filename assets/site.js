// Corridor de détour — démo interactive (Paris → Reims).
// Textes traduits fournis via data-* sur #budget-demo.
(function () {
  const root = document.getElementById('budget-demo');
  if (!root) return;
  const T = root.dataset;
  const pois = [
    { n: "Cathédrale de Meaux", km: 42, m: 3, s: 1, c: "castle" },
    { n: "Cryptes de Jouarre", km: 60, m: 9, s: -1, c: "castle" },
    { n: "Vieux château, Château-Thierry", km: 88, m: 2, s: 1, c: "castle" },
    { n: "Abbatiale d’Essômes", km: 94, m: 4, s: -1, c: "castle" },
    { n: "Château de Condé", km: 100, m: 7, s: 1, c: "castle" },
    { n: "Château de Fère-en-Tardenois", km: 106, m: 18, s: -1, c: "castle" },
    { n: "Mémorial de Dormans", km: 112, m: 3, s: 1, c: "flag" },
    { n: "Panorama de Châtillon-sur-Marne", km: 122, m: 12, s: -1, c: "view" },
    { n: "Abbaye d’Hautvillers", km: 132, m: 8, s: 1, c: "glass" },
    { n: "Faux de Verzy", km: 140, m: 32, s: -1, c: "tree" }
  ];
  const svg = document.getElementById('routeSvg'), NS = 'http://www.w3.org/2000/svg';
  const Y = 150;
  function el(t, a, p) {
    const e = document.createElementNS(NS, t);
    for (const k in a) {
      const v = String(a[k]);
      if (v.startsWith('var(')) e.style.setProperty(k, v); else e.setAttribute(k, v);
    }
    (p || svg).appendChild(e);
    return e;
  }
  const d = `M60 ${Y}C260 ${Y - 26} 420 ${Y + 30} 600 ${Y - 6}S860 ${Y + 18} 940 ${Y}`;
  el('path', { d, fill: 'none', stroke: 'var(--road)', 'stroke-width': 14, 'stroke-linecap': 'round' });
  const road = el('path', { d, fill: 'none', stroke: 'var(--road-dash)', 'stroke-width': 2, 'stroke-dasharray': '10 12' });
  const L = road.getTotalLength();
  const at = km => road.getPointAtLength(L * km / 145);
  [['Paris', 0], ['Reims', 145]].forEach(([t, k]) => {
    const p = at(k);
    el('circle', { cx: p.x, cy: p.y, r: 9, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 4 });
    el('text', { x: p.x, y: p.y + 40, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: 'var(--ink)' }).textContent = t;
  });
  const groups = pois.map((o, i) => {
    const p = at(o.km), dy = o.s * (62 + (i % 2) * 34), tx = p.x, ty = p.y + dy;
    const g = el('g', { class: 'poi-g' });
    el('path', { class: 'branch', d: `M${p.x} ${p.y}Q${p.x + 14} ${p.y + dy / 2} ${tx} ${ty}`, fill: 'none', stroke: 'var(--green)', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    el('rect', { x: tx - 15, y: ty - 15, width: 30, height: 30, rx: 6, fill: 'var(--sign)', stroke: '#fff', 'stroke-width': 1.5 }, g);
    el('use', { href: '#i-' + o.c, x: tx - 11, y: ty - 11, width: 22, height: 22 }, g);
    el('text', { x: tx, y: ty + (o.s > 0 ? 34 : -24), 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 600, fill: 'var(--ink-2)' }, g).textContent = o.m + ' km';
    const t = document.createElementNS(NS, 'title'); t.textContent = o.n; g.appendChild(t);
    return g;
  });
  const r = document.getElementById('budgetRange'), bv = document.getElementById('bv'),
        mode = document.getElementById('mode'), found = document.getElementById('found');
  function upd() {
    const b = +r.value, ok = pois.filter(o => o.m <= b);
    bv.textContent = b === 0 ? T.off : b + ' km';
    mode.textContent = b === 0 ? T.none : T.places.replace('{n}', ok.length);
    groups.forEach((g, i) => { const on = pois[i].m <= b; g.classList.toggle('on', on); g.classList.toggle('off', !on); });
    found.innerHTML = ok.length
      ? ok.map(o => `<li><span class="dot"></span>${o.n}<span class="m">${o.m} km</span></li>`).join('')
      : `<li>${T.empty}</li>`;
  }
  r.addEventListener('input', upd);
  upd();
})();
