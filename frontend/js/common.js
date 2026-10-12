/* =========================================================
   EzPark - Common UI (담당: 김길동)
   - 헤더 / 푸터 / 콘솔 사이드바 렌더링
   - Thymeleaf 전환 시 th:fragment 로 1:1 이관
   ========================================================= */

const EZ = (() => {
  const body = document.body;
  const root = body.dataset.root || './';
  const page = body.dataset.page || 'home';
  const url = path => root + path;

  /* ---------- Utils ---------- */
  const fmt = n => Number(n).toLocaleString('ko-KR');
  const won = n => `${fmt(n)}원`;
  const pad = n => String(n).padStart(2, '0');
  const timeStr = (d = new Date(), sec = true) => `${pad(d.getHours())}:${pad(d.getMinutes())}${sec ? ':' + pad(d.getSeconds()) : ''}`;
  const occRate = lot => Math.round((1 - lot.available / lot.total) * 100);
  const occClass = rate => (rate >= 90 ? 'high' : rate >= 70 ? 'mid' : 'low');
  const occText = rate => (rate >= 90 ? '혼잡' : rate >= 70 ? '보통' : '여유');
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Auth (localStorage mock → P2: Spring Session) ---------- */
  const auth = {
    get: () => JSON.parse(localStorage.getItem('ezUser') || 'null'),
    set: user => localStorage.setItem('ezUser', JSON.stringify(user)),
    logout() {
      localStorage.removeItem('ezUser');
      toast('로그아웃 되었습니다.', 'info');
      setTimeout(() => (location.href = url('index.html')), 600);
    }
  };

  /* ---------- Toast ---------- */
  function toast(msg, type = 'success') {
    let wrap = $('.ez-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'ez-toast-wrap';
      body.appendChild(wrap);
    }
    const icon = { success: 'fa-circle-check', error: 'fa-circle-xmark', warn: 'fa-triangle-exclamation', info: 'fa-circle-info' }[type];
    const el = document.createElement('div');
    el.className = `ez-toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icon} fa-lg"></i><span>${msg}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 2800);
  }

  /* ---------- Menu config ---------- */
  const NAV = [
    { label: '서비스 소개', href: 'index.html#features', page: 'home' },
    { label: '주차장 찾기', href: 'pages/find.html', page: 'find' },
    { label: '주차 유도', href: 'pages/guide.html', page: 'guide' },
    { label: '예약', href: 'pages/reservation.html', page: 'reservation' },
    {
      label: '관제센터', pages: ['dashboard', 'cctv', 'analysis', 'admin'], children: [
        { label: '관제 대시보드', href: 'pages/dashboard.html', icon: 'fa-gauge-high' },
        { label: '영상 인지 모니터링', href: 'pages/cctv.html', icon: 'fa-video' },
        { label: 'K-AI 데이터 분석', href: 'pages/analysis.html', icon: 'fa-brain' },
        { label: '관리자', href: 'pages/admin.html', icon: 'fa-user-shield' }
      ]
    },
    { label: '기업 솔루션', href: 'pages/enterprise.html', page: 'enterprise' },
    { label: '고객지원', href: 'pages/support.html', page: 'support' }
  ];

  const SIDE = [
    { group: 'Monitoring', items: [
      { page: 'dashboard', label: '관제 대시보드', icon: 'space_dashboard', href: 'pages/dashboard.html' },
      { page: 'cctv', label: '영상 인지 모니터링', icon: 'videocam', href: 'pages/cctv.html', badge: '<span class="badge bg-danger">LIVE</span>' },
      { page: 'guide', label: '주차 유도 현황', icon: 'alt_route', href: 'pages/guide.html' }
    ] },
    { group: 'Analytics', items: [
      { page: 'analysis', label: 'K-AI 데이터 분석', icon: 'insights', href: 'pages/analysis.html', badge: '<span class="badge bg-primary">AI</span>' }
    ] },
    { group: 'Operation', items: [
      { page: 'admin', label: '관리자', icon: 'admin_panel_settings', href: 'pages/admin.html' }
    ] },
    { group: 'Service', items: [
      { page: 'home', label: '서비스 홈', icon: 'home', href: 'index.html' },
      { page: 'enterprise', label: '기업 솔루션', icon: 'business_center', href: 'pages/enterprise.html' }
    ] }
  ];

  const brand = `<span class="brand-logo">E</span><span class="brand-text">Ez<b>Park</b></span>`;

  function userMenu(user) {
    if (!user) {
      return `<a href="${url('pages/login.html')}" class="btn btn-sm btn-outline-primary">로그인</a>
              <a href="${url('pages/register.html')}" class="btn btn-sm btn-primary">무료 시작하기</a>`;
    }
    return `<div class="dropdown">
      <button class="user-chip dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
        <span class="avatar">${esc(user.name[0])}</span>${esc(user.name)}님
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><a class="dropdown-item" href="${url('pages/mypage.html')}"><i class="fa-solid fa-user"></i>마이페이지</a></li>
        <li><a class="dropdown-item" href="${url('pages/reservation.html')}"><i class="fa-solid fa-calendar-check"></i>예약하기</a></li>
        ${user.role === 'ADMIN' ? `<li><a class="dropdown-item" href="${url('pages/dashboard.html')}"><i class="fa-solid fa-gauge-high"></i>관제센터</a></li>` : ''}
        <li><hr class="dropdown-divider"></li>
        <li><button class="dropdown-item" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i>로그아웃</button></li>
      </ul>
    </div>`;
  }

  /* ---------- Public Header ---------- */
  function renderHeader() {
    const el = $('#ez-header');
    if (!el) return;
    const transparent = body.dataset.header === 'transparent';
    const links = NAV.map(n => {
      if (n.children) {
        const active = n.pages.includes(page) ? 'active' : '';
        return `<li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle ${active}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">${n.label}</a>
          <ul class="dropdown-menu">${n.children.map(c => `<li><a class="dropdown-item" href="${url(c.href)}"><i class="fa-solid ${c.icon}"></i>${c.label}</a></li>`).join('')}</ul>
        </li>`;
      }
      return `<li class="nav-item"><a class="nav-link ${n.page === page && page !== 'home' ? 'active' : ''}" href="${url(n.href)}">${n.label}</a></li>`;
    }).join('');

    el.outerHTML = `<header class="ez-header ${transparent ? 'transparent' : ''}" id="ezHeader">
      <nav class="navbar navbar-expand-lg">
        <div class="container">
          <a class="navbar-brand brand" href="${url('index.html')}">${brand}</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#ezNav" aria-controls="ezNav" aria-expanded="false" aria-label="메뉴 열기">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="collapse navbar-collapse" id="ezNav">
            <ul class="navbar-nav mx-auto mb-3 mb-lg-0">${links}</ul>
            <div class="d-flex gap-2 align-items-center">${userMenu(auth.get())}</div>
          </div>
        </div>
      </nav>
    </header>`;

    if (transparent) {
      const header = $('#ezHeader');
      const onScroll = () => header.classList.toggle('transparent', window.scrollY < 60);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    const el = $('#ez-footer');
    if (!el) return;
    el.outerHTML = `<footer class="ez-footer">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <a class="brand mb-3" href="${url('index.html')}">${brand}</a>
            <p class="mb-3">AI 영상 인지 기반 스마트 주차관제·유도 플랫폼.<br>K-AI 데이터로 기업의 주차 운영을 혁신합니다.</p>
            <div class="social">
              <a href="#" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
              <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
              <a href="#" aria-label="Blog"><i class="fa-solid fa-blog"></i></a>
              <a href="#" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
            </div>
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <h6>서비스</h6>
            <ul>
              <li><a href="${url('pages/find.html')}">주차장 찾기</a></li>
              <li><a href="${url('pages/guide.html')}">주차 유도</a></li>
              <li><a href="${url('pages/reservation.html')}">예약·결제</a></li>
              <li><a href="${url('pages/mypage.html')}">마이페이지</a></li>
            </ul>
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <h6>관제센터</h6>
            <ul>
              <li><a href="${url('pages/dashboard.html')}">관제 대시보드</a></li>
              <li><a href="${url('pages/cctv.html')}">영상 인지</a></li>
              <li><a href="${url('pages/analysis.html')}">K-AI 분석</a></li>
              <li><a href="${url('pages/admin.html')}">관리자</a></li>
            </ul>
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <h6>회사</h6>
            <ul>
              <li><a href="${url('pages/enterprise.html')}">기업 솔루션</a></li>
              <li><a href="${url('pages/support.html')}">공지사항</a></li>
              <li><a href="${url('pages/support.html#faq')}">자주 묻는 질문</a></li>
              <li><a href="${url('pages/support.html#qna')}">1:1 문의</a></li>
            </ul>
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <h6>고객센터</h6>
            <p class="mb-1 fs-5 fw-bold text-white font-en">1588-0000</p>
            <p class="mb-0 small">평일 09:00 – 18:00<br>help@ezpark.kr</p>
          </div>
        </div>
        <hr>
        <div class="d-flex flex-column flex-md-row justify-content-between gap-2 small">
          <span>© 2026 EzPark Team (김길동 · 홍기흥 · 박미금 · 이오리). All rights reserved.</span>
          <span><a href="#">이용약관</a> · <a href="#" class="text-white fw-bold">개인정보처리방침</a> · <a href="#">영상정보처리방침</a></span>
        </div>
      </div>
    </footer>`;

    const top = document.createElement('button');
    top.className = 'to-top';
    top.setAttribute('aria-label', '맨 위로');
    top.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    top.onclick = () => window.scrollTo({ top: 0 });
    body.appendChild(top);
    window.addEventListener('scroll', () => top.classList.toggle('show', window.scrollY > 500), { passive: true });
  }

  /* ---------- Console Layout ---------- */
  function renderConsole() {
    const side = $('#ez-sidebar');
    const top = $('#ez-topbar');
    if (!side || !top) return;
    const user = auth.get();

    side.innerHTML = `
      <div class="side-brand"><a class="brand" href="${url('index.html')}">${brand}</a></div>
      <nav>${SIDE.map(g => `
        <div class="side-label">${g.group}</div>
        ${g.items.map(i => `<a class="side-link ${i.page === page ? 'active' : ''}" href="${url(i.href)}">
          <span class="material-symbols-rounded">${i.icon}</span>${i.label}${i.badge || ''}</a>`).join('')}`).join('')}
      </nav>
      <div class="side-status">
        <div class="row-s"><span>API 서버</span><span class="ok"><i class="fa-solid fa-circle fa-2xs"></i> 정상</span></div>
        <div class="row-s"><span>AI 인지 모델</span><span class="ok">v3.2 · 28ms</span></div>
        <div class="row-s mb-0"><span>카메라 연결</span><span class="ok">${EZ_DATA.cameras.length}/${EZ_DATA.cameras.length}</span></div>
      </div>`;
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.onclick = () => body.classList.remove('side-open');
    body.appendChild(backdrop);

    top.innerHTML = `
      <button class="topbar-btn d-xl-none" id="sideToggle" aria-label="메뉴"><i class="fa-solid fa-bars"></i></button>
      <h1 class="page-title">${body.dataset.title || ''}</h1>
      <div class="search input-icon d-none d-md-block ms-3">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input class="form-control" type="search" placeholder="차량번호, 주차장, 카메라 검색" aria-label="검색">
      </div>
      <div class="ms-auto d-flex align-items-center gap-2">
        <span class="topbar-clock d-none d-sm-inline" id="ezClock"></span>
        <div class="dropdown">
          <button class="topbar-btn" data-bs-toggle="dropdown" aria-label="알림"><i class="fa-regular fa-bell"></i><span class="dot"></span></button>
          <div class="dropdown-menu dropdown-menu-end p-0 shadow border-0" style="width:300px;border-radius:14px">
            <div class="p-3 border-bottom fw-bold">알림 <span class="ez-badge red ms-1">3</span></div>
            <a class="dropdown-item py-2 px-3 small" href="${url('pages/cctv.html')}"><i class="fa-solid fa-triangle-exclamation text-danger me-2"></i>CAM-04 불법주차 의심 차량 감지</a>
            <a class="dropdown-item py-2 px-3 small" href="${url('pages/dashboard.html')}"><i class="fa-solid fa-square-parking text-warning me-2"></i>자갈치시장 공영주차장 만차 임박 (93%)</a>
            <a class="dropdown-item py-2 px-3 small" href="${url('pages/admin.html')}"><i class="fa-solid fa-building text-primary me-2"></i>신규 기업 도입 문의 2건</a>
          </div>
        </div>
        ${user
          ? `<div class="dropdown"><button class="user-chip dropdown-toggle" data-bs-toggle="dropdown"><span class="avatar">${esc(user.name[0])}</span><span class="d-none d-sm-inline">${esc(user.name)}</span></button>
             <ul class="dropdown-menu dropdown-menu-end"><li><a class="dropdown-item" href="${url('pages/mypage.html')}">마이페이지</a></li><li><button class="dropdown-item" data-action="logout">로그아웃</button></li></ul></div>`
          : `<a class="btn btn-sm btn-primary" href="${url('pages/login.html')}">로그인</a>`}
      </div>`;

    $('#sideToggle').onclick = () => body.classList.toggle('side-open');
    const clock = $('#ezClock');
    const tick = () => {
      const d = new Date();
      clock.textContent = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${timeStr(d)}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Detection overlay (main hero / dashboard / cctv) ---------- */
  const DET_LABEL = { car: 'CAR', moving: 'MOVING', person: 'PERSON', free: 'FREE', alert: 'ILLEGAL' };
  function drawDetections(layer, boxes, { hidden = [] } = {}) {
    layer.innerHTML = boxes
      .filter(b => !hidden.includes(b[0] === 'alert' ? 'car' : b[0]))
      .map(([t, x, y, w, h]) => {
        const conf = t === 'free' ? '' : ` ${(0.86 + Math.random() * 0.13).toFixed(2)}`;
        return `<div class="det-box ${t}${w < 6 ? ' sm' : ''}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"><span>${DET_LABEL[t]}${conf}</span></div>`;
      }).join('');
  }

  /* ---------- Count-up / Reveal ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1] || '').length;
    const dur = 1600;
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      const v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = dec ? v.toFixed(dec) : fmt(Math.round(v));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.dataset.count) countUp(e.target);
      else e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  function observe() {
    $$('.reveal:not([data-obs]), [data-count]:not([data-obs])').forEach(el => {
      el.dataset.obs = '1';
      io.observe(el);
    });
  }

  /* ---------- Unsplash images: <img data-img="key" data-w="800"> / <section data-bg="key"> ---------- */
  function applyImages(scope = document) {
    $$('[data-img]', scope).forEach(el => {
      el.src = ezImg(el.dataset.img, el.dataset.w || 1000, el.dataset.h);
      if (!el.hasAttribute('loading')) el.loading = 'lazy';
      el.removeAttribute('data-img');
    });
    $$('[data-bg]', scope).forEach(el => {
      el.style.backgroundImage = `url('${ezImg(el.dataset.bg, el.dataset.w || 1920)}')`;
      el.removeAttribute('data-bg');
    });
  }

  /* ---------- Init ---------- */
  if (body.dataset.layout === 'console') renderConsole();
  else { renderHeader(); renderFooter(); }
  applyImages();
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="logout"]')) auth.logout();
  });
  document.addEventListener('DOMContentLoaded', observe);

  return { root, page, url, fmt, won, pad, timeStr, occRate, occClass, occText, $, $$, esc, auth, toast, drawDetections, observe, applyImages };
})();
