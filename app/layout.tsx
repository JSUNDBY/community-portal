import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { COMMUNITY } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${COMMUNITY.name} Portal`,
  description: `Resident portal for ${COMMUNITY.name}. Sign in for announcements, calendar, documents, and contact info.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Brand vars get inlined on :root so every component can read
  // var(--primary) / var(--accent) without a Tailwind config rebuild.
  const brandStyle = {
    "--primary": COMMUNITY.primaryColor,
    "--accent": COMMUNITY.accentColor,
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={brandStyle}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
