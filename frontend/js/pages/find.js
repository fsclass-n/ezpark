/* 주차장 찾기 – 전국 공영주차장 (담당: 홍기흥) */
(() => {
  const { $, $$, fmt, won, occRate, occClass, occText, timeStr, url, esc, toast } = EZ;
  const { lots, HOME } = EZ_DATA;
  const params = new URLSearchParams(location.search);
  const favs = new Set(JSON.parse(localStorage.getItem('ezFav') || '[]'));
  let activeId = null;

  const colorOf = c => (c === 'low' ? 'mint' : c === 'mid' ? 'yellow' : 'red');
  const isFree = l => l.fee10 === 0;
  const known = (v, yes, no) => (v === true ? yes : v === false ? no : '현장 확인');

  /* 위경도 → 모형 지도 좌표(%) : frontend/pages/find.html 의 SVG(viewBox 600x1000)와 동일한 투영 */
  const GEO = { lng0: 125.6, lng1: 130.0, lat0: 38.75, lat1: 33.0 };
  const pos = (lat, lng) => ({ x: ((lng - GEO.lng0) / (GEO.lng1 - GEO.lng0)) * 100, y: ((GEO.lat0 - lat) / (GEO.lat0 - GEO.lat1)) * 100 });
  const me = pos(HOME.lat, HOME.lng);
  Object.assign($('#meDot').style, { left: `${me.x}%`, top: `${me.y}%` });

  /* 초기 필터 값 */
  [...new Set(lots.map(l => l.region))].forEach(r => $('#area').insertAdjacentHTML('beforeend', `<option>${r}</option>`));
  if (params.get('q')) $('#q').value = params.get('q');
  if (params.get('ev')) $('#fEv').checked = true;

  function filtered() {
    const q = $('#q').value.trim().toLowerCase();
    const region = $('#area').value;
    const paid = $('#fPaid').checked, free = $('#fFree').checked;
    const list = lots.filter(l =>
      (!q || `${l.name} ${l.addr} ${l.region} ${l.area} ${l.tags.join(' ')}`.toLowerCase().includes(q)) &&
      (!region || l.region === region) &&
      (paid === free || (paid ? !isFree(l) : isFree(l))) &&
      (!$('#fEv').checked || l.ev === true) &&
      (!$('#fDis').checked || l.disabled === true) &&
      (!$('#fAvail').checked || occRate(l) < 70));
    const sorters = {
      dist: (a, b) => a.dist - b.dist,
      avail: (a, b) => b.available - a.available,
      fee: (a, b) => a.fee10 - b.fee10,
      total: (a, b) => b.total - a.total
    };
    return list.sort(sorters[$('#sort').value]);
  }

  function render() {
    const list = filtered();
    $('#count').textContent = list.length;
    $('#updated').textContent = `${timeStr()} 갱신`;
    $('#lotList').innerHTML = list.length ? list.map(l => {
      const r = occRate(l), c = occClass(r);
      return `<div class="ez-card lot-card ${l.id === activeId ? 'active' : ''}" data-id="${l.id}" tabindex="0">
        <div class="d-flex gap-3">
          <img class="thumb" src="${ezImg(l.photo, 200, 200)}" alt="${esc(l.name)}" loading="lazy">
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between gap-2">
              <div class="min-w-0">
                <div class="d-flex flex-wrap gap-1 mb-1"><span class="ez-badge blue">${l.region}</span>${isFree(l) ? '<span class="ez-badge purple">무료</span>' : ''}${l.ev ? '<span class="ez-badge mint"><i class="fa-solid fa-bolt"></i>EV</span>' : ''}</div>
                <h6 class="text-truncate">${esc(l.name)}</h6>
                <div class="small text-muted-2 text-truncate"><i class="fa-solid fa-location-dot me-1"></i>${esc(l.addr)}</div>
              </div>
              <div class="text-end flex-shrink-0">
                <div class="avail-num text-${colorOf(c)}">${fmt(l.available)}</div>
                <div class="small text-muted-2">/ ${fmt(l.total)}면</div>
              </div>
            </div>
            <div class="occ-bar my-2"><span class="occ-${c}" style="width:${r}%"></span></div>
            <div class="d-flex justify-content-between align-items-center small gap-2">
              <span class="text-muted-2 text-truncate">${l.dist}km · ${l.feeShort}</span>
              <button class="btn btn-sm btn-soft flex-shrink-0" data-detail="${l.id}">상세</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('') : `<div class="ez-card empty-state"><i class="fa-regular fa-face-frown d-block"></i>조건에 맞는 주차장이 없습니다.</div>`;

    $('#markers').innerHTML = list.map(l => {
      const c = occClass(occRate(l)), p = pos(l.lat, l.lng);
      return `<div class="map-marker ${l.id === activeId ? 'active' : ''}" data-id="${l.id}" style="left:${p.x}%;top:${p.y}%" role="button" tabindex="0" aria-label="${esc(l.name)} 잔여 ${l.available}면">
        <span class="dot ${c}"></span><span class="tag">${esc(l.name)}<b>${fmt(l.available)}</b></span></div>`;
    }).join('');
  }

  function setActive(id, scroll) {
    activeId = id;
    $$('.lot-card').forEach(el => el.classList.toggle('active', +el.dataset.id === id));
    $$('.map-marker').forEach(el => el.classList.toggle('active', +el.dataset.id === id));
    if (scroll) {
      const card = $(`.lot-card[data-id="${id}"]`);
      const box = $('#lotList');
      if (card) box.scrollTo({ top: card.offsetTop - box.offsetTop - 4, behavior: 'smooth' });
    }
  }

  const modal = new bootstrap.Modal('#lotModal');
  function openDetail(id) {
    const l = lots.find(x => x.id === id);
    const r = occRate(l), c = occClass(r);
    const floors = l.floors.map(f => ({ f, rate: Math.min(99, Math.max(20, r + Math.round((Math.random() - 0.5) * 30))) }));
    $('#lotModalBody').innerHTML = `
      <div class="position-relative">
        <img src="${ezImg(l.photo, 1000, 420)}" alt="${esc(l.name)}" class="w-100" style="height:220px;object-fit:cover">
        <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="닫기"></button>
        <span class="position-absolute bottom-0 start-0 m-3 ez-badge ${colorOf(c)}">${occText(r)} · 점유율 ${r}% (데모)</span>
      </div>
      <div class="modal-body p-4">
        <div class="d-flex justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <div class="d-flex gap-1 mb-1"><span class="ez-badge blue">${l.region} ${esc(l.area)}</span><span class="ez-badge gray">공영 · ${l.type}</span></div>
            <h4 class="fw-800 text-navy mb-1" id="lotModalTitle">${esc(l.name)}</h4>
            <div class="text-muted-2 small"><i class="fa-solid fa-location-dot me-1"></i>${esc(l.addr)} · ${HOME.name}에서 ${l.dist}km</div>
          </div>
          <button class="btn btn-sm ${favs.has(l.id) ? 'btn-yellow' : 'btn-outline-secondary'} align-self-start" id="favBtn"><i class="fa-${favs.has(l.id) ? 'solid' : 'regular'} fa-star me-1"></i>즐겨찾기</button>
        </div>
        <div class="row g-3 mb-4 text-center">
          <div class="col-6 col-md-3"><div class="bg-soft rounded-3 p-3"><div class="small text-muted-2">잔여면 (데모)</div><div class="fw-800 font-en fs-4 text-${colorOf(c)}">${fmt(l.available)}</div></div></div>
          <div class="col-6 col-md-3"><div class="bg-soft rounded-3 p-3"><div class="small text-muted-2">주차면수</div><div class="fw-800 font-en fs-4 text-navy">${fmt(l.total)}</div></div></div>
          <div class="col-6 col-md-3"><div class="bg-soft rounded-3 p-3"><div class="small text-muted-2">기본 요금</div><div class="fw-800 fs-6 text-navy mt-1">${l.feeShort}</div></div></div>
          <div class="col-6 col-md-3"><div class="bg-soft rounded-3 p-3"><div class="small text-muted-2">1일 최대</div><div class="fw-800 fs-6 text-navy mt-1">${l.dayMax ? won(l.dayMax) : isFree(l) ? '무료' : '현장 확인'}</div></div></div>
        </div>
        <ul class="check-list small mb-4">
          <li><i class="fa-solid fa-won-sign"></i><div>요금 <b>${l.feeText}</b></div></li>
          <li><i class="fa-solid fa-clock"></i><div>운영시간 <b>${l.hours}</b></div></li>
          <li><i class="fa-solid fa-building-columns"></i><div>운영기관 <b>${l.manager || '현장 확인'}</b>${l.tel ? ` · <a href="tel:${l.tel.replace(/-/g, '')}">${l.tel}</a>` : ''}</div></li>
          <li><i class="fa-solid fa-charging-station"></i><div>전기차 충전 <b>${known(l.ev, '가능', '불가')}</b> · 장애인 전용면 <b>${known(l.disabled, '있음', '없음')}</b></div></li>
        </ul>
        <h6 class="fw-800 text-navy mb-3">층별 점유율 <span class="small text-muted-2 fw-normal">(AI 영상 인지 데모)</span></h6>
        ${floors.map(f => `<div class="d-flex align-items-center gap-3 mb-2"><b class="font-en" style="width:32px">${f.f}</b><div class="occ-bar flex-grow-1" style="height:10px"><span class="occ-${occClass(f.rate)}" style="width:${f.rate}%"></span></div><span class="small text-muted-2" style="width:42px">${f.rate}%</span></div>`).join('')}
        <div class="d-flex flex-wrap gap-2 mt-3">${l.tags.map(t => `<span class="ez-badge gray">#${t}</span>`).join('')}</div>
        <p class="small text-muted-2 mt-3 mb-0"><i class="fa-solid fa-circle-info me-1"></i>요금·운영시간은 조례 개정 등으로 바뀔 수 있으니 방문 전 현장 안내판을 확인하세요.</p>
      </div>
      <div class="modal-footer">
        <a href="${url(`pages/guide.html?lot=${l.id}`)}" class="btn btn-soft"><i class="fa-solid fa-route me-1"></i>주차 유도</a>
        <a href="${url(`pages/reservation.html?lot=${l.id}`)}" class="btn btn-primary"><i class="fa-solid fa-calendar-check me-1"></i>예약하기</a>
      </div>`;
    $('#favBtn').onclick = e => {
      favs.has(l.id) ? favs.delete(l.id) : favs.add(l.id);
      localStorage.setItem('ezFav', JSON.stringify([...favs]));
      const on = favs.has(l.id);
      e.currentTarget.className = `btn btn-sm ${on ? 'btn-yellow' : 'btn-outline-secondary'} align-self-start`;
      e.currentTarget.innerHTML = `<i class="fa-${on ? 'solid' : 'regular'} fa-star me-1"></i>즐겨찾기`;
      toast(on ? '즐겨찾기에 추가했습니다.' : '즐겨찾기에서 삭제했습니다.', on ? 'success' : 'info');
    };
    modal.show();
  }

  /* 이벤트 */
  ['#q', '#area', '#sort'].forEach(s => $(s).addEventListener('input', render));
  $('#chips').addEventListener('change', render);
  $('#lotList').addEventListener('click', e => {
    const detail = e.target.closest('[data-detail]');
    if (detail) return openDetail(+detail.dataset.detail);
    const card = e.target.closest('.lot-card');
    if (card) setActive(+card.dataset.id);
  });
  $('#lotList').addEventListener('keydown', e => {
    const card = e.target.closest('.lot-card');
    if (card && e.key === 'Enter') openDetail(+card.dataset.id);
  });
  const onMarker = e => {
    const m = e.target.closest('.map-marker');
    if (!m) return;
    if (activeId === +m.dataset.id) openDetail(activeId);
    else setActive(+m.dataset.id, true);
  };
  $('#markers').addEventListener('click', onMarker);
  $('#markers').addEventListener('keydown', e => { if (e.key === 'Enter') onMarker(e); });
  $('#btnLocate').onclick = () => { $('#sort').value = 'dist'; render(); toast(`기준 위치(${HOME.name})에서 가까운 순으로 정렬했습니다.`, 'info'); };
  $('#btnRefresh').onclick = () => { tick(); toast('잔여면 정보를 갱신했습니다. (데모)', 'success'); };

  function tick() {
    lots.forEach(l => {
      const step = Math.max(1, Math.round(l.total / 150));
      l.available = Math.max(0, Math.min(l.total, l.available + Math.round((Math.random() - 0.5) * 2 * step)));
    });
    render();
  }
  render();
  setInterval(tick, 5000);
})();
