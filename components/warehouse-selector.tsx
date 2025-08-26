"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { Storage } from "@/types"

interface WarehouseSelectorProps {
  storages: Storage[]
  selectedWarehouse: string
  onWarehouseChange: (value: string) => void
  onAddWarehouse: () => void
}

export function WarehouseSelector({
  storages,
  selectedWarehouse,
  onWarehouseChange,
  onAddWarehouse,
}: WarehouseSelectorProps) {
  const handleValueChange = (value: string) => {
    if (value === "__new__") {
      onAddWarehouse()
    } else {
      onWarehouseChange(value)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Ombor:</label>
        <Select value={selectedWarehouse} onValueChange={handleValueChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Omborni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {storages.map((storage) => (
              <SelectItem key={storage.id} value={storage.id}>
                {storage.name}
              </SelectItem>
            ))}
            <SelectItem value="__new__" className="text-green-600 font-medium">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Yangi ombor qo&apos;shish
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
