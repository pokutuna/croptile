# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CropTile

Browser-based image tiling tool. Split images into sections and arrange them into new layouts. Primary use case: rearranging sheet music for YouTube performance videos.

## Tech Stack

- React 19 + TypeScript + Vite
- Zustand (state management)
- Tailwind CSS v4
- Vitest (testing)

## Commands

```bash
npm run dev        # Dev server
npm run build      # tsc -b && vite build
npm run test:run   # Run tests once
npm run lint       # ESLint
```

## Structure

- `src/store/useAppStore.ts` - Single Zustand store for all state
- `src/components/CutArea/` - Left panel: image loading, split lines
- `src/components/LayoutArea/` - Right panel: arrange cells, export PNG
- `src/utils/` - Geometry calculations, snap logic, image export
- `src/i18n.ts` - Translations (en/ja)
