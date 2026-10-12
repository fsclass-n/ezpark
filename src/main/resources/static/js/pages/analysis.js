/* K-AI 데이터 분석 (담당: 이오리) */
(async () => {
  const { $, esc, toast, api, fail } = EZ;
  const { hourlyOcc, hourlyPred } = EZ_DATA;
  /* 업종별 도입 문의 분포 (P3 기업 수요 분석 결과 연동 전 기준값) */
  const inquiries = [['쇼핑몰', 2], ['병원', 2], ['오피스', 2], ['공공기관', 1], ['상가', 1], ['전시장', 1]].flatMap(([industry, n]) => Array.from({ length: n }, () => ({ industry })));
  let lots = [];
  try {
    lots = await api('/api/lots');
  } catch (err) {
    fail(err);
  }
  const C = { blue: '#2f6bff', purple: '#8b5cf6', lilac: '#c4b5fd', mint: '#14c38e', yellow: '#ffc531', red: '#ff4d5e', navy: '#0b1f3a', gray: '#9aa5b8' };
  const nowH = new Date().getHours();
  let range = 7;

  [...new Set(lots.map(l => l.region))].forEach(a => $('#areaSel').insertAdjacentHTML('beforeend', `<option>${esc(a)}</option>`));
  const seeded = s => () => ((s = (s * 9301 + 49297) % 233280) / 233280);

  /* 1. 48시간 수요 예측 */
  function forecastData() {
    const area = $('#areaSel').value;
    const k = area ? 0.85 + (area.charCodeAt(0) % 20) / 100 : 1;
    const rnd = seeded(area.length * 17 + range);
    const clamp = v => Math.max(5, Math.min(100, Math.round(v)));
    const labels = [], actual = [], pred = [], up = [], low = [];
    for (let i = 0; i < 48; i++) {
      const h = i % 24;
      labels.push(`${i < 24 ? '오늘' : '내일'} ${String(h).padStart(2, '0')}시`);
      actual.push(i <= nowH ? clamp(hourlyOcc[h] * k + (rnd() - 0.5) * 6) : null);
      const p = i >= nowH ? clamp(hourlyPred[h] * k * (i >= 24 ? 1.02 : 1) + (rnd() - 0.5) * 3) : null;
      pred.push(p);
      const band = p == null ? null : 2 + (i - nowH) * 0.18;
      up.push(p == null ? null : clamp(p + band));
      low.push(p == null ? null : clamp(p - band));
    }
    return { labels, series: [
      { name: '상한', data: up, color: C.lilac, width: 1.2, dash: true, noDots: true },
      { name: '하한', data: low, color: C.lilac, width: 1.2, dash: true, noDots: true },
      { name: '실측', data: actual, color: C.blue, fill: true, noDots: true },
      { name: '예측', data: pred, color: C.purple, width: 2.5, noDots: true }
    ] };
  }
  const forecast = MiniChart.line($('#forecastChart'), { ...forecastData(), suffix: '%', yMax: 100, height: 280, band: [nowH, Math.min(47, nowH + 1)] });

  /* 2. 히트맵 */
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}시`);
  function heatData() {
    const rnd = seeded(range * 3 + $('#areaSel').value.length);
    return days.map((d, di) => hourlyOcc.map((v, h) => {
      const weekend = di >= 5;
      let x = weekend ? v * 0.75 + (h >= 11 && h <= 19 ? 22 : 0) : v + (di === 4 && h >= 17 ? 6 : 0);
      return Math.max(5, Math.min(100, Math.round(x + (rnd() - 0.5) * (range === 30 ? 6 : 10))));
    }));
  }
  const heat = MiniChart.heatmap($('#heatmap'), { rows: days, cols: hours, data: heatData(), suffix: '%', cellH: 28 });

  /* 3. 지역별 수요 vs 공급 */
  const areas = [...new Set(lots.map(l => l.region))];
  const supply = areas.map(a => lots.filter(l => l.region === a).reduce((s, l) => s + l.total, 0));
  const demand = supply.map((s, i) => Math.round(s * (0.8 + ((i * 37) % 40) / 100)));
  MiniChart.bar($('#areaChart'), { labels: areas, series: [{ name: '피크 수요', data: demand, color: C.blue }, { name: '공급 면수', data: supply, color: C.mint }], suffix: '', height: 250, barMax: 16 });

  /* 4. 업종별 수요 */
  const ind = {};
  inquiries.forEach(q => (ind[q.industry] = (ind[q.industry] || 0) + 3));
  Object.assign(ind, { 쇼핑몰: (ind.쇼핑몰 || 0) + 5, 오피스: (ind.오피스 || 0) + 4 });
  const indLabels = Object.keys(ind);
  MiniChart.donut($('#industryDonut'), {
    labels: indLabels, data: indLabels.map(k => ind[k]),
    colors: [C.yellow, C.mint, C.blue, C.purple, C.red, C.navy, C.gray], suffix: '건', size: 200,
    center: { value: indLabels.reduce((s, k) => s + ind[k], 0), label: '도입 문의' }
  });

  /* 5. 인사이트 카드 */
  const insights = [
    { ic: 'warning', c: 'red', t: '자갈치시장 주말 만차 지속', d: '121면 소규모 주차장으로 토·일 11~15시 점유율 95%↑ 예측. 인근 보수복개천 공영주차장(149면) 연계 유도 권장.' },
    { ic: 'ev_station', c: 'mint', t: 'EV 충전구역 수요 집중', d: '화성행궁(전기차 11면)·국채보상운동기념공원(10면) EV 구역 점유율 98%. 충전 완료 차량 이동 알림 필요.' },
    { ic: 'festival', c: 'yellow', t: '관광지 피크 예측', d: '이번 주말 14시 전주 한옥마을 제1공영주차장 점유율 94% 예측. 제4공영주차장(636면·무료 셔틀) 우회 안내 권장.' },
    { ic: 'savings', c: 'blue', t: '운영 정책 제안', d: '세종로 공영주차장 평일 12~13시 피크 집중. 광화문 행사일 사전 예약제 운영 시 진입 대기 감소 기대.' }
  ];
  $('#insights').innerHTML = insights.map(i => `
    <div class="col-md-6"><div class="d-flex gap-3 p-3 rounded-4 bg-soft h-100">
      <div class="icon-box sm ${i.c}"><span class="material-symbols-rounded">${i.ic}</span></div>
      <div><div class="fw-bold text-navy mb-1">${i.t}</div><div class="small text-muted-2">${i.d}</div></div>
    </div></div>`).join('');

  /* 6. 파이프라인 */
  const pipe = [
    ['공공데이터 주차장 API 수집', 'Python RPA · Requests', '완료', 'mint', '06:00'],
    ['AI-Hub 라벨 데이터 전처리', 'pandas · NumPy', '완료', 'mint', '06:12'],
    ['이동체 인지 통계 집계', 'Seaborn · Matplotlib', '완료', 'mint', '06:20'],
    ['수요 예측 모델 재학습', 'scikit-learn · RandomForest', '진행 중', 'blue', '06:31'],
    ['Gemini 일일 리포트 생성', 'Gemini API', '대기', 'gray', '-']
  ];
  $('#pipeline').innerHTML = pipe.map(([t, s, st, c, time], i) => `
    <li class="d-flex align-items-center gap-3 py-2 ${i ? 'border-top' : ''}">
      <span class="icon-box sm ${c === 'gray' ? '' : c}" style="${c === 'gray' ? 'background:#eef1f7;color:#9aa5b8' : ''}"><i class="fa-solid ${st === '완료' ? 'fa-check' : st === '진행 중' ? 'fa-spinner fa-spin' : 'fa-hourglass'}"></i></span>
      <div class="flex-grow-1"><div class="fw-bold text-navy">${t}</div><div class="text-muted-2">${s}</div></div>
      <div class="text-end"><span class="ez-badge ${c}">${st}</span><div class="font-en text-muted-2 mt-1" style="font-size:.7rem">${time}</div></div>
    </li>`).join('');

  /* 필터 */
  const refresh = () => { forecast.update(forecastData()); heat.update({ data: heatData() }); };
  $('#areaSel').addEventListener('change', refresh);
  $('#rangeSeg').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    [...$('#rangeSeg').children].forEach(x => x.classList.toggle('active', x === b));
    range = +b.dataset.r;
    refresh();
  });

  /* 7. Gemini 챗 – POST /api/dashboard/insight (API 키는 서버에서만 사용) */
  const msgs = $('#chatMsgs');
  const greet = '안녕하세요! EzPark 데이터를 분석하는 Gemini 어시스턴트입니다.\n전국 공영주차장의 혼잡 패턴, 수요 예측, 운영 전략 등을 물어보세요.';

  function addMsg(role, text) {
    const el = document.createElement('div');
    el.className = `msg ${role}`;
    el.innerHTML = role === 'ai'
      ? `<div class="ai-ava"><i class="fa-solid fa-wand-magic-sparkles fa-sm"></i></div><div class="bubble"></div>`
      : `<div class="bubble">${esc(text)}</div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el.querySelector('.bubble');
  }
  let busyChat = false;
  function typeOut(bubble, text, done) {
    let i = 0;
    bubble.textContent = '';
    const t = setInterval(() => {
      bubble.textContent = text.slice(0, (i += 3));
      msgs.scrollTop = msgs.scrollHeight;
      if (i >= text.length) { clearInterval(t); done(); }
    }, 16);
  }
  async function ask(q) {
    if (busyChat || !q.trim()) return;
    busyChat = true;
    addMsg('me', q);
    const bubble = addMsg('ai', '');
    bubble.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
    try {
      const res = await api('/api/dashboard/insight', { method: 'POST', body: { question: q.trim() } });
      const tag = res.source === 'gemini' ? '' : '\n\n(규칙 기반 답변 · GEMINI_API_KEY 설정 시 Gemini 답변)';
      typeOut(bubble, res.answer + tag, () => (busyChat = false));
    } catch (err) {
      bubble.textContent = err.message;
      busyChat = false;
    }
  }
  const reset = () => { msgs.innerHTML = ''; addMsg('ai', '').textContent = greet; };
  reset();
  $('#chips').addEventListener('click', e => { if (e.target.matches('button')) ask(e.target.textContent); });
  $('#chatForm').addEventListener('submit', e => { e.preventDefault(); ask($('#chatInput').value); $('#chatInput').value = ''; });
  $('#chatClear').onclick = () => { if (!busyChat) { reset(); toast('대화를 초기화했습니다.', 'info'); } };
})();
