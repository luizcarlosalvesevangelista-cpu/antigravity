"""Gera site/index.html (site publicável) a partir de src/page.html.
Uso: python3 site/src/build.py [--artifact caminho.html]"""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
g = json.load(open(os.path.join(here, 'glyphs.json')))
L = ['P', 'E', 'C', 'R', 'I1', 'A', 'T', 'I2', 'V', 'O']
NOME, NOME_CURTO = 'Luiz Evangelista', 'Luiz Evangelista'
icons = {
 '__IC_PEN__': '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M32 6 L48 30 L32 58 L16 30 Z"/><circle cx="32" cy="32" r="5"/><path d="M32 6 V27"/></svg>',
 '__IC_PANEL__': '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="6" y="10" width="52" height="38" rx="5"/><path d="M22 10 V48"/><path d="M30 22 H50 M30 30 H44 M30 38 H48"/><path d="M24 56 H40"/></svg>',
 '__IC_LP__': '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="8" y="6" width="48" height="52" rx="5"/><path d="M8 18 H56"/><path d="M16 28 H40 M16 36 H34"/><rect x="16" y="44" width="18" height="7" rx="3"/></svg>',
 '__IC_SIS__': '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="6" y="10" width="52" height="46" rx="5"/><path d="M6 22 H58 M20 6 V14 M44 6 V14"/><path d="M16 46 V38 M26 46 V32 M36 46 V40 M46 46 V30"/></svg>',
 '__IC_TV__': '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="5" y="12" width="54" height="36" rx="5"/><path d="M22 56 H42 M32 48 V56"/><rect x="40" y="30" width="12" height="12" rx="2"/></svg>'}
s = open(os.path.join(here, 'page.html')).read()
s = s.replace('__WM__', ''.join('<path d="%s"/>' % g[k] for k in ['N', 'U'] + L))
s = s.replace('__GLYPHS__', json.dumps(g)).replace('__U__', g['U']).replace('__N__', g['N'])
s = s.replace('__NOME_CURTO__', NOME_CURTO).replace('__NOME__', NOME)
for k, v in icons.items(): s = s.replace(k, v)
head, body = s.split('<!--BODY-->')
fav = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="784 2597 40 52"><rect x="784" y="2597" width="40" height="52" rx="8" fill="#0C4F7F"/><g fill="#F2F0E1"><path d="%s"/><path d="%s"/></g></svg>' % (g['N'], g['U'])
open(os.path.join(root, 'favicon.svg'), 'w').write(fav)
full = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<link rel="icon" href="favicon.svg" type="image/svg+xml">\n<meta property="og:title" content="Upe Criativo">\n'
        '<meta property="og:description" content="Branding e Redesign, Upe ERP, Upe TV, landing pages e sistemas.">\n<meta property="og:image" content="assets/img/filme-h.jpg">\n'
        + head + '\n</head>\n<body>\n' + body + '\n</body>\n</html>\n')
open(os.path.join(root, 'index.html'), 'w').write(full)
if '--artifact' in sys.argv:
    open(sys.argv[sys.argv.index('--artifact') + 1], 'w').write(s.replace('<!--BODY-->', ''))
