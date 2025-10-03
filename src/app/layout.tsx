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
