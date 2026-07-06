# ezpark 작업 진행 내역 (Progress Report)

본 문서는 `ezpark` 프로젝트의 초기 세팅부터 현재까지의 작업 진행 내역을 기록한 문서입니다.

---

## ✅ Phase 1 완료 작업 목록

### 1단계-1. 프로젝트 기획 및 문서화
- **`readme.md` 작성 완료**
  - 작업 개요, 기술 스택 확립 (Frontend / Backend / AI&RPA / 인프라)
  - 가상 팀원 3명 (김도윤 / 이서진 / 박민재) 역할 및 15페이지 분배
  - IA (정보구조설계): 4개 카테고리로 메뉴 구조 설계
  - 스타일 가이드: 컬러 팔레트 / Pretendard 폰트 / 컴포넌트 규칙

### 1단계-2. 단계별 배포 계획 수립
- **3단계 구축 전략 확립**
  - 1단계: 프론트엔드 퍼블리싱 → Netlify 배포
  - 2단계: Spring Boot + TiDB 연동 → Render 배포
  - 3단계: Python AI/RPA 모듈 → AWS EC2 + TiDB 통합 배포
- **통합 폴더 구조 설계**
  - 1단계 정적 파일: `src/main/resources/static/` (Spring Boot 표준 경로 선행 적용)
  - 2단계 백엔드 확장 시 Thymeleaf `templates/`로 전환 가능
  - 3단계 AI 모듈: 루트 `ai-rpa/` 폴더 분리 설계

### 1단계-3. 프론트엔드 초기 스캐폴딩
- `src/main/resources/static/` 하위 폴더 전체 생성
  - `pages/auth/` : login.html, register.html, settings.html
  - `pages/service/` : map.html, reservation.html, payment.html, history.html, vehicle.html
  - `pages/admin/` : dashboard.html, faq.html
  - `pages/ai/` : monitoring.html, forecast.html, logs.html, stats.html, rpa.html
  - `css/`, `js/`, `images/` 에셋 폴더
- 빈 HTML 파일 14개 및 CSS/JS 기본 파일 생성

### 1단계-4. 홈(랜딩) 페이지 구현 `index.html`
- **구조:** 헤더(GNB) + 5개 섹션 + 푸터 레이아웃
  - **Header:** 스크롤 시 반응하는 고정 반투명 내비게이션
  - **Hero Section:** AI 실시간 현황 위젯 + CTA 버튼 + 다크 그라디언트 배경
  - **Features Section:** 6개 핵심 기능 카드 (Hover 애니메이션)
  - **How It Works:** 4단계 이용 방법 스텝 UI
  - **Stats Band:** 주요 성과 지표 숫자 표시 (어두운 배경 강조)
  - **CTA Section:** 회원가입/로그인 유도 풀-블루 배너
  - **Footer:** 서비스 링크 4열 구조 + 저작권 표기
- **디자인:** 다크 글래스모피즘 + `Pretendard` 폰트 + Bootstrap 5 기반 반응형

### 1단계-5. 로그인 페이지 구현 `pages/auth/login.html`
- **구조:** 좌우 분할(Split Panel) 레이아웃
  - **Left Panel:** 브랜드 소개 + AI 기능 3가지 하이라이트 카드
  - **Right Panel:** 로그인 폼 (이메일 / 비밀번호 / 기억하기 / 구글 소셜 로그인)
- **기능:**
  - 비밀번호 표시/숨기기 토글
  - 클라이언트 사이드 유효성 검사 (빈값/형식 오류)
  - 데모 계정(`demo@ezpark.kr` / `1234`) 로그인 시 대시보드로 이동
  - 세션 스토리지 기반 인증 상태 관리 (2단계 서버 연동 전 임시)

### 1단계-6. 메인 대시보드 구현 `pages/admin/dashboard.html`
- **구조:** 고정 사이드바(LNB) + 상단 탑바 + 메인 콘텐츠
  - **Sidebar:** 전체 15페이지 메뉴 (서비스 / AI & 데이터 / 설정)
  - **Topbar:** 알림 아이콘 + 검색 + 모바일 햄버거 메뉴
  - **Stat Cards:** 전체 주차면 / 이용 중 / 잔여 공간 / 혼잡도 4종
  - **Chart Area:** 시간대별 수요 예측 차트 (Plotly 연동 예정)
  - **Alert List:** 실시간 이벤트 알림 목록
  - **Park Grid:** A구역 24면 슬롯 시각화 (여유/혼잡/만차/비활성화 상태)
  - **Zone Progress:** 5개 구역 혼잡도 진행 바
- **기능:**
  - 로그인 인증 가드 (비로그인 시 login.html로 자동 리다이렉트)
  - 로그아웃 시 세션 초기화 후 홈으로 복귀

---

## 🔗 GitHub Pages 확인 링크
| 페이지 | URL |
|--------|-----|
| 🏠 홈 (랜딩) | https://fsclass-n.github.io/ezpark/src/main/resources/static/index.html |
| 🔐 로그인 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/auth/login.html |
| 📊 대시보드 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/admin/dashboard.html |

> **데모 계정:** `demo@ezpark.kr` / `1234`

---

### 1단계-7. 회원가입 페이지 구현 `pages/auth/register.html`
- **구조:** 멀티스텝(2단계) 레이아웃 + 좌측 브랜드 배너
  - **Step 1:** 이름 / 이메일(중복 확인) / 비밀번호 / 비밀번호 확인
  - **Step 2:** 역할 선택(일반 사용자 / 주차장 관리자 / 시스템 관리자) + 약관 동의
  - **Step 3:** 가입 완료 애니메이션 → 로그인 페이지 이동
- **기능:**
  - 비밀번호 강도 측정 바 (weak → very strong 5단계)
  - 이메일 중복 확인 (더미 처리)
  - 전체 동의 체크박스 연동
  - 좌측 진행 단계 인디케이터 애니메이션

### 1단계-8. 실시간 주차 지도 구현 `pages/service/map.html`
- **구조:** 사이드바 + 탑바 + SVG 맵 + 우측 정보 패널
  - **SVG 주차 맵:** A/B/C/D 4개 구역 × 각 15~18면 슬롯을 직접 SVG로 렌더링
  - **슬롯 상태:** 여유(초록) / 혼잡(노랑) / 만차(빨강) / 장애인(회색) 색상 구분
  - **마우스오버 툴팁:** 슬롯 ID, 상태, 층 정보 팝업
  - **우측 패널:** 추천 경로 카드, 구역별 혼잡도 미니 바, 전체 요약, 예약 바로가기 버튼
  - **층 선택기:** 지하 1층 / 지하 2층 / 지상 1층 드롭다운
  - **실시간 LIVE 뱃지** + 지도 새로고침 컨트롤 버튼

### 1단계-9. AI 영상 모니터링 구현 `pages/ai/monitoring.html`
- **구조:** 다크테마 사이드바 + 6채널 CCTV 그리드 + 우측 정보 패널
  - **6채널 CCTV 뷰어:** SVG 노이즈 + 스캔라인 + AI 감지 박스 애니메이션
    - CAM-01: 정상(차량 2대 감지)
    - CAM-02: 경고(비인가 차량 + 보행자 감지, 알림 점멸)
    - CAM-03: C구역 만차(차량 4대)
    - CAM-04: 출차 처리 중
    - CAM-05: 정산소 보행자
    - CAM-06: 오프라인(연결 끊김)
  - **AI 인지 정확도 링 차트:** SVG 도넛 형태로 98.2% 시각화
  - **실시간 이벤트 로그:** 최근 6건 알림 표시
  - **실시간 시계:** 모든 카메라 타임스탬프 동기화
  - **AI 스탯 카드 4종:** 인지 정확도, 인지 건수, 이상 감지 수, 평균 감지 속도

---

## 🔗 GitHub Pages 확인 링크
| 페이지 | URL |
|--------|-----|
| 🏠 홈 (랜딩) | https://fsclass-n.github.io/ezpark/src/main/resources/static/index.html |
| 🔐 로그인 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/auth/login.html |
| 📝 회원가입 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/auth/register.html |
| 📊 대시보드 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/admin/dashboard.html |
| 🗺️ 주차 지도 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/service/map.html |
| 📹 AI 모니터링 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/ai/monitoring.html |

> **데모 계정:** `demo@ezpark.kr` / `1234`

---

## 📋 다음 예정 작업
- [ ] 예약 시스템 (`reservation.html`) UI 구현
- [ ] 결제 및 정산 (`payment.html`) UI 구현
- [ ] 이용 내역 (`history.html`) UI 구현
- [ ] 차량 관리 (`vehicle.html`) UI 구현
- [ ] FAQ & 고객 지원 (`faq.html`) UI 구현
- [ ] 수요 예측 리포트 (`forecast.html`) 차트 UI 구현
- [ ] Netlify 배포 연동 (`netlify.toml` 설정)

---

*최종 수정일: 2026년 7월 7일*
*팀원: 김도윤 (프론트엔드), 이서진 (백엔드), 박민재 (AI/데이터)*

