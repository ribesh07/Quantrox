import { AdminPayoutRequestsPanel } from "@/components/admin/payout-requests-panel";
import { PayoutType } from "@/lib/prisma-types";

export default function AdminMerchantPayoutsPage() {
  return (
    <AdminPayoutRequestsPanel
      payoutType={PayoutType.MERCHANT}
      title="Merchant Payout Requests"
      description="Review merchant wallet payout requests and upload payment proof when paid"
      revalidatePath="/admin/merchant-payouts"
    />
  );
}
