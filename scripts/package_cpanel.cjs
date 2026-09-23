const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const apiDir = path.join(root, 'api');
const targetDeployDir = path.join(root, 'cpanel_deploy');

console.log('Preparing cPanel deployment package...');

// 1. Ensure fresh cpanel_deploy directory
if (fs.existsSync(targetDeployDir)) {
  fs.rmSync(targetDeployDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDeployDir, { recursive: true });

// 2. Copy dist/* into cpanel_deploy/
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, targetDeployDir);
console.log('✓ Copied compiled frontend from dist/ to cpanel_deploy/');

// 3. Copy api/ into cpanel_deploy/api/
const deployApiDir = path.join(targetDeployDir, 'api');
copyDir(apiDir, deployApiDir);
console.log('✓ Copied PHP API backend to cpanel_deploy/api/');

// Clean any node_modules, temp files, or security risks from deployApiDir
const sensitiveFilesToDelete = [
  path.join(deployApiDir, 'database', 'init.php'), // Crucial: Remove database init script from production
  path.join(deployApiDir, 'database', 'seed.sql'),
  path.join(deployApiDir, 'database', 'seed_data.sql'),
  path.join(deployApiDir, 'database', 'seed_data.json'),
  path.join(deployApiDir, 'test_img.png'),
  path.join(deployApiDir, 'test_upload.php'),
  path.join(deployApiDir, '.env'),
  path.join(deployApiDir, 'server_router.php') // Only needed for local PHP dev server
];

for (const filePath of sensitiveFilesToDelete) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✓ Excluded sensitive/dev file from production package: ${path.basename(filePath)}`);
  }
}

// 4. Create ZIP package using PowerShell Compress-Archive
const zipPath = path.join(root, 'gangchill-cpanel-ready.zip');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

console.log('Compressing cpanel_deploy into gangchill-cpanel-ready.zip...');
execSync(`powershell -Command "Compress-Archive -Path '${targetDeployDir}\\*' -DestinationPath '${zipPath}' -Force"`);

console.log(`\n🎉 cPanel Deployment Package Ready: ${zipPath}`);
const stats = fs.statSync(zipPath);
console.log(`Package Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
