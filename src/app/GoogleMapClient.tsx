'use client';

import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 클러스터링 적용
  useEffect(() => {
    console.log('클러스터링 조건 확인:', {
      mapLoaded,
      markerCount: markerRefs.current.length,
      markersLength: markers.length,
      hasGoogleMaps: !!window.google?.maps,
      currentZoom
    });
    
    if (mapLoaded && markers.length > 0 && window.google?.maps && currentZoom < 15) {
      console.log('클러스터링 적용 중...');
      
      // 기존 클러스터러 제거
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }

      // 새로운 클러스터러 생성
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current!,
        markers: markerRefs.current,
        renderer: {
          render: ({ count, position }) => {
            const clusterMarker = new window.google.maps.Marker({
              position,
              label: {
                text: count.toString(),
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 20,
                fillColor: '#4285F4',
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });
            return clusterMarker;
          },
        },
      });
      console.log('클러스터링 완료');
    } else if (clustererRef.current && currentZoom >= 15) {
      // 줌 레벨이 높으면 클러스터링 제거
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
  }, [mapLoaded, markers.length, currentZoom]);

  const customMarkerIcon = (imageUrl: string) => {
    if (!window.google?.maps) {
      console.log('Google Maps API가 로드되지 않음');
      return undefined;
    }
    
    const iconUrl = `http://localhost:5500${imageUrl}`;
    console.log('마커 아이콘 URL:', iconUrl);
    
    // 줌 레벨에 따라 크기 조정
    const size = currentZoom >= 15 ? 150 : 50;
    const anchor = currentZoom >= 15 ? 75 : 25;
    
    return {
      url: iconUrl,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(anchor, anchor),
    };
  };

  const onMapLoad = (map: google.maps.Map) => {
    console.log('맵 로드 완료');
    mapRef.current = map;
    setMapLoaded(true);
    
    // 초기 마커 로드
    const bounds = map.getBounds();
    if (bounds) {
      fetchMarkers(bounds);
    }
  };

  const onMarkerLoad = (marker: google.maps.Marker) => {
    console.log('마커 로드:', markerRefs.current.length + 1);
    markerRefs.current.push(marker);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  console.log('렌더링할 마커 개수:', markers.length, '현재 줌:', currentZoom);

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onLoad={onMapLoad}
        onBoundsChanged={onBoundsChanged}
        onZoomChanged={onZoomChanged}
      >
        {loading && (
          <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded shadow text-sm">
            마커 로딩 중...
          </div>
        )}
        
        {/* 모든 줌 레벨에서 마커 렌더링 */}
        {markers.map((marker, index) => {
          console.log(`마커 ${index + 1}:`, { lat: marker.latitude, lng: marker.longitude });
          return (
            <Marker
              key={`${marker.id}-${index}`}
              position={{ lat: marker.latitude, lng: marker.longitude }}
              icon={currentZoom >= 15 ? customMarkerIcon(marker.thumbnailImg) : undefined}
              onClick={() => setSelectedMarker(marker)}
              onLoad={onMarkerLoad}
            />
          );
        })}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={`http://localhost:5500${selectedMarker.thumbnailImg}`}
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
    </LoadScript>
  );
} 