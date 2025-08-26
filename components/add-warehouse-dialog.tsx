"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { db } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/userFirestore"
import { toast } from "sonner"
import { Loader2, Warehouse } from "lucide-react"

interface AddWarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddWarehouseDialog({ open, onOpenChange }: AddWarehouseDialogProps) {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setName("")
    }
  }, [open])

  const handleAdd = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      toast.error("Ombor nomini kiriting")
      return
    }

    if (trimmedName.length < 2) {
      toast.error("Ombor nomi kamida 2 ta belgidan iborat bo'lishi kerak")
      return
    }

    if (!user) {
      toast.error("Foydalanuvchi aniqlanmadi")
      return
    }

    try {
      setLoading(true)
      await addDoc(collection(db, "users", user.uid, "storage"), {
        name: trimmedName,
        timestamp: serverTimestamp(),
      })

      toast.success(`"${trimmedName}" ombori muvaffaqiyatli qo'shildi`)
      setName("")
      onOpenChange(false)
    } catch (error) {
      console.error("Ombor qo'shishda xatolik:", error)
      toast.error("Ombor qo'shishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && name.trim()) {
      handleAdd()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Yangi ombor qo'shish
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse-name">Ombor nomi</Label>
            <Input
              id="warehouse-name"
              placeholder="Masalan: Asosiy ombor, Filial ombori..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Bekor qilish
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim() || loading || !user}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? "Qo'shilmoqda..." : "Qo'shish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
