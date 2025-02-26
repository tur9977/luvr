import type { Metadata } from "next"
import "@/styles/globals.css"
import { Inter } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "sonner"
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Luvr - LGBTQ+ 社交平台",
  description: "一個專為 LGBTQ+ 社群打造的社交平台",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
