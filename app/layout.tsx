import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Just simulate Next.js fonts with standard Google Fonts imports if not using next/font here to keep it simple,
// but Next 13+ supports next/font/google. Let's write a standard approach.
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-geist-sans'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono' 
});

export const metadata: Metadata = {
  title: "Co-op Focus | OLED Productivity",
  description: "Zero-cost competitive productivity web application tailored for two remote academic power users.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-black text-zinc-100 min-h-screen selection:bg-emerald-500/30`}>
        {children}
      </body>
    </html>
  );
}
