'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/apiClient';

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
  const [error, setError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<RankingMarker | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalImages, setDetailModalImages] = useState<string[]>([]);
  const [detailModalIndex, setDetailModalIndex] = useState(0);
  const [filter, setFilter] = useState('likes'); // likes, views, recent

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/markers/rank?limit=100');
        setMarkers(response.data.data || []);
      } catch (e: any) {
        setError('랭킹 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com${url}`; 
   };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6 px-2 pt-[66px]">
      <div className="max-w-2xl mx-auto">
        {/* <h2 className="text-2xl font-bold mb-6 text-center text-blue-700 tracking-tight">🏆 랭킹</h2> */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-8 text-red-500">{error}</div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {markers.map((marker, idx) => (
              <div
                key={marker.id}
                className="relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-200 flex flex-col overflow-hidden group border border-blue-100"
              >
                {/* 랭킹 뱃지 */}
                <div className="absolute -top-3 -left-3 z-10">
                  <div className="bg-gradient-to-r from-yellow-400 to-pink-400 text-white font-bold rounded-full px-4 py-1 shadow text-lg border-2 border-white">
                    #{idx + 1}
                  </div>
                </div>
                {/* 프로필/작성자 */}
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                  <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-white shadow">
                    {marker.author?.[0] || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-700">{marker.author}</span>
                    <span className="text-xs text-gray-400">{formatDate(marker.createdAt)}</span>
                  </div>
                </div>
                {/* 썸네일 이미지 */}
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={getFullImageUrl(marker.thumbnailImg)}
                    alt="썸네일"
                    className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                    onClick={() => handleMarkerClick(marker)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                {/* 상세 이미지 그리드 */}
                {marker.images && marker.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 px-4 pt-2 pb-1">
                    {marker.images.slice(0, 4).map((img, i) => (
                      <img
                        key={img.imageUrl + i}
                        src={getFullImageUrl(img.imageUrl)}
                        alt="상세"
                        className="object-cover w-full h-20 rounded-lg border border-gray-100 shadow-sm hover:scale-105 transition-transform duration-200"
                        onClick={() => handleMarkerClick(marker)}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                )}
                {/* 감성태그 칩 */}
                <div className="flex flex-wrap gap-1 px-4 pt-2">
                  {(marker.emotionTag || '').split(',').filter(Boolean).map((tag, i) => (
                    <span
                      key={tag + i}
                      className="bg-pink-100 text-pink-600 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
                {/* 설명 */}
                <div className="px-4 pt-2 pb-1">
                  <div className="text-gray-800 text-sm font-medium line-clamp-2 whitespace-pre-line">
                    {marker.description}
                  </div>
                </div>
                {/* 좋아요/조회수 */}
                <div className="flex items-center justify-between px-4 pb-4 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-pink-500 font-bold">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
                      {marker.likes}
                    </span>
                    <span className="flex items-center gap-1 text-blue-400 font-bold">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 4.5c-7.33 0-10 6.28-10 7.5s2.67 7.5 10 7.5 10-6.28 10-7.5-2.67-7.5-10-7.5zm0 13c-5.05 0-8.13-4.32-8.82-5.5C3.87 9.82 6.95 5.5 12 5.5s8.13 4.32 8.82 5.5c-0.69 1.18-3.77 5.5-8.82 5.5z" fill="currentColor"/></svg>
                      {marker.views}
                    </span>
                  </div>
                  <button
                    className="text-xs text-blue-500 font-semibold hover:underline"
                    onClick={() => handleMarkerClick(marker)}
                  >
                    상세보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* 상세 모달 등 기존 코드 유지 */}
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
    </div>
  );
} 