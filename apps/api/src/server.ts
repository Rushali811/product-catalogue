import { buildApp } from './app.js';
import { loadConfig } from './config.js';

async function main() {
  const config = loadConfig();
  const app = await buildApp({ config, logger: true });
  try {
    await app.listen({ port: config.server.port, host: config.server.host });
    app.log.info(`API listening on http://${config.server.host}:${config.server.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
