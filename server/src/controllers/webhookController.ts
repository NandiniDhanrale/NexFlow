import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { workflowQueue } from '../queues/workflowQueue';

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const { token } = req.params;

  const workflow = await prisma.workflow.findUnique({
    where: { webhookToken: token },
    include: { nodes: true, edges: true },
  });

  if (!workflow) {
    throw new AppError(404, 'Invalid webhook token');
  }

  if (workflow.status === 'inactive') {
    throw new AppError(400, 'Workflow is inactive');
  }

  if (!workflow.nodes.length) {
    throw new AppError(400, 'Workflow has no nodes');
  }

  const execution = await prisma.execution.create({
    data: {
      workflowId: workflow.id,
      status: 'queued',
      triggerData: req.body,
      triggeredBy: 'webhook',
    },
  });

  await workflowQueue.add('execute-workflow', {
    executionId: execution.id,
    workflowId: workflow.id,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });

  res.json({ success: true, executionId: execution.id });
}

export async function regenerateWebhookToken(req: Request, res: Response): Promise<void> {
  const { v4: uuidv4 } = await import('uuid');

  const workflow = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!workflow) {
    throw new AppError(404, 'Workflow not found');
  }

  const updated = await prisma.workflow.update({
    where: { id: req.params.id },
    data: { webhookToken: uuidv4() },
  });

  res.json({ webhookToken: updated.webhookToken });
}
