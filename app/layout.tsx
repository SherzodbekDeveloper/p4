import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { LayoutWrapper } from "@/components/layout-wrapper"
import NextTopLoader from 'nextjs-toploader'
import { AuthProvider } from '@/context/auth-context'

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Biznes Boshqaruv Platformasi",
    template: "%s | Biznes Boshqaruv",
  },
  description:
    "Ombor, mahsulot va buyurtmalarni boshqarish uchun zamonaviy Next.js va Firebase asosidagi platforma.",
  keywords: [
    "Biznes boshqaruv",
    "Ombor hisoboti",
    "Buyurtma tizimi",
    "Mahsulot boshqaruvi",
    "Next.js Firebase App",
  ],
  authors: [{ name: "Sizning kompaniyangiz", url: "https://sizning-saytingiz.com" }],
  creator: "Sizning kompaniyangiz",
  publisher: "Sizning kompaniyangiz",
  metadataBase: new URL("https://sizning-saytingiz.com"),

  openGraph: {
    type: "website",
    locale: "uz_UZ",
    siteName: "Biznes Boshqaruv Platformasi",
    title: "Biznes Boshqaruv Platformasi",
    description:
      "Ombor, mahsulot va buyurtmalarni samarali boshqarish uchun birinchi raqamli platforma.",
   
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <LayoutWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
          <NextTopLoader />
        </LayoutWrapper>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
