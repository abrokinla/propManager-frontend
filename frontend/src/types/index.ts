export interface UserProfile {
  id: number;
  role: 'owner' | 'manager';
  phone: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface Property {
  id: number;
  name: string;
  address: string;
  property_type: string;
  description: string;
  total_units?: number;
  owner?: User;
  units_count: number;
  image_url?: string;
  is_published?: boolean;
  amenities?: string;
  nearby_places?: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: number;
  property?: { id: number; name: string };
  property_name?: string;
  property_id?: number;
  unit_number: string;
  bedrooms: number;
  toilets: number;
  bathrooms: number;
  size_sqft: number;
  price_sale: number;
  price_rent: number;
  rent_cycle: 'daily' | 'monthly' | 'yearly';
  status: string;
  tenant_name?: string;
  created_at: string;
  updated_at: string;
}

export type TenancyStatus =
  | 'invited'
  | 'profile_pending'
  | 'document_pending'
  | 'pending_document'
  | 'document_sent'
  | 'document_signed'
  | 'active'
  | 'expired'
  | 'quit_notice_issued';

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  unit?: { id: number; unit_number: string; property_name?: string };
  unit_id?: number;
  unit_number: string;
  property_name: string;
  annual_rent: number;
  rent_cycle: 'daily' | 'monthly' | 'yearly';
  tenancy_status: TenancyStatus;
  passport_photo?: string;
  government_id?: string;
  occupation?: string;
  employer_name?: string;
  employer_address?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_email?: string;
  next_of_kin_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  guarantor_name?: string;
  guarantor_phone?: string;
  guarantor_email?: string;
  guarantor_address?: string;
  profile_completed?: boolean;
  lease_start_date?: string;
  lease_renewal_date?: string;
  lease_expiry_date?: string;
  move_in_date?: string;
  address?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
  id: number;
  tenant?: { id: number; name: string; unit?: { unit_number: string } };
  tenant_id?: number;
  tenant_name?: string;
  unit_number?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  period_start: string;
  period_end: string;
  years_covered: number;
  reference?: string;
  notes?: string;
  status: PaymentStatus;
  proof_url?: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at?: string;
}

export interface MaintenanceRequest {
  id: number;
  unit?: { id: number; unit_number: string; property_name: string };
  unit_id?: number;
  unit_number?: string;
  property_name?: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  reported_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  occupancy_rate: number;
  total_revenue: number;
  upcoming_lease_expirations: Array<{
    tenant: string;
    unit: string;
    property: string;
    expiry_date: string;
  }>;
  recent_payments: Array<{
    tenant: string;
    amount: number;
    date: string;
    period_start: string;
    period_end: string;
  }>;
  open_maintenance: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  [key: string]: string[] | string;
}

// New interfaces for public listings and tenant portal

export interface PublicProperty {
  id: number;
  name: string;
  address: string;
  property_type: string;
  description: string;
  image_url?: string;
  total_units: number;
  amenities: string;
  nearby_places: string;
  available_units_count: number;
  price_range: { min: number; max: number } | null;
}

export interface PublicPropertyDetail extends PublicProperty {
  available_units: Array<{
    id: number;
    unit_number: string;
    bedrooms: number;
    bathrooms: number;
    toilets: number;
    size_sqft: number | null;
    price_rent: number | null;
    price_sale: number | null;
    rent_cycle: 'daily' | 'monthly' | 'yearly';
  }>;
}

export interface TenantProfile {
  phone?: string;
  address?: string;
  occupation?: string;
  employer_name?: string;
  employer_address?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_email?: string;
  next_of_kin_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  guarantor_name?: string;
  guarantor_phone?: string;
  guarantor_email?: string;
  guarantor_address?: string;
}

export interface TenantSelf {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  unit_number: string;
  property_name: string;
  annual_rent: number;
  rent_cycle: 'daily' | 'monthly' | 'yearly';
  tenancy_status: TenancyStatus;
  profile_completed: boolean;
  passport_photo: string;
  government_id: string;
  occupation: string;
  employer_name: string;
  employer_address: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_email: string;
  next_of_kin_address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  guarantor_name: string;
  guarantor_phone: string;
  guarantor_email: string;
  guarantor_address: string;
  lease_start_date?: string;
  lease_renewal_date?: string;
  lease_expiry_date?: string;
  move_in_date?: string;
  created_at: string;
}

export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'pending_verification';

export type AgreementMode = 'template' | 'uploaded_pdf';

export interface TenancyDocument {
  id: number;
  tenant: number;
  tenant_name?: string;
  property_name?: string;
  unit_number?: string;
  document_type: 'tenancy_agreement';
  status: DocumentStatus;
  mode?: AgreementMode;
  document_data: Record<string, unknown>;
  sent_at?: string;
  signed_at?: string;
  file_url?: string;
  signed_file_url?: string;
  uploaded_pdf_url?: string;
  verification_note?: string;
  created_at: string;
  updated_at: string;
}

export type ReminderChannel = 'email';
export type ReminderType = 'lease_expiry' | 'rent_due' | 'rent_renewal' | 'quit_notice' | 'document_sign' | 'tenant_invite';
export type DeliveryStatus = 'sent' | 'delivered' | 'failed';

export interface Reminder {
  id: number;
  tenant: number;
  channel: ReminderChannel;
  reminder_type: ReminderType;
  sent_at: string;
  delivery_status: DeliveryStatus;
  message: string;
}

export interface QuitNotice {
  id: number;
  tenant: number;
  notice_date: string;
  effective_date: string;
  reason?: string;
  status: 'issued' | 'acknowledged' | 'enforced' | 'cancelled';
  document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TenancyAgreementTemplate {
  id: number;
  property: number;
  property_id?: number;
  property_name: string;
  title: string;
  logo_url: string;
  mode?: AgreementMode;
  uploaded_pdf_url?: string;
  template_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}
