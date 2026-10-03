import type { Metadata } from "next";
import WishlistView from "@/components/WishlistView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: false } };
export default function Page() { return <WishlistView />; }
