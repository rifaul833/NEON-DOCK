import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["500", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "Snake & Ladder — Race to the Top!",
  description: "A colorful 3D pass-and-play Snake & Ladder game for two players.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={nunito.variable}>{children}</body></html>;
}
