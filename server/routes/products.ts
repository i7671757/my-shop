// Импорт необходимых модулей и зависимостей
import { Elysia, t } from "elysia"; // Фреймворк Elysia для API
import { db } from "@/app/src/db"; // Подключение к базе данных
import { products } from "@/app/src/db/schema"; // Схема таблицы товаров
import { eq, desc, asc, like, and, sql } from "drizzle-orm"; // Операторы для SQL запросов
import { authMiddleware, adminMiddleware } from "@/server/middlewars/auth"; // Middleware для авторизации

// Создание роутера для работы с товарами с префиксом /products
export default new Elysia({ prefix: "/products" })
  // Эндпоинт для получения списка товаров с фильтрацией и пагинацией
  .get(
    "/",
    async ({ query }) => {
      try {
        // Извлечение параметров запроса с значениями по умолчанию
        const {
          page = "1", // Номер страницы
          limit = "10", // Количество элементов на странице
          search = "", // Строка поиска
          sortBy = "createdAt", // Поле для сортировки
          sortOrder = "desc", // Порядок сортировки
          inStock, // Фильтр по наличию
        } = query;

        // Расчет смещения для пагинации
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Массив для хранения условий фильтрации
        const conditions = [];

        // Добавление условия поиска по названию
        if (search) {
          conditions.push(like(products.name, `%${search}%`));
        }

        // Добавление фильтра по наличию на складе
        if (inStock !== undefined) {
          conditions.push(eq(products.inStock, inStock === "true"));
        }

        // Построение базового запроса
        let queryBuilder = db.select().from(products) as any;

        // Применение условий фильтрации, если они есть
        if (conditions.length > 0) {
          queryBuilder = queryBuilder.where(and(...conditions));
        }

        // Настройка сортировки (по возрастанию или убыванию)
        const orderBy = sortOrder === "asc" ? asc : desc;
        queryBuilder = queryBuilder.orderBy(
          orderBy(products[sortBy as keyof typeof products] as any)
        );

        // Применение пагинации (ограничение количества и смещение)
        queryBuilder = queryBuilder.limit(parseInt(limit)).offset(offset);

        // Выполнение запроса для получения списка товаров
        const productList = await queryBuilder;

        // Подсчет общего количества товаров с учетом фильтров
        const totalQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(products);
        if (conditions.length > 0) {
          totalQuery.where(and(...conditions));
        }
        const [{ count: total }] = await totalQuery;

        return {
          success: true,
          data: productList,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: Number(total),
            totalPages: Math.ceil(Number(total) / parseInt(limit)),
          },
        };
      } catch (error) {
        console.error("Get products error:", error);
        return { error: "Failed to fetch products" };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        search: t.Optional(t.String()),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        inStock: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Products"],
        summary: "Get products list",
        description:
          "Get paginated list of products with filtering and sorting",
      },
    }
  )

  // Эндпоинт для получения товара по ID
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        // Поиск товара по ID в базе данных
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, id));

        // Проверка существования товара
        if (!product) {
          set.status = 404; // Код ошибки: не найдено
          return { error: "Product not found" };
        }

        return {
          success: true,
          data: product,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to fetch product" };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "Product ID" }),
      }),
      detail: {
        tags: ["Products"],
        summary: "Get product by ID",
        description: "Get detailed information about a specific product",
      },
    }
  )

  // Подключение middleware для проверки прав администратора
  .use(adminMiddleware)
  // Эндпоинт для создания нового товара (только для администраторов)
  .post(
    "/",
    async ({ body, set }) => {
      try {
        // Добавление нового товара в базу данных
        const [newProduct] = await db.insert(products).values(body).returning();

        return {
          success: true,
          data: newProduct,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to create product" };
      }
    },
    {
      body: t.Object({
        name: t.String({ description: "Product name" }),
        description: t.Optional(
          t.String({ description: "Product description" })
        ),
        price: t.String({ description: "Product price" }),
        imageUrl: t.Optional(t.String({ description: "Product image URL" })),
        inStock: t.Optional(t.Boolean({ description: "Product availability" })),
      }),
      detail: {
        tags: ["Products"],
        summary: "Create new product",
        description: "Create a new product (admin only)",
      },
    }
  )

  // Эндпоинт для обновления товара (только для администраторов)
  .put(
    "/:id",
    async ({ params: { id }, body, set }) => {
      try {
        // Обновление данных товара по ID
        const [updatedProduct] = await db
          .update(products)
          .set(body)
          .where(eq(products.id, id))
          .returning();

        // Проверка, что товар существует и был обновлен
        if (!updatedProduct) {
          set.status = 404;
          return { error: "Product not found" };
        }

        return {
          success: true,
          data: updatedProduct,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to update product" };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "Product ID" }),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        price: t.Optional(t.String()),
        imageUrl: t.Optional(t.String()),
        inStock: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Products"],
        summary: "Update product",
        description: "Update product information (admin only)",
      },
    }
  )

  // Эндпоинт для удаления товара (только для администраторов)
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      try {
        // Удаление товара из базы данных по ID
        const [deletedProduct] = await db
          .delete(products)
          .where(eq(products.id, id))
          .returning();

        // Проверка, что товар существовал и был удален
        if (!deletedProduct) {
          set.status = 404;
          return { error: "Product not found" };
        }

        return {
          success: true,
          message: "Product deleted successfully",
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to delete product" };
      }
    },
    {
      params: t.Object({
        id: t.String({ description: "Product ID" }),
      }),
      detail: {
        tags: ["Products"],
        summary: "Delete product",
        description: "Delete a product (admin only)",
      },
    }
  );
