import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updatePreferences, 
  updateProfile,
  refreshToken, 
  logout, 
  getActiveSessions 
} from '../controllers/authController';
import { validateRegistration, validateLogin, validateUserPreferences } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// Validation for refresh token
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Validation for profile update
const validateProfileUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefreshToken, refreshToken);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);
router.put('/preferences', authenticateToken, validateUserPreferences, updatePreferences);
router.post('/logout', authenticateToken, logout);
router.get('/sessions', authenticateToken, getActiveSessions);

export default router;
