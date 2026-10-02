import Link from "next/link";
import HeroBanners from "@/components/HeroBanners";
import ProductCard from "@/components/ProductCard";
import { ageGroups, banners, bestSellers, categories, queryProducts } from "@/lib/data";

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="container-x mt-14">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {href && <Link href={href} className="text-sm font-bold text-brand hover:underline">View all →</Link>}
      </div>
      {children}
    </section>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>
);

export default function Home() {
  const featured = queryProducts({ featured: true, limit: 8, sort: "rating" }).items;
  const arrivals = queryProducts({ isNew: true, limit: 4, sort: "newest" }).items;
  const deals = queryProducts({ sort: "popularity", limit: 48 }).items.filter((p) => p.discountPercent >= 20).slice(0, 4);

  return (
    <>
      <HeroBanners banners={banners} />

      <Section title="Shop by Category">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 sm:gap-4">
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-3xl p-5 text-center font-bold transition hover:-translate-y-1 hover:shadow-md"
              style={{ background: c.color }}>
              <span className="text-4xl">{c.emoji}</span>
              <span className="text-sm">{c.name}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Shop by Age">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
          {ageGroups.map((a) => (
            <Link key={a.slug} href={`/products?age=${a.slug}`}
              className="flex items-center gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/5 transition hover:ring-brand">
              <span className="text-4xl">{a.emoji}</span>
              <span className="font-extrabold">{a.label}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Featured Toys" href="/products?featured=true"><Grid>{featured.map((p) => <ProductCard key={p.id} p={p} />)}</Grid></Section>
      <Section title="New Arrivals" href="/products?new=true&sort=newest"><Grid>{arrivals.map((p) => <ProductCard key={p.id} p={p} />)}</Grid></Section>
      <Section title="Best Sellers" href="/products?sort=popularity"><Grid>{bestSellers(4).map((p) => <ProductCard key={p.id} p={p} />)}</Grid></Section>
      <Section title="Hot Deals" href="/products?sort=price-asc"><Grid>{deals.map((p) => <ProductCard key={p.id} p={p} />)}</Grid></Section>

      <Section title="Happy Parents">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["The castle set kept my son busy for days. Quality is superb!", "Priya S."],
            ["Fast delivery and the doll was exactly as described. Lovely packaging.", "Ankit R."],
            ["Great range of educational toys for my toddler. Will order again.", "Meera K."],
          ].map(([t, n]) => (
            <figure key={n} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ink/5">
              <div className="text-amber-400">★★★★★</div>
              <blockquote className="mt-2 text-sm">“{t}”</blockquote>
              <figcaption className="mt-3 text-sm font-bold">— {n}</figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  );
}
