import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  numeric,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// Перечисление статусов заказа
// pending - заказ ожидает обработки
// shipped - заказ отправлен
// delivered - заказ доставлен
// cancelled - заказ отменен
export const orderStatus = pgEnum("order_status", [
  "pending",
  "shipped",
  "delivered",
  "cancelled",
]);

// Таблица пользователей системы
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), // Уникальный идентификатор пользователя
  email: varchar("email", { length: 255 }).notNull().unique(), // Электронная почта (уникальная)
  passwordHash: varchar("password_hash", { length: 255 }).notNull(), // Хеш пароля для безопасности
  role: varchar("role", { length: 255 }).notNull(), // Роль пользователя (admin, customer и т.д.)
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата регистрации
});

// Таблица товаров магазина
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(), // Уникальный идентификатор товара
  name: varchar("name", { length: 255 }).notNull(), // Название товара
  description: varchar("description", { length: 500 }), // Описание товара (опционально)
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Цена товара с точностью до 2 знаков
  imageUrl: varchar("image_url", { length: 500 }), // URL изображения товара
  inStock: boolean("in_stock").notNull().default(true), // Флаг наличия товара на складе
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата добавления товара
});

// Таблица заказов
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(), // Уникальный идентификатор заказа
  userId: uuid("user_id")
    .references(() => users.id) // Связь с таблицей пользователей
    .notNull(), // ID пользователя, сделавшего заказ
  total: numeric("total", { precision: 10, scale: 2 }).notNull(), // Общая сумма заказа
  status: orderStatus("status").notNull().default("pending"), // Статус заказа (по умолчанию - ожидает)
  createdAt: timestamp("created_at").notNull().defaultNow(), // Дата создания заказа
});

// Таблица позиций заказа (связующая таблица между заказами и товарами)
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(), // Уникальный идентификатор позиции
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id), // Связь с таблицей заказов
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id), // Связь с таблицей товаров
  quantity: integer("quantity").default(1).notNull(), // Количество единиц товара в заказе
});
