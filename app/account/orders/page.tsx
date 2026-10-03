import type { Metadata } from "next";
import { OrderList } from "@/components/OrdersView";

export const metadata: Metadata = { title: "My Orders" };
export default function Page() { return <OrderList />; }
