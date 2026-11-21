# EDVANTA — Adaptive Learning Intelligence Platform

**Tagline:** *Learn Smarter. Grow Further.*

EDVANTA is an AI-powered adaptive learning and examination preparation platform built around a persistent concept-level **Learner Model**. Rather than reducing student knowledge to a single percentage, EDVANTA maps syllabus dependencies, calibrates question difficulty, analyzes written student reasoning for hidden misconceptions, and schedules personalized spaced-repetition reviews.

## Brand Identity & Visual System

- **Primary Colors:** Deep Navy (`#101827`), Primary Blue (`#526BFF`), Electric Violet (`#8B6CFF`), Crisp White (`#FFFFFF`), Light Surface (`#F5F7FC`)
- **Typography:** `Plus Jakarta Sans` (display & wordmark), `DM Sans` (body), `JetBrains Mono` (tabular metrics & formulas)
- **Original Brand Assets:**
  - `src/components/brand/EdvantaBrand.tsx` (`EdvantaSymbol`, `AppIcon`, `EdvantaLogo`, `BrandHeader`)
  - `src/components/brand/BrandIntro.tsx` & `BrandTransition.tsx` (animated 4-stage signature opening sequence)
  - `public/favicon.svg` (crisp vector app & browser icon)

## Core Learning Capabilities

1. **Baseline Diagnostic Assessment**: Evaluates initial proficiency across all 8 Class 10 Physics — Electricity concepts with optional written reasoning.
2. **Interactive Concept Knowledge Graph**: Displays prerequisite relationships and live mastery states (`Not Started`, `Weak`, `Developing`, `Mastered`).
3. **Persistent Learner Model**: Updates per-concept mastery deterministically after every answer based on correctness, difficulty tier, and reasoning quality.
4. **Difficulty-Calibrated Adaptive Practice**: Prioritizes weak/unstarted concepts and generates fresh targeted questions via Google Gemini with curated bank fallbacks.
5. **Reasoning-Based Misconception Detection**: Analyzes written explanations—even on lucky correct guesses—and links corrective feedback without fabricating errors when reasoning is insufficient.
6. **Spaced-Repetition Revision Planner**: Automatically queues immediate (`0d`/`1d`) reviews for weak or misunderstood topics and expands intervals up to `14d` for mastered concepts.
7. **Structured Learning Modules, Streaks & AI Companion (Volt)**: Interactive physics circuit/formula simulators, milestone badges/XP, and an app-aware study companion aligned with the EDVANTA brand.
8. **Teacher Analytics Dashboard**: Surfaces class-wide mastery gaps, difficult concepts, verbatim common misconceptions, student progress drill-downs, and CSV exports.
