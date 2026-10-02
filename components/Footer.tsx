import Link from "next/link";
import { categories } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-2xl font-extrabold text-white">🧸 Ladli<span className="text-sun">Toys</span></div>
          <p className="mt-3 text-sm">Joyful, safe and thoughtfully chosen toys for every little one.</p>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-white">Shop</h3>
          <ul className="space-y-1.5 text-sm">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}><Link className="hover:text-sun" href={`/products?category=${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-white">Help</h3>
          <ul className="space-y-1.5 text-sm">
            <li>Shipping & Delivery</li><li>Returns & Refunds</li><li>Safety Information</li><li>Contact Us</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-white">Newsletter</h3>
          <p className="mb-3 text-sm">New arrivals and offers, straight to your inbox.</p>
          <form className="flex gap-2">
            <input type="email" placeholder="Email address" aria-label="Email" className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/50" />
            <button type="button" className="btn btn-primary">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} Ladli Toys. All rights reserved.</div>
    </footer>
  );
}
