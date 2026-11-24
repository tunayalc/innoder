#!/bin/sh
set -eu
umask 077

if [ "$#" -ne 1 ]; then
  echo "Usage: restore.sh /backups/inno-TIMESTAMP.tar.gz.enc" >&2
  exit 1
fi

case "$1" in
  /backups/inno-[0-9]*T[0-9]*Z.tar.gz.enc) ;;
  *) echo "Restore accepts only an Inno backup under /backups." >&2; exit 1 ;;
esac

WORK="$(mktemp -d /tmp/inno-restore.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_PASSWORD -in "$1" -out "$WORK/archive.tar.gz"
tar -C "$WORK" -xzf "$WORK/archive.tar.gz"
tar -tzf "$WORK/documents.tar.gz" >/dev/null
pg_restore --list "$WORK/database.dump" >/dev/null
pg_restore --single-transaction --exit-on-error --clean --if-exists --no-owner --host=postgres --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" "$WORK/database.dump"
mkdir -p /data/documents
find /data/documents -mindepth 1 -delete
tar -C /data -xzf "$WORK/documents.tar.gz"
rm -rf "$WORK"
echo "Restore completed. Run application smoke tests before reopening traffic."
