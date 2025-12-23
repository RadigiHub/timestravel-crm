// app/leads/types.ts

export type LeadStatusId = string;

export type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;

  status_id: LeadStatusId;

  // optional fields (DB me ho sakte hain, UI me optional)
  assigned_to?: string | null;
  created_at?: string;
  updated_at?: string;
  whatsapp_text?: string | null;
};

export type LeadStatus = {
  id: LeadStatusId;
  name: string;
  color?: string | null;
};
