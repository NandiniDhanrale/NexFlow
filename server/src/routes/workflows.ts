import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  saveWorkflowNodes,
  executeWorkflow,
  getExecutionHistory,
  getDashboardStats,
} from '../controllers/workflowController';
import { createSchedule, deleteSchedule, toggleSchedule } from '../controllers/scheduleController';
import { regenerateWebhookToken } from '../controllers/webhookController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/stats', asyncHandler(getDashboardStats));
router.get('/', asyncHandler(listWorkflows));
router.post('/', asyncHandler(createWorkflow));
router.get('/:id', asyncHandler(getWorkflow));
router.put('/:id', asyncHandler(updateWorkflow));
router.delete('/:id', asyncHandler(deleteWorkflow));
router.post('/:id/nodes', asyncHandler(saveWorkflowNodes));
router.post('/:id/execute', asyncHandler(executeWorkflow));
router.get('/:id/executions', asyncHandler(getExecutionHistory));
router.post('/:id/webhook/regenerate', asyncHandler(regenerateWebhookToken));

router.post('/:workflowId/schedule', asyncHandler(createSchedule));
router.delete('/schedule/:id', asyncHandler(deleteSchedule));
router.put('/schedule/:id/toggle', asyncHandler(toggleSchedule));

export default router;
