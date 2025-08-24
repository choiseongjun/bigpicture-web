"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../lib/apiClient';

interface Comment {
  id: number;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  markerId: number;
  likes: number;
  isLiked?: boolean;
}

interface MarkerImage {
  id: number;
  imageUrl: string;
  imageType: 'thumbnail' | 'detail';
  imageOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  markerId: number;
}

interface CommunityMarker {
  id: number;
  author: string;
  createdAt: string;
  description: string;
  dislikes: number;
  emotionTag: string;
  images: MarkerImage[];
  latitude: number;
  likes: number;
  longitude: number;
  memberId: number;
  thumbnailImg: string;
  updatedAt: string;
  views: number;
  isLiked?: boolean;
  comments?: Comment[];
}

interface ApiResponse {
  count: number;
  data: CommunityMarker[];
}

export default function CommunityPage() {
  const [markers, setMarkers] = useState<CommunityMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<CommunityMarker | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastMarkerRef = useRef<HTMLDivElement | null>(null);

  const fetchMarkers = useCallback(async (pageNum: number, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await apiClient.get<ApiResponse>(`/markers/feed?page=${pageNum}&limit=10`);
      const newMarkers = response.data.data;

      if (isLoadMore) {
        setMarkers(prev => [...prev, ...newMarkers]);
      } else {
        setMarkers(newMarkers);
      }

      setHasMore(newMarkers.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('마커 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkers(1);
  }, [fetchMarkers]);

  // 무한스크롤을 위한 Intersection Observer 설정
  const lastMarkerElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMarkers(page + 1, true);
      }
    });
    
    if (node) observerRef.current.observe(node);
    lastMarkerRef.current = node;
  }, [loadingMore, hasMore, page, fetchMarkers]);

  const handleLike = (markerId: number) => {
    setMarkers(prev => prev.map(marker => 
      marker.id === markerId 
        ? { ...marker, isLiked: !marker.isLiked, likes: marker.isLiked ? marker.likes - 1 : marker.likes + 1 }
        : marker
    ));
  };

  const handleCommentLike = (markerId: number, commentId: number) => {
    setMarkers(prev => prev.map(marker => 
      marker.id === markerId 
        ? {
            ...marker,
            comments: marker.comments?.map(comment =>
              comment.id === commentId
                ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
                : comment
            ) || []
          }
        : marker
    ));
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarker || !commentInput.trim()) return;

    setSubmittingComment(true);
    
    try {
      const newComment: Comment = {
        id: Date.now(),
        content: commentInput.trim(),
        author: "현재사용자",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        createdAt: new Date().toISOString(),
        markerId: selectedMarker.id,
        likes: 0,
        isLiked: false
      };

      const updatedMarkers = markers.map(marker => 
        marker.id === selectedMarker.id 
          ? { ...marker, comments: [...(marker.comments || []), newComment] }
          : marker
      );
      
      setMarkers(updatedMarkers);
      setSelectedMarker(prev => prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : null);
      setCommentInput('');
      
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 48) return '어제';
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getFullImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com${imageUrl}`;
  };

  const getDetailImages = (marker: CommunityMarker) => {
    return marker.images
      .filter(img => img.imageType === 'detail')
      .sort((a, b) => a.imageOrder - b.imageOrder)
      .slice(0, 4);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">피드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">커뮤니티</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* 피드 */}
        <div className="space-y-6">
          {markers.map((marker, index) => {
            const isLast = index === markers.length - 1;
            const detailImages = getDetailImages(marker);
            
            return (
              <div 
                key={marker.id} 
                className="bg-white border border-gray-200 rounded-lg"
                ref={isLast ? lastMarkerElementRef : null}
              >
                {/* 포스트 헤더 */}
                <div className="flex items-center p-4 border-b border-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                    alt={marker.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-semibold text-gray-900">{marker.author}</div>
                    <div className="text-sm text-gray-500">{formatDate(marker.createdAt)}</div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>

                {/* 이미지 */}
                <div className="relative">
                  {/* 썸네일 이미지 */}
                  <div className="flex justify-center p-4">
                    <img
                      src={getFullImageUrl(marker.thumbnailImg)}
                      alt="썸네일"
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* 상세 이미지 그리드 (썸네일 아래에 표시) */}
                  {detailImages.length > 0 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">상세 이미지</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {detailImages.map((image, index) => (
                          <div key={image.id} className="aspect-square">
                            <img
                              src={getFullImageUrl(image.imageUrl)}
                              alt={`상세 이미지 ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 이미지 개수 표시 */}
                  {marker.images.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                      {marker.images.length}장
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => handleLike(marker.id)}
                      className={`flex items-center gap-1 ${marker.isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition-colors`}
                    >
                      <svg className={`w-6 h-6 ${marker.isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    {/* <button
                      onClick={() => setSelectedMarker(marker)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button> */}
                  </div>

                  {/* 좋아요 수 */}
                  <div className="font-semibold text-gray-900 mb-2">
                    좋아요 {marker.likes}개
                  </div>

                  {/* 제목과 설명 */}
                  <div className="mb-2">
                    <span className="font-semibold text-gray-900 mr-2">{marker.author}</span>
                    <span className="text-gray-900">{marker.description}</span>
                  </div>

                  {/* 감정 태그 */}
                  {marker.emotionTag && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {marker.emotionTag.split(',').map((tag, index) => (
                        <span key={index} className="text-blue-600 text-sm">#{tag.trim()}</span>
                      ))}
                    </div>
                  )}

                  {/* 댓글 미리보기 */}
                  {/* <div className="mb-2">
                    <button
                      onClick={() => setSelectedMarker(marker)}
                      className="text-gray-500 text-sm hover:text-gray-700"
                    >
                      댓글 보기
                    </button>
                  </div> */}

                  {/* 댓글 입력 */}
                  {/* <form onSubmit={(e) => {
                    e.preventDefault();
                    setSelectedMarker(marker);
                  }} className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <input
                      type="text"
                      placeholder="댓글 달기..."
                      className="flex-1 text-sm border-none outline-none"
                      readOnly
                    />
                    <button
                      type="submit"
                      className="text-blue-600 font-semibold text-sm hover:text-blue-800"
                    >
                      게시
                    </button>
                  </form> */}
                </div>
              </div>
            );
          })}
        </div>

        {/* 로딩 더보기 */}
        {loadingMore && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">더 많은 게시물을 불러오는 중...</p>
          </div>
        )}

        {/* 더 이상 데이터가 없음 */}
        {!hasMore && markers.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">모든 게시물을 불러왔습니다.</p>
          </div>
        )}
      </div>

      {/* 댓글 모달 */}
      {selectedMarker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">댓글</h2>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 썸네일 이미지 */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">썸네일</h3>
              <div className="flex justify-center">
                <div className="w-48 h-48">
                  <img
                    src={getFullImageUrl(selectedMarker.thumbnailImg)}
                    alt="썸네일"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* 이미지 갤러리 */}
            {getDetailImages(selectedMarker).length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">상세 이미지</h3>
                <div className="grid grid-cols-3 gap-2">
                  {getDetailImages(selectedMarker).map((image, index) => (
                    <div key={image.id} className="aspect-square">
                      <img
                        src={getFullImageUrl(image.imageUrl)}
                        alt={`상세 이미지 ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 댓글 목록 */}
            <div className="flex-1 overflow-y-auto p-4 max-h-96">
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>아직 댓글이 없습니다.</p>
                <p className="text-sm">첫 번째 댓글을 남겨보세요!</p>
              </div>
            </div>

            {/* 댓글 작성 폼 */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                  alt="내 프로필"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submittingComment}
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim() || submittingComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? '작성 중...' : '게시'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 