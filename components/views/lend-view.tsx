import { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { ListItemFormState } from "@/types/interfaces"
import { Plus, Save } from "lucide-react"

interface LendViewProps {
  listItemError: string | null
  listItemSuccess: string | null
  isEditingListing: boolean
  onCancelEdit: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  listItemForm: ListItemFormState
  setListItemForm: Dispatch<SetStateAction<ListItemFormState>>
  imagePreviewUrl: string | null
  setImagePreviewUrl: Dispatch<SetStateAction<string | null>>
  listItemExistingImage: string | null
  isSubmittingItem: boolean
}

export function LendView({
  listItemError,
  listItemSuccess,
  isEditingListing,
  onCancelEdit,
  onSubmit,
  listItemForm,
  setListItemForm,
  imagePreviewUrl,
  setImagePreviewUrl,
  listItemExistingImage,
  isSubmittingItem,
}: LendViewProps) {
  const clearPreview = (next: string | null) => {
    setImagePreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return next
    })
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setListItemForm((prev) => ({ ...prev, imageFile: file }))
    if (!file) {
      clearPreview(isEditingListing ? listItemExistingImage : null)
      event.target.value = ""
      return
    }
    clearPreview(URL.createObjectURL(file))
    event.target.value = ""
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-foreground mb-6">List an Item to Lend</h2>
      <Card className="p-6 border border-border">
        <form className="space-y-4" onSubmit={onSubmit}>
          {isEditingListing && (
            <div className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-primary">
              <div className="font-medium">You&apos;re editing an existing listing.</div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-primary/80">
                <span>Adjust the item details and save to publish your changes.</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancelEdit}
                  className="text-primary hover:text-primary"
                >
                  Cancel edit
                </Button>
              </div>
            </div>
          )}
          {listItemError && <p className="text-sm text-red-600">{listItemError}</p>}
          {listItemSuccess && <p className="text-sm text-green-600">{listItemSuccess}</p>}
          <div>
            <label className="block text-sm font-medium mb-2">Item Title</label>
            <Input
              value={listItemForm.title}
              onChange={(event) => setListItemForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="e.g., Laptop Stand"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              value={listItemForm.category}
              onChange={(event) => setListItemForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option value="Electronics">Electronics</option>
              <option value="School Supplies">School Supplies</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Books">Books</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              rows={4}
              placeholder="Describe the item condition and details..."
              value={listItemForm.description}
              onChange={(event) => setListItemForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <Input
                type="number"
                min={1}
                value={listItemForm.quantity}
                onChange={(event) =>
                  setListItemForm((prev) => ({
                    ...prev,
                    quantity: Number.isFinite(Number(event.target.value))
                      ? Math.max(1, Math.floor(Number(event.target.value)))
                      : prev.quantity,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Condition</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={listItemForm.condition}
                onChange={(event) => setListItemForm((prev) => ({ ...prev, condition: event.target.value }))}
              >
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Campus / Location</label>
            <Input
              placeholder="e.g., Main Campus"
              value={listItemForm.campus}
              onChange={(event) => setListItemForm((prev) => ({ ...prev, campus: event.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Item Image (optional)</label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreviewUrl && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <img
                  src={imagePreviewUrl}
                  alt="Selected item preview"
                  className="w-full h-48 object-cover rounded border border-border"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deposit"
              className="rounded"
              checked={listItemForm.deposit}
              onChange={(event) => setListItemForm((prev) => ({ ...prev, deposit: event.target.checked }))}
            />
            <label htmlFor="deposit" className="text-sm">
              Require deposit for this item
            </label>
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmittingItem}
          >
            {isEditingListing ? <Save size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
            {isSubmittingItem
              ? isEditingListing
                ? "Saving..."
                : "Listing..."
              : isEditingListing
                ? "Save Changes"
                : "List Item"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
