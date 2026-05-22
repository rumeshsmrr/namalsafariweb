import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getUploadsDir } from "@/lib/data-path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ filename: string }> },
) {
  const { filename: raw } = await ctx.params;
  const filename = path.basename(raw);
  if (!filename || filename !== raw) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filepath = path.join(getUploadsDir(), filename);
  const ext = path.extname(filename).toLowerCase();

  try {
    const buffer = await readFile(filepath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
