# 🥗 NutriPlan

**A realistic meal planner that builds plans you can actually follow.**

NutriPlan generates personalized 7-day meal plans based on your body composition, goal, and ingredients you can actually buy — not a generic diet template.

🔗 **Live Demo:** [nutriplan-khaki.vercel.app](https://nutriplan-khaki.vercel.app)

---

## Why NutriPlan?

Most diet apps give you meal plans with ingredients you can't find, recipes too complex to cook daily, and calorie targets that don't match your body.

NutriPlan is different:

- **Body-based targets** — Uses the Katch-McArdle formula with your lean body mass for accurate calorie and macro goals
- **Ingredient-first planning** — You choose what you'll actually buy, then the plan is built around that
- **Cuisine-aware** — Korean, Japanese, Western, Mediterranean and more — no quinoa if you're in Seoul
- **Rotation-based** — 9 core meals rotated across 7 days, so your grocery list stays simple
- **Realistic pace** — Set a target weight and choose your loss pace (Steady / Moderate / Aggressive)

---

## Features

- 🧬 InBody-based or Quick Start onboarding
- 👨 / 👩 Sex-adjusted BMR calculation
- 🎯 Goal selection: Lose Fat / Gain Muscle / Lean Recomposition
- ⚡ Diet style: High Protein / Balanced / Keto / Intermittent Fasting
- 🌏 Cuisine preference: Korean, Japanese, Western, Mediterranean, Asian Fusion
- 💰 Budget presets: Budget-friendly / Balanced spend / More variety
- 🤖 AI-generated meal plans via Claude API
- 📊 Daily macro tracking with progress bars
- 🛒 Weekly grocery list with consolidated quantities
- 📐 Metric / Imperial unit toggle
- 🌐 English / Korean language support
- 💾 Profile persistence across sessions
- ⚙️ Settings screen for easy updates

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + Tailwind CSS |
| AI Generation | Anthropic Claude API (Haiku) |
| State Management | Zustand + localStorage |
| Deployment | Vercel |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/jeelimm/nutriplan.git
cd nutriplan

# Install dependencies
npm install

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see it running.

---

## How It Works

1. **Onboarding** — Enter your InBody stats or use Quick Start body-type estimation
2. **Set your goal** — Lose fat, gain muscle, or recomp
3. **Choose your pace** — Steady, Moderate, or Aggressive deficit
4. **Pick your cuisine** — Korean, Western, Japanese, and more
5. **Select ingredients** — Budget preset or custom selection
6. **Generate** — Claude builds a 7-day rotation plan in ~15 seconds
7. **Cook** — Follow recipes, track macros, update your plan as you progress

---

## Built By

Built with zero prior coding experience using vibe coding — Claude + Cursor + v0.dev.
