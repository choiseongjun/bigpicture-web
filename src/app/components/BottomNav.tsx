"use client";
import Link from "next/link";
import messages from "../lib/messages";
import { useLanguage } from "./LanguageContext";

export default function BottomNav() {
  const { lang } = useLanguage();
  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-white border-t shadow-lg z-20">
      <div className="flex items-center justify-around h-full">
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
          <span className="text-xs">{messages.home[lang]}</span>
        </Link>
        <Link href="/ranking" className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs">{messages.ranking[lang]}</span>
        </Link>
        <Link href="/community" className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          <span className="text-xs">{messages.community[lang]}</span>
        </Link>
        <Link href="/mypage" className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs">{messages.my[lang]}</span>
        </Link>
      </div>
    </nav>
  );
} 