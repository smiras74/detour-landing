#!/usr/bin/env python3
"""Génère index.html (fr) + en/ de/ ru/ à partir de index.tpl.html et strings.py.
Usage : python3 _src/build.py   (depuis la racine du repo)"""
import json, html, os, re, sys, time
sys.path.insert(0, os.path.dirname(__file__))
from strings import S

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://guide-du-detour.fr"
LANGS = ["fr", "en", "de", "ru"]
PATH = {"fr": "/", "en": "/en/", "de": "/de/", "ru": "/ru/"}
PRIVACY = {"fr": "/confidentialite.html", "en": "/en/privacy.html", "de": "/en/privacy.html", "ru": "/en/privacy.html"}
tpl = open(os.path.join(ROOT, "_src/index.tpl.html"), encoding="utf-8").read()
ver = time.strftime("%Y%m%d%H%M")

def page(lang):
    t = dict(S[lang])
    t["lang"] = lang
    t["ver"] = ver
    t["home"] = PATH[lang]
    t["canonical"] = BASE + PATH[lang]
    t["privacy_url"] = PRIVACY[lang]
    t["hreflang"] = "\n".join(
        f'<link rel="alternate" hreflang="{l}" href="{BASE}{PATH[l]}">' for l in LANGS
    ) + f'\n<link rel="alternate" hreflang="x-default" href="{BASE}/">'
    t["langswitch"] = "".join(
        f'<a href="{PATH[l]}" hreflang="{l}" lang="{l}"' + (' aria-current="page"' if l == lang else "") + f'>{l.upper()}</a>'
        for l in LANGS
    )
    t["faq_html"] = "\n    ".join(
        f"<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>" for q, a in t["faq"]
    )
    ld = [
        {"@context": "https://schema.org", "@type": "MobileApplication", "name": "Guide du Détour",
         "operatingSystem": "iOS", "applicationCategory": "TravelApplication", "inLanguage": LANGS,
         "description": t["meta_desc"], "url": t["canonical"],
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
         "publisher": {"@type": "Organization", "name": "Détours Studio"}},
        {"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": lang,
         "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in t["faq"]]},
    ]
    t["ldjson"] = json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")
    out = tpl
    for k, v in t.items():
        if isinstance(v, str):
            out = out.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{\w+\}\}", out)
    if left:
        raise SystemExit(f"{lang}: clés manquantes {sorted(set(left))}")
    return out

for lang in LANGS:
    dest = os.path.join(ROOT, PATH[lang].strip("/"), "index.html") if lang != "fr" else os.path.join(ROOT, "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(page(lang))
    print("ok", dest)

# ---- pages légales ----
ltpl = open(os.path.join(ROOT, "_src/legal.tpl.html"), encoding="utf-8").read()
ldir = os.path.join(ROOT, "_src/legal")
for fn in sorted(os.listdir(ldir)):
    raw = open(os.path.join(ldir, fn), encoding="utf-8").read()
    head, body = re.match(r"<!--(.*?)-->\s*(.*)", raw, re.S).groups()
    meta = dict(l.split(":", 1) for l in head.strip().splitlines())
    meta = {k.strip(): v.strip() for k, v in meta.items()}
    out = ltpl
    for k, v in {**meta, "path": meta["dest"], "ver": ver, "body": body.rstrip()}.items():
        out = out.replace("{{" + k + "}}", v)
    if re.search(r"\{\{\w+\}\}", out):
        raise SystemExit(f"{fn}: clés manquantes")
    dest = os.path.join(ROOT, meta["dest"].lstrip("/"))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(out)
    print("ok", dest)
