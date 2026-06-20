import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';
import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';
import { validateBody } from '../middleware/validateBody.js';

const router = Router();

router.post('/auth/register', validateBody(registerUserSchema), registerUser);
router.post('/auth/login', validateBody(loginUserSchema), loginUser);
router.post('/auth/refresh', refreshUserSession);
router.post('/auth/logout', logoutUser);
router.post('/auth/request-reset-email', validateBody(requestResetEmailSchema), requestResetEmail);
router.post('/auth/reset-password', validateBody(resetPasswordSchema), resetPassword);

export default router;