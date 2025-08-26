"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from "@/context/auth-context"
import { useRouter } from 'next/navigation'
import { Product, Storage } from '@/types'

export default function ProductsPage() {
  const { user, loading } = useAuth()
  const [storages, setStorages] = useState<Storage[]>([])
  const [selectedStorage, setSelectedStorage] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false)
  const [newStorageName, setNewStorageName] = useState("")
  const router = useRouter()

  const [form, setForm] = useState({
    ProductName: "",
    ProductPrice: 0,
    ProductSellPrice: 0,
    ProductTotalPrice: 0,
    barcode: 0,
    brend: "",
    category: "",
    code: "",
    description: "",
    expirationDate: "",
    firstValue: "",
    img: "",
    prefixTime: new Date().getTime(),
    quantity: 0,
    secondMeasureValue: 0,
    secondValue: "",
    star: false,
  })

  if (!user) {
    router.push('/auth')
  }
  const addStorage = async () => {
    if (!newStorageName.trim()) {
      toast.error("Ombor nomini kiriting")
      return
    }
    if (!user) {
      toast.error("Foydalanuvchi aniqlanmadi")
      return
    }
    try {
      await addDoc(collection(db, "users", user.uid, "storage"), {
        name: newStorageName,
        timestamp: serverTimestamp(),
      })
      toast.success("Ombor qo‘shildi")
      setNewStorageName("")
      setIsStorageModalOpen(false)
    } catch (err) {
      console.error("Ombor qo‘shishda xatolik:", err)
      toast.error("Xatolik yuz berdi")
    }
  }

  useEffect(() => {
  if (!user) return
  const unsub = onSnapshot(
    collection(db, "users", user.uid, "storage"),
    (snapshot) => {
      const list = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Storage) 
      )
      setStorages(list)
    }
  )
  return () => unsub()
}, [user])


  useEffect(() => {
    if (!user || !selectedStorage) return
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "storage", selectedStorage, "stock"),
      (snapshot) => {
        const list = snapshot.docs.map(
          (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Product)
        )
        setProducts(list)
      }
    )
    return () => unsub()
  }, [user, selectedStorage])


  const addProduct = async () => {
    if (!form.ProductName.trim()) {
      toast.error("Mahsulot nomi kiritilishi kerak")
      return
    }
    if (!selectedStorage) {
      toast.error("Avval ombor tanlang")
      return
    }
    if (!user) {
      toast.error("Foydalanuvchi aniqlanmadi")
      return
    }

    try {
      await addDoc(
        collection(db, "users", user.uid, "storage", selectedStorage, "stock"),
        {
          ...form,
          timestamp: serverTimestamp(),
        }
      )
      toast.success("Mahsulot muvaffaqiyatli qo‘shildi")
      setForm({ ...form, ProductName: "", ProductPrice: 0, ProductSellPrice: 0, ProductTotalPrice: 0, quantity: 0 })
    } catch (err) {
      console.error("Xatolik:", err)
      toast.error("Mahsulot qo‘shishda xatolik yuz berdi")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? Number(value)
          : type === "checkbox"
            ? checked
            : value,
    }))
  }

  if (loading) return <p>Yuklanmoqda...</p>
  if (!user) return <p className="text-red-500">Iltimos, tizimga kiring</p>





  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mahsulotlar</h1>

      <div className="mb-4">
        <label className="block mb-2">Ombor tanlang</label>

        {storages.length === 0 ? (
          <Dialog open={isStorageModalOpen} onOpenChange={setIsStorageModalOpen}>
            <DialogTrigger asChild>
              <Button variant="default">Ombor qo‘shish</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi ombor qo‘shish</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Ombor nomi"
                value={newStorageName}
                onChange={(e) => setNewStorageName(e.target.value)}
              />
              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsStorageModalOpen(false)}>Bekor qilish</Button>
                <Button onClick={addStorage}>Qo‘shish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Omborni tanlang</option>
            {storages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>


      {/* Forma */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <label className="col-span-2">
          Mahsulot nomi
          <input
            name="ProductName"
            value={form.ProductName}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Sotib olish narxi
          <input
            type="number"
            name="ProductPrice"
            value={form.ProductPrice}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Sotish narxi
          <input
            type="number"
            name="ProductSellPrice"
            value={form.ProductSellPrice}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Umumiy narx
          <input
            type="number"
            name="ProductTotalPrice"
            value={form.ProductTotalPrice}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Shtrix kod
          <input
            type="number"
            name="barcode"
            value={form.barcode}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Brend
          <input
            name="brend"
            value={form.brend}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Kategoriya
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Kod
          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label className="col-span-2">
          Tavsif
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Amal qilish muddati
          <input
            type="date"
            name="expirationDate"
            value={form.expirationDate}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Birinchi qiymat
          <input
            name="firstValue"
            value={form.firstValue}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Rasm URL
          <input
            name="img"
            value={form.img}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Miqdor
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Ikkinchi o‘lchov qiymati
          <input
            type="number"
            name="secondMeasureValue"
            value={form.secondMeasureValue}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label>
          Ikkinchi qiymat
          <input
            name="secondValue"
            value={form.secondValue}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </label>

        <label className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            name="star"
            checked={form.star}
            onChange={handleChange}
          />
          Yulduzcha belgisi
        </label>

        <button
          onClick={addProduct}
          className="bg-blue-600 text-white p-2 rounded col-span-2"
        >
          Qo‘shish
        </button>
      </div>

      {/* Mahsulotlar ro‘yxati */}
      {loading ? (
        <p>Yuklanmoqda...</p>
      ) : products.length === 0 ? (
        <p>Mahsulot yo‘q</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="border p-3 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{p.ProductName}</p>
                <p className="text-sm text-gray-600">
                  {p.ProductSellPrice} so‘m ({p.quantity} dona)
                </p>
              </div>
              <p>{p.category}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
