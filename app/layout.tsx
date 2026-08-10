import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "IPO Sniper AI",
  description: "AI-Powered IPO Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // This app has no light/dark toggle — it's dark-themed
      // everywhere by design. Without the literal "dark" class here,
      // globals.css's @custom-variant dark rule (&:is(.dark *)) never
      // matches anything, so every dark: Tailwind variant across the
      // whole app — not just this Button component — was silently
      // inactive. That's what caused the OAuth buttons on /login to
      // render white-background/white-text (bg-background fell back
      // to its light-mode value, and Button's outline variant never
      // sets a base text color, only a dark:/hover: one).
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#09090B] text-white">
        {children}
      </body>
    </html>
  );
}