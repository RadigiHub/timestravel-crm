// app/leads/types.ts

export type LeadStatusId = string;

export type LeadStatus = {
  id: LeadStatusId;
  label: string;
  color?: string | null;
};

// Make fields optional/nullable because DB/API may not return all columns
export type Lead = {
  id: string;

  full_name: string;
  phone?: string | null;       // allow undefined too
  email?: string | null;
  whatsapp?: string | null;

  source?: string | null;

  // IMPORTANT: status_id can be null from DB; we will normalize in Board
  status_id?: LeadStatusId | null;

  // optional fields (because your fetch may not include them yet)
  assigned_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  // optional extra (your log showed whatsapp_text error)
  whatsapp_text?: string | null;

  // anything else
  [key: string]: any;
};
