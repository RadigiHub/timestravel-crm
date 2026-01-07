import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LeadsNewRedirectPage() {
  // /leads/new ko dynamic route /leads/[id] se bachao
  // aur "open modal" intent ke saath leads board pe bhejo
  redirect("/leads?new=1");
}
