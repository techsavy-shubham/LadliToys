"use client";
import { useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/data";

// Renders the server-fetched first page, then pulls further pages from the REST API.
export default function LoadMoreGrid({ initial, hasMore, query }: { initial: Product[]; hasMore: boolean; query: string }) {
  const [items, setItems] = useState(initial);
  const [more, setMore] = useState(hasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?${query}&page=${page + 1}`);
      const data = await res.json();
      setItems((x) => [...x, ...data.items]);
      setMore(data.hasMore);
      setPage(page + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {more && (
        <div className="mt-8 text-center">
          <button onClick={loadMore} disabled={loading} className="btn btn-primary px-8">
            {loading ? "Loading…" : "Load more toys"}
          </button>
        </div>
      )}
    </>
  );
}
