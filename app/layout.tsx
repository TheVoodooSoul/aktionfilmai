import type { Metadata } from "next";
import { Geist, Geist_Mono, Courier_Prime } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Industry-standard screenplay font
const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Aktion Film AI - Choreograph the Impossible",
  description: "Create cinematic action sequences with AI. Sketch, generate, and animate your action hero vision.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "Aktion Film AI - Choreograph the Impossible",
    description: "Create cinematic action sequences with AI. Sketch, generate, and animate your action hero vision.",
    images: ['/logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Aktion Film AI - Choreograph the Impossible",
    description: "Create cinematic action sequences with AI. Sketch, generate, and animate your action hero vision.",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${courierPrime.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
        {/* Termly Consent Management - loaded after hydration */}
        <Script
          src="https://app.termly.io/embed.min.js"
          data-auto-block="on"
          data-website-uuid="73ab4ad9-3d47-4629-879c-1ed934ff097b"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
