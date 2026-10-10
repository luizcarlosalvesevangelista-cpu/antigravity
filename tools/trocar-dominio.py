#!/usr/bin/env python3
"""Troca os endereços .web.app pelo domínio próprio da Upe em todo o projeto (depois de registrar o domínio).

  python3 tools/trocar-dominio.py upecriativo.com.br             # só mostra o que muda (nada é gravado)
  python3 tools/trocar-dominio.py upecriativo.com.br --aplicar   # grava as trocas
  python3 tools/trocar-dominio.py upecriativo.com.br --conectar  # cria os domínios no Firebase Hosting e mostra o DNS (precisa de GOOGLE_APPLICATION_CREDENTIALS)

Mapa (edite MAPA abaixo se quiser outros subdomínios). Os endereços .web.app continuam funcionando depois da troca."""
import os, re, sys, json, subprocess

if len(sys.argv) < 2 or sys.argv[1].startswith('-'):
    print(__doc__); sys.exit(1)
DOM = sys.argv[1].lower().strip().strip('/')
MAPA = {  # site do Hosting → endereço novo
    'upe-criativo': f'www.{DOM}',
    'upe-criativo-erp': f'erp.{DOM}',
    'upe-criativo-painel': f'painel.{DOM}',
    'upe-criativo-lojas': f'loja.{DOM}',
    'upe-criativo-gestao': f'gestao.{DOM}',
    'upe-criativo-tv': f'tv.{DOM}',
    'upe-criativo-lp': f'lp.{DOM}',
    'upe-criativo-sistemas': f'agenda.{DOM}',
    'upe-criativo-servicos': f'servicos.{DOM}',
}
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PASTAS = ['site', 'docs', 'tools', '.claude', 'clientes', 'README.md']
EXT = ('.html', '.js', '.mjs', '.json', '.md', '.py', '.css', '.xml', '.txt')
PULAR = ('node_modules', 'portal/kits', '/.trabalho', 'firebase.json', 'trocar-dominio.py')

def arquivos():
    for p in PASTAS:
        base = os.path.join(RAIZ, p)
        if os.path.isfile(base): yield base; continue
        for r, _, fs in os.walk(base):
            for f in fs:
                c = os.path.join(r, f)
                if c.endswith(EXT) and not any(x in c for x in PULAR): yield c

def trocar(txt):
    n = 0
    for site, novo in MAPA.items():
        txt, k = re.subn(r'\b' + re.escape(site) + r'\.web\.app\b', novo, txt); n += k
    # páginas da Upe no domínio novo não são domínio de cliente: o reconhecimento de host passa a aceitar lp.<domínio>
    alvo = r'(web\.app|firebaseapp\.com)'
    if alvo in txt and re.escape(f'lp.{DOM}') not in txt:
        txt = txt.replace(alvo, r'(web\.app|firebaseapp\.com|' + re.escape(f'lp.{DOM}') + ')'); n += 1
    return txt, n

aplicar, conectar = '--aplicar' in sys.argv, '--conectar' in sys.argv
total = 0
for c in arquivos():
    s = open(c, encoding='utf-8').read(); t, n = trocar(s)
    if n:
        total += n; print(f'{n:4d}  {os.path.relpath(c, RAIZ)}')
        if aplicar: open(c, 'w', encoding='utf-8').write(t)
print(f'\n{total} troca(s) ' + ('gravadas.' if aplicar else 'a fazer (rode com --aplicar para gravar).'))
if aplicar:
    print('Depois: python3 site/src/build.py && python3 site/portal/src/build.py, publique e autorize os domínios no login:')
    print('  cd tools/firebase && node dominios_login.js ' + ' '.join(MAPA.values()))

if conectar:
    from urllib.request import Request, urlopen
    tok = subprocess.check_output(['gcloud', 'auth', 'print-access-token']).decode().strip()
    for site, host in MAPA.items():
        url = f'https://firebasehosting.googleapis.com/v1beta1/projects/upecriativo-cc472/sites/{site}/customDomains?customDomainId={host}'
        try:
            urlopen(Request(url, data=b'{}', method='POST', headers={'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json'})).read()
            print(f'✓ {host} → {site}')
        except Exception as e:
            print(f'· {host}: {getattr(e, "code", e)} (talvez já exista)')
    print('\nRegistros de DNS: no Registro.br (ou onde o domínio estiver), crie os registros que aparecem em')
    print('https://console.firebase.google.com/project/upecriativo-cc472/hosting/sites (cada site › Domínios personalizados).')
