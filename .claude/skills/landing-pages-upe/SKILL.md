---
name: landing-pages-upe
description: Cria ou adapta a landing page de um cliente da Upe Criativo para subir no Painel Upe Serviços já pronta. A página sai com leads no painel, botão e links de WhatsApp, produtos da loja do Upe ERP, serviços da agenda, SEO e domínio próprio. Use sempre que for montar, converter ou revisar o HTML de uma landing page, página de vendas, página de captura ou site de uma página para cliente Upe.
---

# Landing pages Upe

Objetivo: entregar um **arquivo HTML único** que, ao subir no Painel Upe Serviços (Páginas › Nova página › Enviar o meu arquivo .html), já funciona com tudo da plataforma:

- formulário que vira lead;
- WhatsApp;
- produtos e carrinho da loja do Upe ERP;
- serviços e agendamento da agenda online;
- medição, SEO, Pixel com aviso de cookies e domínio próprio.

O contrato completo do HTML com a plataforma está em `docs/KIT-UPE.md`. Leia antes de começar.

## Fluxo

1. **Briefing** (pergunte só o que faltar): marca e cores, oferta principal, público, prova social, chamada principal (lead, WhatsApp, compra ou agendamento), se tem loja no Upe ERP (endereço) e/ou agenda online (endereço), WhatsApp, domínio desejado.
2. **Estrutura**, nesta ordem salvo motivo forte:
   1. topo com a promessa e a chamada principal;
   2. prova (números, logos, depoimentos);
   3. benefícios;
   4. como funciona;
   5. oferta: produtos (`data-upe-produtos`) ou serviços (`data-upe-servicos`) ou preços;
   6. formulário ou agendamento;
   7. perguntas frequentes;
   8. rodapé com contato.
3. **Escreva o HTML** a partir de `modelo-base.html` (nesta pasta), trocando conteúdo e visual. Regras:
   - Um arquivo só, CSS no `<style>` do `<head>`, fonte do Google Fonts no máximo com 2 pesos, sem frameworks pesados.
   - Celular primeiro: `<meta name="viewport" …>`, tipografia fluida (`clamp`), alvos de toque ≥ 44 px, sem rolagem lateral.
   - Imagens por **link https** (site do cliente, CDN, Drive público convertido em link direto). Nada de base64 grande. Limite do arquivo: 880 KB.
   - Cores da marca em variáveis no `:root`, incluindo `--upe-cor` (cor dos botões que o Kit gera).
   - Acessibilidade: `lang="pt-BR"`, um `<h1>`, `alt` em todas as imagens, contraste AA, `label` nos campos.
   - Textos em português do Brasil, frases curtas, chamada clara. Sem prometer o que o cliente não entrega.
4. **Ligue à plataforma** com os atributos do Kit (detalhes em `docs/KIT-UPE.md`):
   - Formulários: campos com `name` e um `whatsapp`, `telefone` ou `email`; sem `action`. Mensagem: `data-mensagem`; redirecionamento: `data-obrigado`.
   - WhatsApp: `<a data-upe-link="whatsapp" data-mensagem="…">`.
   - Produtos da loja: `<div data-upe-produtos data-limite="6"></div>` (ou com `<template>` no visual da página) e `<div data-upe-carrinho data-flutuante></div>`.
   - Serviços e agenda: `<div data-upe-servicos></div>` ou `<div data-upe-agenda></div>`.
   - Navegação: `data-upe-link="inicio|loja|agenda|produto:<id>|carrinho"`.
   - Se souber a loja e a agenda, deixe também no `<html data-upe-loja="…" data-upe-agenda="…">`. No painel, as Ligações têm prioridade.
5. **Não coloque no HTML** o que a plataforma faz sozinha: medição, botão flutuante de WhatsApp, Meta Pixel e Google Analytics (vão em SEO e integrações, com aviso de cookies), nem o `upe-kit.js`.
6. **Valide**: `node tools/validar-html.js pagina.html [--loja x] [--agenda y]`. Corrija todo ✗. Para cada ⚠, corrija ou justifique.
7. **Confira no navegador** se puder: celular (390 px) e computador (1440 px), sem rolagem lateral.
8. **Entrega**: salve como `clientes/<cliente>/landing-<nome>.html` (ou onde o usuário pedir) e informe o passo a passo:
   1. Painel Upe Serviços (https://upe-criativo-servicos.web.app) › Páginas › Nova página › Enviar o meu arquivo .html.
   2. SEO e integrações: título, descrição, imagem, WhatsApp, Pixel/GA4.
   3. Ligações: loja, agenda, WhatsApp do Kit e modo de compra.
   4. Publicar.
   5. Domínio próprio, se houver.

## Checklist rápido

- [ ] Promessa e chamada principal visíveis sem rolar, no celular
- [ ] Todos os formulários com `name` e campo de contato; nenhum pede senha ou cartão
- [ ] Cores em variáveis, `--upe-cor` definido
- [ ] Links de WhatsApp com `data-upe-link="whatsapp"` e mensagem pronta
- [ ] Produtos e serviços com `data-upe-*` (nunca preços digitados à mão, se vêm da loja)
- [ ] Sem Pixel/Analytics fixos no HTML; sem base64 grande; ≤ 880 KB
- [ ] `node tools/validar-html.js` sem ✗

## Referências no repositório

- `docs/KIT-UPE.md`: contrato completo dos atributos;
- `site/apps/servicos/blocos.js`: seções prontas (produtos, serviços, agenda, WhatsApp, formulário, depoimentos, FAQ, preços), as mesmas do botão “Inserir seção pronta” do painel;
- `site/apps/servicos/modelos/`: modelos de página do painel;
- `modelo-base.html` (nesta pasta): ponto de partida com todos os ganchos.
