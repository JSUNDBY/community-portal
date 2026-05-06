import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { COMMUNITY } from "@/lib/config";
import { DemoBanner } from "@/app/_components/DemoBanner";
import { TopBar } from "@/app/_components/TopBar";
import { SiteFooter } from "@/app/_components/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display serif. Used sparingly on marketing surfaces (/about,
// hero headlines). Variable font keeps the bundle small.
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      style={brandStyle}
    >
      <body className="min-h-full flex flex-col">
        <DemoBanner />
        <TopBar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
