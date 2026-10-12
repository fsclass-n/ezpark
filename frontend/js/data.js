/* =========================================================
   EzPark - Mock Data
   백엔드(P2) 단계에서 각 항목을 REST API 응답으로 교체한다.
   ex) EZ_DATA.lots  ->  fetch('/api/lots')
   ========================================================= */

const EZ_PHOTO = {
  garageNeon: '1545179605-1296651e9d43',
  garageArrow: '1604063165585-e17e9c3c3f0b',
  garageExit: '1590674899484-d5640e854abe',
  garageDark: '1573348722427-f1d6819fdf98',
  aerialLot: '1506521781263-d8422e82f27a',
  aerialLines: '1470224114660-3f6686c562eb',
  street: '1621929747188-0b4dc28498d2',
  cctv: '1557597774-9d273605dfa9',
  dashboard: '1551288049-bebda4e38f71',
  analytics: '1526628953301-3e589a6a8b74',
  laptop: '1460925895917-afdab827c52f',
  ai: '1677442136019-21780ecad995',
  team: '1522071820081-009f0129c71c',
  office: '1497366216548-37526070297c',
  officeFloor: '1504384308090-c894fdcc538d',
  city: '1477959858617-67f85cf4f1df',
  skyline: '1480714378408-67cf0d13bc1b',
  towers: '1486406146926-c627a92ad1ab',
  mall: '1519567241046-7f570eee3ce6',
  hospital: '1519494026892-80bbd2d6fd0d',
  driver: '1449965408869-eaa3f722e40d',
  carDark: '1494976388531-d1058494cdd8',
  carWhite: '1542362567-b07e54358753',
  p1: '1494790108377-be9c29b29330',
  p2: '1507003211169-0a1dd7228f2d',
  p3: '1500648767791-00dcc994a43e',
  p4: '1438761681033-6461ffad8d80'
};

/** Unsplash 이미지 URL 생성 */
function ezImg(key, w = 1200, h) {
  const id = EZ_PHOTO[key] || key;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`;
}

const EZ_DATA = (() => {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const hangul = '가나다라마거너더러머버서어저고노도로모보소오조구누두루무부수우주하허호'.split('');
  const plate = () => `${rand(10, 399)}${pick(hangul)}${rand(1000, 9999)}`;

  const lots = [
    { id: 1, name: '강남역 공영주차장', addr: '서울 강남구 강남대로 396', area: '강남', type: '공영', total: 420, available: 38, fee10: 800, dayMax: 30000, ev: true, disabled: true, x: 57, y: 70, dist: 0.4, rating: 4.6, photo: 'garageExit', floors: ['B1', 'B2', 'B3', 'B4'], tags: ['24시간', '전기차', 'AI유도'] },
    { id: 2, name: '코엑스 스마트파킹', addr: '서울 강남구 영동대로 513', area: '강남', type: '민영', total: 2800, available: 612, fee10: 1000, dayMax: 48000, ev: true, disabled: true, x: 69, y: 64, dist: 2.1, rating: 4.8, photo: 'garageNeon', floors: ['B1', 'B2', 'B3', 'B4'], tags: ['대형', '전기차', '예약가능'] },
    { id: 3, name: '서울역 환승주차장', addr: '서울 중구 한강대로 405', area: '중구', type: '공영', total: 650, available: 21, fee10: 500, dayMax: 20000, ev: false, disabled: true, x: 42, y: 40, dist: 6.5, rating: 4.1, photo: 'aerialLot', floors: ['1F', 'B1', 'B2'], tags: ['환승할인', '24시간'] },
    { id: 4, name: '여의도 IFC 주차장', addr: '서울 영등포구 국제금융로 10', area: '영등포', type: '민영', total: 1800, available: 284, fee10: 1200, dayMax: 50000, ev: true, disabled: true, x: 27, y: 55, dist: 9.8, rating: 4.7, photo: 'garageArrow', floors: ['B1', 'B2', 'B3', 'B4'], tags: ['전기차', '예약가능', 'AI유도'] },
    { id: 5, name: '홍대입구 공영주차장', addr: '서울 마포구 양화로 160', area: '마포', type: '공영', total: 240, available: 9, fee10: 600, dayMax: 24000, ev: false, disabled: true, x: 22, y: 36, dist: 11.2, rating: 3.9, photo: 'street', floors: ['B1', 'B2'], tags: ['혼잡'] },
    { id: 6, name: '잠실 롯데월드몰 주차장', addr: '서울 송파구 올림픽로 300', area: '송파', type: '민영', total: 3200, available: 905, fee10: 1000, dayMax: 45000, ev: true, disabled: true, x: 82, y: 60, dist: 5.3, rating: 4.5, photo: 'garageDark', floors: ['B1', 'B2', 'B3', 'B4'], tags: ['대형', '전기차', '할인제휴'] },
    { id: 7, name: '광화문 세종로 공영주차장', addr: '서울 종로구 세종대로 189', area: '종로', type: '공영', total: 380, available: 117, fee10: 700, dayMax: 28000, ev: true, disabled: true, x: 44, y: 28, dist: 8.1, rating: 4.3, photo: 'aerialLines', floors: ['B1', 'B2', 'B3'], tags: ['24시간', '전기차'] },
    { id: 8, name: '성수 스마트타워 주차장', addr: '서울 성동구 성수이로 113', area: '성동', type: '민영', total: 520, available: 146, fee10: 900, dayMax: 36000, ev: true, disabled: false, x: 64, y: 44, dist: 4.6, rating: 4.4, photo: 'garageNeon', floors: ['B1', 'B2', 'B3'], tags: ['AI유도', '예약가능'] },
    { id: 9, name: '용산 아이파크몰 주차장', addr: '서울 용산구 한강대로23길 55', area: '용산', type: '민영', total: 1500, available: 72, fee10: 1000, dayMax: 40000, ev: true, disabled: true, x: 40, y: 48, dist: 7.0, rating: 4.2, photo: 'garageExit', floors: ['B1', 'B2', 'B3'], tags: ['할인제휴', '전기차'] },
    { id: 10, name: '판교 테크노밸리 공영주차장', addr: '경기 성남시 분당구 판교역로 235', area: '판교', type: '공영', total: 760, available: 331, fee10: 500, dayMax: 15000, ev: true, disabled: true, x: 66, y: 90, dist: 12.4, rating: 4.6, photo: 'aerialLot', floors: ['1F', 'B1', 'B2'], tags: ['전기차', '정기권'] }
  ];

  /* 영상 인지 카메라 – 박스 좌표는 3:2 crop 이미지 기준 % (x, y, w, h) */
  const cameras = [
    {
      id: 'CAM-01', name: '지상 A구역 (항공뷰)', lot: '강남역 공영주차장', img: 'aerialLot', status: 'online', fps: 30,
      boxes: [
        ['car', 13.7, 23.3, 4, 11.2], ['car', 32.3, 22.5, 3.3, 10], ['car', 37, 21.3, 3.3, 11.2], ['car', 41.5, 23, 3.2, 10],
        ['car', 59.3, 23, 3, 9.5], ['car', 64.2, 23.8, 3.2, 9.2], ['car', 73, 22, 4.3, 12.5], ['car', 82.7, 23.8, 3.7, 11.2],
        ['car', 91.3, 23.8, 4, 10.7], ['car', 29.5, 52, 3.7, 13], ['car', 34.7, 53.3, 3.7, 12.2], ['car', 49.5, 52, 3.5, 12],
        ['car', 59.2, 53.3, 3.5, 11.7], ['car', 83.8, 53, 3.7, 12.5], ['car', 93, 52.5, 4.3, 13], ['car', 18.8, 67, 3.8, 11.8],
        ['car', 23.8, 66.8, 3.8, 12.7], ['car', 33.8, 69.3, 3.7, 13.2], ['car', 59.3, 67, 3.8, 12.5], ['car', 74.2, 67.5, 4, 13],
        ['car', 84.2, 68, 4.3, 13],
        ['moving', 29.3, 11.8, 8, 5.7], ['moving', 37.7, 11.8, 7.5, 5], ['moving', 59, 11.8, 8.3, 5],
        ['free', 46, 23, 3.5, 10], ['free', 51, 23, 3.5, 10], ['free', 39.5, 52, 3.5, 12], ['free', 64.5, 53, 3.5, 12],
        ['free', 39, 67, 3.5, 12], ['free', 44, 67, 3.5, 12]
      ]
    },
    {
      id: 'CAM-02', name: 'B2 메인 통로', lot: '잠실 롯데월드몰 주차장', img: 'garageDark', status: 'online', fps: 30,
      boxes: [
        ['car', 0, 55, 18, 16], ['car', 15, 55.5, 10, 15.5], ['car', 24, 57, 6.8, 11.8], ['car', 31, 57.5, 5, 7.5],
        ['car', 91.3, 58, 8.7, 22], ['car', 80, 57.5, 12, 18.7], ['car', 70.8, 60, 9.5, 12], ['car', 64.2, 58.8, 6.5, 8.8],
        ['person', 47, 56, 2.6, 9]
      ]
    },
    {
      id: 'CAM-03', name: 'B3 EV 충전구역', lot: '코엑스 스마트파킹', img: 'garageNeon', status: 'online', fps: 25,
      boxes: [
        ['car', 0, 20, 16.7, 23], ['car', 70.5, 18.8, 16, 16.7], ['car', 88, 21, 12, 25], ['car', 59.2, 16.3, 5, 10],
        ['car', 29.2, 18.8, 5, 11], ['free', 2, 46, 30, 18], ['moving', 44, 22, 7, 9]
      ]
    },
    {
      id: 'CAM-04', name: '노상 주차구역 1', lot: '성수 스마트타워 주차장', img: 'street', status: 'online', fps: 30,
      boxes: [
        ['car', 0, 42, 45, 43], ['car', 18, 40, 36, 36], ['car', 47, 42.5, 34, 22], ['car', 70, 44, 17, 15], ['alert', 71, 41, 29, 19]
      ]
    },
    {
      id: 'CAM-05', name: 'B1 출구 램프', lot: '용산 아이파크몰 주차장', img: 'garageExit', status: 'online', fps: 30,
      boxes: [
        ['car', 0, 58.8, 8.3, 15.7], ['car', 81.3, 58.8, 10, 10], ['car', 88.3, 60, 11.7, 10], ['free', 14, 66, 20, 10], ['person', 60, 62, 2.4, 8]
      ]
    },
    {
      id: 'CAM-06', name: 'B4 신규구역', lot: '여의도 IFC 주차장', img: 'garageArrow', status: 'online', fps: 30,
      boxes: [
        ['free', 0, 63, 36, 30], ['free', 4, 52, 28, 8], ['free', 62, 52, 30, 10]
      ]
    }
  ];

  const hourlyOcc = [32, 26, 22, 20, 21, 25, 38, 58, 76, 84, 86, 88, 91, 89, 85, 82, 80, 83, 87, 79, 66, 55, 46, 38];
  const hourlyPred = [30, 25, 22, 21, 22, 27, 41, 61, 78, 86, 88, 90, 92, 90, 87, 84, 81, 84, 88, 81, 68, 57, 47, 39];

  const eventTypes = [
    { type: 'in', title: '차량 입차', icon: 'login', color: 'blue', w: 34 },
    { type: 'out', title: '차량 출차', icon: 'logout', color: 'mint', w: 30 },
    { type: 'free', title: '빈자리 발생', icon: 'local_parking', color: 'mint', w: 14 },
    { type: 'person', title: '보행자 감지', icon: 'directions_walk', color: 'purple', w: 9 },
    { type: 'illegal', title: '불법·이중 주차 의심', icon: 'report', color: 'red', w: 6 },
    { type: 'long', title: '장기 주차 (24h↑)', icon: 'schedule', color: 'yellow', w: 5 },
    { type: 'cam', title: '카메라 프레임 지연', icon: 'videocam_off', color: 'yellow', w: 2 }
  ];
  function randomEvent() {
    const total = eventTypes.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total;
    const ev = eventTypes.find(e => (r -= e.w) < 0) || eventTypes[0];
    const lot = pick(lots);
    const cam = pick(cameras);
    const floor = pick(lot.floors);
    const slot = `${pick(['A', 'B', 'C', 'D'])}-${String(rand(1, 28)).padStart(2, '0')}`;
    const conf = (88 + Math.random() * 11.5).toFixed(1);
    const meta = {
      in: `${plate()} · ${lot.name} ${floor}`,
      out: `${plate()} · 주차시간 ${rand(0, 5)}시간 ${rand(1, 59)}분`,
      free: `${lot.name} ${floor} ${slot}`,
      person: `${cam.id} · 통로 보행자 신뢰도 ${conf}%`,
      illegal: `${cam.id} · ${floor} 통로 ${plate()}`,
      long: `${plate()} · ${lot.name} ${floor} ${slot}`,
      cam: `${cam.id} · 지연 ${rand(300, 900)}ms`
    }[ev.type];
    return { ...ev, meta, time: new Date() };
  }

  const names = ['김민준', '이서연', '박도윤', '최하은', '정시우', '강지유', '조하준', '윤서아', '장은우', '임지호', '한수아', '오예준', '서지안', '신유준', '권하린', '황준서', '안채원', '송건우', '류다은', '홍길동', '김길동', '박미금', '이오리', '전민재'];
  const users = names.map((n, i) => ({
    id: i + 1,
    name: n,
    email: `user${String(i + 1).padStart(2, '0')}@ezpark.kr`,
    role: i < 2 ? 'ADMIN' : (i % 6 === 0 ? 'BIZ' : 'USER'),
    plate: plate(),
    joined: `2026-${String(rand(1, 9)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`,
    status: i % 9 === 4 ? '휴면' : '정상'
  }));

  const inquiries = [
    { id: 1, company: '(주)스타필드에셋', industry: '쇼핑몰', name: '정우성', slots: 3200, plan: 'Enterprise', date: '2026-10-10', status: '접수' },
    { id: 2, company: '서울성모요양병원', industry: '병원', name: '김태리', slots: 450, plan: 'Business', date: '2026-10-09', status: '상담중' },
    { id: 3, company: '판교 알파돔타워', industry: '오피스', name: '이정재', slots: 1200, plan: 'Business', date: '2026-10-08', status: '견적발송' },
    { id: 4, company: '마포구 시설관리공단', industry: '공공기관', name: '한소희', slots: 2100, plan: 'Enterprise', date: '2026-10-05', status: '계약완료' },
    { id: 5, company: '카페거리 상인회', industry: '상가', name: '박보검', slots: 80, plan: 'Starter', date: '2026-10-04', status: '상담중' },
    { id: 6, company: '고양 킨텍스', industry: '전시장', name: '전지현', slots: 5000, plan: 'Enterprise', date: '2026-10-02', status: '접수' },
    { id: 7, company: '송도 센트럴파크 오피스텔', industry: '오피스', name: '공유', slots: 600, plan: 'Business', date: '2026-09-28', status: '계약완료' },
    { id: 8, company: '분당 서울대병원', industry: '병원', name: '송혜교', slots: 1800, plan: 'Enterprise', date: '2026-09-25', status: '견적발송' }
  ];

  const notices = [
    { id: 8, cat: '공지', title: 'EzPark 2.0 – AI 주차 유도 경로 안내 기능 업데이트', date: '2026-10-10', views: 1284, pinned: true, body: '입구에서 추천 주차면까지 실시간 경로를 안내하는 기능이 추가되었습니다. 주차 유도 메뉴에서 층을 선택하고 빈자리를 누르면 경로가 표시됩니다.' },
    { id: 7, cat: '점검', title: '10월 18일(토) 02:00~05:00 정기 서버 점검 안내', date: '2026-10-08', views: 842, pinned: true, body: '안정적인 서비스 제공을 위해 정기 점검이 진행됩니다. 점검 시간 동안 예약·결제 기능 이용이 제한됩니다.' },
    { id: 6, cat: '이벤트', title: '첫 예약 고객 주차요금 30% 할인 이벤트', date: '2026-10-01', views: 2310, body: '10월 한 달간 EzPark로 첫 예약 시 주차요금 30%를 할인해 드립니다. (최대 1만원)' },
    { id: 5, cat: '공지', title: '판교 테크노밸리 공영주차장 신규 제휴 오픈', date: '2026-09-24', views: 731, body: '판교 테크노밸리 공영주차장 760면이 EzPark AI 관제에 연결되었습니다.' },
    { id: 4, cat: '공지', title: '개인정보 처리방침 개정 안내 (2026.10.01 시행)', date: '2026-09-17', views: 455, body: '차량번호 영상 데이터 비식별화 처리 기준이 추가되었습니다.' },
    { id: 3, cat: '이벤트', title: '전기차 충전구역 실시간 안내 베타 오픈', date: '2026-09-02', views: 1120, body: '전기차 충전 가능 면을 지도와 유도 화면에서 확인할 수 있습니다.' },
    { id: 2, cat: '점검', title: 'CCTV 인지 모델 v3.2 배포에 따른 일시 지연 안내', date: '2026-08-21', views: 388, body: '인지 정확도 향상을 위해 모델이 업데이트되었습니다.' },
    { id: 1, cat: '공지', title: 'EzPark 서비스 정식 오픈', date: '2026-08-01', views: 3502, body: 'AI 영상 인지 기반 주차관제·유도 플랫폼 EzPark가 정식 오픈했습니다.' }
  ];

  const faqs = [
    { cat: '이용', q: '빈자리 정보는 얼마나 정확한가요?', a: 'CCTV 영상을 AI 모델이 실시간으로 분석해 주차면 점유를 판단합니다. 현재 평균 인지 정확도는 97.8%이며, 3~5초 간격으로 갱신됩니다.' },
    { cat: '이용', q: '주차 유도 경로는 어떻게 안내되나요?', a: '주차 유도 메뉴에서 주차장과 층을 선택한 뒤 빈자리를 누르면 입구에서 해당 주차면까지 최단 경로가 표시됩니다. "AI 추천" 버튼을 누르면 가장 가까운 빈자리를 자동으로 추천합니다.' },
    { cat: '예약', q: '예약은 언제까지 취소할 수 있나요?', a: '입차 예정 시간 30분 전까지 무료 취소가 가능하며, 이후에는 기본요금 1회분이 부과됩니다.' },
    { cat: '예약', q: '예약한 자리에 다른 차량이 주차되어 있으면요?', a: 'AI가 예약면의 무단 점유를 감지하면 관제센터에 알림이 전송되고, 동일 층의 대체 주차면을 즉시 배정해 드립니다.' },
    { cat: '결제', q: '어떤 결제 수단을 지원하나요?', a: '신용/체크카드, 카카오페이, 네이버페이, 토스페이를 지원합니다. 기업 고객은 월 정산(세금계산서)도 가능합니다.' },
    { cat: '결제', q: '영수증은 어디서 확인하나요?', a: '마이페이지 > 이용내역에서 건별 영수증을 확인하고 PDF로 저장할 수 있습니다.' },
    { cat: '계정', q: '차량은 몇 대까지 등록할 수 있나요?', a: '개인 회원은 최대 5대, 기업 회원은 제한 없이 등록할 수 있습니다.' },
    { cat: '계정', q: '소셜 계정으로 가입할 수 있나요?', a: 'Google 계정 로그인을 지원하며(Firebase 인증), 카카오·네이버 로그인은 순차 오픈 예정입니다.' },
    { cat: '기업', q: '기존 CCTV를 그대로 사용할 수 있나요?', a: '네, 해상도 1080p 이상의 IP 카메라라면 대부분 그대로 연동 가능합니다. 현장 실사 후 최적 화각을 안내해 드립니다.' },
    { cat: '기업', q: '도입까지 얼마나 걸리나요?', a: '500면 기준 현장 실사부터 운영 오픈까지 평균 2~3주가 소요됩니다.' },
    { cat: '기업', q: '영상 데이터의 개인정보는 어떻게 보호되나요?', a: '차량번호와 얼굴은 엣지 단계에서 비식별화되며, 원본 영상은 저장하지 않고 메타데이터만 암호화하여 보관합니다.' },
    { cat: '이용', q: '전기차 충전 구역도 안내되나요?', a: '네, 주차장 찾기에서 "전기차" 필터를 사용하거나 주차 유도 화면에서 파란색 EV 면을 확인할 수 있습니다.' }
  ];

  const history = [
    { date: '2026-10-11 14:20', lot: '코엑스 스마트파킹', slot: 'B3-C12', time: '2시간 40분', fee: 16000, status: '완료' },
    { date: '2026-10-08 09:05', lot: '강남역 공영주차장', slot: 'B2-A07', time: '8시간 10분', fee: 30000, status: '완료' },
    { date: '2026-10-05 18:30', lot: '잠실 롯데월드몰 주차장', slot: 'B1-D21', time: '3시간 05분', fee: 12000, status: '할인적용' },
    { date: '2026-10-02 11:00', lot: '여의도 IFC 주차장', slot: 'B4-B03', time: '1시간 20분', fee: 9600, status: '완료' },
    { date: '2026-09-27 20:15', lot: '성수 스마트타워 주차장', slot: 'B2-A15', time: '2시간 00분', fee: 10800, status: '완료' },
    { date: '2026-09-21 13:40', lot: '용산 아이파크몰 주차장', slot: 'B1-C09', time: '4시간 30분', fee: 0, status: '취소' }
  ];

  return { lots, cameras, hourlyOcc, hourlyPred, randomEvent, users, inquiries, notices, faqs, history, plate, rand, pick };
})();
