/* K-AI 데이터 분석 (담당: 이오리) */
(() => {
  const { $, esc, toast } = EZ;
  const { lots, hourlyOcc, hourlyPred, inquiries } = EZ_DATA;
  const C = { blue: '#2f6bff', purple: '#8b5cf6', lilac: '#c4b5fd', mint: '#14c38e', yellow: '#ffc531', red: '#ff4d5e', navy: '#0b1f3a', gray: '#9aa5b8' };
  const nowH = new Date().getHours();
  let range = 7;

  [...new Set(lots.map(l => l.area))].forEach(a => $('#areaSel').insertAdjacentHTML('beforeend', `<option>${a}</option>`));
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
  const areas = [...new Set(lots.map(l => l.area))];
  const supply = areas.map(a => lots.filter(l => l.area === a).reduce((s, l) => s + l.total, 0));
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
    { ic: 'warning', c: 'red', t: '홍대입구 주말 만차 지속', d: '토·일 13~18시 점유율 96%↑. 인근 민영 주차장과 제휴 시 유입 분산 효과 예상 (+120면).' },
    { ic: 'ev_station', c: 'mint', t: 'EV 충전면 부족', d: '코엑스·잠실 EV 면 점유율 98%. 일반면 대비 회전율 0.6배로 충전 완료 차량 이동 알림 필요.' },
    { ic: 'storefront', c: 'yellow', t: '쇼핑몰 피크 예측', d: '이번 주 금요일 19시 잠실 롯데월드몰 점유율 94% 예측. B4 우선 유도 권장.' },
    { ic: 'savings', c: 'blue', t: '요금 정책 제안', d: '서울역 환승주차장 07~09시 탄력 요금(+10%) 적용 시 월 매출 +6.8% 추정.' }
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

  /* 7. Gemini 챗 (목업) – P2: POST /api/ai/insight */
  const msgs = $('#chatMsgs');
  const greet = '안녕하세요! EzPark 데이터를 분석하는 Gemini 어시스턴트입니다.\n혼잡 패턴, 수요 예측, 업종별 운영 전략 등을 물어보세요.';
  const top = [...lots].sort((a, b) => b.available / b.total - a.available / a.total);
  const busy = [...lots].sort((a, b) => a.available / a.total - b.available / b.total).slice(0, 3);
  const answers = [
    [/혼잡|시간대|피크/, () => `[요약] 이번 주 혼잡 시간대 요약\n\n• 평일 피크: 12~13시 (평균 점유율 ${Math.max(...hourlyOcc)}%)\n• 퇴근 피크: 18시 (87%)\n• 주말 피크: 14~17시, 평일보다 2시간 늦게 시작\n\n가장 혼잡한 곳: ${busy.map(l => l.name).join(', ')}\n→ 11시 30분 이전 사전 예약 알림 발송을 권장합니다.`],
    [/쇼핑몰|전략|운영/, () => `[제안] 쇼핑몰 운영 전략 제안\n\n1. 주말 13~18시 층별 유도: 상층(B1) 만차 시 하층 우선 안내로 진입 대기 40% 감소 기대\n2. 구매 금액 연동 무료 주차 → 출차 정산 자동화로 출구 정체 해소\n3. 금요일 저녁 예약 전용면 5% 운영 → 객단가 높은 고객 유치\n\n예상 효과: 회전율 +18%, 관제 인력 -35%`],
    [/전기차|EV|충전/i, () => `[분석] 전기차 충전면 확충 우선순위\n\n1순위 코엑스 스마트파킹 – EV 점유율 98%, 대기 평균 23분\n2순위 잠실 롯데월드몰 – 주말 EV 수요 전주 대비 +14%\n3순위 강남역 공영주차장 – 공영 감면 효과로 수요 집중\n\n충전 완료 후 30분 이상 점유 차량이 31%로, '충전 완료 이동 알림' 도입을 함께 권장합니다.`],
    [/예측|리포트|다음/, () => `[리포트] 다음 주 수요 예측 리포트 (요약)\n\n• 전체 평균 점유율: 74.2% (전주 대비 +2.1%p)\n• 만차 위험(95%↑) 예상: ${busy.map(l => l.name).join(', ')}\n• 여유 예상: ${top.slice(0, 2).map(l => l.name).join(', ')}\n• 모델: RandomForest (R² 0.93, MAE 3.1%p)\n\n주요 변수: 요일, 시간대, 강수 확률, 인근 행사, 공휴일`],
    [/./, q => `"${q}"에 대한 분석 결과입니다.\n\n현재 프론트엔드 데모 단계로 사전 정의된 응답을 제공합니다. 백엔드 연동 후에는 실시간 주차 데이터와 함께 Gemini API에 질의하여 맞춤형 답변을 생성합니다.\n\n추천 질문: 혼잡 시간대, 쇼핑몰 전략, 전기차 충전면, 수요 예측 리포트`]
  ];

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
  function ask(q) {
    if (busyChat || !q.trim()) return;
    busyChat = true;
    addMsg('me', q);
    const bubble = addMsg('ai', '');
    bubble.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
    const text = answers.find(([re]) => re.test(q))[1](q);
    setTimeout(() => {
      let i = 0;
      bubble.textContent = '';
      const t = setInterval(() => {
        bubble.textContent = text.slice(0, (i += 3));
        msgs.scrollTop = msgs.scrollHeight;
        if (i >= text.length) { clearInterval(t); busyChat = false; }
      }, 16);
    }, 700);
  }
  const reset = () => { msgs.innerHTML = ''; addMsg('ai', '').textContent = greet; };
  reset();
  $('#chips').addEventListener('click', e => { if (e.target.matches('button')) ask(e.target.textContent); });
  $('#chatForm').addEventListener('submit', e => { e.preventDefault(); ask($('#chatInput').value); $('#chatInput').value = ''; });
  $('#chatClear').onclick = () => { if (!busyChat) { reset(); toast('대화를 초기화했습니다.', 'info'); } };
})();
