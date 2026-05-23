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
  status: string;
  tenant_name?: string;
  created_at: string;
  updated_at: string;
}

export type TenancyStatus =
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
  tenancy_status: TenancyStatus;
  lease_start_date?: string;
  lease_renewal_date?: string;
  lease_expiry_date?: string;
  move_in_date?: string;
  address?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

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

// New interfaces for enhanced tenant features

export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'completed';

export interface TenancyDocument {
  id: number;
  tenant: number;
  document_type: 'tenancy_agreement';
  status: DocumentStatus;
  document_data: Record<string, unknown>;
  sent_at?: string;
  signed_at?: string;
  file_url?: string;
  signed_file_url?: string;
  created_at: string;
  updated_at: string;
}

export type ReminderChannel = 'email';
export type ReminderType = 'lease_expiry' | 'rent_due' | 'quit_notice' | 'document_sign';
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
