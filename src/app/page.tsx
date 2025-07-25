"use client";
import GoogleMapClient from "./GoogleMapClient";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
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
        <button className="text-sm font-medium text-blue-600 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">감성태그</button>
        <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">인기순</button>
        <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">최신순</button>
      </div>
      {/* 지도 영역 */}
      <main className="flex-1 relative min-h-0 pt-14">
        <GoogleMapClient />
      </main>
      {/* 하단 네비게이션 */}
      {/* <nav className="fixed bottom-0 left-0 w-full h-16 bg-white border-t shadow-lg z-20">
        <div className="flex items-center justify-around h-full">
          <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            <span className="text-xs">홈</span>
          </button>
          <Link href="/ranking" className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">랭킹</span>
          </Link>
          <button onClick={handlePlusClick} className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs">추가</span>
          </button>
          <Link href="/mypage" className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">마이</span>
          </Link>
        </div>
      </nav> */}
    </div>
  );
}
