// app/leads/types.ts

export type LeadStatus = {
  id: string;
  name: string;
  color?: string | null;
};

export type Lead = {
  id: string;

  full_name: string;
  phone?: string | null; // ✅ allow undefined as well
  email?: string | null;
  source?: string | null;

  status_id: string;

  // optional fields (your UI has these)
  trip_type?: string | null;
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

  priority?: string | null;
  whatsapp?: string | null;

  follow_up_date?: string | null;
  notes?: string | null;

  // these were causing TS errors in your repo
  assigned_to?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};
