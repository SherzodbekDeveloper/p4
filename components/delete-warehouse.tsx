"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"
import { useState } from "react"
import { db } from "@/lib/firebase"
import { deleteDoc, doc } from "firebase/firestore"
import { useAuth } from "@/hooks/userFirestore"
import { toast } from "sonner"

interface DeleteWarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouseId: string
  warehouseName: string
}

export function DeleteWarehouseDialog({ open, onOpenChange, warehouseId, warehouseName }: DeleteWarehouseDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!user) {
      toast.error("Foydalanuvchi aniqlanmadi")
      return
    }
    try {
      setLoading(true)
      await deleteDoc(doc(db, "users", user.uid, "storage", warehouseId))
      toast.success(`"${warehouseName}" ombori o‘chirildi`)
      onOpenChange(false)
    } catch (err) {
      console.error("Omborni o‘chirishda xatolik:", err)
      toast.error("Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Omborni o&apos;chirish
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">"{warehouseName}"</span> omborini o‘chirmoqchimisiz?  
            <br />
            Bu amalni qaytarib bo&apos;lmaydi.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              "O‘chirilmoqda..."
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                O&apos;chirish
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
