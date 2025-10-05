import { Timestamp } from 'firebase/firestore';

// Re-export Timestamp for use in other files
export { Timestamp };

// Lead Status Types
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
export type LeadStage = 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase';
export type AccountStatus = 'active' | 'churned' | 'suspended';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';
export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type ContractStatus = 'active' | 'expired' | 'pending' | 'cancelled';

// Main Lead Document
export interface Lead {
  lead_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  full_name_lower: string;
  email: string;
  email_lower: string;
  phone: string;
  phone_digits: string;
  company: string;
  company_lower: string;
  title: string;
  status: LeadStatus;
  stage: LeadStage;
  contract_value: number;
  account_status: AccountStatus;
  source: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  search_prefixes: string[];
  tags: string[];
  notes: string;
  assigned_to: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  expected_close_date?: Timestamp;
  estimated_value?: number;
  currency?: string;
}

// Status History Subcollection
export interface StatusHistory {
  event_id: string;
  from_status: LeadStatus;
  to_status: LeadStatus;
  transition_reason: string;
  timestamp: Timestamp;
  changed_by: string;
  search_keywords: string[];
  lead_id: string;
  lead_name: string;
  lead_email: string;
  // Optional fields
  notes?: string;
  automated?: boolean;
  previous_data?: any;
  new_data?: any;
}

// Activity Subcollection
export interface Activity {
  activity_id: string;
  type: ActivityType;
  subject: string;
  subject_lower: string;
  notes: string;
  notes_lower: string;
  search_keywords: string[];
  timestamp: Timestamp;
  lead_id: string;
  lead_name: string;
  lead_email: string;
  created_by: string;
  // Optional fields
  duration?: number; // in minutes
  outcome?: string;
  next_follow_up?: Timestamp;
  attachments?: string[];
  status?: 'completed' | 'pending' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
}

// Proposal Subcollection
export interface Proposal {
  proposal_id: string;
  title: string;
  title_lower: string;
  description?: string;
  description_lower?: string;
  status: ProposalStatus;
  sent_at: Timestamp;
  search_keywords: string[];
  lead_id: string;
  lead_name: string;
  lead_email: string;
  created_by: string;
  // Optional fields
  amount?: number;
  currency?: string;
  valid_until?: Timestamp;
  notes?: string;
  attachments?: string[];
  terms?: string;
  version?: number;
  revision_reason?: string;
  response_deadline?: Timestamp;
}

// Contract Subcollection
export interface Contract {
  contract_id: string;
  title?: string;
  title_lower?: string;
  status: ContractStatus;
  start_date: Timestamp;
  end_date: Timestamp;
  renewal_date?: Timestamp;
  search_keywords: string[];
  lead_id: string;
  lead_name: string;
  lead_email: string;
  created_by: string;
  // Optional fields
  amount?: number;
  currency?: string;
  terms?: string;
  auto_renew?: boolean;
  notes?: string;
  attachments?: string[];
  contract_type?: 'service' | 'license' | 'consulting' | 'maintenance';
  version?: number;
  signed_date?: Timestamp;
  signed_by?: string;
}

// Audit Log Subcollection
export interface AuditLog {
  log_id: string;
  changed_by: string;
  fields_changed: Array<{
    field: string;
    old_value: any;
    new_value: any;
    field_type?: string;
  }>;
  timestamp: Timestamp;
  search_keywords: string[];
  lead_id: string;
  lead_name: string;
  lead_email: string;
  change_type: 'create' | 'update' | 'delete' | 'status_change' | 'subcollection_change';
  // Optional fields
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  subcollection_type?: 'activities' | 'proposals' | 'contracts' | 'status_history';
  subcollection_id?: string;
  automated?: boolean;
}

// Version Subcollection (Optional - for full snapshots)
export interface LeadVersion {
  version_id: string;
  version_number: number;
  snapshot_data: Lead; // Full lead data at this point
  timestamp: Timestamp;
  created_by: string;
  change_reason: string;
  search_keywords: string[];
  lead_id: string;
  lead_name: string;
  lead_email: string;
  // Optional fields
  major_changes?: string[];
  automated?: boolean;
  retention_date?: Timestamp;
}

// Global Search Index
export interface SearchIndexEntry {
  entity_type: 'lead' | 'activity' | 'proposal' | 'contract' | 'audit_log';
  entity_id: string;
  lead_id: string;
  lead_name: string;
  keywords: string[];
  status: string;
  created_at: Timestamp;
  last_updated_at: Timestamp;
  // Additional searchable fields
  title?: string;
  subject?: string;
  notes?: string;
  email?: string;
  phone?: string;
}

// Search and Filter Types
export interface SearchFilters {
  status?: LeadStatus | AccountStatus;
  source?: string;
  assigned_to?: string;
  type?: string;
  tags?: string[];
  date_range?: {
    start: Timestamp;
    end: Timestamp;
  };
  entity_type?: 'lead' | 'activity' | 'proposal' | 'contract' | 'all';
}

export interface SearchResult {
  id: string;
  type: 'lead' | 'activity' | 'proposal' | 'contract' | 'audit_log';
  title: string;
  subtitle: string;
  status: string;
  timestamp: Timestamp;
  lead_id?: string;
  lead_name?: string;
  highlight?: string;
  data: any; // The actual document data
}

// Utility types for form handling
export type LeadFormData = Omit<Lead, 'lead_id' | 'created_at' | 'updated_at' | 'search_prefixes' | 'full_name' | 'full_name_lower' | 'email_lower' | 'phone_digits' | 'company_lower' | 'contract_value' | 'address'>;
export type ActivityFormData = Omit<Activity, 'activity_id' | 'timestamp' | 'search_keywords' | 'lead_id' | 'lead_name'>;
export type ProposalFormData = Omit<Proposal, 'proposal_id' | 'sent_at' | 'search_keywords' | 'lead_id' | 'lead_name'>;
export type ContractFormData = Omit<Contract, 'contract_id' | 'search_keywords' | 'lead_id' | 'lead_name'>;

