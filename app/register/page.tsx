import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Register", robots: { index: false, follow: false } };

export default function Page() {
  return <Suspense><RegisterForm /></Suspense>;
}
