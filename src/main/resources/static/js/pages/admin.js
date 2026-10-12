/* 관리자 (담당: 박미금) – /api/admin/** (ADMIN 전용) */
(() => {
  const { $, $$, fmt, esc, toast, api, fail } = EZ;
  const PER = 8;
  let users = [], lots = [], inquiries = [], notices = [];
  let uPage = 1, inqStatus = '';

  function renderKpi() {
    $('#kUsers').textContent = fmt(users.length);
    $('#kBiz').textContent = users.filter(u => u.role === 'BIZ').length;
    $('#kInq').textContent = inquiries.filter(i => i.status === '접수' || i.status === '상담중').length;
    $('#kLots').textContent = lots.length;
  }

  /* ---------- 회원 ---------- */
  const roleBadge = r => ({ ADMIN: ['red', '관리자'], BIZ: ['purple', '기업'], USER: ['blue', '일반'] }[r] || ['gray', r]);
  function renderUsers() {
    const q = $('#uSearch').value.trim().toLowerCase(), role = $('#uRole').value;
    const list = users.filter(u => (!q || `${u.name} ${u.email} ${u.plate || ''}`.toLowerCase().includes(q)) && (!role || u.role === role));
    const pages = Math.max(1, Math.ceil(list.length / PER));
    uPage = Math.min(uPage, pages);
    $('#uBody').innerHTML = list.slice((uPage - 1) * PER, uPage * PER).map(u => {
      const [c, t] = roleBadge(u.role);
      return `<tr>
        <td><div class="d-flex align-items-center gap-2"><span class="avatar-sm">${esc(u.name[0])}</span><b class="text-navy">${esc(u.name)}</b></div></td>
        <td class="small">${esc(u.email)}</td><td>${u.plate ? `<span class="car-plate" style="font-size:.8rem;padding:.1rem .45rem">${esc(u.plate)}</span>` : '<span class="text-muted-2">-</span>'}</td>
        <td><span class="ez-badge ${c}">${t}</span></td><td class="small font-en">${esc(u.joined)}</td>
        <td><span class="status-dot" style="background:${u.status === '정상' ? 'var(--ez-mint)' : 'var(--ez-gray-400)'}"></span><span class="small">${u.status}</span></td>
        <td class="text-end text-nowrap">
          <select class="form-select form-select-sm d-inline-block w-auto" data-role="${u.id}" aria-label="권한 변경">
            ${['USER', 'BIZ', 'ADMIN'].map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${roleBadge(r)[1]}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-light" data-toggle-status="${u.id}" title="${u.status === '정상' ? '휴면 처리' : '활성화'}"><i class="fa-solid fa-${u.status === '정상' ? 'user-slash' : 'user-check'}"></i></button>
        </td></tr>`;
    }).join('') || '<tr><td colspan="7" class="text-center text-muted-2 py-4">검색 결과가 없습니다.</td></tr>';
    $('#uInfo').textContent = `총 ${list.length}명 · ${uPage}/${pages} 페이지`;
    $('#uPager').innerHTML = `<li class="page-item ${uPage === 1 ? 'disabled' : ''}"><button class="page-link" data-page="${uPage - 1}" aria-label="이전">‹</button></li>` +
      Array.from({ length: pages }, (_, i) => `<li class="page-item ${uPage === i + 1 ? 'active' : ''}"><button class="page-link" data-page="${i + 1}">${i + 1}</button></li>`).join('') +
      `<li class="page-item ${uPage === pages ? 'disabled' : ''}"><button class="page-link" data-page="${uPage + 1}" aria-label="다음">›</button></li>`;
  }
  const replaceUser = u => { users = users.map(x => (x.id === u.id ? u : x)); renderUsers(); renderKpi(); };
  $('#uSearch').addEventListener('input', () => { uPage = 1; renderUsers(); });
  $('#uRole').addEventListener('change', () => { uPage = 1; renderUsers(); });
  $('#uPager').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b) { uPage = +b.dataset.page; renderUsers(); } });
  $('#uBody').addEventListener('change', async e => {
    const s = e.target.closest('[data-role]');
    if (!s) return;
    try {
      replaceUser(await api(`/api/admin/users/${s.dataset.role}/role`, { method: 'PATCH', body: { role: s.value } }));
      toast('회원 권한이 변경되었습니다.');
    } catch (err) { fail(err); renderUsers(); }
  });
  $('#uBody').addEventListener('click', async e => {
    const b = e.target.closest('[data-toggle-status]');
    if (!b) return;
    try {
      const u = await api(`/api/admin/users/${b.dataset.toggleStatus}/status`, { method: 'PATCH' });
      replaceUser(u);
      toast(`${u.name} 회원이 ${u.status} 상태로 변경되었습니다.`, 'info');
    } catch (err) { fail(err); }
  });

  /* ---------- 주차장 ---------- */
  const lotModal = new bootstrap.Modal('#lotModal');
  function renderLots() {
    const q = $('#lSearch').value.trim().toLowerCase();
    $('#lBody').innerHTML = lots.filter(l => !q || `${l.name} ${l.addr}`.toLowerCase().includes(q)).map(l => `
      <tr><td class="font-en small">${l.id}</td><td class="fw-bold text-navy text-nowrap">${esc(l.name)}</td>
      <td><span class="ez-badge blue">${esc(l.region)}</span> <span class="ez-badge gray">${esc(l.type)}</span></td><td class="small text-nowrap">${esc(l.addr)}</td>
      <td class="text-end font-en">${fmt(l.total)}</td><td class="text-end text-nowrap small">${esc(l.feeShort)}</td>
      <td>${l.ev ? '<i class="fa-solid fa-bolt text-mint"></i>' : '<span class="text-muted-2">-</span>'}</td>
      <td class="text-end text-nowrap"><button class="btn btn-sm btn-light" data-edit="${l.id}" aria-label="수정"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-sm btn-light text-danger" data-del="${l.id}" aria-label="삭제"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
  }
  function openLot(l) {
    const f = $('#lotForm');
    f.reset();
    f.classList.remove('was-validated');
    $('#lotModalTitle').textContent = l ? '주차장 수정' : '주차장 등록';
    $('#fId').value = l ? l.id : '';
    if (l) {
      $('#fName').value = l.name; $('#fAddr').value = l.addr; $('#fType').value = l.type; $('#fArea').value = l.region;
      $('#fTotal').value = l.total; $('#fFee').value = l.fee10; $('#fEv').checked = l.ev === true;
    }
    lotModal.show();
  }
  const loadLots = async () => { lots = await api('/api/lots'); renderLots(); renderKpi(); };
  $('#lSearch').addEventListener('input', renderLots);
  $('#lAdd').onclick = () => openLot(null);
  $('#lBody').addEventListener('click', async e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) openLot(lots.find(l => l.id === +ed.dataset.edit));
    if (del && confirm('주차장을 삭제하시겠습니까? (예약 이력이 있으면 삭제할 수 없습니다)')) {
      try {
        await api(`/api/admin/lots/${del.dataset.del}`, { method: 'DELETE' });
        await loadLots();
        toast('주차장이 삭제되었습니다.', 'info');
      } catch (err) { fail(err); }
    }
  });
  $('#lotForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    f.classList.add('was-validated');
    if (!f.checkValidity()) return;
    const id = $('#fId').value;
    const body = { name: $('#fName').value.trim(), addr: $('#fAddr').value.trim(), type: $('#fType').value, region: $('#fArea').value.trim(), total: +$('#fTotal').value, fee10: +$('#fFee').value, ev: $('#fEv').checked };
    try {
      await api(id ? `/api/admin/lots/${id}` : '/api/admin/lots', { method: id ? 'PUT' : 'POST', body });
      lotModal.hide();
      await loadLots();
      toast(id ? '주차장 정보가 수정되었습니다.' : '주차장이 등록되었습니다.');
    } catch (err) { fail(err); }
  });

  /* 공공데이터 동기화 – POST /api/admin/public-data/sync */
  $('#lSync').onclick = async () => {
    const keyword = prompt('주소 키워드로 필터링할까요? (예: 서울특별시 종로구, 비우면 전체)\n※ 1회 100건씩, 공영주차장만 반영됩니다.', '');
    if (keyword === null) return;
    const btn = $('#lSync');
    btn.disabled = true;
    try {
      const r = await api(`/api/admin/public-data/sync?pageNo=1&numOfRows=100${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`, { method: 'POST' });
      await loadLots();
      toast(`동기화 완료: 조회 ${r.fetched}건 · 신규 ${r.inserted} · 갱신 ${r.updated} · 제외 ${r.skipped}`, 'success');
    } catch (err) { fail(err); } finally { btn.disabled = false; }
  };

  /* ---------- 기업 문의 ---------- */
  const stColor = { 접수: 'yellow', 상담중: 'blue', 견적발송: 'purple', 계약완료: 'mint' };
  function renderInq() {
    $('#iBody').innerHTML = inquiries.filter(i => !inqStatus || i.status === inqStatus).map(i => `
      <tr><td class="small font-en">${esc(i.date)}</td><td class="fw-bold text-navy text-nowrap">${esc(i.company)}</td><td>${esc(i.industry)}</td><td>${esc(i.name)}</td>
      <td class="text-end font-en">${fmt(i.slots)}</td><td><span class="ez-badge gray">${esc(i.plan)}</span></td>
      <td><select class="form-select form-select-sm w-auto" data-inq="${i.id}" aria-label="상태 변경">
        ${Object.keys(stColor).map(s => `<option ${i.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('') ||
      '<tr><td colspan="7" class="text-center text-muted-2 py-4">해당 상태의 문의가 없습니다.</td></tr>';
  }
  $('#inqFilter').addEventListener('click', e => {
    const b = e.target.closest('[data-s]');
    if (!b) return;
    inqStatus = b.dataset.s;
    $$('#inqFilter button').forEach(x => (x.className = `btn btn-sm ${x === b ? 'btn-primary' : 'btn-light'}`));
    renderInq();
  });
  $('#iBody').addEventListener('change', async e => {
    const s = e.target.closest('[data-inq]');
    if (!s) return;
    try {
      await api(`/api/admin/inquiries/${s.dataset.inq}/status`, { method: 'PATCH', body: { status: s.value } });
      inquiries.find(i => i.id === +s.dataset.inq).status = s.value;
      renderInq(); renderKpi();
      toast(`문의 상태가 '${s.value}'(으)로 변경되었습니다.`);
    } catch (err) { fail(err); }
  });

  /* ---------- 공지 ---------- */
  const noticeModal = new bootstrap.Modal('#noticeModal');
  function renderNotices() {
    $('#nBody').innerHTML = notices.map(n => `
      <tr><td class="font-en small">${n.pinned ? '<i class="fa-solid fa-thumbtack text-red"></i>' : n.id}</td>
      <td><span class="ez-badge ${n.cat === '점검' ? 'yellow' : n.cat === '이벤트' ? 'mint' : 'blue'}">${esc(n.cat)}</span></td>
      <td class="fw-bold text-navy">${esc(n.title)}</td><td class="small font-en text-nowrap">${esc(n.date)}</td><td class="text-end font-en">${fmt(n.views)}</td>
      <td class="text-end text-nowrap"><button class="btn btn-sm btn-light" data-pin="${n.id}" title="상단 고정"><i class="fa-solid fa-thumbtack"></i></button>
      <button class="btn btn-sm btn-light text-danger" data-ndel="${n.id}" aria-label="삭제"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
  }
  $('#nAdd').onclick = () => { $('#noticeForm').reset(); $('#noticeForm').classList.remove('was-validated'); noticeModal.show(); };
  $('#noticeForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    f.classList.add('was-validated');
    if (!f.checkValidity()) return;
    try {
      notices = await api('/api/admin/notices', { method: 'POST', body: { cat: $('#nCat').value, title: $('#nTitle').value.trim(), body: $('#nBodyTxt').value.trim() } });
      noticeModal.hide();
      renderNotices();
      toast('공지사항이 등록되었습니다.');
    } catch (err) { fail(err); }
  });
  $('#nBody').addEventListener('click', async e => {
    const p = e.target.closest('[data-pin]'), d = e.target.closest('[data-ndel]');
    try {
      if (p) { notices = await api(`/api/admin/notices/${p.dataset.pin}/pin`, { method: 'PATCH' }); renderNotices(); toast('상단 고정 상태를 변경했습니다.', 'info'); }
      if (d && confirm('공지사항을 삭제하시겠습니까?')) { notices = await api(`/api/admin/notices/${d.dataset.ndel}`, { method: 'DELETE' }); renderNotices(); toast('삭제되었습니다.', 'info'); }
    } catch (err) { fail(err); }
  });

  /* ---------- 초기 로드 ---------- */
  (async () => {
    try {
      [users, lots, inquiries, notices] = await Promise.all([api('/api/admin/users'), api('/api/lots'), api('/api/admin/inquiries'), api('/api/notices')]);
      renderKpi(); renderUsers(); renderLots(); renderInq(); renderNotices();
    } catch (err) { fail(err); }
  })();
})();
