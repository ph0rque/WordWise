import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "./ClientLayout"

export const metadata: Metadata = {
  title: "WordWise - AI-Powered Writing Assistant for High School Students",
  description: "Help high school students improve their academic writing with real-time grammar checking, vocabulary enhancement, and AI tutoring. Give educators powerful tools to monitor progress and ensure academic integrity.",
  keywords: "essay writing, grammar checker, academic writing, high school, AI tutor, writing assistant, vocabulary enhancement, education technology",
  authors: [{ name: "WordWise" }],
  openGraph: {
    title: "WordWise - AI-Powered Writing Assistant for High School Students",
    description: "Transform academic writing with real-time grammar checking, vocabulary enhancement, and AI tutoring designed specifically for high school students and educators.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
