import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Keep the required Node version local to this project and disable telemetry.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const localNode = path.join(projectRoot, 'node_modules', 'node', 'bin', process.platform === 'win32' ? 'node.exe' : 'node');
const cli = path.join(projectRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');
const child = spawn(localNode, [cli, ...process.argv.slice(2)], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
});
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
