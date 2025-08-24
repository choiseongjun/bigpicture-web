'use client';

import { GoogleMap, Marker, InfoWindow, MarkerClusterer, OverlayView } from '@react-google-maps/api';
import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import apiClient from './lib/apiClient';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 37.5665,
  lng: 126.9780,
};

// 감정 데이터 정의
const emotions = [
  { id: 'happy', emoji: '😊', name: '행복', nameEn: 'Happy' },
  { id: 'sad', emoji: '😢', name: '슬픔', nameEn: 'Sad' },
  { id: 'angry', emoji: '😡', name: '분노', nameEn: 'Angry' },
  { id: 'fear', emoji: '😨', name: '두려움', nameEn: 'Fear' },
  { id: 'surprise', emoji: '😮', name: '놀람', nameEn: 'Surprise' },
  { id: 'peaceful', emoji: '😌', name: '평온', nameEn: 'Peaceful' },
  { id: 'love', emoji: '💕', name: '사랑', nameEn: 'Love' },
  { id: 'celebration', emoji: '🎉', name: '축하', nameEn: 'Celebration' },
  { id: 'achievement', emoji: '💪', name: '성취감', nameEn: 'Achievement' },
  { id: 'inspiration', emoji: '🎨', name: '영감', nameEn: 'Inspiration' },
  { id: 'delicious', emoji: '🍜', name: '맛있음', nameEn: 'Delicious' },
  { id: 'music', emoji: '🎵', name: '음악', nameEn: 'Music' },
  { id: 'beauty', emoji: '🌸', name: '아름다움', nameEn: 'Beauty' },
  { id: 'memory', emoji: '💭', name: '추억', nameEn: 'Memory' },
  { id: 'energy', emoji: '🏃‍♂️', name: '활력', nameEn: 'Energy' },
  { id: 'tired', emoji: '😴', name: '피곤함', nameEn: 'Tired' },
  { id: 'lonely', emoji: '🪞', name: '외로움', nameEn: 'Lonely' },
  { id: 'nostalgic', emoji: '📷', name: '그리움', nameEn: 'Nostalgic' },
  { id: 'anxious', emoji: '😬', name: '불안함', nameEn: 'Anxious' },
  { id: 'grateful', emoji: '🙏', name: '감사함', nameEn: 'Grateful' },
  { id: 'hopeful', emoji: '🌤️', name: '희망', nameEn: 'Hopeful' }
];

interface MarkerData {
  id: number;
  latitude: number;
  longitude: number;
  description: string;
  author: string;
  emotionTag: string;
  emotion?: string; // 선택된 감정들 (predefined emotions)
  thumbnailImg: string;
  likes: number;
  views: number;
  createdAt: string;
  isLiked?: boolean; // 좋아요 상태
  images: {
    imageUrl: string;
    imageType: 'thumbnail' | 'detail' | 'gallery';
    imageOrder: number;
    isPrimary: boolean;
  }[];
}

interface ClusterData {
  h3_index: string;
  lat: number;
  lng: number;
  count: number;
  marker_ids: number[];
  markers?: MarkerData[];
}

export default function GoogleMapClient() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchBoxRef = useRef<HTMLInputElement | null>(null);
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [placedMarker, setPlacedMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [showPlaceInfoWindow, setShowPlaceInfoWindow] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  // 썸네일/상세이미지 업로드 상태
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [detailFiles, setDetailFiles] = useState<File[]>([]);
  const [detailPreviews, setDetailPreviews] = useState<string[]>([]);
  // 업로드된 이미지 URL 상태
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [detailUrls, setDetailUrls] = useState<string[]>([]);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [isDetailUploading, setIsDetailUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [emotionTag, setEmotionTag] = useState('');
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [shareSetting, setShareSetting] = useState<'public' | 'friends' | 'private'>('public');
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalMarker, setDetailModalMarker] = useState<MarkerData | null>(null);
  const [detailModalImages, setDetailModalImages] = useState<string[]>([]);
  const [detailModalIndex, setDetailModalIndex] = useState(0);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [isClusterLoading, setIsClusterLoading] = useState(false);
  const clusterDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [showMyMarkers, setShowMyMarkers] = useState(false);
  // 상세 모달 관련 state 추가
  const [multiMarkers, setMultiMarkers] = useState<MarkerData[]>([]);
  const [multiMarkerIndex, setMultiMarkerIndex] = useState(0);
  // 인증 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 좋아요 로딩 상태 관리
  const [likeLoading, setLikeLoading] = useState<Set<number>>(new Set());
  
  // 위치 기반 로딩 상태 관리
  const [currentCenter, setCurrentCenter] = useState(defaultCenter);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // 필터링 관련 상태 추가
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterSettings, setFilterSettings] = useState({
    selectedEmotions: [] as string[],
    dateRange: {
      start: '',
      end: ''
    },
    likesRange: {
      min: 0,
      max: 1000
    },
    viewsRange: {
      min: 0,
      max: 1000
    },
    authorFilter: '',
    descriptionFilter: '',
    emotionTagFilter: '',
    sortBy: 'latest' as 'latest' | 'oldest' | 'likes' | 'views' | 'popular'
  });
  const [filteredMarkers, setFilteredMarkers] = useState<MarkerData[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [address, setAddress] = useState<string>('');

  // 좋아요 토글 함수
  const handleLikeToggle = async (markerId: number) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    // 이미 로딩 중이면 무시
    if (likeLoading.has(markerId)) return;
    
    // 로딩 상태 설정
    setLikeLoading(prev => new Set([...prev, markerId]));
    
    try {
      const response = await apiClient.post(`/markers/${markerId}/reaction`, {
        like_type: "like"
      });
      const { is_liked, likes } = response.data; // API 응답 필드명에 맞춤
      
      // 좋아요 상태는 마커 데이터의 isLiked 필드로 관리하므로 별도 Set 업데이트 불필요
      
      // 마커 데이터 업데이트 (isLiked 상태도 함께 업데이트)
      setDetailModalMarker(prev => {
        if (!prev) {
          console.warn('detailModalMarker가 null인 상태에서 좋아요 업데이트 시도');
          return null;
        }
        return { 
          ...prev, 
          likes: likes, 
          isLiked: is_liked 
        };
      });
      setMultiMarkers(prev => prev.map(marker => 
        marker.id === markerId ? { 
          ...marker, 
          likes: likes, 
          isLiked: is_liked 
        } : marker
      ));
      
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    } finally {
      // 로딩 상태 해제
      setLikeLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(markerId);
        return newSet;
      });
    }
  };

  // 위치 기반 초기화
  useEffect(() => {
    const initializeLocation = () => {
      if (!navigator.geolocation) {
        console.log('이 브라우저에서는 위치 정보가 지원되지 않습니다.');
        setIsLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('현재 위치 가져오기 성공:', { latitude, longitude });
          setCurrentCenter({ lat: latitude, lng: longitude });
          setMyLocation({ lat: latitude, lng: longitude });
          setIsLocationLoading(false);
        },
        (error) => {
          console.log('위치 정보를 가져오지 못했습니다:', error.message);
          setIsLocationLoading(false);
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 60000, // 1분 캐시
          timeout: 10000 
        }
      );
    };

    initializeLocation();
  }, []);

  // 위치가 업데이트되면 지도 중심 이동
  useEffect(() => {
    if (myLocation && mapRef.current && !hasCentered) {
      mapRef.current.setCenter(myLocation);
      mapRef.current.setZoom(16);
      setHasCentered(true);
    }
  }, [myLocation, hasCentered]);

  // detailModalMarker 상태 변화 모니터링
  useEffect(() => {
    console.log('detailModalMarker 상태 변화:', detailModalMarker);
    if (detailModalMarker) {
      console.log('detailModalMarker.views 값:', detailModalMarker.views);
    }
  }, [detailModalMarker]);

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('jwtToken');
      const loggedIn = !!token;
      setIsLoggedIn(loggedIn);
      
      // 로그아웃된 경우 내 마커만 보기 해제
      if (!loggedIn && showMyMarkers) {
        setShowMyMarkers(false);
        // 지도 새로고침
        if (mapRef.current) {
          const bounds = mapRef.current.getBounds();
          if (bounds) {
            fetchClusters(bounds, false);
          }
        }
      }
    };

    // 초기 로그인 상태 확인
    checkLoginStatus();

    // localStorage 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwtToken') {
        checkLoginStatus();
      }
    };

    // 같은 탭에서의 localStorage 변경 감지
    const handleStorageChangeLocal = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleStorageChangeLocal);

    // 주기적으로 로그인 상태 확인 (다른 탭에서 로그아웃한 경우 대비)
    const interval = setInterval(checkLoginStatus, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleStorageChangeLocal);
      clearInterval(interval);
    };
  }, [showMyMarkers]);

  // 감정 선택 핸들러
  const handleEmotionToggle = (emotionId: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotionId) 
        ? prev.filter(id => id !== emotionId)
        : [...prev, emotionId]
    );
  };

  const handleRemoveEmotion = (emotionId: string) => {
    setSelectedEmotions(prev => prev.filter(id => id !== emotionId));
  };

  // 감성태그 추가 함수
  const handleAddEmotionTag = () => {
    const tag = emotionTag.trim();
    if (tag && !emotionTags.includes(tag)) {
      setEmotionTags(prev => [...prev, tag]);
      setEmotionTag('');
    }
  };

  // 감성태그 제거 함수
  const handleRemoveEmotionTag = (tagToRemove: string) => {
    setEmotionTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // 감성태그 엔터키 처리 함수
  const handleEmotionTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmotionTag();
    }
  };

  // 저장 버튼 클릭 핸들러
  const handleSaveMarker = async () => {
    if (!placedMarker) return;
    if (!description.trim()) {
      alert('설명을 입력하세요.');
      return;
    }
    if (selectedEmotions.length === 0) {
      alert('감정을 1개 이상 선택하세요.');
      return;
    }
    if (detailUrls.length === 0) {
      alert('이미지를 1장 이상 업로드하세요.');
      return;
    }
    const latitude = placedMarker.lat;
    const longitude = placedMarker.lng;
    const selectedImages = detailUrls;
    const firstImage = selectedImages[0]; // 첫 번째 이미지를 썸네일로 사용
    const markerData = {
      latitude: latitude,
      longitude: longitude,
      emotion: selectedEmotions.join(','), // 선택된 감정들을 문자열로 전송
      emotion_tag: emotionTags.join(','), // 사용자가 입력한 감성태그들
      description: description.trim(),
      share_setting: shareSetting, // 공유 설정 추가
      thumbnail_img: firstImage.replace('https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com', ''),
      images: [
        {
          image_url: firstImage.replace('https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com', ''),
          image_type: 'thumbnail',
          image_order: 0,
          is_primary: true
        },
        ...selectedImages.map((imageUrl, index) => ({
          image_url: imageUrl.replace('https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com', ''),
          image_type: 'detail',
          image_order: index + 1,
          is_primary: false
        }))
      ]
    };
    console.log('서버로 보낼 마커 데이터:', markerData);
    try {
      const response = await apiClient.post('/markers', markerData);
      alert('마커가 저장되었습니다!');
      setShowPlaceModal(false);
      setPlacedMarker(null);
      setDescription('');
      setEmotionTag('');
      setEmotionTags([]);
      setSelectedEmotions([]);
      setShareSetting('public'); // 공유 설정 초기화
      setDetailFiles([]);
      setDetailPreviews([]);
      setDetailUrls([]);
      // 마커 저장 후 마커 목록 갱신
      if (mapRef.current) {
        const bounds = mapRef.current.getBounds();
        if (bounds) {
          fetchMarkers(bounds);
        }
      }
      setIsPlacingMarker(false);
    } catch (err) {
      alert('마커 저장 실패');
    }
  };

  // 썸네일 업로드 핸들러 (API 연동)
  const handleThumbnailChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setThumbnailFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      
      setIsThumbnailUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const res = await apiClient.post('/s3/upload/circular', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const fullS3Url = `https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com${res.data.s3_url}`;
        setThumbnailUrl(fullS3Url);
      } catch (err) {
        alert('썸네일 업로드 실패');
        setThumbnailUrl(null);
      } finally {
        setIsThumbnailUploading(false);
      }
    } else {
      setThumbnailPreview(null);
      setThumbnailUrl(null);
    }
  };

const handleDetailChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const newFiles = Array.from(e.target.files || []);
  
  // 새 파일이 없으면 (취소한 경우) 기존 파일들 유지
  if (newFiles.length === 0) {
    return;
  }

  // iOS 감지 (Safari, Chrome 모두 포함)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  console.log('iOS 감지:', isIOS, 'User Agent:', navigator.userAgent);

  // 기존 파일들과 새 파일들을 합침
  const allFiles = [...detailFiles, ...newFiles];
  setDetailFiles(allFiles);

  // 미리보기 생성
  setIsDetailUploading(true);
  
  try {
    const newPreviews = await Promise.all(newFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error(`파일 읽기 실패: ${file.name}`));
        reader.readAsDataURL(file);
      });
    }));
    
    setDetailPreviews([...detailPreviews, ...newPreviews]);

    console.log('업로드 시작 - 파일 개수:', newFiles.length, 'iOS:', isIOS);
    
    const results = [];
    
    // iOS에서는 매우 보수적인 업로드 설정
    const uploadFile = async (file: File, retryCount = 0): Promise<any> => {
      const maxRetries = 3;
      const timeout = isIOS ? 60000 : 15000; // iOS: 60초 (매우 길게)
      
      try {
        console.log(`파일 업로드 시작: ${file.name} (${file.size} bytes) (시도: ${retryCount + 1}/${maxRetries + 1})`);
        
        // iOS에서 FormData를 새로 생성 (메모리 이슈 방지)
        const formData = new FormData();
        formData.append('image', file);
        
        // iOS에서 더 단순한 요청 설정
        const config = {
          timeout: timeout,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        };

        // iOS에서 추가 헤더 설정 (연결 문제 해결)
        if (isIOS) {
          config.headers = {
            ...config.headers
          };
        }

        const res = await apiClient.post('/s3/upload/normal', formData, config);
        
        console.log(`✅ 업로드 성공: ${file.name}`, res.data);
        const fullS3Url = `https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com${res.data.s3_url}`;
        return { success: true, url: fullS3Url, file };
        
      } catch (error: any) {
        console.error(`❌ 파일 업로드 실패: ${file.name} (시도: ${retryCount + 1})`, {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          code: error.code,
          timeout: error.code === 'ECONNABORTED',
        });
        
        // iOS에서 모든 오류에 대해 재시도 (네트워크 불안정성 때문)
        if (retryCount < maxRetries) {
          const waitTime = (retryCount + 1) * 2000; // 2초, 4초, 6초
          console.log(`🔄 재시도 예정: ${file.name} (${waitTime}ms 후)`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return uploadFile(file, retryCount + 1);
        }
        
        return { success: false, file, error };
      }
    };
    
    // iOS에서 매우 느린 순차 업로드
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      
      // iOS에서 충분한 대기시간 (메모리 정리 시간 포함)
      if (i > 0) {
        const waitTime = isIOS ? 3000 : 500; // iOS: 3초, 데스크톱: 0.5초
        console.log(`⏳ 다음 파일 업로드 대기 중... ${waitTime/1000}초`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // iOS에서 가비지 컬렉션 시도
        if (isIOS) {
          try {
            // 메모리 정리 힌트
            const performance = window.performance as any;
            if (performance?.memory) {
              console.log('메모리 사용량:', {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
              });
            }
          } catch (e) {
            // 무시
          }
        }
      }
      
      console.log(`📤 파일 ${i + 1}/${newFiles.length} 업로드 시작: ${file.name}`);
      const result = await uploadFile(file);
      results.push(result);
      
      const status = result.success ? '✅ 성공' : '❌ 실패';
      console.log(`📊 업로드 진행: ${i + 1}/${newFiles.length} - ${status}`);
      
      // iOS에서 실패 시 즉시 중단 (메모리 절약)
      if (isIOS && !result.success && i === 0) {
        console.log('🛑 첫 번째 파일 업로드 실패로 중단');
        break;
      }
    }
    
    console.log('모든 업로드 완료 - 결과:', results);
    
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);
    
    console.log('성공한 업로드:', successfulUploads.length, '실패한 업로드:', failedUploads.length);
    
    if (successfulUploads.length > 0) {
      const newUrls = successfulUploads.map(result => result.url).filter((url): url is string => url !== undefined);
      console.log('성공한 URL들:', newUrls);
      setDetailUrls([...detailUrls, ...newUrls]);
    }
    
    if (failedUploads.length > 0) {
      console.warn(`${failedUploads.length}개 파일 업로드 실패:`, failedUploads.map(r => r.file.name));
      
      // 실패한 파일들만 제거하고 성공한 파일들은 유지
      const failedFileNames = failedUploads.map(r => r.file.name);
      const remainingFiles = allFiles.filter(file => !failedFileNames.includes(file.name));
      
      setDetailFiles(remainingFiles);
      
      // 미리보기도 실패한 파일들에 해당하는 인덱스 제거
      const successfulIndexes: number[] = [];
      allFiles.forEach((file, index) => {
        if (!failedFileNames.includes(file.name)) {
          successfulIndexes.push(index);
        }
      });
      
      const remainingPreviews = detailPreviews.concat(newPreviews).filter((_, index) => 
        successfulIndexes.includes(index)
      );
      setDetailPreviews(remainingPreviews);
      
      if (failedUploads.length === newFiles.length) {
        alert('모든 이미지 업로드에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
      } else {
        alert(`${failedUploads.length}개 이미지 업로드에 실패했습니다. 성공한 ${successfulUploads.length}개 이미지만 저장됩니다.`);
      }
    }
    
  } catch (err) {
    console.error('업로드 처리 중 오류:', err);
    alert('이미지 업로드 처리 중 오류가 발생했습니다. 파일 크기나 네트워크 상태를 확인해주세요.');
    
    // 전체 실패 시 새로 추가된 파일들 제거
    setDetailFiles(detailFiles);
    setDetailPreviews(detailPreviews);
  } finally {
    setIsDetailUploading(false);
  }
};

  const fetchMarkers = useCallback(async (bounds: google.maps.LatLngBounds) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        console.log('마커 데이터 요청 중...', bounds.toJSON());
        
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const lat = (ne.lat() + sw.lat()) / 2;
        const lng = (ne.lng() + sw.lng()) / 2;
        const lat_delta = Math.abs(ne.lat() - sw.lat()) / 2;
        const lng_delta = Math.abs(ne.lng() - sw.lng()) / 2;

        const response = await apiClient.get(`/markers?lat=${lat}&lng=${lng}&lat_delta=${lat_delta}&lng_delta=${lng_delta}&limit=60`);
        const data = response.data;
        console.log('API 응답:', data);
        console.log('마커 개수:', data.data?.length || 0);
        
        // 첫 번째 마커의 썸네일 이미지 URL 확인
        if (data.data && data.data.length > 0) {
          const firstMarker = data.data[0];
          console.log('첫 번째 마커 썸네일:', firstMarker.thumbnailImg);
          const testImageUrl = getFullImageUrl(firstMarker.thumbnailImg);
          console.log('테스트 이미지 URL:', testImageUrl);
          
          // 이미지 로딩 테스트
          if (testImageUrl) {
            const img = new Image();
            img.onload = () => console.log('이미지 로딩 성공:', testImageUrl);
            img.onerror = () => console.log('이미지 로딩 실패:', testImageUrl);
            img.src = testImageUrl;
          }
        }
        
        setMarkers(data.data || []);
      } catch (error) {
        console.error('마커 데이터를 가져오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms 디바운싱
  }, []);

  // 클러스터 API로 데이터 fetch
  const fetchClusters = useCallback(async (bounds: google.maps.LatLngBounds | null, myOnly = false) => {
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const lat = (ne.lat() + sw.lat()) / 2;
    const lng = (ne.lng() + sw.lng()) / 2;
    const lat_delta = Math.abs(ne.lat() - sw.lat()) / 2;
    const lng_delta = Math.abs(ne.lng() - sw.lng()) / 2;
    const limit = 500;
    try {
      setIsClusterLoading(true);
      const myParam = myOnly ? '&my=true' : '';
      const response = await apiClient.get(`/markers/cluster?lat=${lat}&lng=${lng}&lat_delta=${lat_delta}&lng_delta=${lng_delta}&limit=${limit}${myParam}`);
      console.log('클러스터 응답:', response.data);
      setClusters(response.data.data || response.data);
    } catch (e) {
      console.error('클러스터 데이터 로딩 실패:', e);
    } finally {
      setIsClusterLoading(false);
    }
  }, []);

  // 지도 바운드 변경 시 클러스터 fetch
  const handleBoundsChanged = () => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (clusterDebounceRef.current) {
      clearTimeout(clusterDebounceRef.current);
    }
    clusterDebounceRef.current = setTimeout(() => {
      fetchClusters(bounds ?? null, showMyMarkers);
    }, 500);
  };

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom();
      if (zoom !== undefined) {
        setCurrentZoom(zoom);
      }
    }
  }, []);
  // S3 URL 처리 함수
const getFullImageUrl = (imageUrl: string | undefined): string | undefined => {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return imageUrl; // undefined나 빈 문자열이면 그대로 반환
    }
    
    // 이미 http로 시작하면 그대로 반환
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // http로 시작하지 않으면 S3 URL 앞에 붙여서 반환
    return `https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com${imageUrl}`;
  };

  // 클러스터 스타일
  const clusterStyles = [
    {
      url: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m1.png',
      textColor: 'white',
      textSize: 18,
      height: 60,
      width: 60,
    },
  ];

  // 클러스터링 설정 - 줌레벨에 따라 gridSize 동적 조정
  const getClustererOptions = () => {
    let gridSize = 60;
    if (currentZoom <= 10) {
      gridSize = 30;
    } else if (currentZoom <= 12) {
      gridSize = 60;
    }
    return {
      gridSize,
      maxZoom: 12,
      minimumClusterSize: 2,
      styles: [
        {
          url: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m1.png',
          textColor: 'white',
          textSize: 18,
          height: 70,
          width: 70,
        },
      ],
    };
  };

  const createCustomMarkerIcon = useCallback((imageUrl: string) => {
    if (!window.google?.maps) {
      console.log('Google Maps API가 로드되지 않음');
      return undefined;
    }
    
    const fullImageUrl = getFullImageUrl(imageUrl);
    console.log('마커 아이콘 생성:', fullImageUrl);
    
    // fullImageUrl이 undefined이면 기본 마커 사용
    if (!fullImageUrl) {
      console.log('이미지 URL이 없어서 기본 마커 사용');
      return undefined;
    }
    
    // 간단한 원형 마커 생성 - 이미지 URL을 직접 사용
    const iconConfig = {
      url: fullImageUrl,
      scaledSize: new window.google.maps.Size(30, 30),
      anchor: new window.google.maps.Point(15, 15),
    };
    
    console.log('아이콘 설정 (크기: 30x30):', iconConfig);
    return iconConfig;
  }, []);

  // 첫 번째 감정을 가져오는 헬퍼 함수
  const getFirstEmotion = useCallback((emotionString: string | undefined) => {
    if (!emotionString) return null;
    const firstEmotion = emotionString.split(',')[0].trim();
    return emotions.find(e => e.id === firstEmotion);
  }, []);

  const onMapLoad = (map: google.maps.Map) => {
    console.log('=== 맵 로드 완료 ===');
    console.log('지도 객체:', map);
    console.log('지도 중심:', map.getCenter());
    console.log('지도 줌:', map.getZoom());
    
    mapRef.current = map;
    setMapLoaded(true);
    
    // 위치가 로드되었고 현재 위치로 설정된 경우, 지도를 현재 위치로 이동
    if (myLocation && !hasCentered) {
      map.setCenter(myLocation);
      map.setZoom(16);
      setHasCentered(true);
    }
    
    // 초기 마커 로드
    const bounds = map.getBounds();
    if (bounds) {
      console.log('초기 바운드:', bounds.toJSON());
      fetchMarkers(bounds);
    }
    
    console.log('=== 맵 로드 설정 완료 ===');
  };

  const onMarkerLoad = (marker: google.maps.Marker) => {
    console.log('마커 로드:', markerRefs.current.length + 1);
    markerRefs.current.push(marker);
  };

  const handleSearchResultClick = useCallback((place: google.maps.places.PlaceResult) => {
    console.log('=== 검색 결과 클릭 시작 ===');
    console.log('클릭된 장소:', place);
    console.log('지도 참조 존재:', !!mapRef.current);
    console.log('위치 정보 존재:', !!place.geometry?.location);
    console.log('Google Maps API 키 존재:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    console.log('Google Maps API 키 길이:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length);
    console.log('Google Maps API 로드 상태:', !!window.google?.maps);
    console.log('Google Maps Places API 로드 상태:', !!window.google?.maps?.places);
    
    if (!mapRef.current) {
      console.error('지도가 로드되지 않음');
      return;
    }
    
    if (!place.geometry?.location) {
      console.error('위치 정보가 없음');
      return;
    }
    
    let location = place.geometry.location;
    let lat: number, lng: number;
    if (typeof location.lat === 'function' && typeof location.lng === 'function') {
      lat = location.lat();
      lng = location.lng();
    } else {
      lat = (location as any).lat;
      lng = (location as any).lng;
    }
    const latLng = new window.google.maps.LatLng(lat, lng);

    
    try {
      // 지도 이동 - setCenter만 사용

      mapRef.current.setCenter(latLng);

      mapRef.current.setZoom(15);
   
      // 검색 결과 숨기기 및 검색창 업데이트
      setShowSearchResults(false);
      setSearchQuery(place.name || '');
      console.log('=== 지도 이동 완료 ===');
    } catch (error) {
      console.error('지도 이동 중 오류:', error);
      console.error('오류 상세:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
    }
  }, []);

  // 검색 기능
  const handleSearch = useCallback(async () => {
    console.log('=== 검색 버튼 클릭됨 ===');
    console.log('검색어:', searchQuery);
    console.log('검색어 길이:', searchQuery.length);
    console.log('검색어 공백 제거 후 길이:', searchQuery.trim().length);
    
    if (!searchQuery.trim()) {
      console.log('검색어가 비어있음');
      return;
    }
    
    if (!window.google?.maps?.places) {
      console.error('Google Places API가 로드되지 않음');
      return;
    }
    
    if (!mapRef.current) {
      console.error('지도가 로드되지 않음');
      return;
    }

    try {
      console.log('검색 시작:', searchQuery);
      const service = new window.google.maps.places.PlacesService(mapRef.current);
      const request = {
        query: searchQuery,
        fields: ['name', 'geometry', 'formatted_address']
      };

      service.findPlaceFromQuery(request, (results, status) => {
        console.log('검색 결과:', { results, status });
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setSearchResults(results);
          setShowSearchResults(true);
          console.log('검색 결과 설정 완료:', results.length);

          // 첫 번째 결과로 지도 이동
          if (results.length > 0) {
            handleSearchResultClick(results[0]);
          }
        } else {
          console.log('검색 결과 없음:', status);
          setSearchResults([]);
          setShowSearchResults(false);
        }
      });
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    }
  }, [searchQuery, handleSearchResultClick]);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // 검색창 외부 클릭 시 검색 결과 숨기기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (clusterDebounceRef.current) {
        clearTimeout(clusterDebounceRef.current);
      }
    };
  }, []);

  // 확대/축소 함수
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom()! + 1);
    }
  };
  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom()! - 1);
    }
  };

  // 내 위치로 실시간 이동 함수
  const handleMyLocation = () => {
    setHasCentered(false); // 버튼 누를 때마다 초기화
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보가 지원되지 않습니다.');
      return;
    }
    // 기존 watch 구독 해제
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });
        if (!hasCentered && mapRef.current) {
          mapRef.current.setCenter({ lat: latitude, lng: longitude });
          mapRef.current.setZoom(16);
          setHasCentered(true);
        }
      },
      (error) => {
        alert('위치 정보를 가져오지 못했습니다. 위치 권한을 허용해주세요.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  // 언마운트 시 watch 구독 해제
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // detailModalMarker 상태 변화 모니터링
  useEffect(() => {
    console.log('detailModalMarker 상태 변화:', detailModalMarker);
    if (detailModalMarker) {
      console.log('detailModalMarker.views 값:', detailModalMarker.views);
    }
  }, [detailModalMarker]);

  // 플러스 버튼 클릭 핸들러
  const handlePlusClick = () => {
    setIsPlacingMarker(true);
    setPlacedMarker(null);
    setShowPlaceModal(false);
    setShowPlaceInfoWindow(false);
    setDescription('');
    setSelectedEmotions([]);
    setDetailFiles([]);
    setDetailPreviews([]);
    setDetailUrls([]);
    if (mapRef.current) {
      mapRef.current.setOptions({ draggableCursor: 'crosshair' });
    }
  };

  // 좌표를 주소로 변환하는 함수
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&language=ko`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const formattedAddress = data.results[0].formatted_address;
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('주소 변환 실패:', error);
      setAddress('주소를 불러올 수 없습니다');
    }
  }, []);

  // 지도 클릭 핸들러
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (isPlacingMarker && e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setPlacedMarker({ lat, lng });
      // 좌표가 설정되면 주소를 가져옴
      getAddressFromCoordinates(lat, lng);
      setShowPlaceInfoWindow(true);
      setIsPlacingMarker(false);
      // 지도 커서를 기본으로 복원
      if (mapRef.current) {
        mapRef.current.setOptions({ draggableCursor: 'grab' });
      }
    }
  };

  // 클러스터 마커 렌더러
  // MarkerClustererRenderer import 및 관련 함수 완전히 제거

  console.log('렌더링할 마커 개수:', markers.length, '현재 줌:', currentZoom);

  // 상세 모달 열 때 조회수 증가 API 호출 및 최신 데이터로 업데이트
  const incrementViewCount = async (markerId: number) => {
    try {
      const response = await apiClient.get(`/markers/${markerId}/detail`);
      console.log('조회수 증가 API 호출 완료:', markerId);
      console.log('API 응답 전체:', response.data);
      
      // API 응답에서 최신 데이터 추출
      const { marker, images } = response.data;
      console.log('마커 데이터:', marker);
      console.log('views 값:', marker.views);
      
      // MarkerData 형태로 변환
      const updatedMarker: MarkerData = {
        id: marker.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
        description: marker.description,
        author: marker.author,
        emotionTag: marker.emotionTag || '',
        emotion: marker.emotion || '',
        thumbnailImg: marker.thumbnailImg,
        likes: marker.likes,
        views: marker.views || 0, // views가 undefined일 경우 0으로 설정
        createdAt: marker.createdAt,
        isLiked: marker.isLiked,
        images: images.map((img: any) => ({
          imageUrl: img.imageUrl,
          imageType: img.imageType,
          imageOrder: img.imageOrder,
          isPrimary: img.isPrimary
        }))
      };
      
      console.log('업데이트된 마커 데이터:', updatedMarker);
      console.log('업데이트된 views 값:', updatedMarker.views);
      
      // 상세 모달 데이터 업데이트
      console.log('setDetailModalMarker 호출 전');
      setDetailModalMarker(updatedMarker);
      console.log('setDetailModalMarker 호출 후');
      
      // 이미지 배열 업데이트
      const imageUrls: string[] = [];
      // 썸네일 이미지 추가
      if (updatedMarker.thumbnailImg) {
        imageUrls.push(getFullImageUrl(updatedMarker.thumbnailImg) ?? '');
      }
      // 상세이미지들 추가
      const detailImages = updatedMarker.images
        .filter(img => img.imageType === 'detail')
        .sort((a, b) => a.imageOrder - b.imageOrder)
        .map(img => getFullImageUrl(img.imageUrl) ?? '');
      imageUrls.push(...detailImages);
      
      setDetailModalImages(imageUrls.filter(Boolean));
      setDetailModalIndex(0);
      
    } catch (error) {
      console.error('조회수 증가 API 호출 실패:', error);
      // 에러가 발생해도 기존 detailModalMarker는 유지
    }
  };

  // InfoWindow에서 이미지 클릭 시 상세정보 모달 오픈
  const handleMarkerImageClick = (marker: MarkerData) => {
    console.log('마커 클릭 - 초기 마커 데이터:', marker);
    console.log('마커 클릭 - 초기 views 값:', marker.views);
    
    // 모달 상태 초기화
    setDetailModalOpen(true);
    
    // 초기 데이터 설정 (즉시 표시)
    setDetailModalMarker(marker);
    
    // 이미지 배열 설정
    const imageUrls: string[] = [];
    if (marker.thumbnailImg) {
      imageUrls.push(getFullImageUrl(marker.thumbnailImg) ?? '');
    }
    const detailImages = marker.images
      .filter(img => img.imageType === 'detail')
      .sort((a, b) => a.imageOrder - b.imageOrder)
      .map(img => getFullImageUrl(img.imageUrl) ?? '');
    imageUrls.push(...detailImages);
    
    setDetailModalImages(imageUrls.filter(Boolean));
    
    // multiMarkers에서 현재 마커의 인덱스 찾기
    const markerIndex = multiMarkers.findIndex(m => m.id === marker.id);
    setDetailModalIndex(markerIndex >= 0 ? markerIndex : 0);
    
    // 조회수 증가 API 호출 및 최신 데이터로 업데이트
    incrementViewCount(marker.id);
  };

  // 하버사인 공식: 두 위경도 좌표 사이 거리(m)
  function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 마커 그룹핑: 20미터 이내 마커끼리 그룹핑
  function groupMarkersByDistance(markers: MarkerData[], threshold = 20) {
    const groups: MarkerData[][] = [];
    const used = new Set<number>();

    markers.forEach((marker, i) => {
      if (used.has(i)) return;

      const group = [marker];
      used.add(i);

      markers.forEach((otherMarker, j) => {
        if (i === j || used.has(j)) return;

        const distance = getDistanceFromLatLonInMeters(
          marker.latitude, marker.longitude,
          otherMarker.latitude, otherMarker.longitude
        );

        if (distance <= threshold) {
          group.push(otherMarker);
          used.add(j);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  let allMarkers: MarkerData[] = [];
  if (currentZoom >= 15) {
    allMarkers = clusters.flatMap(cluster => cluster.markers || []);
  } else {
    allMarkers = clusters.map(cluster => {
      if (cluster.markers && cluster.markers.length > 0) {
        return cluster.markers[0];
      }
      return {
        id: -1,
        latitude: cluster.lat,
        longitude: cluster.lng,
        description: '',
        author: '',
        emotionTag: '',
        thumbnailImg: '',
        likes: 0,
        views: 0,
        createdAt: '',
        images: [],
      };
    });
  }

  // 필터링된 마커 또는 원본 마커 사용
  const displayMarkers = isFilterActive ? filteredMarkers : allMarkers;
  
  const markerGroups = currentZoom >= 15
    ? groupMarkersByDistance(displayMarkers, 30)
    : displayMarkers.map(m => [m]);
  
  // markerGroups 생성 직후
  console.log('markerGroups:', markerGroups);

  // 필터링 함수들
  const applyFilters = useCallback(() => {
    // 모든 마커 데이터를 가져오기 위해 clusters에서 추출
    let allMarkersData = clusters.flatMap(cluster => cluster.markers || []);
    let filtered = [...allMarkersData];

    // 감정 필터
    if (filterSettings.selectedEmotions.length > 0) {
      filtered = filtered.filter(marker => {
        if (!marker.emotion) return false;
        const markerEmotions = marker.emotion.split(',').map(e => e.trim());
        return filterSettings.selectedEmotions.some(selected => 
          markerEmotions.includes(selected)
        );
      });
    }

    // 날짜 범위 필터
    if (filterSettings.dateRange.start || filterSettings.dateRange.end) {
      filtered = filtered.filter(marker => {
        const markerDate = new Date(marker.createdAt);
        const startDate = filterSettings.dateRange.start ? new Date(filterSettings.dateRange.start) : null;
        const endDate = filterSettings.dateRange.end ? new Date(filterSettings.dateRange.end) : null;

        if (startDate && markerDate < startDate) return false;
        if (endDate && markerDate > endDate) return false;
        return true;
      });
    }

    // 좋아요 범위 필터
    filtered = filtered.filter(marker => 
      marker.likes >= filterSettings.likesRange.min && 
      marker.likes <= filterSettings.likesRange.max
    );

    // 조회수 범위 필터
    filtered = filtered.filter(marker => 
      marker.views >= filterSettings.viewsRange.min && 
      marker.views <= filterSettings.viewsRange.max
    );

    // 작성자 필터
    if (filterSettings.authorFilter) {
      filtered = filtered.filter(marker =>
        marker.author.toLowerCase().includes(filterSettings.authorFilter.toLowerCase())
      );
    }

    // 설명 필터
    if (filterSettings.descriptionFilter) {
      filtered = filtered.filter(marker =>
        marker.description.toLowerCase().includes(filterSettings.descriptionFilter.toLowerCase())
      );
    }

    // 감성태그 필터
    if (filterSettings.emotionTagFilter) {
      filtered = filtered.filter(marker =>
        marker.emotionTag.toLowerCase().includes(filterSettings.emotionTagFilter.toLowerCase())
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (filterSettings.sortBy) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'likes':
          return b.likes - a.likes;
        case 'views':
          return b.views - a.views;
        case 'popular':
          return (b.likes + b.views) - (a.likes + a.views);
        default:
          return 0;
      }
    });

    setFilteredMarkers(filtered);
    setIsFilterActive(true);
  }, [clusters, filterSettings]);

  const clearFilters = () => {
    setFilterSettings({
      selectedEmotions: [],
      dateRange: { start: '', end: '' },
      likesRange: { min: 0, max: 1000 },
      viewsRange: { min: 0, max: 1000 },
      authorFilter: '',
      descriptionFilter: '',
      emotionTagFilter: '',
      sortBy: 'latest'
    });
    setFilteredMarkers([]);
    setIsFilterActive(false);
  };

  const handleFilterEmotionToggle = (emotionId: string) => {
    setFilterSettings(prev => ({
      ...prev,
      selectedEmotions: prev.selectedEmotions.includes(emotionId)
        ? prev.selectedEmotions.filter(id => id !== emotionId)
        : [...prev.selectedEmotions, emotionId]
    }));
  };

  // 필터 적용 시 markers 업데이트
  useEffect(() => {
    if (isFilterActive) {
      applyFilters();
    }
  }, [filterSettings, clusters, isFilterActive, applyFilters]);

  // Escape 키로 필터 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFilterModal) {
        setShowFilterModal(false);
      }
    };

    if (showFilterModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showFilterModal]);

  // 커스텀 원형 마커 컴포넌트
  const CustomMarker = ({ position, imageUrl, onClick }: { 
    position: { lat: number; lng: number }; 
    imageUrl: string; 
    onClick: () => void; 
  }) => {
    const fullImageUrl = getFullImageUrl(imageUrl);
    
    return (
      <OverlayView
        position={position}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      >
        <div 
          className="w-[50px] h-[50px] rounded-full border border-[#D8D8D8] overflow-hidden cursor-pointer hover:scale-110 transition-transform duration-200 shadow-lg"
          onClick={onClick}
          style={{
            backgroundImage: fullImageUrl ? `url(${fullImageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: fullImageUrl ? 'transparent' : '#D8D8D8'
          }}
        />
      </OverlayView>
    );
  };

  return (
    <div className="w-full h-full absolute inset-0">
        {/* 지도 하단 우측에 확대/축소/마커추가 버튼 */}
        <div className="absolute bottom-32 right-4 z-30 flex flex-col gap-2 items-center">
          <button onClick={handleZoomIn} className="w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center text-2xl font-bold text-black hover:bg-gray-100">+</button>
          <button onClick={handleZoomOut} className="w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center text-2xl font-bold text-black hover:bg-gray-100">-</button>
          <button
            className={`w-12 h-12 rounded-full bg-white text-white flex items-center justify-center shadow-lg hover:bg-blue-700 ${isPlacingMarker ? 'ring-4 ring-blue-200' : ''}`}
            title="추가"
            onClick={handlePlusClick}
          >
            <img src="/write.svg" alt="마커 추가" className="w-6 h-6" />
          </button>
        </div>
        
        {/* 지도 하단 좌측에 내위치 버튼 */}
        <div className="absolute bottom-32 left-4 z-30">
          <button
            onClick={handleMyLocation}
            className="w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center text-xl font-bold text-blue-600 hover:bg-blue-100"
            title="내 위치로 이동"
          >
            <img src="/gps.svg" alt="내 위치" className="w-7 h-7" />
          </button>
        </div>
        {/* 지도 상단 우측에 플러스(마커 생성) 버튼 + 내마커만보기 토글 */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {/* <button
            className={`w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 text-3xl ${isPlacingMarker ? 'ring-4 ring-blue-200' : ''}`}
            title="추가"
            onClick={handlePlusClick}
          >
            +
          </button> */}
          {/* 로그인된 경우에만 내 마커만 보기 버튼 표시 */}
          {isLoggedIn && (
            <button
              className={`px-3 py-1 rounded-full shadow text-sm font-semibold border transition-colors duration-150 ${showMyMarkers ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-500 border-blue-300 hover:bg-blue-50'}`}
              onClick={() => {
                setShowMyMarkers((prev) => {
                  const next = !prev;
                  // 토글 시 즉시 fetch
                  if (mapRef.current) {
                    const bounds = mapRef.current.getBounds();
                    fetchClusters(bounds ?? null, !prev);
                  }
                  return next;
                });
              }}
            >
              {showMyMarkers ? '내 마커만 보기 해제' : '내 마커만 보기'}
            </button>
          )}
        </div>
        {/* 검색창 */}
        <div className="absolute top-10 left-4 right-4 z-10">
          <div className="relative">
            <input
              ref={searchBoxRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="장소를 검색하세요..."
              className="w-[88%] sm:w-[90%] md:w-[95%] lg:w-[95%] px-4 py-3 pr-12 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-[15%] sm:right-[10%] md:right-[5%] lg:right-[8%] top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
            >
              <img src="/search.svg" alt="검색" className="w-5 h-5" />
            </button>
            
            {/* 검색 결과 드롭다운 */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-20">
                {searchResults.map((place, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('검색 결과 항목 클릭됨:', place.name);
                      handleSearchResultClick(place);
                    }}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{place.name}</div>
                    <div className="text-sm text-gray-500">{place.formatted_address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 필터 버튼 - 검색 전체 영역의 오른쪽에 4px 마진으로 배치 */}
          <button
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="필터"
            onClick={() => setShowFilterModal(true)}
          >
            <img src="/filter.svg" alt="필터" className="w-5 h-5" />
          </button>
        </div>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={currentCenter}
          zoom={14}
          onLoad={onMapLoad}
          onBoundsChanged={handleBoundsChanged}
          onZoomChanged={onZoomChanged}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            scaleControl: false,
            rotateControl: false,
            clickableIcons: false,
          }}
        >
          {loading && (
            <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded shadow text-sm">
              마커 로딩 중...
            </div>
          )}
          {isClusterLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {/* 위치 로딩 중 표시 */}
          {isLocationLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 pointer-events-none">
              <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-gray-600">현재 위치를 가져오는 중...</p>
              </div>
            </div>
          )}
        
        {/* 클러스터링 적용 */}
        <MarkerClusterer options={getClustererOptions()}>
          {(clusterer) => (
            <>
              {!isPlacingMarker && clusters.map((cluster) => {
                if (cluster.count === 1 && cluster.markers && cluster.markers.length > 1) {
                  // 동일 위치에 여러 마커가 겹친 경우
                  const markerGroup = cluster.markers;
                  const mainMarker = markerGroup[0];
                  const firstEmotion = getFirstEmotion(mainMarker.emotion);
                  return (
                    <>
                      <CustomMarker
                        key={cluster.h3_index}
                        position={{ lat: mainMarker.latitude, lng: mainMarker.longitude }}
                        imageUrl={mainMarker.thumbnailImg}
                        onClick={() => {
                          setSelectedMarker(mainMarker);
                          setMultiMarkers(markerGroup);
                          setMultiMarkerIndex(0);
                        }}
                      />
                      {firstEmotion && (
                        <OverlayView
                          position={{ lat: mainMarker.latitude, lng: mainMarker.longitude }}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div style={{ position: 'relative', width: 0, height: 0 }}>
                            <div style={{
                              position: 'absolute',
                              top: '5px',
                              left: '30px',
                              background: 'white',
                              color: '#8B8B8B',
                              borderRadius: '10px',
                              padding: '2px 8px',
                              fontSize: '10px',
                              fontWeight: '500',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              border: '1px solid #f0f0f0',
                              zIndex: 10,
                              pointerEvents: 'none',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              <span style={{ fontSize: '12px' }}>{firstEmotion.emoji}</span>
                              <span>{firstEmotion.name}</span>
                            </div>
                          </div>
                        </OverlayView>
                      )}
                      <OverlayView
                        position={{ lat: mainMarker.latitude, lng: mainMarker.longitude }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div style={{ position: 'relative', width: 0, height: 0 }}>
                          <div style={{
                            position: 'absolute',
                            top: '-32px',
                            right: '-16px',
                            background: 'linear-gradient(90deg, #2563eb 60%, #60a5fa 100%)',
                            color: 'white',
                            borderRadius: '9999px',
                            padding: '2px 8px',
                            fontSize: '14px',
                            fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            border: '2px solid white',
                            zIndex: 10,
                            pointerEvents: 'none',
                          }}>
                            +{markerGroup.length - 1}
                          </div>
                        </div>
                      </OverlayView>
                    </>
                  );
                } else if (cluster.count === 1 && cluster.markers && cluster.markers.length === 1) {
                  const marker = cluster.markers[0];
                  const firstEmotion = getFirstEmotion(marker.emotion);
                  return (
                   <>
                    <CustomMarker
                      key={cluster.h3_index}
                      position={{ lat: marker.latitude, lng: marker.longitude }}
                      imageUrl={marker.thumbnailImg}
                      onClick={() => setSelectedMarker(marker)}
                    />
                    {firstEmotion && (
                      <OverlayView
                        position={{ lat: marker.latitude, lng: marker.longitude }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div style={{ position: 'relative', width: 0, height: 0 }}>
                          {/* <div style={{
                            position: 'absolute',
                            top: '25px',
                            left: '30px',
                            background: 'white',
                            color: '#8B8B8B',
                            borderRadius: '10px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: '500',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid #f0f0f0',
                            zIndex: 10,
                            pointerEvents: 'none',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ fontSize: '12px' }}>{firstEmotion.emoji}</span>
                            <span>{firstEmotion.name}</span>
                          </div> */}
                        </div>
                      </OverlayView>
                    )}
                   </>
                  );
                } else {
                  return (
                    <Marker
                      key={cluster.h3_index}
                      position={{ lat: cluster.lat, lng: cluster.lng }}
                      label={{
                        text: cluster.count.toString(),
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 20 + Math.log2(cluster.count) * 8,
                        fillColor: '#4285F4',
                        fillOpacity: 0.85,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                      }}
                      onClick={() => {
                        if (mapRef.current) {
                          const zoom = mapRef.current.getZoom() ?? 14;
                          mapRef.current.setZoom(zoom + 2);
                          mapRef.current.panTo({ lat: cluster.lat, lng: cluster.lng });
                        }
                      }}
                      options={{ clickable: true, cursor: 'pointer' }}
                    />
                  );
                }
              })}

              {!isPlacingMarker && markerGroups.map((group, idx) => {
                if (!group) return null;
                const mainMarker = group[0];
                const firstEmotion = getFirstEmotion(mainMarker.emotion);
                return (
                  <>
                    <CustomMarker
                      key={mainMarker.id + '-group'}
                      position={{ lat: mainMarker.latitude, lng: mainMarker.longitude }}
                      imageUrl={mainMarker.thumbnailImg}
                      onClick={() => {
                        setMultiMarkers(group);
                        setMultiMarkerIndex(0);
                        setSelectedMarker(group[0]);
                      }}
                    />
                    {firstEmotion && (
                      <OverlayView
                        key={mainMarker.id + '-emotion'}
                        position={{ lat: mainMarker.latitude, lng: mainMarker.longitude }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div style={{ position: 'relative', width: 0, height: 0 }}>
                          <div style={{
                            position: 'absolute',
                            top: '15px',
                            left: '50px',
                            background: 'white',
                            color: '#8B8B8B',
                            borderRadius: '10px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: '500',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid #f0f0f0',
                            zIndex: 10,
                            pointerEvents: 'none',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ fontSize: '12px' }}>{firstEmotion.emoji}</span>
                            <span>{firstEmotion.name}</span>
                          </div>
                        </div>
                      </OverlayView>
                    )}
                    {group.length > 1 && (
                      <OverlayView
                        key={mainMarker.id + '-overlay'}
                        position={{ lat: mainMarker.latitude, lng: mainMarker.longitude }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div style={{ position: 'relative', width: 0, height: 0 }}>
                          <div style={{
                            position: 'absolute',
                            top: '-32px',
                            right: '-16px',
                            background: 'linear-gradient(90deg, #2563eb 60%, #60a5fa 100%)',
                            color: 'white',
                            borderRadius: '9999px',
                            padding: '2px 10px',
                            fontSize: '15px',
                            fontWeight: '700',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            border: '2px solid white',
                            zIndex: 10,
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}>
                            +{group.length - 1}
                          </div>
                        </div>
                      </OverlayView>
                    )}
                  </>
                );
              })}

              {/* markers.map Marker 렌더링 완전히 제거 */}
            </>
          )}
        </MarkerClusterer>

        {/* 좌표 찍기 마커 및 InfoWindow */}
        {placedMarker && (
          <>
            <Marker
              position={placedMarker}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(50, 50),
                anchor: new window.google.maps.Point(25, 50),
              }}
              onClick={() => setShowPlaceInfoWindow(true)}
              options={{ cursor: 'default' }}
            />
            {showPlaceInfoWindow && (
              <InfoWindow
                position={placedMarker}
                onCloseClick={() => {
                  setPlacedMarker(null);
                  setShowPlaceInfoWindow(false);
                  setIsPlacingMarker(false);
                }}
              >
                <div className="flex flex-col gap-2 text-black">
                  <div className="font-semibold">이 위치를 선택하시겠습니까?</div>
                  <div className="flex gap-2 mt-1">
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                      onClick={() => {
                        setShowPlaceModal(true);
                        setShowPlaceInfoWindow(false);
                      }}
                    >선택</button>
                    <button
                      className="px-3 py-1 rounded bg-gray-200 text-black font-semibold hover:bg-gray-300"
                      onClick={() => {
                        setPlacedMarker(null);
                        setShowPlaceInfoWindow(false);
                        setIsPlacingMarker(false);
                      }}
                    >취소</button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </>
        )}

        
        {selectedMarker && multiMarkers.length > 0 && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <button
                  className="text-lg px-2 py-1 rounded text-black hover:bg-gray-100 "
                  onClick={() => setMultiMarkerIndex(i => Math.max(0, i - 1))}
                  disabled={multiMarkerIndex === 0}
                >◀</button>
                <span className="text-sm text-gray-500">{multiMarkerIndex + 1} / {multiMarkers.length}</span>
                <button
                  className="text-lg px-2 py-1 rounded hover:bg-gray-100 text-black"
                  onClick={() => setMultiMarkerIndex(i => Math.min(multiMarkers.length - 1, i + 1))}
                  disabled={multiMarkerIndex === multiMarkers.length - 1}
                >▶</button>
              </div>
              {/* 썸네일 이미지 */}
              <div className="flex flex-col items-center gap-1 mb-2">
                {(() => {
                  const marker = multiMarkers[multiMarkerIndex];
                  const thumbnail = marker.images?.find(img => img.imageType === 'thumbnail');
                  return thumbnail ? (
                    <img
                      src={getFullImageUrl(thumbnail.imageUrl)}
                      alt="썸네일"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-blue-200 shadow-sm mb-1"
                    />
                  ) : null;
                })()}
                <div className="font-bold text-[13px] text-blue-900 leading-tight">{multiMarkers[multiMarkerIndex].author}</div>
                <div className="text-xs text-gray-400">
                  {new Date(multiMarkers[multiMarkerIndex].createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                {/* <div className="text-xs text-gray-500">
                  {new Date(multiMarkers[multiMarkerIndex].createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div> */}
              </div>
              {/* 상세 이미지 그리드 */}
              {(() => {
                const marker = multiMarkers[multiMarkerIndex];
                const detailImages = marker.images?.filter(img => img.imageType === 'detail' || img.imageType === 'gallery') || [];
                if (detailImages.length === 0) return null;
                return (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {detailImages.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={getFullImageUrl(img.imageUrl)}
                        alt={`상세이미지${idx+1}`}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                );
              })()}
              {/* 감정 표시 */}
              {multiMarkers[multiMarkerIndex].emotion && (
                <div className="mb-2">
                  <div className="text-xs text-gray-600 mb-1 font-medium">감정</div>
                  <div className="flex flex-wrap gap-1">
                    {multiMarkers[multiMarkerIndex].emotion.split(',').map((emotion, idx) => {
                      const emotionData = getFirstEmotion(emotion.trim());
                      return emotionData ? (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-medium border border-gray-200">
                          <span style={{ fontSize: '12px' }}>{emotionData.emoji}</span>
                          <span>{emotionData.name}</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {/* 감성 태그 표시 */}
              {multiMarkers[multiMarkerIndex].emotionTag && (
                <div className="mb-2">
                  <div className="text-xs text-gray-600 mb-1 font-medium">감성</div>
                  <div className="flex flex-wrap gap-1">
                    {multiMarkers[multiMarkerIndex].emotionTag.split(',').map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 text-purple-800 rounded-full text-[10px] font-medium shadow-sm border border-purple-200 hover:shadow-md transition-shadow duration-200">#{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[13px] text-gray-800 mb-1 leading-snug font-medium truncate">{multiMarkers[multiMarkerIndex].description}</p>
              <div className="flex justify-between text-[11px] text-gray-400 mt-1 mb-2">
                <span>❤️ {multiMarkers[multiMarkerIndex].likes}</span>
                <span>👁️ {multiMarkers[multiMarkerIndex].views}</span>
              </div>
              <button
                className="w-full py-1 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
                                  onClick={() => {
                  
                    // 모달 상태 초기화
                    setDetailModalOpen(true);
                    
                    // 초기 데이터 설정 (즉시 표시)
                    const marker = multiMarkers[multiMarkerIndex];
                    setDetailModalMarker(marker);
                    
                    // 이미지 배열 설정
                    const imageUrls: string[] = [];
                    if (marker.thumbnailImg) {
                      imageUrls.push(getFullImageUrl(marker.thumbnailImg) ?? '');
                    }
                    const detailImages = marker.images
                      .filter(img => img.imageType === 'detail')
                      .sort((a, b) => a.imageOrder - b.imageOrder)
                      .map(img => getFullImageUrl(img.imageUrl) ?? '');
                    imageUrls.push(...detailImages);
                    
                    setDetailModalImages(imageUrls.filter(Boolean));
                    setDetailModalIndex(multiMarkerIndex);
                    
                    // 조회수 증가 API 호출 및 최신 데이터로 업데이트
                    incrementViewCount(multiMarkers[multiMarkerIndex].id);
                  }}
              >상세보기</button>
            </div>
          </InfoWindow>
        )}
        {/* 내 위치 파란 점 마커 */}
        {myLocation && (
          <Marker
            position={myLocation}
            icon={{
              path: window.google?.maps?.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            zIndex={9999}
          />
        )}
      </GoogleMap>
      {/* 좌표 입력 모달 */}
      {showPlaceModal && placedMarker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-md relative text-black overflow-hidden max-h-[90vh] flex flex-col">
            {/* 닫기 버튼 */}
            <button 
              className="absolute top-4 right-4 z-10 text-3xl text-gray-400 hover:text-gray-700 bg-white rounded-full shadow p-2 transition-colors"
              onClick={() => {
                setShowPlaceModal(false); 
                setPlacedMarker(null);
                setIsPlacingMarker(false);
              }}
            >
              ×
            </button>
            
          
            
            {/* 폼 내용 영역 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* <h2 className="text-xl font-bold mb-4">좌표에 데이터 입력</h2>
              <div className="mb-2 text-sm text-gray-500">위도: <span className="font-mono text-blue-700 font-semibold">{placedMarker.lat}</span></div>
              <div className="mb-4 text-sm text-gray-500">경도: <span className="font-mono text-blue-700 font-semibold">{placedMarker.lng}</span></div> */}
                               {/* 썸네일 이미지 업로드 */}
                

                <div className=" mb-3 mt-6">
                <h3 className="text-[12px] font-bold text-gray-800 mb-3">지역</h3>
                  <input
                    type="text"
                    value={address}
                    readOnly
                    placeholder="주소를 불러오는 중..."
                    className="w-full h-[22px] px-3 border border-[#f0f0f0] rounded text-sm text-gray-700 bg-white"
                  />
                </div>
              
                              {/* 상세 이미지 업로드 */}
                <label className="block mb-4">
                  <span className="block text-sm font-medium text-gray-700 mb-1">이미지 업로드 (첫 번째 이미지가 썸네일로 사용됩니다)</span>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleDetailChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="w-[50px] h-[50px] border-2 border-blue-200 rounded-[5px] bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center cursor-pointer hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm">
                      <img src="/camera.svg" alt="카메라" className="w-6 h-6" style={{ filter: 'brightness(0) saturate(100%) invert(24%) sepia(94%) saturate(2476%) hue-rotate(217deg) brightness(118%) contrast(119%)' }} />
                      <span className="text-xs text-blue-600 mt-1 font-medium" style={{ fontSize: '12px' }}>{detailUrls.length}/10</span>
                    </div>
                  </div>

                  {isDetailUploading && (
                    <div className="text-xs text-blue-600 mt-1">업로딩 중...</div>
                  )}
                </label>
              
              {/* 상세 이미지 미리보기 */}
              {detailPreviews.length > 0 && (
                <div className="mb-4">
                  <span className="block text-sm font-medium text-gray-700 mb-2">상세 이미지 미리보기</span>
                  <div className="flex gap-2 flex-wrap">
                    {detailPreviews.map((src, idx) => (
                      <img key={idx} src={src} alt={`상세이미지${idx+1}`} className="w-16 h-16 object-cover rounded-lg border" />
                    ))}
                  </div>
                </div>
              )}
            

              {/* 감정 선택 */}
              <div className="mb-4">
                <span className="block text-[12px] font-bold text-[#000000] mb-1">감정 선택</span>
                
                {/* 선택된 감정들 표시 */}
                {selectedEmotions.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {selectedEmotions.map(emotionId => {
                      const emotion = emotions.find(e => e.id === emotionId);
                      return emotion ? (
                        <span key={emotionId} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          <span className="mr-1">{emotion.emoji}</span>
                          {emotion.name}
                          <button 
                            type="button" 
                            className="ml-2 text-blue-400 hover:text-blue-700" 
                            onClick={() => handleRemoveEmotion(emotionId)}
                          >
                            &times;
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )} 
                
                {/* 감정 선택 그리드 */}
                <div className="grid grid-cols-4 gap-2">
                  {emotions.map(emotion => (
                    <button
                      key={emotion.id}
                      type="button"
                      onClick={() => handleEmotionToggle(emotion.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center ${
                        selectedEmotions.includes(emotion.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-2xl mb-1">{emotion.emoji}</span>
                      <span className="text-xs font-medium">{emotion.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* 설명 입력 */}
              <span className="block text-[12px] font-bold text-[#000000] mb-1">피드 설명</span>
              <textarea
                className="w-full mb-4 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-black"
                placeholder="피드 설명을 입력해 주세요"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              {/* 감성태그 입력 */}
              <div className="mb-4">
                <span className="block text-[12px] font-bold text-[#000000] mb-1">감성태그</span>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-black"
                    placeholder="감성태그를 입력하세요 "
                    value={emotionTag}
                    onChange={e => setEmotionTag(e.target.value)}
                    onKeyDown={handleEmotionTagKeyDown}
                  />
                  <button
                    type="button"
                    onClick={handleAddEmotionTag}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    추가
                  </button>
                </div>
                {/* 입력된 태그들 표시 */}
                {emotionTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {emotionTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveEmotionTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500">엔터키를 누르거나 추가 버튼을 클릭하여 태그를 추가하세요</div>
              </div>
              
             

              {/* 공유 설정 */}
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-3">공유 설정</span>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="shareSetting"
                      value="public"
                      checked={shareSetting === 'public'}
                      onChange={(e) => setShareSetting(e.target.value as 'public' | 'friends' | 'private')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="ml-3 flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">전체공유</div>
                        <div className="text-xs text-gray-500">모든 사용자가 볼 수 있습니다</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="shareSetting"
                      value="friends"
                      checked={shareSetting === 'friends'}
                      onChange={(e) => setShareSetting(e.target.value as 'public' | 'friends' | 'private')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="ml-3 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">친구에게만 공유</div>
                        <div className="text-xs text-gray-500">친구 목록에 있는 사용자만 볼 수 있습니다</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="shareSetting"
                      value="private"
                      checked={shareSetting === 'private'}
                      onChange={(e) => setShareSetting(e.target.value as 'public' | 'friends' | 'private')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="ml-3 flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">나만 보기</div>
                        <div className="text-xs text-gray-500">나만 볼 수 있습니다</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            {/* 버튼 영역 (고정) */}
            <div className="p-6 border-t bg-white">
              {/* <div className="flex gap-3">
                <button
                  onClick={() => { setShowPlaceModal(false); setPlacedMarker(null); setIsPlacingMarker(false); }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMarker}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  저장
                </button>
              </div> */}
               <button
                  onClick={handleSaveMarker}
                  className="flex-1 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  저장완료
                </button>
            </div>
          </div>
        </div>
      )}
      {/* 상세정보 모달 */}
      {detailModalOpen && detailModalMarker && detailModalMarker.id && (() => {
        try {
          console.log('상세 모달 렌더링 시 detailModalMarker:', detailModalMarker);
          console.log('상세 모달 렌더링 시 views 값:', detailModalMarker?.views);
          return true;
        } catch (error) {
          console.error('상세 모달 렌더링 중 오류:', error);
          return false;
        }
      })() && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-blue-100">
            <button className="absolute top-4 right-4 text-3xl text-blue-400 hover:text-blue-700 z-10 bg-white rounded-full shadow p-2 transition" onClick={() => setDetailModalOpen(false)}>&times;</button>
            
            {/* 네비게이션 컨트롤 - 여러 마커가 있을 때만 표시 */}
            {multiMarkers.length > 1 && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white rounded-full shadow p-2">
                <button
                  className="text-lg px-2 py-1 rounded text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    const newIndex = Math.max(0, detailModalIndex - 1);
                    setDetailModalIndex(newIndex);
                    setDetailModalMarker(multiMarkers[newIndex]);
                  }}
                  disabled={detailModalIndex === 0}
                >
                  ◀
                </button>
                <span className="text-sm text-gray-500 px-2">
                  {detailModalIndex + 1} / {multiMarkers.length}
                </span>
                <button
                  className="text-lg px-2 py-1 rounded hover:bg-gray-100 text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    const newIndex = Math.min(multiMarkers.length - 1, detailModalIndex + 1);
                    setDetailModalIndex(newIndex);
                    setDetailModalMarker(multiMarkers[newIndex]);
                  }}
                  disabled={detailModalIndex === multiMarkers.length - 1}
                >
                  ▶
                </button>
              </div>
            )}
            {/* 이미지 섹션 */}
            <div className="bg-gradient-to-b from-blue-50 to-white p-6">
              {/* 썸네일 이미지 */}
              {(() => {
                const thumbnail = detailModalMarker.images?.find(img => img.imageType === 'thumbnail');
                return thumbnail ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center">썸네일</h3>
                    <div className="flex justify-center">
                      <img
                        src={getFullImageUrl(thumbnail.imageUrl)}
                        alt="썸네일"
                        className="max-h-64 max-w-full rounded-2xl object-contain shadow-lg border-2 border-blue-100"
                      />
                    </div>
                  </div>
                ) : null;
              })()}
              
              {/* 상세 이미지 그리드 */}
              {(() => {
                const detailImages = detailModalMarker.images?.filter(img => img.imageType === 'detail' || img.imageType === 'gallery') || [];
                if (detailImages.length === 0) return null;
                return (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center">상세 이미지</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {detailImages.slice(0, 6).map((img, idx) => (
                        <div key={idx} className="aspect-square">
                          <img
                            src={getFullImageUrl(img.imageUrl)}
                            alt={`상세이미지${idx+1}`}
                            className="w-full h-full object-cover rounded-xl shadow-md border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* 정보 카드 */}
            <div className="p-6 flex flex-col gap-3 border-t border-blue-100 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-lg text-blue-700 flex items-center gap-1">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {detailModalMarker?.author}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(detailModalMarker?.createdAt || '').toLocaleDateString()}
                </span>
              </div>
              {/* 사용자 입력 감성태그 표시 */}
              {detailModalMarker?.emotionTag && detailModalMarker.emotionTag.split(',').length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    감성태그
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {detailModalMarker.emotionTag.split(',').map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-200 via-blue-100 to-yellow-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm border border-blue-200">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 선택된 감정들 표시 */}
              {detailModalMarker?.emotion && detailModalMarker.emotion.split(',').length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    선택된 감정
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {detailModalMarker.emotion.split(',').map((emotionId, idx) => {
                      const emotion = emotions.find(e => e.id === emotionId.trim());
                      return emotion ? (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-semibold shadow-sm border border-purple-200">
                          <span className="text-base">{emotion.emoji}</span>
                          <span>{emotion.name}</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              <div className="text-lg text-gray-800 mb-2 whitespace-pre-line font-medium leading-relaxed">
                {detailModalMarker?.description}
              </div>
              <div className="flex gap-6 text-gray-500 text-base mt-2 border-t border-blue-50 pt-3">
                {/* YouTube 스타일 좋아요 버튼 */}
                <button
                  onClick={() => handleLikeToggle(detailModalMarker?.id || 0)}
                  disabled={likeLoading.has(detailModalMarker?.id || 0)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {likeLoading.has(detailModalMarker?.id || 0) ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg 
                      className={`w-5 h-5 transition-all duration-200 ${
                        detailModalMarker?.isLiked 
                          ? 'fill-red-500 text-red-500 scale-110' 
                          : 'stroke-current fill-none text-gray-700'
                      }`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  )}
                  <span className="font-semibold">{detailModalMarker?.likes || 0}</span>
                </button>
                
                {/* 조회수 표시 */}
                <span className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold">
                    {detailModalMarker?.views || 0}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 모달 */}
            {showFilterModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowFilterModal(false);
                  }
                }}
              >
            <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">마커 필터</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 필터 내용 */}
            <div className="p-6 space-y-6">
              {/* 감정 필터 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">감정 선택</h3>
                <div className="grid grid-cols-4 gap-2">
                  {emotions.map((emotion) => (
                    <button
                      key={emotion.id}
                      onClick={() => handleFilterEmotionToggle(emotion.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        filterSettings.selectedEmotions.includes(emotion.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{emotion.emoji}</div>
                      <div className="text-xs font-medium">{emotion.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 날짜 범위 필터 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">날짜 범위</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                    <input
                      type="date"
                      value={filterSettings.dateRange.start}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                    <input
                      type="date"
                      value={filterSettings.dateRange.end}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                </div>
              </div>

              {/* 좋아요 범위 필터 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">좋아요 수 범위</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">최소</label>
                    <input
                      type="number"
                      min="0"
                      value={filterSettings.likesRange.min}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        likesRange: { ...prev.likesRange, min: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">최대</label>
                    <input
                      type="number"
                      min="0"
                      value={filterSettings.likesRange.max}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        likesRange: { ...prev.likesRange, max: parseInt(e.target.value) || 1000 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                </div>
              </div>

              {/* 조회수 범위 필터 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">조회수 범위</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">최소</label>
                    <input
                      type="number"
                      min="0"
                      value={filterSettings.viewsRange.min}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        viewsRange: { ...prev.viewsRange, min: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">최대</label>
                    <input
                      type="number"
                      min="0"
                      value={filterSettings.viewsRange.max}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        viewsRange: { ...prev.viewsRange, max: parseInt(e.target.value) || 1000 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                </div>
              </div>

              {/* 텍스트 검색 필터 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">텍스트 검색</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작성자</label>
                    <input
                      type="text"
                      value={filterSettings.authorFilter}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        authorFilter: e.target.value
                      }))}
                      placeholder="작성자 이름으로 검색"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <input
                      type="text"
                      value={filterSettings.descriptionFilter}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        descriptionFilter: e.target.value
                      }))}
                      placeholder="설명 내용으로 검색"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">감성태그</label>
                    <input
                      type="text"
                      value={filterSettings.emotionTagFilter}
                      onChange={(e) => setFilterSettings(prev => ({
                        ...prev,
                        emotionTagFilter: e.target.value
                      }))}
                      placeholder="감성태그로 검색"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 정렬 옵션 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">정렬</h3>
                <select
                  value={filterSettings.sortBy}
                  onChange={(e) => setFilterSettings(prev => ({
                    ...prev,
                    sortBy: e.target.value as 'latest' | 'oldest' | 'likes' | 'views' | 'popular'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="latest" className="text-black">최신순</option>
                  <option value="oldest" className="text-black">오래된순</option>
                  <option value="likes" className="text-black">좋아요순</option>
                  <option value="views" className="text-black">조회수순</option>
                  <option value="popular" className="text-black">인기순</option>
                </select>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                필터 초기화
              </button>
              <button
                onClick={() => {
                  applyFilters();
                  setShowFilterModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                필터 적용
              </button>
            </div>
          </div>
        </div>
      )}
     
      </div>
  );
} 