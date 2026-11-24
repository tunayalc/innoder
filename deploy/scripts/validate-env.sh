#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${1:-$(cd "$(dirname "$0")/.." && pwd)/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing production environment file: $ENV_FILE" >&2
  exit 1
fi

env_value() {
  local key="$1" value
  value="$(sed -n "s/^${key}=//p" "$ENV_FILE" | tail -n 1)"
  value="${value#\"}"; value="${value%\"}"
  value="${value#\'}"; value="${value%\'}"
  printf '%s' "$value"
}

require_value() {
  local key="$1" value
  value="$(env_value "$key")"
  if [[ -z "$value" ]]; then
    echo "Required production setting is empty: $key" >&2
    exit 1
  fi
}

for key in \
  COMPOSE_PROJECT_NAME INNO_ENV_FILE POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD DATABASE_URL JWT_SECRET \
  API_DOMAIN ADMIN_DOMAIN PUBLIC_API_URL ALLOWED_ORIGINS TLS_EMAIL \
  BACKUP_ENCRYPTION_PASSWORD RCLONE_CONFIG_FILE SUPER_ADMIN_EMAIL SUPER_ADMIN_USERNAME; do
  require_value "$key"
done

if grep -Eq 'CHANGE_|example\.org|example\.com' "$ENV_FILE"; then
  echo "Production environment still contains placeholder values." >&2
  exit 1
fi

api_domain="$(env_value API_DOMAIN)"
admin_domain="$(env_value ADMIN_DOMAIN)"
public_api="$(env_value PUBLIC_API_URL)"
allowed_origins="$(env_value ALLOWED_ORIGINS)"

domain_pattern='^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])$'
if [[ ! "$api_domain" =~ $domain_pattern || ! "$admin_domain" =~ $domain_pattern ]]; then
  echo "API_DOMAIN and ADMIN_DOMAIN must be host names without a scheme or path." >&2
  exit 1
fi
if [[ "$api_domain" != *.* || "$admin_domain" != *.* ]]; then
  echo "API_DOMAIN and ADMIN_DOMAIN must be fully qualified domain names." >&2
  exit 1
fi
if [[ "$api_domain" == "$admin_domain" ]]; then
  echo "API_DOMAIN and ADMIN_DOMAIN must be different." >&2
  exit 1
fi
if [[ "$public_api" != "https://${api_domain}" || "$allowed_origins" != "https://${admin_domain}" ]]; then
  echo "PUBLIC_API_URL or ALLOWED_ORIGINS does not match the configured domains." >&2
  exit 1
fi

for key in POSTGRES_PASSWORD JWT_SECRET BACKUP_ENCRYPTION_PASSWORD; do
  value="$(env_value "$key")"
  if (( ${#value} < 32 )); then
    echo "$key must contain at least 32 characters." >&2
    exit 1
  fi
done

if [[ -z "$(env_value SMTP_HOST)" || -z "$(env_value SMTP_USER)" || ( -z "$(env_value SMTP_PASSWORD)" && -z "$(env_value SMTP_PASSWORD_BASE64)" ) ]]; then
  echo "WARNING: SMTP is incomplete; password-reset email will remain unavailable." >&2
fi
if [[ -z "$(env_value RCLONE_REMOTE)" ]]; then
  echo "WARNING: RCLONE_REMOTE is empty; backups are local and not disaster-safe." >&2
fi
if [[ -z "$(env_value ALERT_WEBHOOK_URL)" ]]; then
  echo "WARNING: ALERT_WEBHOOK_URL is empty; health failures will only appear in container logs." >&2
fi

echo "Production environment validation passed."
