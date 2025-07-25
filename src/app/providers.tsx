"use client";
import { LanguageProvider } from "./components/LanguageContext";
import GoogleMapsProvider from "./components/GoogleMapsProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <GoogleMapsProvider>
        {children}
      </GoogleMapsProvider>
    </LanguageProvider>
  );
} 