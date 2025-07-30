"use client";
import GoogleMapsProvider from "./components/GoogleMapsProvider";
import I18nProvider from "./components/I18nProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="ko">
      <GoogleMapsProvider>
        {children}
      </GoogleMapsProvider>
    </I18nProvider>
  );
} 