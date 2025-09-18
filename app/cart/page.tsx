'use client'

import { useState } from 'react'
import { API_URL } from '@/lib/config'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCartStore } from '@/lib/stores/cart-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (!isAuthenticated()) {
      toast({
        title: 'Необходима авторизация',
        description: 'Войдите в систему для оформления заказа',
        variant: 'destructive',
      })
      router.push('/login')
      return
    }

    if (items.length === 0) {
      toast({
        title: 'Корзина пуста',
        description: 'Добавьте товары для оформления заказа',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          customerInfo,
        }),
      })

      if (response.ok) {
        clearCart()
        toast({
          title: 'Заказ оформлен',
          description: 'Спасибо за покупку! Мы свяжемся с вами в ближайшее время.',
        })
        router.push('/profile')
      } else {
        throw new Error('Ошибка при оформлении заказа')
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось оформить заказ. Попробуйте позже.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Корзина пуста</h2>
            <p className="text-gray-600 mb-4">
              Добавьте товары, чтобы начать покупки
            </p>
            <Link href="/">
              <Button>
                Перейти к покупкам
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Корзина</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingBag className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-lg font-bold text-primary">
                      {item.price.toLocaleString('ru-RU')} ₽
                    </p>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="px-3 py-1 min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Оформление заказа</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated() && (
                <>
                  <div>
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="Ваше имя"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="+7 (999) 999-99-99"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="address">Адрес доставки</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  placeholder="Город, улица, дом"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Товары:</span>
                  <span>{getTotalPrice().toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Доставка:</span>
                  <span className="text-green-600">Бесплатно</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Итого:</span>
                  <span>{getTotalPrice().toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  'Оформляем заказ...'
                ) : (
                  <>
                    Оформить заказ
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {!isAuthenticated() && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-3">
                  Уже есть аккаунт?
                </p>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    Войти
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}