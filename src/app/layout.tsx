import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/providers/ConvexClientProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { KeyboardProvider } from '@/lib/keyboard'
import { PromptModalProvider } from '@/hooks/use-prompt-modal'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Forgepad.ai',
  description: 'Enhanced stack-based LLM interaction paradigm for constructing, routing, and visualizing iterative workflows',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ConvexClientProvider>
              <KeyboardProvider>
                <PromptModalProvider>
                  {children}
                  <Toaster />
                </PromptModalProvider>
              </KeyboardProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
