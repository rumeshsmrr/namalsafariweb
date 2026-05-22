import { promises as fs } from "fs";
import path from "path";
import { defaultBlogs } from "./default-blogs";
import {
  ensureDirExists,
  getBlogsFilePath,
  getWritableDataDir,
} from "@/lib/data-path";

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  category: string;
  readTime: string;
}

async function ensureDataDirectory() {
  ensureDirExists(getWritableDataDir());
}

async function seedBlogsFromRepoIfPresent(targetPath: string) {
  const repoBlogs = path.join(process.cwd(), "data", "blogs.json");
  try {
    await fs.access(repoBlogs);
    const data = await fs.readFile(repoBlogs, "utf-8");
    await fs.writeFile(targetPath, data);
  } catch {
    await fs.writeFile(targetPath, JSON.stringify(defaultBlogs, null, 2));
  }
}

async function initializeBlogsFile() {
  await ensureDataDirectory();
  const blogsPath = getBlogsFilePath();

  try {
    await fs.access(blogsPath);
  } catch {
    await seedBlogsFromRepoIfPresent(blogsPath);
  }
}

export async function getAllBlogs(): Promise<BlogPost[]> {
  await initializeBlogsFile();
  try {
    const data = await fs.readFile(getBlogsFilePath(), "utf-8");
    return JSON.parse(data) as BlogPost[];
  } catch (error) {
    console.error("Error reading blogs:", error);
    return [];
  }
}

export async function getBlogById(id: number): Promise<BlogPost | null> {
  const blogs = await getAllBlogs();
  return blogs.find((blog) => blog.id === id) || null;
}

export async function createBlog(
  blog: Omit<BlogPost, "id">,
): Promise<BlogPost> {
  await initializeBlogsFile();
  const blogs = await getAllBlogs();
  const newId =
    blogs.length > 0 ? Math.max(...blogs.map((b) => b.id)) + 1 : 1;
  const newBlog: BlogPost = { ...blog, id: newId };
  blogs.push(newBlog);
  await fs.writeFile(getBlogsFilePath(), JSON.stringify(blogs, null, 2));
  return newBlog;
}

export async function updateBlog(
  id: number,
  updates: Partial<Omit<BlogPost, "id">>,
): Promise<BlogPost | null> {
  await initializeBlogsFile();
  const blogs = await getAllBlogs();
  const index = blogs.findIndex((blog) => blog.id === id);
  if (index === -1) return null;

  blogs[index] = { ...blogs[index], ...updates };
  await fs.writeFile(getBlogsFilePath(), JSON.stringify(blogs, null, 2));
  return blogs[index];
}

export async function deleteBlog(id: number): Promise<boolean> {
  await initializeBlogsFile();
  const blogs = await getAllBlogs();
  const filtered = blogs.filter((blog) => blog.id !== id);
  if (filtered.length === blogs.length) return false;

  await fs.writeFile(getBlogsFilePath(), JSON.stringify(filtered, null, 2));
  return true;
}
