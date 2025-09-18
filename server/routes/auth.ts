// Импорт основных модулей для работы с API
import { Elysia, t } from "elysia"; // Фреймворк Elysia для создания API
import { jwt } from "@elysiajs/jwt"; // Плагин для работы с JWT токенами
import bcrypt from "bcryptjs"; // Библиотека для хеширования паролей
import { db } from "@/app/src/db"; // Подключение к базе данных
import { users } from "@/app/src/db/schema"; // Схема таблицы пользователей
import { eq } from "drizzle-orm"; // Функция для создания условий WHERE

// Создание роутера для авторизации с префиксом /auth
export default new Elysia({ prefix: "/auth" })
  // Подключение JWT middleware для работы с токенами
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key", // Секретный ключ для подписи токенов
    })
  )
  // Эндпоинт регистрации нового пользователя
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      try {
        const { email, password, role = "user" } = body; // Извлечение данных из тела запроса

        // Проверка, не зарегистрирован ли уже пользователь с таким email
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email));
        if (existingUser.length > 0) {
          set.status = 400; // Код ошибки: некорректный запрос
          return { error: "User with this email already exists" };
        }

        // Хеширование пароля с использованием bcrypt (salt rounds = 12)
        const passwordHash = await bcrypt.hash(password, 12);

        // Создание нового пользователя в базе данных
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            passwordHash,
            role,
          })
          .returning({ // Возврат только необходимых полей (без хеша пароля)
            id: users.id,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          });

        // Создание JWT токена для авторизации пользователя
        const token = await jwt.sign({
          userId: newUser.id, // ID пользователя в payload
          role: newUser.role, // Роль пользователя в payload
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Срок действия токена: 7 дней
        });

        return {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
          },
          token,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Registration failed" };
      }
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          description: "User email address",
        }),
        password: t.String({
          minLength: 6,
          description: "Password (minimum 6 characters)",
        }),
        role: t.Optional(
          t.String({
            description: "User role (default: user)",
          })
        ),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Register new user",
        description: "Create a new user account",
      },
    }
  )

  // Эндпоинт для входа в систему
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      try {
        const { email, password } = body; // Извлечение email и пароля из запроса

        // Поиск пользователя в базе данных по email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));
        if (!user) {
          set.status = 401; // Код ошибки: неавторизован
          return { error: "Invalid email or password" };
        }

        // Проверка соответствия введенного пароля хешу в базе данных
        const isValidPassword = await bcrypt.compare(
          password,
          user.passwordHash
        );
        if (!isValidPassword) {
          set.status = 401; // Код ошибки: неавторизован
          return { error: "Invalid email or password" };
        }

        // Создание JWT токена после успешной авторизации
        const token = await jwt.sign({
          userId: user.id, // ID пользователя
          role: user.role, // Роль пользователя
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Срок действия: 7 дней
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Login failed" };
      }
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          description: "User email address",
        }),
        password: t.String({
          description: "User password",
        }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "User login",
        description: "Authenticate user and return JWT token",
      },
    }
  )

  // Эндпоинт для проверки валидности JWT токена
  .post(
    "/verify",
    async ({ jwt, headers, set }) => {
      try {
        const authorization = headers.authorization; // Извлечение заголовка Authorization

        // Проверка наличия токена в заголовке Authorization
        if (!authorization || !authorization.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Token missing" };
        }

        const token = authorization.slice(7); // Извлечение токена (убираем "Bearer ")
        const payload = await jwt.verify(token); // Проверка и декодирование токена

        // Проверка валидности payload токена
        if (!payload) {
          set.status = 401;
          return { error: "Invalid token" };
        }

        // Получение актуальной информации о пользователе из базы данных
        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, payload.userId as string)); // Поиск по ID из токена

        if (!user) {
          set.status = 401;
          return { error: "User not found" };
        }

        return {
          success: true,
          user,
          payload,
        };
      } catch (error) {
        set.status = 401;
        return { error: "Token verification failed" };
      }
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Verify JWT token",
        description: "Verify JWT token and return user information",
      },
    }
  );
