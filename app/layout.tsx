import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { StoreProvider } from "@/lib/client-state";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ladli-toys.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  openGraph: { type: "website", siteName: "Ladli Toys", locale: "en_IN", title: "Ladli Toys – Toys, Games & Gifts for Every Child", description: "Shop educational toys, dolls, vehicles, building sets, puzzles, board games and gifts for every age." },
  twitter: { card: "summary" },
  title: { default: "Ladli Toys – Toys, Games & Gifts for Every Child", template: "%s | Ladli Toys" },
  description: "Shop educational toys, dolls, vehicles, building sets, puzzles, board games and gifts for every age at Ladli Toys.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <StoreProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
