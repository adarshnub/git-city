import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import { AdminProvider } from "@/components/ui/AdminControls";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Git City - Visualize Your GitHub Journey",
  description:
    "See your GitHub commit history as stunning 3D skyscraper towers. The more you commit, the taller and more beautiful your tower grows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <SessionProvider>
          <AdminProvider>
            <Navbar />
            <main className="flex-1 pt-16">{children}</main>
          </AdminProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
