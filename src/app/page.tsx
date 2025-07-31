"use client";
import GoogleMapClient from "./GoogleMapClient";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from 'next-i18next';

export default function Home() {
  const { t, i18n } = useTranslation('common');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // 언어 변경 감지
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('홈 페이지 언어 변경 감지');
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);
  
  const handlePlusClick = () => {
    // 마커 추가 모드 활성화 (GoogleMapClient에서 처리)
    console.log('마커 추가 모드 활성화');
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] mobile-full-height" style={{ height: '100dvh' }} key={forceUpdate}>
      {/* 필터 바 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-white z-10 mt-14">
        <button className="text-sm font-medium text-blue-600 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">
          {t('emotionTag')}
        </button>
        <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">
          {t('popular')}
        </button>
        <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">
          {t('latest')}
        </button>
      </div>
      {/* 지도 영역 */}
      <main className="flex-1 relative min-h-0 pt-14">
        <GoogleMapClient />
      </main>
    </div>
  );
}
