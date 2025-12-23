// app/leads/types.ts

export type LeadStatusId = string;

export type Lead = {
  id: string;

  full_name: string;
  phone?: string | null; // allow undefined to avoid TS mismatch
  email?: string | null;
  source?: string | null;

  status_id: LeadStatusId; // MUST be non-null for board indexing

  // Trip
  trip_type?: string | null;
  from_city?: string | null;
  to_city?: string | null;
  depart_date?: string | null;
  return_date?: string | null;
  cabin?: string | null;
  preferred_airline?: string | null;
  budget?: string | null;

  // Pax
  adults?: number | null;
  children?: number | null;
  infants?: number | null;

  // Priority / WhatsApp
  priority?: string | null;
  whatsapp?: string | null;

  // Some older code referenced this key (keep optional to stop TS error)
  whatsapp_text?: string | null;

  // Follow-up
  follow_up_date?: string | null;
  notes?: string | null;

  // Admin / timestamps
  assigned_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
