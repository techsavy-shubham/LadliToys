import { NextResponse } from "next/server";
import { bad, requireAdmin, unauthorized } from "@/lib/auth";
import { db, newId } from "@/lib/db";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Product image upload. Images are stored in the database and served from /api/images/[id]
// (swap for S3 / Cloudinary / Vercel Blob when object storage is provisioned).
export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return bad("No file uploaded.");
  if (!TYPES.includes(file.type)) return bad("Only JPG, PNG, WebP or GIF images are allowed.");
  if (file.size > 1_000_000) return bad("Image must be under 1 MB.");
  const id = newId("img");
  await db.put("images", id, { id, type: file.type, data: Buffer.from(await file.arrayBuffer()).toString("base64") });
  return NextResponse.json({ url: `/api/images/${id}` }, { status: 201 });
}
