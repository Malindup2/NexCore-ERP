"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./typography-utils.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

import { HeaderDateTime } from "@/components/header-date-time";
import { UserMenu } from "@/components/user-menu";
import { ProtectedRoute } from "@/components/protected-route";
import { Toaster } from "sonner";
import { LoadingScreen } from "@/components/loading-screen";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/logo.png" />
        <title>NexCore ERP - Enterprise Resource Planning</title>
        <meta name="description" content="Streamline your business operations with NexCore ERP" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoadingScreen />
        <Toaster position="top-right" richColors />
        <ProtectedRoute>
          {isAuthPage ? (
            // Auth pages - no ERP UI
            <>{children}</>
          ) : (
            // ERP Dashboard - full UI
            <SidebarProvider>
              <AppSidebar />
              <main className="w-full flex flex-col">
              <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
                <SidebarTrigger />
                <div className="flex-1" />
                <HeaderDateTime />
                <UserMenu />
                <ThemeToggle />
              </header>
                <div className="flex-1">
                  {children}
                </div>
              </main>
            </SidebarProvider>
          )}
        </ProtectedRoute>
      </body>
    </html>
  );
}
