// Database types for DirectRent UK

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'landlord' | 'tenant' | 'admin';
  avatar_url?: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  verification_status?: string;
  account_status?: string;
  last_login?: string;
  registration_ip?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  rent_amount: number; // The actual database field
  price?: number; // Adding price alias for compatibility
  price_per_month?: number; // Legacy field
  deposit_amount?: number;
  postcode: string;
  address?: string; // Adding address alias
  address_line_1: string;
  address_line_2?: string;
  city: string;
  county?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  
  // UK-specific fields
  council_tax_band?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  epc_rating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  furnishing_status: 'Furnished' | 'Unfurnished' | 'Part-Furnished';
  
  // Property details
  bedrooms: number;
  bathrooms: number;
  property_type: 'Flat' | 'House' | 'Studio' | 'Bungalow' | 'Maisonette';
  parking_spaces?: number;
  
  // Availability
  available_from?: string;
  minimum_tenancy_months?: number;
  
  // Features
  parking: boolean;
  garden: boolean;
  balcony: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  students_allowed?: boolean;
  amenities?: string[];
  
  // Landlord and verification
  landlord_id: string;
  landlord?: User;
  is_verified: boolean;
  verification_date?: string;
  is_active: boolean;
  
  // Media
  images: string[];
  virtual_tour_url?: string;
  
  // Fraud detection
  fraud_score: number;
  is_flagged: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Additional computed fields
  distance?: number; // For search results
  saved?: boolean; // If user has saved this property
  view_count?: number;
}

export interface Booking {
  id: string;
  property_id: string;
  property?: Property;
  user_id: string;
  user?: User;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  landlord_response?: string;
  preferred_viewing_date?: string;
  preferred_viewing_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  property_id: string;
  property?: Property;
  user_id: string;
  user?: User;
  rating: number;
  comment?: string;
  condition_rating?: number;
  location_rating?: number;
  landlord_rating?: number;
  value_for_money_rating?: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Location preferences
  preferred_postcode?: string;
  preferred_cities: string[];
  max_distance_miles: number;
  
  // Property preferences
  price_min?: number;
  price_max?: number;
  property_type?: 'Flat' | 'House' | 'Studio' | 'Bungalow' | 'Maisonette';
  min_bedrooms?: number;
  max_bedrooms?: number;
  furnishing_status?: 'Furnished' | 'Unfurnished' | 'Part-Furnished';
  
  // Requirements
  parking_required: boolean;
  garden_required: boolean;
  pets_allowed_required: boolean;
  
  // Notifications
  email_notifications: boolean;
  sms_notifications: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  property?: Property;
  created_at: string;
}

export interface PropertyView {
  id: string;
  property_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  viewed_at: string;
}

export interface FraudReport {
  id: string;
  property_id: string;
  property?: Property;
  reported_by?: string;
  reporter?: User;
  reason: string;
  description?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}

// Search and filter types
export interface PropertySearchFilters {
  postcode?: string;
  city?: string;
  property_type?: string[];
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  furnishing_status?: string[];
  council_tax_band?: string[];
  epc_rating?: string[];
  parking?: boolean;
  garden?: boolean;
  pets_allowed?: boolean;
  available_from?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'distance';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ML API types
export interface RecommendationRequest {
  user_id: string;
  limit?: number;
  preferences?: Partial<UserPreferences>;
}

export interface RecommendationResponse {
  properties: Property[];
  scores: number[];
  reasoning: string[];
}

export interface FraudCheckRequest {
  property: Partial<Property>;
  landlord_id: string;
}

export interface FraudCheckResponse {
  fraud_score: number;
  is_fraudulent: boolean;
  reasons: string[];
  risk_factors: {
    price_deviation: number;
    posting_frequency: number;
    content_similarity: number;
    image_authenticity: number;
  };
}

export interface PriceEstimateRequest {
  postcode: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  furnishing_status: string;
}

export interface PriceEstimateResponse {
  estimated_price: number;
  confidence: number;
  price_range: {
    min: number;
    max: number;
  };
  market_insights: {
    average_price: number;
    median_price: number;
    comparable_properties: number;
  };
}

// Form types
export interface PropertyFormData {
  title: string;
  description: string;
  price_per_month: number;
  deposit_amount?: number;
  postcode: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  council_tax_band?: string;
  epc_rating?: string;
  furnishing_status: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  available_from?: string;
  minimum_tenancy_months?: number;
  parking: boolean;
  garden: boolean;
  balcony: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  images: File[];
  virtual_tour_url?: string;
}

export interface BookingFormData {
  property_id: string;
  message: string;
  preferred_viewing_date?: string;
  preferred_viewing_time?: string;
}

export interface ReviewFormData {
  property_id: string;
  rating: number;
  comment?: string;
  condition_rating?: number;
  location_rating?: number;
  landlord_rating?: number;
  value_for_money_rating?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Component prop types
export interface PropertyCardProps {
  property: Property;
  showSaveButton?: boolean;
  showDistance?: boolean;
  onClick?: () => void;
}

export interface FilterProps {
  filters: PropertySearchFilters;
  onFiltersChange: (filters: PropertySearchFilters) => void;
  onClearFilters: () => void;
}

export interface MapProps {
  properties: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onPropertyClick?: (property: Property) => void;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
}

// Dashboard statistics
export interface DashboardStats {
  total_properties: number;
  active_properties: number;
  total_views: number;
  total_bookings: number;
  pending_bookings: number;
  accepted_bookings: number;
  average_rating: number;
  total_revenue: number;
  monthly_revenue: number;
}

export interface AdminStats {
  total_users: number;
  total_landlords: number;
  total_tenants: number;
  total_properties: number;
  flagged_properties: number;
  pending_reports: number;
  monthly_signups: number;
  monthly_listings: number;
}
