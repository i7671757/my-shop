'use client'

import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/config'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCartStore } from '@/lib/stores/cart-store'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  inStock: boolean
  createdAt: Date
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCartStore()
  const { toast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        toast({
          title: 'Ошибка',
          description: 'Товар не найден',
          variant: 'destructive',
        })
        router.push('/')
      }
    } catch (error) {
      console.error('Ошибка загрузки товара:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить товар',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    if (!product.inStock) {
      toast({
        title: 'Товар недоступен',
        description: 'Этот товар временно отсутствует на складе',
        variant: 'destructive',
      })
      return
    }

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      })
    }

    toast({
      title: 'Добавлено в корзину',
      description: `${product.name} (${quantity} шт.) добавлен в корзину`,
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
            <div className="h-10 bg-gray-100 rounded animate-pulse w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="overflow-hidden">
          <div className="relative h-96 md:h-[500px] bg-gray-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Package size={64} />
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-2xl">
                  Нет в наличии
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {product.description && (
              <p className="text-gray-600 mt-4">{product.description}</p>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-3xl font-bold">
              {product.price.toLocaleString('ru-RU')} ₽
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!product.inStock}
                >
                  -
                </Button>
                <span className="px-4 py-2 min-w-[50px] text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!product.inStock}
                >
                  +
                </Button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                size="lg"
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Добавить в корзину
              </Button>
            </div>

            {product.inStock ? (
              <p className="text-green-600 font-medium">✓ В наличии</p>
            ) : (
              <p className="text-red-600 font-medium">✗ Нет в наличии</p>
            )}
          </div>

          <Card className="p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Информация о доставке</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Доставка по России от 2 дней</li>
              <li>• Самовывоз из пункта выдачи - бесплатно</li>
              <li>• Курьерская доставка - от 300 ₽</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}