"use client"

import { Card } from "@/components/ui/card"
import { Star, MapPin } from "lucide-react"

interface ItemCardProps {
  item: any
  onClick: () => void
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  return (
    <Card
      onClick={onClick}
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-border"
    >
      <div className="relative h-48 bg-muted">
        <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded text-xs font-medium">
          {item.condition}
        </div>
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

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={12} />
          {item.campus}
        </div>
      </div>
    </Card>
  )
}
