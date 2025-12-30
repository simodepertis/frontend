import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ToastProvider } from "@/components/ui/toast";
import AgeVerificationModal from "@/components/AgeVerificationModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://incontriescort.org"),
  title: {
    default: "Incontriescort.org",
    template: "%s | Incontriescort.org",
  },
  description:
    "Annunci, profili e incontri. Scopri escort, trans e incontri veloci per città.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Incontriescort.org",
    url: "/",
    title: "Incontriescort.org",
    description:
      "Annunci, profili e incontri. Scopri escort, trans e incontri veloci per città.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Incontriescort.org",
    description:
      "Annunci, profili e incontri. Scopri escort, trans e incontri veloci per città.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ToastProvider>
          <AgeVerificationModal />
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
