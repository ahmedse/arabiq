/**
 * Strapi develop wrapper that ensures content-type schemas are copied to dist
 * after TypeScript compilation but before Strapi loads.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_API = path.join(ROOT, 'src', 'api');
const DIST_API = path.join(ROOT, 'dist', 'src', 'api');

function copyDirSync(src, dest) {
  try {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  } catch (e) {
    // Ignore errors during copy (directory might be deleted during Strapi clean)
  }
}

function copySchemas() {
  if (!fs.existsSync(DIST_API)) return 0;
  
  let count = 0;
  try {
    for (const api of fs.readdirSync(SRC_API)) {
      const srcCT = path.join(SRC_API, api, 'content-types');
      if (!fs.existsSync(srcCT)) continue;
      
      const destCT = path.join(DIST_API, api, 'content-types');
      copyDirSync(srcCT, destCT);
      count++;
    }
  } catch (e) {
    // Ignore errors (dist might be cleaned)
  }
  return count;
}

// Track state to reduce noise
let initialCopyDone = false;

function startPolling() {
  const checkAndCopy = () => {
    try {
      if (fs.existsSync(DIST_API)) {
        const count = copySchemas();
        if (count > 0 && !initialCopyDone) {
          console.log(`[schemas] ✅ Synced ${count} content-types`);
          initialCopyDone = true;
        }
      }
    } catch (e) {
      // Ignore all errors - dist might be in flux
    }
  };
  
  // Poll every 50ms during startup for 60 seconds
  const interval = setInterval(() => {
    checkAndCopy();
  }, 50);
  
  // After 60 seconds, slow down to every 2 seconds
  setTimeout(() => {
    clearInterval(interval);
    setInterval(checkAndCopy, 2000);
  }, 60000);
}

// Start polling immediately
startPolling();

// Start Strapi
const strapi = spawn('npx', ['strapi', 'develop', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  cwd: ROOT,
  env: { ...process.env }
});

strapi.on('close', (code) => {
  process.exit(code || 0);
});

strapi.on('error', (err) => {
  console.error('Failed to start Strapi:', err);
  process.exit(1);
});
