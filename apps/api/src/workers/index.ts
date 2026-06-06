import { logger } from '../utils/logger';
import { redisAvailable } from '../redis/client';

let workersStarted = false;

/**
 * BullMQ workers should never block API boot.
 * When Redis is unavailable we skip them entirely and let the API start.
 */
export async function initWorkers(): Promise<void> {
  if (workersStarted) {
    return;
  }

  if (!redisAvailable) {
    logger.warn('Redis unavailable — background workers disabled for this deployment');
    workersStarted = true;
    return;
  }

  try {
    const [{ smsWorker }, { paymentWorker }, { timerWorker }] = await Promise.all([
      import('./sms.worker'),
      import('./payment.worker'),
      import('./timer.worker'),
    ]);

    [smsWorker, paymentWorker, timerWorker].forEach((worker) => {
      logger.info({ queue: worker.name }, 'Worker started');
    });

    workersStarted = true;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize background workers');
  }
}
