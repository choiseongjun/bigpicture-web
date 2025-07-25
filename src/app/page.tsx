import GoogleMapClient from "./GoogleMapClient";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col bg-[#f8fafc] mobile-full-height" style={{ height: '100dvh' }}>
      {/* 헤더 */}
      <header className="fixed top-0 left-0 w-full h-14 border-b bg-white shadow-sm z-20 flex items-center justify-between px-4">
        <div className="w-8" /> {/* 왼쪽 여백 */}
        <div className="text-xl font-bold tracking-wide select-none">bigpicture</div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-500">
            <span className="material-icons">notifications_none</span>
          </button>
        </div>
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
      {/* 하단 네비게이션은 layout.tsx에서 고정 */}
    </div>
  );
}
