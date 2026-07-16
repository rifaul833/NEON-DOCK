import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dart Dash! — Cartoon Darts",
  description: "Aim, throw, and chase a huge score in this playful 3D dart game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
