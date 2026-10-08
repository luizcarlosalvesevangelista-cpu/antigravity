"""Gera portal/index.html e portal/app.js a partir de src/. Uso: python3 site/portal/src/build.py [--artifact pasta]"""
import json, os, sys, re
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
g = json.load(open(os.path.join(root, '..', 'src', 'glyphs.json')))
app = open(os.path.join(here, 'app.js')).read().replace('__GLYPHS__', json.dumps({k: g[k] for k in g}))
app = open(os.path.join(root, 'modelos.js')).read() + '\n' + open(os.path.join(here, 'kit.js')).read() + '\n' + app.replace('/*__AGENDA__*/', open(os.path.join(here, 'agenda.js')).read() + '\n' + open(os.path.join(here, 'apps.js')).read() + '\n' + open(os.path.join(here, 'editor.js')).read())
shell = open(os.path.join(here, 'shell.html')).read()
head, body = shell.split('<!--BODY-->')
open(os.path.join(root, 'app.js'), 'w').write(app)
site_body = body.replace('__QR__', 'vendor/qrcode.min.js').replace('<script>__CONFIG__</script>', '<script src="config.js"></script>').replace('<script>__APP__</script>', '<script src="app.js"></script>')
open(os.path.join(root, 'index.html'), 'w').write('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<link rel="icon" href="../favicon.svg" type="image/svg+xml">\n' + head + '\n</head>\n<body>\n' + site_body + '\n</body>\n</html>\n')
if '--artifact' in sys.argv:
    out = sys.argv[sys.argv.index('--artifact') + 1]
    cfg = open(os.path.join(root, 'config.js')).read().replace('siteUrl: "../"', 'siteUrl: ""').replace('assetsDemo: "../assets/"', 'assetsDemo: "assets/"')
    crono = open(os.path.join(root, 'cronograma', 'upe-cronograma.json')).read()
    body = body.replace('<script>__CONFIG__</script>', '<script>window.UPE_CRONOGRAMA=' + crono.replace('</', '<\\/') + ';</script><script>__CONFIG__</script>')
    a = body.replace('__QR__', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js').replace('<script>__CONFIG__</script>', '<script>' + cfg + '</script>').replace('<script>__APP__</script>', '<script>' + app.replace('</script', '<\\/script') + '</script>')
    open(os.path.join(out, 'index.html'), 'w').write(head + a)
