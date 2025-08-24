import 'dotenv/config';

import { CompositionRoot } from './composition-root';

async function bootstrap() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    const compositionRoot = new CompositionRoot(process.env.DATABASE_URL);

    const app = compositionRoot.createAndBindControllers();
    const { httpServer, logger } = app;

    const port = Number(process.env.PORT) || 3333;

    await httpServer.setupSwagger();
    await httpServer.listen(port);

    logger.info(`🚀 Server is running on http://localhost:${port}`);
    logger.info(`📚 Docs are available at http://localhost:${port}/docs`);
  } catch (error) {
    console.error('❌ Failed to start the server', error);
    process.exit(1);
  }
}

bootstrap();
