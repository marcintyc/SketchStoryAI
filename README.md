# SketchStory AI (MVP)

Spersonalizowane animacje whiteboard z prostym generatorem scen po stronie frontendu. Front hostowany na GitHub Pages. Integracje AI/TTS dodamy przez serverless (Cloudflare Workers/Vercel Functions) w kolejnych krokach.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy na GitHub Pages (automatycznie)

- Upewnij się, że branch to `main` (lub zaktualizuj workflow).
- W repo: Settings → Pages → Build and deployment → Source: GitHub Actions.
- Wysyłka: push do `main` uruchomi workflow.

Workflow automatycznie ustawia `VITE_BASE` na `/<repo>/`, więc ścieżki będą poprawne bez ręcznej konfiguracji.

## Struktura

- `src/components/Whiteboard.tsx` – renderer SVG z efektem „rysowania” (stroke-dashoffset) i animowaną „kropką” markera.
- `src/lib/story.ts` – prosty generator storyboardu z promtu (placeholder bez AI).
- `vite.config.ts` – `base` ustawiane dynamicznie przez zmienną środowiskową w CI.

## Następne kroki

- Dodanie API serverless (proxy do LLM/TTS), bez umieszczania sekretów w kliencie.
- Synchronizacja narracji (TTS) z czasem rysowania.
- Eksport do WebM (MediaRecorder + ewentualnie ffmpeg.wasm) – opcjonalnie.