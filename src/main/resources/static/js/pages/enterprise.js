/* 기업 솔루션 (담당: 이오리) */
(() => {
  const { $, $$, fmt, toast } = EZ;

  /* 요금제 */
  const plans = [
    { name: 'Starter', desc: '소규모 상가·오피스', price: 3000, limit: '최대 100면', features: ['실시간 점유 현황', '기본 관제 대시보드', '모바일 빈자리 안내', '이메일 지원'], cta: '시작하기' },
    { name: 'Business', desc: '쇼핑몰·병원·대형 오피스', price: 2500, limit: '최대 1,000면', featured: true, features: ['<b>Starter 전체 기능</b>', 'AI 영상 인지 관제 (이벤트 알림)', '층별 주차 유도 · 경로 안내', '예약·결제 연동', '월간 운영 리포트'], cta: '도입 상담' },
    { name: 'Enterprise', desc: '공공기관·복합시설', price: null, limit: '면수 무제한', features: ['<b>Business 전체 기능</b>', '다중 사이트 통합 관제', 'K-AI 수요 예측 · Gemini 인사이트', '전용 API · 시스템 연동', '전담 매니저 · SLA 99.9%'], cta: '견적 문의' }
  ];
  let cycle = 'month';
  function renderPlans() {
    $('#priceCards').innerHTML = plans.map(p => {
      const price = p.price ? (cycle === 'year' ? Math.round(p.price * 0.8) : p.price) : null;
      return `<div class="col-lg-4 reveal in">
        <div class="ez-card price-card ${p.featured ? 'featured' : ''}">
          ${p.featured ? '<span class="ez-badge yellow ribbon">BEST</span>' : ''}
          <h5 class="fw-800 mb-1">${p.name}</h5>
          <div class="small text-muted-2 mb-4">${p.desc} · ${p.limit}</div>
          <div class="mb-4">${price ? `<span class="price">${fmt(price)}</span><span class="text-muted-2">원 / 면·월</span>` : '<span class="price" style="font-size:2rem">별도 협의</span>'}</div>
          <ul class="check-list mb-4">${p.features.map(f => `<li><i class="fa-solid fa-circle-check"></i><div>${f}</div></li>`).join('')}</ul>
          <a href="#contact" class="btn ${p.featured ? 'btn-yellow' : 'btn-outline-primary'} w-100" data-plan="${p.name}">${p.cta}</a>
        </div></div>`;
    }).join('');
  }
  renderPlans();
  $('#priceToggle').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    cycle = b.dataset.cycle;
    $$('#priceToggle button').forEach(x => x.classList.toggle('active', x === b));
    renderPlans();
  });
  $('#priceCards').addEventListener('click', e => { const a = e.target.closest('[data-plan]'); if (a) $('#iPlan').value = a.dataset.plan; });

  /* ROI 계산기 */
  function roi() {
    const slots = +$('#roiSlots').value, staff = +$('#roiStaff').value;
    $('#roiSlotsVal').textContent = fmt(slots);
    $('#roiStaffVal').textContent = staff;
    const save = Math.round(staff * 3200000 * 0.35);
    const rev = Math.round(slots * 6 * 1500 * 30 * 0.18 * 0.25);
    $('#roiSave').textContent = `${fmt(Math.round(save / 10000))}만원`;
    $('#roiRev').textContent = `${fmt(Math.round(rev / 10000))}만원`;
    const plan = slots <= 100 ? 'Starter' : slots <= 1000 ? 'Business' : 'Enterprise';
    $('#roiPlan').textContent = `${plan} · ${plan === 'Enterprise' ? '별도 협의' : `월 약 ${fmt(Math.round(slots * plans.find(p => p.name === plan).price / 10000))}만원`}`;
    $('#iSlots').value = slots;
    $('#iPlan').value = plan;
  }
  ['#roiSlots', '#roiStaff'].forEach(s => $(s).addEventListener('input', roi));
  roi();

  /* 문의 폼 – POST /api/inquiries */
  $('#iMsg').addEventListener('input', e => ($('#iMsgCnt').textContent = e.target.value.length));
  $('#contactForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    f.classList.add('was-validated');
    if (!f.checkValidity()) {
      f.querySelector(':invalid').focus();
      return toast('필수 항목을 확인해 주세요.', 'error');
    }
    const btn = f.querySelector('button');
    btn.disabled = true;
    try {
      await EZ.api('/api/inquiries', {
        method: 'POST',
        body: {
          company: $('#iCompany').value.trim(), industry: $('#iIndustry').value, name: $('#iName').value.trim(),
          phone: $('#iPhone').value.trim(), email: $('#iEmail').value.trim(), slots: +$('#iSlots').value || 0,
          plan: $('#iPlan').value, message: $('#iMsg').value.trim(), agree: $('#iAgree').checked
        }
      });
      f.reset();
      f.classList.remove('was-validated');
      $('#iMsgCnt').textContent = 0;
      roi();
      toast('도입 문의가 접수되었습니다. 영업일 기준 1일 이내 연락드리겠습니다.', 'success');
    } catch (err) {
      EZ.fail(err);
    } finally {
      btn.disabled = false;
    }
  });
})();
