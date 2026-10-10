#!/usr/bin/env python3
"""Liga no site/firebase.json o que depende do plano Blaze: as funções e as rotas do site upe-criativo-lp
(/api/** → função api; todas as páginas → função lpRender, que monta a landing page no servidor).
Uso: python3 tools/blaze/firebase_blaze.py            (liga)
     python3 tools/blaze/firebase_blaze.py --desligar (volta ao modo sem servidor)"""
import json, os, sys
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../site/firebase.json')
d = json.load(open(P))
REG = "southamerica-east1"
desligar = '--desligar' in sys.argv
if desligar:
    d.pop('functions', None)
else:
    d['functions'] = [{"source": "functions", "codebase": "default", "runtime": "nodejs20", "predeploy": ["bash \"$RESOURCE_DIR/preparar.sh\""], "ignore": ["node_modules", ".git", "*.log"]}]
for h in d['hosting']:
    if h['site'] != 'upe-criativo-lp':
        continue
    if desligar:
        h['ignore'] = ["**/.*"]
        h['rewrites'] = [{"source": "**", "destination": "/pagina.html"}]
    else:
        # index.html e pagina.html saem do deploy: "/" e "/<página>" passam a ser montados pela função lpRender
        h['ignore'] = ["**/.*", "index.html", "pagina.html"]
        h['rewrites'] = [{"source": "/api/**", "function": {"functionId": "api", "region": REG}},
                         {"source": "**", "function": {"functionId": "lpRender", "region": REG}}]
json.dump(d, open(P, 'w'), indent=2, ensure_ascii=False)
print(("Modo sem servidor" if desligar else "Funções e rotas do Blaze ligadas") + " em site/firebase.json")
