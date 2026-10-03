import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default function Page() {
  return <Suspense><LoginForm /></Suspense>;
}
