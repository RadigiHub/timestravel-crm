// app/leads/types.ts

export type LeadId = string;
export type LeadStatusId = string;

/**
 * Some places in your app are using Status, some using LeadStatus.
 * We export BOTH (aliases) so TS never fights again.
 */
export type LeadStatus = {
  id: LeadStatusId;
  name: string; // required, because page.tsx error said Status missing "name"
  color?: string | null;
};

export type Status = LeadStatus; // alias for compatibility

/**
 * Lead type: keep fields optional/nullable to match Supabase reality.
 * IMPORTANT: phone must allow undefined OR null because your API sometimes returns undefined.
 */
export type Lead = {
  id: LeadId;

  status_id: LeadStatusId | null;

  name?: string | null;
  phone?: string | null | undefined;
  email?: string | null;

  whatsapp_text?: string | null;

  assigned_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  // keep extra fields safe (if DB adds new cols, build won't break)
  [key: string]: any;
};
