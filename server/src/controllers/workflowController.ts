import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { workflowQueue } from '../queues/workflowQueue';

export async function listWorkflows(req: Request, res: Response): Promise<void> {
  const workflows = await prisma.workflow.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { executions: true } },
      schedules: { select: { cronExpression: true, isActive: true } },
    },
  });

  res.json(workflows);
}

export async function getWorkflow(req: Request, res: Response): Promise<void> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: {
      nodes: { orderBy: { id: 'asc' } },
      edges: true,
      schedules: true,
    },
  });

  if (!workflow) {
    throw new AppError(404, 'Workflow not found');
  }

  res.json(workflow);
}

export async function createWorkflow(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new AppError(400, 'Workflow name is required');
  }

  const workflow = await prisma.workflow.create({
    data: {
      name: name.trim(),
      description,
      userId: req.user!.userId,
      webhookToken: uuidv4(),
    },
  });

  res.status(201).json(workflow);
}

export async function updateWorkflow(req: Request, res: Response): Promise<void> {
  const existing = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!existing) {
    throw new AppError(404, 'Workflow not found');
  }

  const { name, description, status } = req.body;

  const workflow = await prisma.workflow.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
    },
  });

  res.json(workflow);
}

export async function deleteWorkflow(req: Request, res: Response): Promise<void> {
  const existing = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!existing) {
    throw new AppError(404, 'Workflow not found');
  }

  await prisma.workflow.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function saveWorkflowNodes(req: Request, res: Response): Promise<void> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!workflow) {
    throw new AppError(404, 'Workflow not found');
  }

  const { nodes, edges } = req.body;

  await prisma.$transaction(async (tx) => {
    await tx.workflowNode.deleteMany({ where: { workflowId: req.params.id } });
    await tx.workflowEdge.deleteMany({ where: { workflowId: req.params.id } });

    if (nodes?.length) {
      await tx.workflowNode.createMany({
        data: nodes.map((n: any) => ({
          id: n.id,
          workflowId: req.params.id,
          type: n.type,
          positionX: n.position?.x || 0,
          positionY: n.position?.y || 0,
          config: n.data?.config || {},
        })),
      });
    }

    if (edges?.length) {
      await tx.workflowEdge.createMany({
        data: edges.map((e: any) => ({
          id: e.id,
          workflowId: req.params.id,
          sourceNode: e.source,
          targetNode: e.target,
          conditionLabel: e.data?.label || null,
        })),
      });
    }
  });

  res.json({ message: 'Workflow saved' });
}

export async function executeWorkflow(req: Request, res: Response): Promise<void> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: { nodes: true, edges: true },
  });

  if (!workflow) {
    throw new AppError(404, 'Workflow not found');
  }

  if (!workflow.nodes.length) {
    throw new AppError(400, 'Workflow has no nodes');
  }

  const execution = await prisma.execution.create({
    data: {
      workflowId: workflow.id,
      status: 'queued',
      triggerData: req.body || {},
      triggeredBy: 'manual',
    },
  });

  await workflowQueue.add('execute-workflow', {
    executionId: execution.id,
    workflowId: workflow.id,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });

  res.json({ executionId: execution.id, status: 'queued' });
}

export async function getExecutionHistory(req: Request, res: Response): Promise<void> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });

  if (!workflow) {
    throw new AppError(404, 'Workflow not found');
  }

  const executions = await prisma.execution.findMany({
    where: { workflowId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { _count: { select: { logs: true } } },
  });

  res.json(executions);
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const [totalWorkflows, totalExecutions, recentExecutions] = await Promise.all([
    prisma.workflow.count({ where: { userId } }),
    prisma.execution.count({
      where: {
        workflow: { userId },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.execution.findMany({
      where: { workflow: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { workflow: { select: { name: true } } },
    }),
  ]);

  const successCount = await prisma.execution.count({
    where: {
      workflow: { userId },
      status: 'completed',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const failureCount = await prisma.execution.count({
    where: {
      workflow: { userId },
      status: 'failed',
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const todayTotal = successCount + failureCount;
  const successRate = todayTotal > 0 ? Math.round((successCount / todayTotal) * 100) : 100;

  res.json({
    totalWorkflows,
    executionsToday: todayTotal,
    successRate,
    failures: failureCount,
    recentExecutions,
  });
}
