'use client'

import { useEffect, useState } from 'react'
import { API_URL } from '@/lib/config'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/lib/stores/auth-store'
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

export default function AdminProductsPage() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/')
      return
    }
    fetchProducts()
  }, [isAuthenticated, isAdmin, router])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      })

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Товар удален',
        })
        fetchProducts()
      } else {
        throw new Error('Ошибка удаления')
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить товар',
        variant: 'destructive',
      })
    }
  }

  if (!isAdmin()) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление товарами</h1>
          <p className="text-gray-600">Всего товаров: {products.length}</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить товар
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <p>Загрузка...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Товаров пока нет</p>
              <Link href="/admin/products/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первый товар
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Фото</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата добавления</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative w-12 h-12 bg-gray-100 rounded">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.price.toLocaleString('ru-RU')} ₽</TableCell>
                    <TableCell>
                      <Badge variant={product.inStock ? 'default' : 'secondary'}>
                        {product.inStock ? 'В наличии' : 'Нет в наличии'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(product.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}