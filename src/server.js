import './config/env.js'; // validate env at startup
import app from './app.js';
import { env } from './config/env.js';
import logger from './logger/logger.js';

// Required export for Vercel serverless runtime
export default app;

// Only bind HTTP server in local development
if (!process.env.VERCEL) {
  const PORT = env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}
