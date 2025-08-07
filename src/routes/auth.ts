import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { registerValidation, loginValidation } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

export default router;
