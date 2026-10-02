// Seed catalog for Milestone 1. Mirrors prisma/schema.prisma so the data layer
// can be swapped for a PostgreSQL/MySQL-backed implementation without touching the API or UI.

export type Category = { id: string; slug: string; name: string; emoji: string; color: string; active: boolean };
export type Brand = { id: string; slug: string; name: string };
export type AgeGroup = { slug: string; label: string; emoji: string; min: number; max: number };
export type Banner = { id: string; title: string; subtitle: string; cta: string; href: string; from: string; to: string; emoji: string };
export type Variant = { id: string; sku: string; label: string; price: number; stock: number };
export type Product = {
  id: string; slug: string; sku: string; name: string; description: string;
  price: number; discountPercent: number; stock: number; categorySlug: string; brandSlug: string;
  ageGroup: string; ageLabel: string; rating: number; reviewCount: number; sold: number;
  emoji: string; colors: [string, string]; material: string; safety: string;
  featured: boolean; isNew: boolean; variants: Variant[]; createdAt: string; published: boolean;
};

export const categories: Category[] = [
  { id: "c1", slug: "educational-toys", name: "Educational Toys", emoji: "🧠", color: "#fde68a", active: true },
  { id: "c2", slug: "dolls", name: "Dolls", emoji: "🪆", color: "#fbcfe8", active: true },
  { id: "c3", slug: "vehicles", name: "Vehicles", emoji: "🚗", color: "#bfdbfe", active: true },
  { id: "c4", slug: "building-sets", name: "Building Sets", emoji: "🧱", color: "#fecaca", active: true },
  { id: "c5", slug: "outdoor-toys", name: "Outdoor Toys", emoji: "⚽", color: "#bbf7d0", active: true },
  { id: "c6", slug: "baby-toys", name: "Baby Toys", emoji: "🧸", color: "#e9d5ff", active: true },
  { id: "c7", slug: "puzzles", name: "Puzzles", emoji: "🧩", color: "#fed7aa", active: true },
  { id: "c8", slug: "art-craft", name: "Art & Craft", emoji: "🎨", color: "#a5f3fc", active: true },
  { id: "c9", slug: "board-games", name: "Board Games", emoji: "🎲", color: "#d9f99d", active: true },
  { id: "c10", slug: "gifts", name: "Gifts", emoji: "🎁", color: "#fecdd3", active: true },
];

export const brands: Brand[] = [
  { id: "b1", slug: "ladli-originals", name: "Ladli Originals" },
  { id: "b2", slug: "brickworks", name: "BrickWorks" },
  { id: "b3", slug: "little-genius", name: "Little Genius" },
  { id: "b4", slug: "speedy-wheels", name: "Speedy Wheels" },
  { id: "b5", slug: "tiny-tots", name: "Tiny Tots" },
  { id: "b6", slug: "playtime-co", name: "Playtime Co." },
];

export const ageGroups: AgeGroup[] = [
  { slug: "0-2", label: "0–2 years", emoji: "🍼", min: 0, max: 2 },
  { slug: "3-5", label: "3–5 years", emoji: "🎈", min: 3, max: 5 },
  { slug: "6-8", label: "6–8 years", emoji: "🚀", min: 6, max: 8 },
  { slug: "9-12", label: "9–12 years", emoji: "🧪", min: 9, max: 12 },
];

export const banners: Banner[] = [
  { id: "n1", title: "Big Summer Toy Sale", subtitle: "Up to 30% off on building sets, puzzles and outdoor fun.", cta: "Shop the sale", href: "/products?sort=price-asc", from: "#fb7185", to: "#f59e0b", emoji: "🎉" },
  { id: "n2", title: "Learn While You Play", subtitle: "Educational toys that make curious minds light up.", cta: "Explore educational", href: "/products?category=educational-toys", from: "#6366f1", to: "#06b6d4", emoji: "🧠" },
  { id: "n3", title: "Gifts They'll Remember", subtitle: "Hand-picked presents for every age and every birthday.", cta: "Find a gift", href: "/products?category=gifts", from: "#10b981", to: "#a3e635", emoji: "🎁" },
];

type Seed = [name: string, cat: string, brand: string, age: string, ageLabel: string, price: number, disc: number, stock: number, rating: number, reviews: number, sold: number, emoji: string, featured: boolean, isNew: boolean, variantLabels: string[], blurb: string];

const seeds: Seed[] = [
  ["Alphabet Learning Blocks", "educational-toys", "little-genius", "3-5", "3+ years", 899, 15, 40, 4.6, 128, 540, "🔤", true, false, ["26 pcs", "52 pcs"], "Colourful wooden blocks that teach letters, numbers and simple words."],
  ["Junior Science Lab Kit", "educational-toys", "little-genius", "9-12", "9+ years", 1799, 10, 18, 4.7, 86, 210, "🔬", true, true, ["Starter", "Deluxe"], "20 safe experiments with real lab tools for young scientists."],
  ["Counting Abacus Frame", "educational-toys", "little-genius", "3-5", "3+ years", 599, 0, 0, 4.3, 54, 320, "🧮", false, false, [], "Classic bead frame for learning counting and basic arithmetic."],
  ["Princess Fashion Doll", "dolls", "playtime-co", "3-5", "3+ years", 1299, 20, 25, 4.5, 210, 760, "👸", true, false, ["Pink dress", "Blue dress"], "Poseable fashion doll with a sparkly outfit and accessories."],
  ["Soft Rag Doll Mia", "dolls", "tiny-tots", "0-2", "6+ months", 749, 0, 32, 4.8, 95, 410, "🪆", false, true, [], "Super-soft, machine-washable rag doll that is perfect for cuddles."],
  ["Dream House Doll Set", "dolls", "playtime-co", "6-8", "5+ years", 3499, 25, 9, 4.4, 61, 150, "🏠", false, false, ["Small", "Large"], "Three-room doll house with furniture and two dolls."],
  ["Turbo Racer Pull-Back Car", "vehicles", "speedy-wheels", "3-5", "3+ years", 399, 0, 80, 4.2, 180, 1200, "🏎️", true, false, ["Red", "Blue", "Yellow"], "Pull back, release and watch it zoom across the room."],
  ["Remote Control Monster Truck", "vehicles", "speedy-wheels", "6-8", "6+ years", 2499, 18, 14, 4.7, 142, 380, "🚙", true, true, ["Green", "Orange"], "All-terrain RC truck with rechargeable battery and 2.4GHz control."],
  ["Fire Rescue Truck", "vehicles", "speedy-wheels", "3-5", "3+ years", 1099, 12, 22, 4.5, 77, 260, "🚒", false, false, [], "Lights, sirens and an extendable ladder for brave little heroes."],
  ["Mega Brick Castle 500pc", "building-sets", "brickworks", "6-8", "6+ years", 2999, 22, 16, 4.8, 233, 690, "🏰", true, false, ["500 pcs", "800 pcs"], "Build a towering castle with knights, a dragon and a drawbridge."],
  ["City Builder 250pc", "building-sets", "brickworks", "6-8", "6+ years", 1599, 0, 30, 4.6, 120, 520, "🏙️", false, true, [], "Compatible bricks to design your own skyline."],
  ["Jumbo Blocks for Toddlers", "building-sets", "tiny-tots", "0-2", "1+ years", 999, 10, 45, 4.4, 66, 300, "🧱", false, false, ["24 pcs", "48 pcs"], "Chunky, easy-grip blocks sized for tiny hands."],
  ["Junior Football Size 3", "outdoor-toys", "playtime-co", "6-8", "5+ years", 499, 0, 100, 4.3, 301, 1500, "⚽", true, false, [], "Durable stitched football for the park and backyard."],
  ["Splash Water Slide", "outdoor-toys", "playtime-co", "3-5", "3+ years", 3999, 30, 7, 4.6, 48, 90, "💦", false, true, [], "Inflatable garden slide with a built-in sprinkler."],
  ["Kids Scooter 3-Wheel", "outdoor-toys", "speedy-wheels", "3-5", "3+ years", 2199, 15, 20, 4.7, 134, 430, "🛴", true, false, ["Pink", "Blue"], "Stable lean-to-steer scooter with adjustable handle."],
  ["Rattle & Teether Set", "baby-toys", "tiny-tots", "0-2", "3+ months", 349, 0, 120, 4.7, 188, 980, "🔔", true, false, [], "BPA-free rattles and teethers in soothing pastel colours."],
  ["Plush Teddy Bear", "baby-toys", "tiny-tots", "0-2", "0+ months", 699, 10, 60, 4.9, 312, 1100, "🧸", true, false, ["Small", "Medium", "Large"], "Ultra-soft teddy that is a lifelong friend."],
  ["Musical Activity Cube", "baby-toys", "little-genius", "0-2", "9+ months", 1499, 15, 0, 4.5, 72, 240, "🎵", false, false, [], "Five sides of sounds, beads and gears for early development."],
  ["Animal Jigsaw 100pc", "puzzles", "little-genius", "6-8", "6+ years", 449, 0, 70, 4.5, 99, 430, "🦁", false, false, [], "Vibrant safari jigsaw with thick, easy-to-hold pieces."],
  ["World Map Floor Puzzle", "puzzles", "little-genius", "6-8", "5+ years", 1099, 10, 28, 4.6, 58, 190, "🗺️", false, true, [], "Giant 150-piece map to explore countries and continents."],
  ["Wooden Shape Puzzle", "puzzles", "tiny-tots", "0-2", "1+ years", 399, 0, 55, 4.4, 70, 350, "🔷", false, false, [], "Peg puzzle that builds shape recognition and coordination."],
  ["Mega Colouring Kit", "art-craft", "ladli-originals", "3-5", "3+ years", 799, 15, 50, 4.6, 140, 610, "🖍️", true, false, ["60 pcs", "120 pcs"], "Crayons, pencils, markers and sketch pads in one box."],
  ["Clay Creations Studio", "art-craft", "ladli-originals", "6-8", "5+ years", 899, 0, 35, 4.3, 52, 200, "🏺", false, true, [], "Non-toxic modelling clay with tools and moulds."],
  ["Bead Jewellery Maker", "art-craft", "ladli-originals", "9-12", "8+ years", 999, 20, 26, 4.5, 63, 220, "📿", false, false, [], "Hundreds of beads to craft bracelets and necklaces."],
  ["Family Ludo & Snakes Board", "board-games", "playtime-co", "6-8", "5+ years", 449, 0, 90, 4.5, 175, 880, "🎲", true, false, [], "Two classic games on one reversible board."],
  ["Strategy Chess Set", "board-games", "little-genius", "9-12", "8+ years", 1299, 10, 24, 4.7, 83, 270, "♟️", false, false, ["Wooden", "Magnetic"], "Foldable chess board with full piece set and rule card."],
  ["Memory Match Cards", "board-games", "little-genius", "3-5", "3+ years", 349, 0, 75, 4.4, 91, 460, "🃏", false, true, [], "Fun card game that sharpens memory and focus."],
  ["Birthday Surprise Gift Box", "gifts", "ladli-originals", "3-5", "3+ years", 1999, 12, 19, 4.8, 109, 330, "🎁", true, true, ["Girl", "Boy"], "Curated toys, stationery and treats wrapped and ready to gift."],
  ["Mini Gift Hamper", "gifts", "ladli-originals", "0-2", "6+ months", 1299, 0, 21, 4.6, 57, 180, "🧺", false, false, [], "Baby-safe toys and keepsakes in a reusable basket."],
  ["Explorer Adventure Set", "gifts", "ladli-originals", "6-8", "6+ years", 1699, 15, 0, 4.5, 64, 210, "🧭", false, false, [], "Binoculars, compass and field journal for little explorers."],
];

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const cat = (slug: string) => categories.find((c) => c.slug === slug)!;

export const products: Product[] = seeds.map((s, i) => {
  const [name, categorySlug, brandSlug, ageGroup, ageLabel, price, discountPercent, stock, rating, reviewCount, sold, emoji, featured, isNew, vl, blurb] = s;
  const sku = `LT-${String(1000 + i)}`;
  const base = cat(categorySlug).color;
  const variants: Variant[] = vl.map((label, vi) => ({
    id: `${sku}-V${vi + 1}`, sku: `${sku}-${vi + 1}`, label,
    price: Math.round(price * (1 + vi * 0.25)),
    stock: stock === 0 ? 0 : Math.max(0, stock - vi * 7),
  }));
  return {
    id: `p${i + 1}`, slug: slugify(name), sku, name, price, discountPercent, stock: variants.length ? variants.reduce((a, v) => a + v.stock, 0) : stock,
    description: `${blurb} Designed for children aged ${ageLabel.replace("+", " and up").replace(" years", "")} and built to last through plenty of play.`,
    categorySlug, brandSlug, ageGroup, ageLabel, rating, reviewCount, sold, emoji, colors: [base, "#ffffff"],
    material: "Child-safe, non-toxic materials", safety: `Recommended for ${ageLabel}. Contains small parts on some items; adult supervision advised. Meets applicable toy safety standards.`,
    featured, isNew, variants, published: true,
    createdAt: new Date(Date.UTC(2026, 5, 1) + i * 86400000 * (isNew ? 6 : 1)).toISOString(),
  };
});

export const finalPrice = (p: { price: number; discountPercent: number }) =>
  Math.round(p.price * (1 - p.discountPercent / 100));

export type SortKey = "newest" | "price-asc" | "price-desc" | "popularity" | "rating";
export type ProductQuery = {
  q?: string; category?: string; brand?: string; age?: string; minPrice?: number; maxPrice?: number;
  inStock?: boolean; featured?: boolean; isNew?: boolean; sort?: SortKey; page?: number; limit?: number;
};

export function queryProducts(o: ProductQuery) {
  let list = products.filter((p) => p.published);
  if (o.q) {
    const q = o.q.toLowerCase();
    list = list.filter((p) => [p.name, p.sku, p.description, p.categorySlug, p.brandSlug].some((f) => f.toLowerCase().includes(q)));
  }
  if (o.category) list = list.filter((p) => p.categorySlug === o.category);
  if (o.brand) list = list.filter((p) => p.brandSlug === o.brand);
  if (o.age) list = list.filter((p) => p.ageGroup === o.age);
  if (o.minPrice != null) list = list.filter((p) => finalPrice(p) >= o.minPrice!);
  if (o.maxPrice != null) list = list.filter((p) => finalPrice(p) <= o.maxPrice!);
  if (o.inStock) list = list.filter((p) => p.stock > 0);
  if (o.featured) list = list.filter((p) => p.featured);
  if (o.isNew) list = list.filter((p) => p.isNew);
  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    "price-asc": (a, b) => finalPrice(a) - finalPrice(b),
    "price-desc": (a, b) => finalPrice(b) - finalPrice(a),
    popularity: (a, b) => b.sold - a.sold,
    rating: (a, b) => b.rating - a.rating,
  };
  list = [...list].sort(sorters[o.sort ?? "newest"] ?? sorters.newest);
  const limit = Math.min(Math.max(o.limit ?? 12, 1), 48);
  const page = Math.max(o.page ?? 1, 1);
  const total = list.length;
  return { items: list.slice((page - 1) * limit, page * limit), total, page, limit, hasMore: page * limit < total };
}

export const getProduct = (slug: string) => products.find((p) => p.slug === slug && p.published);
export const bestSellers = (n = 8) => queryProducts({ sort: "popularity", limit: n }).items;
export const related = (p: Product, n = 4) =>
  products.filter((x) => x.categorySlug === p.categorySlug && x.id !== p.id).slice(0, n);

export const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;
