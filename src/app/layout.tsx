import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import ConditionalNavigation from "@/components/ConditionalNavigation";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const merri = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Alpha Hour Testimony Library",
  description: "Discover faith-filled testimonies of God's Goodness & Mercies",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/ah-logo.svg",
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicon-32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/favicon-16.png",
      },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alpha Hour Testimony Library",
  },
  formatDetection: {
    telephone: false,
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
        className={`${inter.variable} ${merri.variable} font-sans bg-[hsl(var(--bg))] text-[hsl(var(--ink))] antialiased`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          <ConditionalNavigation>
            {children}
          </ConditionalNavigation>
        </AuthProvider>
      </body>
    </html>
  );
}
