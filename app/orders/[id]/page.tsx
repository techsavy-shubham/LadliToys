import type { Metadata } from "next";
import { OrderDetail } from "@/components/OrdersView";

export const metadata: Metadata = { title: "Order details" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} fresh={(await searchParams).placed === "1"} />;
}
