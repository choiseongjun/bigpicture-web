'use client'

import { I18nextProvider } from 'react-i18next'
import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useEffect, useState } from 'react'

const initI18next = async (locale: string) => {
  const i18nInstance = createInstance()
  
  // 동적으로 번역 파일 로드
  const [commonKo, commonEn, bottomKo, bottomEn] = await Promise.all([
    fetch('/locales/ko/common.json').then(res => res.json()),
    fetch('/locales/en/common.json').then(res => res.json()),
    fetch('/locales/ko/bottom.json').then(res => res.json()),
    fetch('/locales/en/bottom.json').then(res => res.json()),
  ])
  
  await i18nInstance
    .use(initReactI18next)
    .init({
      lng: locale,
      fallbackLng: 'ko',
      ns: ['common', 'bottom'],
      defaultNS: 'common',
      resources: {
        ko: {
          common: commonKo,
          bottom: bottomKo,
        },
        en: {
          common: commonEn,
          bottom: bottomEn,
        },
      },
    })
  return i18nInstance
}

export default function I18nProvider({ 
  children, 
  locale = 'ko' 
}: { 
  children: React.ReactNode
  locale?: string 
}) {
  const [instance, setInstance] = useState<any>(null)

  useEffect(() => {
    // localStorage에서 저장된 언어 설정 가져오기
    const savedLocale = localStorage.getItem('language') || locale
    console.log('I18nProvider 초기화:', savedLocale)
    initI18next(savedLocale).then(setInstance)
  }, [locale])

  // 언어 변경 이벤트 감지
  useEffect(() => {
    const handleLanguageChange = async (event: Event) => {
      const customEvent = event as CustomEvent
      const newLocale = customEvent.detail
      console.log('언어 변경 감지:', newLocale)
      
      // 기존 인스턴스가 있으면 언어만 변경
      if (instance) {
        await instance.changeLanguage(newLocale)
        setInstance({ ...instance }) // 강제 리렌더링
      } else {
        // 새 인스턴스 생성
        const newInstance = await initI18next(newLocale)
        setInstance(newInstance)
      }
    }

    window.addEventListener('languageChanged', handleLanguageChange)
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [instance])

  if (!instance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
} 