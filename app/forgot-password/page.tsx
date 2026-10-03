import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function Page() {
  return <Suspense><ForgotForm /></Suspense>;
}
