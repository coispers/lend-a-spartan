"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, MapPin, Package, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ItemCardProps {
  item: any
  onClick: () => void
  canDelete?: boolean
  onDelete?: () => void
  isDeleting?: boolean
  isRemoving?: boolean
}

export default function ItemCard({ item, onClick, canDelete, onDelete, isDeleting, isRemoving }: ItemCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden cursor-pointer border border-border transition-all duration-300 ease-out hover:shadow-md",
        (isDeleting || isRemoving) && "pointer-events-none opacity-60",
        isRemoving && "scale-[0.97] translate-y-2 opacity-0"
      )}
    >
      <div className="relative h-48 bg-muted">
        <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded text-xs font-medium">
          {item.condition}
        </div>
        {canDelete && onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-3 left-3 h-8 w-8 rounded-full bg-destructive/90 hover:bg-destructive"
            disabled={isDeleting}
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="sr-only">Delete listing</span>
          </Button>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-foreground mb-3 line-clamp-2 text-sm">{item.title}</h3>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">{item.lender.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({item.lender.reviews})</span>
        </div>

        <p className="text-xs text-muted-foreground mb-3">{item.lender.name}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {item.campus}
          </span>
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <Package size={12} className="text-primary" />
            {item.quantity > 0 ? `${item.quantity} available` : "Out of stock"}
          </span>
        </div>
      </div>
    </Card>
  )
}
