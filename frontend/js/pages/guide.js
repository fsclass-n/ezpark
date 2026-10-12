/* 주차 유도 (담당: 홍기흥) */
(() => {
  const { $, $$, fmt, timeStr, url, toast, esc } = EZ;
  const lots = EZ_DATA.lots;
  const params = new URLSearchParams(location.search);

  /* ----- 지도 좌표계 (viewBox 1000 x 540) ----- */
  const COLS = 14, X0 = 92, STEP = 58, SW = 54;
  const ROWS = { A: { y: 20, lane: 140, side: 'L' }, B: { y: 180, lane: 140, side: 'R' }, C: { y: 260, lane: 380, side: 'R' }, D: { y: 420, lane: 380, side: 'L' } };
  const SH = 80, ENTRY = [84, 140], RIGHT_X = 952, ELEV = [43, 260], M_PER_PX = 0.05;

  let lot = lots.find(l => l.id === +params.get('lot')) || lots[0];
  let floor = lot.floors[0];
  let slots = [];
  let selected = null;
  let simRaf = null;
  let simulating = false;
  const cache = {};

  const seeded = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  function buildSlots(l, f) {
    const key = `${l.id}-${f}`;
    if (cache[key]) return cache[key];
    const rnd = seeded(l.id * 31 + l.floors.indexOf(f) * 7 + 3);
    const baseOcc = 1 - l.available / l.total;
    const occ = Math.min(0.96, Math.max(0.35, baseOcc + (l.floors.indexOf(f) * 0.08 - 0.08)));
    const list = [];
    Object.keys(ROWS).forEach(r => {
      for (let i = 0; i < COLS; i++) {
        let kind = 'normal';
        if (r === 'A' && i < 2) kind = 'dis';
        if (r === 'D' && i >= 10 && l.ev) kind = 'ev';
        const rv = rnd();
        const state = rv < occ ? 'busy' : rv < occ + 0.04 ? 'rsv' : 'free';
        list.push({ id: `${r}-${String(i + 1).padStart(2, '0')}`, row: r, col: i, kind, state });
      }
    });
    return (cache[key] = list);
  }

  const cx = s => X0 + s.col * STEP + SW / 2;
  const cy = s => ROWS[s.row].y + SH / 2;
  const cls = s => (s.state === 'busy' ? 'busy' : s.state === 'rsv' ? 'rsv' : s.kind === 'ev' ? 'ev' : s.kind === 'dis' ? 'dis' : 'free');
  const available = s => s.state === 'free';

  function routePoints(s) {
    const r = ROWS[s.row], x = cx(s), edge = s.row === 'A' ? r.y + SH - 6 : s.row === 'D' ? r.y + 6 : (s.row === 'B' ? r.y + 6 : r.y + SH - 6);
    if (r.lane === 140) return [ENTRY, [x, 140], [x, edge]];
    return [ENTRY, [RIGHT_X, 140], [RIGHT_X, 380], [x, 380], [x, edge]];
  }
  const pathLen = pts => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  const walkLen = s => Math.abs(cx(s) - ELEV[0]) + Math.abs(cy(s) - ELEV[1]);

  /* ----- Render map ----- */
  function drawMap() {
    let s = `
      <rect class="lane" x="86" y="100" width="906" height="80" rx="6"/>
      <rect class="lane" x="86" y="340" width="906" height="80" rx="6"/>
      <rect class="lane" x="912" y="100" width="80" height="320" rx="6"/>
      <path class="lane-arrow" d="M100 140 H${RIGHT_X - 20} M${RIGHT_X} 160 V360 M${RIGHT_X - 20} 380 H100"/>
      <g class="gate">
        <rect x="0" y="104" width="80" height="72" rx="8" fill="#14c38e" opacity=".9"/>
        <text x="40" y="146" text-anchor="middle">IN ▶</text>
        <rect x="0" y="344" width="80" height="72" rx="8" fill="#ff4d5e" opacity=".85"/>
        <text x="40" y="386" text-anchor="middle">◀ OUT</text>
        <rect x="6" y="210" width="74" height="100" rx="8" fill="#2f6bff" opacity=".85"/>
        <text x="43" y="256" text-anchor="middle">ELEV</text>
        <text x="43" y="274" text-anchor="middle" style="font-size:16px">⇅</text>
      </g>
      <line x1="86" y1="260" x2="906" y2="260" stroke="#f5c542" stroke-width="2" opacity=".6"/>`;
    slots.forEach(sl => {
      const x = X0 + sl.col * STEP, y = ROWS[sl.row].y, c = cls(sl);
      const icon = sl.state === 'busy'
        ? `<rect class="car-icon" x="${x + 12}" y="${y + 14}" width="${SW - 24}" height="${SH - 28}" rx="8"/><rect x="${x + 16}" y="${y + 24}" width="${SW - 32}" height="12" rx="3" fill="#5d6b82"/>`
        : sl.kind === 'ev' ? `<text x="${x + SW / 2}" y="${y + 50}" style="font-size:18px">⚡</text>`
        : sl.kind === 'dis' ? `<text x="${x + SW / 2}" y="${y + 50}" style="font-size:18px">♿</text>`
        : sl.state === 'rsv' ? `<text x="${x + SW / 2}" y="${y + 50}" style="font-size:13px">RSV</text>` : '';
      s += `<g class="slot ${c} ${selected && selected.id === sl.id ? 'selected' : ''}" data-id="${sl.id}" tabindex="${available(sl) ? 0 : -1}" role="button" aria-label="${sl.id} ${available(sl) ? '빈자리' : '사용중'}">
        <rect x="${x}" y="${y}" width="${SW}" height="${SH}"/>
        ${icon}
        <text x="${x + SW / 2}" y="${sl.row === 'A' || sl.row === 'C' ? y + 13 : y + SH - 5}">${sl.id}</text>
      </g>`;
    });
    if (selected) {
      const pts = routePoints(selected);
      const d = 'M' + pts.map(p => p.join(',')).join(' L');
      const len = pathLen(pts);
      s += `<path class="route animate" id="routePath" d="${d}" style="stroke-dasharray:${len};stroke-dashoffset:${len}"/>
            <circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="9" fill="#ffc531"/>
            <g id="simCar" style="display:none"><circle r="13" fill="#2f6bff" stroke="#fff" stroke-width="3"/><path d="M-5 -4 L6 0 L-5 4 Z" fill="#fff"/></g>`;
    }
    $('#lotMap').innerHTML = s;
    $('#mapUpdated').textContent = `${timeStr()} 갱신`;
  }

  function drawSummary() {
    const free = slots.filter(available);
    $('#sTotal').textContent = slots.length;
    $('#sFree').textContent = free.length;
    $('#sEv').textContent = free.filter(s => s.kind === 'ev').length;
    $('#sRate').textContent = `${Math.round((1 - free.length / slots.length) * 100)}%`;
    $('#mapTitle').textContent = `${floor} · ${lot.name}`;
    $('#floorList').innerHTML = lot.floors.map(f => {
      const list = buildSlots(lot, f), fr = list.filter(available).length, rate = Math.round((1 - fr / list.length) * 100);
      return `<div class="d-flex align-items-center gap-3 mb-3 ${f === floor ? 'fw-bold' : ''}" role="button" data-floor="${f}">
        <span class="font-en text-navy" style="width:28px">${f}</span>
        <div class="occ-bar flex-grow-1" style="height:10px"><span class="occ-${EZ.occClass(rate)}" style="width:${rate}%"></span></div>
        <span class="small ${fr ? 'text-mint' : 'text-red'}" style="width:62px;text-align:right">${fr}면 여유</span>
      </div>`;
    }).join('');
  }

  function drawRoute() {
    const panel = $('#routePanel');
    if (!selected) {
      panel.innerHTML = `<div class="empty-state py-4"><i class="fa-solid fa-hand-pointer d-block"></i>지도에서 <b class="text-mint">빈자리</b>를 선택하거나<br><b class="text-blue">AI 추천 자리</b>를 눌러 주세요.</div>`;
      return;
    }
    const pts = routePoints(selected);
    const seg = pts.slice(1).map((p, i) => Math.round(Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) * M_PER_PX));
    const total = seg.reduce((a, b) => a + b, 0);
    const side = ROWS[selected.row].side === 'L' ? '좌측' : '우측';
    const steps = [{ ic: 'fa-right-to-bracket', t: `${floor} 입구(IN 게이트) 진입`, d: '진입 후 서행 10km/h' }];
    if (pts.length === 3) {
      steps.push({ ic: 'fa-arrow-up', t: `직진 ${seg[0]}m`, d: '주행 통로 1' });
    } else {
      steps.push({ ic: 'fa-arrow-up', t: `직진 ${seg[0]}m 후 우회전`, d: '주행 통로 1 끝까지' });
      steps.push({ ic: 'fa-arrow-turn-down', t: `직진 ${seg[1]}m 후 우회전`, d: '연결 통로' });
      steps.push({ ic: 'fa-arrow-up', t: `직진 ${seg[2]}m`, d: '주행 통로 2' });
    }
    steps.push({ ic: 'fa-square-parking', t: `${side} ${floor}-${selected.id} 주차`, d: selected.kind === 'ev' ? '전기차 충전면' : selected.kind === 'dis' ? '장애인 전용면' : '일반면' });
    panel.innerHTML = `
      <div class="d-flex align-items-center justify-content-between bg-soft rounded-4 p-3 mb-4">
        <div><div class="small text-muted-2">선택한 주차면</div><div class="fw-800 font-en fs-3 text-navy">${floor}-${selected.id}</div></div>
        <div class="text-end"><div class="small text-muted-2">예상 소요</div><div class="fw-800 text-blue">${total}m · 약 ${Math.max(1, Math.round(total / 2.8 / 60 * 10) / 10)}분</div></div>
      </div>
      <ul class="route-steps mb-4">${steps.map(s => `<li><span class="step-ic"><i class="fa-solid ${s.ic}"></i></span><div><b class="text-navy">${s.t}</b><div class="small text-muted-2">${s.d}</div></div></li>`).join('')}</ul>
      <div class="small text-muted-2 mb-3"><i class="fa-solid fa-person-walking me-1"></i>엘리베이터까지 도보 약 ${Math.round(walkLen(selected) * M_PER_PX)}m</div>
      <div class="d-grid gap-2">
        <button class="btn btn-primary" id="btnSim"><i class="fa-solid fa-play me-1"></i>주행 시뮬레이션</button>
        <a class="btn btn-soft" href="${url(`pages/reservation.html?lot=${lot.id}&slot=${floor}-${selected.id}`)}"><i class="fa-solid fa-calendar-check me-1"></i>이 자리 예약하기</a>
      </div>`;
    $('#btnSim').onclick = simulate;
  }

  function renderAll() { drawMap(); drawSummary(); drawRoute(); }

  function stopSim() { cancelAnimationFrame(simRaf); simulating = false; }

  function select(sl, msg) {
    stopSim();
    selected = sl;
    renderAll();
    if (msg) toast(msg, 'success');
  }

  function recommend() {
    const ev = $('#optEv').checked, dis = $('#optDis').checked, elev = $('#optElev').checked;
    let cand = slots.filter(s => available(s) && (ev ? s.kind === 'ev' : dis ? s.kind === 'dis' : s.kind === 'normal'));
    if (!cand.length) cand = slots.filter(available);
    if (!cand.length) {
      const other = lot.floors.find(f => f !== floor && buildSlots(lot, f).some(available));
      return toast(other ? `${floor}층이 만차입니다. ${other}층을 이용해 주세요.` : '모든 층이 만차입니다.', 'warn');
    }
    const score = s => pathLen(routePoints(s)) + (elev ? walkLen(s) * 2 : 0);
    const best = cand.sort((a, b) => score(a) - score(b))[0];
    select(best, `AI 추천: ${floor}-${best.id} (가장 가까운 ${best.kind === 'ev' ? 'EV ' : ''}빈자리)`);
  }

  function simulate() {
    const path = $('#routePath');
    const car = $('#simCar');
    if (!path || !car) return;
    stopSim();
    simulating = true;
    path.style.strokeDashoffset = 0;
    car.style.display = '';
    const len = path.getTotalLength(), dur = Math.max(2000, len * 4);
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / dur);
      const pt = path.getPointAtLength(len * p);
      const pt2 = path.getPointAtLength(Math.min(len, len * p + 1));
      const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
      car.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${ang})`);
      if (p < 1) simRaf = requestAnimationFrame(step);
      else { simulating = false; toast(`${floor}-${selected.id} 도착! 주차를 완료해 주세요.`, 'success'); }
    };
    simRaf = requestAnimationFrame(step);
  }

  function loadFloor(f) {
    floor = f;
    selected = null;
    stopSim();
    slots = buildSlots(lot, f);
    $$('#floorTabs .btn').forEach(b => b.classList.toggle('active', b.dataset.floor === f));
    renderAll();
  }

  function loadLot(l) {
    lot = l;
    $('#floorTabs').innerHTML = l.floors.map(f => `<button type="button" class="btn btn-outline-secondary" data-floor="${f}">${f}</button>`).join('');
    loadFloor(l.floors[0]);
  }

  /* ----- Events ----- */
  $('#lotSel').innerHTML = lots.map(l => `<option value="${l.id}" ${l.id === lot.id ? 'selected' : ''}>${esc(l.name)} (${fmt(l.available)}면 여유)</option>`).join('');
  $('#lotSel').addEventListener('change', e => loadLot(lots.find(l => l.id === +e.target.value)));
  $('#floorTabs').addEventListener('click', e => { const b = e.target.closest('[data-floor]'); if (b) loadFloor(b.dataset.floor); });
  $('#floorList').addEventListener('click', e => { const b = e.target.closest('[data-floor]'); if (b) loadFloor(b.dataset.floor); });
  const onSlot = e => {
    const g = e.target.closest('.slot');
    if (!g) return;
    const sl = slots.find(s => s.id === g.dataset.id);
    if (!available(sl)) return toast(`${sl.id}는 ${sl.state === 'rsv' ? '예약된' : '이미 주차된'} 자리입니다.`, 'warn');
    select(sl);
  };
  $('#lotMap').addEventListener('click', onSlot);
  $('#lotMap').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSlot(e); } });
  $('#btnRecommend').onclick = recommend;
  $('#btnReset').onclick = () => select(null);

  /* 실시간 갱신: 선택된 자리를 제외한 2~3면 상태 변경 */
  setInterval(() => {
    if (simulating) return;
    for (let i = 0; i < 3; i++) {
      const sl = slots[Math.floor(Math.random() * slots.length)];
      if (selected && sl.id === selected.id) continue;
      if (sl.state === 'busy') sl.state = 'free';
      else if (sl.state === 'free') sl.state = 'busy';
    }
    drawMap();
    drawSummary();
    const path = $('#routePath');
    if (path) path.style.strokeDashoffset = 0;
  }, 4000);

  loadLot(lot);
})();
