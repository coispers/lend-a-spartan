"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    description: string
    condition: string
    campus: string
    availability: string
    quantity: number
    deposit: boolean
    image?: string
  }) => Promise<boolean>
}

export default function CreateItemModal({ isOpen, onClose, onSubmit }: CreateItemModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [condition, setCondition] = useState("New")
  const [campus, setCampus] = useState("")
  const [availability, setAvailability] = useState("Available")
  const [quantity, setQuantity] = useState(1)
  const [deposit, setDeposit] = useState(false)
  const [image, setImage] = useState<string>()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  useEffect(() => {
    if (!isOpen) {
      setTitle("")
      setDescription("")
      setCondition("New")
      setCampus("")
      setAvailability("Available")
      setQuantity(1)
      setDeposit(false)
      setImage(undefined)
      setError("")
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    setError("")
    setLoading(true)

    try {
      const token = recaptchaRef.current?.getValue()
      if (!token) {
        throw new Error("Please complete the CAPTCHA verification")
      }
      recaptchaRef.current?.reset()

      if (!title.trim() || !campus.trim()) {
        throw new Error("Please fill in all required fields")
      }

      const success = await onSubmit({
        title: title.trim(),
        description: description.trim(),
        condition,
        campus: campus.trim(),
        availability,
        quantity,
        deposit,
        image,
      })

      if (success) {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 relative border border-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={24} />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">List an Item</h2>
          <p className="text-sm text-muted-foreground mt-2">Share your item with the community</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item name"
              disabled={loading}
              className="border border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              rows={4}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              disabled={loading}
            >
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Campus</label>
            <Input
              type="text"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              placeholder="Campus location"
              disabled={loading}
              className="border border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              disabled={loading}
            >
              <option value="Available">Available</option>
              <option value="Coming Soon">Coming Soon</option>
              <option value="Limited">Limited</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              disabled={loading}
              className="border border-border"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={deposit}
              onChange={(e) => setDeposit(e.target.checked)}
              disabled={loading}
              id="deposit"
              className="h-4 w-4"
            />
            <label htmlFor="deposit" className="text-sm font-medium">
              Require Deposit
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
            <Input
              type="url"
              value={image || ""}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={loading}
              className="border border-border"
            />
          </div>

          <div className="flex justify-center mb-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
              size="normal"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 font-medium"
          >
            {loading ? "Creating..." : "Create Listing"}
          </Button>
        </div>
      </Card>
    </div>
  )
}