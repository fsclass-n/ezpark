# ezpark - 주차관제 및 유도 시스템 비즈니스 플랫폼

## 1. 작업 개요 (Project Overview)
**ezpark**는 AI 모델 및 K-AI 데이터 분석을 활용하여 기업 수요를 반영한 스마트 주차관제 및 유도 시스템 비즈니스 플랫폼입니다. 주차장 내 이동체(차량 및 보행자) 인지 영상 데이터를 실시간으로 분석하여 빈 주차 공간으로의 유도를 최적화하고, 주차 수요 예측 및 기업 맞춤형 데이터 인사이트를 제공합니다.

- **목표:** 주차 혼잡도 감소, 관리 효율성 증대, AI 기반 데이터 시각화 및 스마트 주차 솔루션 제공.
- **주요 기능:** 실시간 주차 현황 모니터링, 영상 분석 기반 AI 이동체 인지, 주차 수요 예측(K-AI 연계 데이터 분석), 자동화된 결제/예약 시스템.

---

## 2. 기술 스택 (Tech Stack)
### 프론트엔드 (Frontend)
- HTML5, CSS3, Vanilla JavaScript, Bootstrap 5
### 백엔드 (Backend)
- JDK 21, Spring Boot 3, Thymeleaf, Tomcat 10.1
- 데이터베이스: MySQL 8, TiDB Cloud
- ORM/DB Access: JdbcTemplate
- 라이브러리 및 빌드: Lombok, Gradle
### RPA + AI (Data & AI)
- Python 3.11
- 데이터 조작 및 분석: Numpy, Pandas
- 데이터 수집(크롤링/RPA): Requests, BeautifulSoup, Playwright
- 데이터 시각화: Matplotlib, Seaborn, Plotly
- 머신러닝 및 딥러닝: Scikit-learn, TensorFlow
### 빌드 및 배포 (Build & Deploy)
- Docker, GitHub Actions, TiDB Cloud, Render (또는 AWS EC2)
### 테스트 (Test)
- 로컬 환경 및 배포 서버 환경 모두 테스트 가능한 CI/CD 결과물 도출

---

## 3. 작업 분배 (Work Distribution & Pages)
프로젝트는 총 3명의 팀원이 각 5페이지씩 담당하여 총 15페이지로 구성됩니다.

### 👤 김도윤 (프론트엔드 UI & 사용자 서비스)
1. **메인 대시보드:** 전체 주차 현황(빈자리 수, 혼잡도) 요약 및 주요 통계 대시보드
2. **실시간 주차 지도:** 주차 구역별 빈자리 안내 및 유도 맵
3. **사용자 인증:** 로그인, 회원가입 및 권한 관리 페이지
4. **차량 및 월정기권 관리:** 사용자 차량 등록, 수정, 월정기권 구독 관리
5. **시스템 설정:** 사용자 계정 알림 및 개인화 설정 페이지

### 👤 이서진 (백엔드 로직 & 결제 시스템)
1. **주차 예약 시스템:** 날짜/시간별 주차 공간 예약 및 취소 관리
2. **결제 및 정산:** 자동 주차 요금 결제, 요금 할인 적용 및 정산 내역
3. **주차 이용 내역:** 과거 입/출차 기록 및 이용 상세 내역 조회
4. **고객 지원 (FAQ & QnA):** 자주 묻는 질문 및 1:1 고객 문의 게시판
5. **관리자 대시보드:** 회원 관리, 권한 제어 및 플랫폼 운영 통계

### 👤 박민재 (AI 영상 분석 & K-AI 데이터 서비스)
1. **AI 영상 모니터링:** 주차장 CCTV 연동 기반 이동체(차량/보행자) 실시간 인지 뷰어
2. **주차 수요 예측 리포트:** 시간/요일별 주차 수요 예측 차트 (Plotly 적용)
3. **이동체 인지 로그 목록:** AI가 감지한 차량 번호 미인식, 이상 행동 등 로그 목록
4. **K-AI 데이터 통계:** 외부 교통 데이터(K-AI)와 연계한 주변 교통량 및 주차장 유입 분석 통계
5. **RPA 데이터 수집 현황:** 주차 관련 공공 데이터 자동 수집 및 처리 현황판

---

## 4. 정보구조설계 (Information Architecture - IA)
```text
[ezpark]
 ├── 1. 홈 & 대시보드 (Home)
 │    ├── 메인 대시보드 (전체 요약)
 │    └── 관리자 대시보드 (운영 요약)
 │
 ├── 2. 서비스 (Service)
 │    ├── 실시간 주차 지도 (유도 맵)
 │    ├── 주차 예약 시스템
 │    ├── 차량 및 월정기권 관리
 │    ├── 주차 이용 내역
 │    └── 결제 및 정산 내역
 │
 ├── 3. AI & 데이터 리포트 (AI & Data)
 │    ├── AI 영상 모니터링
 │    ├── 이동체 인지 로그
 │    ├── 주차 수요 예측 리포트
 │    ├── K-AI 데이터 통계
 │    └── RPA 데이터 수집 현황
 │
 └── 4. 설정 & 지원 (Settings & Support)
      ├── 사용자 인증 (로그인/회원가입)
      ├── 시스템 설정
      └── 고객 지원 (FAQ & QnA)
```

---

## 5. 스타일 가이드 (Style Guide)

### Color Palette
- **Primary Color:** `#0d6efd` (Blue) - 신뢰감을 주는 색상 (주요 버튼, 핵심 링크, 헤더)
- **Secondary Color:** `#198754` (Green) - 긍정 및 사용 가능 (빈 주차 공간, 예약 완료, 성공 상태)
- **Accent/Alert Color:** `#dc3545` (Red) - 경고 및 제한 (만차, 결제 오류, 비인가 차량 감지)
- **Background Color:** `#f8f9fa` (Light Gray) - 깔끔한 대시보드 배경 (카드와 대비)
- **Text Color:** `#212529` (Dark Gray) - 기본 텍스트 (가독성 확보)

### Typography
- **Font-Family:** 'Pretendard', 'Noto Sans KR', sans-serif
- **Headings:**
  - H1: 32px, Bold (페이지 메인 타이틀)
  - H2: 24px, Semi-Bold (섹션 타이틀)
  - H3: 20px, Medium (카드/위젯 타이틀)
- **Body Text:** 16px, Regular (본문 내용)
- **Small Text:** 14px, Regular (캡션, 로그 시간, 도움말)

### UI Components (기반: Bootstrap 5)
- **버튼 (Buttons):** 
  - 기본 형태: Bootstrap 5 기본 클래스(`btn-primary`, `btn-outline-secondary` 등) 사용. 
  - 모서리 반경: `border-radius: 6px`. Hover 시 부드러운 명도 전환 애니메이션.
- **카드 (Cards):** 
  - 대시보드 내 데이터를 담는 컨테이너 활용.
  - 가벼운 그림자: `box-shadow: 0 4px 6px rgba(0,0,0,0.05)`, 테두리 제거.
- **데이터 시각화 (Charts):** 
  - Matplotlib, Seaborn, Plotly 웹 렌더링 시 Primary/Secondary 색상 톤 유지. 반응형(Responsive) 크기 조정 적용.
- **레이아웃 (Layout):**
  - PC 환경: 사이드바(LNB) + 상단 헤더(GNB) + 메인 컨텐츠 영역의 일반적인 대시보드 레이아웃.
  - 모바일 환경: 최대 768px 시 사이드바를 숨기고 상단 햄버거 메뉴(Offcanvas)로 전환하는 반응형 웹 설계.
