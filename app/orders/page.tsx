"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, Timestamp, query, orderBy, onSnapshot } from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  AlertCircle,
  Utensils,
  Truck,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Order } from '@/types'



export default function EnhancedOrdersReport() {
  const { user, loading: authLoading } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [orderTypeFilter, setOrderTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    setError(null)

    if (!user) {
      setOrders([])
      setFilteredOrders([])
      setLoading(false)
      return
    }

    setLoading(true)
    const ordersRef = collection(db, "users", user.uid, "orders")
    const q = query(ordersRef, orderBy("timestamp", "desc"))

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Order[] = snap.docs.map((d) => {
          const data = d.data() as any
          return {
            id: d.id,
            items: data.items || [],
            subtotal: Number(data.subtotal) || 0,
            taxes: Number(data.taxes) || 0,
            discount: Number(data.discount) || 0,
            total: Number(data.total) || 0,
            orderType: data.orderType || "takeaway",
            table: data.table || "",
            status: data.status || "pending",
            timestamp: data.timestamp || Timestamp.now(),
          }
        })
        setOrders(list)
        setFilteredOrders(list)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError("Failed to fetch orders from Firebase")
        setLoading(false)
      }
    )

    return () => unsub()
  }, [user?.uid])

  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(s) ||
          order.status.toLowerCase().includes(s) ||
          order.items.some(
            (item) =>
              item.name.toLowerCase().includes(s) ||
              item.category.toLowerCase().includes(s) ||
              item.brand.toLowerCase().includes(s),
          ),
      )
    }

    if (statusFilter !== "all") filtered = filtered.filter((o) => o.status === statusFilter)
    if (orderTypeFilter !== "all") filtered = filtered.filter((o) => o.orderType === orderTypeFilter)

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter((o) => o.timestamp.toDate() >= filterDate)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter((o) => o.timestamp.toDate() >= filterDate)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter((o) => o.timestamp.toDate() >= filterDate)
          break
      }
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, orderTypeFilter, dateFilter])

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0)
  const totalDiscounts = filteredOrders.reduce((sum, o) => sum + o.discount, 0)
  const averageOrderValue = filteredOrders.length ? totalRevenue / filteredOrders.length : 0
  const totalItems = filteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0,
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getOrderTypeBadge = (orderType: string) => {
    switch (orderType) {
      case "takeaway":
        return (
          <Badge variant="outline" className="gap-1">
            <ShoppingCart className="h-3 w-3" />
            Takeaway
          </Badge>
        )
      case "delivery":
        return (
          <Badge variant="outline" className="gap-1">
            <Truck className="h-3 w-3" />
            Delivery
          </Badge>
        )
      default:
        return <Badge variant="outline">{orderType}</Badge>
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Order ID", "Date", "Table", "Order Type", "Items Count", "Subtotal", "Taxes", "Discount", "Total", "Status",
    ]
    const csv = [
      headers.join(","),
      ...filteredOrders.map((o) =>
        [
          o.id,
          o.timestamp.toDate().toLocaleDateString(),
          o.orderType,
          o.items.reduce((s, i) => s + i.quantity, 0),
          o.subtotal.toFixed(2),
          o.taxes.toFixed(2),
          o.discount.toFixed(2),
          o.total.toFixed(2),
          o.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pos-orders-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const showLoading = authLoading || loading

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-8">

        {!user && !showLoading && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Buyurtmalarni ko‘rish uchun tizimga kiring
            </AlertDescription>
          </Alert>
        )}

        {showLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {!showLoading && user && (
          <>
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Buyurtmalar</h1>
                <p className="text-slate-600 mt-1">Restoran buyurtmalarini kuzatish va boshqarish</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportToCSV} variant="outline" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  CSV yuklab olish
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{filteredOrders.length}</div>
                      <p className="text-sm text-slate-600">Jami buyurtmalar</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} so'm</div>
                      <p className="text-sm text-slate-600">Umumiy tushum</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{averageOrderValue.toLocaleString()} so'm</div>
                      <p className="text-sm text-slate-600">O‘rtacha buyurtma qiymati</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{totalItems}</div>
                      <p className="text-sm text-slate-600">Sotilgan mahsulotlar</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Qidiruv va filterlar */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Buyurtmalar, stollar yoki mahsulotlarni qidiring..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-slate-200">
                      <SelectValue placeholder="Holat bo‘yicha filtrlash" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha holatlar</SelectItem>
                      <SelectItem value="pending">Kutilmoqda</SelectItem>
                      <SelectItem value="paid">To‘langan</SelectItem>
                      <SelectItem value="canceled">Bekor qilingan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-slate-200">
                      <SelectValue placeholder="Turi bo‘yicha filtrlash" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha turlari</SelectItem>
                      <SelectItem value="takeaway">Olib ketish</SelectItem>
                      <SelectItem value="delivery">Yetkazib berish</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-slate-200">
                      <SelectValue placeholder="Sana bo‘yicha filtrlash" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha vaqt</SelectItem>
                      <SelectItem value="today">Bugun</SelectItem>
                      <SelectItem value="week">Oxirgi 7 kun</SelectItem>
                      <SelectItem value="month">Oxirgi 30 kun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm pt-4">
              <CardHeader className="border-b border-slate-200 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-900">Buyurtmalar ({filteredOrders.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[450px] min-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow className="border-slate-200 hover:bg-slate-50/50">
                        <TableHead className="font-semibold text-slate-700">Buyurtma ID</TableHead>
                        <TableHead className="font-semibold text-slate-700">Sana & Vaqt</TableHead>
                        <TableHead className="font-semibold text-slate-700">Turi</TableHead>
                        <TableHead className="font-semibold text-slate-700">Mahsulotlar</TableHead>
                        <TableHead className="font-semibold text-slate-700">Oraliq summa</TableHead>
                        <TableHead className="font-semibold text-slate-700">Chegirma</TableHead>
                        <TableHead className="font-semibold text-slate-700">Umumiy summa</TableHead>
                        <TableHead className="font-semibold text-slate-700">Holat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className="border-slate-200 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-mono text-sm font-medium text-slate-900">
                            #{order.id.slice(-8)}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {order.timestamp.toDate().toLocaleDateString("uz-UZ", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            <br />
                            <span className="text-xs text-slate-500">
                              {order.timestamp.toDate().toLocaleTimeString("uz-UZ", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </TableCell>
                          <TableCell>{getOrderTypeBadge(order.orderType)}</TableCell>
                          <TableCell className="text-slate-600">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} ta mahsulot
                          </TableCell>
                          <TableCell className="text-slate-600">{order.subtotal.toLocaleString()} so'm</TableCell>
                          <TableCell className="text-slate-600">-{order.discount.toLocaleString()} so'm</TableCell>
                          <TableCell className="font-semibold text-slate-900">
                            {order.total.toLocaleString()} so'm
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredOrders.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Buyurtmalar topilmadi</h3>
                    <p className="text-slate-500">
                      {searchTerm || statusFilter !== "all" || orderTypeFilter !== "all" || dateFilter !== "all"
                        ? "Ko‘proq natija olish uchun filterlarni o‘zgartiring."
                        : "Hozircha buyurtmalar mavjud emas."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}