# Peças de Upe Landing pages e Upe Sistemas (Instagram, Shorts e vídeo do YouTube) com os modelos editáveis.
import json, os, sys, datetime as dt
S=sys.argv[1]
U='assets/img/ui/'
I={'ed':U+'lp-editor.jpg','an':U+'lp-analise.jpg','pg':U+'lp-pagina.jpg','ld':U+'lp-leads.jpg','agc':U+'ag-celular.jpg','agc2':U+'ag-celular-2.jpg','agp':U+'ag-painel.jpg','dash':U+'dash-painel.jpg'}
CFG={'landing':dict(ey='Upe Landing pages',cta='Quero a minha página',link='upe-criativo-lp.web.app',tags='#landingpage #paginadevendas #marketingdigital #trafegopago #leads #empreendedorismo #pequenosnegocios #vendasonline #upecriativo',
  fim=('Sua página no ar em poucos dias.','Criação a partir de R$ 497. Hospedagem com painel a partir de R$ 29,90 por mês.')),
 'sistemas':dict(ey='Upe Sistemas',cta='Quero a minha agenda',link='upe-criativo-sistemas.web.app',tags='#agendaonline #agendamento #dashboard #gestao #clinica #estudio #salaodebeleza #pequenosnegocios #empreendedorismo #upecriativo',
  fim=('Menos tempo no WhatsApp. Mais clareza no negócio.','Agenda online e dashboards sob medida, feitos pela Upe.'))}
def M(fr,layout,formato='feed',**k):
    c=CFG[fr];m=dict(frente=fr,layout=layout,formato=formato,tema=k.pop('tema','escuro'),eyebrow=k.pop('eyebrow',c['ey']),titulo='',texto='',cta=c['cta'],itens=[],imagem='',handle='@upecriativo',slide='')
    m.update(k); return m
def leg(fr,*ps): c=CFG[fr]; return "\n\n".join(ps)+f"\n\n👉 Conheça: {c['link']}\n💬 WhatsApp (11) 93439-3249\n📲 Siga @upecriativo\n\n{c['tags']}"
FIM=lambda fr,slide='':M(fr,'cta',titulo=CFG[fr]['fim'][0],texto=CFG[fr]['fim'][1],slide=slide)
itens=[]
def add(id,fr,formato,titulo,legenda,slides,reel=None):
    it=dict(id=id,frente=fr,formato=formato,titulo=titulo,legenda=legenda,slides=slides)
    if reel: it['reel']=reel
    itens.append(it)

# ---------- Landing pages ----------
L='landing'
add('lp-01',L,'feed','A página que vende, com o painel que mostra o que funciona.',leg(L,'A página que vende, com o painel que mostra o que funciona. 🚀','A Upe cria a sua landing page ou você envia o HTML pronto. Você edita os textos sem programar e acompanha visitas, cliques e leads.'),
    [M(L,'capa',titulo='A página que vende, com o painel que mostra o que funciona.',texto='Landing pages com a sua marca, domínio próprio e resultados no painel.')])
add('lp-02',L,'feed','Mudou a oferta? Muda a página em um minuto.',leg(L,'Mudou a oferta? Muda a página em um minuto. ✏️','Clique no texto da prévia e escreva. O rascunho fica separado do que está no ar: você só publica quando estiver pronto.'),
    [M(L,'tela',titulo='Mudou a oferta? Muda a página em um minuto.',texto='Clique no texto e escreva. Publique quando quiser.',imagem=I['ed'])])
add('lp-03',L,'feed','Saiba de onde vêm os seus clientes.',leg(L,'Saiba de onde vêm os seus clientes. 📊','Visitas por dia, visitantes únicos, cliques nos botões, até onde leram e a origem de cada visita: Instagram, Google ou anúncio.'),
    [M(L,'tela',tema='claro',titulo='Saiba de onde vêm os seus clientes.',texto='Visitas, cliques, leads e origem no painel.',imagem=I['an'])])
add('lp-05',L,'feed','Cada formulário vira um lead no painel.',leg(L,'Cada formulário vira um lead no painel. 📥','Com data, origem e um botão para chamar no WhatsApp. Dá para marcar quem virou cliente e baixar tudo em planilha.'),
    [M(L,'tela',titulo='Cada formulário vira um lead no painel.',texto='Com origem, situação e atalho para o WhatsApp.',imagem=I['ld'])])
add('lp-07',L,'feed','Já tem a página pronta? Envie o HTML.',leg(L,'Já tem a página pronta? Envie o HTML. 📄','Você sobe o arquivo e a página vai ao ar com análise de visitas, leads e domínio próprio funcionando.'),
    [M(L,'capa',tema='claro',titulo='Já tem a página pronta? Envie o HTML.',texto='Ela vai ao ar com análise, leads e domínio próprio.')])
add('lp-09',L,'feed','www.suamarca.com.br abrindo a sua página.',leg(L,'www.suamarca.com.br abrindo a sua página. 🔒','Conectamos o seu domínio com você e a página abre com cadeado (HTTPS). Até lá, ela já funciona no endereço da Upe.'),
    [M(L,'foto',titulo='Seu domínio abrindo a sua página.',texto='Com cadeado (HTTPS), conectado com a ajuda da Upe.',imagem=I['pg'])])
add('lp-04',L,'carrossel','Sua landing page em 4 passos',leg(L,'Sua landing page em 4 passos. 👇','1. Escolha o plano\n2. A Upe cria (ou você envia o HTML)\n3. Revise os textos no painel\n4. Publique e acompanhe os resultados'),
    [M(L,'capa',titulo='Sua landing page em 4 passos',texto='Do pedido à página no ar.',cta='Arraste para o lado',slide='1/6')]+
    [M(L,'capa',tema='claro',eyebrow=f'{j+1:02d}',titulo=a,texto=b,cta='',slide=f'{j+2}/6') for j,(a,b) in enumerate([('Escolha o plano','Criação essencial, completa ou envio do seu HTML.'),('A Upe cria a página','Com a sua marca, formulário e botão de WhatsApp.'),('Revise no painel','Clique no texto e ajuste. Peça mudanças por lá.'),('Publique e acompanhe','Visitas, cliques e leads, todos os dias.')])]+[FIM(L,'6/6')])
add('lp-06',L,'carrossel','O que vem no painel das landing pages',leg(L,'O que vem no painel das landing pages. 🧭','Editor visual, análise de resultados, leads, domínio próprio, SEO, Meta Pixel e Google Analytics, e versões para voltar atrás quando quiser.'),
    [M(L,'capa',titulo='O que vem no painel',texto='Tudo para a sua página vender mais.',cta='Arraste para o lado',slide='1/6'),
     M(L,'tela',titulo='Editor visual',imagem=I['ed'],cta='',slide='2/6'),M(L,'tela',tema='claro',titulo='Análise de resultados',imagem=I['an'],cta='',slide='3/6'),
     M(L,'tela',titulo='Leads organizados',imagem=I['ld'],cta='',slide='4/6'),M(L,'lista',tema='claro',titulo='E mais',itens=['Domínio próprio com HTTPS','SEO no Google','Meta Pixel e Google Analytics','Versões para voltar atrás'],cta='',slide='5/6'),FIM(L,'6/6')])
add('lp-s1',L,'story','Enquete: a sua página converte?',leg(L,'Stories: enquete + link.'),
    [M(L,'capa','story',titulo='Você sabe quantos visitantes viram cliente?',texto='Vote na enquete.',cta=''),M(L,'tela','story',titulo='No painel, você sabe.',imagem=I['an'],cta=''),FIM(L)|dict(formato='story',texto='Toque no link e fale com a Upe.')])
add('lp-s2',L,'story','Bastidores: editando uma página',leg(L,'Stories: bastidores do editor + link.'),
    [M(L,'tela','story',titulo='Trocar um título leva 10 segundos.',imagem=I['ed'],cta=''),M(L,'foto','story',titulo='E a página fica assim.',imagem=I['pg'],cta=''),FIM(L)|dict(formato='story',texto='Toque no link.')])
def reel(fr,id,titulo,texto,cenas):
    add(id,fr,'reels',titulo,leg(fr,titulo+' 🎬',texto),[M(fr,'tela','story',titulo=titulo,imagem=cenas[0][1],cta='')],
        dict(dur=3,cenas=[M(fr,'capa','story',titulo=titulo,texto='',cta='')]+[M(fr,'tela','story',tema=tm,titulo=t,imagem=im,cta='') for t,im,tm in cenas]+[FIM(fr)|dict(formato='story')]))
reel(L,'lp-08','Da página ao lead em segundos.','O visitante chega pelo anúncio, lê a página e preenche o formulário. O lead aparece no painel com a origem.',[('A página com a sua marca.',I['pg'],'escuro'),('O lead no painel.',I['ld'],'claro')])
reel(L,'lp-10','Edite sem programar.','Clique no texto e escreva. Publique quando estiver pronto. Volte para qualquer versão anterior.',[('Clique e escreva.',I['ed'],'escuro'),('Acompanhe os resultados.',I['an'],'claro')])

# ---------- Sistemas ----------
X='sistemas'
add('sis-01',X,'feed','Seu cliente marca o horário sozinho.',leg(X,'Seu cliente marca o horário sozinho. 📅','Agenda online com os seus serviços, duração e preço. O horário escolhido sai da página na hora: sem dois clientes no mesmo horário.'),
    [M(X,'tela',titulo='Seu cliente marca o horário sozinho.',texto='Agenda online com serviços, horários e confirmação pelo WhatsApp.',imagem=I['agc'])])
add('sis-02',X,'feed','Menos “tem horário?” no WhatsApp.',leg(X,'Menos “tem horário?” no WhatsApp. 💬','Coloque o link da agenda na bio, no Google e na mensagem automática. O cliente escolhe e você só confirma.'),
    [M(X,'capa',titulo='Menos “tem horário?” no WhatsApp.',texto='Mais horários marcados, de dia ou de noite.')])
add('sis-03',X,'feed','A agenda do dia, organizada.',leg(X,'A agenda do dia, organizada. 🗂️','Próximos agendamentos por dia, confirmar, cancelar, marcar atendido ou falta, e mensagem pronta no WhatsApp.'),
    [M(X,'tela',tema='claro',titulo='A agenda do dia, organizada.',texto='Confirmar, cancelar e avisar pelo WhatsApp.',imagem=I['agp'])])
add('sis-05',X,'feed','Os números do negócio num painel só.',leg(X,'Os números do negócio num painel só. 📈','Faturamento, atendimentos, vendas e leads em números grandes, gráficos e rankings. Atualiza sozinho a partir da sua planilha ou da agenda.'),
    [M(X,'tela',titulo='Os números do negócio num painel só.',texto='Dashboards sob medida, que se atualizam sozinhos.',imagem=I['dash'])])
add('sis-07',X,'feed','Qual serviço mais vende? Quem mais falta?',leg(X,'Qual serviço mais vende? Quem mais falta? 🤔','Perguntas que um dashboard responde em segundos. A Upe define os indicadores com você.'),
    [M(X,'lista',tema='claro',titulo='Perguntas que um dashboard responde',itens=['Quanto entrou este mês?','Qual serviço mais vende?','Quantos clientes faltaram?','De onde vêm os novos clientes?'])])
add('sis-09',X,'feed','Agenda online e dashboards feitos pela Upe.',leg(X,'Agenda online e dashboards feitos pela Upe. ✅','A Upe configura, você usa. Criação única e mensalidade para manter no ar, sem fidelidade.'),
    [M(X,'capa',titulo='Agenda online e dashboards feitos pela Upe.',texto='A Upe configura, você usa. Sem fidelidade.')])
add('sis-04',X,'carrossel','Como funciona a agenda online',leg(X,'Como funciona a agenda online. 👇','1. Escolha o serviço\n2. Escolha o dia\n3. Escolha o horário\n4. Confirme pelo WhatsApp'),
    [M(X,'capa',titulo='Como funciona a agenda online',texto='Do link na bio ao horário marcado.',cta='Arraste para o lado',slide='1/6')]+
    [M(X,'capa',tema='claro',eyebrow=f'{j+1:02d}',titulo=a,texto=b,cta='',slide=f'{j+2}/6') for j,(a,b) in enumerate([('O cliente escolhe o serviço','Com duração e preço.'),('Escolhe o dia','Só aparecem os dias com horário livre.'),('Escolhe o horário','O horário sai da página na hora.'),('Você confirma','Com mensagem pronta no WhatsApp.')])]+[FIM(X,'6/6')])
add('sis-06',X,'carrossel','O que um dashboard mostra',leg(X,'O que um dashboard mostra. 📊','Números grandes, barras por dia ou mês, rankings e tabelas, com os indicadores que importam para o seu negócio.'),
    [M(X,'capa',titulo='O que um dashboard mostra',texto='Os números do negócio, sem abrir cinco planilhas.',cta='Arraste para o lado',slide='1/5'),
     M(X,'tela',titulo='Indicadores e gráficos',imagem=I['dash'],cta='',slide='2/5'),M(X,'lista',tema='claro',titulo='De onde vêm os dados',itens=['Sua planilha do Google','A agenda online','Suas landing pages'],cta='',slide='3/5'),
     M(X,'capa',tema='escuro',eyebrow='Atualização',titulo='Mudou a planilha, mudou o painel.',texto='Sem copiar e colar.',cta='',slide='4/5'),FIM(X,'5/5')])
add('sis-s1',X,'story','Enquete: quantas mensagens para marcar um horário?',leg(X,'Stories: enquete + link.'),
    [M(X,'capa','story',titulo='Quantas mensagens você troca para marcar um horário?',texto='Responda na enquete.',cta=''),M(X,'tela','story',titulo='Com a agenda online, nenhuma.',imagem=I['agc'],cta=''),FIM(X)|dict(formato='story',texto='Toque no link.')])
add('sis-s2',X,'story','Bastidores: um dashboard por dentro',leg(X,'Stories: bastidores do dashboard + link.'),
    [M(X,'tela','story',titulo='Assim fica o painel de um estúdio.',imagem=I['dash'],cta=''),M(X,'tela','story',titulo='E a agenda do dia.',imagem=I['agp'],cta=''),FIM(X)|dict(formato='story',texto='Toque no link.')])
reel(X,'sis-08','Marcar horário em 3 toques.','Serviço, dia e horário. O cliente agenda sozinho e você confirma pelo WhatsApp.',[('Escolhe o serviço e o dia.',I['agc'],'escuro'),('Confirma os dados.',I['agc2'],'claro')])
reel(X,'sis-10','O negócio num painel só.','Atendimentos, faturamento e serviços mais vendidos, atualizados sozinhos.',[('A agenda do dia.',I['agp'],'escuro'),('Os números do mês.',I['dash'],'claro')])

# ---------- vídeos do YouTube (16:9, 8 cenas de 5 s) ----------
def V(fr,l,**k): return M(fr,l,'video',**k)
add('lp-yt',L,'youtube','Upe Landing pages: a página que vende, com painel de resultados',
    'Conheça o Upe Landing pages: a Upe cria a sua página de vendas (ou você envia o HTML), você edita sem programar, conecta o domínio e acompanha visitas, cliques e leads.\n\n👉 upe-criativo-lp.web.app\n💬 WhatsApp (11) 93439-3249\n\nCapítulos:\n0:00 Abertura\n0:05 A página\n0:10 Editor\n0:15 Análise\n0:20 Leads\n0:25 Domínio próprio\n0:30 SEO e Pixel\n0:35 Como contratar\n\n#landingpage #marketingdigital #upecriativo',
    [V(L,'foto',titulo='Landing pages com painel de resultados',texto='',imagem=I['ed'],cta='')],
    dict(dur=5,cenas=[V(L,'capa',titulo='Upe Landing pages',texto='A página que vende, com o painel que mostra o que funciona.',cta=''),V(L,'tela',titulo='Sua página com a sua marca',texto='Criada pela Upe ou enviada por você.',imagem=I['pg'],cta=''),
      V(L,'tela',tema='claro',titulo='Edite sem programar',texto='Clique no texto e escreva.',imagem=I['ed'],cta=''),V(L,'tela',titulo='Saiba o que funciona',texto='Visitas, cliques e origem.',imagem=I['an'],cta=''),
      V(L,'tela',tema='claro',titulo='Leads organizados',texto='Com atalho para o WhatsApp.',imagem=I['ld'],cta=''),V(L,'capa',titulo='Seu domínio, com HTTPS',texto='A Upe conecta com você.',cta=''),
      V(L,'lista',tema='claro',titulo='E mais',itens=['SEO no Google','Meta Pixel e Google Analytics','Versões para voltar atrás'],cta=''),V(L,'cta',titulo='Sua página no ar em poucos dias',texto='upe-criativo-lp.web.app · WhatsApp (11) 93439-3249')]))
add('sis-yt',X,'youtube','Upe Sistemas: agenda online e dashboards sob medida',
    'Conheça o Upe Sistemas: agenda online para o seu cliente marcar horário sozinho e dashboards com os números do seu negócio, montados pela Upe.\n\n👉 upe-criativo-sistemas.web.app\n💬 WhatsApp (11) 93439-3249\n\nCapítulos:\n0:00 Abertura\n0:05 Agenda online\n0:10 Escolha do horário\n0:15 Agenda do dia\n0:20 Dashboards\n0:25 Indicadores\n0:30 De onde vêm os dados\n0:35 Como contratar\n\n#agendaonline #dashboard #upecriativo',
    [V(X,'foto',titulo='Agenda online e dashboards sob medida',texto='',imagem=I['dash'],cta='')],
    dict(dur=5,cenas=[V(X,'capa',titulo='Upe Sistemas',texto='Agenda online e dashboards sob medida.',cta=''),V(X,'tela',titulo='Seu cliente marca sozinho',texto='Serviço, dia e horário pelo celular.',imagem=I['agc'],cta=''),
      V(X,'tela',tema='claro',titulo='Sem dois no mesmo horário',texto='O horário sai da página na hora.',imagem=I['agc2'],cta=''),V(X,'tela',titulo='A agenda do dia',texto='Confirmar, cancelar e avisar no WhatsApp.',imagem=I['agp'],cta=''),
      V(X,'tela',tema='claro',titulo='Os números num painel só',texto='Faturamento, atendimentos e serviços.',imagem=I['dash'],cta=''),V(X,'lista',titulo='Indicadores sob medida',itens=['Faturamento do mês','Serviços mais vendidos','Faltas e cancelamentos'],cta=''),
      V(X,'lista',tema='claro',titulo='De onde vêm os dados',itens=['Sua planilha do Google','A agenda online','Suas landing pages'],cta=''),V(X,'cta',titulo='Menos tempo no WhatsApp',texto='upe-criativo-sistemas.web.app · WhatsApp (11) 93439-3249')]))

# ---------- datas: a partir de 21/10. Landing pages: quarta e domingo 18h; Sistemas: terça e sexta 18h30; stories 10h; reels 19h ----------
D0=dt.date(2026,10,21)
def dias(wds):
    d=D0
    while True:
        if d.weekday() in wds: yield d
        d+=dt.timedelta(days=1)
ORD={'landing':['lp-01','lp-02','lp-04','lp-03','lp-08','lp-05','lp-06','lp-07','lp-10','lp-09'],'sistemas':['sis-01','sis-02','sis-04','sis-03','sis-08','sis-05','sis-06','sis-07','sis-10','sis-09']}
for fr,wds,h in [('landing',(2,6),'18:00'),('sistemas',(1,4),'18:30')]:
    g=dias(wds)
    for i in ORD[fr]:
        it=next(x for x in itens if x['id']==i); it['data']=next(g).isoformat(); it['hora']='19:00' if it['formato']=='reels' else h
for i,(sid,d) in enumerate([('lp-s1','2026-10-22'),('lp-s2','2026-11-05'),('sis-s1','2026-10-23'),('sis-s2','2026-11-06')]):
    it=next(x for x in itens if x['id']==sid); it['data']=d; it['hora']='10:00'
for sid,d in [('lp-yt','2026-11-03'),('sis-yt','2026-11-10')]:
    it=next(x for x in itens if x['id']==sid); it['data']=d; it['hora']='18:00'
json.dump(itens,open(f'{S}/novos_spec.json','w'),ensure_ascii=False,indent=1)
print(len(itens),sum(len(i['slides']) for i in itens),'imagens', min(i['data'] for i in itens), max(i['data'] for i in itens))
