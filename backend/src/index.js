import { app } from './app.js';
import { config } from './config/env.js';
import { prisma } from './db/prisma.js';

const server = app.listen(config.port, () => {
  console.log(`Retail POS API listening on http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}; closing the API.`);
  server.close(async (error) => {
    if (error) {
      console.error('Failed to close the API server:', error);
      process.exitCode = 1;
    }
    await prisma.$disconnect();
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(signal));
}
