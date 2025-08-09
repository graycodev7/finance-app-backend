import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let categories;
    if (type && (type === 'income' || type === 'expense')) {
      categories = await CategoryModel.getByUserIdAndType(userId, type);
    } else {
      categories = await CategoryModel.getByUserId(userId);
    }

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    logger.error('Get categories error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getDefaultCategories = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryModel.getDefaults();

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    logger.error('Get default categories error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = (req as any).user.id;
    const { name, type } = req.body;

    // Check if category already exists for this user
    const exists = await CategoryModel.existsByNameAndType(name, type, userId);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists for this type'
      });
    }

    // Create new category
    const category = await CategoryModel.create({
      name,
      type,
      user_id: userId
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  } catch (error) {
    logger.error('Create category error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = (req as any).user.id;
    const categoryId = parseInt(req.params.id);
    const { name } = req.body;

    // Update category (only user-created categories can be updated)
    const updatedCategory = await CategoryModel.update(categoryId, userId, { name });
    
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be updated'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: updatedCategory
      }
    });
  } catch (error) {
    logger.error('Update category error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const categoryId = parseInt(req.params.id);

    // Delete category (only user-created categories can be deleted)
    const deleted = await CategoryModel.delete(categoryId, userId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Delete category error', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
