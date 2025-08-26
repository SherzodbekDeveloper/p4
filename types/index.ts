import type { Timestamp } from "firebase/firestore"

export interface Product {
  id: string
  ProductName: string
  ProductPrice: number
  ProductTotalPrice: number
  ProductSellPrice: number
  description: string
  quantity: number
  category: string
  brend: string
  firstValue: string
  secondValue: string
  secondMeasureValue: number
  img: string
  expirationDate: string
  code: string
  barcode: number
  star: boolean
  prefixTime: number
  timestamp: Timestamp
}


export interface CartItem extends Product {
  quantity: number
}

export interface Storage {
  id: string

  name: string
  timestamp?: Timestamp
}

export interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  taxes: number
  discount: number
  total: number
  orderType: "takeaway" | "delivery"
  status: "pending" | "paid" | "canceled"
  timestamp: Timestamp
}




export interface UserData {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  currency: string
  createdAt: string
}

export interface User {
  uid: string
  email?: string
  displayName?: string
}


type OrderItem = {
  id: string
  name: string
  category: string
  brand: string
  description: string
  image: string
  quantity: number
  purchasePrice: number
  sellingPrice: number
  barcode: string
  sku: string
  expirationDate: Timestamp
}

