import './globals.css'

export const metadata = {
  title: 'Trailer Inspection Report Generator',
  description: 'Generate professional PDF inspection reports for trailers',
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
