import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function Page() {
  return <Suspense><ResetForm /></Suspense>;
}
