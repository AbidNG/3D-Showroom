import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
if ((process.env.ADMIN_PASSWORD || '').length < 14 || !/^[A-Z2-7]{32,64}$/.test(process.env.ADMIN_TOTP_SECRET || '')) {
  console.error('Set ADMIN_PASSWORD (14+ characters) and ADMIN_TOTP_SECRET (Base32 authenticator key) before starting the app.');
  process.exit(1);
}

const api = spawn(process.execPath, [resolve(root, 'server/index.js')], {
  cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: '4175' },
  stdio: 'inherit',
});
let stopping = false;
const viteProcesses = [];
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill('SIGTERM');
  viteProcesses.forEach(process => process.kill('SIGTERM'));
  setTimeout(() => process.exit(code), 250).unref();
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
api.on('error', error => { console.error('Could not start the API server:', error.message); stop(1); });
api.on('exit', code => { if (!stopping) stop(code ?? 1); });

let apiReady = false;
for (let attempt = 0; attempt < 50 && !apiReady && !stopping; attempt += 1) {
  try {
    const response = await fetch('http://127.0.0.1:4175/api/health');
    apiReady = response.ok;
  } catch {}
  if (!apiReady) await new Promise(resolveDelay => setTimeout(resolveDelay, 100));
}
if (!apiReady || stopping) {
  console.error('The API server did not become ready. Check the server output above.');
  stop(1);
} else {
  const startVite = (surface, host, port) => {
    const vite = spawn(process.execPath, [
      resolve(root, 'node_modules/vite/bin/vite.js'),
      '--host', host,
      '--port', String(port),
      '--strictPort',
    ], {
      cwd: root,
      env: { ...process.env, SHOWROOM_SURFACE: surface },
      stdio: 'inherit',
    });
    viteProcesses.push(vite);
    vite.on('error', error => { console.error(`Could not start ${surface} Vite server:`, error.message); stop(1); });
    vite.on('exit', code => { if (!stopping) stop(code ?? 1); });
  };

  startVite('public', 'localhost', 5173);
  startVite('admin', '127.0.0.1', 5174);
  console.log('Public showroom: http://localhost:5173');
  console.log('Admin dashboard: http://127.0.0.1:5174/admin.html');
}
