import type { Language } from "@/lib/meal-store";

// Korean translations for built-in catalog ingredient names.
// Keys are the exact English catalog names (case-sensitive).
const INGREDIENT_KO: Record<string, string> = {
  "Chicken breast": "닭가슴살",
  Eggs: "달걀",
  "Canned tuna": "참치캔",
  "Greek yogurt": "그릭요거트",
  Salmon: "연어",
  "Ground beef": "다진 소고기",
  Ribeye: "꽃등심",
  Shrimp: "새우",
  "Turkey breast": "칠면조 가슴살",
  "Whey protein": "웨이 프로틴",
  "White rice": "흰쌀밥",
  Oats: "오트밀",
  "Sweet potato": "고구마",
  Banana: "바나나",
  "Brown rice": "현미밥",
  Quinoa: "퀴노아",
  Apple: "사과",
  Granola: "그래놀라",
  "Olive oil": "올리브유",
  "Peanut butter": "땅콩버터",
  Avocado: "아보카도",
  "Mixed nuts": "믹스넛",
  "Almond butter": "아몬드버터",
  Walnuts: "호두",
  "Chia seeds": "치아씨드",
  Broccoli: "브로콜리",
  Spinach: "시금치",
  Carrot: "당근",
  Cucumber: "오이",
  "Bell pepper": "파프리카",
  Tomato: "토마토",
  Mushroom: "버섯",
  Asparagus: "아스파라거스",
  Kale: "케일",
  "Brussels sprouts": "방울양배추",
  Zucchini: "애호박",
};

// Returns the Korean name for a catalog ingredient when lang is 'ko'.
// Falls back to the original name for unknown ingredients or other languages.
export function localizeIngredientName(name: string, lang: Language): string {
  if (lang === "ko") {
    return INGREDIENT_KO[name] ?? name;
  }
  return name;
}
