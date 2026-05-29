import { Router } from 'express';
import { handleWebhook } from '../controllers/webhookController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/:token', asyncHandler(handleWebhook));

export default router;
