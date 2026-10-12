/* 관제 대시보드 (담당: 박미금) */
(() => {
  const { $, fmt, occRate, occClass, occText, timeStr, esc, toast } = EZ;
  const { lots, cameras, hourlyOcc, hourlyPred, randomEvent, rand } = EZ_DATA;
  const C = { blue: '#2f6bff', mint: '#14c38e', yellow: '#ffc531', red: '#ff4d5e', purple: '#8b5cf6', gray: '#9aa5b8', navy: '#0b1f3a' };
  let inCnt = 4821, outCnt = 4502, paused = false;

  lots.forEach(l => $('#lotFilter').insertAdjacentHTML('beforeend', `<option value="${l.id}">${esc(l.name)}</option>`));
  const scope = () => { const id = +$('#lotFilter').value; return id ? lots.filter(l => l.id === id) : lots; };

  /* KPI */
  let prevParked = null;
  function renderKpi() {
    const list = scope();
    const total = list.reduce((s, l) => s + l.total, 0);
    const parked = list.reduce((s, l) => s + (l.total - l.available), 0);
    $('#kTotal').textContent = fmt(total);
    $('#kParked').textContent = fmt(parked);
    $('#kRate').innerHTML = `${Math.round((parked / total) * 1000) / 10}<small>%</small>`;
    $('#kIn').textContent = fmt(inCnt);
    $('#kOut').textContent = fmt(outCnt);
    $('#kLat').textContent = rand(24, 32);
    $('#kAcc').innerHTML = `${(97.4 + Math.random() * 0.7).toFixed(1)}<small>%</small>`;
    if (prevParked !== null) {
      const diff = parked - prevParked;
      $('#kParkedTrend').className = `trend ${diff >= 0 ? 'up' : 'down'}`;
      $('#kParkedTrend').innerHTML = `<i class="fa-solid fa-arrow-${diff >= 0 ? 'up' : 'down'}"></i> ${Math.abs(diff)} (최근 3초)`;
    }
    prevParked = parked;
  }

  /* 메인 차트 */
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}시`);
  const nowH = new Date().getHours();
  const yesterday = hourlyOcc.map(v => Math.max(10, Math.min(98, v + rand(-8, 6))));
  const flowIn = hourlyOcc.map((v, i) => Math.round(v * 6 + (i > 6 && i < 10 ? 160 : 0) + rand(0, 40)));
  const flowOut = hourlyOcc.map((v, i) => Math.round(v * 5 + (i > 17 && i < 21 ? 180 : 0) + rand(0, 40)));
  const chartData = {
    occ: { suffix: '%', yMax: 100, series: [
      { name: '오늘 실측', data: hourlyOcc.map((v, i) => (i <= nowH ? v : null)), color: C.blue, fill: true },
      { name: 'AI 예측', data: hourlyPred, color: C.purple, dash: true, noDots: true },
      { name: '어제', data: yesterday, color: C.gray, width: 1.5, noDots: true }
    ] },
    flow: { suffix: '대', series: [
      { name: '입차', data: flowIn, color: C.blue },
      { name: '출차', data: flowOut, color: C.mint }
    ] }
  };
  let mode = 'occ', chart;
  function renderChart() {
    const d = chartData[mode];
    $('#chartTitle').textContent = mode === 'occ' ? '시간대별 점유율' : '시간대별 입·출차';
    $('#chartLegend').innerHTML = d.series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('');
    $('#mainChart').innerHTML = '';
    const el = document.createElement('div');
    $('#mainChart').appendChild(el);
    chart = mode === 'occ'
      ? MiniChart.line(el, { labels: hours, series: d.series, suffix: d.suffix, yMax: d.yMax, height: 290, band: [Math.max(0, nowH - 1), Math.min(23, nowH)] })
      : MiniChart.bar(el, { labels: hours, series: d.series, suffix: d.suffix, height: 290, barMax: 12 });
  }
  $('#chartSeg').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    [...$('#chartSeg').children].forEach(x => x.classList.toggle('active', x === b));
    mode = b.dataset.mode;
    renderChart();
  });

  /* 층별 점유 */
  function renderFloors() {
    const lot = scope()[0];
    $('#floorLotName').textContent = lot.name;
    const base = occRate(lot);
    $('#floorBars').innerHTML = lot.floors.map((f, i) => {
      const r = Math.max(15, Math.min(100, base + (i - 1) * 7 + rand(-3, 3)));
      const total = Math.round(lot.total / lot.floors.length);
      return `<div class="floor-row"><span class="fl">${f}</span><div class="occ-bar"><span class="occ-${occClass(r)}" style="width:${r}%"></span></div><span class="val"><b class="text-navy">${r}%</b> · ${fmt(Math.round(total * (1 - r / 100)))}면</span></div>`;
    }).join('');
  }

  /* 미니 주차면 맵 */
  const mini = Array.from({ length: 80 }, (_, i) => (i >= 72 ? 'ev' : Math.random() < 0.82 ? 'busy' : 'free'));
  function renderMini() {
    $('#miniMap').innerHTML = mini.map((s, i) => `<i class="${s === 'ev' ? (i % 3 ? 'ev' : 'busy') : s}" title="B1-${i + 1}"></i>`).join('');
  }
  function tickMini() {
    for (let k = 0; k < 3; k++) {
      const i = rand(0, 71);
      mini[i] = mini[i] === 'busy' ? 'free' : 'busy';
    }
    renderMini();
  }

  /* CCTV 미리보기 */
  const previewCams = cameras.slice(0, 4).map(c => ({ ...c, boxes: c.boxes.map(b => [...b]) }));
  $('#camPreview').innerHTML = previewCams.map(c => `
    <a class="cam-tile d-block" href="cctv.html?cam=${c.id}">
      <img src="${ezImg(c.img, 600, 400)}" alt="${esc(c.name)}" loading="lazy">
      <div class="det-layer"></div>
      <div class="cam-hud"><span>● ${c.id}</span><span class="cam-time"></span></div>
      <div class="cam-foot"><span>${esc(c.name)}</span><span class="ez-badge mint">${c.boxes.filter(b => b[0] === 'free').length} FREE</span></div>
    </a>`).join('');
  function tickCams() {
    [...$('#camPreview').children].forEach((tile, i) => {
      const cam = previewCams[i];
      cam.boxes.forEach(b => { if (b[0] === 'moving') b[1] = b[1] > 90 ? 2 : b[1] + 1.5; });
      EZ.drawDetections(tile.querySelector('.det-layer'), cam.boxes);
      tile.querySelector('.cam-time').textContent = timeStr();
    });
  }

  /* 이벤트 로그 */
  const events = [];
  const isAlert = e => ['illegal', 'long', 'cam'].includes(e.type);
  function renderEvents() {
    const f = $('#evFilter').value;
    const list = events.filter(e => !f || (f === 'alert' ? isAlert(e) : ['in', 'out'].includes(e.type)));
    $('#eventLog').innerHTML = list.slice(0, 30).map(e => `
      <li><span class="ev-ic icon-box ${e.color}"><span class="material-symbols-rounded">${e.icon}</span></span>
      <div class="min-w-0"><div class="ev-title">${e.title}${isAlert(e) ? ' <span class="ez-badge red ms-1">경보</span>' : ''}</div><div class="ev-meta text-truncate">${esc(e.meta)}</div></div>
      <time>${timeStr(e.time)}</time></li>`).join('') || '<li class="text-muted-2 small justify-content-center">이벤트 없음</li>';
  }
  function pushEvent() {
    if (paused) return;
    const e = randomEvent();
    if (e.type === 'in') inCnt++;
    if (e.type === 'out') outCnt++;
    events.unshift(e);
    events.length = Math.min(events.length, 60);
    renderEvents();
    if (e.type === 'illegal') toast(`${e.title} – ${e.meta}`, 'error');
  }
  $('#evFilter').addEventListener('change', renderEvents);
  $('#evPause').onclick = e => {
    paused = !paused;
    e.currentTarget.innerHTML = `<i class="fa-solid fa-${paused ? 'play' : 'pause'}"></i>`;
    toast(paused ? '이벤트 스트림을 일시정지했습니다.' : '이벤트 스트림을 재개했습니다.', 'info');
  };

  /* 주차장 테이블 */
  function renderTable() {
    const sel = +$('#lotFilter').value;
    $('#lotTable').innerHTML = lots.map(l => {
      const r = occRate(l), c = occClass(r);
      return `<tr class="${sel === l.id ? 'table-primary' : ''}">
        <td class="fw-bold text-navy text-nowrap">${esc(l.name)}</td>
        <td><span class="ez-badge blue">${l.region}</span></td>
        <td class="text-end font-en">${fmt(l.total)}</td>
        <td class="text-end font-en fw-bold text-${c === 'low' ? 'mint' : c === 'mid' ? 'yellow' : 'red'}">${fmt(l.available)}</td>
        <td><div class="d-flex align-items-center gap-2"><div class="occ-bar flex-grow-1"><span class="occ-${c}" style="width:${r}%"></span></div><span class="small font-en" style="width:34px">${r}%</span></div></td>
        <td><span class="ez-badge ${c === 'low' ? 'mint' : c === 'mid' ? 'yellow' : 'red'}">${occText(r)}</span></td>
        <td><a href="../pages/guide.html?lot=${l.id}" class="btn btn-sm btn-light" title="유도 화면"><i class="fa-solid fa-arrow-up-right-from-square"></i></a></td>
      </tr>`;
    }).join('');
  }

  /* 차종 도넛 */
  MiniChart.donut($('#typeDonut'), {
    labels: ['승용차', 'SUV', '전기차', '승합·화물', '이륜차'],
    data: [4120, 2380, 1240, 610, 290],
    colors: [C.blue, C.navy, C.mint, C.yellow, C.purple],
    suffix: '대', size: 220, center: { value: '8,640', label: '금일 인지 차량' }
  });

  $('#lotFilter').addEventListener('change', () => { renderKpi(); renderFloors(); renderTable(); });
  $('#btnExport').onclick = () => toast('일일 관제 리포트(PDF) 생성은 백엔드 연동 후 제공됩니다.', 'info');

  /* 초기화 & 주기 갱신 */
  renderKpi(); renderChart(); renderFloors(); renderMini(); tickCams(); renderTable();
  for (let i = 0; i < 8; i++) { const e = randomEvent(); e.time = new Date(Date.now() - i * 7000); events.push(e); }
  renderEvents();

  setInterval(() => {
    lots.forEach(l => { const step = Math.max(1, Math.round(l.total / 150)); l.available = Math.max(0, Math.min(l.total, l.available + rand(-step, step))); });
    renderKpi();
  }, 3000);
  setInterval(pushEvent, 2500);
  setInterval(tickCams, 1000);
  setInterval(tickMini, 2000);
  setInterval(() => { renderFloors(); renderTable(); }, 5000);
})();
