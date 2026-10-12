/* =========================================================
   EzPark - Common UI (백엔드 버전, 담당: 김길동)
   - 헤더/푸터/콘솔 레이아웃은 Thymeleaf fragment(templates/fragments/layout.html)가 렌더링
   - 이 파일은 동작 바인딩, 세션 로그인 정보, REST API 호출 헬퍼를 제공
   - P1 목업 버전은 frontend/js/common.js (Netlify 데모)
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
  const occRate = lot => (lot.total ? Math.round((1 - lot.available / lot.total) * 100) : 0);
  const occClass = rate => (rate >= 90 ? 'high' : rate >= 70 ? 'mid' : 'low');
  const occText = rate => (rate >= 90 ? '혼잡' : rate >= 70 ? '보통' : '여유');
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- REST API ---------- */
  async function api(path, { method = 'GET', body: data } = {}) {
    const res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: data !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: data !== undefined ? JSON.stringify(data) : undefined
    });
    const json = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error((json && json.message) || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      err.status = res.status;
      throw err;
    }
    return json;
  }
  /** API 오류 공통 처리: 401 → 로그인 페이지, 그 외 토스트 */
  function fail(err) {
    if (err.status === 401) {
      toast('로그인이 필요합니다.', 'warn');
      const here = location.pathname.replace(/^\//, '') + location.search;
      setTimeout(() => (location.href = `/pages/login.html?redirect=${encodeURIComponent(here)}`), 700);
      return;
    }
    toast(err.message, 'error');
  }

  /* ---------- Auth (Spring Session: 서버가 body data-user-* 로 전달) ---------- */
  const auth = {
    get: () => (body.dataset.userId ? { id: +body.dataset.userId, name: body.dataset.userName, email: body.dataset.userEmail, role: body.dataset.userRole } : null),
    async logout() {
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (e) { /* 세션 만료 등은 무시 */ }
      toast('로그아웃 되었습니다.', 'info');
      setTimeout(() => (location.href = '/'), 600);
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
    el.innerHTML = `<i class="fa-solid ${icon} fa-lg"></i><span>${esc(msg)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 2800);
  }

  /* ---------- Layout bindings ---------- */
  function bindHeader() {
    const header = $('#ezHeader');
    if (!header || body.dataset.header !== 'transparent') return;
    const onScroll = () => header.classList.toggle('transparent', window.scrollY < 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function bindToTop() {
    if (body.dataset.layout === 'console' || !$('.ez-footer')) return;
    const top = document.createElement('button');
    top.className = 'to-top';
    top.setAttribute('aria-label', '맨 위로');
    top.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    top.onclick = () => window.scrollTo({ top: 0 });
    body.appendChild(top);
    window.addEventListener('scroll', () => top.classList.toggle('show', window.scrollY > 500), { passive: true });
  }

  function bindConsole() {
    if (body.dataset.layout !== 'console') return;
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.onclick = () => body.classList.remove('side-open');
    body.appendChild(backdrop);
    const toggle = $('#sideToggle');
    if (toggle) toggle.onclick = () => body.classList.toggle('side-open');
    const clock = $('#ezClock');
    if (clock) {
      const tick = () => {
        const d = new Date();
        clock.textContent = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${timeStr(d)}`;
      };
      tick();
      setInterval(tick, 1000);
    }
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
  bindHeader();
  bindToTop();
  bindConsole();
  applyImages();
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="logout"]')) auth.logout();
  });
  document.addEventListener('DOMContentLoaded', observe);

  return { root, page, url, fmt, won, pad, timeStr, occRate, occClass, occText, $, $$, esc, api, fail, auth, toast, drawDetections, observe, applyImages };
})();
