// Импорт функции конфигурации Drizzle ORM
import { defineConfig } from "drizzle-kit";

// Конфигурация Drizzle Kit для управления миграциями базы данных
export default defineConfig({
  out: "./drizzle", // Папка для хранения файлов миграций
  schema: "./app/src/db/schema.ts", // Путь к файлу со схемой базы данных
  dialect: "postgresql", // Тип базы данных (PostgreSQL)
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Строка подключения к базе данных из переменных окружения
  },
});
