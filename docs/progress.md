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

### 1단계-4 ~ 15. 프론트엔드 전체 페이지 퍼블리싱 완료
모든 페이지는 Bootstrap 5, Pretendard 폰트, 반응형 웹 디자인, 다크모드/라이트모드 컴포넌트 믹스 디자인을 적용하여 완성되었습니다.

#### 🏠 메인 및 인증
- `index.html` (홈 페이지)
- `pages/auth/login.html` (로그인)
- `pages/auth/register.html` (회원가입 - 3단계 멀티스텝)
- `pages/auth/settings.html` (시스템 설정 - 세로 탭)

#### ⚙️ 관리자 및 대시보드
- `pages/admin/dashboard.html` (관리자 대시보드)
- `pages/admin/faq.html` (FAQ 및 고객 지원)

#### 🚙 서비스 페이지
- `pages/service/map.html` (실시간 주차 지도 - SVG 인터랙티브 맵)
- `pages/service/reservation.html` (주차 예약 시스템)
- `pages/service/payment.html` (결제 및 정산)
- `pages/service/history.html` (이용 내역 및 필터링)
- `pages/service/vehicle.html` (차량 및 월정기권 관리)

#### 🤖 AI & 데이터 페이지
- `pages/ai/monitoring.html` (AI 모니터링 - 6채널 CCTV 뷰어)
- `pages/ai/forecast.html` (수요 예측 리포트 - Chart.js)
- `pages/ai/logs.html` (인지 로그 - 사이드 드로어 상세정보)
- `pages/ai/stats.html` (K-AI 통계 - 이중축 혼잡도 차트)
- `pages/ai/rpa.html` (RPA 현황 - 데이터 파이프라인 시각화 및 터미널 로그)

---

## 🔗 GitHub Pages 확인 링크
| 카테고리 | 페이지 | URL |
|---|--------|-----|
| 메인 | 🏠 홈 (랜딩) | https://fsclass-n.github.io/ezpark/src/main/resources/static/index.html |
| 인증 | 🔐 로그인 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/auth/login.html |
| 인증 | 📝 회원가입 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/auth/register.html |
| 인증 | ⚙️ 시스템 설정 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/auth/settings.html |
| 관리자 | 📊 대시보드 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/admin/dashboard.html |
| 관리자 | ❓ FAQ | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/admin/faq.html |
| 서비스 | 🗺️ 주차 지도 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/service/map.html |
| 서비스 | 📅 예약 시스템 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/service/reservation.html |
| 서비스 | 💳 결제 및 정산 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/service/payment.html |
| 서비스 | 🕒 이용 내역 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/service/history.html |
| 서비스 | 🚙 차량 관리 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/service/vehicle.html |
| AI | 📹 AI 모니터링 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/ai/monitoring.html |
| AI | 📈 수요 예측 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/ai/forecast.html |
| AI | 📋 인지 로그 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/ai/logs.html |
| AI | 📉 K-AI 통계 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/ai/stats.html |
| AI | 🤖 RPA 현황 | https://fsclass-n.github.io/ezpark/src/main/resources/static/pages/ai/rpa.html |

> **데모 계정:** `demo@ezpark.kr` / `1234`
> (로그인이 필요한 모든 페이지는 위 계정으로 접근 가능합니다)

---

## 📋 다음 예정 작업 (Phase 2 준비)
- [ ] 1단계 배포: Netlify에 `src/main/resources/static` 경로 배포 (또는 GitHub Pages 유지)
- [ ] 2단계 백엔드 전환: Spring Boot 프로젝트 세팅 및 Thymeleaf 전환 시작
- [ ] 2단계 DB 연동: TiDB Cloud 연동 및 ERD 설계

---

*최종 수정일: 2026년 7월 7일*
*팀원: 김도윤 (프론트엔드), 이서진 (백엔드), 박민재 (AI/데이터)*
