'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const propertyTypes = [
	{ value: '', label: 'Any property type' },
	{ value: 'Flat', label: 'Flat' },
	{ value: 'House', label: 'House' },
	{ value: 'Studio', label: 'Studio' },
	{ value: 'Bungalow', label: 'Bungalow' },
	{ value: 'Maisonette', label: 'Maisonette' },
]

const priceRanges = [
	{ value: '', label: 'Any price' },
	{ value: '0-500', label: 'Up to £500' },
	{ value: '500-750', label: '£500 - £750' },
	{ value: '750-1000', label: '£750 - £1,000' },
	{ value: '1000-1500', label: '£1,000 - £1,500' },
	{ value: '1500-2000', label: '£1,500 - £2,000' },
	{ value: '2000-3000', label: '£2,000 - £3,000' },
	{ value: '3000+', label: '£3,000+' },
]

export function HeroSection() {
	const [searchQuery, setSearchQuery] = useState('')
	const [propertyType, setPropertyType] = useState('')
	const [priceRange, setPriceRange] = useState('')
	const router = useRouter()

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()

		const params = new URLSearchParams()
		if (searchQuery) params.set('location', searchQuery)
		if (propertyType) params.set('property_type', propertyType)
		if (priceRange) {
			if (priceRange.includes('-')) {
				const [min, max] = priceRange.split('-')
				params.set('min_price', min)
				if (max !== '3000+') params.set('max_price', max)
			} else if (priceRange === '3000+') {
				params.set('min_price', '3000')
			}
		}

		router.push(`/search?${params.toString()}`)
	}

	return (
		<div className="relative bg-gradient-to-r from-primary-600 to-primary-800 overflow-hidden">
			{/* Background pattern */}
			<div className="absolute inset-0 bg-black opacity-20"></div>
			<div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10"></div>

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
				<div className="text-center">
					<h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
						Find Your Perfect
						<span className="block text-yellow-300">Rental Home</span>
					</h1>
					<p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
						Discover thousands of rental properties across the UK. Connect directly
						with landlords and skip the agency fees.
					</p>

					{/* Search Form */}
					<form onSubmit={handleSearch} className="max-w-4xl mx-auto">
						<div className="bg-white rounded-xl shadow-2xl p-6 md:p-8">
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
								{/* Location Search */}
								<div className="md:col-span-2">
									<label
										htmlFor="location"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Location
									</label>
									<div className="relative">
										<MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
										<Input
											id="location"
											type="text"
											placeholder="Enter postcode or city (e.g., London, M1 1AA)"
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="pl-10"
										/>
									</div>
								</div>

								{/* Property Type */}
								<div>
									<label
										htmlFor="property-type"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Property Type
									</label>
									<select
										id="property-type"
										value={propertyType}
										onChange={(e) => setPropertyType(e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
									>
										{propertyTypes.map((type) => (
											<option key={type.value} value={type.value}>
												{type.label}
											</option>
										))}
									</select>
								</div>

								{/* Price Range */}
								<div>
									<label
										htmlFor="price-range"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Price Range
									</label>
									<select
										id="price-range"
										value={priceRange}
										onChange={(e) => setPriceRange(e.target.value)}
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
									>
										{priceRanges.map((range) => (
											<option key={range.value} value={range.value}>
												{range.label}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Search Button */}
							<Button
								type="submit"
								size="lg"
								className="w-full md:w-auto md:px-8"
							>
								<Search className="w-5 h-5 mr-2" />
								Search Properties
							</Button>
						</div>
					</form>

					{/* Quick Stats */}
					<div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
						<div className="text-center">
							<div className="text-3xl md:text-4xl font-bold text-white">10K+</div>
							<div className="text-blue-100 mt-2">Properties Listed</div>
						</div>
						<div className="text-center">
							<div className="text-3xl md:text-4xl font-bold text-white">5K+</div>
							<div className="text-blue-100 mt-2">Happy Tenants</div>
						</div>
						<div className="text-center">
							<div className="text-3xl md:text-4xl font-bold text-white">1K+</div>
							<div className="text-blue-100 mt-2">Verified Landlords</div>
						</div>
						<div className="text-center">
							<div className="text-3xl md:text-4xl font-bold text-white">No</div>
							<div className="text-blue-100 mt-2">Agency Fees</div>
						</div>
					</div>
				</div>
			</div>

			{/* Popular Locations */}
			<div className="relative bg-white py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
						Popular Locations
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{[
							'London',
							'Manchester',
							'Birmingham',
							'Leeds',
							'Liverpool',
							'Bristol',
							'Edinburgh',
							'Glasgow',
							'Sheffield',
							'Newcastle',
							'Nottingham',
							'Cardiff',
						].map((city) => (
							<button
								key={city}
								onClick={() =>
									router.push(`/search?location=${encodeURIComponent(city)}`)
								}
								className="p-3 text-center bg-gray-50 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
							>
								<div className="font-medium">{city}</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
