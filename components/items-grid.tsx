"use client"

import ItemCard from "@/components/item-card"
import { Card } from "@/components/ui/card"

interface ItemsGridProps {
  items: any[]
  onItemClick: (item: any) => void
  isLoading?: boolean
}

export default function ItemsGrid({ items, onItemClick, isLoading }: ItemsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-64 bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-2">No items found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} />
      ))}
    </div>
  )
}
