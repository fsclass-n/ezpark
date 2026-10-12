/* 예약·결제 (담당: 홍기흥) */
(() => {
  const { $, $$, fmt, won, pad, occRate, occClass, esc, toast, api, fail } = EZ;
  let lots = [];
  const params = new URLSearchParams(location.search);
  const state = { step: 1, lotId: +params.get('lot') || null, slot: params.get('slot') || null, time: null };

  /* STEP 1: 주차장 목록 (GET /api/lots) */
  const renderLots = () => $('#lotOptions').innerHTML = lots.map(l => {
    const r = occRate(l), c = occClass(r);
    return `<div class="col-md-6"><label class="select-card">
      <input type="radio" name="lot" value="${l.id}" ${l.id === state.lotId ? 'checked' : ''}>
      <div class="inner d-flex gap-3 align-items-center">
        <img src="${ezImg(l.photo, 160, 160)}" alt="" style="width:64px;height:64px;border-radius:12px;object-fit:cover" loading="lazy">
        <div class="flex-grow-1 min-w-0">
          <div class="fw-bold text-navy text-truncate">${esc(l.name)}</div>
          <div class="small text-muted-2">${esc(l.region)} · ${esc(l.feeShort)}${l.ev ? ' · EV' : ''}</div>
          <div class="occ-bar mt-2"><span class="occ-${c}" style="width:${r}%"></span></div>
        </div>
        <div class="text-end"><div class="fw-800 font-en text-${c === 'low' ? 'mint' : c === 'mid' ? 'yellow' : 'red'}">${fmt(l.available)}</div><div class="small text-muted-2">잔여</div></div>
      </div></label></div>`;
  }).join('');

  /* STEP 2: 날짜/시간 */
  const today = new Date();
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  $('#date').min = iso(today);
  $('#date').max = iso(new Date(today.getTime() + 13 * 864e5));
  $('#date').value = iso(today);
  function renderTimes() {
    const isToday = $('#date').value === iso(new Date());
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes() + 30;
    let html = '';
    for (let m = 6 * 60; m < 24 * 60; m += 30) {
      const label = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
      const disabled = isToday && m < nowMin;
      if (disabled && state.time === label) state.time = null;
      html += `<button type="button" class="btn btn-sm ${state.time === label ? 'btn-primary' : 'btn-outline-secondary'}" data-time="${label}" ${disabled ? 'disabled' : ''}>${label}</button>`;
    }
    $('#timeGrid').innerHTML = html;
  }
  renderTimes();

  /* STEP 3: 로그인 사용자 정보 프리필 (GET /api/auth/me) */
  api('/api/auth/me').then(me => {
    if (me.plate && !$('#plate').value) $('#plate').value = me.plate;
    if (me.phone && !$('#phone').value) $('#phone').value = me.phone;
    summary();
  }).catch(() => {});

  /* 요금 계산 */
  function calc() {
    const lot = lots.find(l => l.id === state.lotId);
    if (!lot) return { base: 0, ev: 0, coupon: 0, total: 0 };
    const min = +$('#duration').value;
    const byTime = Math.ceil(min / 10) * lot.fee10;
    const base = lot.dayMax ? Math.min(lot.dayMax * Math.ceil(min / 1440), byTime) : byTime;
    const carType = $('input[name=carType]:checked').value;
    const ev = carType === '전기차' ? Math.round(base * 0.5) : 0; // 공영주차장 저공해(전기)차 50% 감면
    const rate = +$('#coupon').value;
    const coupon = Math.min(rate === 30 ? 10000 : Infinity, Math.round(((base - ev) * rate) / 100));
    return { lot, base, ev, coupon, total: Math.max(0, base - ev - coupon), min, carType };
  }

  function summary() {
    const c = calc();
    const lot = c.lot;
    if (lot) $('#sumImg').src = ezImg(lot.photo, 600, 280);
    $('#sumImg').hidden = !lot;
    $('#sumLot').textContent = lot ? lot.name : '-';
    $('#sumSlot').textContent = state.slot || '입차 시 AI 자동 배정';
    $('#sumDate').textContent = state.time ? `${$('#date').value} ${state.time}` : '-';
    $('#sumDur').textContent = c.min ? (c.min >= 1440 ? '종일' : `${c.min / 60}시간`) : '-';
    $('#sumCar').textContent = $('#plate').value ? `${$('#plate').value} (${c.carType})` : '-';
    $('#sumBase').textContent = won(c.base);
    $('#sumEv').textContent = `-${won(c.ev)}`;
    $('#sumCoupon').textContent = `-${won(c.coupon)}`;
    $('#sumTotal').textContent = won(c.total);
  }

  /* 스텝 이동 */
  function validate(step) {
    if (step === 1 && !state.lotId) { toast('주차장을 선택해 주세요.', 'warn'); return false; }
    if (step === 2) {
      const ok = !!state.time && $('#date').checkValidity();
      $('#timeErr').hidden = ok;
      return ok;
    }
    if (step === 3) {
      $('#plate').value = $('#plate').value.replace(/\s/g, '');
      const ok = ['#plate', '#phone'].every(s => $(s).checkValidity());
      ['#plate', '#phone'].forEach(s => $(s).classList.toggle('is-invalid', !$(s).checkValidity()));
      return ok;
    }
    if (step === 4) {
      const ok = $$('.agree').every(c => c.checked);
      $('#agreeErr').hidden = ok;
      return ok;
    }
    return true;
  }

  function go(step) {
    state.step = step;
    $$('.step-pane').forEach(p => p.classList.toggle('active', +p.dataset.pane === step));
    $$('#stepper .step').forEach(s => {
      const n = +s.dataset.step;
      s.classList.toggle('active', n === step);
      s.classList.toggle('done', n < step);
      s.querySelector('.dot').innerHTML = n < step ? '<i class="fa-solid fa-check"></i>' : n;
    });
    $('#stepBar').style.width = `${((step - 1) / 3) * 80}%`;
    $('#prevBtn').disabled = step === 1;
    $('#nextBtn').innerHTML = step === 4 ? '<i class="fa-solid fa-lock me-1"></i>결제하기' : '다음<i class="fa-solid fa-arrow-right ms-1"></i>';
    window.scrollTo({ top: $('.page-body').offsetTop - 80, behavior: 'smooth' });
  }

  /* POST /api/reservations – 요금은 서버에서 다시 계산한 금액을 표시 */
  function complete(rsv) {
    const no = rsv.rsvNo;

    // QR 모양 (데모용 패턴)
    let seed = [...no].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const finder = (r, col) => [[0, 0], [0, 14], [14, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && col >= fc && col < fc + 7 && (r === fr || r === fr + 6 || col === fc || col === fc + 6 || (r >= fr + 2 && r <= fr + 4 && col >= fc + 2 && col <= fc + 4)));
    const inFinder = (r, col) => [[0, 0], [0, 14], [14, 0]].some(([fr, fc]) => r >= fr && r < fr + 8 && col >= fc && col < fc + 8);
    let cells = '';
    for (let r = 0; r < 21; r++) for (let col = 0; col < 21; col++) cells += `<i class="${(inFinder(r, col) ? finder(r, col) : rnd() > 0.5) ? 'on' : ''}"></i>`;
    $('#qr').innerHTML = cells;
    $('#rsvNo').textContent = `예약번호 ${no}`;
    $('#doneInfo').innerHTML = `
      <div class="summary-row py-1"><span>주차장</span><b>${esc(rsv.lot)}</b></div>
      <div class="summary-row py-1"><span>입차</span><b>${esc(rsv.entryAt)}</b></div>
      <div class="summary-row py-1"><span>차량</span><b>${esc(rsv.plate)}</b></div>
      <div class="summary-row py-1"><span>결제</span><b>${esc(rsv.payMethod)} · ${won(rsv.total)}</b></div>`;
    $('#doneGuide').href = `guide.html?lot=${rsv.lotId}`;
    new bootstrap.Modal('#doneModal').show();
  }

  /* 이벤트 */
  $('#lotOptions').addEventListener('change', e => { state.lotId = +e.target.value; if (!params.get('lot') || +params.get('lot') !== state.lotId) state.slot = null; summary(); });
  $('#timeGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-time]');
    if (!b) return;
    state.time = b.dataset.time;
    $('#timeErr').hidden = true;
    renderTimes();
    summary();
  });
  $('#date').addEventListener('change', () => { renderTimes(); summary(); });
  $('#rsvForm').addEventListener('input', summary);
  $('#rsvForm').addEventListener('change', summary);
  $('#agreeAll').addEventListener('change', e => { $$('.agree').forEach(c => (c.checked = e.target.checked)); $('#agreeErr').hidden = true; });
  $$('.agree').forEach(c => c.addEventListener('change', () => { $('#agreeAll').checked = $$('.agree').every(x => x.checked); }));
  $('#prevBtn').onclick = () => go(Math.max(1, state.step - 1));
  $('#nextBtn').onclick = () => {
    if (!validate(state.step)) return;
    if (state.step < 4) return go(state.step + 1);
    const btn = $('#nextBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>결제 진행 중...';
    api('/api/reservations', {
      method: 'POST',
      body: {
        lotId: state.lotId, slot: state.slot || '', date: $('#date').value, time: state.time, minutes: +$('#duration').value,
        plate: $('#plate').value, phone: $('#phone').value.trim(), carType: $('input[name=carType]:checked').value,
        memo: $('#memo').value.trim(), payMethod: $('input[name=pay]:checked').value, couponRate: +$('#coupon').value,
        agreeTerms: $('#agree1').checked, agreePrivacy: $('#agree2').checked
      }
    }).then(complete).catch(fail).finally(() => { btn.disabled = false; go(4); });
  };

  api('/api/lots').then(list => { lots = list; renderLots(); summary(); }).catch(fail);
  summary();
})();
