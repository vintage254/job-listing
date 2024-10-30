import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const proxyServer = spawn('node', [join(__dirname, 'proxy-server.js')], {
  stdio: 'inherit',
  env: process.env
});

proxyServer.on('error', (err) => {
  console.error('Failed to start proxy server:', err);
});

process.on('SIGINT', () => {
  proxyServer.kill();
  process.exit();
}); 