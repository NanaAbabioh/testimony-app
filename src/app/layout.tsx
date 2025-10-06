import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import ConditionalNavigation from "@/components/ConditionalNavigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const merri = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Alpha Hour Testimony Library",
  description: "Discover inspiring testimonies of God's goodness from Alpha Hour services, automatically extracted and categorized using AI technology.",
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
        <AuthProvider>
          <ConditionalNavigation>
            {children}
          </ConditionalNavigation>
        </AuthProvider>
      </body>
    </html>
  );
}
