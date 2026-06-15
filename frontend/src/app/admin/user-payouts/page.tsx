import { AdminPayoutRequestsPanel } from "@/components/admin/payout-requests-panel";
import { PayoutType } from "@/lib/prisma-types";

export default function AdminUserPayoutsPage() {
  return (
    <AdminPayoutRequestsPanel
      payoutType={PayoutType.USER}
      title="User Payout Requests"
      description="Review user payment-method payout requests and upload payment proof when paid"
      revalidatePath="/admin/user-payouts"
    />
  );
}
