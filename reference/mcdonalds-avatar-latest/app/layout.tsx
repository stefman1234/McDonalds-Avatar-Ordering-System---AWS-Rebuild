import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "McDonald's Avatar Ordering System",
  description: 'AI-powered ordering kiosk with conversational avatar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Klleon SDK for Avatar, STT, and TTS */}
        <Script
          src="https://web.sdk.klleon.io/1.2.0/klleon-chat.umd.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
