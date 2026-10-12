/* 메인 페이지 (담당: 김길동) */
(() => {
  const { $, fmt, occRate, occClass, occText, timeStr, url, esc } = EZ;
  const cam = EZ_DATA.cameras[0];
  const boxes = cam.boxes.map(b => [...b]);

  /* Hero: 실시간 인지 오버레이 */
  const layer = $('#heroDet');
  const draw = () => {
    boxes.forEach(b => {
      if (b[0] === 'moving') b[1] = b[1] > 92 ? 0 : b[1] + 1.2;
    });
    EZ.drawDetections(layer, boxes);
    $('#hsFree').textContent = boxes.filter(b => b[0] === 'free').length;
    $('#hsCar').textContent = boxes.filter(b => b[0] === 'car').length;
    $('#hsMove').textContent = boxes.filter(b => b[0] === 'moving').length;
    $('#hsLat').firstChild.textContent = 24 + Math.floor(Math.random() * 9);
    $('#heroClock').textContent = timeStr();
  };
  draw();
  setInterval(draw, 1000);

  /* Hero 검색 */
  $('#heroSearch').addEventListener('submit', e => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    location.href = url(`pages/find.html${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  });

  /* 실시간 주차장 현황 */
  const lots = EZ_DATA.lots.slice(0, 6);
  const renderLots = () => {
    $('#liveLots').innerHTML = lots.map(l => {
      const r = occRate(l), c = occClass(r);
      return `<a class="lot-mini text-reset" href="${url(`pages/guide.html?lot=${l.id}`)}">
        <div class="icon-box sm ${c === 'low' ? 'mint' : c === 'mid' ? 'yellow' : 'red'}"><i class="fa-solid fa-square-parking"></i></div>
        <div class="flex-grow-1 min-w-0">
          <div class="d-flex align-items-center gap-2 mb-1">
            <b class="text-navy text-truncate">${esc(l.name)}</b>
            <span class="ez-badge ${l.type === '공영' ? 'blue' : 'gray'}">${l.type}</span>
          </div>
          <div class="occ-bar"><span class="occ-${c}" style="width:${r}%"></span></div>
          <div class="small text-muted-2 mt-1">점유율 ${r}% · ${occText(r)} · 10분 ${fmt(l.fee10)}원</div>
        </div>
        <div class="avail text-${c === 'low' ? 'mint' : c === 'mid' ? 'yellow' : 'red'}">${fmt(l.available)}<div class="small text-muted-2 fw-normal" style="font-size:.7rem">잔여면</div></div>
      </a>`;
    }).join('');
    $('#liveTime').textContent = timeStr();
  };
  renderLots();
  setInterval(() => {
    lots.forEach(l => { l.available = Math.max(0, Math.min(l.total, l.available + Math.round((Math.random() - 0.5) * 6))); });
    renderLots();
  }, 4000);

  /* 리뷰 */
  const reviews = [
    { img: 'p1', name: '이서연', role: '직장인 · 강남 출퇴근', text: '퇴근길 코엑스 주차장 들어가기 전에 빈자리를 미리 보고, 경로 안내까지 받으니 주차가 정말 편해졌어요.' },
    { img: 'p3', name: '박정훈', role: '쇼핑몰 시설팀장', text: '주말마다 진입 대기열이 길었는데 층별 유도 이후 대기 시간이 확 줄었습니다. 관제 인력 운영도 효율적이에요.' },
    { img: 'p2', name: '최민호', role: '병원 총무팀', text: '외래 예약과 주차 배정을 연동한 뒤 환자 민원이 크게 줄었습니다. Gemini 리포트로 회의 자료 만들기도 쉬워요.' }
  ];
  $('#reviews').innerHTML = reviews.map(r => `
    <div class="col-md-4 reveal">
      <div class="ez-card testimonial">
        <div class="stars mb-3">${'<i class="fa-solid fa-star"></i>'.repeat(5)}</div>
        <p class="text-muted-2 mb-4">"${r.text}"</p>
        <div class="d-flex align-items-center gap-3">
          <img src="${ezImg(r.img, 120, 120)}" alt="${r.name}" loading="lazy">
          <div><b class="text-navy">${r.name}</b><div class="small text-muted-2">${r.role}</div></div>
        </div>
      </div>
    </div>`).join('');
  EZ.observe();
})();
