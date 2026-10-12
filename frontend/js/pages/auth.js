/* 로그인 · 회원가입 (담당: 이오리)
   프론트엔드 단계 목업: localStorage 사용
   P2 백엔드: POST /api/auth/login, /api/auth/register (BCrypt 해시, Spring Session)
   ※ 아래 SHA-256 해시는 데모 저장용일 뿐, 실제 인증은 반드시 서버(BCrypt)에서 처리한다. */
(() => {
  const { $, $$, toast, auth, url, page } = EZ;
  const DEMO_ADMIN = { email: 'admin@ezpark.kr', pw: 'ezpark1234' };
  const members = () => JSON.parse(localStorage.getItem('ezMembers') || '[]');
  const hash = async s => {
    if (!crypto.subtle) return btoa(unescape(encodeURIComponent(s)));
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  };
  const redirect = role => {
    const to = new URLSearchParams(location.search).get('redirect');
    location.href = to && /^[\w\-/.]+\.html$/.test(to) ? url(to) : url(role === 'ADMIN' ? 'pages/dashboard.html' : 'index.html');
  };

  /* 공통: 비밀번호 보기, 소셜 로그인 */
  $$('.pw-toggle').forEach(b => b.addEventListener('click', () => {
    const input = $(`#${b.dataset.target}`);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.innerHTML = `<i class="fa-regular fa-eye${show ? '-slash' : ''}"></i>`;
  }));
  $$('[data-social]').forEach(b => b.addEventListener('click', () => toast(`${b.dataset.social} 로그인은 백엔드 단계에서 Firebase Authentication으로 연동됩니다.`, 'info')));

  if (auth.get() && (page === 'login' || page === 'register')) {
    toast('이미 로그인되어 있습니다.', 'info');
  }

  /* ---------- 로그인 ---------- */
  if (page === 'login') {
    const saved = localStorage.getItem('ezRememberEmail');
    if (saved) { $('#email').value = saved; $('#remember').checked = true; }
    $('#fillDemo').onclick = () => { $('#email').value = DEMO_ADMIN.email; $('#password').value = DEMO_ADMIN.pw; };
    $('#findPw').onclick = e => { e.preventDefault(); toast('비밀번호 재설정 메일 발송은 백엔드 연동 후 제공됩니다.', 'info'); };

    $('#loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target;
      f.classList.add('was-validated');
      $('#loginErr').hidden = true;
      if (!f.checkValidity()) return;
      const email = $('#email').value.trim().toLowerCase();
      const pw = $('#password').value;
      const btn = $('#loginBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>로그인 중...';

      let user = null;
      if (email === DEMO_ADMIN.email) {
        if (pw === DEMO_ADMIN.pw) user = { name: '관리자', email, role: 'ADMIN', plate: '12가3456', phone: '010-0000-0000' };
      } else {
        const m = members().find(x => x.email === email);
        if (m) { if (m.pwHash === await hash(pw)) user = { name: m.name, email, role: m.role, plate: m.plate, phone: m.phone }; }
        else user = { name: email.split('@')[0], email, role: 'USER' };
      }

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '로그인';
        if (!user) {
          $('#loginErr').textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
          $('#loginErr').hidden = false;
          return;
        }
        $('#remember').checked ? localStorage.setItem('ezRememberEmail', email) : localStorage.removeItem('ezRememberEmail');
        auth.set(user);
        toast(`${user.name}님, 환영합니다!`);
        setTimeout(() => redirect(user.role), 600);
      }, 600);
    });
  }

  /* ---------- 회원가입 ---------- */
  if (page === 'register') {
    let emailChecked = false;

    $$('input[name=mtype]').forEach(r => r.addEventListener('change', () => {
      const biz = $('input[name=mtype]:checked').value === 'BIZ';
      $('#companyWrap').hidden = !biz;
      $('#rCompany').required = biz;
    }));

    const checkDup = () => {
      const input = $('#rEmail');
      const email = input.value.trim().toLowerCase();
      if (!input.checkValidity()) { input.classList.add('is-invalid'); $('#emailFeedback').textContent = '올바른 이메일 주소를 입력해 주세요.'; return false; }
      const dup = email === DEMO_ADMIN.email || members().some(m => m.email === email) || EZ_DATA.users.some(u => u.email === email);
      input.setCustomValidity(dup ? 'dup' : '');
      input.classList.toggle('is-invalid', dup);
      $('#emailFeedback').textContent = dup ? '이미 사용 중인 이메일입니다.' : '올바른 이메일 주소를 입력해 주세요.';
      $('#emailOk').hidden = dup;
      emailChecked = !dup;
      return !dup;
    };
    $('#dupCheck').onclick = checkDup;
    $('#rEmail').addEventListener('input', () => { emailChecked = false; $('#emailOk').hidden = true; $('#rEmail').setCustomValidity(''); $('#rEmail').classList.remove('is-invalid'); });

    /* 비밀번호 강도 */
    $('#rPw').addEventListener('input', e => {
      const v = e.target.value;
      const score = [/.{8,}/, /[A-Za-z]/, /\d/, /[^A-Za-z\d]/, /.{12,}/].filter(r => r.test(v)).length;
      const lv = [['', '영문, 숫자, 특수문자 조합 8자 이상', 'var(--ez-gray-400)'], ['20%', '매우 약함', 'var(--ez-red)'], ['40%', '약함', 'var(--ez-red)'], ['60%', '보통', 'var(--ez-yellow)'], ['80%', '강함', 'var(--ez-mint)'], ['100%', '매우 강함', 'var(--ez-mint)']][v ? score : 0];
      $('#pwBar').style.width = lv[0] || '0';
      $('#pwBar').style.background = lv[2];
      $('#pwText').textContent = lv[1];
      $('#pwText').style.color = lv[2];
      matchPw();
    });
    const matchPw = () => $('#rPw2').setCustomValidity($('#rPw2').value && $('#rPw2').value !== $('#rPw').value ? 'mismatch' : '');
    $('#rPw2').addEventListener('input', matchPw);

    /* 약관 */
    $('#agAll').addEventListener('change', e => { $$('.ag').forEach(c => (c.checked = e.target.checked)); $('#agErr').hidden = true; });
    $$('.ag').forEach(c => c.addEventListener('change', () => ($('#agAll').checked = $$('.ag').every(x => x.checked))));

    $('#registerForm').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target;
      $('#rPlate').value = $('#rPlate').value.replace(/\s/g, '');
      matchPw();
      f.classList.add('was-validated');
      const agreeOk = $('#ag1').checked && $('#ag2').checked;
      $('#agErr').hidden = agreeOk;
      if (!f.checkValidity() || !agreeOk) { const bad = f.querySelector(':invalid'); if (bad) bad.focus(); return; }
      if (!emailChecked && !checkDup()) return;
      if (!emailChecked) return toast('이메일 중복 확인을 해 주세요.', 'warn');

      const role = $('input[name=mtype]:checked').value;
      const m = {
        name: $('#rName').value.trim(), email: $('#rEmail').value.trim().toLowerCase(), role,
        company: role === 'BIZ' ? $('#rCompany').value.trim() : '', phone: $('#rPhone').value.trim(),
        plate: $('#rPlate').value, pwHash: await hash($('#rPw').value), marketing: $('#ag4').checked, created: new Date().toISOString()
      };
      localStorage.setItem('ezMembers', JSON.stringify([...members(), m]));
      auth.set({ name: m.name, email: m.email, role: m.role, plate: m.plate, phone: m.phone });
      toast(`${m.name}님, 가입을 환영합니다! 첫 예약 30% 쿠폰이 발급되었습니다.`);
      setTimeout(() => redirect(m.role), 900);
    });
  }
})();
