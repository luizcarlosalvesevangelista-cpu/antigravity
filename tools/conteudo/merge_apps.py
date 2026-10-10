import json,sys
S=sys.argv[1]; P=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../..')+'/site/portal/cronograma/upe-cronograma.json'
d=json.load(open(P)); novos=json.load(open(f'{S}/apps_spec.out.json'))
URL=[('upe-erp-painel.web.app','upe-criativo-painel.web.app'),('upe-erp-lojas.web.app','upe-criativo-lojas.web.app'),('upe-erp.web.app','upe-criativo-erp.web.app'),('upe-tv.web.app','upe-criativo-tv.web.app')]
def fix(s):
    for a,b in URL: s=s.replace(a,b)
    return s
antes=len(d['itens'])
velhos=[x for x in d['itens'] if x.get('canal')!='youtube' and x.get('pilar') in ('Upe ERP','Upe TV')]
d['itens']=[x for x in d['itens'] if x not in velhos]
FMT={'reels':'reels','feed':'feed','carrossel':'carrossel','story':'story'}
for n in novos:
    d['itens'].append(dict(id='app-'+n['id'],data=n['data'],hora=n['hora'],canal='instagram',formato=FMT[n['formato']],pilar={'erp':'Upe ERP','tv':'Upe TV'}[n['frente']],titulo=n['titulo'],legenda=n['legenda'],roteiro='',midias=n['midias'],capa=n.get('capa',''),status='planejado',origem={'erp':'Kit Upe ERP','tv':'Kit Upe TV'}[n['frente']],modelo=n['slides']))
for x in d['itens']:
    for k in ('legenda','roteiro','titulo'):
        if isinstance(x.get(k),str): x[k]=fix(x[k])
for e in d.get('extras',[]): e['texto']=fix(e['texto'])
d['itens'].sort(key=lambda x:(x.get('data') or '9999',x.get('hora') or ''))
d['versao']=3
json.dump(d,open(P,'w'),ensure_ascii=False,indent=1)
print('antes',antes,'removidos',len(velhos),'novos',len(novos),'total',len(d['itens']))
