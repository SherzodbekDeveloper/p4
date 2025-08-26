"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { useAuth } from "@/hooks/userFirestore"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react"
import { useState, useEffect } from "react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouseId: string
  warehouseName: string
}

export function RenameWarehouseDialog({ open, onOpenChange, warehouseId, warehouseName }: Props) {
  const { user } = useAuth()
  const [name, setName] = useState(warehouseName)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setName(warehouseName)
  }, [open, warehouseName])

  const handleRename = async () => {
    if (!user || !name.trim()) return
    try {
      setLoading(true)
      await updateDoc(doc(db, "users", user.uid, "storage", warehouseId), { name: name.trim() })
      toast.success("Ombor nomi o‘zgartirildi")
      onOpenChange(false)
    } catch (err) {
      toast.error("Nomni o‘zgartirishda xatolik")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" /> Ombor nomini o&apos;zgartirish
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Yangi ombor nomi"
            disabled={loading}
            autoFocus
          />
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Bekor qilish
          </Button>
          <Button onClick={handleRename} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
