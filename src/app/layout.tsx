import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import "./globals.css";

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Mock Interview Platform",
  description: "Practise your interview skills with AI-powered interviews. Get real-time feedback and improve your performance across 8 different industries.",
  keywords: ["interview", "AI", "practise", "mock interview", "career", "job search"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${garamond.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
