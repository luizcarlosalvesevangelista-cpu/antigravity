# Kit Upe · contrato do HTML com as plataformas da Upe Criativo

O Kit Upe (`site/apps/lp/kit/upe-kit.js`, publicado em `https://upe-criativo-lp.web.app/kit/upe-kit.js`) liga qualquer página HTML aos dados das plataformas:

- **Upe ERP:** produtos, preços, estoque, carrinho e finalização na loja;
- **Agenda online:** serviços e agendamento;
- **WhatsApp:** botões e pedido pronto;
- **Pagamento direto:** quando o servidor (plano Blaze) estiver ligado.

Quando o HTML sobe no **Painel Upe Serviços**, o kit entra sozinho e usa as **Ligações** da página (SEO e integrações › Ligações: loja, agenda, WhatsApp e modo de compra). Fora da plataforma, basta colar a tag do script.

## 1. Configuração

Ordem de prioridade (a primeira encontrada vale):

1. Ligações da página no painel (injetadas como `window.UPE_KIT`).
2. Atributos do script: `<script src="https://upe-criativo-lp.web.app/kit/upe-kit.js" data-loja="doce-encanto" data-agenda="studio" data-whatsapp="5511999999999" data-compra="loja"></script>`.
3. Atributos no `<html>`: `<html lang="pt-BR" data-upe-loja="doce-encanto" data-upe-agenda="studio" data-upe-whatsapp="5511999999999" data-upe-compra="loja">`.

| Chave | Valor |
|---|---|
| `loja` | Endereço da loja no Upe ERP (`upe-criativo-lojas.web.app/<loja>`) |
| `agenda` | Endereço da agenda online (`upe-criativo-sistemas.web.app/<agenda>`) |
| `whatsapp` | DDI + DDD + número, só dígitos (`5511999999999`) |
| `compra` | `loja` (finaliza na loja do ERP: PIX, cartão, frete e cupom da loja) · `whatsapp` (pedido pronto no WhatsApp) · `gateway` (pagamento na própria página; só com o servidor ligado) |
| `cor` | Cor dos botões gerados pelo kit (senão usa a variável CSS `--upe-cor`) |

## 2. Elementos (atributos `data-upe-*`)

### Loja (Upe ERP)
| Marcação | O que faz |
|---|---|
| `<div data-upe-produtos></div>` | Grade de produtos da loja. Opções: `data-categoria="Doces"`, `data-limite="8"`, `data-ordem="nome\|menor\|maior"`, `data-destaque` (só promoções), `data-ids="id1,id2"` (escolhidos à mão), `data-classe="minha-grade"` (classe da grade quando usa modelo) |
| `<template>` dentro de `data-upe-produtos` | Modelo próprio de card. Campos: `data-campo="nome\|preco\|preco-de\|imagem\|descricao\|categoria\|estoque"`. Botões: `data-upe-acao="carrinho\|comprar\|whatsapp\|ver"` |
| `<div data-upe-produto="<id>">…</div>` | Um produto específico (com os mesmos `data-campo`, ou card padrão se vazio) |
| `<span data-upe-preco="<id>"></span>` | Preço atual de um produto (sempre igual ao da loja) |
| `<div data-upe-carrinho></div>` | Botão do carrinho com contador. `data-flutuante` fixa no canto. Conteúdo próprio também funciona (o clique abre o carrinho) |
| `<span data-upe-contador></span>` | Só o número de itens do carrinho |

O carrinho fica no navegador do visitante. **Finalizar compra** leva os itens para a loja do ERP (`/<loja>?add=id:qtd,…`), que calcula frete, cupom e pagamento e cria o pedido no painel do lojista. O estoque é respeitado.

### Agenda online
| Marcação | O que faz |
|---|---|
| `<div data-upe-servicos></div>` | Lista de serviços (nome, duração, preço) com botão **Agendar**. Aceita `<template>` com `data-campo="nome\|duracao\|preco"` e um link `data-upe-acao="agendar"` |
| `<div data-upe-agenda></div>` | Agendamento embutido na página (a altura se ajusta sozinha). `data-servico="<id>"` já escolhe o serviço |

### Links e WhatsApp
| Marcação | Vira |
|---|---|
| `<a data-upe-link="inicio">` | Página inicial (no endereço da Upe ou no domínio próprio) |
| `<a data-upe-link="loja">` | Vitrine completa da loja |
| `<a data-upe-link="produto:<id>">` | Página do produto na loja |
| `<a data-upe-link="agenda">` ou `agenda:<serviço>` | Agenda online (com o serviço já escolhido) |
| `<a data-upe-link="whatsapp" data-mensagem="…">` | Conversa no WhatsApp com mensagem pronta |
| `<a data-upe-link="carrinho">` | Abre o carrinho |
| `<button data-upe-whatsapp="5511…" data-mensagem="…">` | WhatsApp de um número específico |

### Formulários (leads)
Todo `<form>` da página vira **lead** no painel (seção Leads), com origem (UTM) e botão de WhatsApp.

- Os campos precisam de `name`, e é bom ter um campo `whatsapp`, `telefone` ou `email`.
- Sem `action` (ou `action="#"`), o formulário mostra uma mensagem de obrigado. Personalize com `data-mensagem="…"` ou redirecione com `data-obrigado="https://…"`.
- Use `data-upe-ignorar` num formulário que não deve virar lead (ex.: busca).
- **Nunca** peça senha ou dados de cartão num formulário de landing page.

## 3. Visual

O kit herda a fonte e as cores da página. Os elementos que ele cria ficam dentro de `.upe-k` e usam estas variáveis CSS:

```css
:root {
  --upe-cor: #8b3a62;          /* botões */
  --upe-texto-botao: #fff;
  --upe-fundo-card: #fff;
  --upe-borda: rgba(0,0,0,.12);
  --upe-raio: 14px;
  --upe-card-min: 220px;       /* largura mínima dos cards na grade */
  --upe-gap: 18px;
}
```

Para controle total, use `<template>`: o kit só preenche os campos e liga os botões.

## 4. O que a plataforma acrescenta sozinha (não coloque no HTML)

- Medição de visitas, cliques, rolagem, WhatsApp e leads;
- Botão flutuante de WhatsApp (SEO e integrações);
- Meta Pixel e Google Analytics, com aviso de cookies (LGPD);
- Título e descrição do Google e a imagem de compartilhamento;
- O próprio `upe-kit.js`.

## 5. Antes de subir

```bash
node tools/validar-html.js pagina.html --loja nome-da-loja --agenda endereco
```

Confere tamanho (até 880 KB), celular, SEO, formulários e todos os `data-upe-*`. Depois, no Painel Upe Serviços:

1. Páginas › Nova página › Enviar o meu arquivo .html.
2. SEO e integrações › Ligações (loja, agenda, WhatsApp, modo de compra).
3. Publicar.

Para usar como página inicial de uma loja do ERP: botão **Usar esta página como página inicial da loja** (só a Upe).
