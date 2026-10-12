/* 고객지원 (담당: 이오리) */
(() => {
  const { $, $$, fmt, esc, toast, auth } = EZ;
  const { notices, faqs } = EZ_DATA;
  let nCat = '', fCat = '전체';

  /* 공지사항 */
  const catColor = c => (c === '점검' ? 'yellow' : c === '이벤트' ? 'mint' : 'blue');
  function renderNotices() {
    const list = notices.filter(n => !nCat || n.cat === nCat).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.id - a.id);
    $('#noticeList').innerHTML = list.map(n => `
      <div class="notice-item" data-bs-toggle="collapse" data-bs-target="#n${n.id}" role="button" aria-expanded="false">
        ${n.pinned ? '<i class="fa-solid fa-thumbtack text-red"></i>' : `<span class="font-en small text-muted-2" style="width:14px">${n.id}</span>`}
        <span class="ez-badge ${catColor(n.cat)}">${n.cat}</span>
        <span class="flex-grow-1 fw-bold text-navy text-truncate">${esc(n.title)}</span>
        <span class="small text-muted-2 d-none d-md-inline"><i class="fa-regular fa-eye me-1"></i>${fmt(n.views)}</span>
        <span class="small text-muted-2 font-en">${n.date}</span>
      </div>
      <div class="collapse" id="n${n.id}"><div class="px-4 py-3 bg-soft small text-muted-2 border-bottom">${esc(n.body)}</div></div>`).join('');
  }
  $('#noticeCat').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    nCat = b.dataset.cat;
    $$('#noticeCat button').forEach(x => (x.className = `btn ${x === b ? 'btn-primary' : 'btn-outline-secondary'}`));
    renderNotices();
  });

  /* FAQ */
  const cats = ['전체', ...new Set(faqs.map(f => f.cat))];
  const catIcon = { 전체: 'fa-list', 이용: 'fa-car', 예약: 'fa-calendar-check', 결제: 'fa-credit-card', 계정: 'fa-user', 기업: 'fa-building' };
  $('#faqCat').innerHTML = cats.map(c => `<button class="nav-link ${c === fCat ? 'active' : ''}" data-cat="${c}" type="button"><i class="fa-solid ${catIcon[c]}"></i>${c} <span class="ms-auto small opacity-75">${c === '전체' ? faqs.length : faqs.filter(f => f.cat === c).length}</span></button>`).join('');
  function renderFaq() {
    const q = $('#faqSearch').value.trim().toLowerCase();
    const hl = s => (q ? esc(s).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`) : esc(s));
    const list = faqs.filter(f => (fCat === '전체' || f.cat === fCat) && (!q || `${f.q} ${f.a}`.toLowerCase().includes(q)));
    $('#faqList').innerHTML = list.map((f, i) => `
      <div class="accordion-item">
        <h3 class="accordion-header"><button class="accordion-button ${i ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#f${i}" aria-expanded="${!i}">
          <span class="ez-badge gray me-2">${f.cat}</span><span class="text-blue me-2 font-en">Q.</span>${hl(f.q)}</button></h3>
        <div id="f${i}" class="accordion-collapse collapse ${i ? '' : 'show'}" data-bs-parent="#faqList"><div class="accordion-body"><b class="text-mint font-en me-2">A.</b>${hl(f.a)}</div></div>
      </div>`).join('') || `<div class="ez-card empty-state"><i class="fa-regular fa-face-meh d-block"></i>검색 결과가 없습니다. <a href="#qna">1:1 문의</a>를 남겨 주세요.</div>`;
  }
  $('#faqCat').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    fCat = b.dataset.cat;
    $$('#faqCat .nav-link').forEach(x => x.classList.toggle('active', x === b));
    renderFaq();
  });
  $('#faqSearch').addEventListener('input', renderFaq);

  /* 상단 통합 검색 → FAQ */
  const globalSearch = () => {
    $('#faqSearch').value = $('#globalSearch').value;
    fCat = '전체';
    $$('#faqCat .nav-link').forEach(x => x.classList.toggle('active', x.dataset.cat === '전체'));
    renderFaq();
    $('#faq').scrollIntoView({ behavior: 'smooth' });
  };
  $('#globalBtn').onclick = globalSearch;
  $('#globalSearch').addEventListener('keydown', e => { if (e.key === 'Enter') globalSearch(); });

  /* 1:1 문의 */
  const user = auth.get();
  if (user) $('#qEmail').value = user.email;
  $('#qnaForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    f.classList.add('was-validated');
    const file = $('#qFile').files[0];
    if (file && file.size > 5 * 1024 * 1024) return toast('첨부파일은 5MB 이하만 가능합니다.', 'error');
    if (!f.checkValidity()) return toast('입력 항목을 확인해 주세요.', 'error');
    f.reset();
    f.classList.remove('was-validated');
    if (user) $('#qEmail').value = user.email;
    toast('문의가 등록되었습니다. 이메일로 답변드리겠습니다.', 'success');
  });

  renderNotices();
  renderFaq();
})();
