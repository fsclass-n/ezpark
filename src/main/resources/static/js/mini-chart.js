/* =========================================================
   EzPark - MiniChart (Vanilla SVG Chart, 담당: 박미금)
   외부 라이브러리 없이 line / bar / donut / heatmap 지원
   사용: const c = MiniChart.line(el, { labels, series }); c.update({ series })
   ========================================================= */

const MiniChart = (() => {
  const niceMax = v => {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    return [1, 2, 2.5, 5, 10].map(m => m * p).find(m => m >= v);
  };
  const fmtNum = v => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : Math.round(v * 10) / 10);

  function mount(el, opts, draw) {
    el.classList.add('chart');
    const state = { ...opts };
    let lastW = 0;
    const render = () => {
      const w = el.clientWidth || 300;
      lastW = w;
      el.innerHTML = '';
      const tip = document.createElement('div');
      tip.className = 'chart-tip';
      el.insertAdjacentHTML('afterbegin', draw(w, state));
      el.appendChild(tip);
      bindTip(el, tip, state);
    };
    new ResizeObserver(() => { if (Math.abs(el.clientWidth - lastW) > 2) render(); }).observe(el);
    render();
    return { update(o) { Object.assign(state, o); render(); }, el };
  }

  function bindTip(el, tip, state) {
    el.querySelectorAll('[data-tip]').forEach(node => {
      node.addEventListener('mouseenter', () => { tip.innerHTML = node.dataset.tip; tip.classList.add('show'); });
      node.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        tip.style.left = `${e.clientX - r.left}px`;
        tip.style.top = `${e.clientY - r.top}px`;
      });
      node.addEventListener('mouseleave', () => tip.classList.remove('show'));
    });
    if (state._hover) state._hover(el, tip, state);
  }

  function smooth(pts) {
    if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  function axes(W, H, P, min, max, y, suffix) {
    let s = '';
    for (let k = 0; k <= 4; k++) {
      const v = min + ((max - min) * k) / 4;
      s += `<g class="grid"><line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/></g>
            <g class="axis"><text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmtNum(v)}${suffix}</text></g>`;
    }
    return s;
  }

  function xLabels(labels, x, H, P, iw) {
    const step = Math.max(1, Math.ceil(labels.length / Math.max(1, iw / 52)));
    return labels.map((l, i) => (i % step ? '' : `<g class="axis"><text x="${x(i)}" y="${H - 6}" text-anchor="middle">${l}</text></g>`)).join('');
  }

  /* ---------- Line ---------- */
  function line(el, opts) {
    const uid = Math.random().toString(36).slice(2, 8);
    opts._hover = (host, tip, st) => {
      const ov = host.querySelector('.hover-rect');
      const guide = host.querySelector('.hover-line');
      if (!ov) return;
      const { labels, series } = st;
      const P = st._P, iw = st._iw, n = labels.length;
      ov.addEventListener('mousemove', e => {
        const r = host.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const i = Math.max(0, Math.min(n - 1, Math.round(((mx - P.l) / iw) * (n - 1))));
        const gx = P.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
        guide.setAttribute('x1', gx); guide.setAttribute('x2', gx); guide.style.opacity = 1;
        tip.innerHTML = `<b>${labels[i]}</b><br>${series.filter(s => s.data[i] != null).map(s => `<span style="color:${s.color}">●</span> ${s.name}: ${s.data[i]}${st.suffix || ''}`).join('<br>')}`;
        tip.style.left = `${gx}px`; tip.style.top = `${e.clientY - r.top}px`;
        tip.classList.add('show');
      });
      ov.addEventListener('mouseleave', () => { tip.classList.remove('show'); guide.style.opacity = 0; });
    };
    return mount(el, opts, (W, o) => {
      const H = o.height || 260, P = { l: 42, r: 14, t: 14, b: 28 };
      const iw = W - P.l - P.r, ih = H - P.t - P.b, n = o.labels.length;
      o._P = P; o._iw = iw;
      const vals = o.series.flatMap(s => s.data.filter(v => v != null));
      const min = o.yMin ?? 0, max = o.yMax ?? niceMax(Math.max(...vals));
      const x = i => P.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
      const y = v => P.t + ih - ((v - min) / (max - min)) * ih;
      let s = `<svg width="${W}" height="${H}" role="img"><defs>`;
      o.series.forEach((sr, si) => {
        s += `<linearGradient id="g${uid}${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sr.color}" stop-opacity=".28"/><stop offset="1" stop-color="${sr.color}" stop-opacity="0"/></linearGradient>`;
      });
      s += `</defs>${axes(W, H, P, min, max, y, o.suffix || '')}${xLabels(o.labels, x, H, P, iw)}`;
      if (o.band) s += `<rect x="${x(o.band[0])}" y="${P.t}" width="${x(o.band[1]) - x(o.band[0])}" height="${ih}" fill="#2f6bff" opacity=".05"/>`;
      o.series.forEach((sr, si) => {
        const segs = [];
        let cur = [];
        sr.data.forEach((v, i) => { if (v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([x(i), y(v)]); });
        if (cur.length) segs.push(cur);
        segs.forEach(pts => {
          const d = smooth(pts);
          if (sr.fill) s += `<path d="${d} L${pts[pts.length - 1][0]},${P.t + ih} L${pts[0][0]},${P.t + ih} Z" fill="url(#g${uid}${si})"/>`;
          s += `<path d="${d}" fill="none" stroke="${sr.color}" stroke-width="${sr.width || 2.5}" stroke-linecap="round" ${sr.dash ? 'stroke-dasharray="6 5"' : ''}/>`;
          if (n <= 32 && !sr.noDots) pts.forEach(p => { s += `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="3" fill="#fff" stroke="${sr.color}" stroke-width="2"/>`; });
        });
      });
      s += `<line class="hover-line" y1="${P.t}" y2="${P.t + ih}" stroke="#9aa5b8" stroke-dasharray="3 3" style="opacity:0"/>`;
      s += `<rect class="hover-rect" x="${P.l}" y="${P.t}" width="${iw}" height="${ih}" fill="transparent"/></svg>`;
      return s;
    });
  }

  /* ---------- Bar (grouped) ---------- */
  function bar(el, opts) {
    return mount(el, opts, (W, o) => {
      const H = o.height || 260, P = { l: 42, r: 10, t: 14, b: 28 };
      const iw = W - P.l - P.r, ih = H - P.t - P.b, n = o.labels.length, m = o.series.length;
      const max = o.yMax ?? niceMax(Math.max(...o.series.flatMap(s => s.data)));
      const y = v => P.t + ih - (v / max) * ih;
      const band = iw / n;
      const bw = Math.min(o.barMax || 26, (band * 0.7) / m);
      const x = i => P.l + band * i + band / 2;
      let s = `<svg width="${W}" height="${H}" role="img">${axes(W, H, P, 0, max, y, o.suffix || '')}${xLabels(o.labels, x, H, P, iw)}`;
      o.series.forEach((sr, si) => {
        sr.data.forEach((v, i) => {
          const bx = x(i) - (bw * m) / 2 + bw * si + 1;
          const color = typeof sr.color === 'function' ? sr.color(v, i) : sr.color;
          s += `<rect x="${bx}" y="${y(v)}" width="${bw - 2}" height="${Math.max(0, P.t + ih - y(v))}" rx="4" fill="${color}" data-tip="<b>${o.labels[i]}</b><br>${sr.name}: ${v}${o.suffix || ''}"/>`;
        });
      });
      return `${s}</svg>`;
    });
  }

  /* ---------- Donut ---------- */
  function donut(el, opts) {
    return mount(el, opts, (W, o) => {
      const S = Math.min(o.size || 200, W), r = S / 2 - 14, C = 2 * Math.PI * r, sw = o.stroke || 24;
      const total = o.data.reduce((a, b) => a + b, 0);
      let off = 0;
      let s = `<div class="text-center"><svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img"><g transform="rotate(-90 ${S / 2} ${S / 2})">
        <circle cx="${S / 2}" cy="${S / 2}" r="${r}" fill="none" stroke="#eef1f7" stroke-width="${sw}"/>`;
      o.data.forEach((v, i) => {
        const len = (v / total) * C;
        s += `<circle cx="${S / 2}" cy="${S / 2}" r="${r}" fill="none" stroke="${o.colors[i]}" stroke-width="${sw}" stroke-dasharray="${Math.max(0, len - 2)} ${C}" stroke-dashoffset="${-off}" data-tip="<b>${o.labels[i]}</b> ${v}${o.suffix || ''} (${Math.round((v / total) * 100)}%)" style="cursor:pointer"/>`;
        off += len;
      });
      s += `</g>`;
      if (o.center) s += `<text x="50%" y="47%" text-anchor="middle" style="font:800 ${S / 7}px Montserrat;fill:#0b1f3a">${o.center.value}</text><text x="50%" y="60%" text-anchor="middle" style="font:500 ${S / 16}px 'Noto Sans KR';fill:#9aa5b8">${o.center.label}</text>`;
      s += `</svg></div><div class="chart-legend justify-content-center mt-3">${o.labels.map((l, i) => `<span><i style="background:${o.colors[i]};height:10px;width:10px;border-radius:3px"></i>${l}</span>`).join('')}</div>`;
      return s;
    });
  }

  /* ---------- Heatmap ---------- */
  function heatmap(el, opts) {
    const stops = [[234, 240, 255], [47, 107, 255], [255, 77, 94]];
    const color = t => {
      const [a, b, k] = t < 0.6 ? [stops[0], stops[1], t / 0.6] : [stops[1], stops[2], (t - 0.6) / 0.4];
      return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * k)).join(',')})`;
    };
    return mount(el, opts, (W, o) => {
      const P = { l: 34, t: 4, b: 22 }, cols = o.cols.length, rows = o.rows.length;
      const cw = (W - P.l) / cols, ch = o.cellH || 26, H = P.t + rows * ch + P.b;
      const flat = o.data.flat(), min = Math.min(...flat), max = Math.max(...flat);
      let s = `<svg width="${W}" height="${H}" role="img">`;
      o.data.forEach((row, ri) => {
        s += `<g class="axis"><text x="${P.l - 8}" y="${P.t + ri * ch + ch / 2 + 4}" text-anchor="end">${o.rows[ri]}</text></g>`;
        row.forEach((v, ci) => {
          s += `<rect class="heat-cell" x="${P.l + ci * cw + 1}" y="${P.t + ri * ch + 1}" width="${cw - 2}" height="${ch - 2}" rx="3" fill="${color((v - min) / (max - min || 1))}" data-tip="${o.rows[ri]} ${o.cols[ci]} · ${v}${o.suffix || ''}"/>`;
        });
      });
      const step = Math.ceil(cols / Math.max(1, (W - P.l) / 34));
      o.cols.forEach((c, ci) => { if (ci % step === 0) s += `<g class="axis"><text x="${P.l + ci * cw + cw / 2}" y="${H - 6}" text-anchor="middle">${c}</text></g>`; });
      return `${s}</svg>`;
    });
  }

  return { line, bar, donut, heatmap };
})();
