// Импорт необходимых зависимостей
import { Elysia, t } from "elysia"; // Фреймворк для построения API
import { db } from "@/app/src/db"; // Подключение к базе данных
import { orders, orderItems, products, users } from "@/app/src/db/schema"; // Таблицы базы данных
import { eq, desc, and } from "drizzle-orm"; // Операторы для SQL запросов
import { authMiddleware, adminMiddleware } from "@/server/middlewars/auth"; // Middleware для авторизации

// Создание роутера для работы с заказами с префиксом /orders
export default new Elysia({ prefix: "/orders" })
  // Подключение middleware для проверки авторизации
  .use(authMiddleware)
  // Эндпоинт для получения списка заказов
  .get(
    "/",
    // @ts-ignore - user is added by authMiddleware
    async ({ user, query }) => {
      try {
        // Извлечение параметров пагинации и фильтрации
        const { page = "1", limit = "10", status } = query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Формирование условий фильтрации
        const conditions = [];
        // Обычные пользователи видят только свои заказы
        if (user.role !== "admin") {
          conditions.push(eq(orders.userId, user.userId));
        }

        // Фильтрация по статусу заказа
        if (status) {
          conditions.push(eq(orders.status, status as any));
        }

        // Создание базового запроса с выбором нужных полей
        const baseQuery = db
          .select({
            id: orders.id,
            total: orders.total,
            status: orders.status,
            createdAt: orders.createdAt,
            userId: orders.userId,
          })
          .from(orders);

        // Применение условий фильтрации, если они есть
        const queryWithConditions = conditions.length > 0
          ? baseQuery.where(and(...conditions))
          : baseQuery;

        // Выполнение запроса с сортировкой и пагинацией
        const orderList = await queryWithConditions
          .orderBy(desc(orders.createdAt)) // Сортировка по дате (новые сверху)
          .limit(parseInt(limit))
          .offset(offset);
        return {
          success: true,
          data: orderList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
          },
        };
      } catch (error) {
        return {
          error: "Failed to fetch orders",
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Orders"],
        summary: "Get orders",
        description: "Get user orders (all orders for admin)",
      },
    }
  )

  // Эндпоинт для получения детальной информации о заказе
  .get(
    "/:id",
    // @ts-ignore - user is added by authMiddleware
    async ({ params: { id }, user, set }) => {
      try {
        // Получение информации о заказе по ID
        const [order] = await db
          .select({
            id: orders.id,
            total: orders.total,
            status: orders.status,
            createdAt: orders.createdAt,
            userId: orders.userId,
          })
          .from(orders)
          .where(eq(orders.id, id));

        // Проверка существования заказа
        if (!order) {
          set.status = 404;
          return { error: "Order not found" };
        }

        // Проверка прав доступа к заказу
        if (user.role !== "admin" && order.userId !== user.userId) {
          set.status = 403; // Код ошибки: запрещено
          return { error: "Access denied" };
        }

        // Получение списка товаров в заказе
        const items = await db
          .select({
            id: orderItems.id,
            quantity: orderItems.quantity,
            product: { // Информация о товаре
              id: products.id,
              name: products.name,
              price: products.price,
              imageUrl: products.imageUrl,
            },
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id)) // Соединение с таблицей товаров
          .where(eq(orderItems.orderId, id));

        return {
          success: true,
          data: {
            ...order,
            items,
          },
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to fetch order" };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "Order ID" }),
      }),
      detail: {
        tags: ["Orders"],
        summary: "Get order details",
        description: "Get detailed order information with items",
      },
    }
  )

  // Эндпоинт для создания нового заказа
  .post(
    "/",
    // @ts-ignore - user is added by authMiddleware
    async ({ body, user, set }) => {
      try {
        const { items, total } = body; // Извлечение товаров и суммы

        // Создание нового заказа в базе данных
        const [newOrder] = await db
          .insert(orders)
          .values({
            userId: user.userId, // ID пользователя, создающего заказ
            total: total.toString(), // Общая сумма заказа
            status: "pending", // Начальный статус - ожидает обработки
          })
          .returning();

        // Добавление товаров в состав заказа
        if (items && items.length > 0) {
          await db.insert(orderItems).values(
            items.map((item) => ({
              orderId: newOrder.id, // ID созданного заказа
              productId: item.productId, // ID товара
              quantity: item.quantity, // Количество
            }))
          );
        }

        return {
          success: true,
          data: newOrder,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to create order" };
      }
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            productId: t.String(),
            quantity: t.Number({ minimum: 1 }),
          })
        ),
        total: t.Number({ minimum: 0 }),
      }),
      detail: {
        tags: ["Orders"],
        summary: "Create new order",
        description: "Create a new order with items",
      },
    }
  )

  // Подключение middleware для проверки прав администратора
  .use(adminMiddleware)
  // Эндпоинт для обновления статуса заказа (только для админов)
  .put(
    "/:id/status",
    async ({ params: { id }, body, set }) => {
      try {
        // Обновление статуса заказа в базе данных
        const [updatedOrder] = await db
          .update(orders)
          .set({ status: body.status })
          .where(eq(orders.id, id))
          .returning();

        // Проверка, что заказ был найден и обновлен
        if (!updatedOrder) {
          set.status = 404;
          return { error: "Order not found" };
        }

        return {
          success: true,
          data: updatedOrder,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to update order status" };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "Order ID" }),
      }),
      body: t.Object({
        status: t.Union([
          t.Literal("pending"),
          t.Literal("shipped"),
          t.Literal("delivered"),
          t.Literal("cancelled"),
        ]),
      }),
      detail: {
        tags: ["Orders"],
        summary: "Update order status",
        description: "Update order status (admin only)",
      },
    }
  );
