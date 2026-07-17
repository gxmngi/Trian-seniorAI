import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EditorLayout } from "@/components/editor/editor-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ghost AI - Editor",
  description: "Collaborative design canvas and spec workspace",
};

/**
 * Provides the root application layout with fonts, styling, and the editor shell.
 *
 * @param children - The page content rendered within the editor layout
 * @returns The root HTML structure containing the application content
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <EditorLayout>{children}</EditorLayout>
      </body>
    </html>
  );
}
