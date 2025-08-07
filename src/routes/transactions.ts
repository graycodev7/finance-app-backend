import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats
} from '../controllers/transactionController';
import { transactionValidation, updateTransactionValidation } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All transaction routes require authentication
router.use(authenticateToken);

// Transaction CRUD routes
router.post('/', transactionValidation, createTransaction);
router.get('/', getTransactions);
router.get('/stats', getTransactionStats);
router.get('/:id', getTransaction);
router.put('/:id', updateTransactionValidation, updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
