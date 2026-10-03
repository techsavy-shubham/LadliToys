"use client";
import EntityManager from "@/components/admin/EntityManager";
import { Badge } from "@/components/admin/kit";

export default function Page() {
  return (
    <EntityManager title="Categories" singular="category" endpoint="/api/admin/categories" blank={{ name: "", emoji: "🧸", color: "#fde68a", active: true }}
      columns={[
        { label: "Category", render: (c) => <span className="font-bold">{c.emoji} {c.name}</span> },
        { label: "Slug", render: (c) => c.slug },
        { label: "Status", render: (c) => <Badge tone={c.active ? "green" : "gray"}>{c.active ? "Active" : "Inactive"}</Badge> },
      ]}
      fields={[{ key: "name", label: "Name", required: true }, { key: "emoji", label: "Emoji icon" }, { key: "color", label: "Tile colour (hex)", hint: "e.g. #fde68a" }, { key: "active", label: "Active", type: "checkbox" }]} />
  );
}
