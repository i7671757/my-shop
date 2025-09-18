'use client'

import { useState } from 'react'
import { API_URL } from '@/lib/config'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    inStock: true,
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      })

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Товар добавлен',
        })
        router.push('/admin/products')
      } else {
        throw new Error('Ошибка добавления товара')
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить товар',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Добавить новый товар</CardTitle>
          <CardDescription>
            Заполните информацию о новом товаре
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Название товара *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: iPhone 15 Pro"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Подробное описание товара"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="price">Цена (₽) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">Ссылка на изображение</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="inStock">В наличии</Label>
              <Switch
                id="inStock"
                checked={formData.inStock}
                onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Добавление...' : 'Добавить товар'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}