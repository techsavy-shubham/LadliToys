import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = { title: "Shopping Cart", robots: { index: false, follow: false } };
export default function Page() { return <CartView />; }
