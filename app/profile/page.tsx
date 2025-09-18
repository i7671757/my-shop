'use client'

import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/config'
import { useRouter } from 'next/navigation'
import { Package, Calendar, DollarSign, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Order {
  id: number
  total: number
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  items: Array<{
    id: number
    quantity: number
    product: {
      name: string
      price: number
    }
  }>
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    fetchOrders()
  }, [isAuthenticated, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В обработке'
      case 'shipped':
        return 'Отправлен'
      case 'delivered':
        return 'Доставлен'
      case 'cancelled':
        return 'Отменен'
      default:
        return status
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Личный кабинет</h1>
        <p className="text-gray-600">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего заказов
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Потрачено
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.reduce((sum, order) => sum + order.total, 0).toLocaleString('ru-RU')} ₽
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Роль
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
              {user.role === 'admin' ? 'Администратор' : 'Покупатель'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История заказов</CardTitle>
          <CardDescription>
            Все ваши заказы в одном месте
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">У вас пока нет заказов</p>
              <Button className="mt-4" onClick={() => router.push('/')}>
                Перейти к покупкам
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">Заказ #{order.id}</span>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {order.total.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>

                    {order.items && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          Товары: {order.items.map(item =>
                            `${item.product.name} (${item.quantity} шт.)`
                          ).join(', ')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Button
          variant="destructive"
          onClick={() => {
            logout()
            router.push('/')
          }}
        >
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  )
}