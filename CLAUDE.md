# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static site generator for [bh3text.com](https://www.bh3text.com/) — a browsable archive of Honkai Impact 3rd dialogue/text content in Chinese.

## Commands

```bash
npm run build              # Full build: submodule data + site
npm run build-submodule    # Build only the data submodule (data/)
npm run build-only         # Build only the site from pre-built data
```

There are no tests or linters. Formatting is handled by Prettier (config in `.prettierrc`: tabs=4, single quotes, trailing commas, print width 100).

## Architecture

### Two-repo structure

The `data/` directory is a **git submodule** (repo `bh3text-data`). It has its own `build.js` that processes raw JSON game data into `data/dist/`. The main build calls the submodule build first, then consumes the output.

### Build pipeline (ESM, `build/`)

All build code is ESM (Node.js `"type": "module"`). The orchestration is linear:

1. **`build/index.mjs`** — entry point; calls prepare → dialog → pages → sitemap in sequence
2. **`build/prepare.mjs`** — wipes `dist/` contents (preserving the directory itself to avoid breaking CWD for any process inside it), then creates output subdirectories and copies static assets: `page/r/` → `dist/r/`, `public/` → `dist/`
3. **`build/dialog.mjs`** — generates every individual dialog HTML page. Handles three distinct data shapes:
   - **Main1** (`main.json`): stages are arrays, one page per stage section
   - **Main2** (`main2.json`): stages are dicts keyed by type (Main/Companion/Celebrition/Branch/Entrust), content matched by `series` field
   - **ER** (Elysian Realm): special handling — loads `data/dist/dialog/data/er/{chapter}.json` and `data/dist/dialog/index/er.json`
   - Dialog text runs through `procText()` for color tags, ruby annotations, and placeholder substitution (nicknames)
   - Pages get prev/next navigation and breadcrumb "up" links
4. **`build/pages.mjs`** — generates three kinds of index pages:
   - Home page (`dist/index.html`) — module listing
   - Dialog index (`dist/dialog/index.html`) — arc/chapter listing for main1+main2, with ER inserted at the right position
   - Chapter index pages — per-chapter listing of all dialog sections
5. **`build/sitemap.mjs`** — walks `dist/` for `.html` files, generates `sitemap.xml` with `https://www.bh3text.com` as base
6. **`build/util.mjs`** — shared helpers: Chinese numeral conversion (`toCnText`/`toChapterNumber`), domain label/URL maps, ER chapter loader (evaluates `data/dist/basic/basic.js` which is a self-executing JS data file), text markup processor (`procText`)

### Templates (`page/`)

EJS templates rendered at build time:
- `_footer.ejs` — shared footer partial included by other templates
- `home.ejs` — site homepage
- `dialog.ejs` — individual dialog page (the core template; handles step blocks, dialog lines with actors/content, CG blocks)
- `dialog-index.ejs` — dialog domain index with grouped chapter listing
- `chapter-index.ejs` — per-chapter section listing

### Static files (`public/`)

Files copied as-is to `dist/`: `robots.txt`, etc.

### Static assets (`page/r/static/`)

CSS files: `basic.css`, `style.css`, `home.css`, `dialog-index.css`, `chapter-index.css`, `dialogue.css`.

### Data domains

The site organizes dialog into these domains (see `DOMAIN_LABELS` and `DOMAIN_URL_MAP` in `build/util.mjs`):

| Key    | Label          | URL path         |
|--------|----------------|------------------|
| main   | 主线第一部      | /dialog/mainline/1/ |
| main2  | 主线第二部      | /dialog/mainline/2/ |
| er     | 往世乐土       | /dialog/er/       |
| ow     | 开放世界       | /dialog/ow/       |
| ex     | 编年史         | /dialog/ex/       |
| novel  | 小说           | /dialog/novel/    |

Currently only `main`, `main2`, and `er` are actively generated. The other domains (`ow`, `ex`, `novel`) exist in the constants but have no build logic wired up.

### Output structure (`dist/`)

```
dist/
  index.html              # Home page
  robots.txt
  sitemap.xml
  r/static/*.css          # Static assets
  dialog/
    index.html            # Dialog domain index
    er/{chapter}/{id}.html
    er/{chapter}/index.html
    mainline/1/{chapter}/{id}.html
    mainline/1/{chapter}/index.html
    mainline/2/{chapter}/{stage_type}{n}.html
    mainline/2/{chapter}/index.html
```

## Git submodule

`data/` is a submodule pointing to `https://github.com/mtxc26/bh3text-data`. After cloning, run `git submodule update --init`. The submodule has its own Node.js build that must be run before the main build can consume its output.
