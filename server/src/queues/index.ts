import { Server as SocketIOServer } from 'socket.io';
import { workflowQueue } from './workflowQueue';
import { createWorkflowWorker } from './workflowWorker';

let worker: ReturnType<typeof createWorkflowWorker> | null = null;

export function initQueueSystem(io: SocketIOServer): void {
  worker = createWorkflowWorker(io);
  console.log('BullMQ queue system initialized');
}

export { workflowQueue } from './workflowQueue';
