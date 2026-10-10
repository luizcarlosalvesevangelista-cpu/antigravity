# Peças da Loja Upe (Instagram, Shorts e vídeo do YouTube) com os modelos editáveis. Textos a partir da página upe-criativo-lojas.web.app.
import json, os, sys
S=sys.argv[1]
I={'vit':'assets/img/ui/loja-vitrine.jpg','prods':'assets/img/ui/loja-produtos.jpg','pix':'assets/img/ui/loja-pix.jpg','ped':'assets/img/ui/loja-pedido.jpg','prod':'assets/img/ui/loja-produto.jpg'}
def M(layout,formato='feed',**k):
    m=dict(frente='loja',layout=layout,formato=formato,tema=k.pop('tema','escuro'),eyebrow=k.pop('eyebrow','Loja Upe'),titulo='',texto='',cta='Monte a sua loja',itens=[],imagem=I['vit'],handle='@upecriativo',slide='')
    m.update(k); return m
RODA=("\n\n👉 Conheça: upe-criativo-lojas.web.app\n💬 WhatsApp (11) 93439-3249\n📲 Siga @upecriativo\n\n"
      "#lojavirtual #lojaonline #vendasonline #pix #empreendedorismo #pequenosnegocios #ecommerce #vendermais #lojaupe #upecriativo")
def leg(*ps): return "\n\n".join(ps)+RODA
FIM=M('cta',titulo='Sua loja no ar em poucos dias.',texto='Teste 14 dias grátis. Depois, R$ 29,99 por mês, sem fidelidade.')
itens=[]
def add(id,formato,data,hora,titulo,legenda,slides,reel=None):
    it=dict(id=id,frente='loja',formato=formato,data=data,hora=hora,titulo=titulo,legenda=legenda,slides=slides)
    if reel: it['reel']=reel
    itens.append(it)
# feed
add('loja-01','feed','2026-10-20','18:00','A loja online da sua marca, pronta para vender.',
    leg('A loja online da sua marca, pronta para vender. 🛍️','Vitrine, carrinho, PIX e acompanhamento do pedido para o seu cliente. PDV, estoque e gestão de pedidos para você. Tudo num lugar só, por R$ 29,99 por mês.','Teste 14 dias grátis.'),
    [M('capa',titulo='A loja online da sua marca, pronta para vender.',texto='Vitrine, carrinho, PIX e pedido acompanhado. Tudo por R$ 29,99 por mês.')])
add('loja-02','feed','2026-10-26','18:00','O cliente paga no PIX, com o valor certo.',
    leg('O cliente paga no PIX, com o valor certo. 💸','Cada pedido gera o QR Code e o copia e cola com o valor exato. Se quiser, dê um desconto para quem paga no PIX. Cartão por link e boleto também.'),
    [M('tela',titulo='O cliente paga no PIX, com o valor certo.',texto='QR Code e copia e cola em cada pedido.',imagem=I['pix'])])
add('loja-03','feed','2026-10-31','18:00','Sua marca na vitrine. Não a nossa.',
    leg('Sua marca na vitrine. Não a nossa. ✨','Logotipo, cores e até 3 banners no topo da loja. O cliente vê a sua loja, com o seu endereço.'),
    [M('tela',tema='claro',titulo='Sua marca na vitrine. Não a nossa.',texto='Logotipo, cores e até 3 banners no topo.',imagem=I['vit'])])
add('loja-05','feed','2026-11-09','18:00','Para o seu cliente, comprar fica simples.',
    leg('Para o seu cliente, comprar fica simples. 📱','Vitrine com busca e categorias, compra sem cadastro, endereço que se completa pelo CEP, PIX na hora e link para acompanhar o pedido até a entrega.'),
    [M('lista',tema='claro',titulo='Para o seu cliente, comprar fica simples.',itens=['Vitrine com busca e categorias','Compra sem cadastro','Endereço completo pelo CEP','PIX na hora, com desconto se você quiser','Link para acompanhar o pedido'])])
add('loja-07','feed','2026-11-16','18:00','Recebido, confirmado, enviado.',
    leg('Recebido, confirmado, enviado. 📦','O cliente acompanha cada etapa pelo link do pedido, com o código de rastreio. Sem precisar perguntar “cadê meu pedido?”.'),
    [M('tela',titulo='Recebido, confirmado, enviado.',texto='O cliente acompanha pelo link, sem precisar perguntar.',imagem=I['ped'])])
add('loja-09','feed','2026-11-23','18:00','R$ 29,99 por mês. Sem fidelidade.',
    leg('R$ 29,99 por mês. Sem fidelidade. ✅','Teste 14 dias grátis. Depois, um valor só, e você cancela quando quiser. Domínio próprio, backup e frete calculado entram só se você contratar.'),
    [M('capa',tema='claro',titulo='R$ 29,99 por mês. Sem fidelidade.',texto='Teste 14 dias grátis. Adicionais como domínio próprio só se você contratar.')])
# carrosséis
c1=[('Fale com a Upe','Chame no WhatsApp e liberamos o seu acesso ao painel.'),('Coloque a sua marca','Logotipo, cores e até 3 banners no topo.'),('Cadastre os produtos','Foto, preço, estoque e variações.'),('Configure PIX e entrega','Chave PIX, frete, retirada e horários.'),('Compartilhe o link','A loja abre no seu endereço. É só divulgar.')]
add('loja-04','carrossel','2026-11-02','18:00','Monte a sua loja em 5 passos',
    leg('Monte a sua loja em 5 passos. 👇','1. Fale com a Upe no WhatsApp\n2. Coloque logotipo, cores e banners\n3. Cadastre os produtos\n4. Configure PIX e entrega\n5. Compartilhe o link e comece a vender'),
    [M('capa',titulo='Monte a sua loja em 5 passos',texto='Do primeiro acesso ao primeiro pedido.',cta='Arraste para o lado',slide='1/7')]+
    [M('capa',tema='claro',eyebrow=f'{j+1:02d}',titulo=a,texto=b,cta='',slide=f'{j+2}/7') for j,(a,b) in enumerate(c1)]+[dict(FIM,slide='7/7')])
c2=[('tela',I['vit'],'Vitrine com busca, categorias e ofertas.','escuro'),('tela',I['prod'],'Página de produto com foto e estoque.','claro'),('tela',I['pix'],'PIX com QR Code no valor certo.','escuro'),('tela',I['ped'],'Pedido acompanhado pelo link.','claro')]
add('loja-06','carrossel','2026-11-14','18:00','O que vem na Loja Upe',
    leg('O que vem na Loja Upe. 🛒','Vitrine, página de produto, PIX com QR Code, pedido acompanhado e cupons de desconto. E, no painel, PDV, estoque e gestão de pedidos.'),
    [M('capa',titulo='O que vem na Loja Upe',texto='Tudo o que uma loja precisa, sem complicação.',cta='Arraste para o lado',slide='1/7')]+
    [M(l,tema=tm,titulo=t,texto='',cta='',imagem=im,slide=f'{j+2}/7') for j,(l,im,t,tm) in enumerate(c2)]+
    [M('capa',tema='escuro',eyebrow='Cupons',titulo='Cupons de desconto',texto='Porcentagem, valor fixo ou frete grátis, com validade e limite de usos.',cta='',slide='6/7'),dict(FIM,slide='7/7')])
# stories
add('loja-s1','story','2026-10-21','10:00','Enquete: sua loja online por R$ 29,99?',
    leg('Stories: enquete + link.'),
    [M('capa','story',titulo='Você teria uma loja online por R$ 29,99 por mês?',texto='Vote na enquete.',cta=''),M('tela','story',titulo='O cliente paga no PIX.',imagem=I['pix'],cta=''),M('cta','story',titulo='Teste 14 dias grátis.',texto='Toque no link e fale com a Upe.')])
add('loja-s2','story','2026-11-04','10:00','Bastidores: a vitrine de uma loja',
    leg('Stories: bastidores da vitrine + link.'),
    [M('tela','story',titulo='Já pensou na sua vitrine assim?',imagem=I['prods'],cta=''),M('tela','story',titulo='O pedido, do carrinho até a entrega.',imagem=I['ped'],cta=''),M('cta','story',titulo='Sua loja no ar em poucos dias.',texto='Toque no link.')])
# reels (também viram Shorts)
def reel(id,data,titulo,texto,cenas):
    add(id,'reels',data,'19:00',titulo,leg(titulo+' 🎬',texto),[M('tela','story',titulo=titulo,imagem=cenas[1][1],cta='')],
        dict(dur=3,cenas=[M('capa','story',titulo=titulo,texto='',cta='')]+[M('tela','story',tema=tm,titulo=t,imagem=im,cta='') for t,im,tm in cenas]+[M('cta','story',titulo='Sua loja no ar em poucos dias.',texto='Teste 14 dias grátis. WhatsApp (11) 93439-3249.')]))
reel('loja-08','2026-11-21','Da vitrine ao PIX em segundos.','O cliente escolhe, informa a entrega e paga no PIX com o QR Code. Sem cadastro, sem complicação.',
     [('Vitrine com a sua marca.',I['prods'],'escuro'),('PIX com QR Code.',I['pix'],'claro')])
reel('loja-10','2026-11-30','Seu cliente acompanha o pedido.','Recebido, confirmado, enviado e rastreio: tudo no link do pedido.',
     [('Produto com foto e estoque.',I['prod'],'escuro'),('Status e rastreio no link.',I['ped'],'claro')])
# vídeo do YouTube 16:9 (8 cenas de 5 s) + capa
V=lambda l,**k: M(l,'video',**k)
cen=[V('capa',titulo='Loja Upe: a loja online da sua marca',texto='Do cadastro ao primeiro pedido, em 40 segundos.',cta=''),
     V('tela',titulo='Sua marca na vitrine',texto='Logotipo, cores e até 3 banners.',imagem=I['vit'],cta=''),
     V('tela',tema='claro',titulo='Busca, categorias e ofertas',texto='O cliente encontra rápido o que procura.',imagem=I['prods'],cta=''),
     V('tela',titulo='Produto com foto e estoque',texto='Preço conferido pelo seu cadastro.',imagem=I['prod'],cta=''),
     V('tela',tema='claro',titulo='PIX com QR Code',texto='Valor certo em cada pedido. Cartão por link e boleto também.',imagem=I['pix'],cta=''),
     V('tela',titulo='Pedido acompanhado',texto='Recebido, confirmado, enviado e rastreio.',imagem=I['ped'],cta=''),
     V('lista',tema='claro',titulo='E no seu painel',itens=['PDV no balcão com o mesmo estoque','Cupons de desconto','Relatórios e base de clientes'],cta=''),
     V('cta',titulo='Teste 14 dias grátis',texto='Depois, R$ 29,99 por mês, sem fidelidade. WhatsApp (11) 93439-3249.')]
add('loja-yt','youtube','2026-10-27','18:00','Loja Upe: a loja online da sua marca, do cadastro ao primeiro pedido',
    'Conheça a Loja Upe: vitrine com a sua marca, compra sem cadastro, PIX com QR Code e pedido acompanhado pelo link. No painel, PDV, estoque, cupons e relatórios.\nTeste 14 dias grátis, depois R$ 29,99 por mês, sem fidelidade.\n\n👉 upe-criativo-lojas.web.app\n💬 WhatsApp (11) 93439-3249\n\nCapítulos:\n0:00 Abertura\n0:05 Vitrine\n0:10 Busca e categorias\n0:15 Produto\n0:20 PIX\n0:25 Pedido\n0:30 Painel\n0:35 Como testar\n\n#lojavirtual #lojaonline #pix #ecommerce #lojaupe #upecriativo',
    [V('foto',titulo='Loja Upe: a loja online da sua marca',texto='',imagem=I['vit'],cta='')], dict(dur=5,cenas=cen))
json.dump(itens,open(f'{S}/loja_spec.json','w'),ensure_ascii=False,indent=1)
print(len(itens),sum(len(i['slides']) for i in itens),'imagens')
