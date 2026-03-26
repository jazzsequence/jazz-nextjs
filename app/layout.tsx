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
// FontAwesome Free via jsDelivr CDN — no pageview limits, no npm auth required.
// (The @fortawesome npm packages use npm.fontawesome.com which requires auth even for free tier.)

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
      <head>
        {/* FontAwesome 6 Free — served from jsDelivr, no auth or pageview limits */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
