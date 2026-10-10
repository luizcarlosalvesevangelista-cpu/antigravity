# Junta no cronograma: posts da Loja Upe (Instagram), vídeo e Shorts da Loja no YouTube, e troca os Shorts do ERP/TV sem mídia pelos reels gerados.
import json, os,sys
S=sys.argv[1]; P=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../..')+'/site/portal/cronograma/upe-cronograma.json'
d=json.load(open(P)); novos=json.load(open(f'{S}/loja_spec.out.json')); by={x['id']:x for x in d['itens']}
d['itens']=[x for x in d['itens'] if not (x['id'].startswith('app-loja-') or x['id'].startswith('upe-loja-'))]
yt=lambda s:s.replace('Link na bio.','Link na descrição.').replace('Link na bio','Link na descrição')
for n in novos:
    base=dict(data=n['data'],hora=n['hora'],titulo=n['titulo'],legenda=n['legenda'],roteiro='',midias=n['midias'],capa=n.get('capa',''),status='planejado',modelo=n['slides'])
    if n['formato']=='youtube':
        d['itens'].append(dict(base,id='upe-loja-yt',canal='youtube',formato='youtube',pilar='YouTube',origem='Vídeo Loja Upe',capa='kits/loja-upe/gerado/loja-yt-capa.jpg'))
        continue
    d['itens'].append(dict(base,id='app-'+n['id'],canal='instagram',formato=n['formato'],pilar='Loja Upe',origem='Kit Loja Upe'))
    if n['formato']=='reels':
        sh={'loja-08':'2026-11-22','loja-10':'2026-12-06'}[n['id']]
        d['itens'].append(dict(base,id='upe-loja-sh-'+n['id'][-2:],canal='youtube',formato='shorts',pilar='YouTube',origem='YouTube Shorts',data=sh,hora='12:00',legenda=yt(n['legenda']),modelo=None))
# Shorts do ERP/TV: usa os reels gerados (mesmo tema), sábados 12h a partir de 24/10
MAP=[('upe-011','app-tv-05'),('upe-022','app-tv-10'),('upe-033','app-tv-27'),('upe-044','app-tv-20'),('upe-055','app-tv-25'),('upe-066','app-tv-15'),('upe-076','app-erp-05'),('upe-085','app-erp-10'),('upe-092','app-erp-15')]
import datetime as dt
for k,(a,b) in enumerate(MAP):
    x=next(i for i in d['itens'] if i['id']==a); r=by[b]
    x.update(midias=r['midias'],capa=r['capa'],titulo=r['titulo'],legenda=yt(r['legenda']),data=(dt.date(2026,10,24)+dt.timedelta(days=7*k)).isoformat(),hora='12:00')
x=next(i for i in d['itens'] if i['id']=='upe-018'); x.update(data='2026-10-20',hora='18:00')
for x in d['itens']:
    if x.get('modelo') is None: x.pop('modelo',None)
d['itens'].sort(key=lambda x:(x.get('data') or '9999',x.get('hora') or ''))
d['versao']=4
json.dump(d,open(P,'w'),ensure_ascii=False,indent=1)
import os
falta=[(x['id'],m) for x in d['itens'] for m in x.get('midias',[])+[x.get('capa') or ''] if m and not m.startswith('{') and not os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)),'../..')+'/site/portal/'+m)]
print('total',len(d['itens']),'faltando',falta)
