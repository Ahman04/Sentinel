// app/layout.tsx — Root layout applied to every page in the app.
// Sets the page title and global styles.

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
      <body className="antialiased bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
