#!/bin/sh
set -eu
umask 077

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="$(mktemp -d /tmp/inno-backup.XXXXXX)"
ARCHIVE="/backups/inno-${STAMP}.tar.gz.enc"
trap 'rm -rf "$WORK"; rm -f "$ARCHIVE.partial"' EXIT

# Do not restore a previously withdrawn health consent from an older snapshot.
pg_dump --host=postgres --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom \
  --exclude-table-data=public.application_blood_groups --file="$WORK/database.dump"
tar -C /data -czf "$WORK/documents.tar.gz" documents
tar -C "$WORK" -czf "$WORK/archive.tar.gz" database.dump documents.tar.gz
openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_ENCRYPTION_PASSWORD -in "$WORK/archive.tar.gz" -out "$ARCHIVE.partial"
chmod 600 "$ARCHIVE.partial"
mv "$ARCHIVE.partial" "$ARCHIVE"

find /backups -type f -name 'inno-*.tar.gz.enc' -mtime +30 -delete
if [ -n "${RCLONE_REMOTE:-}" ]; then
  rclone copy "$ARCHIVE" "$RCLONE_REMOTE" --retries 3
  printf '%s\n' "${ARCHIVE##*/}" > "$WORK/uploaded-file"
  rclone check /backups "$RCLONE_REMOTE" --one-way --download --files-from-raw "$WORK/uploaded-file"
  touch /backups/.last-offsite-success
fi
printf 'Backup created: %s\n' "$ARCHIVE"
