# dmsjtum.github.io

Personal academic site. Static HTML, no build step, no framework.

## Local preview

```bash
python3 -m http.server 8199
```

## Structure

```
index.html      Home — name specimen, bio, news timeline, selected work
research.html   Papers, grouped by area
project.html    HOP detail page (template for future paper pages)
about.html      Statement, education, awards
assets/
  paper.css     The whole design system. Tokens live at the top.
  paper.js      Theme toggle, filters, copy buttons. Site works without it.
  fonts/        Signifier Regular — LICENSED, see below
files/
  cv.pdf        Public CV (no phone number — built with \webtrue)
  HOP.pdf       RSS 2026 paper
```

## Fonts

Three typefaces, each with one job:

| Role | Face | Source |
|---|---|---|
| Display (name, page titles) | **Signifier Regular** | Klim Type Foundry — licensed |
| Prose and subheads | Source Sans 3 | Google Fonts (OFL) |
| Nav, dates, metadata, cards | system `ui-monospace` | built in |

`assets/fonts/signifier-regular.woff2` is covered by a **Klim web licence**
(order 26080032, 5,000 monthly unique users, domain `dmsjtum.github.io`).

> **Do not** commit this font to a public repo other than this one, re-host it
> elsewhere, or hand the file to anyone. The licence covers this site only.
> Invoice: `../Info/licences/`.

If the site moves to a custom domain, email Klim to update the licensed domain.

## Updating the CV

The CV lives at `../Info/cv/cv.tex` and builds two ways:

```bash
pdflatex cv.tex                    # full version, with phone → for applications
sed 's/\\webfalse/\\webtrue/' cv.tex > cv-web.tex && pdflatex cv-web.tex
```

The `\webtrue` build drops the phone number. Only that one goes in `files/`.

## Deploying

Pushes to `main` publish automatically via GitHub Pages
(Settings → Pages → Deploy from branch → `main` / root).
