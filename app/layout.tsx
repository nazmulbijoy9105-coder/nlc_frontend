import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NLC Platform — Neum Lex Counsel',
  description: 'RJSC Compliance Intelligence Platform — Bangladesh Companies Act 1994',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
