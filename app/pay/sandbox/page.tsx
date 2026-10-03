import { Suspense } from "react";
import type { Metadata } from "next";
import SandboxPay from "@/components/SandboxPay";

export const metadata: Metadata = { title: "Test payment", robots: { index: false } };
export default function Page() { return <Suspense><SandboxPay /></Suspense>; }
