// Загрузка переменных окружения из файла .env
import "dotenv/config";
// Импорт Drizzle ORM адаптера для Bun SQL
import { drizzle } from "drizzle-orm/bun-sql";
// Импорт SQL клиента от Bun
import { SQL } from "bun";

// Создание клиента базы данных с использованием строки подключения из переменных окружения
const client = new SQL(process.env.DATABASE_URL!);
// Экспорт экземпляра Drizzle ORM для работы с базой данных
export const db = drizzle({ client });
