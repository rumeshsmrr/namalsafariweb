import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Import the GoogleAnalytics component
import { GoogleAnalytics } from "@next/third-parties/google";

import ConditionalFooter from "./Components/ConditionalFooter";
import ScrollToTop from "./Components/ScrollToTop";
import WhatsAppChatButton from "./Components/WhatsAppChatButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nimalsafari.com"),
  title: {
    default: "Nimal Safari | Best Safari Agency in Sri Lanka",
    template: "%s | Nimal Safari",
  },
  description:
    "Book the best safari in Sri Lanka with Nimal Safari. Expert-guided Yala safari, Udawalawa safari & more. Trusted Sri Lanka safari agency based in Tissamaharama.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    siteName: "Nimal Safari",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nimalsafari",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <ScrollToTop />
        <WhatsAppChatButton />
        {children}
        <ConditionalFooter />

        <GoogleAnalytics gaId="G-VLXEQQL4J7" />
      </body>
    </html>
  );
}
