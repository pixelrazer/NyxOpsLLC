# NyxOps — static website

Static version of the NyxOps site (no backend), built for GitHub Pages.

## Layout

```
src/pages/       Page templates (one file per page; `about.html` -> /about/)
src/partials/    Shared navbar + footer
src/style.css    Tailwind source (design tokens)
assets/          Images, icons, favicon, JS (copied as-is)
  static/js/config.js   <- form settings (see below)
build.py         Stdlib-only builder: src + assets -> docs/
docs/            Built site (this is what GitHub Pages serves — commit it)
```

## Build

```bash
npm install          # first time only (Tailwind CLI)
npm run build        # python3 build.py + compile Tailwind CSS
npm run serve        # preview at http://localhost:8000
```

Always run `npm run build` after editing anything in `src/` or `assets/`, then commit `docs/`.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo → Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, Folder: `/docs`.
3. Custom domain (optional): add `nyxops.org` in the Pages settings, or create `assets/CNAME`
   containing `nyxops.org` and rebuild.

All links are relative, so the site works on `username.github.io/repo/` and on a custom domain.

## Forms (contact + intake)

There's no backend, so forms either:

- **POST to a form service**: set `formEndpoint` in `assets/static/js/config.js`
  (e.g. a Formspree endpoint `https://formspree.io/f/xxxx`), or
- **fall back to email**: if `formEndpoint` is empty, submitting opens the visitor's
  email client with a pre-filled message to `csectld@proton.me`.
