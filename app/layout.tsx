import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Victor Mono — monospace for site title and code elements
import "@fontsource/victor-mono/400.css";
import "@fontsource/victor-mono/400-italic.css";
import "@fontsource/victor-mono/700.css";
// Space Grotesk — body text (personality at display sizes, clear for prose)
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
// FontAwesome Free — icons via npm instead of hosted kit (no pageview limits)
import "@fortawesome/fontawesome-free/css/all.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jazz Next.js",
  description: "Chris Reynolds' personal site - WordPress content powered by Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
