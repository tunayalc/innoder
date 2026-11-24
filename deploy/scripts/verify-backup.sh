#!/bin/sh
set -eu
umask 077

if [ "${ISOLATED_RESTORE_CHECK:-}" != 1 ] || [ "$#" -ne 1 ]; then
  echo "Run only inside a disposable, network-isolated PostgreSQL container with ISOLATED_RESTORE_CHECK=1." >&2
  exit 1
fi
case "$1" in
  /backups/inno-[0-9]*T[0-9]*Z.tar.gz.enc) ;;
  *) echo "Expected an encrypted Inno backup under /backups." >&2; exit 1 ;;
esac

WORK="$(mktemp -d /tmp/inno-backup-check.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_PASSWORD -in "$1" -out "$WORK/archive.tar.gz"
tar -C "$WORK" -xzf "$WORK/archive.tar.gz"
pg_restore --single-transaction --exit-on-error --clean --if-exists --no-owner \
  --host=/var/run/postgresql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" "$WORK/database.dump"
mkdir "$WORK/files"
tar -C "$WORK/files" -xzf "$WORK/documents.tar.gz"
query() { psql --host=/var/run/postgresql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" -v ON_ERROR_STOP=1 -At -c "$1"; }
query 'SELECT storage_path FROM documents' > "$WORK/paths"
if [ "$(query "SELECT to_regclass('public.program_templates') IS NOT NULL")" = t ]; then
  query 'SELECT storage_path FROM program_templates' >> "$WORK/paths"
fi
files=0
while IFS= read -r path; do
  if [ ! -f "$WORK/files/documents/$path" ]; then
    echo "Backup contains a database reference without its document file." >&2
    exit 1
  fi
  files=$((files + 1))
done < "$WORK/paths"
printf 'Verified isolated restore: users=%s applications=%s documents=%s referenced_files=%s\n' \
  "$(query 'SELECT count(*) FROM users')" "$(query 'SELECT count(*) FROM applications')" \
  "$(query 'SELECT count(*) FROM documents')" "$files"
