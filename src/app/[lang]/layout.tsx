import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { site } from "@/core/domain/site";
import { analytics } from "@/composition/client";
import { Companion } from "@/components/companion/companion";
import { isLocale, locales, defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { TranslationProvider } from "@/i18n/translation-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);

  return {
    metadataBase: new URL(site.url),
    title: {
      default: dict.meta.siteTitle,
      template: `%s · ${dict.meta.siteTitle}`,
    },
    description: dict.meta.siteDescription,
    openGraph: {
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning className={inter.variable}>
      <body
        className="min-h-screen bg-background text-foreground font-sans antialiased"
        data-subject="brand"
      >
        <analytics.Beacon />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TranslationProvider dictionary={dict} lang={lang}>
            <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6">
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
              >
                {dict.common.skipToContent}
              </a>
              <Nav />
              <main id="main" className="flex-1 py-8 animate-in" style={{ paddingBottom: "var(--companion-dock-h, 0px)" }}>
                {children}
              </main>
              <Footer year={new Date().getFullYear()} t={dict.footer} lang={lang} />
            </div>
            <Companion />
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
