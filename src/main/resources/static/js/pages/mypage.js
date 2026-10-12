/* 마이페이지 (담당: 홍기흥) – /api/auth/me, /api/reservations/me, /api/me/** */
(() => {
  const { $, fmt, won, esc, toast, api, fail, url, occRate, occClass } = EZ;
  let me = null;
  let lots = [];
  let reservations = [];

  /* 프로필 */
  const renderProfile = () => {
    $('#pName').textContent = me.name;
    $('#pEmail').textContent = me.email;
    $('#pRole').innerHTML = me.role === 'ADMIN' ? '<i class="fa-solid fa-user-shield"></i> 관리자' : me.role === 'BIZ' ? '<i class="fa-solid fa-building"></i> 기업 회원' : '<i class="fa-solid fa-crown"></i> 일반 회원';
    $('#sName').value = me.name;
    $('#sEmail').value = me.email;
    $('#sPhone').value = me.phone || '';
  };

  /* 예약 – 예정(upcoming) / 이용 내역 */
  function renderUpcoming() {
    const list = reservations.filter(r => r.upcoming);
    $('#upcoming').innerHTML = list.length ? list.slice(0, 5).map((r, i) => `
      <div class="d-flex flex-wrap align-items-center gap-3 py-3 ${i ? 'border-top' : ''}">
        <div class="icon-box sm blue"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="flex-grow-1">
          <div class="fw-bold text-navy">${esc(r.lot)} ${r.slot ? `<span class="ez-badge gray ms-1">${esc(r.slot)}</span>` : ''}</div>
          <div class="small text-muted-2">${esc(r.entryAt)} · ${r.minutes >= 1440 ? '종일' : r.minutes / 60 + '시간'} · ${esc(r.plate)} · ${won(r.total)}</div>
        </div>
        <span class="font-en small text-muted-2">${esc(r.rsvNo)}</span>
        <a class="btn btn-sm btn-soft" href="${url(`pages/guide.html?lot=${r.lotId}`)}">유도</a>
        <button class="btn btn-sm btn-outline-danger" data-cancel="${esc(r.rsvNo)}">취소</button>
      </div>`).join('')
      : `<div class="empty-state py-4"><i class="fa-regular fa-calendar d-block"></i>예정된 예약이 없습니다.<br><a href="reservation.html" class="fw-bold">지금 예약하기</a></div>`;
  }
  $('#upcoming').addEventListener('click', async e => {
    const b = e.target.closest('[data-cancel]');
    if (!b || !confirm('예약을 취소하시겠습니까?')) return;
    try {
      await api(`/api/reservations/${encodeURIComponent(b.dataset.cancel)}`, { method: 'DELETE' });
      await loadReservations();
      toast('예약이 취소되었습니다.', 'info');
    } catch (err) { fail(err); }
  });

  const statusBadge = s => ({ 예약: 'blue', 이용완료: 'mint', 취소: 'gray' }[s] || 'gray');
  function renderHistory() {
    const f = $('#histFilter').value;
    const list = reservations.filter(r => !f || r.statusText === f);
    $('#histBody').innerHTML = list.map(r => `
      <tr><td class="text-nowrap">${esc(r.entryAt)}</td><td class="text-nowrap fw-bold text-navy">${esc(r.lot)}</td><td>${esc(r.slot || '자동 배정')}</td>
      <td class="text-nowrap">${r.minutes >= 1440 ? '종일' : r.minutes / 60 + '시간'}</td>
      <td class="text-end font-en fw-bold">${won(r.total)}</td><td><span class="ez-badge ${statusBadge(r.statusText)}">${r.statusText}</span></td>
      <td><button class="btn btn-sm btn-light text-nowrap" data-receipt ${r.status === 'CANCELED' ? 'disabled' : ''}><i class="fa-solid fa-file-invoice me-1"></i>영수증</button></td></tr>`).join('')
      || '<tr><td colspan="7" class="text-center text-muted-2 py-4">이용 내역이 없습니다.</td></tr>';
  }
  $('#histFilter').innerHTML = '<option value="">전체</option><option>예약</option><option>이용완료</option><option>취소</option>';
  $('#histFilter').addEventListener('change', renderHistory);
  $('#histBody').addEventListener('click', e => { if (e.target.closest('[data-receipt]')) toast('영수증 PDF 발급은 결제 연동(P4) 이후 제공됩니다.', 'info'); });

  async function loadReservations() {
    reservations = await api('/api/reservations/me');
    renderUpcoming();
    renderHistory();
  }

  /* 내 차량 */
  const typeIcon = t => ({ 소형: 'fa-car-side', 중형: 'fa-car', 대형: 'fa-truck-pickup', 전기차: 'fa-charging-station' }[t] || 'fa-car');
  function renderCars(cars) {
    $('#carCount').textContent = cars.length;
    $('#carList').innerHTML = cars.map(c => `
      <div class="col-md-6"><div class="ez-card vehicle-card">
        <div class="icon-box ${c.type === '전기차' ? 'mint' : 'blue'}"><i class="fa-solid ${typeIcon(c.type)}"></i></div>
        <div class="flex-grow-1">
          <div class="car-plate mb-1">${esc(c.plate)}</div>
          <div class="small text-muted-2">${esc(c.model)} · ${esc(c.type)} ${c.main ? '<span class="ez-badge blue ms-1">대표</span>' : ''}</div>
        </div>
        <div class="dropdown">
          <button class="btn btn-sm btn-light" data-bs-toggle="dropdown" aria-label="더보기"><i class="fa-solid fa-ellipsis-vertical"></i></button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><button class="dropdown-item" data-main="${c.id}">대표 차량 지정</button></li>
            <li><button class="dropdown-item text-danger" data-del="${c.id}">삭제</button></li>
          </ul>
        </div>
      </div></div>`).join('') || `<div class="col-12"><div class="ez-card empty-state"><i class="fa-solid fa-car d-block"></i>등록된 차량이 없습니다.</div></div>`;
  }
  $('#carList').addEventListener('click', async e => {
    const m = e.target.closest('[data-main]'), d = e.target.closest('[data-del]');
    try {
      if (m) { renderCars(await api(`/api/me/vehicles/${m.dataset.main}/main`, { method: 'PATCH' })); toast('대표 차량이 변경되었습니다.'); }
      if (d && confirm('차량을 삭제하시겠습니까?')) { renderCars(await api(`/api/me/vehicles/${d.dataset.del}`, { method: 'DELETE' })); toast('차량이 삭제되었습니다.', 'info'); }
    } catch (err) { fail(err); }
  });
  $('#carForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    $('#cPlate').value = $('#cPlate').value.replace(/\s/g, '');
    f.classList.add('was-validated');
    if (!f.checkValidity()) return;
    try {
      renderCars(await api('/api/me/vehicles', { method: 'POST', body: { plate: $('#cPlate').value, model: $('#cModel').value.trim(), type: $('#cType').value } }));
      f.reset();
      f.classList.remove('was-validated');
      bootstrap.Modal.getInstance('#carModal').hide();
      toast('차량이 등록되었습니다.');
    } catch (err) { fail(err); }
  });

  /* 즐겨찾기 */
  async function renderFav() {
    const ids = await api('/api/me/favorites');
    const list = lots.filter(l => ids.includes(l.id));
    $('#favList').innerHTML = list.map(l => {
      const r = occRate(l), c = occClass(r);
      return `<div class="col-md-6"><div class="ez-card overflow-hidden ez-card-hover">
        <img src="${ezImg(l.photo, 600, 260)}" class="w-100" style="height:140px;object-fit:cover" alt="${esc(l.name)}" loading="lazy">
        <div class="p-3">
          <div class="d-flex justify-content-between"><b class="text-navy">${esc(l.name)}</b><span class="fw-800 font-en text-${c === 'low' ? 'mint' : c === 'mid' ? 'yellow' : 'red'}">${fmt(l.available)}면</span></div>
          <div class="small text-muted-2 mb-3">${esc(l.addr)}</div>
          <div class="d-flex gap-2"><a class="btn btn-sm btn-soft flex-fill" href="guide.html?lot=${l.id}">주차 유도</a><a class="btn btn-sm btn-primary flex-fill" href="reservation.html?lot=${l.id}">예약</a></div>
        </div></div></div>`;
    }).join('') || `<div class="col-12"><div class="ez-card empty-state"><i class="fa-regular fa-star d-block"></i>즐겨찾는 주차장이 없습니다. <a href="find.html">주차장 찾기</a>에서 ★를 눌러 추가하세요.</div></div>`;
  }

  /* 설정 저장 – PUT /api/me */
  $('#profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    f.classList.add('was-validated');
    if (!f.checkValidity()) return;
    try {
      const res = await api('/api/me', { method: 'PUT', body: { name: $('#sName').value.trim(), phone: $('#sPhone').value.trim(), newPassword: $('#sPw').value } });
      me.name = $('#sName').value.trim();
      me.phone = $('#sPhone').value.trim();
      renderProfile();
      $('#sPw').value = '';
      f.classList.remove('was-validated');
      toast(res.message);
    } catch (err) { fail(err); }
  });

  /* 해시로 탭 열기 (예: mypage.html#tabCar) */
  if (location.hash) {
    const btn = $(`[data-bs-target="${location.hash}"]`);
    if (btn) bootstrap.Tab.getOrCreateInstance(btn).show();
  }

  /* 초기 로드 */
  (async () => {
    try {
      [me, lots] = await Promise.all([api('/api/auth/me'), api('/api/lots')]);
      renderProfile();
      renderCars(await api('/api/me/vehicles'));
      await loadReservations();
      await renderFav();
      const month = new Date().toISOString().slice(0, 7);
      const used = reservations.filter(r => r.status !== 'CANCELED' && r.date.startsWith(month));
      $('#stUse').innerHTML = `${used.length}<small class="fs-6">회</small>`;
      $('#stPay').textContent = fmt(used.reduce((s, r) => s + r.total, 0));
    } catch (err) { fail(err); }
  })();
})();
