import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TokenSense — Stop burning tokens. Start shipping faster.',
  description: 'Visualize your Claude context window, calculate real costs, and know exactly when to compact.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#f8fafc' }}>{children}</body>
    </html>
  )
}
