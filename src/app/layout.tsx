import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "./components/Header";
import Providers from "./providers";
import BottomNav from "./components/BottomNav";

const geistSans = Geist({  
  variable: "--font-geist-sans",  
  subsets: ["latin"],
});

const geistMono = Geist_Mono({  
  variable: "--font-geist-mono",  
  subsets: ["latin"],
});

export const metadata: Metadata = {  
  title: "TravelMark - 지도 위에 추억을 남기고 공유하는 서비스",  
  description: "지도 기반 위치 기반 추억 공유 플랫폼. 특별한 순간을 지도 위에 마커로 남기고, 감정과 함께 추억을 공유하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Header />
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}