import { signInWithGoogle } from '../lib/firebase';
import apiClient from '../lib/apiClient';
import { useTranslation } from 'next-i18next';

export default function GoogleLoginButton({ onLogin }: { onLogin?: (user: any) => void }) {
  const { t } = useTranslation('common');
  
  return (
    <button
      onClick={async () => {
        try {
          const user = await signInWithGoogle();
          const idToken = await user.getIdToken();
          console.log('id_token:', idToken);

          // 백엔드로 전송
          const res = await apiClient.post('/auth/google-id-token', {
            id_token: idToken,
            nickname: user.displayName,
            profile_image_url: user.photoURL,
          });
          const data = res.data;
          console.log('백엔드 응답:', data);

          // 다양한 필드명 체크
          const token = data.accessToken || data.token || data.access_token;
          if (token) {
            localStorage.setItem('jwtToken', token);
            
            // localStorage 변경 이벤트 디스패치
            window.dispatchEvent(new Event('localStorageChange'));
            
            // user 정보 우선순위: data.member > data.data.googlePayload > data.user > user
            let userInfo = user; // 기본값
            
            if (data.member) {
              userInfo = data.member;
            } else if (data.data && data.data.member) {
              userInfo = data.data.member;
            } else if (data.data && data.data.googlePayload) {
              userInfo = data.data.googlePayload;
            } else if (data.user) {
              userInfo = data.user;
            }
            
            console.log('최종 사용자 정보:', userInfo);
            if (onLogin) onLogin(userInfo);
          } else {
            console.error('토큰을 찾을 수 없습니다:', data);
            alert('로그인 성공했지만 토큰을 받지 못했습니다.');
          }
        } catch (e) {
          alert('로그인 실패');
        }
      }}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
             <span className="text-gray-700 font-medium">{t('googleLogin')}</span>
    </button>
  );
} 