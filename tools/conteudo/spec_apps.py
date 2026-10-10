# Monta as peças do Instagram do Upe ERP e do Upe TV (textos dos kits) com modelos editáveis e datas a partir de 20/10.
import json, os, re, datetime as dt, sys
S=sys.argv[1]
parsed=json.load(open(f'{S}/content/parsed.json'))
EMO=re.compile('[\U0001F000-\U0001FAFF⌀-⏿☀-➿️‍⭐⭕]')
URL=[('upe-erp-painel.web.app','upe-criativo-painel.web.app'),('upe-erp.web.app','upe-criativo-erp.web.app'),('upe-tv.web.app','upe-criativo-tv.web.app')]
def fix(s):
    for a,b in URL: s=(s or '').replace(a,b)
    return s
def limpa(s): return re.sub(r'\s+',' ',EMO.sub('',s or '')).strip()
def frase(s,mx=130):
    s=limpa(s); m=re.match(r'^(.{15,%d}?[.!?])(\s|$)'%mx,s)
    return m.group(1) if m else (s[:mx].rsplit(' ',1)[0]+'…' if len(s)>mx else s)
def paras(leg): return [p.strip() for p in (leg or '').split('\n\n') if p.strip() and not re.match(r'^(👉|💬|📲|#)',p.strip())]
def numerados(leg): return [limpa(re.sub(r'^\d+[.)]\s*','',l)) for l in (leg or '').split('\n') if re.match(r'^\s*\d+[.)]\s+\S',l) or re.match(r'^\s*\d{1,2}/\d{1,2}\s*·',l)]
IMG={'erp':['assets/img/ui/erp-painel.jpg','assets/img/ui/erp-pdv.jpg','assets/img/ui/erp-pedidos.jpg'],'tv':['assets/img/ui/tv-tela.jpg','assets/img/ui/tv-portal.jpg','assets/img/ui/tv-tela.jpg']}
BEN={'erp':['Loja online com a sua marca','PIX com QR Code no valor certo','PDV no balcão com o mesmo estoque','Pedidos com status e rastreio','Cupons, frete e retirada','Relatórios de vendas'],'tv':['Tela cheia com vídeo, motion ou imagem','Lateral que se abre com a sua chamada','Letreiro com o nome da sua marca','QR code que leva ao WhatsApp','Relatório de cada exibição','A Upe cria e publica para você']}
CTA={'erp':'Teste 14 dias grátis','tv':'Anuncie no Upe TV'}
FIM={'erp':('Sua loja no ar em poucos dias.','Teste 14 dias grátis, sem fidelidade. Chame no WhatsApp (11) 93439-3249.'),'tv':('Sua marca na tela certa.','Fale com a Upe: WhatsApp (11) 93439-3249. Planos para anunciantes e parceiros.')}
def M(fr,layout,formato,**k):
    m=dict(frente=fr,layout=layout,formato=formato,tema=k.pop('tema','escuro'),eyebrow=k.pop('eyebrow',{'erp':'Upe ERP','tv':'Upe TV'}[fr]),titulo='',texto='',cta=CTA[fr],itens=[],imagem=IMG[fr][0],handle='@upecriativo',slide='')
    m.update(k); return m
itens=[]
for kit,fr in [('upe-erp','erp'),('upe-tv','tv')]:
    lst=[i for i in parsed[kit]['itens'] if not (i['formato']=='story' and not i['midias'])]
    lst.sort(key=lambda i:(i['data'] or '9999'))
    nf=0
    for k,i in enumerate(lst):
        leg=fix(i['legenda']); ps=paras(leg); tit=frase(ps[0] if ps else i['titulo'],110); tx=frase(ps[1],150) if len(ps)>1 else ''
        base=dict(id=f'{fr}-{k+1:02d}',frente=fr,formato=i['formato'],titulo=i['titulo'] if i['formato'] in('carrossel','story') else tit,legenda=leg,ordem=i['data'] or '9999')
        if i['formato']=='feed':
            nums=numerados(leg); lay=['capa','tela','foto','capa'][nf%4]; nf+=1
            if len(nums)>=3: m=M(fr,'lista','feed',tema='claro',titulo=tit,itens=nums[:6],texto='')
            else: m=M(fr,lay,'feed',tema='claro' if nf%4==0 else 'escuro',titulo=tit,texto=tx,imagem=IMG[fr][nf%3])
            base['slides']=[m]
        elif i['formato']=='carrossel':
            n=max(3,len(i['midias'])); nums=numerados(leg); sl=[M(fr,'capa','feed',titulo=i['titulo'],texto=frase(ps[0],120) if ps else '',cta='Arraste para o lado',slide=f'1/{n}')]
            meio=n-2
            for j in range(meio):
                if j<len(nums): sl.append(M(fr,'capa','feed',tema='claro',eyebrow=f'{j+1:02d}',titulo=nums[j],texto='',cta='',slide=f'{j+2}/{n}'))
                else:
                    p=ps[1+j-len(nums)] if 1+j-len(nums)<len(ps) else ''
                    sl.append(M(fr,'tela','feed',tema='claro' if j%2 else 'escuro',titulo=frase(p,90) if p else BEN[fr][j%6],texto='',cta='',imagem=IMG[fr][j%3],slide=f'{j+2}/{n}'))
            sl.append(M(fr,'cta','feed',titulo=FIM[fr][0],texto=FIM[fr][1],slide=f'{n}/{n}'))
            base['slides']=sl
        elif i['formato']=='story':
            q=re.findall(r'[“"]([^”"]{6,80})[”"]',i['legenda'] or ''); n=max(1,len(i['midias']))
            ts=[q[0]] if q else [re.sub(r'\s*\(.*?\)','',re.sub(r'^[\d ea]+\s*·\s*','',i['titulo'])).replace('Vídeo em 2 minutos','Veja a plataforma em 2 minutos')]
            sl=[]
            for j in range(n):
                t0=('Tem novidade na tela.' if ts[0].strip().lower()=='novidade' else ts[0]) if j==0 else ['Sua marca merece ser vista.','Quem espera, olha para a tela.','Do QR code ao WhatsApp em segundos.','Relatório de cada exibição.','Fale com a Upe.'][j%5] if fr=='tv' else ts[0]
                dica=(i['legenda'] or '').lower(); tx0='Vote na enquete.' if 'enquete' in dica else 'Toque no link e veja.' if 'link' in dica else 'Mande a sua pergunta.' if 'pergunta' in dica else ''
                sl.append(M(fr,['capa','tela','capa','foto','cta'][j%5],'story',titulo=t0,texto=tx0 if j==0 else '',imagem=IMG[fr][j%3],cta=CTA[fr] if j==n-1 else ''))
            base['slides']=sl; base['legenda']=fix(i['legenda'])
        elif i['formato']=='reels':
            p2=[frase(p,80) for p in ps[1:4]]
            base['slides']=[M(fr,'tela','story',titulo=tit,texto=p2[0] if p2 else '',imagem=IMG[fr][k%3])]
            base['reel']=dict(cenas=[M(fr,'capa','story',titulo=tit,texto='',cta=''),M(fr,'tela','story',titulo=p2[0] if p2 else tit,texto='',cta='',imagem=IMG[fr][k%3]),M(fr,'tela','story',tema='claro',titulo=p2[1] if len(p2)>1 else 'Tudo num só lugar.',texto='',cta='',imagem=IMG[fr][(k+1)%3]),M(fr,'cta','story',titulo=FIM[fr][0],texto=FIM[fr][1])])
        itens.append(base)
# datas a partir de 20/10/2026: ERP terça e quinta; TV quarta e sexta; reels às 19h; stories às 10h no dia seguinte
D=dt.date(2026,10,20)
def slots(fr):
    d=D
    dias={'erp':(1,3),'tv':(2,4)}[fr]
    while True:
        if d.weekday() in dias: yield d
        d+=dt.timedelta(days=1)
for fr in ('erp','tv'):
    posts=[i for i in itens if i['frente']==fr and i['formato'] in('feed','carrossel','reels')]; posts.sort(key=lambda i:i['ordem'])
    st=[i for i in itens if i['frente']==fr and i['formato']=='story']; st.sort(key=lambda i:i['ordem'])
    g=slots(fr)
    for p in posts: d=next(g); p['data']=d.isoformat(); p['hora']='19:00' if p['formato']=='reels' else '12:00'
    for j,s in enumerate(st): s['data']=(D+dt.timedelta(days=(0 if fr=='erp' else 1)+j*7)).isoformat(); s['hora']='10:00'
json.dump(itens,open(f'{S}/apps_spec.json','w'),ensure_ascii=False,indent=1)
from collections import Counter
print(len(itens),Counter((i['frente'],i['formato']) for i in itens)); print(min(i['data'] for i in itens),max(i['data'] for i in itens)); print(sum(len(i['slides']) for i in itens),'imagens')
