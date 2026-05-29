import cron from 'node-cron';
import { prisma } from '../config/database';
import { workflowQueue } from '../queues/workflowQueue';

const scheduledTasks = new Map<string, cron.ScheduledTask>();

export async function loadSchedules(): Promise<void> {
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
    include: { workflow: { select: { status: true } } },
  });

  for (const schedule of schedules) {
    if (schedule.workflow.status === 'inactive') continue;

    scheduleWorkflow(schedule.workflowId, schedule.cronExpression);
  }

  console.log(`Loaded ${schedules.length} schedules`);
}

export function scheduleWorkflow(workflowId: string, cronExpression: string): void {
  unscheduleWorkflow(workflowId);

  if (!cron.validate(cronExpression)) {
    console.error(`Invalid cron expression for workflow ${workflowId}: ${cronExpression}`);
    return;
  }

  const task = cron.schedule(cronExpression, async () => {
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { nodes: true },
      });

      if (!workflow || workflow.status === 'inactive' || !workflow.nodes.length) {
        return;
      }

      const execution = await prisma.execution.create({
        data: {
          workflowId,
          status: 'queued',
          triggerData: { triggeredBy: 'schedule', timestamp: new Date().toISOString() },
          triggeredBy: 'schedule',
        },
      });

      await workflowQueue.add('execute-workflow', {
        executionId: execution.id,
        workflowId,
      });

      await prisma.schedule.updateMany({
        where: { workflowId, isActive: true },
        data: { lastRunAt: new Date(), nextRunAt: new Date(Date.now() + 60000) },
      });
    } catch (error) {
      console.error(`Scheduled execution failed for workflow ${workflowId}:`, error);
    }
  });

  scheduledTasks.set(workflowId, task);
}

export function unscheduleWorkflow(workflowId: string): void {
  const task = scheduledTasks.get(workflowId);
  if (task) {
    task.stop();
    scheduledTasks.delete(workflowId);
  }
}
