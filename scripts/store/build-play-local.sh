#!/usr/bin/env bash
set -euo pipefail
umask 077

cd "$(dirname "$0")/../../android"
export INNO_UPLOAD_STORE_FILE="$HOME/Library/Application Support/Inno/Signing/inno-play-upload.p12"
export INNO_UPLOAD_KEY_ALIAS=inno-play-upload
test -s "$INNO_UPLOAD_STORE_FILE" || { printf 'Missing local Play upload keystore.\n' >&2; exit 1; }
INNO_UPLOAD_STORE_PASSWORD="$(security find-generic-password -a "$(id -un)" -s org.innoassociation.mobile.play-upload -w)"
export INNO_UPLOAD_STORE_PASSWORD
export INNO_UPLOAD_KEY_PASSWORD="$INNO_UPLOAD_STORE_PASSWORD"

./gradlew :app:clean :app:bundleRelease -PinnoStoreRelease=true --no-daemon --no-configuration-cache "$@"
release_bundle=app/build/outputs/bundle/release/app-release.aab
if unzip -Z1 "$release_bundle" | grep -Ei '/src_assets_videos_esc(intro|europeanyouthportalguide)\.mp4$' >/dev/null; then
  printf 'Retired training media must not be included in the Play bundle.\n' >&2
  exit 1
fi
verification=$(LC_ALL=C "${JAVA_HOME:+$JAVA_HOME/bin/}jarsigner" -verify "$release_bundle")
grep -Fqx 'jar verified.' <<< "$verification"
printf 'Play bundle signature verified.\n'
