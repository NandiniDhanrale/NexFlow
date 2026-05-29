import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export async function getExecution(req: Request, res: Response): Promise<void> {
  const execution = await prisma.execution.findFirst({
    where: {
      id: req.params.id,
      workflow: { userId: req.user!.userId },
    },
    include: {
      logs: { orderBy: { timestamp: 'asc' } },
      workflow: { select: { name: true, id: true } },
    },
  });

  if (!execution) {
    throw new AppError(404, 'Execution not found');
  }

  res.json(execution);
}

export async function listExecutions(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  const where: any = {
    workflow: { userId: req.user!.userId },
  };

  if (status) {
    where.status = status;
  }

  const [executions, total] = await Promise.all([
    prisma.execution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        workflow: { select: { name: true, id: true } },
        _count: { select: { logs: true } },
      },
    }),
    prisma.execution.count({ where }),
  ]);

  res.json({
    data: executions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
