import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ?? null,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
