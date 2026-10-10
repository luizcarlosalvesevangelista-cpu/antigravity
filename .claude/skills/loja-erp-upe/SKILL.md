---
name: loja-erp-upe
description: Cria a página inicial personalizada (capa) ou um site com vitrine para uma loja do Upe ERP. O HTML mostra os produtos, preços, promoções e estoque reais do painel do lojista, tem carrinho e finaliza a compra na loja (PIX, cartão, frete e cupom) ou pelo WhatsApp, e quando o servidor estiver ligado também com pagamento direto. Use ao montar, adaptar ou revisar o site, a capa ou a página de produtos de um cliente que vende pelo Upe ERP.
---

# Loja ERP Upe

Objetivo: um **HTML com o visual da marca** que puxa os produtos do Upe ERP em tempo real. Dois usos:

- **Capa da loja**: quem abre `upe-criativo-lojas.web.app/<loja>` vê esta página. A vitrine padrão continua em “Ver todos os produtos” (`?vitrine=1`).
- **Site ou landing page da marca** com vitrine embutida, no endereço da Upe ou no domínio próprio.

Os dois sobem pelo Painel Upe Serviços e usam o Kit Upe. O contrato completo está em `docs/KIT-UPE.md`.

## Antes de escrever

- **Endereço da loja** (o que vem depois de `upe-criativo-lojas.web.app/`). Sem ele, não há produtos.
- Categorias usadas no painel do ERP (campo “classe”/categoria do produto): servem para `data-categoria`.
- IDs de produtos que devem aparecer em destaque (opcional; aparecem no endereço `/p/<id>` da loja).
- Modo de compra: `loja` (padrão, recomendado: frete, cupom, PIX com QR e pedido no painel do lojista), `whatsapp` (pedido pronto no WhatsApp) ou `gateway` (pagamento na própria página: só depois do plano Blaze).
- Identidade visual: cores, fontes, logotipo (link), banners (links).

## Fluxo

1. Parta de `modelo-loja.html` (nesta pasta) ou do HTML que o cliente já tem.
2. Estrutura recomendada:
   - topo com logo, busca opcional e carrinho (`data-upe-carrinho`);
   - banner;
   - ofertas (`data-upe-produtos data-destaque`);
   - uma seção por categoria (`data-upe-produtos data-categoria="…"`);
   - diferenciais (entrega, retirada, pagamento);
   - prova social;
   - rodapé com WhatsApp, endereço e “Ver todos os produtos” (`data-upe-link="loja"`).
3. Cards de produto no visual da marca: use `<template>` dentro de `data-upe-produtos`.
   - Campos: `data-campo="imagem|nome|preco|preco-de|categoria|descricao|estoque"`.
   - Botões: `data-upe-acao="carrinho|comprar|whatsapp|ver"`.
   - O kit preenche os campos e cuida de esgotado, promoção (`preco-de` riscado) e estoque.
4. **Nunca digite preços nem nomes de produtos à mão** nas seções de vitrine: eles vêm do ERP e mudam no painel do lojista. Texto livre só em banners e chamadas.
5. Links de produto: `data-upe-link="produto:<id>"`. Vitrine completa: `data-upe-link="loja"`. Abrir carrinho: `data-upe-link="carrinho"`.
6. Deixe `<html data-upe-loja="<loja>" data-upe-compra="loja">` no HTML (as Ligações do painel têm prioridade).
7. Mesmas regras de qualidade das landing pages: um arquivo, celular primeiro, imagens por link, ≤ 880 KB, acessibilidade. Detalhes na habilidade `landing-pages-upe`.
8. **Valide**: `node tools/validar-html.js capa.html --loja <loja>`.
9. **Entrega**:
   1. Painel Upe Serviços › Páginas › Nova página › Enviar o meu arquivo .html.
   2. SEO e integrações › Ligações: loja = endereço da loja, modo de compra.
   3. Publicar.
   4. Para virar a capa da loja: **Usar esta página como página inicial da loja** (só a Upe faz).

## Como a compra funciona (para explicar ao cliente)

- O carrinho fica no navegador do visitante e respeita o estoque.
- **Finalizar compra** leva os itens para a loja (`/<loja>?add=id:qtd,…`): lá o cliente informa a entrega, aplica cupom e paga (PIX com QR no valor certo, cartão por link, boleto, conforme o lojista configurou). O pedido cai no painel do Upe ERP como qualquer pedido da loja.
- **Pedido pelo WhatsApp** monta a mensagem com itens, quantidades e total.
- **Pagamento direto** (gateway): só aparece quando a Upe ligar o servidor e o pagamento online (plano Blaze + Mercado Pago). Até lá, o kit cai para “Finalizar compra”.

## Checklist

- [ ] Endereço da loja confirmado (o validador e o painel mostram “✓ Loja encontrada”)
- [ ] Vitrines com `data-upe-produtos`, sem preço digitado à mão
- [ ] Carrinho visível no topo ou flutuante (`data-upe-carrinho`)
- [ ] Link “Ver todos os produtos” (`data-upe-link="loja"`) e WhatsApp no rodapé
- [ ] Testado no celular: cards legíveis, botão “Adicionar” com ≥ 44 px
- [ ] `node tools/validar-html.js` sem ✗
