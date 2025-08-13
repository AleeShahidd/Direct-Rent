'use client'

import { useState } from 'react'
import { PropertySearchFilters } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

interface SearchFiltersProps {
  filters: PropertySearchFilters
  onFiltersChange: (filters: PropertySearchFilters) => void
  onClearFilters: () => void
}

const propertyTypes = [
  'Flat', 'House', 'Studio', 'Bungalow', 'Maisonette'
]

const furnishingOptions = [
  'Furnished', 'Unfurnished', 'Part-Furnished'
]

const councilTaxBands = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
]

const epcRatings = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G'
]

export function SearchFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilters = (updates: Partial<PropertySearchFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const togglePropertyType = (type: string) => {
    const current = filters.property_type || []
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    updateFilters({ property_type: updated })
  }

  const toggleFurnishing = (status: string) => {
    const current = filters.furnishing_status || []
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    updateFilters({ furnishing_status: updated })
  }

  const toggleCouncilTaxBand = (band: string) => {
    const current = filters.council_tax_band || []
    const updated = current.includes(band)
      ? current.filter(b => b !== band)
      : [...current, band]
    updateFilters({ council_tax_band: updated })
  }

  const toggleEPCRating = (rating: string) => {
    const current = filters.epc_rating || []
    const updated = current.includes(rating)
      ? current.filter(r => r !== rating)
      : [...current, rating]
    updateFilters({ epc_rating: updated })
  }

  const hasActiveFilters = () => {
    return !!(
      filters.postcode ||
      filters.city ||
      filters.property_type?.length ||
      filters.min_price ||
      filters.max_price ||
      filters.min_bedrooms ||
      filters.max_bedrooms ||
      filters.furnishing_status?.length ||
      filters.council_tax_band?.length ||
      filters.epc_rating?.length ||
      filters.parking ||
      filters.garden ||
      filters.pets_allowed
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              Clear all
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className={`space-y-6 ${isExpanded || 'hidden lg:block'}`}>
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="space-y-2">
            <Input
              placeholder="Postcode (e.g., SW1A 1AA)"
              value={filters.postcode || ''}
              onChange={(e) => updateFilters({ postcode: e.target.value })}
            />
            <Input
              placeholder="City (e.g., London)"
              value={filters.city || ''}
              onChange={(e) => updateFilters({ city: e.target.value })}
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (£/month)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.min_price || ''}
              onChange={(e) => updateFilters({ 
                min_price: e.target.value ? parseInt(e.target.value) : undefined 
              })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.max_price || ''}
              onChange={(e) => updateFilters({ 
                max_price: e.target.value ? parseInt(e.target.value) : undefined 
              })}
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bedrooms
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.min_bedrooms || ''}
              onChange={(e) => updateFilters({ 
                min_bedrooms: e.target.value ? parseInt(e.target.value) : undefined 
              })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.max_bedrooms || ''}
              onChange={(e) => updateFilters({ 
                max_bedrooms: e.target.value ? parseInt(e.target.value) : undefined 
              })}
            />
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <div className="space-y-2">
            {propertyTypes.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.property_type?.includes(type) || false}
                  onChange={() => togglePropertyType(type)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Furnishing Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Furnishing
          </label>
          <div className="space-y-2">
            {furnishingOptions.map((status) => (
              <label key={status} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.furnishing_status?.includes(status) || false}
                  onChange={() => toggleFurnishing(status)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Council Tax Band */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Council Tax Band
          </label>
          <div className="grid grid-cols-4 gap-2">
            {councilTaxBands.map((band) => (
              <label key={band} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.council_tax_band?.includes(band) || false}
                  onChange={() => toggleCouncilTaxBand(band)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{band}</span>
              </label>
            ))}
          </div>
        </div>

        {/* EPC Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            EPC Rating
          </label>
          <div className="grid grid-cols-4 gap-2">
            {epcRatings.map((rating) => (
              <label key={rating} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.epc_rating?.includes(rating) || false}
                  onChange={() => toggleEPCRating(rating)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{rating}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.parking || false}
                onChange={(e) => updateFilters({ parking: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Parking</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.garden || false}
                onChange={(e) => updateFilters({ garden: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Garden</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.pets_allowed || false}
                onChange={(e) => updateFilters({ pets_allowed: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Pets Allowed</span>
            </label>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sort_by || 'newest'}
            onChange={(e) => updateFilters({ sort_by: e.target.value as any })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  )
}
