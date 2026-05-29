import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export const workflowQueue = new Queue('workflow-execution', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});
