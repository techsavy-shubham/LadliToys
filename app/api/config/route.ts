import { NextResponse } from "next/server";
import { onlinePaymentsAvailable, razorpayConfigured } from "@/lib/payments";

export const GET = () => NextResponse.json({ onlinePayments: onlinePaymentsAvailable(), sandbox: !razorpayConfigured() });
