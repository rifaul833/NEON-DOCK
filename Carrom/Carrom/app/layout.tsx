import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3002";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "Carrom Pop! — Cartoon Carrom Game",
    description: "A playful 3D-style carrom game. Pull back, aim, and pocket the queen before Milo does.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "Carrom Pop!",
      description: "Pull back. Aim. Pocket. Challenge Milo in a playful carrom showdown.",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Carrom Pop cartoon carrom board" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Carrom Pop!",
      description: "Pull back. Aim. Pocket. Challenge Milo in a playful carrom showdown.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
