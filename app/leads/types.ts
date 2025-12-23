// app/leads/types.ts
export type LeadStatusId = string;

export type LeadPriority = "Hot" | "Warm" | "Cold" | string;

export interface LeadStatus {
  id: LeadStatusId;
  name: string;
  color?: string | null;
  order?: number | null;
}

export interface Lead {
  id: string;

  full_name: string;
  phone: string | null; // IMPORTANT: undefined nahi
  email: string | null;

  source?: string | null;

  status_id: LeadStatusId; // IMPORTANT: null nahi
  priority?: LeadPriority | null;

  // Trip fields (optional / nullable)
  trip_type?: string | null;
  from_location?: string | null;
  to_location?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  cabin?: string | null;
  preferred_airline?: string | null;
  budget?: string | null;

  adults?: number | null;
  children?: number | null;
  infants?: number | null;

  whatsapp?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;

  // common meta (agar DB me ho)
  assigned_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
