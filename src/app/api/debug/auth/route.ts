import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
    GITHUB_ID: process.env.GITHUB_ID
      ? `${process.env.GITHUB_ID.slice(0, 8)}...`
      : "NOT SET",
    GITHUB_SECRET: process.env.GITHUB_SECRET ? "SET" : "NOT SET",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
    VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET",
  });
}
