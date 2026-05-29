import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { scheduleWorkflow, unscheduleWorkflow } from '../scheduler';

export async function createSchedule(req: Request, res: Response): Promise<void> {
  const { workflowId } = req.params;
  const { cronExpression } = req.body;

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId: req.user!.userId },
  });

  if (!workflow) {
    throw new AppError(404, 'Workflow not found');
  }

  if (!/^(\S+\s){4}\S+$/.test(cronExpression)) {
    throw new AppError(400, 'Invalid cron expression');
  }

  const existing = await prisma.schedule.findFirst({
    where: { workflowId, isActive: true },
  });

  if (existing) {
    await prisma.schedule.update({
      where: { id: existing.id },
      data: { cronExpression },
    });
    scheduleWorkflow(workflowId, cronExpression);
    res.json({ ...existing, cronExpression });
    return;
  }

  const schedule = await prisma.schedule.create({
    data: {
      workflowId,
      cronExpression,
      nextRunAt: calculateNextRun(cronExpression),
    },
  });

  scheduleWorkflow(workflowId, cronExpression);
  res.status(201).json(schedule);
}

export async function deleteSchedule(req: Request, res: Response): Promise<void> {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: req.params.id,
      workflow: { userId: req.user!.userId },
    },
  });

  if (!schedule) {
    throw new AppError(404, 'Schedule not found');
  }

  unscheduleWorkflow(schedule.workflowId);
  await prisma.schedule.delete({ where: { id: req.params.id } });

  res.status(204).send();
}

export async function toggleSchedule(req: Request, res: Response): Promise<void> {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: req.params.id,
      workflow: { userId: req.user!.userId },
    },
  });

  if (!schedule) {
    throw new AppError(404, 'Schedule not found');
  }

  const updated = await prisma.schedule.update({
    where: { id: req.params.id },
    data: { isActive: !schedule.isActive },
  });

  if (updated.isActive) {
    scheduleWorkflow(schedule.workflowId, schedule.cronExpression);
  } else {
    unscheduleWorkflow(schedule.workflowId);
  }

  res.json(updated);
}

function calculateNextRun(cronExpression: string): Date {
  const cron = require('node-cron');
  const task = cron.schedule(cronExpression, () => {});
  task.stop();
  return new Date(Date.now() + 60000);
}
