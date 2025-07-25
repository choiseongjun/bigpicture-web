'use client';

import { GoogleMap, LoadScript, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
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

        const response = await apiClient.get(`/markers?lat=${lat}&lng=${lng}&lat_delta=${lat_delta}&lng_delta=${lng_delta}&limit=200`);
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

  const onBoundsChanged = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        fetchMarkers(bounds);
      }
    }
  }, [fetchMarkers]);

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

  // 클러스터링 적용
  // useEffect(() => {
  //   console.log('클러스터링 조건 확인:', {
  //     mapLoaded,
  //     markerCount: markerRefs.current.length,
  //     markersLength: markers.length,
  //     hasGoogleMaps: !!window.google?.maps,
  //     currentZoom
  //   });
    
  //   if (mapLoaded && markers.length > 0 && window.google?.maps && currentZoom < 10) {
  //     console.log('클러스터링 적용 중...');
      
  //     // 기존 클러스터러 제거
  //     if (clustererRef.current) {
  //       clustererRef.current.clearMarkers();
  //     }

  //     // 새로운 클러스터러 생성
  //     clustererRef.current = new MarkerClusterer({
  //       map: mapRef.current!,
  //       markers: markerRefs.current,
  //       renderer: {
  //         render: ({ count, position }) => {
  //           const clusterMarker = new window.google.maps.Marker({
  //             position,
  //             label: {
  //               text: count.toString(),
  //               color: 'white',
  //               fontSize: '14px',
  //               fontWeight: 'bold',
  //             },
  //             icon: {
  //               path: window.google.maps.SymbolPath.CIRCLE,
  //               scale: 20,
  //               fillColor: '#4285F4',
  //               fillOpacity: 0.8,
  //               strokeColor: '#ffffff',
  //               strokeWeight: 2,
  //             },
  //           });
  //           return clusterMarker;
  //         },
  //       },
  //     });
  //     console.log('클러스터링 완료');
  //   } else if (clustererRef.current && currentZoom >= 10) {
  //     // 줌 레벨이 높으면 클러스터링 제거
  //     clustererRef.current.clearMarkers();
  //     clustererRef.current = null;
  //   }
  // }, [mapLoaded, markers.length, currentZoom]);

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
    
    // 이미지 크기를 50x50으로 고정
    const size = 50;
    const anchor = size / 2;
    
    const iconConfig = {
      url: fullImageUrl,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(anchor, anchor),
    };
    
    console.log('아이콘 설정:', iconConfig);
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
    // 지도 커서를 십자 모양으로 변경
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

  // InfoWindow에서 이미지 클릭 시 뷰어 오픈
  const handleMarkerImageClick = (marker: MarkerData) => {
    const images: string[] = [];
    if (marker.thumbnailImg) images.push(getFullImageUrl(marker.thumbnailImg) ?? '');
    // 상세이미지(추가 구현 필요: marker.detailImages 등)
    if ((marker as any).detailImages && Array.isArray((marker as any).detailImages)) {
      (marker as any).detailImages.forEach((img: string) => images.push(getFullImageUrl(img) ?? ''));
    }
    setImageViewerImages(images.filter(Boolean));
    setImageViewerIndex(0);
    setImageViewerOpen(true);
  };

  return (
    <LoadScript 
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={['places']}
    >
      <div className="w-full h-full absolute inset-0">
        {/* 지도 위 필터 바 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white rounded-full shadow px-4 py-2 border border-gray-200">
          <button className="text-sm font-medium text-blue-600 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">전체</button>
          <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">감정</button>
          <button className="text-sm font-medium text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">카테고리</button>
        </div>
        {/* 지도 오른쪽 위 플러스 버튼 */}
        <button
          className={`absolute top-4 right-20 z-20 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 text-3xl ${isPlacingMarker ? 'ring-4 ring-blue-200' : ''}`}
          title="추가"
          onClick={handlePlusClick}
        >
          +
        </button>
        {/* 지도 하단 확대/축소/내위치 버튼 */}
        <div className="absolute bottom-32 right-4 z-30 flex flex-col gap-2 items-center">
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
          onBoundsChanged={onBoundsChanged}
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
        
        {/* 클러스터링 적용 */}
        <MarkerClusterer options={{ styles: clusterStyles }}>
          {(clusterer) => (
            <>
              {markers.map((marker, index) => {
                const icon = createCustomMarkerIcon(marker.thumbnailImg);
                return (
                  <Marker
                    key={`${marker.id}-${index}`}
                    position={{ lat: marker.latitude, lng: marker.longitude }}
                    icon={icon}
                    clusterer={clusterer}
                    onClick={() => setSelectedMarker(marker)}
                  />
                );
              })}
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
                      }}
                    >취소</button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </>
        )}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={getFullImageUrl(selectedMarker.thumbnailImg)}
                  alt="썸네일"
                  className="w-12 h-12 rounded-full object-cover cursor-pointer border-2 border-blue-400 hover:scale-105 transition"
                  onClick={() => handleMarkerImageClick(selectedMarker)}
                />
                <div>
                  <div className="font-semibold text-sm">{selectedMarker.author}</div>
                  <div className="text-2xl">{selectedMarker.emotionTag}</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">{selectedMarker.description}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>❤️ {selectedMarker.likes}</span>
                <span>👁️ {selectedMarker.views}</span>
                <span>{new Date(selectedMarker.createdAt).toLocaleDateString()}</span>
              </div>
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
                  onClick={() => { setShowPlaceModal(false); setPlacedMarker(null); }}
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
      {/* 이미지 뷰어 모달 */}
      {imageViewerOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 flex flex-col">
            <button className="absolute top-2 right-2 text-3xl text-gray-400 hover:text-gray-700 z-10" onClick={() => setImageViewerOpen(false)}>&times;</button>
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              {imageViewerImages.length > 0 && (
                <img
                  src={imageViewerImages[imageViewerIndex]}
                  alt={`미리보기${imageViewerIndex+1}`}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg border mb-4"
                />
              )}
              {/* 썸네일/상세 이미지 썸네일 리스트 */}
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                {imageViewerImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`썸네일${idx+1}`}
                    className={`w-16 h-16 object-cover rounded-lg border cursor-pointer ${imageViewerIndex===idx ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setImageViewerIndex(idx)}
                  />
                ))}
              </div>
              {/* 좌우 이동 버튼 */}
              {imageViewerImages.length > 1 && (
                <div className="flex gap-4 mt-4 justify-center">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded-full text-lg font-bold hover:bg-gray-300"
                    onClick={() => setImageViewerIndex((prev) => prev === 0 ? imageViewerImages.length-1 : prev-1)}
                  >&lt;</button>
                  <button
                    className="px-4 py-2 bg-gray-200 rounded-full text-lg font-bold hover:bg-gray-300"
                    onClick={() => setImageViewerIndex((prev) => prev === imageViewerImages.length-1 ? 0 : prev+1)}
                  >&gt;</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </LoadScript>
  );
} 