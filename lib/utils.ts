// Utility function to combine class names
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

// Format price for UK currency
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Format date for UK locale
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else {
    const years = Math.floor(diffInDays / 365)
    return `${years} year${years > 1 ? 's' : ''} ago`
  }
}

// Validate UK postcode
export function isValidUKPostcode(postcode: string): boolean {
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/i
  return ukPostcodeRegex.test(postcode.replace(/\s/g, ' ').toUpperCase())
}

// Format UK postcode
export function formatUKPostcode(postcode: string): string {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase()
  if (cleaned.length <= 4) return cleaned
  
  const outcode = cleaned.slice(0, -3)
  const incode = cleaned.slice(-3)
  return `${outcode} ${incode}`
}

// Validate UK phone number
export function isValidUKPhone(phone: string): boolean {
  const ukPhoneRegex = /^(\+44\s?|0)([1-9]\d{8,9})$/
  return ukPhoneRegex.test(phone.replace(/\s/g, ''))
}

// Format UK phone number
export function formatUKPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '')
  if (cleaned.startsWith('+44')) {
    return `+44 ${cleaned.slice(3)}`
  } else if (cleaned.startsWith('0')) {
    return `+44 ${cleaned.slice(1)}`
  }
  return phone
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Generate slug from string
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength).trim() + '...'
}

// Get EPC rating color
export function getEPCRatingColor(rating: string): string {
  switch (rating?.toUpperCase()) {
    case 'A':
      return 'bg-green-500 text-white'
    case 'B':
      return 'bg-green-400 text-white'
    case 'C':
      return 'bg-yellow-400 text-black'
    case 'D':
      return 'bg-yellow-500 text-black'
    case 'E':
      return 'bg-orange-500 text-white'
    case 'F':
      return 'bg-red-500 text-white'
    case 'G':
      return 'bg-red-600 text-white'
    default:
      return 'bg-gray-400 text-white'
  }
}

// Get council tax band color
export function getCouncilTaxBandColor(band: string): string {
  switch (band?.toUpperCase()) {
    case 'A':
    case 'B':
      return 'bg-green-100 text-green-800'
    case 'C':
    case 'D':
      return 'bg-blue-100 text-blue-800'
    case 'E':
    case 'F':
      return 'bg-orange-100 text-orange-800'
    case 'G':
    case 'H':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Debounce function
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage helpers
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Silently fail
  }
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently fail
  }
}

// Get Google Maps Static image URL for location
export function getLocationMapImage(
  latitude?: number | null,
  longitude?: number | null,
  address?: string | null,
  options?: {
    zoom?: number;
    size?: string;
    mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
    markerColor?: string;
  }
): string {
  try {
    const baseUrl = '/api/image?mode=location';
    
    // Set default options
    const zoom = options?.zoom || 14;
    const size = options?.size || '600x400';
    const mapType = options?.mapType || 'roadmap';
    const markerColor = options?.markerColor || 'red';
    
    let url = `${baseUrl}&zoom=${zoom}&size=${size}&maptype=${mapType}`;
    
    // Add coordinates if available
    if (latitude && longitude) {
      url += `&lat=${latitude}&lng=${longitude}`;
    } 
    // Otherwise use address
    else if (address) {
      url += `&address=${encodeURIComponent(address)}`;
    } 
    // If neither is available, return placeholder
    else {
      return 'https://via.placeholder.com/600x400?text=No+Location+Data';
    }
    
    return url;
  } catch (error) {
    console.error('Error generating location map image URL:', error);
    return 'https://via.placeholder.com/600x400?text=Map+Image+Error';
  }
}

// Generate a random UK house image URL
// We use a seed to ensure consistent images for the same property ID
export async function getRandomHouseImage(query: string = 'uk house'): Promise<string> {
  try {
    const res = await fetch(`/api/image?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Failed to fetch image')
    
    const { url } = await res.json()
    
    // Check if URL is valid and not empty
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error('Invalid image URL returned')
    }
    
    return url
  } catch (error) {
    console.error('Error fetching house image:', error)
    // fallback placeholder
    return '/placeholder-property.jpg'
  }
}


// Alternative using the official Unsplash API (requires server-side implementation)
export async function getRandomUKHouseAsync(): Promise<string> {
  try {
    // This should be implemented server-side with proper API key management
    const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    
    if (!accessKey) {
      console.error('Unsplash access key is not defined');
      return getRandomHouseImage(); // Fallback to the client-side method
    }
    
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=uk+house&collections=3356627,220381&client_id=${accessKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Unsplash API');
    }
    
    const data = await response.json();
    return data.urls.regular;
  } catch (error) {
    console.error('Error fetching random house image:', error);
    return getRandomHouseImage(); // Fallback to the client-side method
  }
}
