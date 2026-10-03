import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = { title: "Shopping Cart" };
export default function Page() { return <CartView />; }
