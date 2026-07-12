/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '..');
const distDir = path.join(clientDir, 'dist');
const serverPublicDir = path.join(clientDir, '..', 'fuelstats-server', 'src', 'public');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      // Keep uploads folder to avoid deleting uploaded user media/photos
      if (file === 'uploads') return;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    // Don't delete the root public directory itself
    if (directoryPath !== serverPublicDir) {
      fs.rmdirSync(directoryPath);
    }
  }
}

function copyFolderRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  fs.readdirSync(src).forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

try {
  console.log('Building frontend with relative API path...');
  // Force VITE_API env variable for relative API routing
  execSync('npm run build', {
    cwd: clientDir,
    env: { ...process.env, VITE_API: '/api/v1' },
    stdio: 'inherit',
  });

  console.log('Cleaning backend public directory...');
  deleteFolderRecursive(serverPublicDir);

  console.log('Copying build artifacts to backend public...');
  copyFolderRecursive(distDir, serverPublicDir);

  console.log('Frontend embedded successfully!');
} catch (error) {
  console.error('Embedding failed:', error.message);
  process.exit(1);
}
