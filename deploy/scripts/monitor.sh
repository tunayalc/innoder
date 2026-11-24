#!/bin/sh
set -eu

alert() {
  message="$1"
  echo "$message" >&2
  if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
    code="$(curl -s --proto '=https' --connect-timeout 5 --max-time 10 \
      -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\"$message\"}" "$ALERT_WEBHOOK_URL")" || code=000
    case "$code" in
      2??) return 0 ;;
      *) echo "Alert delivery failed (HTTP $code)." >&2; return 1 ;;
    esac
  fi
}

if [ "${1:-}" = "--test-alert" ]; then
  [ -n "${ALERT_WEBHOOK_URL:-}" ] || { echo "No alert destination configured." >&2; exit 1; }
  alert "Inno notification delivery test (no incident)"
  exit 0
fi

if ! curl -fsS --max-time 10 http://server:3000/health/ready >/dev/null; then
  alert "Inno production API health check failed"
fi

latest="$(find /backups -type f -name 'inno-*.tar.gz.enc' -mmin -1560 -print -quit)"
if [ -z "$latest" ]; then
  alert "Inno encrypted backup is older than 26 hours or missing"
fi

if [ -n "${RCLONE_REMOTE:-}" ]; then
  offsite="$(find /backups -type f -name '.last-offsite-success' -mmin -1560 -print -quit)"
  if [ -z "$offsite" ]; then
    alert "Inno off-site backup has not succeeded in the last 26 hours"
  fi
fi

disk_percent="$(df -P /host | awk 'NR == 2 { gsub(/%/, "", $5); print $5 }')"
if [ -n "$disk_percent" ] && [ "$disk_percent" -ge "${DISK_ALERT_PERCENT:-80}" ]; then
  alert "Inno server disk usage is ${disk_percent}%"
fi
