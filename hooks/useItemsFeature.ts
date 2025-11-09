import { FormEvent, useCallback, useEffect, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { supabase } from "@/lib/supabaseclient"
import { mapItemRecord } from "@/lib/mappers"
import type {
  CurrentUserState,
  ListItemFormState,
  MarketplaceItem,
  UserMode,
} from "@/types/interfaces"

interface UseItemsFeatureOptions {
  currentUser: CurrentUserState | null
  showBanner: (message: string, type?: "success" | "error" | "info") => void
  userMode: UserMode
  setUserMode: Dispatch<SetStateAction<UserMode>>
}

interface UseItemsFeatureResult {
  items: MarketplaceItem[]
  setItems: Dispatch<SetStateAction<MarketplaceItem[]>>
  itemsLoading: boolean
  itemsError: string | null
  fetchItems: () => Promise<void>
  updateItemQuantity: (itemId: string, adjustment: number) => Promise<void>
  showItemDetail: boolean
  setShowItemDetail: Dispatch<SetStateAction<boolean>>
  selectedItem: MarketplaceItem | null
  setSelectedItem: Dispatch<SetStateAction<MarketplaceItem | null>>
  handleItemClick: (item: MarketplaceItem) => void
  deleteItemError: string | null
  deletingItemId: string | null
  pendingDeleteItem: MarketplaceItem | null
  isProcessingDelete: boolean
  removingItemIds: Set<string>
  handleDeleteItemRequest: (item: MarketplaceItem) => void
  handleCancelDeleteItem: () => void
  handleConfirmDeleteItem: () => Promise<void>
  listItemForm: ListItemFormState
  setListItemForm: Dispatch<SetStateAction<ListItemFormState>>
  imagePreviewUrl: string | null
  setImagePreviewUrl: Dispatch<SetStateAction<string | null>>
  listItemExistingImage: string | null
  isSubmittingItem: boolean
  listItemError: string | null
  listItemSuccess: string | null
  handleListItemSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  startEditingItem: (item: MarketplaceItem) => void
  handleCancelEdit: () => void
  editingItemId: string | null
  resetListItemState: () => void
}

const initialListItemForm: ListItemFormState = {
  title: "",
  category: "Electronics",
  condition: "Like New",
  description: "",
  campus: "Main Campus",
  quantity: 1,
  deposit: false,
  imageFile: null,
}

export const useItemsFeature = ({ currentUser, showBanner, userMode, setUserMode }: UseItemsFeatureOptions): UseItemsFeatureResult => {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [showItemDetail, setShowItemDetail] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)

  const [deleteItemError, setDeleteItemError] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [pendingDeleteItem, setPendingDeleteItem] = useState<MarketplaceItem | null>(null)
  const [isProcessingDelete, setIsProcessingDelete] = useState(false)
  const [removingItemIds, setRemovingItemIds] = useState<Set<string>>(() => new Set<string>())

  const removalAnimationMs = 320

  const [listItemForm, setListItemForm] = useState<ListItemFormState>(initialListItemForm)
  const [isSubmittingItem, setIsSubmittingItem] = useState(false)
  const [listItemError, setListItemError] = useState<string | null>(null)
  const [listItemSuccess, setListItemSuccess] = useState<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [listItemExistingImage, setListItemExistingImage] = useState<string | null>(null)

  const resetListItemState = useCallback(() => {
    setListItemForm(initialListItemForm)
    setImagePreviewUrl(null)
    setEditingItemId(null)
    setListItemExistingImage(null)
  }, [])

  useEffect(() => {
    if (!imagePreviewUrl || !imagePreviewUrl.startsWith("blob:")) return
    return () => {
      URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  const fetchItems = useCallback(async () => {
    setItemsLoading(true)
    setItemsError(null)

    try {
      const { data, error } = await supabase.from("items").select("*")

      if (error) {
        console.error("Failed to load marketplace items", error)
        setItemsError(error.message ?? "Failed to load items")
        setItems([])
        return
      }

      const mapped = (data ?? []).map(mapItemRecord)
      mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setItems(mapped)
    } catch (err) {
      console.error("Unexpected error while loading marketplace items", err)
      setItems([])
      setItemsError(err instanceof Error ? err.message : "Unexpected error loading items")
    } finally {
      setItemsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  const updateItemQuantity = useCallback(async (itemId: string, adjustment: number) => {
    let nextQuantity: number | null = null
    let nextAvailability: string | null = null

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const quantity = Math.max(0, (item.quantity ?? 0) + adjustment)
        nextQuantity = quantity
        const availability = quantity > 0 ? "Available" : "Unavailable"
        nextAvailability = availability
        return { ...item, quantity, availability }
      }),
    )

    setSelectedItem((prev) => {
      if (!prev || prev.id !== itemId || nextQuantity === null || nextAvailability === null) return prev
      return { ...prev, quantity: nextQuantity, availability: nextAvailability }
    })

    if (nextQuantity === null || nextAvailability === null) {
      return
    }

    try {
      const numericId = Number(itemId)
      const query = supabase
        .from("items")
        .update({
          quantity: nextQuantity,
          availability: nextAvailability,
        })

      const { data, error } = Number.isFinite(numericId)
        ? await query.eq("id", numericId).select("id, quantity").maybeSingle()
        : await query.eq("id", itemId).select("id, quantity").maybeSingle()

      if (error) {
        console.error("Failed to update item quantity", error)
      } else if (!data) {
        console.warn("No item record returned after quantity update", { itemId })
      }
    } catch (err) {
      console.error("Unexpected error while updating item quantity", err)
    }
  }, [])

  const handleItemClick = useCallback((item: MarketplaceItem) => {
    setSelectedItem(item)
    setShowItemDetail(true)
  }, [])

  const handleDeleteItemRequest = useCallback(
    (item: MarketplaceItem) => {
      if (!currentUser || item.ownerId !== currentUser.id) {
        showBanner("You can only delete listings you created.", "error")
        return
      }

      setDeleteItemError(null)
      setPendingDeleteItem(item)
    },
    [currentUser, showBanner],
  )

  const handleCancelDeleteItem = useCallback(() => {
    if (isProcessingDelete) {
      return
    }

    setPendingDeleteItem(null)
    setDeleteItemError(null)
  }, [isProcessingDelete])

  const handleConfirmDeleteItem = useCallback(async () => {
    if (!pendingDeleteItem || !currentUser) {
      setDeleteItemError("You can only delete listings you created.")
      return
    }

    if (pendingDeleteItem.ownerId !== currentUser.id) {
      setDeleteItemError("You can only delete listings you created.")
      return
    }

    const item = pendingDeleteItem
    setDeleteItemError(null)
    setIsProcessingDelete(true)
    setDeletingItemId(item.id)

    try {
      const numericId = Number(item.id)
      const query = supabase.from("items").delete().eq("owner_id", currentUser.id)
      const { error } = Number.isFinite(numericId)
        ? await query.eq("id", numericId)
        : await query.eq("id", item.id)

      if (error) {
        console.error("Failed to delete item", error)
        setDeleteItemError(error.message ?? "Failed to delete item. Please try again.")
        return
      }

      setPendingDeleteItem(null)

      setRemovingItemIds((prev) => {
        const next = new Set(prev)
        next.add(item.id)
        return next
      })

      window.setTimeout(() => {
        setItems((prev) => prev.filter((existing) => existing.id !== item.id))
        setRemovingItemIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }, removalAnimationMs)

      let shouldCloseDetail = false
      setSelectedItem((prev) => {
        if (prev && prev.id === item.id) {
          shouldCloseDetail = true
          return null
        }
        return prev
      })
      if (shouldCloseDetail) {
        setShowItemDetail(false)
      }

      if (editingItemId === item.id) {
        resetListItemState()
        setUserMode("browse")
      }

      setListItemSuccess(null)
      showBanner(`Listing for "${item.title}" deleted.`, "success")
    } catch (err) {
      console.error("Unexpected error while deleting item", err)
      setDeleteItemError(
        err instanceof Error ? err.message : "Unexpected error occurred while deleting the listing.",
      )
    } finally {
      setDeletingItemId((prev) => (prev === item.id ? null : prev))
      setIsProcessingDelete(false)
    }
  }, [currentUser, editingItemId, pendingDeleteItem, resetListItemState, setUserMode, showBanner])

  const handleListItemSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!currentUser) {
        setListItemError("Please sign in to list an item.")
        setListItemSuccess(null)
        return
      }

      const trimmedTitle = listItemForm.title.trim()
      if (!trimmedTitle) {
        setListItemError("Item title is required.")
        setListItemSuccess(null)
        return
      }

      setListItemError(null)
      setListItemSuccess(null)
      setIsSubmittingItem(true)

      const safeQuantity =
        Number.isFinite(Number(listItemForm.quantity)) && Number(listItemForm.quantity) > 0
          ? Math.floor(Number(listItemForm.quantity))
          : 1

      try {
        let finalImageUrl: string | null = listItemExistingImage
        const isEditing = Boolean(editingItemId)

        if (listItemForm.imageFile) {
          const bucket = "item-images"
          const file = listItemForm.imageFile
          const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
          const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`
          const filePath = `${currentUser.id}/${fileName}`

          const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/jpeg",
          })

          if (uploadError) {
            console.error("Failed to upload item image", uploadError)
            setListItemError(uploadError.message)
            return
          }

          const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
          finalImageUrl = publicUrlData.publicUrl
        }

        const commonPayload = {
          title: trimmedTitle,
          category: listItemForm.category,
          condition: listItemForm.condition,
          description: listItemForm.description.trim(),
          campus: listItemForm.campus,
          deposit_required: listItemForm.deposit,
          image_url: finalImageUrl,
          quantity: safeQuantity,
        }

        const query = supabase.from("items")

        const { data, error } = isEditing
          ? await query
              .update({
                ...commonPayload,
                lender_name: currentUser.fullName || currentUser.name,
                lender_rating: currentUser.rating ?? 0,
                lender_reviews: currentUser.itemsLent ?? 0,
                lender_email: currentUser.email ?? null,
              })
              .eq("id", editingItemId)
              .eq("owner_id", currentUser.id)
              .select()
              .single()
          : await query
              .insert({
                ...commonPayload,
                availability: "Available",
                lender_name: currentUser.fullName || currentUser.name,
                lender_rating: currentUser.rating ?? 0,
                lender_reviews: currentUser.itemsLent ?? 0,
                owner_id: currentUser.id,
                lender_email: currentUser.email ?? null,
              })
              .select()
              .single()

        if (error) {
          console.error(isEditing ? "Failed to update item" : "Failed to list item", error)
          setListItemError(error.message)
          return
        }

        if (data) {
          const mappedItem = mapItemRecord(data)
          setItems((prev) =>
            isEditing ? prev.map((item) => (item.id === mappedItem.id ? mappedItem : item)) : [mappedItem, ...prev],
          )
          if (selectedItem && selectedItem.id === mappedItem.id) {
            setSelectedItem(mappedItem)
          }
          setListItemSuccess(isEditing ? "Item updated successfully!" : "Item listed successfully!")
          resetListItemState()
          if (userMode !== "browse") {
            setUserMode("browse")
          }
        }
      } catch (err) {
        console.error("Unexpected error while saving item", err)
        setListItemError(err instanceof Error ? err.message : "Unexpected error occurred while saving the item")
      } finally {
        setIsSubmittingItem(false)
      }
    },
    [
      currentUser,
      editingItemId,
      listItemExistingImage,
      listItemForm.category,
      listItemForm.campus,
      listItemForm.condition,
      listItemForm.deposit,
      listItemForm.description,
      listItemForm.imageFile,
      listItemForm.quantity,
      listItemForm.title,
      resetListItemState,
      selectedItem,
      setUserMode,
      userMode,
    ],
  )

  const startEditingItem = useCallback(
    (item: MarketplaceItem) => {
      if (!currentUser || item.ownerId !== currentUser.id) {
        setListItemError("You can only edit listings you created.")
        setListItemSuccess(null)
        return
      }
      setEditingItemId(item.id)
      setListItemForm({
        title: item.title,
        category: item.category,
        condition: item.condition,
        description: item.description ?? "",
        campus: item.campus,
        quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
        deposit: Boolean(item.deposit),
        imageFile: null,
      })
      setListItemExistingImage(item.image ?? null)
      setImagePreviewUrl(item.image ?? null)
      setListItemError(null)
      setListItemSuccess(null)
      setUserMode("lend")
      setShowItemDetail(false)
    },
    [currentUser, setUserMode],
  )

  const handleCancelEdit = useCallback(() => {
    resetListItemState()
    setListItemError(null)
    setListItemSuccess(null)
    setShowItemDetail(false)
    setUserMode("browse")
  }, [resetListItemState, setUserMode])

  return {
    items,
    setItems,
    itemsLoading,
    itemsError,
    fetchItems,
    updateItemQuantity,
    showItemDetail,
    setShowItemDetail,
    selectedItem,
    setSelectedItem,
    handleItemClick,
    deleteItemError,
    deletingItemId,
    pendingDeleteItem,
    isProcessingDelete,
    removingItemIds,
    handleDeleteItemRequest,
    handleCancelDeleteItem,
    handleConfirmDeleteItem,
    listItemForm,
    setListItemForm,
    imagePreviewUrl,
    setImagePreviewUrl,
    listItemExistingImage,
    isSubmittingItem,
    listItemError,
    listItemSuccess,
    handleListItemSubmit,
    startEditingItem,
    handleCancelEdit,
    editingItemId,
    resetListItemState,
  }
}
