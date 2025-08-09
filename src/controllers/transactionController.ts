import { Response } from 'express';
import { TransactionModel } from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { type, amount, category, description, date } = req.body;
    const userId = req.user!.id;

    const transaction = await TransactionModel.create({
      user_id: userId,
      type,
      amount: parseFloat(amount),
      category,
      description,
      date
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    logger.error('Create transaction error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit, offset } = req.query;

    const transactions = await TransactionModel.findByUserId(
      userId,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );

    res.json({
      success: true,
      data: { transactions }
    });
  } catch (error) {
    logger.error('Get transactions error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const transaction = await TransactionModel.findById(parseInt(id), userId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    logger.error('Get transaction error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    // Convert amount to number if provided
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }

    const transaction = await TransactionModel.update(parseInt(id), userId, updateData);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    logger.error('Update transaction error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const deleted = await TransactionModel.delete(parseInt(id), userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    logger.error('Delete transaction error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteAllTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const deletedCount = await TransactionModel.deleteAllByUserId(userId);

    res.json({
      success: true,
      message: `${deletedCount} transactions deleted successfully`,
      data: { deletedCount }
    });
  } catch (error) {
    logger.error('Delete all transactions error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTransactionStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const stats = await TransactionModel.getStatsByUserId(
      userId,
      startDate as string,
      endDate as string
    );

    // Format stats for easier consumption
    const formattedStats = {
      income: 0,
      expense: 0,
      balance: 0,
      incomeCount: 0,
      expenseCount: 0
    };

    stats.forEach(stat => {
      if (stat.type === 'income') {
        formattedStats.income = parseFloat(stat.total);
        formattedStats.incomeCount = parseInt(stat.count);
      } else if (stat.type === 'expense') {
        formattedStats.expense = parseFloat(stat.total);
        formattedStats.expenseCount = parseInt(stat.count);
      }
    });

    formattedStats.balance = formattedStats.income - formattedStats.expense;

    res.json({
      success: true,
      data: { stats: formattedStats }
    });
  } catch (error) {
    logger.error('Get transaction stats error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
