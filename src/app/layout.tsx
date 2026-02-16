import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { Web3Providers } from "@/components/Web3Providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BERT — DAO Grants Engine",
  description:
    "BERT turns community proposals into funded outcomes with transparent voting and grants.",
  icons: {
    icon: "/bert-logo.png",
    apple: "/bert-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${sora.variable} antialiased`}>
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
