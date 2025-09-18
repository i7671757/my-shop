export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  inStock: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  total: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total?: number;
    totalPages?: number;
  };
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}
