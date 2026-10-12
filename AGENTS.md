# AGENTS.md

## Project
EzPark – AI 영상 인지 기반 주차관제·유도 반응형 웹 (훈련생 4인 300시간 프로젝트).
- 기획/일정: `docs/01-project-plan.md`, 프론트엔드 WBS: `docs/02-frontend-plan.md`
- 현재 단계: P1 프론트엔드 (정적 파일, `src/main/resources/static/`)

## Conventions
- Stack: HTML5, CSS3, Vanilla JS, Bootstrap 5.3.3 (CDN + SRI), Font Awesome 6.5.2, Google Material Symbols, Google Fonts (Noto Sans KR, Montserrat)
- 이미지: Unsplash – `js/data.js`의 `EZ_PHOTO` 키 사용 (`<img data-img="key" data-w="800">`, `data-bg="key"`)
- 공통 레이아웃: `js/common.js`가 `#ez-header`/`#ez-footer`(공개 페이지) 또는 `#ez-sidebar`/`#ez-topbar`(`data-layout="console"`)를 렌더링
- 페이지 body 속성: `data-root`("./" 또는 "../"), `data-page`, 콘솔은 `data-title`
- 목업 데이터는 `js/data.js`(`EZ_DATA`), 차트는 `js/mini-chart.js`(`MiniChart`)
- 커스텀 CSS 클래스는 `ez-` 접두어 우선

## Run / Verify
```bash
cd src/main/resources/static
python -m http.server 5500 --bind 127.0.0.1
# http://127.0.0.1:5500
```
- Node는 설치되어 있지 않음. 검증은 Python Playwright(`channel='chrome'`)로 각 페이지 콘솔 에러/가로 스크롤(390px) 확인.
