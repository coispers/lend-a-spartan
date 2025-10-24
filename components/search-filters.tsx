"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, X } from "lucide-react"

interface SearchFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  filterCondition: string
  onConditionChange: (condition: string) => void
  showFilters: boolean
  onToggleFilters: () => void
}

export default function SearchFilters({
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
}: SearchFiltersProps) {
  const categories = ["All", "Electronics", "School Supplies", "Laboratory", "Books", "Sports", "Other"]
  const conditions = ["All", "Like New", "Good", "Fair"]
  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Highest Rated" },
    { value: "name", label: "Name (A-Z)" },
  ]

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 md:h-auto text-sm md:text-base"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={onToggleFilters}
          className={`h-10 md:h-auto px-3 md:px-4 ${showFilters ? "bg-primary text-primary-foreground" : ""}`}
          size="sm"
        >
          <Filter size={18} />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat.toLowerCase() ? "default" : "outline"}
            onClick={() => onCategoryChange(cat.toLowerCase())}
            className={`flex-shrink-0 text-xs md:text-sm h-8 md:h-auto ${
              selectedCategory === cat.toLowerCase() ? "bg-primary text-primary-foreground" : ""
            }`}
            size="sm"
          >
            {cat}
          </Button>
        ))}
      </div>

      {showFilters && (
        <div className="bg-muted p-3 md:p-4 rounded-lg space-y-3 md:space-y-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground text-sm md:text-base">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={onToggleFilters} className="h-8 w-8 p-0">
              <X size={18} />
            </Button>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-foreground">Item Condition</label>
            <div className="flex gap-2 flex-wrap">
              {conditions.map((cond) => (
                <Button
                  key={cond}
                  variant={filterCondition === cond.toLowerCase() ? "default" : "outline"}
                  onClick={() => onConditionChange(cond.toLowerCase())}
                  className={`text-xs md:text-sm h-8 md:h-auto ${
                    filterCondition === cond.toLowerCase() ? "bg-primary text-primary-foreground" : ""
                  }`}
                  size="sm"
                >
                  {cond}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-xs md:text-sm font-medium mb-2 text-foreground">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
