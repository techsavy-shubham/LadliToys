"use client";
import { useState } from "react";
import ProductImage from "./ProductImage";

export default function Gallery({ emoji, colors, images = [] }: { emoji: string; colors: [string, string]; images?: string[] }) {
  const [view, setView] = useState(0);
  return (
    <div>
      <ProductImage emoji={emoji} colors={colors} view={view} src={images[view]} className="rounded-[2rem] ring-1 ring-ink/5" />
      <div className="mt-3 grid grid-cols-4 gap-3">
        {(images.length ? images.map((_, i) => i) : [0, 1, 2, 3]).map((i) => (
          <button key={i} onClick={() => setView(i)} aria-label={`View ${i + 1}`}
            className={`overflow-hidden rounded-2xl ring-2 transition ${view === i ? "ring-brand" : "ring-transparent"}`}>
            <ProductImage emoji={emoji} colors={colors} view={i} src={images[i]} className="[&>span]:!text-3xl" />
          </button>
        ))}
      </div>
    </div>
  );
}
