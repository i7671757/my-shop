'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ShoppingCart, Users, TrendingUp, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function AdminDashboard() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/')
    }
  }, [isAuthenticated, isAdmin, router])

  if (!isAdmin()) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Панель администратора</h1>
        <p className="text-gray-600">Управление интернет-магазином</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего товаров</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Активных товаров</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заказы</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Новых заказов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Зарегистрировано</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выручка</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 ₽</div>
            <p className="text-xs text-muted-foreground">За месяц</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Управление товарами</CardTitle>
            <CardDescription>Добавление и редактирование товаров</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/products/new">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Добавить товар
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="outline" className="w-full">
                <Package className="w-4 h-4 mr-2" />
                Все товары
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Управление заказами</CardTitle>
            <CardDescription>Просмотр и обработка заказов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/orders">
              <Button className="w-full">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Все заказы
              </Button>
            </Link>
            <Link href="/admin/orders?status=pending">
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Необработанные
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}