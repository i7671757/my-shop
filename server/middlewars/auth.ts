// Импорт необходимых зависимостей
import { Elysia } from "elysia"; // Фреймворк Elysia
import { jwt } from "@elysiajs/jwt"; // JWT плагин для работы с токенами

// Тип для описания данных пользователя в JWT токене
type User = {
  userId: string; // ID пользователя
  role: string; // Роль пользователя (admin, user и т.д.)
};

// Middleware для проверки авторизации пользователя
export const authMiddleware = new Elysia()
  // Подключение JWT плагина с секретным ключом
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key", // Секретный ключ для подписи токенов
    })
  )
  // Функция для извлечения и проверки JWT токена
  .derive(async ({ jwt, headers, set }) => {
    // Получение заголовка Authorization из запроса
    const authorization = headers.authorization;

    // Проверка наличия и формата токена
    if (!authorization || !authorization.startsWith("Bearer ")) {
      set.status = 401; // Код ошибки: неавторизован
      throw new Error("Authorization header missing or invalid");
    }

    // Извлечение токена (убираем "Bearer ")
    const token = authorization.slice(7);
    // Проверка и декодирование JWT токена
    const payload = await jwt.verify(token);

    // Проверка валидности payload токена
    if (!payload) {
      set.status = 401; // Код ошибки: неавторизован
      throw new Error("Invalid or expired token");
    }

    // Возврат данных пользователя для использования в роутах
    return {
      user: payload as User,
    };
  });

// Middleware для проверки прав администратора
export const adminMiddleware = new Elysia()
  // Использование authMiddleware для базовой авторизации
  .use(authMiddleware)
  // Дополнительная проверка роли пользователя
  .derive(async (context) => {
    const { user, set } = context as any;

    // Проверка, что пользователь является администратором
    if (!user || user.role !== "admin") {
      set.status = 403; // Код ошибки: доступ запрещен
      throw new Error("Admin access required");
    }
    return { user };
  });
