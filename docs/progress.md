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

## 📋 다음 예정 작업
- [ ] 회원가입 페이지 (`register.html`) UI 구현
- [ ] 실시간 주차 지도 (`map.html`) UI 구현
- [ ] AI 모니터링 (`monitoring.html`) 더미 영상 뷰어 UI 구현
- [ ] Netlify 배포 연동 (Publish Dir: `src/main/resources/static`)
- [ ] `netlify.toml` 설정 파일 작성

---

*최종 수정일: 2026년 7월 7일*
*팀원: 김도윤 (프론트엔드), 이서진 (백엔드), 박민재 (AI/데이터)*
