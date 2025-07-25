"use client";
import GoogleMapClient from "../GoogleMapClient";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col bg-[#f8fafc] mobile-full-height" style={{ height: '100dvh' }}>
      {/* 필터 바 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-white z-10 mt-14">
        <button className="text-sm font-medium text-blue-600 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">Emotion Tag</button>
        <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">Popular</button>
        <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">Latest</button>
      </div>
      {/* 지도 영역 */}
      <main className="flex-1 relative min-h-0 pt-14">
        <GoogleMapClient />
      </main>
    </div>
  );
} 