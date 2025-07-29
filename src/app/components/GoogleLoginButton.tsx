import { signInWithGoogle } from '../lib/firebase';
import apiClient from '../lib/apiClient';

export default function GoogleLoginButton({ onLogin }: { onLogin?: (user: any) => void }) {
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
          const token = data.accessToken ||  data.token;
          if (token) {
            localStorage.setItem('jwtToken', token);
            
            // localStorage 변경 이벤트 디스패치
            window.dispatchEvent(new Event('localStorageChange'));
            
            // alert('로그인 성공! 토큰 저장 완료');
            // user 정보 우선순위: data.member > data.googlePayload > user
            const userInfo = (data.data && (data.data.member || data.data.googlePayload)) || user;
            if (onLogin) onLogin(userInfo);
          } else {
            alert('로그인 성공, 토큰 없음');
          }
        } catch (e) {
          alert('로그인 실패');
        }
      }}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      구글로 로그인
    </button>
  );
} 