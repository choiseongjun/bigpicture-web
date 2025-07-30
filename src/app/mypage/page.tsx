'use client';

import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { useRouter } from 'next/navigation';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useTranslation } from 'next-i18next';

interface LoginForm {
  email: string;
  password: string;
}

export default function MyPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();
  const { t } = useTranslation('common');

  // 페이지 로드 시 로그인 상태 확인 및 localStorage 변경 감지
  useEffect(() => {
    checkLoginStatus();
    
    // localStorage 변경 이벤트 리스너 추가
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('localStorageChange', handleStorageChange);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, []);

  // 로그인 상태 확인
  const checkLoginStatus = async () => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        // 토큰이 유효한지 확인하기 위해 프로필 정보 가져오기
        const response = await apiClient.get('/auth/profile');
        setIsLoggedIn(true);
        setUser(response.data);
      } catch (error) {
        console.error('토큰 검증 실패:', error);
        // 토큰이 유효하지 않으면 제거
        localStorage.removeItem('jwtToken');
        setIsLoggedIn(false);
        setUser(null);
      }
    }
    setIsCheckingAuth(false);
  };

  // 이메일/비밀번호 로그인
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', loginForm);
      const { token, user: userData } = response.data;
      
      // JWT 토큰을 localStorage에 저장
      localStorage.setItem('jwtToken', token);
      
      // localStorage 변경 이벤트 디스패치
      window.dispatchEvent(new Event('localStorageChange'));
      
      setIsLoggedIn(true);
      setUser(userData);
      setLoginForm({ email: '', password: '' });
      
      console.log('로그인 성공:', userData);
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setError(error.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    
    // localStorage 변경 이벤트 디스패치
    window.dispatchEvent(new Event('localStorageChange'));
    
    setIsLoggedIn(false);
    setUser(null);
    setError('');
  };

  // 폼 입력 변경
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 mobile-full-height" style={{ minHeight: '100dvh' }}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('mypage')}</h1>
          <p className="mt-2 text-gray-600">{t('loginToUseService')}</p>
        </div>

        {isCheckingAuth ? (
          // 인증 상태 확인 중
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('checkingLoginStatus')}</p>
            </div>
          </div>
        ) : isLoggedIn ? (
          // 로그인된 상태
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-blue-600">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {user?.name || user?.email || '사용자'}
              </h2>
              {user?.email && (
                <p className="text-gray-600 mb-4">{user.email}</p>
              )}
            </div>
            
                         {/* 내정보 수정 버튼 */}
             <div className="space-y-3">
               <button
                 onClick={() => router.push('/mypage/profile')}
                 className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
               >
                 {t('profile')}
               </button>
               
               <button
                 onClick={handleLogout}
                 className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
               >
                 {t('logout')}
               </button>
             </div>
          </div>
        ) : (
          // 로그인되지 않은 상태
          <div className="space-y-6">
                         {/* 구글 로그인 버튼 */}
             <div className="bg-white shadow rounded-lg p-6">
               <GoogleLoginButton onLogin={(user) => {
                 console.log('Google 로그인 성공, 사용자 정보:', user);
                 setIsLoggedIn(true);
                 setUser(user);
                 setLoginForm({ email: '', password: '' });
                 setError(''); // 에러 메시지 초기화
               }} />
             </div>

                         {/* 구분선 */}
             <div className="relative">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-gray-300" />
               </div>
               <div className="relative flex justify-center text-sm">
                 <span className="px-2 bg-gray-50 text-gray-500">{t('or')}</span>
               </div>
             </div>

            {/* 이메일/비밀번호 로그인 폼 */}
            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                                 <div>
                   <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                     {t('email')}
                   </label>
                   <input
                     type="email"
                     id="email"
                     name="email"
                     value={loginForm.email}
                     onChange={handleInputChange}
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                     placeholder="your@email.com"
                   />
                 </div>

                 <div>
                   <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                     {t('password')}
                   </label>
                   <input
                     type="password"
                     id="password"
                     name="password"
                     value={loginForm.password}
                     onChange={handleInputChange}
                     required
                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                     placeholder={t('enterPassword')}
                   />
                 </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                                 <button
                   type="submit"
                   disabled={isLoading}
                   className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   {isLoading ? t('loginInProgress') : t('login')}
                 </button>
              </form>

                             <div className="mt-4 text-center">
                 <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                   {t('forgotPassword')}
                 </a>
               </div>
            </div>

                         {/* 회원가입 링크 */}
             <div className="text-center">
               <p className="text-sm text-gray-600">
                 {t('noAccount')}{' '}
                 <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                   {t('signup')}
                 </a>
               </p>
             </div>
             <button
               type="button"
               className="mt-2 w-full py-2 rounded bg-gray-200 text-blue-700 font-semibold hover:bg-blue-100 transition"
               onClick={() => router.push('/mypage/register')}
             >
               {t('register')}
             </button>
          </div>
        )}
      </div>
    </div>
  );
} 