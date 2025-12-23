// app/leads/types.ts

export type LeadStatusId = string;

export type LeadPriority = "Hot" | "Warm" | "Cold" | string;
export type TripType = "Return" | "One-way" | "Multi-city" | string;

export type LeadStatus = {
  id: LeadStatusId;
  // NOTE: some DB rows may not have name; keep optional to avoid TS breaks
  name?: string;
  color?: string | null;
};

export type Lead = {
  id: string;

  full_name: string;

  // These can be null/undefined depending on form + DB
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;

  source?: string | null;

  status_id?: LeadStatusId | null;

  trip_type?: TripType | null;
  from?: string | null;
  to?: string | null;
  preferred_airline?: string | null;

  depart_date?: string | null;
  return_date?: string | null;

  cabin?: string | null;
  budget?: string | null;

  adults?: number | null;
  children?: number | null;
  infants?: number | null;

  priority?: LeadPriority | null;

  follow_up_date?: string | null;
  notes?: string | null;

  // optional meta fields (keep optional so builds don't break)
  created_at?: string | null;
  updated_at?: string | null;
  assigned_to?: string | null;

  // optional extra fields (avoid TS break if present in UI code)
  whatsapp_text?: string | null;
};
