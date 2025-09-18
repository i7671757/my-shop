// Импорт утилит для работы с классами
import { clsx, type ClassValue } from "clsx" // Утилита для условного объединения классов
import { twMerge } from "tailwind-merge" // Утилита для правильного слияния Tailwind классов

// Утилита для объединения классов с учетом приоритета Tailwind
// Предотвращает конфликты классов и обеспечивает правильное переопределение стилей
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)) // Сначала clsx объединяет классы, затем twMerge решает конфликты
}
