import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const envFile = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
const { createApp } = await import('./server/app.js');
const app = createApp();
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
const server = app.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ event: 'server_ready', port, release: '0.1.0' })));
server.requestTimeout = 90000;
server.headersTimeout = 95000;
for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
});
