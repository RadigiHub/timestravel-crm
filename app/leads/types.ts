export type Lead = {
  id: string;
  full_name: string;

  phone: string | null;
  email: string | null;
  source: string | null;

  status_id: string;
  position: number | null;

  priority: "hot" | "warm" | "cold" | null;

  assigned_to: string | null;
  created_at: string | null;
  updated_at: string | null;

  // optional business fields
  from_city: string | null;
  to_city: string | null;
  trip_type: string | null;
  depart_date: string | null;
  return_date: string | null;
  cabin: string | null;
  budget: string | null;

  adults: number | null;
  children: number | null;
  infants: number | null;

  whatsapp: string | null;
  followup_date: string | null;
  notes: string | null;
};
