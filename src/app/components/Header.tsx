"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from 'next-i18next';

export default function Header() {
  const [langModalOpen, setLangModalOpen] = useState(false);
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  
  // 초기 언어 설정
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);
  
  const handleLangSelect = async (l: 'ko' | 'en') => {
    setLangModalOpen(false);
    
    // localStorage에 언어 설정 저장
    localStorage.setItem('language', l);
    
    // 언어 변경
    await i18n.changeLanguage(l);
    
    // 언어 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: l }));
  };
  
  return (
    <header className="fixed top-0 left-0 w-full h-14 border-b bg-white shadow-sm z-20 flex items-center justify-between px-4">
      <div className="text-xl font-bold text-gray-900">BigPicture</div>
      <div className="flex items-center gap-2">
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
          <span className="text-sm">{i18n.language === 'ko' ? t('korean') : t('english')}</span>
        </button>
        {langModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30" onClick={() => setLangModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-lg p-6 min-w-[220px] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
              <button
                className={`py-2 rounded text-lg font-semibold ${i18n.language === 'ko' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={() => handleLangSelect('ko')}
              >
                {t('korean')}
              </button>
              <button
                className={`py-2 rounded text-lg font-semibold ${i18n.language === 'en' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={() => handleLangSelect('en')}
              >
                {t('english')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 