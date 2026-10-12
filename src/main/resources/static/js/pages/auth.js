/* 로그인 · 회원가입 (담당: 이오리)
   POST /api/auth/login, /api/auth/register – 비밀번호는 서버에서 BCrypt 로 해시, 세션 기반 인증 */
(() => {
  const { $, $$, toast, auth, page, api } = EZ;
  const params = new URLSearchParams(location.search);
  const redirect = role => {
    const to = params.get('redirect');
    // 외부 사이트로의 리다이렉트를 막기 위해 같은 사이트의 상대 경로(pages/xxx.html)만 허용
    location.href = to && /^\w[\w\-/.]*\.html(\?[\w=&%-]*)?$/.test(to) && !to.includes('//') ? `/${to}` : role === 'ADMIN' || role === 'BIZ' ? '/pages/dashboard.html' : '/';
  };

  /* 공통: 비밀번호 보기, 소셜 로그인 */
  $$('.pw-toggle').forEach(b => b.addEventListener('click', () => {
    const input = $(`#${b.dataset.target}`);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.innerHTML = `<i class="fa-regular fa-eye${show ? '-slash' : ''}"></i>`;
  }));
  $$('[data-social]').forEach(b => b.addEventListener('click', () => toast(`${b.dataset.social} 로그인은 Firebase Authentication 연동 후 제공됩니다.`, 'info')));

  if (params.get('denied')) toast('해당 메뉴에 접근할 권한이 없습니다. 권한이 있는 계정으로 로그인해 주세요.', 'warn');
  else if (params.get('redirect')) toast('로그인이 필요한 메뉴입니다.', 'info');
  else if (auth.get()) toast('이미 로그인되어 있습니다.', 'info');

  /* ---------- 로그인 ---------- */
  if (page === 'login') {
    const saved = localStorage.getItem('ezRememberEmail');
    if (saved) { $('#email').value = saved; $('#remember').checked = true; }
    $('#fillDemo').closest('.bg-soft').innerHTML = '<i class="fa-solid fa-circle-info text-blue me-1"></i>관리자 계정은 서버 환경변수 <code>EZPARK_ADMIN_EMAIL</code> / <code>EZPARK_ADMIN_PASSWORD</code> 로 생성됩니다. (local 프로필: admin@ezpark.kr / ezpark1234)';
    $('#findPw').onclick = e => { e.preventDefault(); toast('비밀번호 재설정 메일 발송은 P4 단계에서 제공됩니다.', 'info'); };

    $('#loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target;
      f.classList.add('was-validated');
      $('#loginErr').hidden = true;
      if (!f.checkValidity()) return;
      const email = $('#email').value.trim().toLowerCase();
      const btn = $('#loginBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>로그인 중...';
      try {
        const user = await api('/api/auth/login', { method: 'POST', body: { email, password: $('#password').value } });
        $('#remember').checked ? localStorage.setItem('ezRememberEmail', email) : localStorage.removeItem('ezRememberEmail');
        toast(`${user.name}님, 환영합니다!`);
        setTimeout(() => redirect(user.role), 500);
      } catch (err) {
        $('#loginErr').textContent = err.message;
        $('#loginErr').hidden = false;
        btn.disabled = false;
        btn.textContent = '로그인';
      }
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

    const checkDup = async () => {
      const input = $('#rEmail');
      if (!input.checkValidity()) {
        input.classList.add('is-invalid');
        $('#emailFeedback').textContent = '올바른 이메일 주소를 입력해 주세요.';
        return false;
      }
      try {
        const { available } = await api(`/api/auth/check-email?email=${encodeURIComponent(input.value.trim())}`);
        input.setCustomValidity(available ? '' : 'dup');
        input.classList.toggle('is-invalid', !available);
        $('#emailFeedback').textContent = available ? '올바른 이메일 주소를 입력해 주세요.' : '이미 사용 중인 이메일입니다.';
        $('#emailOk').hidden = !available;
        emailChecked = available;
        return available;
      } catch (err) {
        toast(err.message, 'error');
        return false;
      }
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
      if (!emailChecked && !(await checkDup())) return;

      const btn = $('#regBtn');
      btn.disabled = true;
      try {
        const user = await api('/api/auth/register', {
          method: 'POST',
          body: {
            name: $('#rName').value.trim(), email: $('#rEmail').value.trim(), password: $('#rPw').value,
            phone: $('#rPhone').value.trim(), plate: $('#rPlate').value, role: $('input[name=mtype]:checked').value,
            company: $('#rCompany').value.trim(), agreeTerms: $('#ag1').checked, agreePrivacy: $('#ag2').checked, agreeMarketing: $('#ag4').checked
          }
        });
        toast(`${user.name}님, 가입을 환영합니다! 첫 예약 30% 쿠폰이 발급되었습니다.`);
        setTimeout(() => redirect(user.role), 800);
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false;
      }
    });
  }
})();
