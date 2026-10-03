"use client";
import EntityManager from "@/components/admin/EntityManager";
import { Badge, inr } from "@/components/admin/kit";

export default function Page() {
  return (
    <EntityManager title="Coupons" singular="coupon" endpoint="/api/admin/coupons"
      blank={{ code: "", type: "PERCENT", value: 10, minOrder: 0, maxDiscount: "", usageLimit: "", expiresAt: "", active: true }}
      columns={[
        { label: "Code", render: (c) => <span className="font-mono font-bold">{c.code}</span> },
        { label: "Discount", render: (c) => (c.type === "PERCENT" ? `${c.value}%${c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ""}` : inr(c.value)) },
        { label: "Min order", render: (c) => inr(c.minOrder) },
        { label: "Used", render: (c) => `${c.used ?? 0}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
        { label: "Expires", render: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never") },
        { label: "Status", render: (c) => <Badge tone={c.active ? "green" : "gray"}>{c.active ? "Active" : "Inactive"}</Badge> },
      ]}
      fields={[
        { key: "code", label: "Code", required: true, hint: "Letters and numbers, e.g. SUMMER20" },
        { key: "type", label: "Type", type: "select", options: [["PERCENT", "Percentage (%)"], ["FIXED", "Fixed amount (₹)"]] },
        { key: "value", label: "Value", type: "number", required: true }, { key: "minOrder", label: "Minimum order value (₹)", type: "number" },
        { key: "maxDiscount", label: "Maximum discount (₹)", type: "number", hint: "Optional, for % coupons" }, { key: "usageLimit", label: "Usage limit", type: "number", hint: "Optional" },
        { key: "expiresAt", label: "Expiry date", type: "date", hint: "Optional" }, { key: "active", label: "Active", type: "checkbox" },
      ]} />
  );
}
