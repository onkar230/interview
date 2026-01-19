import type { Metadata } from "next";
import { Inter, Crimson_Pro } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mojointerview.com'),
  title: {
    default: "Mojo Interview - AI Mock Interview Platform",
    template: "%s | Mojo Interview"
  },
  description: "Practise your interview skills with AI-powered mock interviews. Get real-time feedback and detailed evaluations to improve your performance. Start with 1 free interview per month.",
  keywords: ["interview", "AI", "practise", "mock interview", "career", "job search", "interview preparation", "interview practice", "AI interviewer", "job interview help"],
  authors: [{ name: "Mojo Interview" }],
  creator: "Mojo Interview",
  publisher: "Mojo Interview",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://mojointerview.com',
    title: 'Mojo Interview - AI Mock Interview Platform',
    description: 'Practise your interview skills with AI-powered mock interviews. Get real-time feedback and improve your performance.',
    siteName: 'Mojo Interview',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mojo Interview - AI Mock Interview Platform',
    description: 'Practise your interview skills with AI-powered mock interviews. Get real-time feedback and improve your performance.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification code here when you have it
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${crimsonPro.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
