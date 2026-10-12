/* 마이페이지 (담당: 홍기흥) */
(() => {
  const { $, $$, fmt, won, esc, toast, auth, url, occRate, occClass } = EZ;
  const user = auth.get() || { name: '홍기흥', email: 'demo@ezpark.kr', role: 'USER', plate: '12가3456', phone: '010-1234-5678', demo: true };
  $('#guestAlert').hidden = !user.demo;

  /* 프로필 */
  const renderProfile = () => {
    $('#pName').textContent = user.name;
    $('#pEmail').textContent = user.email;
    $('#pRole').innerHTML = user.role === 'ADMIN' ? '<i class="fa-solid fa-user-shield"></i> 관리자' : user.role === 'BIZ' ? '<i class="fa-solid fa-building"></i> 기업 회원' : '<i class="fa-solid fa-crown"></i> 일반 회원';
    $('#sName').value = user.name;
    $('#sEmail').value = user.email;
    $('#sPhone').value = user.phone || '';
  };
  renderProfile();

  /* 예정된 예약 */
  function renderUpcoming() {
    const list = JSON.parse(localStorage.getItem('ezReservations') || '[]');
    $('#upcoming').innerHTML = list.length ? list.slice(0, 5).map((r, i) => `
      <div class="d-flex flex-wrap align-items-center gap-3 py-3 ${i ? 'border-top' : ''}">
        <div class="icon-box sm blue"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="flex-grow-1">
          <div class="fw-bold text-navy">${esc(r.lot)} ${r.slot ? `<span class="ez-badge gray ms-1">${esc(r.slot)}</span>` : ''}</div>
          <div class="small text-muted-2">${r.date} ${r.time} · ${r.minutes >= 1440 ? '종일' : r.minutes / 60 + '시간'} · ${esc(r.plate)} · ${won(r.total)}</div>
        </div>
        <span class="font-en small text-muted-2">${r.no}</span>
        <a class="btn btn-sm btn-soft" href="${url(`pages/guide.html?lot=${r.lotId}`)}">유도</a>
        <button class="btn btn-sm btn-outline-danger" data-cancel="${r.no}">취소</button>
      </div>`).join('')
      : `<div class="empty-state py-4"><i class="fa-regular fa-calendar d-block"></i>예정된 예약이 없습니다.<br><a href="reservation.html" class="fw-bold">지금 예약하기</a></div>`;
  }
  $('#upcoming').addEventListener('click', e => {
    const b = e.target.closest('[data-cancel]');
    if (!b || !confirm('예약을 취소하시겠습니까?')) return;
    const list = JSON.parse(localStorage.getItem('ezReservations') || '[]').filter(r => r.no !== b.dataset.cancel);
    localStorage.setItem('ezReservations', JSON.stringify(list));
    renderUpcoming();
    toast('예약이 취소되었습니다.', 'info');
  });
  renderUpcoming();

  /* 내 차량 */
  const loadCars = () => JSON.parse(localStorage.getItem('ezVehicles') || 'null') || [
    { plate: user.plate || '12가3456', model: '아이오닉 5', type: '전기차', main: true },
    { plate: '345나6789', model: '쏘렌토', type: '대형', main: false }
  ];
  let cars = loadCars();
  const saveCars = () => localStorage.setItem('ezVehicles', JSON.stringify(cars));
  const typeIcon = t => ({ 소형: 'fa-car-side', 중형: 'fa-car', 대형: 'fa-truck-pickup', 전기차: 'fa-charging-station' }[t] || 'fa-car');
  function renderCars() {
    $('#carCount').textContent = cars.length;
    $('#carList').innerHTML = cars.map((c, i) => `
      <div class="col-md-6"><div class="ez-card vehicle-card">
        <div class="icon-box ${c.type === '전기차' ? 'mint' : 'blue'}"><i class="fa-solid ${typeIcon(c.type)}"></i></div>
        <div class="flex-grow-1">
          <div class="car-plate mb-1">${esc(c.plate)}</div>
          <div class="small text-muted-2">${esc(c.model)} · ${c.type} ${c.main ? '<span class="ez-badge blue ms-1">대표</span>' : ''}</div>
        </div>
        <div class="dropdown">
          <button class="btn btn-sm btn-light" data-bs-toggle="dropdown" aria-label="더보기"><i class="fa-solid fa-ellipsis-vertical"></i></button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><button class="dropdown-item" data-main="${i}">대표 차량 지정</button></li>
            <li><button class="dropdown-item text-danger" data-del="${i}">삭제</button></li>
          </ul>
        </div>
      </div></div>`).join('') || `<div class="col-12"><div class="ez-card empty-state"><i class="fa-solid fa-car d-block"></i>등록된 차량이 없습니다.</div></div>`;
  }
  $('#carList').addEventListener('click', e => {
    const m = e.target.closest('[data-main]'), d = e.target.closest('[data-del]');
    if (m) { cars.forEach((c, i) => (c.main = i === +m.dataset.main)); toast('대표 차량이 변경되었습니다.'); }
    if (d) {
      if (!confirm('차량을 삭제하시겠습니까?')) return;
      const wasMain = cars[+d.dataset.del].main;
      cars.splice(+d.dataset.del, 1);
      if (wasMain && cars[0]) cars[0].main = true;
      toast('차량이 삭제되었습니다.', 'info');
    }
    if (m || d) { saveCars(); renderCars(); }
  });
  $('#carForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    $('#cPlate').value = $('#cPlate').value.replace(/\s/g, '');
    f.classList.add('was-validated');
    if (!f.checkValidity()) return;
    if (cars.length >= 5) return toast('차량은 최대 5대까지 등록할 수 있습니다.', 'warn');
    if (cars.some(c => c.plate === $('#cPlate').value)) return toast('이미 등록된 차량번호입니다.', 'error');
    cars.push({ plate: $('#cPlate').value, model: $('#cModel').value.trim(), type: $('#cType').value, main: !cars.length });
    saveCars();
    renderCars();
    f.reset();
    f.classList.remove('was-validated');
    bootstrap.Modal.getInstance('#carModal').hide();
    toast('차량이 등록되었습니다.');
  });
  renderCars();

  /* 이용 내역 */
  const statusBadge = s => ({ 완료: 'blue', 할인적용: 'mint', 취소: 'gray' }[s]);
  function renderHistory() {
    const f = $('#histFilter').value;
    $('#histBody').innerHTML = EZ_DATA.history.filter(h => !f || h.status === f).map(h => `
      <tr><td class="text-nowrap">${h.date}</td><td class="text-nowrap fw-bold text-navy">${h.lot}</td><td>${h.slot}</td><td class="text-nowrap">${h.time}</td>
      <td class="text-end font-en fw-bold">${won(h.fee)}</td><td><span class="ez-badge ${statusBadge(h.status)}">${h.status}</span></td>
      <td><button class="btn btn-sm btn-light text-nowrap" data-receipt ${h.status === '취소' ? 'disabled' : ''}><i class="fa-solid fa-file-invoice me-1"></i>영수증</button></td></tr>`).join('');
  }
  $('#histFilter').addEventListener('change', renderHistory);
  $('#histBody').addEventListener('click', e => { if (e.target.closest('[data-receipt]')) toast('영수증 PDF 다운로드는 백엔드 연동 후 제공됩니다.', 'info'); });
  renderHistory();

  /* 즐겨찾기 */
  function renderFav() {
    const ids = JSON.parse(localStorage.getItem('ezFav') || '[1,2]');
    const list = EZ_DATA.lots.filter(l => ids.includes(l.id));
    $('#favList').innerHTML = list.map(l => {
      const r = occRate(l), c = occClass(r);
      return `<div class="col-md-6"><div class="ez-card overflow-hidden ez-card-hover">
        <img src="${ezImg(l.photo, 600, 260)}" class="w-100" style="height:140px;object-fit:cover" alt="${esc(l.name)}" loading="lazy">
        <div class="p-3">
          <div class="d-flex justify-content-between"><b class="text-navy">${esc(l.name)}</b><span class="fw-800 font-en text-${c === 'low' ? 'mint' : c === 'mid' ? 'yellow' : 'red'}">${fmt(l.available)}면</span></div>
          <div class="small text-muted-2 mb-3">${esc(l.addr)}</div>
          <div class="d-flex gap-2"><a class="btn btn-sm btn-soft flex-fill" href="guide.html?lot=${l.id}">주차 유도</a><a class="btn btn-sm btn-primary flex-fill" href="reservation.html?lot=${l.id}">예약</a></div>
        </div></div></div>`;
    }).join('') || `<div class="col-12"><div class="ez-card empty-state"><i class="fa-regular fa-star d-block"></i>즐겨찾는 주차장이 없습니다. <a href="find.html">주차장 찾기</a></div></div>`;
  }
  renderFav();

  /* 설정 저장 */
  $('#profileForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    f.classList.add('was-validated');
    if (!f.checkValidity()) return;
    user.name = $('#sName').value.trim();
    user.phone = $('#sPhone').value.trim();
    if (!user.demo) auth.set(user);
    renderProfile();
    $('#sPw').value = '';
    f.classList.remove('was-validated');
    toast(user.demo ? '데모 계정은 저장되지 않습니다. (화면에만 반영)' : '회원 정보가 저장되었습니다.', user.demo ? 'warn' : 'success');
  });

  /* 해시로 탭 열기 (예: mypage.html#tabCar) */
  if (location.hash) {
    const btn = $(`[data-bs-target="${location.hash}"]`);
    if (btn) bootstrap.Tab.getOrCreateInstance(btn).show();
  }
})();
