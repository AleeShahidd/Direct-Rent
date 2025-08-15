"use client";

import { Property } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Eye,
  MapPin,
  Bed,
  Bath,
  Home,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getRandomHouseImage } from "@/lib/utils";

interface PropertiesTabProps {
  properties: Property[];
  filter: string;
  onFilterChange: (filter: string) => void;
  onEditProperty: (id: string) => void;
  onDeleteProperty: (id: string) => void;
  onViewProperty: (id: string) => void;
  formatPrice: (price: number) => string;
}

export default function PropertiesTab({
  properties,
  filter,
  onFilterChange,
  onEditProperty,
  onDeleteProperty,
  onViewProperty,
  formatPrice,
}: PropertiesTabProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [img, setImg] = useState<string | null>(null);

  const filterOptions = [
    { value: "all", label: "All Properties" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];
  
  useEffect(() => {
    getRandomHouseImage().then(setImg);
  }, []);

  const PropertyCard = ({ property }: { property: Property }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-48 bg-gray-200 relative">
        <img
          src={
            property.images && property.images.length > 0
              ? property.images[0]
              : img
          }
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm"
            onClick={() => onViewProperty(property.id)}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm"
            onClick={() => onEditProperty(property.id)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onDeleteProperty(property.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              property.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {property.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {property.title}
        </h3>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">
            {property.address || property.address_line_1}, {property.city}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              {property.bedrooms}
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              {property.bathrooms}
            </div>
            <div className="flex items-center">
              <Home className="h-4 w-4 mr-1" />
              {property.property_type}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            {formatPrice(property.price || property.price_per_month)}/month
          </span>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditProperty(property.id)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-sm ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 text-sm ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Properties List */}
      {properties.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={
                              property.images && property.images.length > 0
                                ? property.images[0]
                                : img
                            }
                            alt={property.title}
                            className="w-12 h-12 rounded-lg object-cover mr-4"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {property.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {property.property_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <div className="text-sm text-gray-900">
                            {property.city}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {property.postcode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(
                            property.price || property.price_per_month
                          )}
                        </div>
                        <div className="text-xs text-gray-500">per month</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Bed className="h-3 w-3 mr-1" />
                            {property.bedrooms}
                          </div>
                          <div className="flex items-center">
                            <Bath className="h-3 w-3 mr-1" />
                            {property.bathrooms}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            property.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {property.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewProperty(property.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditProperty(property.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => onDeleteProperty(property.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl p-12 text-center">
          <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No properties found
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === "all"
              ? "You haven't added any properties yet"
              : `No ${filter} properties found`}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Property
          </Button>
        </div>
      )}
    </div>
  );
}
