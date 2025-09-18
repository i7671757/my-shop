import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must not exceed 255 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must not exceed 1000 characters'),
  price: z.number()
    .positive('Price must be a positive number')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  inStock: z.boolean().default(true),
});

export const updateProductSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must not exceed 255 characters')
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  price: z.number()
    .positive('Price must be a positive number')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
    .optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  inStock: z.boolean().optional(),
});

export const productIdSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductIdInput = z.infer<typeof productIdSchema>;