"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Minus, Plus } from "lucide-react"
import Image from "next/image"
import { formatCurrency } from "@/utils/orderUtils"
import type { CartItem } from "@/types"

interface OrderSummaryProps {
  cartItems: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onConfirmPayment: () => void
  isProcessing?: boolean
}

export function OrderSummary({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmPayment,
  isProcessing = false,
}: OrderSummaryProps) {
  const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.ProductSellPrice * item.quantity, 0), [cartItems])

  const itemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])

  const handleQuantityDecrease = (item: CartItem) => {
    onUpdateQuantity(item.id, item.quantity - 1)
  }

  const handleQuantityIncrease = (item: CartItem) => {
    onUpdateQuantity(item.id, item.quantity + 1)
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Buyurtma</h2>
          <span className="text-sm text-gray-500">{itemCount} ta mahsulot</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Savatcha bo&apos;sh</p>
            <p className="text-gray-400 text-xs mt-1">Mahsulot qo&apos;shish uchun mahsulotni tanlang</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
               
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm truncate">{item.ProductName}</h4>
                  <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 text-sm">
                      {formatCurrency(item.ProductSellPrice * item.quantity)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityDecrease(item)}
                        disabled={isProcessing}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityIncrease(item)}
                        disabled={isProcessing}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-600 h-6 w-6 p-0"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Mahsulotlar soni:</span>
            <span className="font-medium">{itemCount} ta</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Jami to&apos;lov:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <Button
          onClick={onConfirmPayment}
          disabled={cartItems.length === 0 || isProcessing}
          className="w-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isProcessing ? "Jarayon..." : "To'lovni tasdiqlash"}
        </Button>
      </div>
    </div>
  )
}
