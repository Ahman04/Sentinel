// app/layout.tsx — Root layout. Loads Google Fonts and sets global styles.

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HopeAccess",
  description: "NGO and charity staff access management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#F5F3EE] min-h-screen">{children}</body>
    </html>
  );
}
