'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/apiClient';
import { useTranslation } from 'next-i18next';

interface UserProfile {
  id?: number;
  email?: string;
  nickname?: string;
  profileImageUrl?: string;
  age?: number | null;
  gender?: string | null;
  personalityType?: string | null;
  region?: string | null;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();
  const { t } = useTranslation('common');

  // 폼 데이터 상태
  const [formData, setFormData] = useState<UserProfile>({
    nickname: '',
    age: null,
    gender: null,
    personalityType: null,
    region: null
  });

  useEffect(() => {
    // JWT 토큰 확인
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      router.push('/mypage');
      return;
    }

    // 사용자 정보 가져오기
    fetchUserProfile();
  }, [router]);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      const userData = response.data.data.user; // API 응답 구조에 맞게 수정
      setUser(userData);
      setFormData({
        nickname: userData.nickname || '',
        age: userData.age || null,
        gender: userData.gender || null,
        personalityType: userData.personalityType || null,
        region: userData.region || null
      });
    } catch (error: any) {
      console.error('프로필 정보 가져오기 실패:', error);
             setError(t('profileLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value === '' ? null : parseInt(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.put('/auth/profile', formData);
             setSuccess(t('profileUpdateSuccess'));
      setUser(response.data.data.user); // API 응답 구조에 맞게 수정
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('프로필 업데이트 실패:', error);
             setError(error.response?.data?.message || t('profileUpdateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 mobile-full-height" style={{ minHeight: '100dvh' }}>
        <div className="max-w-md mx-auto">
          <div className="text-center">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
             <p className="mt-2 text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 mobile-full-height" style={{ minHeight: '100dvh' }}>
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
                     <button
             onClick={() => router.back()}
             className="absolute left-4 top-4 text-gray-600 hover:text-gray-800"
           >
             ← {t('back')}
           </button>
           <h1 className="text-3xl font-bold text-gray-900">{t('profile')}</h1>
           <p className="mt-2 text-gray-600">{t('editPersonalInfo')}</p>
        </div>

        {/* 프로필 폼 */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
                         {/* 프로필 이미지 */}
             <div className="text-center mb-6">
               <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                 {user?.profileImageUrl ? (
                   <img 
                     src={user.profileImageUrl} 
                     alt="프로필" 
                     className="w-20 h-20 rounded-full object-cover"
                   />
                 ) : (
                   <span className="text-2xl text-blue-600">
                     {user?.nickname?.charAt(0) || user?.email?.charAt(0) || 'U'}
                   </span>
                 )}
               </div>
               <p className="text-sm text-gray-500">{t('profileImageManagedByGoogle')}</p>
             </div>

             {/* 이메일 (읽기 전용) */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 {t('email')}
               </label>
               <input
                 type="email"
                 value={user?.email || ''}
                 disabled
                 className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
               />
               <p className="text-xs text-gray-500 mt-1">{t('emailCannotChange')}</p>
             </div>

             {/* 닉네임 */}
             <div>
               <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('nickname')}
               </label>
               <input
                 type="text"
                 id="nickname"
                 name="nickname"
                 value={formData.nickname}
                 onChange={handleInputChange}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                 placeholder={t('enterNickname')}
               />
             </div>

             {/* 나이 */}
             <div>
               <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('age')}
               </label>
               <input
                 type="number"
                 id="age"
                 name="age"
                 value={formData.age || ''}
                 onChange={handleInputChange}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                 placeholder={t('enterAge')}
                 min="1"
                 max="120"
               />
             </div>

             {/* 성별 */}
             <div>
               <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('gender')}
               </label>
               <select
                 id="gender"
                 name="gender"
                 value={formData.gender || ''}
                 onChange={handleInputChange}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
               >
                 <option value="">{t('selectOption')}</option>
                 <option value="male">{t('male')}</option>
                 <option value="female">{t('female')}</option>
                 <option value="other">{t('other')}</option>
               </select>
             </div>

             {/* 성격 유형 */}
             <div>
               <label htmlFor="personalityType" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('personalityType')}
               </label>
               <select
                 id="personalityType"
                 name="personalityType"
                 value={formData.personalityType || ''}
                 onChange={handleInputChange}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
               >
                 <option value="">{t('selectOption')}</option>
                 <option value="introvert">{t('introvert')}</option>
                 <option value="extrovert">{t('extrovert')}</option>
                 <option value="ambivert">{t('ambivert')}</option>
               </select>
             </div>

             {/* 지역 */}
             <div>
               <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('region')}
               </label>
               <input
                 type="text"
                 id="region"
                 name="region"
                 value={formData.region || ''}
                 onChange={handleInputChange}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                 placeholder={t('enterRegion')}
               />
             </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* 성공 메시지 */}
            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                {success}
              </div>
            )}

            {/* 저장 버튼 */}
                         <button
               type="submit"
               disabled={isSaving}
               className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               {isSaving ? t('saving') : t('save')}
             </button>
          </form>
        </div>
      </div>
    </div>
  );
} 