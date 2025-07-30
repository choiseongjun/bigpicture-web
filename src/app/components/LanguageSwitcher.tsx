'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'next-i18next';

export default function LanguageSwitcher() {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');

  const toggleLanguage = () => {
    const newLocale = i18n.language === 'ko' ? 'en' : 'ko';
    const currentPath = window.location.pathname;
    
    // 현재 경로에서 locale 부분을 제거하고 새로운 locale로 변경
    const pathWithoutLocale = currentPath.replace(/^\/(ko|en)/, '') || '/';
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    router.push(newPath);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
    >
      {i18n.language === 'ko' ? t('english') : t('korean')}
    </button>
  );
} 