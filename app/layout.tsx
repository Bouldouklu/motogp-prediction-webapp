import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const racing = Barlow_Condensed({ 
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-racing"
});

export const metadata: Metadata = {
  title: "MotoGP Betting",
  description: "MotoGP prediction and betting platform for friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${racing.variable}`}>
      <body className="bg-carbon-black text-white min-h-screen antialiased selection:bg-motogp-red selection:text-white">
        <div className="fixed inset-0 z-[-1] opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black"></div>
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-motogp-red via-white to-motogp-red z-50"></div>
        {children}
      </body>
    </html>
  );
}
