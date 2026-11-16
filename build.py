#!/usr/bin/env python3
"""
NyxOps static site builder (stdlib only).

Takes the page templates in src/pages/ (same Django-style syntax the original
site used) and writes a fully static site to docs/, ready for GitHub Pages.

Supported template syntax:
    {% load static %}              -> removed
    {% static 'path' %}            -> relative path to docs/static/path
    {% include 'partials/x.html' %}-> contents of src/partials/x.html
    {% csrf_token %}               -> removed (no backend)

Absolute links such as href="/services" or href="/favicon/x.png" are rewritten
to relative ones, so the site works both on a custom domain (nyxops.org) and
under a GitHub project path (username.github.io/repo/).

Pages map to pretty URLs:  about.html -> docs/about/index.html  (/about/)
                           index.html -> docs/index.html        (/)
                           404.html   -> docs/404.html

Usage:  python3 build.py
"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
PAGES = SRC / "pages"
PARTIALS = SRC / "partials"
ASSETS = ROOT / "assets"
OUT = ROOT / "docs"

# Source file name -> URL path (folder). Underscores become hyphens to match
# the original Django routes (e.g. /privacy-policy/).
SPECIAL = {"index": "", "404": None}

INCLUDE_RE = re.compile(r"{%\s*include\s+['\"]([^'\"]+)['\"]\s*%}")
STATIC_RE = re.compile(r"{%\s*static\s+['\"]([^'\"]+)['\"]\s*%}")
STRIP_RE = re.compile(r"{%\s*(load\s+static|csrf_token)\s*%}\s*")
LINK_RE = re.compile(r'(href|src|action)="/(?!/)([^"]*)"')


def url_dir(stem: str):
    if stem in SPECIAL:
        return SPECIAL[stem]
    return stem.replace("_", "-")


def render_includes(text: str, depth: int = 0) -> str:
    if depth > 5:
        raise RuntimeError("include nesting too deep")

    def sub(m):
        name = m.group(1)
        path = SRC / name if (SRC / name).exists() else PARTIALS / Path(name).name
        return render_includes(path.read_text(), depth + 1)

    return INCLUDE_RE.sub(sub, text)


def relativise(text: str, root: str) -> str:
    """Turn site-absolute links into links relative to the current page."""

    def sub(m):
        attr, target = m.group(1), m.group(2)
        # split off ?query / #fragment
        cut = min([i for i in (target.find("?"), target.find("#")) if i != -1], default=len(target))
        path, tail = target[:cut], target[cut:]
        has_ext = "." in Path(path).name
        if path and not has_ext and not path.endswith("/"):
            path += "/"  # /about -> about/
        new = (root + path) or "./"
        return f'{attr}="{new}{tail}"'

    return LINK_RE.sub(sub, text)


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()

    # Copy static assets (keep any previously built CSS out of the way; it is
    # rebuilt by Tailwind afterwards).
    for item in ASSETS.iterdir():
        dest = OUT / item.name
        if item.is_dir():
            shutil.copytree(item, dest)
        else:
            shutil.copy2(item, dest)

    count = 0
    for page in sorted(PAGES.glob("*.html")):
        stem = page.stem
        d = url_dir(stem)
        if d is None:  # 404 page lives at the root and must use absolute-ish links
            out_file, depth = OUT / "404.html", 0
        elif d == "":
            out_file, depth = OUT / "index.html", 0
        else:
            out_file, depth = OUT / d / "index.html", d.count("/") + 1

        root = "../" * depth
        html = page.read_text()
        html = render_includes(html)
        html = STRIP_RE.sub("", html)
        html = STATIC_RE.sub(lambda m: "/static/" + m.group(1), html)
        html = relativise(html, root)

        # The 404 page can be served at any depth by GitHub Pages, so it needs
        # links that work from anywhere: inject a <base> pointing at the site
        # root, computed at runtime.
        if stem == "404":
            html = html.replace(
                "<head>",
                "<head>\n    <script>(function(){var p=location.pathname.split('/');"
                "var b=location.hostname.endsWith('github.io')&&p.length>2?'/'+p[1]+'/':'/';"
                "document.write('<base href=\"'+b+'\">');})();</script>",
                1,
            )

        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(html)
        count += 1

    # GitHub Pages: don't run Jekyll over the output.
    (OUT / ".nojekyll").write_text("")
    print(f"Built {count} pages into {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    build()
