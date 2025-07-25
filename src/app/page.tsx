import GoogleMapClient from "./GoogleMapClient";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col bg-[#f8fafc] mobile-full-height" style={{ height: '100dvh' }}>
      {/* 헤더 */}
      <header className="fixed top-0 left-0 w-full h-14 border-b bg-white shadow-sm z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">BigPicture</h1>
          <Link href="/ranking" className="text-blue-600 hover:text-blue-700 font-medium">
            🏆 랭킹
          </Link>
        </div>
        <Link href="/mypage" title="마이페이지">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
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
