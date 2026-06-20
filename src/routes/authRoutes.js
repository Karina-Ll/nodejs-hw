import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
} from '../controllers/authController.js';
import {
  registerUserSchema,
  loginUserSchema,
} from '../validations/authValidation.js';
import { validateBody } from '../middleware/validateBody.js';

const router = Router();

router.post('/auth/register', (req, res, next) => {
  console.log('REGISTER ROUTE HIT', req.body);
  next();
}, validateBody(registerUserSchema), registerUser);

router.post('/auth/login', validateBody(loginUserSchema), loginUser);
router.post('/auth/refresh', refreshUserSession);
router.post('/auth/logout', logoutUser);

export default router;