import type { Metadata } from "next";
import { Caveat, Dancing_Script, Geist } from "next/font/google";
import { BrandLogo } from "@/components/BrandLogo";
import { Header } from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/** Loaded for typed-signature preview only (not site UI). */
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Signed & Sent | SEAMUN I 2027 Parental Consent",
  description:
    "Digitally sign your SEAMUN I 2027 parental consent form quickly and securely.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${caveat.variable} ${dancingScript.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans text-brand-navy antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 bg-brand-navy">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-8 sm:px-6">
            <BrandLogo size="footer" variant="on-dark" />
            <p className="mt-4 text-center text-sm text-white/90">
              SEAMUN I 2027 · Secure parental consent signing
            </p>
            <p className="mt-2 text-center text-xs text-white/50">
              <a
                href="mailto:information@seamun.com"
                className="text-brand-royal-bright/90 underline-offset-2 hover:underline"
              >
                information@seamun.com
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
