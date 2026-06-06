// apps/api/src/workers/index.ts
import { smsWorker } from './sms.worker';
import { paymentWorker } from './payment.worker';
import { timerWorker } from './timer.worker';
import { logger } from '../utils/logger';

export function initWorkers(): void {
  logger.info('Starting BullMQ workers...');
  // Workers are initialised on import — just reference them to ensure they're alive
  [smsWorker, paymentWorker, timerWorker].forEach((w) => {
    logger.info({ queue: w.name }, `Worker started`);
  });
}

export { smsWorker, paymentWorker, timerWorker };
