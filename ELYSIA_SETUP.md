# Настройка Elysia.js бэкенда

Полное руководство по настройке Elysia.js как бэкенд для вашего Next.js проекта.

## 1. Установка зависимостей

```bash
bun add elysia @elysiajs/cors @elysiajs/static @elysiajs/swagger @elysiajs/jwt
bun add -d @types/bun concurrently
```

## 2. Структура проекта

```
my-shop/
├── server/                    # Бэкенд на Elysia.js
│   ├── index.ts              # Главный сервер
│   ├── routes/
│   │   ├── auth.ts           # Роуты аутентификации
│   │   ├── products.ts       # Роуты продуктов
│   │   ├── orders.ts         # Роуты заказов
│   │   └── users.ts          # Роуты пользователей
│   ├── middleware/
│   │   ├── auth.ts           # JWT middleware
│   │   └── cors.ts           # CORS настройки
│   ├── services/
│   │   ├── auth.service.ts   # Логика аутентификации
│   │   ├── product.service.ts # Логика продуктов
│   │   └── order.service.ts  # Логика заказов
│   └── types/
│       └── index.ts          # Типы API
├── app/                      # Next.js фронтенд
├── components/
└── lib/
```

## 3. Главный сервер файл

**Создать: `server/index.ts`**

```typescript
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { jwt } from '@elysiajs/jwt'

import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import orderRoutes from './routes/orders'
import userRoutes from './routes/users'

const app = new Elysia()
  .use(cors({
    origin: 'http://localhost:3000', // Next.js фронтенд
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'My Shop API',
        version: '1.0.0',
        description: 'E-commerce API built with Elysia.js'
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Products', description: 'Product management' },
        { name: 'Orders', description: 'Order management' },
        { name: 'Users', description: 'User management' }
      ]
    }
  }))
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  .get('/', () => ({ message: 'My Shop API is running!' }))
  .use(authRoutes)
  .use(productRoutes)
  .use(orderRoutes)
  .use(userRoutes)
  .onError(({ code, error, set }) => {
    console.error('API Error:', error)
    
    switch (code) {
      case 'VALIDATION':
        set.status = 400
        return { error: 'Validation failed', details: error.message }
      case 'NOT_FOUND':
        set.status = 404
        return { error: 'Route not found' }
      default:
        set.status = 500
        return { error: 'Internal server error' }
    }
  })
  .listen(3001)

console.log('🚀 Server running on http://localhost:3001')
console.log('📖 Swagger docs on http://localhost:3001/swagger')

export type App = typeof app
```

## 4. Middleware для аутентификации

**Создать: `server/middleware/auth.ts`**

```typescript
import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

export const authMiddleware = new Elysia()
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  .derive(async ({ jwt, headers, set }) => {
    const authorization = headers.authorization
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      set.status = 401
      throw new Error('Authorization header missing or invalid')
    }
    
    const token = authorization.slice(7)
    const payload = await jwt.verify(token)
    
    if (!payload) {
      set.status = 401
      throw new Error('Invalid or expired token')
    }
    
    return { 
      user: payload as { userId: string; role: string }
    }
  })

export const adminMiddleware = new Elysia()
  .use(authMiddleware)
  .derive(({ user, set }) => {
    if (user.role !== 'admin') {
      set.status = 403
      throw new Error('Admin access required')
    }
    return { user }
  })
```

## 5. Роуты аутентификации

**Создать: `server/routes/auth.ts`**

```typescript
import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import bcrypt from 'bcryptjs'
import { db } from '../../app/src/db'
import { users } from '../../app/src/db/schema'
import { eq } from 'drizzle-orm'

export default new Elysia({ prefix: '/auth' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  .post('/register', async ({ body, jwt, set }) => {
    try {
      const { email, password, role = 'user' } = body
      
      // Проверка существования пользователя
      const existingUser = await db.select().from(users).where(eq(users.email, email))
      if (existingUser.length > 0) {
        set.status = 400
        return { error: 'User with this email already exists' }
      }
      
      // Хеширование пароля
      const passwordHash = await bcrypt.hash(password, 12)
      
      // Создание пользователя
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash,
        role
      }).returning({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      })
      
      // Создание JWT токена
      const token = await jwt.sign({ 
        userId: newUser.id, 
        role: newUser.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 дней
      })
      
      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token
      }
    } catch (error) {
      set.status = 500
      return { error: 'Registration failed' }
    }
  }, {
    body: t.Object({
      email: t.String({ 
        format: 'email',
        description: 'User email address'
      }),
      password: t.String({ 
        minLength: 6,
        description: 'Password (minimum 6 characters)'
      }),
      role: t.Optional(t.String({
        description: 'User role (default: user)'
      }))
    }),
    detail: {
      tags: ['Auth'],
      summary: 'Register new user',
      description: 'Create a new user account'
    }
  })
  
  .post('/login', async ({ body, jwt, set }) => {
    try {
      const { email, password } = body
      
      // Поиск пользователя
      const [user] = await db.select().from(users).where(eq(users.email, email))
      if (!user) {
        set.status = 401
        return { error: 'Invalid email or password' }
      }
      
      // Проверка пароля
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      if (!isValidPassword) {
        set.status = 401
        return { error: 'Invalid email or password' }
      }
      
      // Создание JWT токена
      const token = await jwt.sign({ 
        userId: user.id, 
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 дней
      })
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    } catch (error) {
      set.status = 500
      return { error: 'Login failed' }
    }
  }, {
    body: t.Object({
      email: t.String({ 
        format: 'email',
        description: 'User email address'
      }),
      password: t.String({
        description: 'User password'
      })
    }),
    detail: {
      tags: ['Auth'],
      summary: 'User login',
      description: 'Authenticate user and return JWT token'
    }
  })
  
  .post('/verify', async ({ jwt, headers, set }) => {
    try {
      const authorization = headers.authorization
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        set.status = 401
        return { error: 'Token missing' }
      }
      
      const token = authorization.slice(7)
      const payload = await jwt.verify(token)
      
      if (!payload) {
        set.status = 401
        return { error: 'Invalid token' }
      }
      
      // Получение актуальной информации о пользователе
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      }).from(users).where(eq(users.id, payload.userId))
      
      if (!user) {
        set.status = 401
        return { error: 'User not found' }
      }
      
      return {
        success: true,
        user,
        payload
      }
    } catch (error) {
      set.status = 401
      return { error: 'Token verification failed' }
    }
  }, {
    detail: {
      tags: ['Auth'],
      summary: 'Verify JWT token',
      description: 'Verify JWT token and return user information'
    }
  })
```

## 6. Роуты продуктов

**Создать: `server/routes/products.ts`**

```typescript
import { Elysia, t } from 'elysia'
import { db } from '../../app/src/db'
import { products } from '../../app/src/db/schema'
import { eq, desc, asc, like, and } from 'drizzle-orm'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

export default new Elysia({ prefix: '/products' })
  .get('/', async ({ query }) => {
    try {
      const { 
        page = '1', 
        limit = '10', 
        search = '', 
        sortBy = 'createdAt',
        sortOrder = 'desc',
        inStock
      } = query
      
      const offset = (parseInt(page) - 1) * parseInt(limit)
      
      let queryBuilder = db.select().from(products)
      
      // Условия фильтрации
      const conditions = []
      
      if (search) {
        conditions.push(like(products.name, `%${search}%`))
      }
      
      if (inStock !== undefined) {
        conditions.push(eq(products.inStock, inStock === 'true'))
      }
      
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions))
      }
      
      // Сортировка
      const orderBy = sortOrder === 'asc' ? asc : desc
      queryBuilder = queryBuilder.orderBy(orderBy(products[sortBy as keyof typeof products]))
      
      // Пагинация
      queryBuilder = queryBuilder.limit(parseInt(limit)).offset(offset)
      
      const productList = await queryBuilder
      
      // Подсчет общего количества
      const totalQuery = db.select({ count: products.id }).from(products)
      if (conditions.length > 0) {
        totalQuery.where(and(...conditions))
      }
      const [{ count: total }] = await totalQuery
      
      return {
        success: true,
        data: productList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: Number(total),
          totalPages: Math.ceil(Number(total) / parseInt(limit))
        }
      }
    } catch (error) {
      console.error('Get products error:', error)
      return { error: 'Failed to fetch products' }
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
      sortBy: t.Optional(t.String()),
      sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
      inStock: t.Optional(t.String())
    }),
    detail: {
      tags: ['Products'],
      summary: 'Get products list',
      description: 'Get paginated list of products with filtering and sorting'
    }
  })
  
  .get('/:id', async ({ params: { id }, set }) => {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id))
      
      if (!product) {
        set.status = 404
        return { error: 'Product not found' }
      }
      
      return {
        success: true,
        data: product
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to fetch product' }
    }
  }, {
    params: t.Object({
      id: t.String({ description: 'Product ID' })
    }),
    detail: {
      tags: ['Products'],
      summary: 'Get product by ID',
      description: 'Get detailed information about a specific product'
    }
  })
  
  .use(adminMiddleware)
  .post('/', async ({ body, set }) => {
    try {
      const [newProduct] = await db.insert(products).values(body).returning()
      
      return {
        success: true,
        data: newProduct
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to create product' }
    }
  }, {
    body: t.Object({
      name: t.String({ description: 'Product name' }),
      description: t.Optional(t.String({ description: 'Product description' })),
      price: t.String({ description: 'Product price' }),
      imageUrl: t.Optional(t.String({ description: 'Product image URL' })),
      inStock: t.Optional(t.Boolean({ description: 'Product availability' }))
    }),
    detail: {
      tags: ['Products'],
      summary: 'Create new product',
      description: 'Create a new product (admin only)'
    }
  })
  
  .put('/:id', async ({ params: { id }, body, set }) => {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set(body)
        .where(eq(products.id, id))
        .returning()
      
      if (!updatedProduct) {
        set.status = 404
        return { error: 'Product not found' }
      }
      
      return {
        success: true,
        data: updatedProduct
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to update product' }
    }
  }, {
    params: t.Object({
      id: t.String({ description: 'Product ID' })
    }),
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String()),
      price: t.Optional(t.String()),
      imageUrl: t.Optional(t.String()),
      inStock: t.Optional(t.Boolean())
    }),
    detail: {
      tags: ['Products'],
      summary: 'Update product',
      description: 'Update product information (admin only)'
    }
  })
  
  .delete('/:id', async ({ params: { id }, set }) => {
    try {
      const [deletedProduct] = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning()
      
      if (!deletedProduct) {
        set.status = 404
        return { error: 'Product not found' }
      }
      
      return {
        success: true,
        message: 'Product deleted successfully'
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to delete product' }
    }
  }, {
    params: t.Object({
      id: t.String({ description: 'Product ID' })
    }),
    detail: {
      tags: ['Products'],
      summary: 'Delete product',
      description: 'Delete a product (admin only)'
    }
  })
```

## 7. Роуты заказов

**Создать: `server/routes/orders.ts`**

```typescript
import { Elysia, t } from 'elysia'
import { db } from '../../app/src/db'
import { orders, orderItems, products, users } from '../../app/src/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

export default new Elysia({ prefix: '/orders' })
  .use(authMiddleware)
  .get('/', async ({ user, query }) => {
    try {
      const { page = '1', limit = '10', status } = query
      const offset = (parseInt(page) - 1) * parseInt(limit)
      
      let queryBuilder = db
        .select({
          id: orders.id,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          userId: orders.userId
        })
        .from(orders)
      
      // Если не админ, показываем только заказы пользователя
      const conditions = []
      if (user.role !== 'admin') {
        conditions.push(eq(orders.userId, user.userId))
      }
      
      if (status) {
        conditions.push(eq(orders.status, status))
      }
      
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions))
      }
      
      const ordersList = await queryBuilder
        .orderBy(desc(orders.createdAt))
        .limit(parseInt(limit))
        .offset(offset)
      
      return {
        success: true,
        data: ordersList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    } catch (error) {
      return { error: 'Failed to fetch orders' }
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      status: t.Optional(t.String())
    }),
    detail: {
      tags: ['Orders'],
      summary: 'Get orders',
      description: 'Get user orders (all orders for admin)'
    }
  })
  
  .get('/:id', async ({ params: { id }, user, set }) => {
    try {
      const [order] = await db
        .select({
          id: orders.id,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          userId: orders.userId
        })
        .from(orders)
        .where(eq(orders.id, id))
      
      if (!order) {
        set.status = 404
        return { error: 'Order not found' }
      }
      
      // Проверка прав доступа
      if (user.role !== 'admin' && order.userId !== user.userId) {
        set.status = 403
        return { error: 'Access denied' }
      }
      
      // Получение товаров заказа
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          product: {
            id: products.id,
            name: products.name,
            price: products.price,
            imageUrl: products.imageUrl
          }
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, id))
      
      return {
        success: true,
        data: {
          ...order,
          items
        }
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to fetch order' }
    }
  }, {
    params: t.Object({
      id: t.String({ description: 'Order ID' })
    }),
    detail: {
      tags: ['Orders'],
      summary: 'Get order details',
      description: 'Get detailed order information with items'
    }
  })
  
  .post('/', async ({ body, user, set }) => {
    try {
      const { items, total } = body
      
      // Создание заказа
      const [newOrder] = await db.insert(orders).values({
        userId: user.userId,
        total: total.toString(),
        status: 'pending'
      }).returning()
      
      // Добавление товаров в заказ
      if (items && items.length > 0) {
        await db.insert(orderItems).values(
          items.map(item => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity
          }))
        )
      }
      
      return {
        success: true,
        data: newOrder
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to create order' }
    }
  }, {
    body: t.Object({
      items: t.Array(t.Object({
        productId: t.String(),
        quantity: t.Number({ minimum: 1 })
      })),
      total: t.Number({ minimum: 0 })
    }),
    detail: {
      tags: ['Orders'],
      summary: 'Create new order',
      description: 'Create a new order with items'
    }
  })
  
  .use(adminMiddleware)
  .put('/:id/status', async ({ params: { id }, body, set }) => {
    try {
      const [updatedOrder] = await db
        .update(orders)
        .set({ status: body.status })
        .where(eq(orders.id, id))
        .returning()
      
      if (!updatedOrder) {
        set.status = 404
        return { error: 'Order not found' }
      }
      
      return {
        success: true,
        data: updatedOrder
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to update order status' }
    }
  }, {
    params: t.Object({
      id: t.String({ description: 'Order ID' })
    }),
    body: t.Object({
      status: t.Union([
        t.Literal('pending'),
        t.Literal('shipped'),
        t.Literal('delivered'),
        t.Literal('cancelled')
      ])
    }),
    detail: {
      tags: ['Orders'],
      summary: 'Update order status',
      description: 'Update order status (admin only)'
    }
  })
```

## 8. Роуты пользователей

**Создать: `server/routes/users.ts`**

```typescript
import { Elysia, t } from 'elysia'
import { db } from '../../app/src/db'
import { users } from '../../app/src/db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware, adminMiddleware } from '../middleware/auth'
import bcrypt from 'bcryptjs'

export default new Elysia({ prefix: '/users' })
  .use(authMiddleware)
  .get('/profile', async ({ user, set }) => {
    try {
      const [userProfile] = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.id, user.userId))
      
      if (!userProfile) {
        set.status = 404
        return { error: 'User not found' }
      }
      
      return {
        success: true,
        data: userProfile
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to fetch profile' }
    }
  }, {
    detail: {
      tags: ['Users'],
      summary: 'Get user profile',
      description: 'Get current user profile information'
    }
  })
  
  .put('/profile', async ({ user, body, set }) => {
    try {
      const updateData: any = {}
      
      if (body.email) {
        updateData.email = body.email
      }
      
      if (body.password) {
        updateData.passwordHash = await bcrypt.hash(body.password, 12)
      }
      
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.userId))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt
        })
      
      if (!updatedUser) {
        set.status = 404
        return { error: 'User not found' }
      }
      
      return {
        success: true,
        data: updatedUser
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to update profile' }
    }
  }, {
    body: t.Object({
      email: t.Optional(t.String({ format: 'email' })),
      password: t.Optional(t.String({ minLength: 6 }))
    }),
    detail: {
      tags: ['Users'],
      summary: 'Update user profile',
      description: 'Update current user profile information'
    }
  })
  
  .use(adminMiddleware)
  .get('/', async ({ query }) => {
    try {
      const { page = '1', limit = '10' } = query
      const offset = (parseInt(page) - 1) * parseInt(limit)
      
      const usersList = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt
        })
        .from(users)
        .limit(parseInt(limit))
        .offset(offset)
      
      return {
        success: true,
        data: usersList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    } catch (error) {
      return { error: 'Failed to fetch users' }
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String())
    }),
    detail: {
      tags: ['Users'],
      summary: 'Get all users',
      description: 'Get list of all users (admin only)'
    }
  })
  
  .put('/:id/role', async ({ params: { id }, body, set }) => {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ role: body.role })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt
        })
      
      if (!updatedUser) {
        set.status = 404
        return { error: 'User not found' }
      }
      
      return {
        success: true,
        data: updatedUser
      }
    } catch (error) {
      set.status = 500
      return { error: 'Failed to update user role' }
    }
  }, {
    params: t.Object({
      id: t.String({ description: 'User ID' })
    }),
    body: t.Object({
      role: t.String({ description: 'New user role' })
    }),
    detail: {
      tags: ['Users'],
      summary: 'Update user role',
      description: 'Update user role (admin only)'
    }
  })
```

## 9. Обновление package.json

Добавить скрипты в `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "dev:api": "bun run server/index.ts --watch",
    "dev:full": "concurrently \"npm run dev\" \"npm run dev:api\"",
    "build": "next build --turbopack",
    "build:api": "bun build server/index.ts --outdir dist",
    "start": "next start",
    "start:api": "bun run dist/index.js",
    "lint": "eslint"
  }
}
```

## 10. Environment переменные

Создать или обновить `.env.local`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/myshop

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## 11. API клиент для фронтенда

**Создать: `lib/api-client.ts`**

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    
    // Получаем токен из localStorage при инициализации
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  removeToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  // Auth endpoints
  auth = {
    register: (data: { email: string; password: string; role?: string }) =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    verify: () => this.request('/auth/verify', { method: 'POST' }),
  }

  // Products endpoints
  products = {
    getAll: (params?: { 
      page?: number; 
      limit?: number; 
      search?: string; 
      sortBy?: string; 
      sortOrder?: 'asc' | 'desc';
      inStock?: boolean;
    }) => {
      const searchParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString())
          }
        })
      }
      const query = searchParams.toString()
      return this.request(`/products${query ? `?${query}` : ''}`)
    },

    getById: (id: string) => this.request(`/products/${id}`),

    create: (data: {
      name: string;
      description?: string;
      price: string;
      imageUrl?: string;
      inStock?: boolean;
    }) =>
      this.request('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{
      name: string;
      description: string;
      price: string;
      imageUrl: string;
      inStock: boolean;
    }>) =>
      this.request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request(`/products/${id}`, { method: 'DELETE' }),
  }

  // Orders endpoints
  orders = {
    getAll: (params?: { page?: number; limit?: number; status?: string }) => {
      const searchParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString())
          }
        })
      }
      const query = searchParams.toString()
      return this.request(`/orders${query ? `?${query}` : ''}`)
    },

    getById: (id: string) => this.request(`/orders/${id}`),

    create: (data: {
      items: Array<{ productId: string; quantity: number }>;
      total: number;
    }) =>
      this.request('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateStatus: (id: string, status: 'pending' | 'shipped' | 'delivered' | 'cancelled') =>
      this.request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  }

  // Users endpoints
  users = {
    getProfile: () => this.request('/users/profile'),

    updateProfile: (data: { email?: string; password?: string }) =>
      this.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getAll: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString())
          }
        })
      }
      const query = searchParams.toString()
      return this.request(`/users${query ? `?${query}` : ''}`)
    },

    updateRole: (id: string, role: string) =>
      this.request(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
  }
}

export const apiClient = new ApiClient(API_BASE)
```

## 12. Типы для API

**Создать: `types/api.ts`**

```typescript
export interface User {
  id: string
  email: string
  role: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: string
  imageUrl?: string
  inStock: boolean
  createdAt: string
}

export interface Order {
  id: string
  userId: string
  total: string
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  product?: Product
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total?: number
    totalPages?: number
  }
}

export interface AuthResponse {
  success: boolean
  user: User
  token: string
}
```

## 13. Запуск проекта

```bash
# Запуск только бэкенда
npm run dev:api

# Запуск только фронтенда  
npm run dev

# Запуск всего проекта (фронтенд + бэкенд)
npm run dev:full
```

## 14. Доступные URL

- **API сервер**: http://localhost:3001
- **Swagger документация**: http://localhost:3001/swagger
- **Next.js фронтенд**: http://localhost:3000

## 15. Особенности и преимущества

### Type Safety
- Автоматическая генерация типов
- Валидация запросов на уровне схемы
- IntelliSense поддержка

### Performance
- Высокая производительность благодаря Bun runtime
- Минимальные накладные расходы
- Быстрый холодный старт

### Developer Experience
- Автоматическая Swagger документация
- Hot reload в режиме разработки
- Подробные сообщения об ошибках

### Security
- JWT аутентификация
- Middleware для проверки прав доступа
- Валидация входящих данных

### API Features
- RESTful архитектура
- Пагинация и фильтрация
- Поиск и сортировка
- CORS поддержка

Этот setup обеспечивает полнофункциональный бэкенд API на Elysia.js с аутентификацией, управлением продуктами, заказами и пользователями.