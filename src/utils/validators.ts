import { body } from 'express-validator';

// User registration validation
export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character ISO code'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be a valid language code')
];

// User login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// User preferences validation
export const validateUserPreferences = [
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character ISO code'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be a valid language code'),
  body('email_notifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('push_notifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  body('weekly_reports')
    .optional()
    .isBoolean()
    .withMessage('Weekly reports must be a boolean'),
  body('budget_alerts')
    .optional()
    .isBoolean()
    .withMessage('Budget alerts must be a boolean')
];

// Transaction validation
export const validateTransaction = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category is required and must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
];

// Category validation
export const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name is required and must be less than 100 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense')
];

// Update transaction validation
export const updateTransactionValidation = [
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date')
];

// Legacy exports for backward compatibility
export const registerValidation = validateRegistration;
export const loginValidation = validateLogin;
export const transactionValidation = validateTransaction;
