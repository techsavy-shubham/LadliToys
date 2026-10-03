import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { StoreProvider } from "@/lib/client-state";

export const metadata: Metadata = {
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
