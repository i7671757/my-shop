'use client'

import Link from 'next/link'
import { ShoppingCart, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/stores/cart-store'
import { useAuthStore } from '@/lib/stores/auth-store'

export function Header() {
  const { getTotalItems } = useCartStore()
  const { user, logout, isAuthenticated } = useAuthStore()
  const totalItems = getTotalItems()

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-2xl">
          MyShop
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Каталог
          </Link>

          {isAuthenticated() && user?.role === 'admin' && (
            <Link
              href="/admin"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Админ
            </Link>
          )}

          <div className="flex items-center gap-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {isAuthenticated() ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    logout()
                    window.location.href = '/'
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}