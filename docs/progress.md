# ezpark 작업 진행 내역 (Progress Report)

본 문서는 `ezpark` 프로젝트의 초기 세팅부터 현재까지의 작업 진행 내역을 기록한 문서입니다.

## 1. 프로젝트 기획 및 기본 문서화
- **`readme.md` 작성 완료**
  - **작업 개요:** AI 모델 및 K-AI 데이터 분석을 활용한 스마트 주차관제 시스템 비즈니스 플랫폼 정의.
  - **기술 스택 확립:**
    - Frontend: HTML5, CSS3, JS, Bootstrap 5
    - Backend: Spring Boot 3 (JDK 21), MySQL 8, TiDB
    - AI & RPA: Python 3.11, Tensorflow, Pandas, Playwright 등
    - 인프라: GitHub Actions, Docker, Netlify, Render, AWS EC2
  - **작업 분배:** 가상 인원 3명(김도윤, 이서진, 박민재) 기준 역할 및 15페이지(1인 5페이지) 분배.
  - **IA (정보구조설계):** 메인 대시보드, 서비스, AI/데이터 리포트, 설정/지원 등 4개 카테고리로 정리.
  - **스타일 가이드:** 컬러 팔레트 (Primary Blue, Secondary Green 등), Pretendard 폰트 지정.

## 2. 단계별 구축 계획 수립 및 구조 설계
- **3단계 배포 전략 적용:**
  - `1단계`: 프론트엔드 퍼블리싱 (Netlify 배포)
  - `2단계`: 백엔드/DB 연동 (Render + TiDB 배포)
  - `3단계`: RPA/AI 모듈 연동 (AWS EC2 + TiDB 배포)
- **통합 폴더 구조 설계:** 향후 2, 3단계 확장을 고려하여 1단계 정적 파일들을 Spring Boot 표준 경로인 `src/main/resources/static/` 하위에 배치하도록 구조화. 또한 AI 스크립트용 폴더(`ai-rpa/`)를 루트에 분리 설계.

## 3. 프론트엔드 (1단계) 초기 폴더 및 파일 스캐폴딩
- `src/main/resources/static/` 경로 내 하위 디렉토리 생성 완료:
  - `pages/auth/`: 로그인, 회원가입 등
  - `pages/service/`: 주차 지도, 예약, 결제 등
  - `pages/admin/`: 관리자 대시보드, FAQ 등
  - `pages/ai/`: AI 모니터링, 통계 리포트 등
  - `css/`, `js/`, `images/` 폴더 구성
- 총 14개의 서브 페이지용 빈 HTML 파일 생성 완료.

## 4. 메인 대시보드 (UI/UX) 구현
- 프리미엄한 모던 웹 디자인 가이드(Glassmorphism, Hover 효과 등) 적용.
- **`index.html`**: 부트스트랩 5를 활용한 반응형 메인 대시보드 구조 및 주요 위젯(주차면 수, 혼잡도 등) 마크업 완료.
- **`css/style.css`**: 기본 테마 색상, 카드 디자인(Glassmorphism), 버튼 이펙트 등 공통 스타일 구현.
- **`css/layout.css`**: 좌측 고정 사이드바(LNB) 및 반응형 토글 메뉴 로직 구현.
- **`js/main.js`**: 모바일 환경을 위한 사이드바 햄버거 메뉴 토글 스크립트 구현.

## 5. 형상 관리 (버전 컨트롤)
- **GitHub 연동 및 초기 커밋/푸시 완료**
  - 초기 `readme.md` 추가 및 폴더 구조 계획 커밋.
  - 프론트엔드 스캐폴딩 및 대시보드 레이아웃 UI 파일 커밋.
  - 대상 리포지토리: `fsclass-n/ezpark` (`main` 브랜치)

---
*작성일자: 2026년 7월 7일*
*다음 예정 작업: Netlify 배포 연동 또는 1단계 서브 페이지(로그인/회원가입 등) UI 구현*
