import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getExecution, listExecutions } from '../controllers/executionController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listExecutions));
router.get('/:id', asyncHandler(getExecution));

export default router;
