"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, onSnapshot, doc, updateDoc, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import { ProductGrid } from "@/components/product-grid"
import { OrderSummary } from "@/components/order-summary"
import { WarehouseSelector } from "@/components/warehouse-selector"
import { AddWarehouseDialog } from "@/components/add-warehouse-dialog"
import type { Product, CartItem, Storage } from "@/types"
import { toast } from "sonner"
import { calculateOrderTotal, calculateTaxes, generateOrderId } from "@/utils/orderUtils"

export default function POSSystem() {
  const { user, loading: authLoading } = useAuth()

  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [storages, setStorages] = useState<Storage[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Real-time storages subscription
  useEffect(() => {
    if (!user?.uid) {
      setStorages([])
      setSelectedWarehouse("")
      return
    }

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "storage"),
      (snapshot) => {
        const storageList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Storage[]

        setStorages(storageList)

        // Auto-select first warehouse if none selected
        if (storageList.length > 0 && !selectedWarehouse) {
          setSelectedWarehouse(storageList[0].id)
        }
      },
      (error) => {
        console.error("Error fetching storages:", error)
        toast.error("Omborlarni yuklashda xatolik yuz berdi")
      },
    )

    return () => unsubscribe()
  }, [user?.uid, selectedWarehouse])

  useEffect(() => {
    if (!user?.uid || !selectedWarehouse) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)

    const productsRef = collection(db, "users", user.uid, "storage", selectedWarehouse, "stock")
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ProductName: data.ProductName || "",
            ProductPrice: data.ProductPrice || 0,
            ProductTotalPrice: data.ProductTotalPrice || 0,
            ProductSellPrice: data.ProductSellPrice || 0,
            description: data.description || "",
            quantity: data.quantity || 0,
            category: data.category || "",
            brend: data.brend || "",
            firstValue: data.firstValue || "",
            secondValue: data.secondValue || "",
            secondMeasureValue: data.secondMeasureValue || 0,
            img: data.img || "",
            expirationDate: data.expirationDate || "",
            code: data.code || "",
            barcode: data.barcode || 0,
            star: data.star || false,
            prefixTime: data.prefixTime || Date.now(),
            timestamp: data.timestamp?.toDate?.() || new Date(),
          } as Product
        })
        setProducts(productsData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching products:", error)
        toast.error("Mahsulotlarni yuklashda xatolik yuz berdi")
        setProducts([])
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [selectedWarehouse, user?.uid])

  const addToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) {
      toast.error("Mahsulot tugagan")
      return
    }

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id)
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1
        if (newQuantity > product.quantity) {
          toast.error("Omborda yetarli mahsulot yo'q")
          return prev
        }
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: newQuantity } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })

    toast.success(`${product.ProductName} savatchaga qo'shildi`)
  }, [])

  const updateCartItemQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        setCartItems((prev) => prev.filter((item) => item.id !== id))
        return
      }

      const product = products.find((p) => p.id === id)
      if (product && quantity > product.quantity) {
        toast.error("Omborda yetarli mahsulot yo'q")
        return
      }

      setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
    },
    [products],
  )

  const removeFromCart = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
    toast.success("Mahsulot savatchadan olib tashlandi")
  }, [])

  const confirmPayment = useCallback(async () => {
    if (!user?.uid || !selectedWarehouse || cartItems.length === 0) {
      toast.error("To’lovni amalga oshirish uchun barcha ma’lumotlar to’ldirilishi kerak")
      return
    }

    setIsProcessing(true)

    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.ProductSellPrice * item.quantity, 0)
      const taxes = calculateTaxes(subtotal)
      const discount = 0
      const total = calculateOrderTotal(subtotal, taxes, discount)

      const order = {
        id: generateOrderId(),
        items: cartItems,
        subtotal,
        taxes,
        discount,
        total,
        orderType: "takeaway" as const,
        table: "",
        timestamp: Timestamp.now(),
        status: "paid" as const,
      }

      await addDoc(collection(db, "users", user.uid, "orders"), order)

      const updatePromises = cartItems.map(async (item) => {
        const productRef = doc(db, "users", user.uid, "storage", selectedWarehouse, "stock", item.id)
        const currentProduct = products.find((p) => p.id === item.id)
        if (currentProduct) {
          const newQuantity = Math.max(0, currentProduct.quantity - item.quantity)
          await updateDoc(productRef, { quantity: newQuantity })
        }
      })

      await Promise.all(updatePromises)

      setCartItems([])
      toast.success("Buyurtma muvaffaqiyatli tasdiqlandi!")
    } catch (error) {
      console.error("Error confirming payment:", error)
      toast.error("Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setIsProcessing(false)
    }
  }, [user?.uid, selectedWarehouse, cartItems, products])

  const handleWarehouseChange = useCallback((warehouseId: string) => {
    setSelectedWarehouse(warehouseId)
    setCartItems([])
  }, [])

  const handleAddWarehouse = useCallback(() => {
    setWarehouseDialogOpen(true)
  }, [])





  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <WarehouseSelector
          storages={storages}
          selectedWarehouse={selectedWarehouse}
          onWarehouseChange={handleWarehouseChange}
          onAddWarehouse={handleAddWarehouse}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ProductGrid products={products} loading={loading} onAddToCart={addToCart} />
        <OrderSummary
          cartItems={cartItems}
          onUpdateQuantity={updateCartItemQuantity}
          onRemoveItem={removeFromCart}
          onConfirmPayment={confirmPayment}
          isProcessing={isProcessing}
        />
      </div>

      <AddWarehouseDialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen} />
    </div>
  )
}
