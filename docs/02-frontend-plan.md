# EzPark 프론트엔드 기획서 & 업무 분담

> 전체 300시간 중 **P1. 프론트엔드 단계 (Day 4 – Day 13, 80시간/인)**
> 목표: 백엔드 연동 전, **목업 데이터로 완전히 동작하는 반응형 정적 웹**을 완성하고 Thymeleaf 전환이 쉬운 구조로 설계한다.

---

## 1. 개발 원칙

1. **기술 스택 준수** – HTML5, CSS3, Vanilla JavaScript, Bootstrap 5, Flexbox (jQuery·React 등 미사용)
2. **반응형** – Mobile First, Bootstrap Breakpoint(`sm 576` / `md 768` / `lg 992` / `xl 1200`) 기준
3. **공통 레이아웃 분리** – 헤더/푸터/콘솔 사이드바는 `common.js`에서 렌더링 → 백엔드 단계에서 Thymeleaf `th:fragment`로 1:1 전환
4. **목업 데이터 분리** – 모든 데이터는 `js/data.js`에 모아 두고, 백엔드 단계에서 `fetch('/api/...')`로 교체
5. **외부 키 미노출** – Gemini·Firebase·공공데이터 API는 프론트에서 직접 호출하지 않음 (UI만 구현, 응답은 목업)

## 2. 디자인 가이드

| 항목 | 내용 |
| --- | --- |
| 메인 컬러 | Navy `#0B1F3A` / Blue `#2F6BFF` |
| 보조 컬러 | Mint `#14C38E`(빈자리) / Yellow `#FFC531`(주차선·경고) / Red `#FF4D5E`(만차·위험) |
| 폰트 | Google Fonts – **Noto Sans KR**(본문), **Montserrat**(영문·숫자) |
| 아이콘 | **Font Awesome 6** (CDN), **Google Material Symbols Rounded**, 투명 PNG가 필요한 경우 **PNGWing** (비상업 라이선스 확인 후 `assets/img`에 저장) |
| 이미지 | **Unsplash** (`images.unsplash.com` CDN, `w`/`q` 파라미터로 용량 최적화) |
| 라운드/그림자 | `--radius: 16px`, 카드 `box-shadow: 0 10px 30px rgba(11,31,58,.08)` |

## 3. 정보 구조 (IA)

```
EzPark
├── 메인 (index.html)
├── 주차 서비스
│   ├── 주차장 찾기 (find.html)
│   ├── 주차 유도 (guide.html)
│   ├── 예약·결제 (reservation.html)
│   └── 마이페이지 (mypage.html)
├── 관제센터 (콘솔 레이아웃)
│   ├── 관제 대시보드 (dashboard.html)
│   ├── 영상 인지 모니터링 (cctv.html)
│   ├── K-AI 데이터 분석 (analysis.html)
│   └── 관리자 (admin.html)
├── 기업 솔루션 (enterprise.html)
├── 고객지원 (support.html)
└── 회원 (login.html / register.html)
```

## 4. 폴더 구조

저장소 구조 (프런트엔드는 `frontend/`에 독립 보관 → Netlify 데모 배포 대상)

```
ezpark/
├── frontend/              # P1 프런트엔드 (Netlify publish 폴더, 이 폴더 변경 시에만 자동 배포)
├── scripts/
│   └── frontend-to-backend.sh   # P2 시작 시 frontend/ → src/main/resources 복사
├── docs/                  # 기획서
├── netlify.toml           # Netlify 배포 설정
└── (P2) pom.xml / build.gradle, src/main/java, src/main/resources/{static,templates}
```

`frontend/` 내부

```
frontend/
├── index.html
├── favicon.svg
├── pages/                 # 하위 페이지 (P2에서 templates/pages/ 로 복사 후 Thymeleaf 전환)
│   ├── find.html  guide.html  reservation.html  mypage.html
│   ├── dashboard.html  cctv.html  analysis.html  admin.html
│   └── enterprise.html  support.html  login.html  register.html
├── css/
│   ├── style.css          # 디자인 토큰, 공통 컴포넌트, 사용자 페이지
│   └── console.css        # 관제 콘솔 레이아웃(사이드바/탑바/위젯)
└── js/
    ├── common.js          # 헤더·푸터·사이드바 렌더링, 토스트, 카운터, 스크롤 애니메이션
    ├── data.js            # 목업 데이터 (주차장, 카메라, 이벤트, 회원, 문의 …)
    ├── mini-chart.js      # Vanilla SVG 차트 (line / bar / donut / heatmap)
    └── pages/             # 페이지별 스크립트
        ├── main.js find.js guide.js reservation.js mypage.js
        ├── dashboard.js cctv.js analysis.js admin.js
        └── enterprise.js support.js auth.js
```

## 5. 페이지 명세 & 담당자

| # | 페이지 | 파일 | 담당 | 주요 기능 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| 1 | 메인 | `index.html` | 김길동 | 히어로 검색, 핵심 기능, 동작 원리, 실시간 현황, 통계 카운터, CTA | MUST |
| 2 | 주차장 찾기 | `find.html` | 홍길동 | 필터/정렬, 주차장 카드, 지도 마커(SVG), 상세 모달 | MUST |
| 3 | 주차 유도 | `guide.html` | 홍길동 | 층별 주차면 맵, 빈자리 추천, 경로 애니메이션, 실시간 갱신 | MUST |
| 4 | 예약·결제 | `reservation.html` | 홍길동 | 4단계 스텝, 요금 계산, 결제수단, 완료 모달 | MUST |
| 5 | 마이페이지 | `mypage.html` | 홍길동 | 프로필, 내 차량 등록/삭제, 이용내역, 즐겨찾기 | SHOULD |
| 6 | 관제 대시보드 | `dashboard.html` | 박미금 | KPI, 24h 점유율 차트, 층별 현황, 이벤트 로그 스트림 | MUST |
| 7 | 영상 인지 모니터링 | `cctv.html` | 박미금 | 다중 카메라 그리드, 바운딩 박스 오버레이, 클래스 필터 | MUST |
| 8 | 관리자 | `admin.html` | 박미금 | 회원/주차장/기업문의/공지 테이블, 검색, 등록 모달 | SHOULD |
| 9 | K-AI 데이터 분석 | `analysis.html` | 이오리 | 수요 예측 차트, 혼잡도 히트맵, 업종별 수요, Gemini 챗 UI | MUST |
| 10 | 기업 솔루션 | `enterprise.html` | 이오리 | 업종별 사례, 요금제(월/연 토글), 도입 문의 폼 | MUST |
| 11 | 고객지원 | `support.html` | 이오리 | 공지사항, FAQ 검색/아코디언, 1:1 문의 | SHOULD |
| 12 | 로그인 | `login.html` | 이오리 | 유효성 검사, 소셜 로그인 버튼(Firebase 예정) | MUST |
| 13 | 회원가입 | `register.html` | 이오리 | 비밀번호 강도, 차량번호 형식 검사, 약관 동의 | MUST |
| – | 공통 레이아웃/CSS | `common.js`, `style.css`, `console.css` | 김길동 | 헤더·푸터·사이드바, 다크 콘솔 테마, 유틸리티 | MUST |
| – | 차트 모듈 | `mini-chart.js` | 박미금 | 반응형 SVG 차트 4종 | MUST |
| – | 목업 데이터 | `data.js` | 전원 | 담당 페이지 데이터 각자 추가 | MUST |

## 6. 일정 WBS (Day 4 – Day 13, 1일 8h)

| Day | 김길동 (공통·메인) | 홍길동 (사용자 서비스) | 박미금 (관제) | 이오리 (AI·비즈·회원) |
| --- | --- | --- | --- | --- |
| **4** | 디자인 토큰·`style.css` 기초, CDN 세팅 | 주차장 목업 데이터 설계 | 콘솔 와이어 → 레이아웃 시안 | 회원/문의 목업 데이터 설계 |
| **5** | 헤더·푸터·콘솔 사이드바 (`common.js`) | `find.html` 마크업 | `mini-chart.js` (line/bar) | `login.html`, `register.html` 마크업 |
| **6** | `index.html` 히어로·기능 섹션 | `find.js` 필터·정렬·지도 마커 | `mini-chart.js` (donut/heatmap) | `auth.js` 유효성 검사 |
| **7** | `index.html` 동작원리·실시간 현황·CTA | `guide.html` 주차면 맵(SVG) | `dashboard.html` KPI·차트 | `enterprise.html` 마크업 |
| **8** | 토스트·카운터·스크롤 애니메이션 공통화 | `guide.js` 경로 안내·실시간 갱신 | `dashboard.js` 이벤트 스트림 | `enterprise.js` 요금제 토글·문의 폼 |
| **9** | `console.css` 다크 테마·위젯 | `reservation.html` 스텝 UI | `cctv.html` 카메라 그리드 | `analysis.html` 차트 레이아웃 |
| **10** | 로그인 상태 헤더 처리(localStorage) | `reservation.js` 요금 계산·결제 | `cctv.js` 바운딩 박스 오버레이 | `analysis.js` 예측·히트맵·Gemini 챗 |
| **11** | 전체 페이지 링크·네비 점검 | `mypage.html/js` | `admin.html/js` | `support.html/js` |
| **12** | 반응형 QA (모바일·태블릿·데스크톱) | 반응형 QA (담당 페이지) | 반응형 QA (담당 페이지) | 반응형 QA (담당 페이지) |
| **13** | 코드 리뷰·머지, 프론트 데모 발표 | 버그 수정, 접근성 점검 | 버그 수정, 성능(이미지) 점검 | 버그 수정, 문서 정리 |

### 6.1 마일스톤

| 시점 | 체크포인트 |
| --- | --- |
| Day 5 종료 | 공통 레이아웃 머지 → 모든 팀원 같은 헤더/푸터 사용 |
| Day 8 종료 | MUST 페이지 50% 이상 동작 (중간 데모) |
| Day 11 종료 | 전 페이지 기능 구현 완료 (Feature Freeze) |
| Day 13 종료 | 반응형 QA 완료, 프론트엔드 데모 데이 |

## 7. 협업 규칙

- **브랜치**: `main` ← `develop` ← `feature/fe-<페이지명>` (예: `feature/fe-guide`)
- **커밋 메시지**: `feat: 주차 유도 경로 애니메이션 추가`, `fix:`, `style:`, `docs:`, `refactor:`
- **PR 규칙**: 1명 이상 리뷰 승인 후 머지, 공통 파일(`style.css`, `common.js`) 수정 시 김길동 리뷰 필수
- **CSS 네이밍**: Bootstrap 유틸 우선, 커스텀은 `ez-` 접두어 (예: `.ez-card`, `.ez-badge`)
- **JS**: `const`/`let`, 모듈 단위 IIFE 또는 `DOMContentLoaded` 내부 작성, 전역은 `EZ` 네임스페이스만 사용

## 8. 백엔드 전환 가이드 (P2 대비)

### 8.1 역할 분리 원칙
| 폴더 | 용도 | 배포 |
| --- | --- | --- |
| `frontend/` | P1 결과물(UI 원본·데모). 화면 시안 변경은 여기서 먼저 확인 | Netlify (이 폴더 변경 시에만) |
| `src/main/resources/static/` | Spring Boot 정적 리소스 (css, js, 이미지) | Render / AWS EC2 |
| `src/main/resources/templates/` | Thymeleaf 템플릿 (html) | Render / AWS EC2 |

- P2부터는 `src/main/resources/`가 실제 서비스의 기준이다. `frontend/`는 데모 사이트로 유지하고, 화면을 바꿔 데모에도 보여줘야 할 때만 함께 수정한다.
- 백엔드 커밋(`src/`, `pom.xml` 등)은 Netlify 배포를 일으키지 않는다. (`netlify.toml`의 `ignore` 설정)

### 8.2 P2 시작 절차 (Day 14)
1. Spring Initializr로 프로젝트 생성 후 **저장소 루트**에 `pom.xml`(또는 `build.gradle`)과 `src/`를 둔다. (JDK 21, Spring Boot 4.x, Spring Web, Thymeleaf, JDBC API, MySQL Driver, Lombok)
2. 프런트엔드 복사 (Git Bash):
   ```bash
   bash scripts/frontend-to-backend.sh
   ```
   - `frontend/css, js, favicon.svg` → `src/main/resources/static/`
   - `frontend/index.html, pages/*.html` → `src/main/resources/templates/`
   - 대상 폴더에 이미 파일이 있으면 덮어쓰지 않고 중단한다. (`--force`로 강제)
3. 임시 페이지 컨트롤러를 추가하면 **HTML 수정 없이** 현재 화면이 Spring에서 그대로 열린다. (상대경로 구조 유지)
   ```java
   @Controller
   public class PageController {
       @GetMapping({"/", "/index.html"})
       public String index() { return "index"; }

       // 템플릿 이름은 소문자 영문만 허용 (뷰 이름 주입 방지)
       @GetMapping("/pages/{name:[a-z]+}.html")
       public String page(@PathVariable String name) { return "pages/" + name; }
   }
   ```
4. 이후 페이지별로 Thymeleaf 전환을 진행한다. (아래 표)

### 8.3 전환 대응표

| 프론트(현재) | 백엔드(P2) |
| --- | --- |
| `common.js` `renderHeader()` | `templates/fragments/header.html` (`th:fragment="header"`) |
| `data.js` `EZ_DATA.lots` | `GET /api/lots` (JdbcTemplate) |
| `localStorage('ezUser')` 로그인 | Spring 세션 + BCrypt 비밀번호 검증 |
| Gemini 챗 목업 응답 | `POST /api/ai/insight` → 서버에서 Gemini API 호출 |
| 문의 폼 `localStorage` 저장 | `POST /api/inquiries` |

## 9. 실행 방법

정적 파일이므로 간단한 로컬 서버로 확인한다.

- **VS Code Live Server**: `.vscode/settings.json`에 루트가 `/frontend`로 지정되어 있어, 아무 HTML에서 *Open with Live Server* → `http://127.0.0.1:5500/`
- **Python**
  ```bash
  cd frontend
  python -m http.server 5500
  # http://localhost:5500 접속
  ```

### 9.1 Netlify 배포
- GitHub 저장소 연결 시 `netlify.toml`이 자동 적용된다. (Build command 비움, Publish directory `frontend`)
- `frontend/` 또는 `netlify.toml`이 바뀐 커밋만 배포되고, 그 외(백엔드·문서) 커밋은 배포를 건너뛴다.

> 데모 계정: `admin@ezpark.kr` / `ezpark1234` (관리자), 그 외 형식에 맞는 이메일/비밀번호는 일반 회원으로 로그인됩니다.

## 10. 진행 현황

| 구분 | 상태 |
| --- | --- |
| 공통 레이아웃 / 디자인 시스템 | ✅ 완료 |
| 사용자 페이지 (index, find, guide, reservation, mypage) | ✅ 완료 |
| 관제 콘솔 (dashboard, cctv, analysis, admin) | ✅ 완료 |
| 비즈·지원·회원 (enterprise, support, login, register) | ✅ 완료 |
| 반응형 QA | ✅ 완료 |
