"use client";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "./LanguageContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const [langModalOpen, setLangModalOpen] = useState(false);
  const { lang } = useLanguage();
  const router = useRouter();
  const handleLangSelect = (l: 'ko' | 'en') => {
    setLangModalOpen(false);
    if (l === 'en') router.push('/en');
    else router.push('/ko');
  };
  return (
    <header className="fixed top-0 left-0 w-full h-14 border-b bg-white shadow-sm z-20 flex items-center justify-center">
      <div className="absolute left-4 flex items-center gap-2">
        <button
          className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-semibold px-2 py-1 rounded transition"
          onClick={() => setLangModalOpen(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" fill="#fff"/>
            <path d="M2 12h20" stroke="#2563EB" strokeWidth="1.5"/>
            <ellipse cx="12" cy="12" rx="5" ry="10" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
            <ellipse cx="12" cy="12" rx="10" ry="5" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
          </svg>
          <span className="text-sm">{lang === 'ko' ? '한국어' : 'English'}</span>
        </button>
        {langModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30" onClick={() => setLangModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-lg p-6 min-w-[220px] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              <button
                className={`py-2 rounded text-lg font-semibold ${lang === 'ko' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={() => handleLangSelect('ko')}
              >
                한국어
              </button>
              <button
                className={`py-2 rounded text-lg font-semibold ${lang === 'en' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={() => handleLangSelect('en')}
              >
                English
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900">BigPicture</div>
      {/* <div className="absolute right-4 flex items-center gap-4">
        <Link href="/ranking" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          <span className="hidden sm:inline">랭킹</span>
        </Link>
        <Link href="/community" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h2m4-4v4m0 0l-2-2m2 2l2-2"/></svg>
          <span className="hidden sm:inline">커뮤니티</span>
        </Link>
        <Link href="/mypage" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span className="hidden sm:inline">마이</span>
        </Link>
      </div> */}
    </header>
  );
} 