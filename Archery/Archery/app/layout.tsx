import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const GAMEBOX_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arrowfall — 3D Archery",
  description: "A cinematic multiplayer archery challenge built for the browser.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script src={`${GAMEBOX_BASE}/gamebox/vendor/pako.min.js`} strategy="beforeInteractive" />
        <Script src={`${GAMEBOX_BASE}/gamebox/crypto.js`} strategy="beforeInteractive" />
        <Script src={`${GAMEBOX_BASE}/gamebox/gamebox-sdk.js`} strategy="beforeInteractive" />
        <Script src={`${GAMEBOX_BASE}/gamebox/integration-core.js`} strategy="beforeInteractive" />
        <Script src={`${GAMEBOX_BASE}/gamebox/integration.js`} strategy="beforeInteractive" />
        <Script src={`${GAMEBOX_BASE}/gamebox/bootstrap.js`} strategy="beforeInteractive" />
      </body>
    </html>
  );
}
