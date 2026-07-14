# Loupe — product website

The marketing website for **Loupe** (https://github.com/winchxyz/loupe): a static, dependency-light site in the
app's own **"Engineer Grid"** identity — flat off-white, hairlines, monochrome ink, one prism accent, the red
reticle, Inter + JetBrains Mono. Four pages: landing, features, prompt gallery, download.

## Stack
- Plain HTML + CSS + vanilla JS. **No build step.**
- Self-hosted fonts (Inter + JetBrains Mono, `assets/fonts/*.woff2`) — no Google Fonts request.
- All paths are **relative** (`styles.css`, `main.js`, `assets/…`, `features.html`) → works at a domain root
  *or* a GitHub Pages sub-path (`user.github.io/<repo>/`).
- One external runtime dependency: GSAP + ScrollTrigger from cdnjs (scroll reveals), loaded over https.

## Files
- `index.html`, `features.html`, `gallery.html`, `download.html` — the four pages.
- `styles.css` — the whole design system (tokens 1:1 with `app/src/styles.css`).
- `main.js` — nav, scroll reveals, copy-to-clipboard, the interactive `/flow` prompt builder, the static grid bg.
- `assets/` — `fonts/` (self-hosted woff2), `brand/` (lens marks + favicon), `img/` (app screenshots),
  `video/` (`loupe-demo.mp4` hero clip).

## Run locally
Any static server from this folder:
```
python -m http.server 8099      # → http://localhost:8099
```

## Deploy to GitHub Pages (separate repo)
1. Create a new public repo, e.g. `loupe-website`.
2. From this folder:
   ```
   git init
   git add .
   git commit -m "Loupe website"
   git branch -M main
   git remote add origin https://github.com/winchxyz/loupe-website.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` / `/ (root)` → Save.
4. Live in ~1 min at `https://winchxyz.github.io/loupe-website/`.
   - `.nojekyll` (included) makes Pages serve every file verbatim (no Jekyll processing).
   - Custom domain later: Settings → Pages → Custom domain (adds a `CNAME` file).

Works on Netlify / Vercel / Cloudflare Pages too (drag-and-drop this folder; no build command).

## Notes
- The download buttons point at `github.com/winchxyz/loupe/releases/latest` — binaries appear there once the
  first release is tagged.
- `styles.css.dark-bak` is a backup and is gitignored (won't ship).
- Every claim on the site is meant to stay true to the shipped app; if the product changes, update the copy.
