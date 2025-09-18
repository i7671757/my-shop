// Импорт основных модулей сервера
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { jwt } from "@elysiajs/jwt";

// Создание экземпляра приложения
const app = new Elysia()
  // Настройка CORS для разрешения запросов с фронтенда
  .use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:3002"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  // Настройка Swagger для автоматической документации API
  .use(
    swagger({
      documentation: {
        info: {
          title: "My Shop API",
          version: "1.0.0",
          description: "E-commerce API built with Elysia.js",
        },
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Products", description: "Product management" },
          { name: "Orders", description: "Order management" },
          { name: "Users", description: "User management" },
        ],
      },
    })
  )
  // Настройка JWT для авторизации
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key",
    })
  )
  // Корневой эндпоинт для проверки работы API
  .get("/", () => ({ message: "My Shop API is running!" }))
  // Обработчик глобальных ошибок
  .onError(({ code, error, set }) => {
    console.error("API Error:", error); // Логирование ошибки

    // Обработка разных типов ошибок
    switch (code) {
      case "VALIDATION": // Ошибка валидации данных
        set.status = 400;
        return { error: "Validation failed", details: error.message };
      case "NOT_FOUND": // Роут не найден
        set.status = 404;
        return { error: "Route not found" };
      default: // Любая другая ошибка
        set.status = 500;
        return { error: "Internal server error" };
    }
  })
  // Запуск сервера на порту 3001
  .listen(3001);

// Вывод информации о запуске сервера
console.log("🚀 Server running on http://localhost:3001");
console.log("📖 Swagger docs on http://localhost:3001/swagger");

// Экспорт типа приложения для TypeScript
export type App = typeof app;
