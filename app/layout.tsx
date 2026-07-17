import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "var(--accent-primary)",
              colorBackground: "var(--bg-surface)",
              colorText: "var(--text-primary)",
              colorTextSecondary: "var(--text-secondary)",
              colorBorder: "var(--border-default)",
              colorSuccess: "var(--state-success)",
              colorDanger: "var(--state-error)",
              colorWarning: "var(--state-warning)",
            },
            elements: {
              card: "border border-border-default rounded-2xl bg-bg-surface shadow-none",
              headerTitle: "font-semibold tracking-tight text-text-primary",
              headerSubtitle: "text-text-muted",
              socialButtonsBlockButton: "border border-border-default hover:bg-bg-subtle text-text-primary rounded-xl transition-colors",
              formButtonPrimary: "bg-accent-primary hover:bg-accent-primary/95 text-bg-base font-semibold rounded-xl transition-colors",
              formFieldInput: "bg-bg-subtle border border-border-subtle rounded-xl text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all",
              footerActionLink: "text-accent-primary hover:text-accent-primary/90 hover:underline",
              userButtonPopoverCard: "border border-border-default rounded-xl bg-bg-surface",
            }
          } as any}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}