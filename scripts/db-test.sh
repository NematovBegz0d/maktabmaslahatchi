#!/usr/bin/env bash
# ============================================================================
# EduLens — pgTAP DB test runner.
#
# Migratsiyalarni toza supabase/postgres konteynerga qo'llaydi va
# supabase/tests/*.test.sql pgTAP testlarini ishga tushiradi.
#
# Lokal (podman) va CI (docker) muhitlarining IKKALASIDA ishlaydi — `docker`
# buyrug'i ikkalasida ham mavjud (lokal sandboxda u podman'ga symlink).
#
# Foydalanish:
#   bash scripts/db-test.sh
# Sozlamalar (ixtiyoriy):
#   CONTAINER_RUNTIME=podman   # default: docker
#   PG_IMAGE=...               # default: supabase/postgres (ECR public)
# ============================================================================
set -euo pipefail

RT="${CONTAINER_RUNTIME:-docker}"
IMAGE="${PG_IMAGE:-public.ecr.aws/supabase/postgres:15.8.1.060}"
NAME="edulens_pgtap_$$"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Migratsiyalar storage/auth schema'lariga tegadi — image'ning haqiqiy
# superuser'i `supabase_admin` orqali ulanamiz (`postgres` roli cheklangan).
# Image ichki rollar parolini POSTGRES_PASSWORD ga tenglaydi.
DBUSER="${PGUSER:-supabase_admin}"
DBPASS="${PGPASSWORD:-postgres}"

log() { printf '\033[36m%s\033[0m\n' "$*"; }
cleanup() { $RT rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

psql_su() { $RT exec -e PGPASSWORD="$DBPASS" -i "$NAME" psql -U "$DBUSER" -d postgres -v ON_ERROR_STOP=1 "$@"; }

log "▶ Postgres konteyner: $IMAGE"

# public.ecr.aws anonim pull rate-limit'i (toomanyrequests) — GitHub runner IP'lari
# ulashilgani uchun tez-tez uchraydigan TRANSIENT xato. Image'ni qayta-urinish
# (backoff) bilan OLDINDAN tortamiz; keyin `run` lokal image'ni ishlatadi.
pull_ok=0
for attempt in 1 2 3 4 5; do
  if $RT pull "$IMAGE" >/dev/null 2>&1; then pull_ok=1; break; fi
  wait=$((attempt * 15))
  log "  ⚠ image pull urinish #$attempt muvaffaqiyatsiz (rate-limit?) — ${wait}s kutib qayta urinaman"
  sleep "$wait"
done
[ "$pull_ok" = 1 ] || {
  echo "XATO: '$IMAGE' image'ini tortib bo'lmadi (ECR rate-limit)."
  echo "Job'ni qayta ishga tushiring yoki workflow'ga ECR Public auth qo'shing (limitni oshiradi)."
  exit 1
}

$RT run -d --name "$NAME" \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  "$IMAGE" >/dev/null

log "▶ Postgres tayyor bo'lguncha kutish (init qayta-ishga-tushishini hisobga olib)"
# supabase/postgres image avval init uchun VAQTINCHALIK server ko'taradi, init
# skriptlaridan keyin uni o'chirib HAQIQIY serverni ishga tushiradi. Vaqtinchalik
# serverga ulanmaslik uchun "init process complete"dan KEYINGI "ready" satrini
# kutamiz va haqiqiy ulanishni tasdiqlaymiz.
ready=0
for i in $(seq 1 90); do
  logs="$($RT logs "$NAME" 2>&1 || true)"
  after_init="$(printf '%s' "$logs" | sed -n '/init process complete/,$p')"
  if printf '%s' "$after_init" | grep -q "ready to accept connections"; then
    if $RT exec -e PGPASSWORD="$DBPASS" "$NAME" psql -U "$DBUSER" -d postgres -c "select 1" >/dev/null 2>&1; then
      ready=1; break
    fi
  fi
  sleep 1
done
[ "$ready" = 1 ] || { echo "XATO: postgres tayyor bo'lmadi"; $RT logs "$NAME" 2>&1 | tail -20; exit 1; }

log "▶ Bootstrap (storage stub)"
psql_su -q < "$ROOT/supabase/tests/_bootstrap.sql"

log "▶ Migratsiyalarni qo'llash"
for f in "$ROOT"/supabase/migrations/*.sql; do
  printf '   • %s\n' "$(basename "$f")"
  psql_su -q < "$f"
done

log "▶ pgTAP kengaytmasi"
psql_su -q -c "create extension if not exists pgtap;"

log "▶ Testlar"
rc=0
shopt -s nullglob
for t in "$ROOT"/supabase/tests/*.test.sql; do
  log "── $(basename "$t")"
  # ON_ERROR_STOP YO'Q: test fayli o'zining begin/rollback'ini boshqaradi.
  out="$($RT exec -e PGPASSWORD="$DBPASS" -i "$NAME" psql -U "$DBUSER" -d postgres -Xq -f - < "$t" 2>&1)"
  printf '%s\n' "$out"
  # pgTAP muvaffaqiyatsiz assertion'lar "not ok" deb yozadi; SQL xatosi "ERROR".
  if printf '%s' "$out" | grep -qE '^not ok|ERROR:|FATAL:'; then
    rc=1
  fi
done

echo ""
if [ "$rc" = 0 ]; then
  log "✓ Barcha pgTAP testlari o'tdi"
else
  log "✗ Ba'zi pgTAP testlari YIQILDI"
fi
exit $rc
