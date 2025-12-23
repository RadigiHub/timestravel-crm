// app/leads/types.ts

export type LeadStatusId = string;

export type LeadStatus = {
  id: LeadStatusId;
  label: string;
  position: number;
  color?: string | null;
};

// Keep this permissive to match Supabase reality (null/undefined can happen)
export type Lead = {
  id: string;

  full_name?: string | null;

  phone?: string | null; // can be undefined in fetched objects
  email?: string | null;
  source?: string | null;

  status_id?: LeadStatusId | null; // can be null in DB
  position?: number | null;

  priority?: "hot" | "warm" | "cold" | null;

  assigned_to?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  whatsapp_text?: string | null;
};
