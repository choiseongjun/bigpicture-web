'use client';

import { GoogleMap, Marker, InfoWindow, MarkerClusterer, OverlayView } from '@react-google-maps/api';
import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import apiClient from './lib/apiClient';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: 37.5665,
  lng: 126.9780,
};

interface MarkerData {
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
  const [emotionInput, setEmotionInput] = useState('');
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
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

  // 감성태그 입력 핸들러
  const handleEmotionInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emotionInput.trim()) {
      e.preventDefault();
      if (!emotionTags.includes(emotionInput.trim())) {
        setEmotionTags([...emotionTags, emotionInput.trim()]);
      }
      setEmotionInput('');
    }
  };
  const handleEmotionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmotionInput(e.target.value);
  };
  const handleRemoveEmotionTag = (tag: string) => {
    setEmotionTags(emotionTags.filter(t => t !== tag));
  };

  // 저장 버튼 클릭 핸들러
  const handleSaveMarker = async () => {
    if (!placedMarker) return;
    if (!description.trim()) {
      alert('설명을 입력하세요.');
      return;
    }
    if (emotionTags.length === 0) {
      alert('감성태그를 1개 이상 입력하세요.');
      return;
    }
    if (!thumbnailUrl) {
      alert('썸네일 이미지를 업로드하세요.');
      return;
    }
    const latitude = placedMarker.lat;
    const longitude = placedMarker.lng;
    const thumbnailImage = thumbnailUrl;
    const selectedImages = detailUrls;
    const markerData = {
      latitude: latitude,
      longitude: longitude,
      emotion_tag: emotionTags.join(','), // 문자열로 전송
      description: description.trim(),
      thumbnail_img: thumbnailImage.replace('https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com', ''),
      images: [
        {
          image_url: thumbnailImage.replace('https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com', ''),
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
      setEmotionTags([]);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setThumbnailUrl(null);
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
    
    // 기존 파일들과 새 파일들을 합침
    const allFiles = [...detailFiles, ...newFiles];
    setDetailFiles(allFiles);
    
    // 기존 미리보기와 새 미리보기를 합침
    const newPreviews = await Promise.all(newFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
    }));
    setDetailPreviews([...detailPreviews, ...newPreviews]);
    
    // 새 파일들만 업로드
    setIsDetailUploading(true);
    try {
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await apiClient.post('/s3/upload/normal', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const fullS3Url = `https://bigpicture-jun-dev.s3.ap-northeast-2.amazonaws.com${res.data.s3_url}`;
        return fullS3Url;
      });
      const newUrls = await Promise.all(uploadPromises);
      setDetailUrls([...detailUrls, ...newUrls]);
    } catch (err) {
      alert('상세 이미지 업로드 실패');
      // 실패한 경우 새로 추가된 파일들만 제거
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
    
    // 줌 레벨에 따라 마커 크기 조정
    let size = 50; // 기본 크기
    if (currentZoom <= 8) {
      size = 80; // 매우 축소된 상태에서는 큰 마커
    } else if (currentZoom <= 10) {
      size = 65; // 축소된 상태에서는 중간 크기 마커
    } else if (currentZoom <= 12) {
      size = 55; // 보통 상태에서는 약간 큰 마커
    } else {
      size = 45; // 확대된 상태에서는 작은 마커
    }
    
    const anchor = size / 2;
    
    const iconConfig = {
      url: fullImageUrl,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(anchor, anchor),
    };
    
    console.log('아이콘 설정 (줌 레벨:', currentZoom, '크기:', size, '):', iconConfig);
    return iconConfig;
  }, [currentZoom]);

  const onMapLoad = (map: google.maps.Map) => {
    console.log('=== 맵 로드 완료 ===');
    console.log('지도 객체:', map);
    console.log('지도 중심:', map.getCenter());
    console.log('지도 줌:', map.getZoom());
    
    mapRef.current = map;
    setMapLoaded(true);
    
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

  // 플러스 버튼 클릭 핸들러
  const handlePlusClick = () => {
    setIsPlacingMarker(true);
    setPlacedMarker(null);
    setShowPlaceModal(false);
    setShowPlaceInfoWindow(false);
    setDescription('');
    setEmotionTags([]);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailUrl(null);
    setDetailFiles([]);
    setDetailPreviews([]);
    setDetailUrls([]);
    if (mapRef.current) {
      mapRef.current.setOptions({ draggableCursor: 'crosshair' });
    }
  };

  // 지도 클릭 핸들러
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (isPlacingMarker && e.latLng) {
      setPlacedMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
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

  // InfoWindow에서 이미지 클릭 시 상세정보 모달 오픈
  const handleMarkerImageClick = (marker: MarkerData) => {
    const images: string[] = [];
    // 썸네일 이미지 추가
    if (marker.thumbnailImg) images.push(getFullImageUrl(marker.thumbnailImg) ?? '');
    // 상세이미지들 추가 (marker.images 배열에서 detail 타입만)
    if ((marker as any).images && Array.isArray((marker as any).images)) {
      const detailImages = (marker as any).images
        .filter((img: any) => img.imageType === 'detail')
        .sort((a: any, b: any) => a.imageOrder - b.imageOrder)
        .map((img: any) => getFullImageUrl(img.imageUrl) ?? '');
      images.push(...detailImages);
    }
    setDetailModalMarker(marker);
    setDetailModalImages(images.filter(Boolean));
    setDetailModalIndex(0);
    setDetailModalOpen(true);
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
    const used = new Array(markers.length).fill(false);
    for (let i = 0; i < markers.length; i++) {
      if (used[i]) continue;
      const group = [markers[i]];
      used[i] = true;
      for (let j = i + 1; j < markers.length; j++) {
        if (used[j]) continue;
        const d = getDistanceFromLatLonInMeters(
          markers[i].latitude,
          markers[i].longitude,
          markers[j].latitude,
          markers[j].longitude
        );
        if (d <= threshold) {
          group.push(markers[j]);
          used[j] = true;
        }
      }
      groups.push(group);
    }
    return groups;
  }

  // 모든 마커를 1차원 배열로 추출 후 그룹핑
  const allMarkers = clusters.flatMap(cluster => cluster.markers || []);
  const markerGroups = groupMarkersByDistance(allMarkers, 20);

  // markerGroups 생성 직후
  console.log('markerGroups:', markerGroups);

  return (
    <div className="w-full h-full absolute inset-0">
        {/* 지도 위 필터 바 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white rounded-full shadow px-4 py-2 border border-gray-200">
          <button className="text-sm font-medium text-blue-600 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">전체</button>
          <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">감정</button>
          <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">카테고리</button>
        </div>
        {/* 지도 하단 확대/축소/내위치 버튼 */}
        <div className="absolute bottom-32 right-4 z-30 flex flex-col gap-2 items-center">
        <button
            className={`w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 text-3xl ${isPlacingMarker ? 'ring-4 ring-blue-200' : ''}`}
            title="추가"
            onClick={handlePlusClick}
          >
            +
          </button>
          <button onClick={handleZoomIn} className="w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center text-2xl font-bold text-black hover:bg-gray-100">+</button>
          <button onClick={handleZoomOut} className="w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center text-2xl font-bold text-black hover:bg-gray-100">-</button>
          <button
            onClick={handleMyLocation}
            className="w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center text-xl font-bold text-blue-600 hover:bg-blue-100"
            title="내 위치로 이동"
          >
            {/* SVG 아이콘만 표시 */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="4" fill="#2563eb" />
              <path stroke="#2563eb" strokeWidth="2" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M6.34 17.66l-1.41 1.41m12.02 0l-1.41-1.41M6.34 6.34L4.93 4.93" />
            </svg>
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
        </div>
        {/* 검색창 */}
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="relative">
            <input
              ref={searchBoxRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="장소를 검색하세요..."
              className="w-full px-4 py-3 pr-12 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
            >
              🔍
            </button>
            
            {/* 테스트 버튼 - 지도 이동 테스트용 */}
            {/* <button
              onClick={() => {
                if (mapRef.current) {
                  console.log('테스트: 서울로 이동');
                  mapRef.current.panTo({ lat: 37.5665, lng: 126.9780 });
                  mapRef.current.setZoom(15);
                }
              }}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 text-xs"
            >
              테스트
            </button> */}
            
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
        </div>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
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
        
        {/* 클러스터링 적용 */}
        <MarkerClusterer options={getClustererOptions()}>
          {(clusterer) => (
            <>
              {!isPlacingMarker && clusters.map((cluster) => {
                if (cluster.count === 1 && cluster.markers && cluster.markers.length > 1) {
                  // 동일 위치에 여러 마커가 겹친 경우
                  const markerGroup = cluster.markers;
                  const mainMarker = markerGroup[0];
                  const icon = createCustomMarkerIcon(mainMarker.thumbnailImg);
                  return (
                    <>
                      <Marker
                        key={cluster.h3_index}
                        position={{ lat: mainMarker.latitude, lng: mainMarker.longitude }}
                        icon={icon}
                        onClick={() => {
                          setSelectedMarker(mainMarker);
                          setMultiMarkers(markerGroup);
                          setMultiMarkerIndex(0);
                        }}
                        options={{ clickable: true, cursor: 'pointer' }}
                      />
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
                  const icon = createCustomMarkerIcon(marker.thumbnailImg);
                  return (
                    <Marker
                      key={cluster.h3_index}
                      position={{ lat: marker.latitude, lng: marker.longitude }}
                      icon={icon}
                      onClick={() => setSelectedMarker(marker)}
                      options={{ clickable: true, cursor: 'pointer' }}
                    />
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
                const icon = {
                  url: getFullImageUrl(mainMarker.thumbnailImg) || 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(48, 48) : undefined,
                  anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(24, 48) : undefined,
                };
                return (
                  <>
                    <Marker
                      key={mainMarker.id + '-group'}
                      position={{ lat: mainMarker.latitude, lng: mainMarker.longitude }}
                      icon={icon}
                      onClick={() => {
                        setMultiMarkers(group);
                        setMultiMarkerIndex(0);
                        setSelectedMarker(group[0]);
                      }}
                      options={{ clickable: true, cursor: 'pointer' }}
                    />
                    {group.length > 1 && (
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
                            padding: '2px 10px',
                            fontSize: '15px',
                            fontWeight: 700,
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

        {/* {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex gap-2 mb-2 items-start">
                <div className="flex flex-col items-center gap-1">
                  <img 
                    src={getFullImageUrl(selectedMarker.thumbnailImg)}
                    alt="썸네일"
                    className="w-12 h-12 rounded-xl object-cover cursor-pointer border-2 border-blue-200 hover:brightness-90 hover:scale-105 transition duration-150 shadow-sm"
                    onClick={() => handleMarkerImageClick(selectedMarker)}
                  />
                  <button
                    className="mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[11px] flex items-center gap-1 shadow-sm hover:bg-blue-200 transition border border-blue-200"
                    onClick={e => { e.stopPropagation(); handleMarkerImageClick(selectedMarker); }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    상세
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] text-blue-900 leading-tight mb-0.5">{selectedMarker.author}</div>
                  <div className="flex flex-wrap gap-1 mb-0.5">
                    {selectedMarker.emotionTag && selectedMarker.emotionTag.split(',').map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-pink-100 via-blue-50 to-yellow-100 text-blue-700 rounded-full text-[11px] font-semibold shadow border border-blue-100">#{tag}</span>
                    ))}
                  </div>
                  <p className="text-[13px] text-gray-800 mb-1 leading-snug font-medium truncate">{selectedMarker.description}</p>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>❤️ {selectedMarker.likes}</span>
                <span>👁️ {selectedMarker.views}</span>
                <span>{new Date(selectedMarker.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </InfoWindow>
        )} */}
        {selectedMarker && multiMarkers.length > 0 && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <button
                  className="text-lg px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
                  onClick={() => setMultiMarkerIndex(i => Math.max(0, i - 1))}
                  disabled={multiMarkerIndex === 0}
                >◀</button>
                <span className="text-sm text-gray-500">{multiMarkerIndex + 1} / {multiMarkers.length}</span>
                <button
                  className="text-lg px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
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
                <div className="text-xs text-gray-400">{new Date(multiMarkers[multiMarkerIndex].createdAt).toLocaleDateString()}</div>
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
              <div className="flex flex-wrap gap-1 mb-1">
                {multiMarkers[multiMarkerIndex].emotionTag && multiMarkers[multiMarkerIndex].emotionTag.split(',').map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-pink-100 via-blue-50 to-yellow-100 text-blue-700 rounded-full text-[11px] font-semibold shadow border border-blue-100">#{tag}</span>
                ))}
              </div>
              <p className="text-[13px] text-gray-800 mb-1 leading-snug font-medium truncate">{multiMarkers[multiMarkerIndex].description}</p>
              <div className="flex justify-between text-[11px] text-gray-400 mt-1 mb-2">
                <span>❤️ {multiMarkers[multiMarkerIndex].likes}</span>
                <span>👁️ {multiMarkers[multiMarkerIndex].views}</span>
              </div>
              <button
                className="w-full py-1 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
                onClick={() => {
                  setDetailModalMarker(multiMarkers[multiMarkerIndex]);
                  setDetailModalOpen(true);
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
            {/* 썸네일 미리보기 영역 */}
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="썸네일 미리보기" className="object-cover w-full h-full" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }} />
              ) : (
                <span className="text-gray-400">썸네일 미리보기</span>
              )}
            </div>
            
            {/* 폼 내용 영역 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">좌표에 데이터 입력</h2>
              <div className="mb-2 text-sm text-gray-500">위도: <span className="font-mono text-blue-700 font-semibold">{placedMarker.lat}</span></div>
              <div className="mb-4 text-sm text-gray-500">경도: <span className="font-mono text-blue-700 font-semibold">{placedMarker.lng}</span></div>

              {/* 설명 입력 */}
              <textarea
                className="w-full mb-4 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-black"
                placeholder="설명"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />

              {/* 감성태그 입력 */}
              <div className="mb-4">
                <div className="flex gap-2 flex-wrap mb-2">
                  {emotionTags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mr-2 mb-2">
                      {tag}
                      <button type="button" className="ml-2 text-blue-400 hover:text-blue-700" onClick={() => handleRemoveEmotionTag(tag)}>&times;</button>
                    </span>
                  ))}
                </div>
                <input
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-black"
                  placeholder="감성태그 입력 후 엔터 (예: 재미, 흥미, 열정)"
                  value={emotionInput}
                  onChange={handleEmotionInputChange}
                  onKeyDown={handleEmotionInputKeyDown}
                />
              </div>
              
              {/* 썸네일 이미지 업로드 */}
              <label className="block mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-1">썸네일 이미지 (1장)</span>
                <input type="file" accept="image/*" onChange={handleThumbnailChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {thumbnailUrl && (
                  <div className="text-xs text-green-600 mt-1">업로드 완료</div>
                )}
                {isThumbnailUploading && (
                  <div className="text-xs text-blue-600 mt-1">업로딩 중...</div>
                )}
              </label>
              
              {/* 상세 이미지 업로드 */}
              <label className="block mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-1">상세 이미지 (여러 장)</span>
                <input type="file" accept="image/*" multiple onChange={handleDetailChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {detailUrls.length > 0 && (
                  <div className="text-xs text-green-600 mt-1">{detailUrls.length}장 업로드 완료</div>
                )}
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
            </div>
            
            {/* 버튼 영역 (고정) */}
            <div className="p-6 border-t bg-white">
              <div className="flex gap-3">
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
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 상세정보 모달 */}
      {detailModalOpen && detailModalMarker && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-blue-100">
            <button className="absolute top-4 right-4 text-3xl text-blue-400 hover:text-blue-700 z-10 bg-white rounded-full shadow p-2 transition" onClick={() => setDetailModalOpen(false)}>&times;</button>
            {/* 이미지 섹션 */}
            <div className="bg-gradient-to-b from-blue-50 to-white p-6">
              {/* 썸네일 이미지 */}
              {detailModalImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center">썸네일</h3>
                  <div className="flex justify-center">
                    <img
                      src={detailModalImages[0]}
                      alt="썸네일"
                      className="max-h-64 max-w-full rounded-2xl object-contain shadow-lg border-2 border-blue-100"
                    />
                  </div>
                </div>
              )}
              
              {/* 상세 이미지 그리드 */}
              {detailModalImages.length >= 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center">상세 이미지</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {detailModalImages.slice(1, 4).map((img, idx) => (
                      <div key={idx} className="aspect-square">
                        <img
                          src={img}
                          alt={`상세이미지${idx+1}`}
                          className="w-full h-full object-cover rounded-xl shadow-md border border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* 정보 카드 */}
            <div className="p-6 flex flex-col gap-3 border-t border-blue-100 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-lg text-blue-700 flex items-center gap-1">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {detailModalMarker.author}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(detailModalMarker.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                {/* 감성태그 chip */}
                {detailModalMarker.emotionTag && detailModalMarker.emotionTag.split(',').map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-200 via-blue-100 to-yellow-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm border border-blue-200 mr-2 mb-2">#{tag}</span>
                ))}
              </div>
              <div className="text-lg text-gray-800 mb-2 whitespace-pre-line font-medium leading-relaxed">
                {detailModalMarker.description}
              </div>
              <div className="flex gap-6 text-gray-500 text-base mt-2 border-t border-blue-50 pt-3">
                <span className="flex items-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15a7 7 0 0014 0M12 10v4m0 0h4m-4 0H8" /></svg> {detailModalMarker.likes}</span>
                <span className="flex items-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {detailModalMarker.views}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {multiMarkers.length >= 0 && detailModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-blue-100">
            <button className="absolute top-4 right-4 text-3xl text-blue-400 hover:text-blue-700 z-10 bg-white rounded-full shadow p-2 transition" onClick={() => setDetailModalOpen(false)}>&times;</button>
            {/* 이미지 섹션 */}
            <div className="bg-gradient-to-b from-blue-50 to-white p-6">
              {/* 썸네일 이미지 */}
              {detailModalImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center">썸네일</h3>
                  <div className="flex justify-center">
                    <img
                      src={detailModalImages[0]}
                      alt="썸네일"
                      className="max-h-64 max-w-full rounded-2xl object-contain shadow-lg border-2 border-blue-100"
                    />
                  </div>
                </div>
              )}
              
              {/* 상세 이미지 그리드 */}
              {detailModalImages.length >= 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center">상세 이미지</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {detailModalImages.slice(1, 4).map((img, idx) => (
                      <div key={idx} className="aspect-square">
                        <img
                          src={img}
                          alt={`상세이미지${idx+1}`}
                          className="w-full h-full object-cover rounded-xl shadow-md border border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* 정보 카드 */}
            <div className="p-6 flex flex-col gap-3 border-t border-blue-100 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-lg text-blue-700 flex items-center gap-1">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {multiMarkers[multiMarkerIndex].author}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(multiMarkers[multiMarkerIndex].createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                {/* 감성태그 chip */}
                {multiMarkers[multiMarkerIndex].emotionTag && multiMarkers[multiMarkerIndex].emotionTag.split(',').map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-pink-200 via-blue-100 to-yellow-100 text-blue-700 rounded-full text-sm font-semibold shadow-sm border border-blue-200 mr-2 mb-2">#{tag}</span>
                ))}
              </div>
              <div className="text-lg text-gray-800 mb-2 whitespace-pre-line font-medium leading-relaxed">
                {multiMarkers[multiMarkerIndex].description}
              </div>
              <div className="flex gap-6 text-gray-500 text-base mt-2 border-t border-blue-50 pt-3">
                <span className="flex items-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15a7 7 0 0014 0M12 10v4m0 0h4m-4 0H8" /></svg> {multiMarkers[multiMarkerIndex].likes}</span>
                <span className="flex items-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {multiMarkers[multiMarkerIndex].views}</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                className="text-lg px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
                onClick={() => {
                  setMultiMarkerIndex(i => {
                    const newIndex = Math.max(0, i - 1);
                    setSelectedMarker(multiMarkers[newIndex]);
                    return newIndex;
                  });
                }}
                disabled={multiMarkerIndex === 0}
              >◀4536436545</button>
              <span className="text-sm text-gray-500">{multiMarkerIndex + 1} / {multiMarkers.length}</span>
              <button
                className="text-lg px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-30"
                onClick={() => {
                  setMultiMarkerIndex(i => {
                    const newIndex = Math.min(multiMarkers.length - 1, i + 1);
                    setSelectedMarker(multiMarkers[newIndex]);
                    return newIndex;
                  });
                }}
                disabled={multiMarkerIndex === multiMarkers.length - 1}
              >▶1213123</button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
} 