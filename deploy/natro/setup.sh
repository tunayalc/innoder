#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"
ENV_FILE="$DEPLOY_DIR/.env"
SKIP_DNS=false

for argument in "$@"; do
  case "$argument" in
    --skip-dns-check) SKIP_DNS=true ;;
    -h|--help)
      echo "Usage: sudo bash deploy/natro/setup.sh [--skip-dns-check]"
      exit 0
      ;;
    *) echo "Unknown option: $argument" >&2; exit 1 ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  exec sudo -E bash "$0" "$@"
fi

if [[ ! -r /etc/os-release ]]; then
  echo "This installer requires Ubuntu or Debian." >&2
  exit 1
fi
# This file exists on every supported host.
# shellcheck disable=SC1091
. /etc/os-release
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
  echo "Unsupported distribution: $ID. Use an Ubuntu or Debian Natro VPS." >&2
  exit 1
fi

prompt_value() {
  local variable="$1" label="$2" default_value="${3:-}" current_value value
  current_value="${!variable:-}"
  if [[ -n "$current_value" ]]; then
    printf -v "$variable" '%s' "$current_value"
    return
  fi
  if [[ -n "$default_value" ]]; then
    read -r -p "$label [$default_value]: " value
    value="${value:-$default_value}"
  else
    while [[ -z "${value:-}" ]]; do read -r -p "$label: " value; done
  fi
  printf -v "$variable" '%s' "$value"
}

prompt_secret() {
  local variable="$1" label="$2" current_value value
  current_value="${!variable:-}"
  if [[ -n "$current_value" ]]; then return; fi
  read -r -s -p "$label (leave blank to configure later): " value
  echo
  printf -v "$variable" '%s' "$value"
}

prompt_optional_secret() {
  local variable="$1" label="$2" current_value value
  current_value="${!variable:-}"
  if [[ -n "$current_value" ]]; then return; fi
  read -r -s -p "$label (leave blank to generate): " value
  echo
  printf -v "$variable" '%s' "$value"
}

install_host_packages() {
  export DEBIAN_FRONTEND=noninteractive
  local memory_mb disk_mb
  memory_mb="$(awk '/MemTotal/ { print int($2 / 1024) }' /proc/meminfo)"
  disk_mb="$(df -Pm / | awk 'NR == 2 { print $2 }')"
  if (( memory_mb < 3500 || disk_mb < 50000 )); then
    echo "This server is too small (${memory_mb} MB RAM, ${disk_mb} MB disk). Use at least 4 GB RAM and 60 GB SSD." >&2
    exit 1
  fi
  apt-get update
  apt-get install -y ca-certificates curl dnsutils fail2ban git gnupg openssl ufw

  if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL "https://download.docker.com/linux/${ID}/gpg" -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
      > /etc/apt/sources.list.d/docker.list
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi

  systemctl enable --now docker fail2ban
  local ssh_port
  ssh_port="$(sshd -T 2>/dev/null | awk '$1 == "port" && !found { print $2; found = 1 }')"
  ssh_port="${ssh_port:-22}"
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow "${ssh_port}/tcp" comment 'SSH'
  ufw allow 80/tcp comment 'HTTP'
  ufw allow 443/tcp comment 'HTTPS'
  ufw allow 443/udp comment 'HTTP3'
  ufw --force enable

  if [[ -n "${SUDO_USER:-}" && "$SUDO_USER" != "root" ]]; then
    usermod -aG docker "$SUDO_USER"
  fi
}

write_environment() {
  prompt_value INNO_API_DOMAIN "API domain" "api.innoder.org"
  prompt_value INNO_ADMIN_DOMAIN "Admin panel domain" "admin.innoder.org"
  prompt_value INNO_SUPER_ADMIN_EMAIL "Initial super admin email"
  prompt_value INNO_SUPER_ADMIN_USERNAME "Initial super admin username" "superadmin"
  prompt_optional_secret INNO_SUPER_ADMIN_PASSWORD "Initial one-time super admin password"
  if [[ -n "$INNO_SUPER_ADMIN_PASSWORD" ]] && {
    (( ${#INNO_SUPER_ADMIN_PASSWORD} < 12 )) ||
    [[ ! "$INNO_SUPER_ADMIN_PASSWORD" =~ [[:lower:]] ]] ||
    [[ ! "$INNO_SUPER_ADMIN_PASSWORD" =~ [[:upper:]] ]] ||
    [[ ! "$INNO_SUPER_ADMIN_PASSWORD" =~ [[:digit:]] ]];
  }; then
    echo "The initial password must have at least 12 characters, upper/lower case and a number." >&2
    exit 1
  fi
  prompt_value INNO_TLS_EMAIL "Let's Encrypt notification email" "$INNO_SUPER_ADMIN_EMAIL"
  prompt_value INNO_SMTP_HOST "SMTP host (enter '-' to configure later)" "-"

  INNO_SMTP_PORT="${INNO_SMTP_PORT:-587}"
  INNO_SMTP_USER="${INNO_SMTP_USER:-}"
  INNO_SMTP_PASSWORD="${INNO_SMTP_PASSWORD:-}"
  if [[ "$INNO_SMTP_HOST" != "-" ]]; then
    prompt_value INNO_SMTP_PORT "SMTP port" "$INNO_SMTP_PORT"
    prompt_value INNO_SMTP_USER "SMTP username"
    prompt_secret INNO_SMTP_PASSWORD "SMTP password"
  else
    INNO_SMTP_HOST=""
  fi

  prompt_value INNO_RCLONE_REMOTE "rclone destination (enter '-' to configure later)" "-"
  INNO_RCLONE_CONFIG="${INNO_RCLONE_CONFIG:-}"
  if [[ "$INNO_RCLONE_REMOTE" != "-" ]]; then
    prompt_value INNO_RCLONE_CONFIG "Existing rclone.conf path"
  else
    INNO_RCLONE_REMOTE=""
  fi
  INNO_ALERT_WEBHOOK_URL="${INNO_ALERT_WEBHOOK_URL:-}"

  local postgres_password jwt_secret backup_password temporary_password rclone_file smtp_password_base64
  postgres_password="$(openssl rand -hex 32)"
  jwt_secret="$(openssl rand -hex 48)"
  backup_password="$(openssl rand -hex 32)"
  temporary_password="${INNO_SUPER_ADMIN_PASSWORD:-Tmp$(openssl rand -hex 10)A9}"
  smtp_password_base64="$(printf '%s' "$INNO_SMTP_PASSWORD" | openssl base64 -A)"
  rclone_file="$DEPLOY_DIR/rclone.conf"
  if [[ -n "$INNO_RCLONE_CONFIG" ]]; then
    install -m 600 "$INNO_RCLONE_CONFIG" "$rclone_file"
  else
    install -m 600 /dev/null "$rclone_file"
  fi

  umask 077
  cat > "$ENV_FILE" <<EOF
COMPOSE_PROJECT_NAME=inno-production
INNO_ENV_FILE=.env
POSTGRES_DB=inno
POSTGRES_USER=inno
POSTGRES_PASSWORD=${postgres_password}
DATABASE_URL=postgres://inno:${postgres_password}@postgres:5432/inno
DATABASE_SSL=false
JWT_SECRET=${jwt_secret}
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=30
FILE_STORAGE_PATH=/data/documents
MAX_FILE_BYTES=20971520
HOST=0.0.0.0
PORT=3000
NODE_ENV=production
API_DOMAIN=${INNO_API_DOMAIN}
ADMIN_DOMAIN=${INNO_ADMIN_DOMAIN}
PUBLIC_API_URL=https://${INNO_API_DOMAIN}
ALLOWED_ORIGINS=https://${INNO_ADMIN_DOMAIN}
SMTP_HOST=${INNO_SMTP_HOST}
SMTP_PORT=${INNO_SMTP_PORT}
SMTP_USER=${INNO_SMTP_USER}
SMTP_PASSWORD=
SMTP_PASSWORD_BASE64=${smtp_password_base64}
SMTP_FROM=${INNO_SMTP_USER:-$INNO_SUPER_ADMIN_EMAIL}
PASSWORD_RESET_URL=https://${INNO_API_DOMAIN}/reset-password
TLS_EMAIL=${INNO_TLS_EMAIL}
BACKUP_ENCRYPTION_PASSWORD=${backup_password}
RCLONE_CONFIG_FILE=${rclone_file}
RCLONE_REMOTE=${INNO_RCLONE_REMOTE}
ALERT_WEBHOOK_URL=${INNO_ALERT_WEBHOOK_URL}
DISK_ALERT_PERCENT=80
SUPER_ADMIN_EMAIL=${INNO_SUPER_ADMIN_EMAIL}
SUPER_ADMIN_USERNAME=${INNO_SUPER_ADMIN_USERNAME}
SUPER_ADMIN_PASSWORD=${temporary_password}
EOF
  chmod 600 "$ENV_FILE" "$rclone_file"
}

env_value() {
  sed -n "s/^${1}=//p" "$ENV_FILE" | tail -n 1
}

check_dns() {
  local public_ip api_domain admin_domain resolved missing=false
  public_ip="${INNO_PUBLIC_IP:-$(curl -4fsS --max-time 10 https://api.ipify.org)}"
  api_domain="$(env_value API_DOMAIN)"
  admin_domain="$(env_value ADMIN_DOMAIN)"
  for domain in "$api_domain" "$admin_domain"; do
    resolved="$(dig +short A "$domain" | tail -n 1)"
    if [[ "$resolved" != "$public_ip" ]]; then
      echo "DNS required: A  $domain  ->  $public_ip" >&2
      missing=true
    fi
  done
  if [[ "$missing" == true ]]; then
    echo "Create these records in Natro DNS, wait for propagation, then run this setup command again." >&2
    exit 2
  fi
}

deploy_stack() {
  cd "$DEPLOY_DIR"
  bash scripts/validate-env.sh "$ENV_FILE"
  docker compose --env-file "$ENV_FILE" -f docker-compose.yml config --quiet
  docker compose --env-file "$ENV_FILE" -f docker-compose.yml build
  docker compose --env-file "$ENV_FILE" -f docker-compose.yml up -d --wait postgres
  docker compose --env-file "$ENV_FILE" -f docker-compose.yml rm -sf migrate >/dev/null 2>&1 || true
  docker compose --env-file "$ENV_FILE" -f docker-compose.yml up \
    --no-deps --force-recreate --abort-on-container-exit --exit-code-from migrate migrate
  docker compose --env-file "$ENV_FILE" -f docker-compose.yml up -d server admin-web proxy backup monitor

  local temporary_password
  temporary_password="$(env_value SUPER_ADMIN_PASSWORD)"
  if [[ -n "$temporary_password" ]]; then
    docker compose --env-file "$ENV_FILE" -f docker-compose.yml run --rm server node dist/scripts/createSuperAdmin.js
    sed -i 's/^SUPER_ADMIN_PASSWORD=.*/SUPER_ADMIN_PASSWORD=/' "$ENV_FILE"
  fi

  for _ in {1..30}; do
    if curl -fsS --max-time 10 "https://$(env_value API_DOMAIN)/health/ready" >/dev/null; then break; fi
    sleep 5
  done
  curl -fsS --max-time 10 "https://$(env_value API_DOMAIN)/health/ready" >/dev/null

  ln -sfn "$SCRIPT_DIR/innoctl" /usr/local/bin/innoctl
  echo
  echo "Natro deployment is ready."
  echo "Admin panel: https://$(env_value ADMIN_DOMAIN)"
  echo "Super admin: $(env_value SUPER_ADMIN_USERNAME)"
  if [[ -n "$temporary_password" ]]; then
    echo "One-time password: $temporary_password"
    echo "This password was removed from .env and must be changed at first login."
  fi
  echo "Operations: innoctl status | backup | logs | update"
}

install_host_packages
if [[ ! -f "$ENV_FILE" ]]; then write_environment; fi
bash "$DEPLOY_DIR/scripts/validate-env.sh" "$ENV_FILE"
if [[ "$SKIP_DNS" != true ]]; then check_dns; fi
deploy_stack
