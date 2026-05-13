# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

[bh3text.com](https://www.bh3text.com/) — a static site that archives Honkai Impact 3rd game dialogue text. Chinese-language content. Deployed on Cloudflare Pages (`wrangler.jsonc`).

**ABSOLUTELY FORBIDDEN** TO：
- SORT ANY INDEX OR CONTENT
- REMOVE ANY WORKING CODE WITHOUT USER PERMISSION
- WRITE SHITTY AND UNMAINTAINABLE CODE
- WRITE INLINE <STYLE> BLOCK INTO HTML FILES
- WRITE INLINE JAVASCRIPT LIKE `<a onclick=……>`
- WRITE BAD-ACCESSIBILITY HTML OR OMIT `autocomplete` ATTRIBUTE ON FORM ELEMENTS
OR **YOU WILL BE IMMEDIATELY KILLED**

## Build & Develop

```bash
npm run build          # Full build: data submodule → runtime → static pages
npm run build-submodule  # Build only the data/ submodule
npm run build-only     # Build only the static HTML pages (build/index.mjs)
```

**Runtime (Vue app):**
```bash
cd runtime
npm run dev            # Vite dev server
npm run build          # Type-check + Vite build + obfuscate
npm run type-check     # vue-tsc --build
npm run obfuscate      # Minify dist JS via rolldown
```

**Formatting:** Prettier with tabs=4, single quotes, semicolons, printWidth=100 (see `.prettierrc`).

## Architecture

The site is generated in three stages:

### 1. Data submodule (`data/`)
Git submodule ([bh3text-data](https://github.com/mtxc26/bh3text-data)). Contains raw game dialogue. Its `build.js` processes raw data into `data/dist/` with:
- `data/dist/app/index/` — chapter indexes (main.json, main2.json)
- `data/dist/app/chapters/data/` — per-chapter stage/content data
- `data/dist/pages/` — flattened page descriptors (er.json, main1.json, main2.json) used by dialog page generation
- `data/dist/basic/basic.js` — game constants, evaluates to `GameRogueData`

### 2. Static page build (`build/`)
Node.js ESM scripts that generate HTML from EJS templates:

| Script | What it produces |
|---|---|
| `prepare.mjs` | Clears `dist/`, copies `runtime/dist/` → `dist/r/runtime/`, copies `public/` → `dist/` |
| `dialog.mjs` | Individual dialog pages (`dist/dialog/{er,mainline/1,mainline/2}/...`) from `data/dist/pages/` |
| `pages.mjs` | Homepage, dialog index, chapter index pages from `data/dist/app/` |
| `sitemap.mjs` | `sitemap.xml` by walking `dist/` for `.html` files |

Key domain constants live in `build/util.mjs`: `DOMAIN_LABELS`, `DOMAIN_URL_MAP`, `SITE_BASE`, Chinese number conversion, text markup processing (color tags, ruby annotations, nickname placeholders), and SHA256-based asset cache busting (`addAssetRefs`).

EJS templates are in `page/` and use `<%- include('_footer') %>` for the shared footer.

### 3. Runtime app (`runtime/`)
Vue 3 + TypeScript app built as a Vite library (ES format). Entry: `src/bootstrap/common.ts` → `src/main.ts` → sets up app, cookie consent, privacy links, custom elements, and statistics.

The Vue app mounts into a Shadow DOM on all generated pages. It provides:
- **Cookie consent** (`src/consent/`) — reads/writes `cookie_consent` cookie, country-aware (CN users auto-consent). Gating via `_setInit`/`_waitInit` pattern so no consent-dependent logic runs before initialization.
- **Privacy consent center** — Ant Design Vue dialogs for GDPR/CCPA (`CookieConsentDialog`, `DoNotSellDialog`, `PrivacyConsentCenter`)
- **Custom elements** (`src/elements/`) — `<a11y-helper>` for accessibility, `<contact-email>` for obfuscated emails
- **Local-private** (`src/local-private/`) — scripts run during local dev to generate obfuscated contact emails. `local-process.js` runs these Node scripts and obfuscates the output.

Post-build, `obfuscate.js` runs rolldown to minify the JS bundle (original obfuscator code is commented out in favor of rolldown for speed).

### Static assets (`public/`)
Deployed verbatim to `dist/`: CSS files in `public/r/static/`, PWA icons in `public/r/assets/`, 404 page JS in `public/r/client/404page.js`, `robots.txt`, `about/`, `favicon.ico`.

### Output (`dist/`)
The final static site. Cloudflare Pages serves this via `wrangler.jsonc` with `not_found_handling: "404-page"`.
