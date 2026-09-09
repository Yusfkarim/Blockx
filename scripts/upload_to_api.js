#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const gradleFile = fs.readFileSync(path.join(rootDir, 'app/build.gradle.kts'), 'utf8');
  const match = gradleFile.match(/versionName\s*=\s*"([^"]+)"/);
  const version = match ? match[1] : '2.4.313';

  console.log(`=== Uploading BlockX LaAbrah v${version} to API ===`);

  const tmpDir = '/tmp';
  const srcTarPath = path.join(tmpDir, `blockx-laabrah-v${version}-source-code.tar.gz`);
  const aabSrc = path.join(rootDir, 'app/build/outputs/bundle/release/app-release.aab');
  const apkSrc = path.join(rootDir, 'app/build/outputs/apk/release/app-release.apk');
  const aabDest = path.join(tmpDir, `blockx-laabrah-v${version}-release.aab`);
  const apkDest = path.join(tmpDir, `blockx-laabrah-v${version}-release.apk`);

  console.log('1. Creating source code tar.gz...');
  execSync(`tar --exclude='./.git' --exclude='./.gradle' --exclude='./build' --exclude='./app/build' --exclude='./.build-outputs' --exclude='*.tar.gz' -czf "${srcTarPath}" .`, { cwd: rootDir });

  console.log('2. Copying binaries...');
  if (fs.existsSync(aabSrc)) fs.copyFileSync(aabSrc, aabDest);
  if (fs.existsSync(apkSrc)) fs.copyFileSync(apkSrc, apkDest);

  async function uploadAndShare(filePath) {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return null;
    }
    const fileName = path.basename(filePath);
    console.log(`Uploading ${fileName}...`);
    const fileBlob = new Blob([fs.readFileSync(filePath)]);
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);

    const uploadRes = await fetch('https://yousf3.lovable.app/api/public/files-api/upload', {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadData || !uploadData.id) {
      throw new Error(`Failed to upload ${fileName}: ` + JSON.stringify(uploadData));
    }

    const shareRes = await fetch(`https://yousf3.lovable.app/api/public/files-api/${uploadData.id}/share`, {
      method: 'POST',
    });
    const shareData = await shareRes.json();
    return {
      fileName,
      id: uploadData.id,
      shareUrl: shareData.share_url,
    };
  }

  const results = [];
  results.push(await uploadAndShare(srcTarPath));
  if (fs.existsSync(aabDest)) results.push(await uploadAndShare(aabDest));
  if (fs.existsSync(apkDest)) results.push(await uploadAndShare(apkDest));

  // Cleanup tmp
  try {
    fs.unlinkSync(srcTarPath);
    if (fs.existsSync(aabDest)) fs.unlinkSync(aabDest);
    if (fs.existsSync(apkDest)) fs.unlinkSync(apkDest);
  } catch (e) {}

  console.log('\n=== Upload Complete ===');
  for (const r of results) {
    if (r) console.log(`${r.fileName}: ${r.shareUrl}`);
  }
}

main().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
