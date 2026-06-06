// apps/api/src/utils/logger.ts
import winston from 'winston';
import { env } from '../config/env';

const formats = [
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  env.NODE_ENV === 'development'
    ? winston.format.colorize()
    : winston.format.json(),
  env.NODE_ENV === 'development'
    ? winston.format.simple()
    : winston.format.json(),
];

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(...formats),
  defaultMeta: { service: 'trustescrow-api', env: env.NODE_ENV },
  transports: [new winston.transports.Console()],
});

// Add Axiom transport in production if configured
if (env.NODE_ENV === 'production' && env.AXIOM_TOKEN) {
  // Axiom transport via HTTP (no additional package needed)
  logger.add(
    new winston.transports.Http({
      host: 'api.axiom.co',
      path: `/v1/datasets/${env.AXIOM_DATASET}/ingest`,
      ssl: true,
      headers: {
        Authorization: `Bearer ${env.AXIOM_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
  );
}
