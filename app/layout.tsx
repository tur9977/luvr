"use client"

import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { useProfile } from "@/hooks/useProfile"
import { BannedUserOverlay } from "@/components/BannedUserOverlay"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = useProfile()
  const isBanned = profile?.role === "banned_user"

  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {isBanned ? (
            <BannedUserOverlay />
          ) : (
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
            </div>
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
