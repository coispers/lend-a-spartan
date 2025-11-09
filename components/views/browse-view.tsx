import { Dispatch, SetStateAction } from "react"
import SearchFilters from "@/components/search-filters"
import ItemsGrid from "@/components/items-grid"
import type { MarketplaceItem } from "@/types/interfaces"

interface BrowseViewProps {
  searchQuery: string
  onSearchChange: Dispatch<SetStateAction<string>>
  selectedCategory: string
  onCategoryChange: Dispatch<SetStateAction<string>>
  sortBy: string
  onSortChange: Dispatch<SetStateAction<string>>
  filterCondition: string
  onConditionChange: Dispatch<SetStateAction<string>>
  showFilters: boolean
  onToggleFilters: () => void
  itemsError: string | null
  deleteItemError: string | null
  hasPendingDeleteItem: boolean
  items: MarketplaceItem[]
  onItemClick: (item: MarketplaceItem) => void
  isLoading: boolean
  currentUserId: string | null
  deletingItemId: string | null
  onDeleteItem: (item: MarketplaceItem) => void
  removingItemIds: Set<string>
}

export function BrowseView({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  filterCondition,
  onConditionChange,
  showFilters,
  onToggleFilters,
  itemsError,
  deleteItemError,
  hasPendingDeleteItem,
  items,
  onItemClick,
  isLoading,
  currentUserId,
  deletingItemId,
  onDeleteItem,
  removingItemIds,
}: BrowseViewProps) {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Browse Items</h2>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          filterCondition={filterCondition}
          onConditionChange={onConditionChange}
          showFilters={showFilters}
          onToggleFilters={onToggleFilters}
        />
      </div>

      {itemsError && <p className="text-sm text-red-600 mb-4">{itemsError}</p>}
      {deleteItemError && !hasPendingDeleteItem && (
        <p className="text-sm text-red-600 mb-4">{deleteItemError}</p>
      )}

      <ItemsGrid
        items={items}
        onItemClick={onItemClick}
        isLoading={isLoading}
        currentUserId={currentUserId}
        deletingItemId={deletingItemId}
        onDeleteItem={onDeleteItem}
        removingItemIds={removingItemIds}
      />
    </>
  )
}
