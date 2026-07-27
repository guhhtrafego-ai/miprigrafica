# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static HTML/CSS/JS site (no framework, no build step, no npm dependencies) for **Mipri Gráfica Express**, a print shop in São Paulo. Deployed as-is to GoDaddy shared hosting (Apache). There is no server-side code and no database.

## Commands

There is no build/lint/test tooling in this repo — it's plain static files. To preview locally:

```
npx serve -l 5500 .
```

(also defined in `.claude/launch.json`). **Caveat:** this plain static server does not process `.htaccess`, so clean URLs (`/servicos/impressao-digital`), the `.html` → clean-URL redirects, and the category-merge redirects will *not* work locally — you'll only be able to browse via the real `.html` filenames (e.g. `/servicos/impressao-digital.html`). Test clean-URL routing against the real GoDaddy/Apache deployment.

## Deployment

Deployment is **manual**, not CI/CD: build a zip of the deployable files and upload it through the GoDaddy cPanel File Manager (Upload → Extract). The zip must **not** include dev-only content: `midiaserviços/`, `midiaserviços_BACKUP_ORIGINAL/`, `.git/`, `.claude/`, `inventario-fotos-midiaservicos.csv`, `LOGOFAVICON.jpg`, `README.md`.

**Known pitfall:** a zip built with Windows PowerShell's `Compress-Archive` stores entry paths with backslashes (`img\servicos\...`), which silently breaks/truncates extraction on GoDaddy's Linux server (folders show up empty or with epoch timestamps). Build deployment zips with a tool that writes forward-slash paths instead (e.g. Node's `archiver` package with `zlib` level 9), never `Compress-Archive` or Windows Explorer's "Send to > Compressed folder".

## Architecture

### No templating — every page is a fully self-contained HTML file

There is no include/partial system. The `<head>` boilerplate, the inline `<svg>` icon sprite (`#icon-whatsapp`, `#icon-instagram`, `#icon-location`, `#icon-mail`, `#icon-check`, `#icon-arrow-up`), the `<header>` with nav dropdown, the `<footer>`, and the lightbox markup are **duplicated verbatim in every single `.html` file**. The icon sprite is inline (not an external `.svg` file) specifically so pages still render correctly when opened directly via `file://` — `<use href="icons.svg#...">` doesn't work in that context.

This means: any change to the nav menu, footer links, or footer contact info must be applied to **every** `.html` file (root pages + everything in `servicos/`), not just one. There is no single source of truth to edit.

### Clean URLs via `.htaccess`

Apache `mod_rewrite` in `.htaccess` does three things:
1. Redirects `*.html` requests to the extension-less URL (301), including `/index.html` → `/`.
2. Internally rewrites the clean URL back to the real `.html` file when serving (so the browser bar keeps showing `/servicos/impressao-digital` while the server actually reads `servicos/impressao-digital.html`).
3. Holds 301 redirects for retired/merged category slugs (see below) so old links and bookmarks don't 404.

All internal links, canonical tags, and asset paths (`css/`, `js/`, `img/`) use **root-absolute paths** (`/css/style.css`, `/img/logo.png`), not relative ones — this matters because `servicos/*.html` pages are one directory level deeper than root pages, and clean URLs change the effective path depth further.

### The services catalog: three layers that must stay in sync

1. **Per-category subpages** (`servicos/*.html`) — one file per category, each with its own `product-grid` of `product-card` divs (photo + gallery thumbnails + specs + a WhatsApp deep-link pre-filled with a message). Current categories: `impressao-digital`, `comunicacao-visual`, `plotagem-projetos`, `digitalizacao`, `brindes-corporativos`, `materiais-eventos`, `paineis-displays`, `materiais-obras`. `digitalizacao` and `materiais-eventos` currently have no products (they show a `product-catalog-placeholder` message instead of a grid).
2. **The combined catalog**, embedded identically in both `index.html` (Home) and `servicos.html` (services index) — a single `product-grid` containing **every** product card from every category subpage, each tagged `data-category="<slug>"`, filtered client-side by category pills (`#homeCategoryFilter`) and a text search box (`#productSearch`). Categories with zero products are excluded from these pills (no point filtering to an empty grid).
3. Both layers must be rebuilt together whenever products move between categories, get added/removed, or a category is merged/split — there is no single source; the combined catalog's cards are a **duplicate copy**, not a reference, of the subpage cards. Category renames/merges historically also required updating: the nav dropdown + footer link list (all files), the `shop-categories` pill row on every subpage, `.htaccess` redirects for the old slug, and `sitemap.xml`.

Product images live at `img/servicos/<category-slug>/<product-slug>-<n>.<ext>` (mixed `.jpg`/`.jpeg`/`.webp`, no fixed convention — whatever the source photo was, resized to a reasonable web size).

### `js/main.js`

Single IIFE, no modules/bundler. Independent, self-guarding sections (each checks `if (elementExists)` before wiring up, so the same script runs unmodified on every page regardless of what that page contains):
- Mobile nav toggle
- Hero carousel (Home only)
- Active nav-link highlighting by current path
- Contact form: posts to `FORM_ENDPOINT` (a Google Apps Script Web App URL) if set, otherwise falls back to opening a pre-filled `mailto:`. `FORM_ENDPOINT` is currently empty.
- WhatsApp link click tracking (pushes to `dataLayer` for GTM)
- Lightbox for product photo galleries (any `.product-card`'s `.gallery-item` buttons, scoped per-card)
- Catalog filtering: category pills (`data-filter` buttons) + text search (`#productSearch`), combinable, diacritic-insensitive (NFD-normalizes and strips combining marks so "cartao" matches "Cartão")

### `css/style.css`

Single stylesheet, CSS custom properties for the brand palette (`--teal`, `--teal-dark`, `--cyan`/`--magenta`/`--yellow`/`--key` for the CMYK-strip brand motif). Sectioned top to bottom (reset/variables → CMYK bar → header → hero → services grid → shop/product-catalog styles → responsive breakpoints at the very end). `--teal` and friends are authoritative — the color extracted from the logo JPG is intentionally *not* used as a reference (compression artifacts made it inaccurate).

### `midiaserviços/`

A raw source-photo library (organized by Portuguese product-category folder names), separate from `img/servicos/` which holds the actual optimized site assets. Photos get copied/resized from here into `img/servicos/<category>/` when adding products — this folder itself is never referenced by the site. `midiaserviços_BACKUP_ORIGINAL/` is a gitignored, unmodified backup of the originals.

## Content already baked into every page

- WhatsApp: `5511949810102` / `(11) 94981-0102`
- Emails: `mipri@miprigrafica.com` (general), `plotagem@miprigrafica.com` (plotting)
- Address: Av. Bosque da Saúde, 1911 - Vila da Saúde, São Paulo - SP, 04142-092
- CNPJ: `34.840.394/0001-08`
- GTM container: `GTM-KDVPL68S`
- Canonical domain: `https://www.miprigrafica.com/`

## `manutencao.html`

A standalone maintenance/holding page (`noindex, nofollow`, not linked from any nav) — it deliberately does **not** share the header/footer/nav pattern used elsewhere. To put it live, swap it with `index.html` in `public_html` on the host (rename `index.html` → something else, rename `manutencao.html` → `index.html`); reverse to restore the real site.
