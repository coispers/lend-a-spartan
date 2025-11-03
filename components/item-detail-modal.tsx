"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Star, MapPin, Clock, Shield } from "lucide-react"

interface ItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: any
  onRequestBorrow: () => void
  canEdit?: boolean
  onEdit?: () => void
  canRequestBorrow?: boolean
}

export default function ItemDetailModal({
  isOpen,
  onClose,
  item,
  onRequestBorrow,
  canEdit = false,
  onEdit,
  canRequestBorrow = true,
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null

  const descriptionText = typeof item.description === "string" ? item.description.trim() : ""

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-background/80 rounded-full p-2 text-muted-foreground hover:text-foreground z-10"
          >
            <X size={24} />
          </button>

          <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-64 object-cover" />
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{item.title}</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star size={18} className="fill-accent text-accent" />
                  <span className="font-semibold">{item.lender.rating}</span>
                </div>
                <span className="text-muted-foreground">({item.lender.reviews} reviews)</span>
              </div>
            </div>
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
              {item.condition}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold">{item.campus}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Availability</p>
                <p className="font-semibold">{item.availability}</p>
              </div>
            </div>
            {item.deposit && (
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Deposit</p>
                  <p className="font-semibold">Required</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Description</h3>
            {descriptionText ? (
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{descriptionText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No description provided yet.</p>
            )}
          </div>

          <div className="mb-6 pb-6 border-b border-border">
            <h3 className="font-semibold mb-2">Lender Information</h3>
            <p className="text-foreground font-medium mb-1">{item.lender.name}</p>
            <p className="text-sm text-muted-foreground">Trusted member of the community</p>
          </div>

          <div className="space-y-3">
            {canEdit && typeof onEdit === "function" && (
              <Button onClick={onEdit} className="w-full py-6 text-lg" variant="outline">
                Edit Item Details
              </Button>
            )}
            {canRequestBorrow ? (
              <Button
                onClick={onRequestBorrow}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg"
              >
                Request to Borrow
              </Button>
            ) : (
              <div className="w-full text-center text-sm text-muted-foreground border border-dashed border-border rounded-md px-4 py-3">
                You listed this item. Borrowers will see the request button here.
              </div>
            )}
            <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
