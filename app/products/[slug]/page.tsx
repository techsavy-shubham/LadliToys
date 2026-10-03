import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import ProductCard, { Stars } from "@/components/ProductCard";
import ProductPurchase from "@/components/ProductPurchase";
import Reviews from "@/components/Reviews";
import { findProduct, getBrands, getCategories, relatedTo } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await findProduct((await params).slug);
  return p ? { title: p.name, description: p.description } : {};
}

export default async function ProductPage({ params }: Props) {
  const p = await findProduct((await params).slug);
  if (!p) notFound();
  const [categories, brands, rel] = await Promise.all([getCategories(true), getBrands(), relatedTo(p)]);
  const cat = categories.find((c) => c.slug === p.categorySlug) ?? { slug: p.categorySlug, name: p.categorySlug };
  const brand = brands.find((b) => b.slug === p.brandSlug) ?? { slug: p.brandSlug, name: p.brandSlug };

  return (
    <div className="container-x py-8">
      <nav className="mb-5 text-sm text-ink/60">
        <Link href="/" className="hover:text-brand">Home</Link> / <Link href="/products" className="hover:text-brand">Shop</Link> /{" "}
        <Link href={`/products?category=${cat.slug}`} className="hover:text-brand">{cat.name}</Link> / <span className="text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <Gallery emoji={p.emoji} colors={p.colors} images={p.images} />
        <div className="space-y-5">
          <div>
            <Link href={`/products?brand=${brand.slug}`} className="text-sm font-bold text-brand">{brand.name}</Link>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight">{p.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm"><Stars rating={p.rating} /><span className="text-ink/60">{p.rating} · {p.reviewCount} reviews</span></div>
          </div>
          <ProductPurchase product={p} />
          <p className="text-ink/80">{p.description}</p>
          <dl className="grid grid-cols-2 gap-3 rounded-3xl bg-white p-5 text-sm ring-1 ring-ink/5">
            <div><dt className="text-ink/50">Age</dt><dd className="font-bold">{p.ageLabel}</dd></div>
            <div><dt className="text-ink/50">SKU</dt><dd className="font-bold">{p.sku}</dd></div>
            <div><dt className="text-ink/50">Category</dt><dd className="font-bold">{cat.name}</dd></div>
            <div><dt className="text-ink/50">Material</dt><dd className="font-bold">{p.material}</dd></div>
          </dl>
          <div className="rounded-3xl bg-sun/20 p-5 text-sm"><strong>⚠️ Safety notes:</strong> {p.safety}</div>
        </div>
      </div>

      <Reviews slug={p.slug} rating={p.rating} count={p.reviewCount} />

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-extrabold">Related Toys</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {rel.map((r) => <ProductCard key={r.id} p={r} />)}
        </div>
      </section>
    </div>
  );
}
