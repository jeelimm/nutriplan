import { type Language, useMealStore } from '@/lib/meal-store'

const dict: Record<string, { en: string; ko: string }> = {
  'grocery.category.protein': { en: 'Proteins', ko: '단백질' },
  'grocery.category.vegetables': { en: 'Vegetables', ko: '채소' },
  'grocery.category.carbs': { en: 'Carbohydrates', ko: '탄수화물' },
  'grocery.category.dairy': { en: 'Dairy', ko: '유제품' },
  'grocery.category.fats': { en: 'Fats & Oils', ko: '지방·오일' },
  'grocery.category.fruits': { en: 'Fruits', ko: '과일' },
  'grocery.category.spices': { en: 'Spices & Seasonings', ko: '양념·향신료' },
  'aiDisclosure.badge': { en: 'AI-generated', ko: 'AI 생성' },
  'aiDisclosure.notice': {
    en: 'This service uses AI to generate meal plans. Results are for reference only and are not medical advice.',
    ko: '이 서비스는 AI가 식단을 생성해요. 결과는 참고용이며 의학적 조언이 아니에요.',
  },
  'aiDisclosure.gotIt': { en: 'Got it', ko: '확인' },
}

// Pure, server-importable translator. Falls back to English, then to the raw key.
export function translate(lang: Language, key: string): string {
  const entry = dict[key]
  if (!entry) return key
  return entry[lang] ?? entry.en
}

// Client hook — only call from components that already declare 'use client'.
export function useT(): (key: string) => string {
  const lang = useMealStore((s) => s.appPrefs.language)
  return (key: string) => translate(lang, key)
}
