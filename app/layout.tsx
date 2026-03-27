import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { fetchSiteInfo } from "@/lib/wordpress/site-info";

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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jazzsequence.com';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { name, description } = await fetchSiteInfo();
    return {
      metadataBase: new URL(BASE_URL),
      title: {
        default: name,
        template: `%s | ${name}`,
      },
      description,
      openGraph: {
        type: 'website',
        siteName: name,
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
      },
    };
  } catch {
    // Fallback if WordPress is unreachable at build time
    return {
      metadataBase: new URL(BASE_URL),
      title: {
        default: "jazzsequence",
        template: "%s | jazzsequence",
      },
      description: "Chris Reynolds' personal site.",
      openGraph: {
        type: 'website',
        siteName: 'jazzsequence',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
      },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteName = 'jazzsequence';
  try {
    const siteInfo = await fetchSiteInfo();
    siteName = siteInfo.name;
  } catch {
    // Fallback to default site name if WordPress is unreachable
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        url: BASE_URL,
        name: siteName,
      },
      {
        '@type': 'Person',
        name: 'Chris Reynolds',
        url: BASE_URL,
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        {/* FontAwesome 6 Free — served from jsDelivr, no auth or pageview limits */}
        {/* Preconnect to CDN so font/stylesheet connections are established early */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* Preload the two most-used woff2 files to avoid render-blocking */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/webfonts/fa-solid-900.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/webfonts/fa-brands-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
