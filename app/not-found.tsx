import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <div className="text-7xl">🧸</div>
      <h1 className="mt-4 text-3xl font-extrabold">Oops! We couldn&apos;t find that page.</h1>
      <Link href="/products" className="btn btn-primary mt-6">Browse toys</Link>
    </div>
  );
}
