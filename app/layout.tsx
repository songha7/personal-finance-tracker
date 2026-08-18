import type { Metadata } from "next";
import { Geist, Geist_Mono, Jersey_20 } from "next/font/google";
import "./globals.css";
import AppShell from "./components/app-shell";

const jersey = Jersey_20({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jersey",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finace Tracker",
  description: "Let see how much u spend over month",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jersey.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
