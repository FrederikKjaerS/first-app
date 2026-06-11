# Aftensmad 🍳

Opskriftshub og social madplanlægger — find aftensmad, swipe ugens madplan
på plads, og følg andres opskrifter og ugeplaner.

## Funktioner

- **Opskriftsgalleri** — søg, filtrér på kategori, gem favoritter og se
  hvilke retter der er afprøvet (✓) og hvilke der er nye idéer.
- **Træk en ret** — animeret lykkehjul der vælger aftensmaden.
- **Swipe ugen** — Tinder for aftensmad: swipe til højre for at sætte retten
  på næste ledige dag, til venstre for at springe over.
- **Ugeplan + historik** — mandag til søndag; gamle uger arkiveres
  automatisk og kan genbruges.
- **Tilføj via link** — indsæt en URL og navn + billede hentes automatisk
  (ønskeskyen-style).
- **Konti & fællesskab** — opret en bruger, få standardsamlingen på 109
  retter, tilføj egne opskrifter, følg andre og se deres ugeplaner
  (`/folk`, `/u/brugernavn`).
- **Gæstetilstand** — uden konto virker alt lokalt i browseren; ved login
  tilbydes import af de lokale data til kontoen.

## Teknik

- Vite + React 18 + TypeScript (strict), react-router
- **Supabase** (gratis tier): Postgres + Auth med row-level security —
  skemaet ligger i `supabase/migrations/`
- **Netlify**: hosting + serverless funktion `/api/scrape` til URL-import
- Uden Supabase-nøgler kører appen automatisk i gæstetilstand

## Produktionsopsætning (én gang, ~10 minutter)

1. **Opret Supabase-projekt** på [supabase.com](https://supabase.com)
   (gratis). Vælg region `eu-central-1` (Frankfurt).
2. **Kør migreringerne**: åbn projektets *SQL Editor* og kør indholdet af
   `supabase/migrations/0001_init.sql` og derefter
   `supabase/migrations/0002_seed_default_recipes.sql`.
3. **Find nøglerne** under *Project Settings → API*: `Project URL` og
   `anon public`-nøglen.
4. **Sæt miljøvariabler i Netlify** under *Site configuration → Environment
   variables*:
   - `VITE_SUPABASE_URL` = projektets URL
   - `VITE_SUPABASE_ANON_KEY` = anon-nøglen
5. **Redeploy** sitet (Netlify → *Trigger deploy*). Login-knappen og
   Folk-fanen dukker op automatisk.
6. (Anbefalet) I Supabase under *Authentication → URL Configuration*: sæt
   *Site URL* til dit domæne, så bekræftelsesmails linker rigtigt.

Lokal udvikling med backend: kopier `.env.example` til `.env` og udfyld.

## Kommandoer

```bash
npm install     # installer afhængigheder
npm run dev     # udviklingsserver (gæstetilstand uden .env)
npm test        # unit tests (vitest)
npm run build   # typecheck + produktion-build til dist/
```

## Datamodel

- `profiles` — brugernavn + visningsnavn (offentlige)
- `recipes` — `owner = null` er de 109 kuraterede standardretter, ellers
  brugerens egne (offentlige at læse, kun ejeren kan ændre)
- `recipe_state` — pr. bruger: favorit/afprøvet/skjult (privat)
- `week_plans` — én række pr. bruger pr. ISO-uge (offentlige at læse —
  det er dem man deler/følger)
- `follows` — hvem følger hvem

Al adgang er håndhævet med Postgres row-level security — klienten bruger
kun den offentlige anon-nøgle.
