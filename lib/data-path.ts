import fs from "fs";
import path from "path";

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const VERCEL_DATA_DIR = path.join("/tmp", "nimalsafari-data");

/**
 * Writable directory for SQLite, blogs.json, and uploaded images.
 * On Vercel the repo `data/` folder is read-only — use /tmp instead.
 */
export function getWritableDataDir(): string {
  if (process.env.DATA_PATH?.trim()) {
    return process.env.DATA_PATH.trim();
  }
  if (process.env.VERCEL) {
    return VERCEL_DATA_DIR;
  }
  return LOCAL_DATA_DIR;
}

export function getBlogsFilePath(): string {
  return path.join(getWritableDataDir(), "blogs.json");
}

/** Local dev / VPS: public/Images. Vercel: writable uploads under DATA dir. */
export function getUploadsDir(): string {
  if (process.env.VERCEL || process.env.DATA_PATH?.trim()) {
    return path.join(getWritableDataDir(), "uploads");
  }
  return path.join(process.cwd(), "public", "Images");
}

/** URL path customers and admin use to load an uploaded image. */
export function publicUploadUrl(filename: string): string {
  const safe = path.basename(filename);
  if (process.env.VERCEL || process.env.DATA_PATH?.trim()) {
    return `/api/uploads/${encodeURIComponent(safe)}`;
  }
  return `/Images/${safe}`;
}

export function ensureDirExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * True on Vercel without DATA_PATH — payments, blogs, and uploads are not
 * shared across serverless instances and may reset on cold start.
 */
export function usesEphemeralStorage(): boolean {
  return Boolean(process.env.VERCEL) && !process.env.DATA_PATH?.trim();
}
