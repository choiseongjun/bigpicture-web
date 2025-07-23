import Image from "next/image";
import GoogleMapClient from "./GoogleMapClient";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] pb-24">
      {/* 상단 인사/로고 */}
      <header className="w-full flex flex-col items-center pt-8 pb-4">
        <Image src="/globe.svg" alt="로고" width={48} height={48} />
        <h1 className="text-2xl font-bold mt-2">안녕하세요!</h1>
        <p className="text-gray-500 text-sm mt-1">빅픽처와 함께하는 위치 기반 서비스</p>
      </header>

      {/* 구글맵 */}
      <section className="w-full flex justify-center px-4">
        <div className="w-full max-w-xl rounded-xl overflow-hidden shadow-md border border-gray-200">
          <GoogleMapClient />
        </div>
      </section>

      {/* 주요 버튼 */}
      <section className="flex justify-center gap-4 mt-6">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition">내 위치</button>
        <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-300 transition">장소 검색</button>
      </section>

      {/* 안내문구 */}
      <section className="flex-1 flex flex-col items-center justify-center mt-8">
        <p className="text-gray-400 text-base">지도를 움직여 원하는 위치를 확인하세요.</p>
      </section>
    </div>
  );
}
