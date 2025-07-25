"use client";
import GoogleMapClient from "./GoogleMapClient";
import Link from "next/link";
import { useState } from "react";
import messages from "./lib/messages";
import { useLanguage } from "./components/LanguageContext";

export default function Home() {
  const { lang } = useLanguage();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'ko' | 'en'>('ko');
  const handleLangSelect = (lang: 'ko' | 'en') => {
    setSelectedLang(lang);
    setLangModalOpen(false);
  };
  const handlePlusClick = () => {
    // 마커 추가 모드 활성화 (GoogleMapClient에서 처리)
    console.log('마커 추가 모드 활성화');
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] mobile-full-height" style={{ height: '100dvh' }}>
      {/* 헤더 */}
      <header className="fixed top-0 left-0 w-full h-14 border-b bg-white shadow-sm z-20 flex items-center justify-center">
        <div className="absolute left-4 flex items-center gap-2">
          <button
            className="flex items-center gap-1 text-gray-700 hover:text-blue-600 font-semibold px-2 py-1 rounded transition"
            onClick={() => setLangModalOpen(true)}
          >
            {/* Material Icons 스타일의 언어(지구본) 아이콘 */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" fill="#fff"/>
              <path d="M2 12h20" stroke="#2563EB" strokeWidth="1.5"/>
              <ellipse cx="12" cy="12" rx="5" ry="10" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
              <ellipse cx="12" cy="12" rx="10" ry="5" stroke="#2563EB" strokeWidth="1.5" fill="none"/>
            </svg>
            <span className="text-sm">{selectedLang === 'ko' ? '한국어' : 'English'}</span>
          </button>
          {langModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30" onClick={() => setLangModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-lg p-6 min-w-[220px] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                <button
                  className={`py-2 rounded text-lg font-semibold ${selectedLang === 'ko' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                  onClick={() => handleLangSelect('ko')}
                >
                  한국어
                </button>
                <button
                  className={`py-2 rounded text-lg font-semibold ${selectedLang === 'en' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                  onClick={() => handleLangSelect('en')}
                >
                  English
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="text-xl font-bold text-gray-900">BigPicture</div>
      </header>
      {/* 필터 바 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-white z-10 mt-14">
        <button className="text-sm font-medium text-blue-600 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">
          {messages.emotionTag[lang]}
        </button>
        <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">
          {messages.popular[lang]}
        </button>
        <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">
          {messages.latest[lang]}
        </button>
      </div>
      {/* 지도 영역 */}
      <main className="flex-1 relative min-h-0 pt-14">
        <GoogleMapClient />
      </main>
    </div>
  );
}
