"use client";
import EntityManager from "@/components/admin/EntityManager";
import { Badge } from "@/components/admin/kit";

export default function Page() {
  return (
    <EntityManager title="Banners" singular="banner" endpoint="/api/admin/banners"
      blank={{ title: "", subtitle: "", cta: "Shop now", href: "/products", from: "#fb7185", to: "#f59e0b", emoji: "🎉", active: true }}
      columns={[
        { label: "Banner", render: (b) => <span className="inline-flex items-center gap-2 font-bold"><span className="inline-block h-6 w-10 rounded-lg" style={{ background: `linear-gradient(120deg, ${b.from}, ${b.to})` }} />{b.emoji} {b.title}</span> },
        { label: "Link", render: (b) => b.href },
        { label: "Status", render: (b) => <Badge tone={b.active !== false ? "green" : "gray"}>{b.active !== false ? "Live" : "Hidden"}</Badge> },
      ]}
      fields={[
        { key: "title", label: "Title", required: true }, { key: "emoji", label: "Emoji" },
        { key: "subtitle", label: "Subtitle", type: "textarea" }, { key: "cta", label: "Button text" }, { key: "href", label: "Button link", hint: "/products?category=dolls or https://…" },
        { key: "from", label: "Gradient start (hex)" }, { key: "to", label: "Gradient end (hex)" }, { key: "active", label: "Show on homepage", type: "checkbox" },
      ]} />
  );
}
