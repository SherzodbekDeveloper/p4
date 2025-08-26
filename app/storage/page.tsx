"use client"

import { useEffect, useState, useMemo, use } from "react"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  type DocumentData,
  type CollectionReference,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore"
import type { Product, Storage } from "@/types"
import { useAuth } from "@/hooks/userFirestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddWarehouseDialog } from "@/components/add-warehouse-dialog"
import {
  Search,
  Package,
  DollarSign,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Warehouse,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteWarehouseDialog } from "@/components/delete-warehouse"
import { RenameWarehouseDialog } from "@/components/rename-warehouse"

import { toast } from "sonner"
import { useRouter } from 'next/navigation'

export default function EnhancedStoragePage() {
  const { user } = useAuth()
  const [storages, setStorages] = useState<Storage[]>([])
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(
      query(
        collection(db, `users/${user.uid}/storage`) as CollectionReference<DocumentData>,
        orderBy("timestamp", "desc"),
      ),
      (querySnapshot) => {
        const storageList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as { name: string; timestamp?: string }),
        }))
        setStorages(storageList)
        if (storageList.length > 0 && !selectedStorage) {
          setSelectedStorage(storageList[0].id)
        }
      },
      (error) => {
        console.error("Error fetching storages:", error)
        toast.error("Omborlarni yuklashda xatolik")
      },
    )

    return () => unsubscribe()
  }, [user, selectedStorage])



  useEffect(() => {
    if (!user || !selectedStorage) return

    setLoading(true)
    const unsubscribe = onSnapshot(
      collection(db, `users/${user.uid}/storage/${selectedStorage}/stock`) as CollectionReference<DocumentData>,
      (querySnapshot) => {
        const productList = querySnapshot.docs.map((doc) => ({
          ...(doc.data() as Omit<Product, "id">),
          id: doc.id,
        }))
        setProducts(productList)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching products:", error)
        toast.error("Mahsulotlarni yuklashda xatolik")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user, selectedStorage])

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brend.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.ProductName.localeCompare(b.ProductName)
        case "quantity":
          return (b.quantity || 0) - (a.quantity || 0)
        case "price":
          return b.ProductPrice - a.ProductPrice
        case "sellPrice":
          return b.ProductSellPrice - a.ProductSellPrice
        default:
          return 0
      }
    })
  }, [products, searchTerm, categoryFilter, sortBy])

  const statistics = useMemo(() => {
    const totalProducts = filteredAndSortedProducts.length
    const totalQuantity = filteredAndSortedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
    const totalBuyPrice = filteredAndSortedProducts.reduce((sum, p) => sum + p.ProductPrice * (p.quantity || 0), 0)
    const totalSellPrice = filteredAndSortedProducts.reduce((sum, p) => sum + p.ProductSellPrice * (p.quantity || 0), 0)
    const potentialProfit = totalSellPrice - totalBuyPrice
    const profitMargin = totalBuyPrice > 0 ? (potentialProfit / totalBuyPrice) * 100 : 0

    return {
      totalProducts,
      totalQuantity,
      totalBuyPrice,
      totalSellPrice,
      potentialProfit,
      profitMargin,
    }
  }, [filteredAndSortedProducts])

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map((p) => p.category))]
    return uniqueCategories.filter(Boolean)
  }, [products])

  const handleRefresh = async () => {
    if (!user || !selectedStorage) return

    setRefreshing(true)
    try {
      const querySnapshot = await getDocs(
        collection(db, `users/${user.uid}/storage/${selectedStorage}/stock`) as CollectionReference<DocumentData>,
      )
      const productList = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<Product, "id">),
        id: doc.id,
      }))
      setProducts(productList)
      toast.success("Ma'lumotlar yangilandi")
    } catch (error) {
      console.error("Error refreshing:", error)
      toast.error("Yangilashda xatolik")
    } finally {
      setRefreshing(false)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ["№", "Mahsulot nomi", "Kategoriya", "Brend", "Qoldiq", "Tannarx", "Sotuv narx"],
      ...filteredAndSortedProducts.map((p, idx) => [
        idx + 1,
        p.ProductName,
        p.category,
        p.brend,
        `${p.quantity} ${p.firstValue}`,
        `${p.ProductPrice} UZS`,
        `${p.ProductSellPrice} UZS`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `storage-${selectedStorage}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Ma'lumotlar eksport qilindi")
  }

    const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(
      query(
        collection(db, `users/${user.uid}/storage`) as CollectionReference<DocumentData>,
        orderBy("timestamp", "desc"),
      ),
      (querySnapshot) => {
        const storageList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as { name: string; timestamp?: any }),
        }))
        setStorages(storageList)
        if (storageList.length > 0 && !selectedStorage) {
          setSelectedStorage(storageList[0].id)
        }
      },
      (error) => {
        console.error("Error fetching storages:", error)
        toast.error("Omborlarni yuklashda xatolik")
      },
    )
    return () => unsubscribe()
  }, [user, selectedStorage])

  useEffect(() => {
    if (!user || !selectedStorage) return
    setLoading(true)
    const unsubscribe = onSnapshot(
      collection(db, `users/${user.uid}/storage/${selectedStorage}/stock`) as CollectionReference<DocumentData>,
      (querySnapshot) => {
        const productList = querySnapshot.docs.map((doc) => ({
          ...(doc.data() as Omit<Product, "id">),
          id: doc.id,
        }))
        setProducts(productList)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching products:", error)
        toast.error("Mahsulotlarni yuklashda xatolik")
        setLoading(false)
      },
    )
    return () => unsubscribe()
  }, [user, selectedStorage])

  const selectedStorageName = storages.find((s) => s.id === selectedStorage)?.name || "Ombor"

 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
    <div className="container mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Omborlar</h1>
          <p className="text-muted-foreground">
            {selectedStorageName} - {statistics.totalProducts} mahsulot
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Yangilash
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredAndSortedProducts.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Eksport
          </Button>
        </div>
      </div>

      {/* Statistikalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" /> Mahsulotlar
            </p>
            <div className="text-2xl font-bold mt-2">{statistics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Jami: {statistics.totalQuantity}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Jami tannarx
            </p>
            <div className="text-2xl font-bold mt-2">{statistics.totalBuyPrice.toLocaleString()} UZS</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Sotuv narxi
            </p>
            <div className="text-2xl font-bold mt-2">{statistics.totalSellPrice.toLocaleString()} UZS</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Potentsial foyda
            </p>
            <div className="text-2xl font-bold text-green-600 mt-2">{statistics.potentialProfit.toLocaleString()} UZS</div>
            <p className="text-xs text-muted-foreground">Margin: {statistics.profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
       <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm lg:col-span-1 pt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" /> Omborlar
                </CardTitle>
                <Button size="sm" onClick={() => setIsStorageModalOpen(true)}>
                  Qo&apos;shish
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {storages.map((storage) => (
                <div
                  key={storage.id}
                  className={`flex items-center justify-between cursor-pointer p-3 rounded-lg transition-colors ${
                    selectedStorage === storage.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedStorage(storage.id)}
                >
                  <div>
                    <div className="font-medium">{storage.name}</div>
                  </div>

                  {/* uch nuqta menyu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedWarehouse(storage)
                          setRenameOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Nomini o&apos;zgartirish
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedWarehouse(storage)
                          setDeleteOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> O&apos;chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {storages.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Ombor mavjud emas</p>
              )}
            </CardContent>
          </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm pb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Mahsulot yoki brend bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Kategoriya" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Saralash" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom bo&apos;yicha</SelectItem>
                    <SelectItem value="quantity">Miqdor bo&apos;yicha</SelectItem>
                    <SelectItem value="price">Tannarx bo&apos;yicha</SelectItem>
                    <SelectItem value="sellPrice">Sotuv narxi bo&apos;yicha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Yuklanmoqda...
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] ">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-4 text-left font-medium">№</th>
                        <th className="p-4 text-left font-medium">Mahsulot</th>
                        <th className="p-4 text-left font-medium">Kategoriya</th>
                        <th className="p-4 text-left font-medium">Brend</th>
                        <th className="p-4 text-left font-medium">Qoldiq</th>
                        <th className="p-4 text-left font-medium">Tannarx</th>
                        <th className="p-4 text-left font-medium">Sotuv narx</th>
                        <th className="p-4 text-left font-medium">Foyda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedProducts.map((product, idx) => {
                        const profit =
                          (product.ProductSellPrice - product.ProductPrice) *
                          (product.quantity || 0)
                        const profitPercentage =
                          product.ProductPrice > 0
                            ? ((product.ProductSellPrice - product.ProductPrice) / product.ProductPrice) * 100
                            : 0

                        return (
                          <tr key={product.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">{idx + 1}</td>
                            <td className="p-4">
                              <div className="font-medium">{product.ProductName}</div>
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary">{product.category}</Badge>
                            </td>
                            <td className="p-4">{product.brend}</td>
                            <td className="p-4">
                              <div className="font-medium">
                                {product.quantity} {product.firstValue}
                              </div>
                            </td>
                            <td className="p-4">{product.ProductPrice.toLocaleString()} UZS</td>
                            <td className="p-4">{product.ProductSellPrice.toLocaleString()} UZS</td>
                            <td className="p-4">
                              <div
                                className={`font-medium ${
                                  profit >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {profit.toLocaleString()} UZS
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {profitPercentage.toFixed(1)}%
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {filteredAndSortedProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || categoryFilter !== "all"
                          ? "Qidiruv bo'yicha mahsulot topilmadi"
                          : "Mahsulot mavjud emas"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddWarehouseDialog open={isStorageModalOpen} onOpenChange={setIsStorageModalOpen} />
      {selectedWarehouse && (
          <>
            <DeleteWarehouseDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              warehouseId={selectedWarehouse.id}
              warehouseName={selectedWarehouse.name}
            />
            <RenameWarehouseDialog
              open={renameOpen}
              onOpenChange={setRenameOpen}
              warehouseId={selectedWarehouse.id}
              warehouseName={selectedWarehouse.name}
            />
          </>
        )}

    </div>
  </div>
)

}
