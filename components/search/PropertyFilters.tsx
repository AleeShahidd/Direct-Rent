'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePropertySearch } from './PropertySearchProvider';
import { SearchFilters } from '@/types/enhanced';
import { 
  Filter, 
  X, 
  ChevronDown, 
  Home, 
  Bed, 
  Bath, 
  Sofa, 
  Car, 
  Calendar, 
  PawPrint, 
  DollarSign,
  MapPin
} from 'lucide-react';

const PropertyFilters = () => {
  const { filters, setFilters } = usePropertySearch();
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([
    filters.min_price || 0, 
    filters.max_price || 10000
  ]);
  
  // Local filter state (for applying filters on submit)
  const [localFilters, setLocalFilters] = useState<Partial<SearchFilters>>(filters);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setLocalFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(value);
    setLocalFilters(prev => ({
      ...prev,
      min_price: value[0],
      max_price: value[1]
    }));
  };
  
  const applyFilters = () => {
    setFilters(localFilters);
    setIsOpen(false);
  };
  
  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      location: '',
      postcode: '',
      city: '',
      min_price: undefined,
      max_price: undefined,
      property_type: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      furnishing_status: undefined,
      available_from: undefined,
      pets_allowed: false,
      parking_required: false,
      garden_required: false,
      smoking_allowed: false,
      students_allowed: false,
      dss_accepted: false,
      couples_allowed: false,
      bills_included: false,
      sort_by: 'newest' as const,
    };
    
    setLocalFilters(clearedFilters);
    setFilters(clearedFilters);
    setPriceRange([0, 10000]);
    setIsOpen(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Simple Filter Bar (Always Visible) */}
      <div className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Input
              name="query"
              placeholder="Search properties..."
              className="pl-10"
              value={localFilters.query || ''}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Filter className="h-5 w-5" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Input
              name="location"
              placeholder="City, town or postcode"
              className="pl-10"
              value={localFilters.location || ''}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
        </div>
        
        <Button onClick={applyFilters} className="whitespace-nowrap">
          Apply Filters
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(!isOpen)}
          className="whitespace-nowrap"
        >
          More Filters
          <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      
      {/* Advanced Filters (Toggleable) */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Property Type */}
            <div>
              <Label className="font-medium mb-2 block">Property Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {['flat', 'house', 'studio', 'bungalow', 'maisonette'].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type}`}
                      checked={localFilters.property_type?.includes(type) || false}
                      onCheckedChange={(checked) => {
                        setLocalFilters(prev => {
                          const current = prev.property_type || [];
                          const updated = checked 
                            ? [...current, type]
                            : current.filter(t => t !== type);
                          
                          return {
                            ...prev,
                            property_type: updated.length ? updated : undefined
                          };
                        });
                      }}
                    />
                    <Label htmlFor={`type-${type}`} className="capitalize">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bedrooms */}
            <div>
              <Label className="font-medium mb-2 block">Bedrooms</Label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, '6+'].map((num) => (
                  <div key={`bed-${num}`} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`bed-${num}`}
                      checked={localFilters.bedrooms?.includes(Number(num)) || false}
                      onCheckedChange={(checked) => {
                        setLocalFilters(prev => {
                          const current = prev.bedrooms || [];
                          const value = Number(num) || 6; // Convert '6+' to 6
                          const updated = checked 
                            ? [...current, value]
                            : current.filter(b => b !== value);
                          
                          return {
                            ...prev,
                            bedrooms: updated.length ? updated : undefined
                          };
                        });
                      }}
                    />
                    <Label htmlFor={`bed-${num}`}>{num}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bathrooms */}
            <div>
              <Label className="font-medium mb-2 block">Bathrooms</Label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, '4+'].map((num) => (
                  <div key={`bath-${num}`} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`bath-${num}`}
                      checked={localFilters.bathrooms?.includes(Number(num)) || false}
                      onCheckedChange={(checked) => {
                        setLocalFilters(prev => {
                          const current = prev.bathrooms || [];
                          const value = Number(num) || 4; // Convert '4+' to 4
                          const updated = checked 
                            ? [...current, value]
                            : current.filter(b => b !== value);
                          
                          return {
                            ...prev,
                            bathrooms: updated.length ? updated : undefined
                          };
                        });
                      }}
                    />
                    <Label htmlFor={`bath-${num}`}>{num}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Price Range */}
            <div className="lg:col-span-2">
              <Label className="font-medium mb-2 block">
                Price Range: £{priceRange[0]} - £{priceRange[1] === 10000 ? '10,000+' : priceRange[1]}
              </Label>
              <Slider
                min={0}
                max={10000}
                step={100}
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                className="mt-6"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>£0</span>
                <span>£5,000</span>
                <span>£10,000+</span>
              </div>
            </div>
            
            {/* Furnishing Status */}
            <div>
              <Label className="font-medium mb-2 block">Furnishing</Label>
              <RadioGroup
                value={localFilters.furnishing_status ? localFilters.furnishing_status[0] : undefined}
                onValueChange={(value) => {
                  setLocalFilters(prev => ({
                    ...prev,
                    furnishing_status: value ? [value] : undefined
                  }));
                }}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="furnished" id="furnished" />
                  <Label htmlFor="furnished">Furnished</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="part_furnished" id="part_furnished" />
                  <Label htmlFor="part_furnished">Part Furnished</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unfurnished" id="unfurnished" />
                  <Label htmlFor="unfurnished">Unfurnished</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Features */}
            <div>
              <Label className="font-medium mb-2 block">Features</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="parking"
                    checked={localFilters.parking_required || false}
                    onCheckedChange={(checked) => {
                      setLocalFilters(prev => ({
                        ...prev,
                        parking_required: !!checked
                      }));
                    }}
                  />
                  <Label htmlFor="parking">Parking Available</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="garden"
                    checked={localFilters.garden_required || false}
                    onCheckedChange={(checked) => {
                      setLocalFilters(prev => ({
                        ...prev,
                        garden_required: !!checked
                      }));
                    }}
                  />
                  <Label htmlFor="garden">Garden</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bills_included"
                    checked={localFilters.bills_included || false}
                    onCheckedChange={(checked) => {
                      setLocalFilters(prev => ({
                        ...prev,
                        bills_included: !!checked
                      }));
                    }}
                  />
                  <Label htmlFor="bills_included">Bills Included</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pets_allowed"
                    checked={localFilters.pets_allowed || false}
                    onCheckedChange={(checked) => {
                      setLocalFilters(prev => ({
                        ...prev,
                        pets_allowed: !!checked
                      }));
                    }}
                  />
                  <Label htmlFor="pets_allowed">Pets Allowed</Label>
                </div>
              </div>
            </div>
            
            {/* Availability */}
            <div>
              <Label className="font-medium mb-2 block">Availability</Label>
              <Input
                type="date"
                name="available_from"
                value={localFilters.available_from || ''}
                onChange={handleInputChange}
                className="w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          {/* Sort By */}
          <div className="mt-6 flex justify-between items-center">
            <div className="w-48">
              <Label htmlFor="sort_by" className="font-medium block mb-1">Sort By</Label>
              <select
                id="sort_by"
                name="sort_by"
                value={localFilters.sort_by || 'newest'}
                onChange={handleSelectChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price (Low to High)</option>
                <option value="price_high">Price (High to Low)</option>
                <option value="most_viewed">Most Viewed</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={clearFilters}>
                Reset Filters
              </Button>
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyFilters;
