'use client';

import { GoogleMap, LoadScript, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useState, useEffect, useRef, useCallback } from 'react';

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

        const url = `http://localhost:5500/api/markers?lat=${lat}&lng=${lng}&lat_delta=${lat_delta}&lng_delta=${lng_delta}&limit=150`;
        console.log('API URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
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

  // 검색 기능
  const handleSearch = useCallback(async () => {
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
        } else {
          console.log('검색 결과 없음:', status);
          setSearchResults([]);
          setShowSearchResults(false);
        }
      });
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    }
  }, [searchQuery]);

  const handleSearchResultClick = useCallback((place: google.maps.places.PlaceResult) => {
    console.log('=== 검색 결과 클릭 시작 ===');
    console.log('클릭된 장소:', place);
    console.log('지도 참조 존재:', !!mapRef.current);
    console.log('위치 정보 존재:', !!place.geometry?.location);
    
    if (!mapRef.current) {
      console.error('지도가 로드되지 않음');
      return;
    }
    
    if (!place.geometry?.location) {
      console.error('위치 정보가 없음');
      return;
    }
    
    const location = place.geometry.location;
    const lat = location.lat();
    const lng = location.lng();
    
    console.log('이동할 위치:', { lat, lng });
    console.log('현재 지도 중심:', mapRef.current.getCenter());
    console.log('현재 줌 레벨:', mapRef.current.getZoom());
    
    try {
      // 지도 이동 - 여러 방법 시도
      console.log('지도 이동 시작...');
      
      // 방법 1: setCenter 사용
      mapRef.current.setCenter(location);
      console.log('setCenter 완료');
      
      // 방법 2: panTo 사용
      mapRef.current.panTo(location);
      console.log('panTo 완료');
      
      // 줌 조정
      mapRef.current.setZoom(15);
      console.log('setZoom 완료');
      
      // 검색 결과 숨기기 및 검색창 업데이트
      setShowSearchResults(false);
      setSearchQuery(place.name || '');
      
      console.log('=== 지도 이동 완료 ===');
    } catch (error) {
      console.error('지도 이동 중 오류:', error);
    }
  }, []);

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

  // 지도 클릭 핸들러
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (isPlacingMarker && e.latLng) {
      setPlacedMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      setShowPlaceInfoWindow(true);
      setIsPlacingMarker(false);
    }
  };

  // 플러스 버튼 클릭 핸들러
  const handlePlusClick = () => {
    setIsPlacingMarker(true);
    setPlacedMarker(null);
    setShowPlaceModal(false);
    setShowPlaceInfoWindow(false);
  };

  // 클러스터 마커 렌더러
  // MarkerClustererRenderer import 및 관련 함수 완전히 제거

  console.log('렌더링할 마커 개수:', markers.length, '현재 줌:', currentZoom);

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
        {/* 지도 하단 확대/축소 버튼 */}
        <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-2">
          <button onClick={handleZoomIn} className="w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center text-2xl font-bold text-black hover:bg-gray-100">+</button>
          <button onClick={handleZoomOut} className="w-12 h-12 rounded-full bg-white border shadow flex items-center justify-center text-2xl font-bold text-black hover:bg-gray-100">-</button>
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
            <button
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
        </div>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={14}
          onLoad={onMapLoad}
          onBoundsChanged={onBoundsChanged}
          onZoomChanged={onZoomChanged}
          onClick={handleMapClick}
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
                  className="w-12 h-12 rounded-full object-cover"
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
      </GoogleMap>
      {/* 좌표 입력 모달 */}
      {showPlaceModal && placedMarker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative text-black">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => { setShowPlaceModal(false); setPlacedMarker(null); }}>&times;</button>
            <h2 className="text-lg font-bold mb-4">좌표에 데이터 입력</h2>
            <div className="mb-2 text-sm">위도: <span className="font-mono">{placedMarker.lat}</span></div>
            <div className="mb-4 text-sm">경도: <span className="font-mono">{placedMarker.lng}</span></div>
            <form className="flex flex-col gap-3">
              <input className="border rounded px-3 py-2" placeholder="제목" />
              <textarea className="border rounded px-3 py-2" placeholder="설명" rows={3} />
              <input className="border rounded px-3 py-2" placeholder="감성태그 (예: 😊)" />
              <button type="button" className="mt-2 bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700">저장</button>
            </form>
          </div>
        </div>
      )}
      </div>
    </LoadScript>
  );
} 