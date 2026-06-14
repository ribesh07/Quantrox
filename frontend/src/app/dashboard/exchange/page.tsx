
"use client";

import React, {
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  ArrowUpDown,
  
  Download,
  Expand,
  
  Upload,
  Wallet,
  QrCode,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


import {

  Copy,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  createOrderAction,
  uploadOrderProofAction,
} from "@/actions/order.actions";

import { getUserWalletsAction } from "@/actions/wallet.actions";
import { getPaymentMethodsAction } from "@/actions/payment.actions";
import { getPaymentAccountAction } from "@/actions/payment-account.actions";

type ExchangePayload = {
  type: "EXCHANGE";

  fromWalletId: string;
  toWalletId: string;

  amount: number;

  exchangeRate: number;
  fee: number;
  receiveAmount: number;

  adminWalletId: string;

  receiveUsername: string;
  receiveWalletNumber: string;
  receiveEmail?: string;
  receivePhone?: string;

  transactionReference?: string;

  status: "PENDING";
};

export default function WalletExchangePage() {
  const router = useRouter();

  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");

  const [amount, setAmount] = useState("");

  const [receiveUsername, setReceiveUsername] = useState("");
  const [receiveWalletNumber, setReceiveWalletNumber] = useState("");
  const [receiveEmail, setReceiveEmail] = useState("");
  const [receivePhone, setReceivePhone] = useState("");

  const [transactionReference, setTransactionReference] =
    useState("");

  const [paymentProof, setPaymentProof] =
    useState<File | null>(null);

  const [paymentPreview, setPaymentPreview] =
    useState<string | null>(null);

  const [receiveQr, setReceiveQr] =
    useState<File | null>(null);

  const [receiveQrPreview, setReceiveQrPreview] =
    useState<string | null>(null);

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ["user-wallets"],
    queryFn: async () => {
      const result = await getUserWalletsAction();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.wallets;
    },
  });

  const { data: methods } = useQuery({
    queryKey: ["exchange-methods"],
    queryFn: async () => {
      const result =
        await getPaymentMethodsAction("EXCHANGE");

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.methods;
    },
  });

  const fromWallet = wallets?.find(
    (wallet: any) => wallet.id === fromWalletId
  );

  const toWallet =
  methods?.find(
    (m: any) =>
      m.id === toWalletId
  );

  const { data: adminWallet } = useQuery({
    queryKey: ["admin-wallet", fromWalletId],
    queryFn: async () => {
      const result =
        await getPaymentAccountAction(fromWalletId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.account;
    },
    enabled: !!fromWalletId,
  });

  const exchangeRate = toWallet?.rate ?? 1;

  const feePercentage = toWallet?.feePercentage ?? 0;

  const summary = useMemo(() => {
    const amountNum = Number(amount || 0);

    const fee =
      (amountNum * feePercentage) / 100;

    const receive =
      amountNum * exchangeRate - fee;

    return {
      fee,
      receive,
    };
  }, [
    amount,
    exchangeRate,
    feePercentage,
  ]);

  const handleSwap = () => {
    const from = fromWalletId;

    setFromWalletId(toWalletId);
    setToWalletId(from);
  };

  const handleProofUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setPaymentProof(file);

    setPaymentPreview(
      URL.createObjectURL(file)
    );
  };

  const handleReceiveQrUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setReceiveQr(file);

    setReceiveQrPreview(
      URL.createObjectURL(file)
    );
  };


const mutation = useMutation({
  mutationFn: async () => {
    if (
      !transactionReference &&
      !paymentProof
    ) {
      throw new Error(
        "Transaction reference or screenshot required"
      );
    }

    const payload = {
      type: "EXCHANGE",

      fromWalletId,
      toWalletId,

      amount: Number(amount),

      exchangeRate,

      fee: summary.fee,

      receiveAmount: summary.receive,

      adminWalletId: adminWallet?.id,

      receiveUsername,
      receiveWalletNumber,
      receiveEmail,
      receivePhone,

      transactionReference,

      status: "PENDING",
    };

    const result =
      await createOrderAction(payload);

    if (!result.success) {
      throw new Error(result.error);
    }

    if (paymentProof) {
      const formData = new FormData();

      formData.append(
        "file",
        paymentProof
      );

      await uploadOrderProofAction(
        result.order.id,
        formData
      );
    }

    return result.order;
  },

  onSuccess: () => {
    toast.success(
      "Exchange request submitted successfully"
    );

    router.push(
      "/dashboard/orders"
    );
  },

  onError: (error: any) => {
    toast.error(error.message);
  },
});
  if (walletsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
  <div>
    <h1 className="text-4xl font-black text-white">
      Wallet Exchange
    </h1>

    <p className="text-[#848E9C] mt-2">
      Exchange funds between eSewa, Khalti,
      PayPal, Binance, Chime, Zelle,
      Cash App and other supported wallets.
    </p>
  </div>

  <div className="grid gap-6 lg:grid-cols-3">
    <div className="lg:col-span-2 space-y-6">

      {/* SEND FROM */}

      <Card className="bg-[#1E2329] border-[#2B3139]">
        <CardHeader>
          <CardTitle>
            Send From
          </CardTitle>
        </CardHeader>

        <CardContent>

       <Select
  value={fromWalletId}
  onValueChange={setFromWalletId}
>
  <SelectTrigger>
    <SelectValue placeholder="Select wallet" />
  </SelectTrigger>

  <SelectContent>
    {wallets?.map((wallet: any) => (
      <SelectItem
        key={wallet.id}
        value={wallet.id}
      >
        {wallet.paymentMethod.name}
        {" "}
        (Balance: {wallet.balance})
      </SelectItem>
    ))}
  </SelectContent>
</Select>

          {fromWallet && (
            <div className="mt-4 rounded-xl border border-[#2B3139] p-4">
              <p className="text-xs text-muted-foreground">
                Available Balance
              </p>

              <p className="font-bold text-lg">
                {fromWallet.balance}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SWAP */}

      <div className="flex justify-center">
        <Button
          type="button"
          size="icon"
          onClick={handleSwap}
          className="rounded-full h-14 w-14"
        >
          <ArrowUpDown className="h-5 w-5" />
        </Button>
      </div>

      {/* RECEIVE IN */}

      <Card className="bg-[#1E2329] border-[#2B3139]">
        <CardHeader>
          <CardTitle>
            Receive In
          </CardTitle>
        </CardHeader>

        <CardContent>

          <Select
            value={toWalletId}
            onValueChange={setToWalletId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination wallet" />
            </SelectTrigger>

            <SelectContent>

              {methods?.map((method: any) => (
                <SelectItem
                  key={method.id}
                  value={method.id}
                >
                  {method.name}
                </SelectItem>
              ))}

            </SelectContent>
          </Select>

        </CardContent>
      </Card>

      {/* AMOUNT DETAILS */}

      <Card className="bg-[#1E2329] border-[#2B3139]">
        <CardHeader>
          <CardTitle>
            Amount Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <div>
            <Label>
              Amount To Exchange
            </Label>

            <Input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="1000"
            />
          </div>

          <div className="rounded-xl border border-[#2B3139] p-4 space-y-3">

            <div className="flex justify-between">
              <span>
                Exchange Rate
              </span>

              <span>
                1 : {exchangeRate}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Processing Fee
              </span>

              <span>
                {summary.fee.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between font-bold">
              <span>
                You Receive
              </span>

              <span>
                {summary.receive.toFixed(2)}
              </span>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* ADMIN WALLET */}

      {adminWallet && (
        <Card className="bg-[#1E2329] border-[#2B3139]">
          <CardHeader>
            <CardTitle>
              Send Payment To
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {adminWallet.qrCodeUrl && (
              <div className="flex justify-center">

                <Dialog>

                  <DialogTrigger asChild>

                    <button>

                      <Image
                        src={adminWallet.qrCodeUrl}
                        alt="QR"
                        width={220}
                        height={220}
                        className="rounded-xl"
                      />

                    </button>

                  </DialogTrigger>

                  <DialogContent>

                    <Image
                      src={adminWallet.qrCodeUrl}
                      alt="QR"
                      width={500}
                      height={500}
                    />

                  </DialogContent>

                </Dialog>

              </div>
            )}

            <div className="space-y-2">

              <div>
                <Label>
                  Username
                </Label>

                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={
                      adminWallet.accountName || ""
                    }
                  />

                  <Button
                    type="button"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        adminWallet.accountName || ""
                      );

                      toast.success(
                        "Copied"
                      );
                    }}
                  >
                    <Copy />
                  </Button>
                </div>
              </div>

              <div>
                <Label>
                  Wallet Number
                </Label>

                <div className="flex gap-2">

                  <Input
                    readOnly
                    value={
                      adminWallet.accountNumber || ""
                    }
                  />

                  <Button
                    type="button"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        adminWallet.accountNumber || ""
                      );

                      toast.success(
                        "Copied"
                      );
                    }}
                  >
                    <Copy />
                  </Button>

                </div>

              </div>

            </div>

            <div className="rounded-xl bg-primary/10 p-4">
              Processing Time:
              5–30 Minutes
            </div>

          </CardContent>
        </Card>
      )}

      {/* RECEIVING DETAILS */}

      <Card className="bg-[#1E2329] border-[#2B3139]">
        <CardHeader>
          <CardTitle>
            Your Receiving Wallet Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="Username / Account Name"
            value={receiveUsername}
            onChange={(e) =>
              setReceiveUsername(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Wallet Number / Account ID"
            value={receiveWalletNumber}
            onChange={(e) =>
              setReceiveWalletNumber(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Email"
            value={receiveEmail}
            onChange={(e) =>
              setReceiveEmail(
                e.target.value
              )
            }
          />

          <Input
            placeholder="Phone"
            value={receivePhone}
            onChange={(e) =>
              setReceivePhone(
                e.target.value
              )
            }
          />

          <div>

            <Label>
              Upload QR Code
            </Label>

            <Input
              type="file"
              accept="image/*"
              onChange={
                handleReceiveQrUpload
              }
            />

          </div>

          {receiveQrPreview && (
            <Image
              src={receiveQrPreview}
              alt=""
              width={180}
              height={180}
              className="rounded-xl"
            />
          )}

        </CardContent>
      </Card>
            {/* PAYMENT VERIFICATION */}

      <Card className="bg-[#1E2329] border-[#2B3139]">
        <CardHeader>
          <CardTitle>
            Payment Verification
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          <div className="space-y-2">
            <Label>
              Transaction Reference ID
            </Label>

            <Input
              placeholder="TRX123456789"
              value={transactionReference}
              onChange={(e) =>
                setTransactionReference(
                  e.target.value
                )
              }
            />
          </div>

          <div className="space-y-2">

            <Label>
              Payment Screenshot
            </Label>

            <div className="border-2 border-dashed border-[#2B3139] rounded-2xl p-6">

              <Input
                type="file"
                accept="
                image/png,
                image/jpeg,
                image/jpg,
                image/webp
                "
                onChange={handleProofUpload}
              />

            </div>

          </div>

          {paymentPreview && (
            <div className="space-y-2">

              <Label>
                Preview
              </Label>

              <Image
                src={paymentPreview}
                alt="Payment Proof"
                width={400}
                height={300}
                className="
                rounded-xl
                border
                border-[#2B3139]
                "
              />

            </div>
          )}

          {!transactionReference &&
            !paymentProof && (
              <div
                className="
                rounded-xl
                border
                border-red-500/30
                bg-red-500/10
                p-4
                text-red-400
                text-sm
                "
              >
                You must provide either
                Transaction Reference ID
                or Payment Screenshot.
              </div>
            )}

        </CardContent>
      </Card>

    </div>

    {/* RIGHT SIDEBAR */}

    <div className="space-y-6">

      {/* SUMMARY */}

      <Card className="bg-[#1E2329] border-[#2B3139] sticky top-6">

        <CardHeader>
          <CardTitle>
            Exchange Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="flex justify-between">
            <span className="text-[#848E9C]">
              From
            </span>

            <span className="font-medium">
              {fromWallet?.paymentMethod
                ?.name || "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#848E9C]">
              To
            </span>

            <span className="font-medium">
              {toWallet?.name || "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#848E9C]">
              Amount
            </span>

            <span className="font-medium">
              {amount || 0}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#848E9C]">
              Rate
            </span>

            <span className="font-medium">
              1 : {exchangeRate}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#848E9C]">
              Fee
            </span>

            <span className="text-orange-400 font-medium">
              {summary.fee.toFixed(2)}
            </span>
          </div>

          <div className="border-t border-[#2B3139]" />

          <div className="flex justify-between text-lg font-bold">

            <span>
              You Receive
            </span>

            <span className="text-primary">
              {summary.receive.toFixed(2)}
            </span>

          </div>

          <div className="border-t border-[#2B3139]" />

          <div className="flex justify-between">

            <span className="text-[#848E9C]">
              Status
            </span>

            <span
              className="
              text-yellow-400
              font-semibold
              "
            >
              Pending Approval
            </span>

          </div>

        </CardContent>

      </Card>

      {/* SUBMIT */}

      <Card className="bg-[#1E2329] border-[#2B3139]">

        <CardContent className="pt-6">

          <Button
            type="button"
            className="
            w-full
            h-14
            text-lg
            font-bold
            "
            disabled={
              mutation.isPending ||
              !fromWalletId ||
              !toWalletId ||
              !amount ||
              !receiveUsername ||
              !receiveWalletNumber
            }
            onClick={() => {

              if (
                !transactionReference &&
                !paymentProof
              ) {
                toast.error(
                  "Provide transaction reference or payment screenshot"
                );

                return;
              }

              mutation.mutate();
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2
                  className="
                  h-5
                  w-5
                  mr-2
                  animate-spin
                  "
                />

                Submitting...
              </>
            ) : (
              "Submit Exchange Request"
            )}
          </Button>

        </CardContent>

      </Card>

      {/* INFO */}

      <Card className="bg-[#1E2329] border-[#2B3139]">

        <CardHeader>
          <CardTitle>
            Important Notes
          </CardTitle>
        </CardHeader>

        <CardContent>

          <ul className="space-y-3 text-sm text-[#848E9C]">

            <li>
              • Processing time:
              5–30 minutes
            </li>

            <li>
              • Ensure wallet details
              are correct.
            </li>

            <li>
              • Upload clear payment proof.
            </li>

            <li>
              • Incorrect information
              may delay approval.
            </li>

            <li>
              • Exchange requests are
              manually verified.
            </li>

          </ul>

        </CardContent>

      </Card>

    </div>
  </div>
</div>

  );
}
