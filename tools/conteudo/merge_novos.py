# Junta no cronograma os posts de Upe Landing pages e Upe Sistemas (Instagram), os vídeos e os Shorts no YouTube.
import json,sys,os
from PIL import Image
S=sys.argv[1]; R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../..')+'/site/portal/'; P=R+'cronograma/upe-cronograma.json'
d=json.load(open(P)); novos=json.load(open(f'{S}/novos_spec.out.json'))
PIL={'landing':'Landing pages','sistemas':'Upe Sistemas'}; ORIG={'landing':'Kit Landing pages','sistemas':'Kit Upe Sistemas'}
pref=('app-lp-','app-sis-','upe-lp-','upe-sis-')
d['itens']=[x for x in d['itens'] if not x['id'].startswith(pref)]
SH={'lp-08':'2026-11-08','lp-10':'2026-11-29','sis-08':'2026-11-01','sis-10':'2026-11-15'}
yt=lambda s:s.replace('Link na bio','Link na descrição')
for n in novos:
    base=dict(data=n['data'],hora=n['hora'],titulo=n['titulo'],legenda=n['legenda'],roteiro='',midias=n['midias'],capa=n.get('capa',''),status='planejado',modelo=n['slides'])
    if n['formato']=='youtube':
        cap=n['midias'][0].replace('.mp4','-capa.jpg'); src=R+n['capa'] if n.get('capa') else None
        if src and os.path.exists(src): Image.open(src).resize((1280,720),Image.LANCZOS).save(R+cap,quality=88)
        d['itens'].append(dict(base,id='upe-'+n['id'],canal='youtube',formato='youtube',pilar='YouTube',origem='Vídeo '+PIL[n['frente']],capa=cap)); continue
    d['itens'].append(dict(base,id='app-'+n['id'],canal='instagram',formato=n['formato'],pilar=PIL[n['frente']],origem=ORIG[n['frente']]))
    if n['formato']=='reels':
        x=dict(base,id='upe-'+n['id']+'-sh',canal='youtube',formato='shorts',pilar='YouTube',origem='YouTube Shorts',data=SH[n['id']],hora='12:00',legenda=yt(n['legenda'])); x.pop('modelo',None); d['itens'].append(x)
d['itens'].sort(key=lambda x:(x.get('data') or '9999',x.get('hora') or ''))
d['versao']=5
json.dump(d,open(P,'w'),ensure_ascii=False,indent=1)
falta=[(x['id'],m) for x in d['itens'] for m in x.get('midias',[])+[x.get('capa') or ''] if m and not m.startswith('{') and not os.path.exists(R+m)]
print('total',len(d['itens']),'faltando',falta)
