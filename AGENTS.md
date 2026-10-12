# AGENTS.md

## Project
EzPark – AI 영상 인지 기반 주차관제·유도 반응형 웹 (훈련생 4인 300시간 프로젝트).
- 기획/일정: `docs/01-project-plan.md`, 프론트엔드 WBS·백엔드 전환 가이드: `docs/02-frontend-plan.md`
- 현재 단계: P1 프론트엔드 완료 (정적 파일, `frontend/`)

## Repository layout
- `frontend/` – 프런트엔드 원본 / Netlify 데모 배포 폴더 (`netlify.toml`: publish=`frontend`, `frontend/`·`netlify.toml` 변경 커밋에서만 배포)
- `scripts/frontend-to-backend.sh` – P2 시작 시 `frontend/` → `src/main/resources/{static,templates}` 복사 (대상에 파일 있으면 중단, `--force`로 덮어쓰기)
- P2 백엔드(Spring Boot)는 저장소 루트에 `pom.xml`/`build.gradle` + `src/` 로 추가한다. 백엔드 변경은 Netlify 배포를 일으키지 않는다.
- `frontend/`에는 API 키 등 비밀정보를 절대 두지 않는다 (그대로 공개됨).

## Conventions
- Stack: HTML5, CSS3, Vanilla JS, Bootstrap 5.3.3 (CDN + SRI), Font Awesome 6.5.2, Google Material Symbols, Google Fonts (Noto Sans KR, Montserrat)
- 이미지: Unsplash – `js/data.js`의 `EZ_PHOTO` 키 사용 (`<img data-img="key" data-w="800">`, `data-bg="key"`)
- 공통 레이아웃: `js/common.js`가 `#ez-header`/`#ez-footer`(공개 페이지) 또는 `#ez-sidebar`/`#ez-topbar`(`data-layout="console"`)를 렌더링
- 페이지 body 속성: `data-root`("./" 또는 "../"), `data-page`, 콘솔은 `data-title`
- 모든 경로는 상대경로 (절대경로 `/...` 금지 – 하위 경로 서빙/Live Server 호환)
- 목업 데이터는 `js/data.js`(`EZ_DATA`), 차트는 `js/mini-chart.js`(`MiniChart`)
- 커스텀 CSS 클래스는 `ez-` 접두어 우선

## Run / Verify
```bash
cd frontend
python -m http.server 5500 --bind 127.0.0.1
# http://127.0.0.1:5500   (VS Code Live Server는 .vscode/settings.json 에서 root=/frontend)
```
- Node는 설치되어 있지 않음. 검증은 Python Playwright(`channel='chrome'`)로 각 페이지 콘솔 에러/가로 스크롤(390px) 확인.
