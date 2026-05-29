import { Worker, Job } from 'bullmq';
import { Server as SocketIOServer } from 'socket.io';
import { redis } from '../config/redis';
import { executeWorkflow } from '../services/executionEngine';
import { prisma } from '../config/database';

export function createWorkflowWorker(io: SocketIOServer): Worker {
  const worker = new Worker(
    'workflow-execution',
    async (job: Job) => {
      const { executionId, workflowId } = job.data;
      console.log(`[Worker] Processing execution ${executionId} for workflow ${workflowId}`);

      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { nodes: true, edges: true },
      });

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const execution = await prisma.execution.findUnique({
        where: { id: executionId },
      });

      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      await prisma.execution.update({
        where: { id: executionId },
        data: { status: 'running', startedAt: new Date() },
      });

      io.to(`execution:${executionId}`).emit('execution_started', {
        executionId,
        workflowId,
        timestamp: new Date().toISOString(),
      });

      const result = await executeWorkflow(
        workflow,
        execution.triggerData || {},
        executionId,
        io
      );

      const completedAt = new Date();
      const executionTime = execution.startedAt
        ? Math.floor((completedAt.getTime() - execution.startedAt.getTime()) / 1000)
        : 0;

      if (result.success) {
        await prisma.execution.update({
          where: { id: executionId },
          data: {
            status: 'completed',
            outputData: result.output,
            completedAt,
            executionTime,
          },
        });

        io.to(`execution:${executionId}`).emit('execution_completed', {
          executionId,
          output: result.output,
          executionTime,
          timestamp: completedAt.toISOString(),
        });
      } else {
        await prisma.execution.update({
          where: { id: executionId },
          data: {
            status: 'failed',
            outputData: { error: result.error },
            completedAt,
            executionTime,
          },
        });

        io.to(`execution:${executionId}`).emit('execution_failed', {
          executionId,
          error: result.error,
          timestamp: completedAt.toISOString(),
        });
      }

      return result;
    },
    {
      connection: redis,
      concurrency: 10,
      lockDuration: 60000,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
