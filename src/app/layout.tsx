import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Social Post Generator',
  description: 'Generate engaging social media posts from URLs or topics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
