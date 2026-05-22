import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import {
  ensureDirExists,
  getUploadsDir,
  publicUploadUrl,
} from "@/lib/data-path";
import { apiErrorFromUnknown } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 },
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${originalName}`;

    const uploadsDir = getUploadsDir();
    ensureDirExists(uploadsDir);
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    const publicUrl = publicUploadUrl(filename);
    return NextResponse.json({ url: publicUrl, filename });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(apiErrorFromUnknown(error), { status: 500 });
  }
}
