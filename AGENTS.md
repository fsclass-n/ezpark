# AGENTS.md

## Project
EzPark – AI 영상 인지 기반 주차관제·유도 반응형 웹 (훈련생 4인 300시간 프로젝트).
- 기획/일정: `docs/01-project-plan.md`
- P1 프론트엔드: `docs/02-frontend-plan.md` (완료, `frontend/`)
- P2 백엔드: `docs/03-backend-plan.md` (Spring Boot 4.1.1 · Gradle · Thymeleaf · JdbcTemplate · TiDB)

## Repository layout
- `frontend/` – P1 목업 프런트엔드 / Netlify 데모 (`netlify.toml`: `frontend/`·`netlify.toml` 변경 커밋에서만 배포)
- `src/main/java/com/ezpark/**` – 백엔드 (패키지: config, common, web, user, lot, reservation, member, monitor, board, admin, ai, publicdata)
- `src/main/resources/templates` – Thymeleaf (공통 조각 `fragments/layout.html`), `static/` – API 연동 버전 CSS/JS
- `src/main/resources/db/schema.sql`(매 기동, IF NOT EXISTS) · `seed.sql`(app_seed 로 1회)
- P2 이후 화면 수정은 `src/main/resources/` 가 기준. `frontend/` 는 데모용으로 필요할 때만 함께 수정.
- 비밀정보는 `.env`(gitignore) 또는 환경변수만 사용 – 형식은 `.env.example`. `frontend/`·`static/` 에 키를 두지 않는다.

## Conventions
- 서버: 컨트롤러 DTO 는 record + Bean Validation, 오류는 `ApiException` → `{"message"}`; 권한은 `LoginInterceptor(Level)` + `PageController`
- SQL 은 MySQL 8 / TiDB / H2(MODE=MySQL) 공용 문법만 사용 (`CREATE INDEX IF NOT EXISTS` 금지 → 인라인 INDEX)
- Thymeleaf 조각 이름은 태그명과 겹치지 않게 짓는다 (`:: header` 는 모든 `<header>` 태그까지 선택함 → `publicHeader`, `consoleTopbar` 등 사용)
- generated key 는 `prepareStatement(sql, new String[]{"id"})` (H2 는 RETURN_GENERATED_KEYS 시 모든 기본값 컬럼 반환)
- 시간은 Asia/Seoul 기준 (`ReservationService.KST`, JVM 기본 시간대 설정)
- 프런트: Bootstrap 5.3.3 (CDN+SRI), Font Awesome 6.5.2, Material Symbols, Google Fonts, Unsplash(`EZ_PHOTO` 키)
- JS: 서버 데이터는 `EZ.api()`, 오류는 `EZ.fail()`, 출력은 `EZ.esc()`; 모든 경로 상대경로 유지 (`/pages/*.html` URL 구조)

## Run / Verify
```bash
./gradlew bootRun --args='--spring.profiles.active=local'   # H2, admin@ezpark.kr / ezpark1234
./gradlew test                                              # 단위 5 + 통합 7
./gradlew bootJar
cd frontend && python -m http.server 5500                   # P1 데모
```
- 이 PC 의 PATH 에는 node 가 없지만 `C:\Users\whyei\anaconda3\Lib\site-packages\playwright\driver\node.exe --check <file>` 로 JS 문법 검사 가능.
- 화면 검증은 Python Playwright(`channel='chrome'`)로 콘솔 에러·흐름 확인.
- 정적 리소스 수정 후에는 bootRun 재시작 필요 (build/resources 에서 서빙).
- Python heredoc 으로 JS 를 치환할 때 `\n` 이 실제 줄바꿈으로 들어갈 수 있으니 수정 후 `node --check` 로 확인.
