"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, LayoutGrid, List } from "lucide-react"
import type { Product } from "@/types"
import Image from "next/image"
import { useState } from "react"

interface ProductGridProps {
  products: Product[]
  loading: boolean
  onAddToCart: (product: Product) => void
}

export function ProductGrid({ products = [], loading, onAddToCart }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"card" | "list">("card")

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex justify-end gap-2 mb-4">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div
          className={`grid ${viewMode === "card" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-6`}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="w-full h-40 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <p className="text-gray-500 font-medium">Mahsulotlar topilmadi</p>
      <p className="text-gray-400 text-sm mt-1">Ombor tanlangan bo'lsa ham mahsulotlar yo'q</p>
    </div>
  )

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
      <div className="relative">
        <Image
          src={product.img || "/placeholder.svg?height=200&width=300&query=product"}
          alt={product.ProductName}
          width={300}
          height={200}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <Badge
          variant={product.quantity > 0 ? "default" : "secondary"}
          className={`absolute top-2 right-2 ${
            product.quantity > 0 ? "bg-green-500 hover:bg-green-600" : "bg-gray-500"
          }`}
        >
          {product.quantity > 0 ? "Available" : "Out of Stock"}
        </Badge>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.ProductName}</h3>
            <p className="text-sm text-gray-600 mb-2">{product.category}</p>
            {product.brend && <p className="text-xs text-gray-500 mb-1">Brand: {product.brend}</p>}
            {product.code && <p className="text-xs text-gray-500 mb-1">SKU: {product.code}</p>}
          </div>
          <div className="text-right ml-2">
            <p className="text-sm text-gray-500">
              <span className="font-medium">{product.quantity}</span> {product.firstValue || "pcs"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">${product.ProductSellPrice.toFixed(2)}</span>
          <Button
            onClick={() => onAddToCart(product)}
            disabled={product.quantity <= 0}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add to Cart
          </Button>
        </div>
        {product.quantity <= 5 && product.quantity > 0 && (
          <p className="text-xs text-orange-600 mt-2 font-medium">Only {product.quantity} left in stock</p>
        )}
      </div>
    </div>
  )

  const ProductListItem = ({ product }: { product: Product }) => (
    <div className="flex items-center bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200">
      <Image
        src={product.img || "/placeholder.svg?height=80&width=100&query=product"}
        alt={product.ProductName}
        width={100}
        height={80}
        className="object-cover rounded-lg flex-shrink-0"
      />
      <div className="flex-1 ml-4 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{product.ProductName}</h3>
        <p className="text-sm text-gray-600">{product.category}</p>
        {product.brend && <p className="text-xs text-gray-500">Brand: {product.brend}</p>}
        <div className="flex items-center gap-4 mt-1">
          <span className="text-lg font-bold text-gray-900">${product.ProductSellPrice.toFixed(2)}</span>
          <span className="text-sm text-gray-500">
            {product.quantity} {product.firstValue || "pcs"}
          </span>
        </div>
        {product.quantity <= 5 && product.quantity > 0 && (
          <p className="text-xs text-orange-600 mt-1 font-medium">Only {product.quantity} left</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 ml-4">
        <Badge
          variant={product.quantity > 0 ? "default" : "secondary"}
          className={`${product.quantity > 0 ? "bg-green-500 hover:bg-green-600" : "bg-gray-500"}`}
        >
          {product.quantity > 0 ? "Available" : "Out of Stock"}
        </Badge>
        <Button
          onClick={() => onAddToCart(product)}
          disabled={product.quantity <= 0}
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-end gap-2 mb-6">
        <Button
          variant={viewMode === "card" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("card")}
          className="transition-all duration-200"
        >
          <LayoutGrid className="w-4 h-4 mr-1" />
          Card
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="transition-all duration-200"
        >
          <List className="w-4 h-4 mr-1" />
          List
        </Button>
      </div>

      {/* Products Grid/List */}
      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className={
            viewMode === "card"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {products.map((product) =>
            viewMode === "card" ? (
              <ProductCard key={product.id} product={product} />
            ) : (
              <ProductListItem key={product.id} product={product} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
