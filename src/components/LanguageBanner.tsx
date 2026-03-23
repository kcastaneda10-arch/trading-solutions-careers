"use client";

import { useLanguage } from "@/i18n/context";

export default function LanguageBanner() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-end h-8">
        <div className="flex items-center gap-1 text-xs font-medium">
          <button
            onClick={() => setLocale("es")}
            className={`px-2 py-0.5 rounded transition-colors ${
              locale === "es"
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ES
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={() => setLocale("en")}
            className={`px-2 py-0.5 rounded transition-colors ${
              locale === "en"
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ENG
          </button>
        </div>
      </div>
    </div>
  );
}
