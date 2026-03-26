import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inside Pitch",
  description: "A mobile-first IPL prediction game for office bragging rights."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
