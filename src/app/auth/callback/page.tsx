'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '../../lib/apiClient';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError('Google 로그인에 실패했습니다.');
        setIsLoading(false);
        return;
      }

      if (!code) {
        setError('인증 코드를 받지 못했습니다.');
        setIsLoading(false);
        return;
      }

      try {
        // Google OAuth 코드를 서버로 전송하여 JWT 토큰 받기
        const response = await apiClient.post('/auth/google', { code });
        const { token, user } = response.data;

        // JWT 토큰을 localStorage에 저장
        localStorage.setItem('jwtToken', token);
        
        console.log('Google 로그인 성공:', user);
        
        // 마이페이지로 리다이렉트
        router.push('/mypage');
      } catch (error: any) {
        console.error('Google OAuth 처리 오류:', error);
        setError(error.response?.data?.message || 'Google 로그인 처리 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Google 로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/mypage')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            마이페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
} 