// app/leads/types.ts

export type LeadStatusId = string;

export type LeadStatus = {
  id: LeadStatusId;
  name: string;
  color?: string | null;
  order?: number | null;
};

export type LeadPriority = "hot" | "warm" | "cold" | string;

export type Lead = {
  id: string;

  full_name: string;
  phone: string | null; // IMPORTANT: no undefined, only string|null
  email: string | null;
  source?: string | null;

  status_id: LeadStatusId | null; // DB can be null
  priority?: LeadPriority | null;

  from?: string | null;
  to?: string | null;
  trip_type?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  cabin?: string | null;
  budget?: string | null;
  preferred_airline?: string | null;

  adults?: number | null;
  children?: number | null;
  infants?: number | null;

  whatsapp?: string | null;
  whatsapp_text?: string | null;

  notes?: string | null;
  follow_up_date?: string | null;

  assigned_to?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};
