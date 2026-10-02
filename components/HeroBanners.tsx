"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Banner } from "@/lib/data";

export default function HeroBanners({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);
  const b = banners[i];
  return (
    <section className="container-x pt-6">
      <div
        className="relative overflow-hidden rounded-[2rem] p-8 text-white transition-all duration-500 sm:p-14"
        style={{ background: `linear-gradient(120deg, ${b.from}, ${b.to})` }}
      >
        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">{b.title}</h1>
          <p className="mt-3 text-base sm:text-lg">{b.subtitle}</p>
          <Link href={b.href} className="btn mt-6 bg-white text-ink hover:bg-sun">{b.cta} →</Link>
        </div>
        <span aria-hidden className="absolute -right-4 bottom-0 select-none text-[9rem] opacity-90 sm:right-12 sm:text-[14rem]">{b.emoji}</span>
        <div className="absolute bottom-4 left-8 z-10 flex gap-2 sm:left-14">
          {banners.map((x, idx) => (
            <button key={x.id} aria-label={`Banner ${idx + 1}`} onClick={() => setI(idx)}
              className={`h-2.5 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-2.5 bg-white/50"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
