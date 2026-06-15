import { redirect } from "next/navigation";

export default function AdminPayoutRequestsRedirect() {
  redirect("/admin/user-payouts");
}
