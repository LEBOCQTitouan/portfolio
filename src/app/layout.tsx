import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { site } from "@/lib/site";
import { Analytics } from "@/components/analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Titouan Lebocq",
    template: "%s · Titouan Lebocq",
  },
  description: "Software engineer — engineering with the craft of design.",
  openGraph: {
    title: "Titouan Lebocq",
    description: "Software engineer — engineering with the craft of design.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Analytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6">
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
            >
              Skip to content
            </a>
            <Nav />
            <main id="main" className="flex-1 py-8 animate-in">
              {children}
            </main>
            <Footer year={new Date().getFullYear()} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
