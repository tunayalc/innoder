#!/usr/bin/env bash
# Web-only rollout; do not restart API, database, or mobile review services.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
compose() { docker compose --env-file .env -f docker-compose.yml "$@"; }
current="$(compose ps -q admin-web)"
old_image="$(docker inspect --format '{{.Image}}' "$current")"
image_tag="$(docker inspect --format '{{.Config.Image}}' "$current")"
backup_tag="inno-rollback-web:$(date -u +%Y%m%dT%H%M%SZ)"
docker tag "$old_image" "$backup_tag"
compose build admin-web
rollback() {
  trap - ERR
  docker tag "$backup_tag" "$image_tag"
  compose up -d --no-deps --no-build --wait --wait-timeout 120 admin-web
  echo "Restored previous web image: $backup_tag" >&2
  exit 1
}
trap rollback ERR
compose up -d --no-deps --no-build --wait --wait-timeout 120 admin-web
domain="$(sed -n 's/^ADMIN_DOMAIN=//p' .env | tail -1)"
for entry in /admin /uye; do
  curl --fail --silent --show-error --retry 3 --max-time 15 "https://$domain$entry" | grep -q 'Başvuru sistemi'
done
echo "Web release verified; rollback image: $backup_tag"
