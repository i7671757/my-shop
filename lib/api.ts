// Базовый URL API сервера (берется из переменной окружения или локальный сервер)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Класс для работы с API сервера
class ApiClient {
  private baseUrl: string; // Базовый URL API
  private token: string | null = null; // JWT токен для авторизации

  // Конструктор клиента API
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;

    // Проверяем, что мы в браузере (не на сервере)
    if (typeof window !== "undefined") {
      // Пытаемся получить сохраненный токен
      this.token = localStorage.getItem("auth_token");
    }
  }

  // Метод для установки токена авторизации
  setToken(token: string) {
    this.token = token;
    // Сохраняем токен в localStorage для персистентности
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  // Метод для удаления токена (выход из системы)
  removeToken() {
    this.token = null;
    // Удаляем токен из localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  // Основной метод для выполнения HTTP запросов
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`; // Формируем полный URL

    // Подготавливаем заголовки запроса
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Добавляем токен авторизации, если он есть
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Выполняем запрос
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Обработка ошибок
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    // Возвращаем результат в формате JSON
    return response.json();
  }

  // Методы для работы с авторизацией
  auth = {
    register: (data: { email: string; password: string; role?: string }) =>
      this.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verify: () => this.request("auth/verify", { method: "POST" }),
  };

  // Методы для работы с товарами
  products = {
    // Получение списка товаров с фильтрацией и пагинацией
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      inStock?: boolean;
    }) => {
      // Формируем параметры запроса
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([keyof, value]) => {
          if (value !== undefined) {
            searchParams.append(keyof, value.toString());
          }
        });
      }
      const query = searchParams.toString();
      return this.request(`/products${query ? `?${query}` : ""}`);
    },

    getById: (id: string) => this.request(`/products/${id}`),

    create: (data: {
      name: string;
      description?: string;
      price: string;
      imageUrl?: string;
      inStock?: boolean;
    }) =>
      this.request("/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: Partial<{
        name: string;
        description: string;
        price: string;
        imageUrl: string;
        inStock: boolean;
      }>
    ) =>
      this.request(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request(`/products/${id}`, { method: "DELETE" }),
  };

  // Методы для работы с заказами
  orders = {
    getAll: (params?: { page?: number; limit?: number; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }
      const query = searchParams.toString();
      return this.request(`/orders${query ? `?${query}` : ""}`);
    },

    getById: (id: string) => this.request(`/orders/${id}`),

    create: (data: {
      items: Array<{ productId: string; quantity: number }>;
      total: number;
    }) =>
      this.request("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateStatus: (
      id: string,
      status: "pending" | "shipped" | "delivered" | "cancelled"
    ) =>
      this.request(`/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  };

  // Методы для работы с пользователями
  users = {
    getProfile: () => this.request("/users/profile"),

    updateProfile: (data: { email?: string; password?: string }) =>
      this.request("/users/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    getAll: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }
      const query = searchParams.toString();
      return this.request(`/users${query ? `?${query}` : ""}`);
    },

    updateRole: (id: string, role: string) =>
      this.request(`/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
  };
}

// Экспорт экземпляра клиента API для использования в приложении
export const apiClient = new ApiClient(API_BASE);
