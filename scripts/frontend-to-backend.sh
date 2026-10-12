#!/usr/bin/env bash
# =========================================================
# EzPark P2 시작용: frontend/ → Spring Boot 리소스 폴더로 복사
#   frontend/css, js, favicon.svg  → src/main/resources/static/
#   frontend/index.html, pages/*.html → src/main/resources/templates/
# frontend/ 는 그대로 유지된다 (Netlify 데모용 원본).
#
# 사용법 (저장소 루트, Git Bash):
#   bash scripts/frontend-to-backend.sh          # 대상 폴더가 비어 있을 때만 복사
#   bash scripts/frontend-to-backend.sh --force  # 기존 파일 덮어쓰기 (주의)
# =========================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/frontend"
STATIC="$ROOT/src/main/resources/static"
TEMPLATES="$ROOT/src/main/resources/templates"
FORCE="${1:-}"

[ -f "$SRC/index.html" ] || { echo "[오류] $SRC/index.html 이 없습니다."; exit 1; }

has_files() { [ -d "$1" ] && [ -n "$(find "$1" -type f -print -quit)" ]; }
if [ "$FORCE" != "--force" ] && { has_files "$STATIC" || has_files "$TEMPLATES"; }; then
  echo "[중단] static/ 또는 templates/ 에 이미 파일이 있습니다."
  echo "       백엔드에서 수정한 내용을 덮어쓸 수 있으니 확인 후 --force 옵션으로 다시 실행하세요."
  exit 1
fi

mkdir -p "$STATIC" "$TEMPLATES/pages"
cp -R "$SRC/css" "$SRC/js" "$STATIC/"
cp "$SRC/favicon.svg" "$STATIC/"
cp "$SRC/index.html" "$TEMPLATES/"
cp "$SRC"/pages/*.html "$TEMPLATES/pages/"

echo "[완료] 복사 결과"
echo "  static    : $(find "$STATIC" -type f | wc -l | tr -d ' ')개 파일 (css, js, favicon)"
echo "  templates : $(find "$TEMPLATES" -type f | wc -l | tr -d ' ')개 파일 (html)"
echo
echo "다음 단계: docs/02-frontend-plan.md '8. 백엔드 전환 가이드' 참고"
