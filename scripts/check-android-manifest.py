"""Validate the merged APK manifest, including permissions contributed by SDKs."""
import sys
import xml.etree.ElementTree as ET

ANDROID = "{http://schemas.android.com/apk/res/android}"
FORBIDDEN = {
    "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "MANAGE_EXTERNAL_STORAGE",
    "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "RECORD_AUDIO", "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION", "READ_CONTACTS", "QUERY_ALL_PACKAGES",
}


def validate(xml):
    root = ET.fromstring(xml)
    errors = []
    if root.get("package") != "org.innoassociation.mobile":
        errors.append("Unexpected application ID")
    sdk = root.find("uses-sdk")
    if sdk is None or int(sdk.get(ANDROID + "targetSdkVersion", "0")) < 36:
        errors.append("Target API must be at least 36")
    app = root.find("application")
    if app is None:
        return errors + ["Missing application"]
    for key in ["debuggable", "usesCleartextTraffic", "allowBackup"]:
        # debuggable defaults to false; the other two must be explicit.
        default = "false" if key == "debuggable" else ""
        if app.get(ANDROID + key, default) != "false":
            errors.append(f"Release {key} must be false")
    for permission in root.findall("uses-permission"):
        name = permission.get(ANDROID + "name", "").removeprefix("android.permission.")
        if name in FORBIDDEN:
            errors.append(f"Unnecessary permission: {name}")
    cameras = root.findall("uses-feature")
    if not any(f.get(ANDROID + "name") == "android.hardware.camera" and
               f.get(ANDROID + "required") == "false" for f in cameras):
        errors.append("Camera must be optional; file selection works without it")
    seen = set()
    for provider in app.findall("provider"):
        for authority in provider.get(ANDROID + "authorities", "").split(";"):
            if authority in seen:
                errors.append(f"Duplicate file provider authority: {authority}")
            seen.add(authority)
        if provider.get(ANDROID + "exported") != "false":
            errors.append("Content providers must not be public")
    queries = {d.get(ANDROID + "mimeType") for d in root.findall("queries/intent/data")}
    if not {"application/pdf", "image/jpeg", "image/png"}.issubset(queries):
        errors.append("Document viewers must be discoverable")
    return errors


if __name__ == "__main__":
    failures = validate(sys.stdin.read())
    if failures:
        raise SystemExit("\n".join(failures))
    print("Merged release manifest: API, privacy, providers and viewers verified.")
