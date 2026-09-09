# Project Conventions for BlockX LaAbrah

## Mandatory Build & Release Workflow

Every time changes are made to the project or a build is requested:

1. **Version Bump**:
   - In `app/build.gradle.kts`, increment `versionCode` by 1 and bump `versionName` (e.g. `versionCode = 514`, `versionName = "2.4.314"`).

2. **Git & GitHub Sync**:
   - Commit all changes with a clear commit message.
   - Push to GitHub remote `origin main` (`https://github.com/Yusfkarim/Blockx.git`).

3. **Release Build**:
   - Build both the APK and App Bundle using:
     `gradle :app:assembleRelease :app:bundleRelease`

4. **API Upload (CRITICAL - USER MANDATE)**:
   - Always upload the latest outputs to the files API (`https://yousf3.lovable.app/api/public/files-api/`):
     - Source code archive: `blockx-laabrah-v<VERSION>-source-code.tar.gz`
     - Signed App Bundle: `blockx-laabrah-v<VERSION>-release.aab`
     - Signed Release APK: `blockx-laabrah-v<VERSION>-release.apk`
   - Generate share URLs via `POST https://yousf3.lovable.app/api/public/files-api/<ID>/share`.
   - You can run `node scripts/upload_to_api.js` to automatically perform this.
   - Always display the direct share links to the user.
