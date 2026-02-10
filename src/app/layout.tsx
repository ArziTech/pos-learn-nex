import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProvider } from "next-auth/react";
import { PermissionProvider } from "@/providers/permission-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POS System",
  description: "Point of Sale system with payment integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Midtrans Snap.js */}
        <script
          type="text/javascript"
          src={`https://app.${process.env.MIDTRANS_IS_PRODUCTION === "true" ? "midtrans" : "sandbox"}.midtrans.com/snap/snap.js`}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-xxxx"}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <QueryProvider>
          <SessionProvider>
            <PermissionProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </PermissionProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
