'use client';

import { useState, useEffect, useCallback } from 'react';

interface RankingMarker {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  author: string;
  emotionTag: string;
  thumbnailImg: string;
  likes: number;
  views: number;
  createdAt: string;
  images: {
    imageUrl: string;
    imageType: 'thumbnail' | 'detail';
    imageOrder: number;
    isPrimary: boolean;
  }[];
}

// 가데이터
const dummyMarkers: RankingMarker[] = [
  {
    id: 1,
    latitude: 37.5665,
    longitude: 126.9780,
    description: "서울의 아름다운 야경을 담았습니다. 한강에서 바라본 도시의 불빛들이 정말 환상적이에요! 🌃",
    author: "서울러버",
    emotionTag: "감동,아름다움,평화",
    thumbnailImg: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
    likes: 245,
    views: 1234,
    createdAt: "2025-07-25T04:07:19.611484Z",
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
        imageType: "thumbnail",
        imageOrder: 0,
        isPrimary: true
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        imageType: "detail",
        imageOrder: 1,
        isPrimary: false
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1538485399081-7c8ce013aeea?w=400&h=300&fit=crop",
        imageType: "detail",
        imageOrder: 2,
        isPrimary: false
      }
    ]
  },
  {
    id: 2,
    latitude: 35.1796,
    longitude: 129.0756,
    description: "부산 해운대의 일출이 정말 장관이었어요! 새벽 5시에 일어나서 기다린 보람이 있었습니다. 🌅",
    author: "부산사랑",
    emotionTag: "감동,희망,열정",
    thumbnailImg: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    likes: 189,
    views: 987,
    createdAt: "2025-07-24T10:30:15.123456Z",
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        imageType: "thumbnail",
        imageOrder: 0,
        isPrimary: true
      }
    ]
  },
  {
    id: 3,
    latitude: 37.4563,
    longitude: 126.7052,
    description: "인천 월미도의 석양이 너무 아름다워서 카메라를 놓을 수 없었어요. 자연의 신비로움을 느낄 수 있었습니다. 🌇",
    author: "인천탐험가",
    emotionTag: "평화,아름다움,감사",
    thumbnailImg: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
    likes: 156,
    views: 756,
    createdAt: "2025-07-23T18:45:22.789012Z",
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
        imageType: "thumbnail",
        imageOrder: 0,
        isPrimary: true
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        imageType: "detail",
        imageOrder: 1,
        isPrimary: false
      }
    ]
  },
  {
    id: 4,
    latitude: 35.8714,
    longitude: 128.6014,
    description: "대구 팔공산에서 찍은 가을 단풍이 정말 환상적이었어요! 빨간 단풍잎들이 바람에 날리는 모습이 마치 그림 같았습니다. 🍁",
    author: "대구여행자",
    emotionTag: "감동,자연,평화",
    thumbnailImg: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    likes: 134,
    views: 623,
    createdAt: "2025-07-22T14:20:33.456789Z",
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        imageType: "thumbnail",
        imageOrder: 0,
        isPrimary: true
      }
    ]
  },
  {
    id: 5,
    latitude: 35.1595,
    longitude: 126.8526,
    description: "광주 무등산 정상에서 바라본 도시 전경이 정말 멋졌어요! 도시의 모든 불빛들이 마치 반짝이는 보석 같았습니다. ✨",
    author: "광주사랑",
    emotionTag: "감동,아름다움,성취",
    thumbnailImg: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
    likes: 98,
    views: 445,
    createdAt: "2025-07-21T09:15:44.123456Z",
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
        imageType: "thumbnail",
        imageOrder: 0,
        isPrimary: true
      }
    ]
  },
  {
    id: 6,
    latitude: 37.4563,
    longitude: 126.7052,
    description: "제주도 성산일출봉에서 본 일출이 평생 잊을 수 없을 만큼 아름다웠어요! 하늘과 바다가 하나가 되는 순간을 경험했습니다. 🌅",
    author: "제주탐험가",
    emotionTag: "감동,자연,평화",
    thumbnailImg: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    likes: 87,
    views: 389,
    createdAt: "2025-07-20T16:30:55.789012Z",
    images: [
      {
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        imageType: "thumbnail",
        imageOrder: 0,
        isPrimary: true
      }
    ]
  }
];

export default function RankingPage() {
  const [markers, setMarkers] = useState<RankingMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<RankingMarker | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalImages, setDetailModalImages] = useState<string[]>([]);
  const [detailModalIndex, setDetailModalIndex] = useState(0);
  const [filter, setFilter] = useState('likes'); // likes, views, recent

  // 가데이터로 랭킹 데이터 가져오기
  const fetchRanking = useCallback(async (filterType: string = 'likes') => {
    setLoading(true);
    
    // 가데이터 복사 및 정렬
    let sortedMarkers = [...dummyMarkers];
    
    switch (filterType) {
      case 'likes':
        sortedMarkers.sort((a, b) => b.likes - a.likes);
        break;
      case 'views':
        sortedMarkers.sort((a, b) => b.views - a.views);
        break;
      case 'recent':
        sortedMarkers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    // 로딩 시뮬레이션
    setTimeout(() => {
      setMarkers(sortedMarkers);
      setLoading(false);
    }, 500);
  }, []);

  // 필터 변경 시 데이터 새로고침
  useEffect(() => {
    fetchRanking(filter);
  }, [filter, fetchRanking]);

  // 상세정보 모달 열기
  const handleMarkerClick = (marker: RankingMarker) => {
    const images: string[] = [];
    if (marker.thumbnailImg) images.push(marker.thumbnailImg);
    if (marker.images && Array.isArray(marker.images)) {
      const detailImages = marker.images
        .filter((img: any) => img.imageType === 'detail')
        .sort((a: any, b: any) => a.imageOrder - b.imageOrder)
        .map((img: any) => img.imageUrl);
      images.push(...detailImages);
    }
    setSelectedMarker(marker);
    setDetailModalImages(images.filter(Boolean));
    setDetailModalIndex(0);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🏆 랭킹</h1>
          
          {/* 필터 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('likes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'likes' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ❤️ 좋아요 순
            </button>
            <button
              onClick={() => setFilter('views')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'views' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👁️ 조회수 순
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'recent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏰ 최신 순
            </button>
          </div>
        </div>
      </div>

      {/* 랭킹 리스트 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {markers.map((marker, index) => (
            <div
              key={marker.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer relative"
              onClick={() => handleMarkerClick(marker)}
            >
              {/* 랭킹 순위 */}
              <div className="absolute top-2 left-2 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index < 3 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {index + 1}
                </div>
              </div>

              {/* 썸네일 */}
              <div className="relative h-48 bg-gray-100">
                <img
                  src={marker.thumbnailImg}
                  alt="썸네일"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* 정보 */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm text-gray-900">{marker.author}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(marker.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* 감성태그 */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {marker.emotionTag && marker.emotionTag.split(',').map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* 설명 */}
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {marker.description}
                </p>

                {/* 좋아요/조회수 */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-red-500">❤️</span>
                    {marker.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>👁️</span>
                    {marker.views}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        )}

        {/* 더 이상 데이터 없음 */}
        {!loading && markers.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">모든 랭킹을 확인했습니다!</p>
          </div>
        )}
      </div>

      {/* 상세정보 모달 */}
      {detailModalOpen && selectedMarker && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-blue-100">
            <button 
              className="absolute top-4 right-4 text-3xl text-blue-400 hover:text-blue-700 z-10 bg-white rounded-full shadow p-2 transition" 
              onClick={() => setDetailModalOpen(false)}
            >
              &times;
            </button>
            
            {/* 이미지 슬라이드 */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white" style={{ minHeight: '320px' }}>
              {/* 썸네일 이미지 (고정 표시) */}
              {detailModalImages.length > 0 && (
                <img
                  src={detailModalImages[0]}
                  alt="썸네일"
                  className="max-h-72 max-w-full rounded-2xl object-contain shadow-lg border-2 border-blue-100 mt-8 mb-3 transition-all duration-200"
                />
              )}
              
              {/* 상세 이미지 확대 영역 */}
              {detailModalImages.length > 1 && (
                <div className="w-full px-4">
                  <div className="text-center mb-2">
                    <span className="text-sm font-semibold text-blue-700">상세 이미지</span>
                  </div>
                  {/* 상세이미지 확대 표시 */}
                  <div className="mb-3 flex justify-center items-center">
                    <img
                      src={detailModalImages[detailModalIndex]}
                      alt={`상세이미지${detailModalIndex}`}
                      className="max-h-48 max-w-full rounded-xl object-contain shadow-md border border-gray-200"
                    />
                  </div>
                  {/* 상세이미지 썸네일 리스트 */}
                  <div className="flex gap-2 flex-wrap justify-center mb-4">
                    {detailModalImages.slice(1).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`상세이미지${idx+1}`}
                        className={`w-14 h-14 object-cover rounded-lg border-2 cursor-pointer transition-all duration-150 ${detailModalIndex===idx+1 ? 'ring-2 ring-blue-500 border-blue-500 scale-105' : 'border-gray-200'}`}
                        onClick={() => setDetailModalIndex(idx+1)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 정보 카드 */}
            <div className="p-6 flex flex-col gap-3 border-t border-blue-100 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-lg text-blue-700 flex items-center gap-1">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {selectedMarker.author}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(selectedMarker.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                {/* 감성태그 chip */}
                {selectedMarker.emotionTag && selectedMarker.emotionTag.split(',').map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-200 via-blue-100 to-yellow-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm border border-blue-200 mr-2 mb-2">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="text-lg text-gray-800 mb-2 whitespace-pre-line font-medium leading-relaxed">
                {selectedMarker.description}
              </div>
              <div className="flex gap-6 text-gray-500 text-base mt-2 border-t border-blue-50 pt-3">
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15a7 7 0 0014 0M12 10v4m0 0h4m-4 0H8" />
                  </svg>
                  {selectedMarker.likes}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedMarker.views}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 