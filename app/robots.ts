import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ladli-toys.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/cart", "/checkout", "/account", "/orders", "/wishlist", "/pay/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
