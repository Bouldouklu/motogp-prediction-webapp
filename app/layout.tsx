import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const racing = Barlow_Condensed({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-racing"
});

const motogp = localFont({
  src: [
    {
      path: '../public/fonts/MotoGP-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/MotoGP-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-motogp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "MotoGP Predictions",
  description: "MotoGP prediction platform for friends",
};

import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${racing.variable} ${motogp.variable}`}>
      <body className="bg-carbon-black text-white min-h-screen antialiased selection:bg-motogp-red selection:text-white flex flex-col">
        <div className="fixed inset-0 z-[-1] opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black"></div>
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-motogp-red via-white to-motogp-red z-50"></div>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
