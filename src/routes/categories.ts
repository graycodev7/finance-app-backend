import { Router } from 'express';
import { 
  getCategories, 
  getDefaultCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController';
import { validateCategory } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route - no authentication required
router.get('/defaults', getDefaultCategories);

// Protected routes - authentication required
router.get('/', authenticateToken, getCategories);
router.post('/', authenticateToken, validateCategory, createCategory);
router.put('/:id', authenticateToken, validateCategory, updateCategory);
router.delete('/:id', authenticateToken, deleteCategory);

export default router;
