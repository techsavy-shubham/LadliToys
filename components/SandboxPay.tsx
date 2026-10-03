"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-state";
import { Card, Err } from "./AuthForm";
import { RequireLogin } from "./AccountView";

// Stand-in for the real gateway while no merchant credentials are configured.
export default function SandboxPay() {
  const id = useSearchParams().get("order") || "";
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function go(outcome: "success" | "fail" | "cancel") {
    setBusy(true); setErr("");
    const r = await api("/api/payments/sandbox", "POST", { orderId: id, outcome });
    if (!r.ok) { setBusy(false); return setErr(r.data.error || "Something went wrong."); }
    router.push(`/orders/${id}?placed=1`);
  }
  return (
    <RequireLogin>
      <Card title="Test payment gateway">
        <p className="mb-4 rounded-xl bg-sun/20 px-3 py-2 text-sm">No live payment gateway is connected yet, so this sandbox simulates one. No money is charged. Once the store owner adds their Razorpay credentials, customers will see the real payment window instead.</p>
        <div className="space-y-2">
          <button disabled={busy} onClick={() => go("success")} className="btn btn-primary w-full">Simulate successful payment</button>
          <button disabled={busy} onClick={() => go("fail")} className="btn btn-ghost w-full">Simulate failed payment</button>
          <button disabled={busy} onClick={() => go("cancel")} className="btn btn-ghost w-full">Cancel payment</button>
        </div>
        <div className="mt-3"><Err m={err} /></div>
      </Card>
    </RequireLogin>
  );
}
