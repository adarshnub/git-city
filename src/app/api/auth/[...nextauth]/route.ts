import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("[AUTH ROUTE] Environment check:", {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
  GITHUB_ID: process.env.GITHUB_ID ? `${process.env.GITHUB_ID.slice(0, 6)}...` : "NOT SET",
  GITHUB_SECRET: process.env.GITHUB_SECRET ? "SET (hidden)" : "NOT SET",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET (hidden)" : "NOT SET",
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
});

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
