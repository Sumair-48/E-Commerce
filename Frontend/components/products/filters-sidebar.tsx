'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ChevronDown, X } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  minRating: number
  inStockOnly: boolean
}

interface FiltersSidebarProps {
  categories: string[]
  onFilterChange: (filters: FilterState) => void
  isLoading?: boolean
}

const RATING_OPTIONS = [
  { label: '4★ & up', value: 4 },
  { label: '3★ & up', value: 3 },
  { label: '2★ & up', value: 2 },
  { label: '1★ & up', value: 1 },
]

const PRICE_PRESETS = [
  { label: 'Under $50', range: [0, 50] as [number, number] },
  { label: '$50 - $200', range: [50, 200] as [number, number] },
  { label: '$200 - $1000', range: [200, 1000] as [number, number] },
  { label: 'Over $1000', range: [1000, 10000] as [number, number] },
]

export function FiltersSidebar({
  categories,
  onFilterChange,
  isLoading,
}: FiltersSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 10000],
    minRating: 0,
    inStockOnly: false,
  })

  const handleCategoryChange = useCallback(
    (category: string, checked: boolean) => {
      const newCategories = checked
        ? [...filters.categories, category]
        : filters.categories.filter((c) => c !== category)

      const newFilters = { ...filters, categories: newCategories }
      setFilters(newFilters)
      onFilterChange(newFilters)
    },
    [filters, onFilterChange]
  )

  const handlePriceChange = useCallback(
    (range: number[]) => {
      const newFilters = { ...filters, priceRange: [range[0], range[1]] as [number, number] }
      setFilters(newFilters)
      onFilterChange(newFilters)
    },
    [filters, onFilterChange]
  )

  const handleRatingChange = useCallback(
    (rating: number) => {
      const newFilters = { ...filters, minRating: filters.minRating === rating ? 0 : rating }
      setFilters(newFilters)
      onFilterChange(newFilters)
    },
    [filters, onFilterChange]
  )

  const handleStockChange = useCallback(
    (checked: boolean) => {
      const newFilters = { ...filters, inStockOnly: checked }
      setFilters(newFilters)
      onFilterChange(newFilters)
    },
    [filters, onFilterChange]
  )

  const handleReset = () => {
    const resetFilters: FilterState = {
      categories: [],
      priceRange: [0, 10000],
      minRating: 0,
      inStockOnly: false,
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minRating > 0 ||
    filters.inStockOnly ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 10000

  return (
    <Card className="p-4 h-fit sticky top-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Categories */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between font-medium py-2">
            Categories
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category, checked as boolean)
                  }
                  disabled={isLoading}
                />
                <Label htmlFor={`category-${category}`} className="font-normal cursor-pointer">
                  {category}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Price Range */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between font-medium py-2">
            Price Range
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <Slider
              defaultValue={[0, 10000]}
              value={[filters.priceRange[0], filters.priceRange[1]]}
              min={0}
              max={10000}
              step={50}
              onValueChange={handlePriceChange}
              disabled={isLoading}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground text-center">
              ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </div>
            <div className="space-y-2">
              {PRICE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant={
                    filters.priceRange[0] === preset.range[0] &&
                    filters.priceRange[1] === preset.range[1]
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handlePriceChange(preset.range)}
                  disabled={isLoading}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Rating */}
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between font-medium py-2">
            Rating
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {RATING_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${option.value}`}
                  checked={filters.minRating === option.value}
                  onCheckedChange={() => handleRatingChange(option.value)}
                  disabled={isLoading}
                />
                <Label htmlFor={`rating-${option.value}`} className="font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Stock Status */}
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between font-medium py-2">
            Stock
            <ChevronDown className="w-4 h-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStockOnly}
                onCheckedChange={(checked) => handleStockChange(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="in-stock" className="font-normal cursor-pointer">
                In Stock Only
              </Label>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  )
}
