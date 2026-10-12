/* 관리자 (담당: 박미금) */
(() => {
  const { $, $$, fmt, esc, toast, auth } = EZ;
  const users = EZ_DATA.users;
  const lots = EZ_DATA.lots;
  const notices = EZ_DATA.notices;
  const inquiries = [...JSON.parse(localStorage.getItem('ezInquiries') || '[]'), ...EZ_DATA.inquiries];
  const PER = 8;
  let uPage = 1, inqStatus = '';

  $('#roleAlert').hidden = (auth.get() || {}).role === 'ADMIN';

  function renderKpi() {
    $('#kUsers').textContent = fmt(users.length);
    $('#kBiz').textContent = users.filter(u => u.role === 'BIZ').length;
    $('#kInq').textContent = inquiries.filter(i => i.status === '접수' || i.status === '상담중').length;
    $('#kLots').textContent = lots.length;
  }

  /* 회원 */
  const roleBadge = r => ({ ADMIN: ['red', '관리자'], BIZ: ['purple', '기업'], USER: ['blue', '일반'] }[r]);
  function renderUsers() {
    const q = $('#uSearch').value.trim().toLowerCase(), role = $('#uRole').value;
    const list = users.filter(u => (!q || `${u.name} ${u.email} ${u.plate}`.toLowerCase().includes(q)) && (!role || u.role === role));
    const pages = Math.max(1, Math.ceil(list.length / PER));
    uPage = Math.min(uPage, pages);
    $('#uBody').innerHTML = list.slice((uPage - 1) * PER, uPage * PER).map(u => {
      const [c, t] = roleBadge(u.role);
      return `<tr>
        <td><div class="d-flex align-items-center gap-2"><span class="avatar-sm">${esc(u.name[0])}</span><b class="text-navy">${esc(u.name)}</b></div></td>
        <td class="small">${esc(u.email)}</td><td><span class="car-plate" style="font-size:.8rem;padding:.1rem .45rem">${esc(u.plate)}</span></td>
        <td><span class="ez-badge ${c}">${t}</span></td><td class="small font-en">${u.joined}</td>
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
  $('#uSearch').addEventListener('input', () => { uPage = 1; renderUsers(); });
  $('#uRole').addEventListener('change', () => { uPage = 1; renderUsers(); });
  $('#uPager').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b) { uPage = +b.dataset.page; renderUsers(); } });
  $('#uBody').addEventListener('change', e => {
    const s = e.target.closest('[data-role]');
    if (!s) return;
    users.find(u => u.id === +s.dataset.role).role = s.value;
    renderUsers(); renderKpi();
    toast('회원 권한이 변경되었습니다.');
  });
  $('#uBody').addEventListener('click', e => {
    const b = e.target.closest('[data-toggle-status]');
    if (!b) return;
    const u = users.find(x => x.id === +b.dataset.toggleStatus);
    u.status = u.status === '정상' ? '휴면' : '정상';
    renderUsers();
    toast(`${u.name} 회원이 ${u.status} 상태로 변경되었습니다.`, 'info');
  });

  /* 주차장 */
  const lotModal = new bootstrap.Modal('#lotModal');
  function renderLots() {
    const q = $('#lSearch').value.trim().toLowerCase();
    $('#lBody').innerHTML = lots.filter(l => !q || `${l.name} ${l.addr}`.toLowerCase().includes(q)).map(l => `
      <tr><td class="font-en small">${l.id}</td><td class="fw-bold text-navy text-nowrap">${esc(l.name)}</td>
      <td><span class="ez-badge ${l.type === '공영' ? 'blue' : 'gray'}">${l.type}</span></td><td class="small text-nowrap">${esc(l.addr)}</td>
      <td class="text-end font-en">${fmt(l.total)}</td><td class="text-end font-en">${fmt(l.fee10)}</td>
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
      $('#fName').value = l.name; $('#fAddr').value = l.addr; $('#fType').value = l.type; $('#fArea').value = l.area;
      $('#fTotal').value = l.total; $('#fFee').value = l.fee10; $('#fEv').checked = l.ev;
    }
    lotModal.show();
  }
  $('#lSearch').addEventListener('input', renderLots);
  $('#lAdd').onclick = () => openLot(null);
  $('#lBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) openLot(lots.find(l => l.id === +ed.dataset.edit));
    if (del && confirm('주차장을 삭제하시겠습니까?')) {
      lots.splice(lots.findIndex(l => l.id === +del.dataset.del), 1);
      renderLots(); renderKpi();
      toast('주차장이 삭제되었습니다.', 'info');
    }
  });
  $('#lotForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    f.classList.add('was-validated');
    if (!f.checkValidity()) return;
    const data = { name: $('#fName').value.trim(), addr: $('#fAddr').value.trim(), type: $('#fType').value, area: $('#fArea').value.trim(), total: +$('#fTotal').value, fee10: +$('#fFee').value, ev: $('#fEv').checked };
    const id = +$('#fId').value;
    if (id) Object.assign(lots.find(l => l.id === id), data);
    else lots.push({ id: Math.max(...lots.map(l => l.id)) + 1, available: data.total, dayMax: data.fee10 * 36, disabled: true, x: 50, y: 50, dist: 0, rating: 0, photo: 'garageExit', floors: ['B1'], tags: [], ...data });
    lotModal.hide();
    renderLots(); renderKpi();
    toast(id ? '주차장 정보가 수정되었습니다.' : '주차장이 등록되었습니다.');
  });

  /* 기업 문의 */
  const stColor = { 접수: 'yellow', 상담중: 'blue', 견적발송: 'purple', 계약완료: 'mint' };
  function renderInq() {
    $('#iBody').innerHTML = inquiries.filter(i => !inqStatus || i.status === inqStatus).map(i => `
      <tr><td class="small font-en">${i.date}</td><td class="fw-bold text-navy text-nowrap">${esc(i.company)}</td><td>${esc(i.industry)}</td><td>${esc(i.name)}</td>
      <td class="text-end font-en">${fmt(i.slots)}</td><td><span class="ez-badge gray">${esc(i.plan)}</span></td>
      <td><select class="form-select form-select-sm w-auto" data-inq="${inquiries.indexOf(i)}" aria-label="상태 변경">
        ${Object.keys(stColor).map(s => `<option ${i.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('') ||
      '<tr><td colspan="7" class="text-center text-muted-2 py-4">해당 상태의 문의가 없습니다.</td></tr>';
  }
  $('#inqFilter').addEventListener('click', e => {
    const b = e.target.closest('[data-s]');
    if (!b) return;
    inqStatus = b.dataset.s;
    $$('#inqFilter button').forEach(x => x.className = `btn btn-sm ${x === b ? 'btn-primary' : 'btn-light'}`);
    renderInq();
  });
  $('#iBody').addEventListener('change', e => {
    const s = e.target.closest('[data-inq]');
    if (!s) return;
    inquiries[+s.dataset.inq].status = s.value;
    renderInq(); renderKpi();
    toast(`문의 상태가 '${s.value}'(으)로 변경되었습니다.`);
  });

  /* 공지 */
  const noticeModal = new bootstrap.Modal('#noticeModal');
  function renderNotices() {
    $('#nBody').innerHTML = notices.map(n => `
      <tr><td class="font-en small">${n.pinned ? '<i class="fa-solid fa-thumbtack text-red"></i>' : n.id}</td>
      <td><span class="ez-badge ${n.cat === '점검' ? 'yellow' : n.cat === '이벤트' ? 'mint' : 'blue'}">${n.cat}</span></td>
      <td class="fw-bold text-navy">${esc(n.title)}</td><td class="small font-en text-nowrap">${n.date}</td><td class="text-end font-en">${fmt(n.views)}</td>
      <td class="text-end text-nowrap"><button class="btn btn-sm btn-light" data-pin="${n.id}" title="상단 고정"><i class="fa-solid fa-thumbtack"></i></button>
      <button class="btn btn-sm btn-light text-danger" data-ndel="${n.id}" aria-label="삭제"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
  }
  $('#nAdd').onclick = () => { $('#noticeForm').reset(); $('#noticeForm').classList.remove('was-validated'); noticeModal.show(); };
  $('#noticeForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    f.classList.add('was-validated');
    if (!f.checkValidity()) return;
    const d = new Date();
    notices.unshift({ id: Math.max(...notices.map(n => n.id)) + 1, cat: $('#nCat').value, title: $('#nTitle').value.trim(), body: $('#nBodyTxt').value.trim(), date: `${d.getFullYear()}-${EZ.pad(d.getMonth() + 1)}-${EZ.pad(d.getDate())}`, views: 0 });
    noticeModal.hide();
    renderNotices();
    toast('공지사항이 등록되었습니다.');
  });
  $('#nBody').addEventListener('click', e => {
    const p = e.target.closest('[data-pin]'), d = e.target.closest('[data-ndel]');
    if (p) { const n = notices.find(x => x.id === +p.dataset.pin); n.pinned = !n.pinned; renderNotices(); toast(n.pinned ? '상단에 고정했습니다.' : '고정을 해제했습니다.', 'info'); }
    if (d && confirm('공지사항을 삭제하시겠습니까?')) { notices.splice(notices.findIndex(x => x.id === +d.dataset.ndel), 1); renderNotices(); toast('삭제되었습니다.', 'info'); }
  });

  renderKpi(); renderUsers(); renderLots(); renderInq(); renderNotices();
})();
