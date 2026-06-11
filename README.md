# Aftensmad 🍳

Frederiks personlige opskriftshub — alle yndlingsretterne samlet ét sted.

**Funktioner**

- **Opskriftsgalleri** — søg, filtrér på kategori og gem favoritter med et hjerte.
- **Træk en ret** — lad skæbnen vælge aftensmaden med et animeret lykkehjul
  (kan begrænses til favoritter).
- **Ugeplan** — planlæg mandag til søndag, udfyld hele ugen med ét klik,
  byt enkelte dage med terningen. Gemmes i browseren.
- **Swipe ugen** — Tinder for aftensmad: swipe til højre for at sætte
  retten på næste ledige dag, til venstre for at springe over, med
  fortryd-knap og fremgangsvisning til ugen er fuld.
- **Historik** — når en ny uge begynder, arkiveres den gamle ugeplan
  automatisk under "Tidligere uger", hvor den kan genbruges eller slettes.
  Swiperen advarer, hvis I fik en ret for nylig.
- **Egne opskrifter** — tilføj nye retter med link og billede; de gemmes
  lokalt i browseren (localStorage).
- Klik på en rets billede eller navn for at åbne den originale opskrift.

## Teknik

- [Vite](https://vitejs.dev) + React 18 + TypeScript (strict)
- Ingen backend eller database — opskrifterne ligger i
  `src/data/recipes.json`, og favoritter/ugeplan/egne retter gemmes i
  localStorage. Gratis og uden vedligehold.
- Billederne blev reddet fra det gamle Firebase-projekt ved at hente
  `og:image` fra de originale opskriftssider (Firebase Storage på
  Spark-planen blev lukket af Google i 2024).
- Deployes automatisk til Netlify via GitHub (`netlify.toml`).

## Kommandoer

```bash
npm install     # installer afhængigheder
npm run dev     # udviklingsserver
npm test        # kør unit tests (vitest)
npm run build   # typecheck + produktion-build til dist/
```

## Tilføj en opskrift permanent

Egne opskrifter via UI'et gemmes kun i den enkelte browser. Skal en ret med
i selve samlingen (alle enheder), tilføj den i `src/data/recipes.json` og
læg evt. et billede i `public/images/`.
