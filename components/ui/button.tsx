// Импорт необходимых зависимостей
import * as React from "react"
import { Slot } from "@radix-ui/react-slot" // Компонент для полиморфного рендеринга
import { cva, type VariantProps } from "class-variance-authority" // Утилита для вариантов стилей

import { cn } from "@/lib/utils" // Утилита для объединения классов

// Определение вариантов стилей кнопки
const buttonVariants = cva(
  // Базовые стили для всех кнопок
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      // Варианты внешнего вида кнопки
      variant: {
        default: // Основная кнопка
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: // Кнопка для опасных действий (удаление и т.д.)
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: // Кнопка с контуром
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: // Второстепенная кнопка
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: // Прозрачная кнопка
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline", // Кнопка-ссылка
      },
      // Размеры кнопки
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3", // Стандартный размер
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5", // Маленький
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4", // Большой
        icon: "size-9", // Кнопка-иконка
      },
    },
    // Значения по умолчанию
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Компонент кнопки
function Button({
  className, // Дополнительные CSS классы
  variant, // Вариант стиля
  size, // Размер
  asChild = false, // Рендерить как дочерний элемент
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  // Определение компонента для рендеринга
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))} // Применение стилей
      {...props}
    />
  )
}

export { Button, buttonVariants }
