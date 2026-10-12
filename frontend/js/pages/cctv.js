/* 영상 인지 모니터링 (담당: 박미금) */
(() => {
  const { $, $$, timeStr, esc, toast } = EZ;
  const { rand, plate } = EZ_DATA;
  const cams = EZ_DATA.cameras.map(c => ({ ...c, boxes: c.boxes.map(b => [...b]) }));
  const params = new URLSearchParams(location.search);
  let active = cams.find(c => c.id === params.get('cam')) || cams[0];
  let layout = params.get('cam') ? 'g1' : 'g2';
  let paused = false;
  let trackId = 1200;
  const logs = [];

  const hidden = () => $$('#clsToggle input').filter(i => !i.checked).map(i => i.value);
  const visibleCams = () => (layout === 'g1' ? [active] : layout === 'g2' ? cams.slice(0, 4) : cams);

  function renderGrid() {
    $('#camGrid').className = `cam-grid ${layout === 'g2' ? '' : layout}`;
    $$('#layoutSeg button').forEach(b => b.classList.toggle('active', b.dataset.g === layout));
    let list = visibleCams();
    if (layout === 'g2' && !list.includes(active)) list = [active, ...list.slice(0, 3)];
    $('#camGrid').innerHTML = list.map(c => `
      <div class="cam-tile ${c.id === active.id ? 'active' : ''} ${layout === 'g1' ? 'g1-mode' : ''}" data-id="${c.id}" role="button" tabindex="0" aria-label="${c.id} ${esc(c.name)}">
        <img src="${ezImg(c.img, layout === 'g1' ? 1500 : 800, layout === 'g1' ? 1000 : 533)}" alt="${esc(c.name)}">
        <div class="det-layer"></div>
        ${$('#optScan').checked ? '<div class="scanline"></div>' : ''}
        <div class="cam-hud"><span>● REC ${c.id}</span><span class="cam-time">${timeStr()}</span></div>
        <div class="cam-foot"><span><b>${esc(c.name)}</b> · ${esc(c.lot)}</span><span class="font-en">${c.fps}fps</span></div>
      </div>`).join('');
    drawAll();
  }

  function drawAll() {
    const h = hidden();
    $$('#camGrid .cam-tile').forEach(tile => {
      const cam = cams.find(c => c.id === tile.dataset.id);
      EZ.drawDetections(tile.querySelector('.det-layer'), cam.boxes, { hidden: h });
      tile.querySelector('.cam-time').textContent = timeStr();
    });
  }

  function renderInfo() {
    const b = active.boxes;
    $('#infoTitle').textContent = active.id;
    $('#infoSub').innerHTML = `<i class="fa-solid fa-location-dot me-1"></i>${esc(active.lot)} · ${esc(active.name)}`;
    $('#mCar').textContent = b.filter(x => x[0] === 'car' || x[0] === 'alert').length;
    $('#mFree').textContent = b.filter(x => x[0] === 'free').length;
    $('#mFps').textContent = active.fps - rand(0, 2);
    $('#mLat').textContent = rand(22, 34);
    const conf = [['주차 차량', 96 + Math.random() * 3, '#3ddc97'], ['이동 차량', 91 + Math.random() * 4, '#ffc531'], ['보행자', 88 + Math.random() * 5, '#ff7ab6'], ['빈 주차면', 94 + Math.random() * 4, '#5ab0ff']];
    $('#confBars').innerHTML = conf.map(([n, v, c]) => `
      <div class="d-flex align-items-center gap-2 mb-2 small"><span style="width:62px">${n}</span>
      <div class="occ-bar flex-grow-1"><span style="width:${v}%;background:${c}"></span></div><b class="font-en" style="width:40px">${v.toFixed(1)}</b></div>`).join('');
  }

  function renderList() {
    $('#camList').innerHTML = cams.map(c => `
      <div class="cam-item ${c.id === active.id ? 'active' : ''}" data-id="${c.id}" role="button" tabindex="0">
        <img src="${ezImg(c.img, 120, 80)}" alt="" loading="lazy">
        <div class="min-w-0 flex-grow-1"><div class="fw-bold small text-navy">${c.id}</div><div class="small text-muted-2 text-truncate">${esc(c.name)}</div></div>
        <span class="status-dot" style="background:var(--ez-mint)"></span>
      </div>`).join('');
  }

  function setActive(id) {
    active = cams.find(c => c.id === id);
    renderGrid(); renderInfo(); renderList();
  }

  /* 트래킹 로그 */
  const judge = { car: ['점유 확정', 'blue'], moving: ['주행 중', 'yellow'], person: ['보행자 통과', 'purple'], free: ['공석 판정', 'mint'], alert: ['불법주차 의심', 'red'] };
  const clsName = { car: 'car', moving: 'car', person: 'person', free: 'slot', alert: 'car' };
  function pushLog() {
    const cam = EZ_DATA.pick(cams);
    const b = EZ_DATA.pick(cam.boxes);
    logs.unshift({ t: new Date(), cam: cam.id, id: `#${++trackId}`, cls: b[0], conf: b[0] === 'free' ? '-' : (0.86 + Math.random() * 0.13).toFixed(3), plate: b[0] === 'car' || b[0] === 'alert' ? plate() : '' });
    logs.length = Math.min(20, logs.length);
    $('#trackLog').innerHTML = logs.map(l => `<tr>
      <td class="font-en small">${timeStr(l.t)}</td><td class="small fw-bold">${l.cam}</td><td class="font-en small">${l.id}</td>
      <td><span class="font-en small">${clsName[l.cls]}</span>${l.plate ? ` <span class="text-muted-2 small">(${l.plate.slice(0, -4)}****)</span>` : ''}</td>
      <td class="font-en small">${l.conf}</td><td><span class="ez-badge ${judge[l.cls][1]}">${judge[l.cls][0]}</span></td></tr>`).join('');
  }

  /* 시뮬레이션: 이동 차량/보행자 이동 + 미세 흔들림 */
  function tick() {
    if (paused) return;
    cams.forEach(c => c.boxes.forEach(b => {
      if (b[0] === 'moving') b[1] = b[1] > 90 ? 2 : b[1] + 1.2;
      else if (b[0] === 'person') b[1] = b[1] > 80 ? 30 : b[1] + 0.6;
    }));
    drawAll();
    renderInfo();
  }

  /* 이벤트 */
  $('#layoutSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { layout = b.dataset.g; renderGrid(); } });
  $('#clsToggle').addEventListener('change', drawAll);
  $('#optScan').addEventListener('change', renderGrid);
  $('#camGrid').addEventListener('click', e => { const t = e.target.closest('.cam-tile'); if (t) setActive(t.dataset.id); });
  $('#camGrid').addEventListener('dblclick', e => { const t = e.target.closest('.cam-tile'); if (t) { layout = layout === 'g1' ? 'g2' : 'g1'; setActive(t.dataset.id); } });
  $('#camList').addEventListener('click', e => { const t = e.target.closest('.cam-item'); if (t) setActive(t.dataset.id); });
  ['#camGrid', '#camList'].forEach(s => $(s).addEventListener('keydown', e => { const t = e.target.closest('[data-id]'); if (t && e.key === 'Enter') setActive(t.dataset.id); }));
  $('#btnPause').onclick = e => {
    paused = !paused;
    e.currentTarget.innerHTML = paused ? '<i class="fa-solid fa-play me-1"></i>재생' : '<i class="fa-solid fa-pause me-1"></i>일시정지';
  };
  $('#btnSnap').onclick = () => toast(`${active.id} 스냅샷(메타데이터)이 저장되었습니다.`, 'success');

  setActive(active.id);
  for (let i = 0; i < 10; i++) pushLog();
  setInterval(tick, 1000);
  setInterval(() => { if (!paused) pushLog(); }, 1800);
})();
