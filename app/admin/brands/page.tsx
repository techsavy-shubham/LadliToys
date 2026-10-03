"use client";
import EntityManager from "@/components/admin/EntityManager";

export default function Page() {
  return (
    <EntityManager title="Brands" singular="brand" endpoint="/api/admin/brands" activeKey={null} blank={{ name: "" }}
      columns={[{ label: "Brand", render: (b) => <span className="font-bold">{b.name}</span> }, { label: "Slug", render: (b) => b.slug }]}
      fields={[{ key: "name", label: "Name", required: true }]} />
  );
}
