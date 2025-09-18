import { z } from 'zod';

export const orderStatusEnum = z.enum(['pending', 'shipped', 'delivered', 'cancelled']);

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be a positive integer'),
    })
  ).min(1, 'Order must contain at least one item'),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusEnum,
});

export const orderIdSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderIdInput = z.infer<typeof orderIdSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type OrderStatus = z.infer<typeof orderStatusEnum>;