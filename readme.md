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

---

## 6. 단계별 구축 및 배포 계획 (Phased Development & Deployment)
성공적인 비즈니스 플랫폼 구축을 위해 다음과 같이 3단계로 나누어 작업을 진행합니다.

- **1단계 (Phase 1):** 프론트엔드 퍼블리싱 및 UI 구현, Netlify (넷틀리파이) 배포
- **2단계 (Phase 2):** 백엔드(Spring Boot) 개발, 데이터베이스(TiDB) 연동 및 Render 배포
- **3단계 (Phase 3):** RPA + AI 모델(구글 무료 서비스 활용) 연동, TiDB + AWS EC2 최종 통합 배포

---

## 7. 프로젝트 통합 폴더 구조 (Phase 1~3 확장 대응형)
향후 2단계(Spring Boot/Gradle)와 3단계(Python AI/RPA)로 원활하게 확장할 수 있도록 설계된 통합 폴더 구조입니다. 
1단계 프론트엔드 작업은 `src/main/resources/static` 영역에서 이루어지며, Netlify 배포 시 해당 폴더를 Publish Directory로 지정하여 정적 페이지로 배포합니다. 2단계 진입 시 기존 구조를 그대로 활용해 백엔드에 쉽게 통합할 수 있습니다.

```text
[ezpark]
 ├── src/
 │    └── main/
 │         ├── java/com/ezpark/...   # [2단계] Spring Boot 백엔드 로직 (Controller, Service, Mapper 등)
 │         └── resources/
 │              ├── static/          # [1단계] 프론트엔드 에셋 및 정적 HTML (Netlify 배포 타겟 디렉토리)
 │              │    ├── index.html  # 1단계 메인 랜딩 페이지 및 대시보드
 │              │    ├── pages/      # 1단계 서브 페이지 (auth, service, admin, ai 총 14페이지)
 │              │    ├── css/        # 공통 및 레이아웃 스타일시트
 │              │    ├── js/         # UI 스크립트 및 차트/지도 더미 데이터 연동 스크립트
 │              │    └── images/     # 로고 및 아이콘 에셋
 │              │
 │              ├── templates/       # [2단계] 백엔드 연동 시 static의 HTML을 이동하여 Thymeleaf 템플릿화
 │              └── application.yml  # [2단계] Spring Boot 및 TiDB 데이터베이스 설정 파일
 │
 ├── ai-rpa/                         # [3단계] RPA 및 AI 모델 영상 분석 모듈 (Python 3.11)
 │    ├── requirements.txt           # Python 의존성 패키지 관리 (Numpy, Pandas, Tensorflow 등)
 │    ├── crawler/                   # RPA 기반 K-AI 교통 데이터 수집 스크립트
 │    ├── ai_vision/                 # 주차장 내 이동체(차량/보행자) 영상 인지 모델 추론 로직
 │    └── data_analysis/             # 수요 예측 데이터 통계 및 시각화 생성 모듈
 │
 ├── build.gradle                    # [2단계] Gradle 빌드 설정 파일 (Spring Boot 3, 의존성 명시)
 ├── settings.gradle                 # [2단계] Gradle 프로젝트 설정
 ├── docker-compose.yml              # [2, 3단계] DB, AI 서버 로컬 테스트용 Docker 설정
 ├── netlify.toml                    # [1단계] Netlify 배포 설정 파일 (publish = "src/main/resources/static")
 └── readme.md                       # 프로젝트 명세서 (현재 파일)
```
