import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("manifest", Path(__file__).with_name("check-android-manifest.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
VALID = '''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="org.innoassociation.mobile">
<uses-sdk android:targetSdkVersion="36"/>
<uses-feature android:name="android.hardware.camera" android:required="false"/>
<queries><intent><data android:mimeType="application/pdf"/></intent><intent><data android:mimeType="image/jpeg"/></intent><intent><data android:mimeType="image/png"/></intent></queries>
<application android:usesCleartextTraffic="false" android:allowBackup="false">
<provider android:authorities="private.files" android:exported="false"/>
</application></manifest>'''


class ReleaseManifestTest(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(module.validate(VALID), [])

    def test_duplicate_provider(self):
        self.assertTrue(module.validate(VALID.replace('</application>', '<provider android:authorities="private.files" android:exported="false"/></application>')))

    def test_library_permission(self):
        self.assertTrue(module.validate(VALID.replace('<uses-sdk', '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/><uses-sdk')))

    def test_debuggable(self):
        self.assertTrue(module.validate(VALID.replace('<application ', '<application android:debuggable="true" ')))

    def test_cleartext(self):
        self.assertTrue(module.validate(VALID.replace('usesCleartextTraffic="false"', 'usesCleartextTraffic="true"')))

    def test_old_api(self):
        self.assertTrue(module.validate(VALID.replace('targetSdkVersion="36"', 'targetSdkVersion="35"')))

    def test_camera_required(self):
        self.assertTrue(module.validate(VALID.replace('required="false"', 'required="true"')))

    def test_wrong_id(self):
        self.assertTrue(module.validate(VALID.replace('org.innoassociation.mobile', 'com.example.demo')))

    def test_public_provider(self):
        self.assertTrue(module.validate(VALID.replace('exported="false"', 'exported="true"')))

    def test_missing_pdf_viewer_query(self):
        self.assertTrue(module.validate(VALID.replace('application/pdf', 'text/plain')))
