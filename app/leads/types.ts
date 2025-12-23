export type Lead = {
  id: string;

  full_name: string;

  // DB se kabhi null/undefined aa sakta hai (especially if old rows)
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;

  source?: string | null;
  status_id?: string | null;

  // optional fields (avoid build failing)
  assigned_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  whatsapp_text?: string | null;

  // trip fields (optional)
  trip_type?: string | null;
  from?: string | null;
  to?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  cabin?: string | null;
  budget?: string | null;
  adults?: number | null;
  children?: number | null;
  infants?: number | null;
  priority?: string | null;
  followup_date?: string | null;
  notes?: string | null;

  // allow any extra DB columns without breaking TS
  [key: string]: any;
};

export type LeadStatus = {
  id: string;
  name: string;
  color?: string | null;
  sort_order?: number | null;
};
