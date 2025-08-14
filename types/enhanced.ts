// Enhanced types for DirectRent UK platform with complete CRUD and functionality

// User Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  role: 'tenant' | 'landlord' | 'admin';
  date_of_birth?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  email_verified: boolean;
  phone_verified: boolean;
  account_status: 'active' | 'suspended' | 'banned';
  last_login?: string;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

// Enhanced Property Types
export interface Property {
  id: string;
  title: string;
  description: string;
  property_type: 'flat' | 'house' | 'studio' | 'bungalow' | 'maisonette' | 'Flat' | 'House' | 'Studio' | 'Bungalow' | 'Maisonette';
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  deposit_amount: number;
  price_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  service_charges?: number;
  furnishing_status: 'furnished' | 'unfurnished' | 'part_furnished' | 'Furnished' | 'Unfurnished' | 'Part-Furnished';
  available_from: string;
  minimum_tenancy_months: number;
  maximum_tenancy_months?: number;
  
  // Permissions
  pets_allowed: boolean;
  smoking_allowed: boolean;
  couples_allowed: boolean;
  students_allowed: boolean;
  dss_accepted: boolean;
  professionals_only: boolean;
  
  // Location
  address_line_1: string;
  address_line_2?: string;
  city: string;
  county: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  
  // UK Specific
  epc_rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  council_tax_band: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  council_tax_included: boolean;
  bills_included: boolean;
  
  // Additional features
  parking_spaces: number;
  has_garden: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  furnished_details?: string[];
  amenities: string[];
  
  // For backward compatibility with old code
  parking?: boolean;
  garden?: boolean;
  balcony?: boolean;
  price?: number;
  is_verified?: boolean;
  is_active?: boolean;
  is_flagged?: boolean;
  
  // Images and Media
  images: PropertyImage[] | string[];
  virtual_tour_url?: string;
  floor_plan_url?: string;
  
  // Status and Analytics
  status: 'active' | 'inactive' | 'rented' | 'under_offer' | 'pending_approval';
  verification_status: 'pending' | 'verified' | 'rejected';
  view_count: number;
  inquiry_count: number;
  save_count: number;
  fraud_score?: number;
  featured: boolean;
  premium_listing: boolean;
  
  // Relationships
  landlord_id: string;
  landlord?: User;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

// Enhanced Booking Types
export interface Booking {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  
  // Inquiry Details
  message: string;
  preferred_move_date: string;
  viewing_date_requests: ViewingRequest[];
  contact_phone?: string;
  additional_occupants?: number;
  employment_status?: string;
  annual_income?: number;
  
  // Status Management
  status: 'pending' | 'accepted' | 'rejected' | 'viewing_scheduled' | 'completed' | 'cancelled' | 'expired';
  landlord_response?: string;
  viewing_date?: string;
  viewing_time?: string;
  rejection_reason?: string;
  
  // Follow-up
  tenant_attended_viewing?: boolean;
  tenant_feedback?: string;
  landlord_feedback?: string;
  
  // Metadata
  source: 'web' | 'mobile' | 'api';
  ip_address?: string;
  user_agent?: string;
  
  created_at: string;
  updated_at: string;
  expires_at?: string;
  
  // Relationships
  property?: Property;
  tenant?: User;
  landlord?: User;
}

export interface ViewingRequest {
  date: string;
  time: string;
  notes?: string;
}

// Enhanced Review Types
export interface Review {
  id: string;
  property_id: string;
  reviewer_id: string;
  reviewer_type: 'tenant' | 'landlord';
  booking_id?: string;
  
  // Ratings (1-5)
  overall_rating: number;
  communication_rating: number;
  cleanliness_rating: number;
  location_rating: number;
  value_for_money_rating: number;
  condition_rating: number;
  
  // Content
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  
  // Additional Info
  stay_duration?: string;
  would_recommend: boolean;
  photos?: string[];
  
  // Verification
  verification_status: 'pending' | 'verified' | 'rejected';
  is_anonymous: boolean;
  
  // Moderation
  reported_count: number;
  is_hidden: boolean;
  moderation_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relationships
  property?: Property;
  reviewer?: User;
  booking?: Booking;
}

// User Preferences
export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Search Preferences
  preferred_locations: string[];
  min_price: number;
  max_price: number;
  property_types: string[];
  min_bedrooms: number;
  max_bedrooms: number;
  radius_miles: number;
  
  // Lifestyle Preferences
  pets_required: boolean;
  parking_required: boolean;
  garden_required: boolean;
  furnishing_preference?: string;
  bills_included_preference: boolean;
  
  // Requirements
  students_accepted: boolean;
  dss_accepted: boolean;
  couples_accepted: boolean;
  
  // Notifications
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  instant_alerts: boolean;
  daily_digest: boolean;
  weekly_summary: boolean;
  
  // Privacy
  profile_visible: boolean;
  contact_visible: boolean;
  
  created_at: string;
  updated_at: string;
}

// Saved Properties
export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  notes?: string;
  tags?: string[];
  reminder_date?: string;
  created_at: string;
  
  // Relationships
  property?: Property;
  user?: User;
}

// Property Views Analytics
export interface PropertyView {
  id: string;
  property_id: string;
  viewer_id?: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  source: string;
  view_duration?: number;
  page_views: number;
  interactions: PropertyInteraction[];
  viewed_at: string;
  
  // Relationships
  property?: Property;
  viewer?: User;
}

export interface PropertyInteraction {
  type: 'image_view' | 'map_view' | 'contact_click' | 'phone_reveal' | 'email_click';
  timestamp: string;
  details?: any;
}

// Fraud Reports
export interface FraudReport {
  id: string;
  reported_by: string;
  property_id?: string;
  user_id?: string;
  report_type: 'fake_listing' | 'scam' | 'duplicate_listing' | 'inappropriate_content' | 'price_manipulation' | 'fake_reviews' | 'other';
  description: string;
  evidence_urls: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  resolution_notes?: string;
  action_taken?: string;
  
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  
  // Relationships
  reporter?: User;
  property?: Property;
  reported_user?: User;
  assigned_admin?: User;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  type: 'booking_received' | 'booking_accepted' | 'booking_rejected' | 'viewing_scheduled' | 'property_verified' | 'review_received' | 'system_announcement' | 'price_alert' | 'new_property_match';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  action_url?: string;
  expires_at?: string;
  created_at: string;
  
  // Relationships
  user?: User;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  location?: string;
  postcode?: string;
  city?: string;
  county?: string;
  min_price?: number;
  max_price?: number;
  property_type?: string[];
  bedrooms?: number[];
  bathrooms?: number[];
  furnishing_status?: string[];
  available_from?: string;
  available_to?: string;
  pets_allowed?: boolean;
  parking_required?: boolean;
  garden_required?: boolean;
  smoking_allowed?: boolean;
  students_allowed?: boolean;
  dss_accepted?: boolean;
  couples_allowed?: boolean;
  bills_included?: boolean;
  epc_rating?: string[];
  council_tax_band?: string[];
  amenities?: string[];
  min_tenancy?: number;
  max_tenancy?: number;
  sort_by?: 'price_low' | 'price_high' | 'newest' | 'oldest' | 'most_viewed' | 'best_match' | 'distance';
  radius?: number; // in miles
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
  verified_only?: boolean;
  featured_only?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form Types
export interface PropertyFormData {
  title: string;
  description: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  deposit_amount: number;
  service_charges?: number;
  furnishing_status: string;
  available_from: string;
  minimum_tenancy_months: number;
  maximum_tenancy_months?: number;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  couples_allowed: boolean;
  students_allowed: boolean;
  dss_accepted: boolean;
  professionals_only: boolean;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  county: string;
  postcode: string;
  epc_rating: string;
  council_tax_band: string;
  council_tax_included: boolean;
  bills_included: boolean;
  parking_spaces: number;
  has_garden: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  amenities: string[];
  images: File[];
  virtual_tour_url?: string;
  floor_plan_url?: string;
}

export interface BookingFormData {
  property_id: string;
  message: string;
  preferred_move_date: string;
  viewing_date_requests: ViewingRequest[];
  contact_phone?: string;
  additional_occupants?: number;
  employment_status?: string;
  annual_income?: number;
}

export interface ReviewFormData {
  overall_rating: number;
  communication_rating: number;
  cleanliness_rating: number;
  location_rating: number;
  value_for_money_rating: number;
  condition_rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  stay_duration?: string;
  would_recommend: boolean;
  photos?: File[];
  is_anonymous: boolean;
}

// Admin Types
export interface AdminStats {
  users: {
    total: number;
    active: number;
    landlords: number;
    tenants: number;
    new_this_month: number;
    verified: number;
  };
  properties: {
    total: number;
    active: number;
    pending_verification: number;
    featured: number;
    new_this_month: number;
    average_price: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    new_this_month: number;
  };
  reviews: {
    total: number;
    average_rating: number;
    pending_moderation: number;
    flagged: number;
    new_this_month: number;
  };
  fraud: {
    reports: number;
    investigations: number;
    resolved: number;
    flagged_users: number;
    flagged_properties: number;
  };
}

export interface AdminUser extends User {
  total_properties?: number;
  total_bookings?: number;
  total_reviews?: number;
  average_rating?: number;
  response_rate?: number;
  response_time?: number;
  last_active?: string;
  registration_ip?: string;
  flags?: string[];
}

export interface AdminProperty extends Property {
  landlord?: User;
  total_bookings?: number;
  total_reviews?: number;
  average_rating?: number;
  is_flagged?: boolean;
  flags_count?: number;
  flagged_properties?: any[];
}

// Maps and Location Types
export interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
  postcode?: string;
  city?: string;
  county?: string;
}

export interface MapMarker {
  id: string;
  location: MapLocation;
  property?: Property;
  popup_content?: string;
  cluster?: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Analytics Types
export interface PropertyAnalytics {
  property_id: string;
  metrics: {
    total_views: number;
    unique_views: number;
    total_inquiries: number;
    phone_reveals: number;
    email_clicks: number;
    saves: number;
    shares: number;
  };
  conversion_rates: {
    view_to_inquiry: number;
    view_to_save: number;
    inquiry_to_viewing: number;
  };
  performance: {
    average_view_duration: number;
    bounce_rate: number;
    engagement_score: number;
  };
  traffic_sources: {
    source: string;
    visits: number;
    conversions: number;
  }[];
  view_history: {
    date: string;
    views: number;
    inquiries: number;
  }[];
  demographics: {
    age_groups: Record<string, number>;
    locations: Record<string, number>;
    user_types: Record<string, number>;
  };
}

export interface UserAnalytics {
  user_id: string;
  activity: {
    total_searches: number;
    saved_properties: number;
    inquiries_sent: number;
    properties_listed?: number;
    reviews_left: number;
    profile_views?: number;
  };
  engagement: {
    average_session_duration: number;
    pages_per_session: number;
    last_active: string;
    login_frequency: number;
  };
  preferences: {
    most_searched_locations: string[];
    average_price_range: [number, number];
    preferred_property_types: string[];
  };
  performance?: {
    average_response_time: number;
    response_rate: number;
    property_success_rate: number;
  };
}

// Export all enhanced types
export * from './index';
