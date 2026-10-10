---
name: sistema-upe
description: Monta o pacote Upe Sistemas de um cliente: site ou página de serviços ligada à agenda online (serviços, profissionais, horários e agendamento embutido), configuração da agenda no Painel Upe Serviços e dashboards de indicadores (agenda, landing pages ou planilha). Use ao criar a página de um negócio que atende com hora marcada (clínica, estúdio, salão, consultório, oficina), configurar a agenda online ou planejar e montar um dashboard para cliente da Upe.
---

# Sistema Upe (agenda online + dashboards)

Três entregas que se encaixam no Painel Upe Serviços (https://upe-criativo-servicos.web.app):

1. **Página do negócio** com os serviços e o agendamento embutido (HTML com o Kit Upe);
2. **Agenda online configurada**: serviços, horários, profissionais e página pública em `upe-criativo-sistemas.web.app/<agenda>`;
3. **Dashboard** com os indicadores que o cliente acompanha.

Contrato do HTML com a plataforma: `docs/KIT-UPE.md`. Regras de qualidade do HTML: habilidade `landing-pages-upe`.

## 1. Configurar a agenda (antes da página)

Levante com o cliente e cadastre no painel (Agenda online):

| Item | Onde no painel | Observação |
|---|---|---|
| Serviços: nome, duração (min), preço (0 = “a combinar”) | Agenda › Serviços | A duração define quantos horários o atendimento ocupa |
| Horários por dia, com pausa | Agenda › Horários › “+ faixa” | Ex.: 08:00–12:00 e 13:00–18:00. Dia sem faixa fica fechado |
| Intervalo da grade | Agenda › Horários | 15, 20, 30, 45 ou 60 min |
| Antecedência mínima e dias à frente | Agenda › Horários | Ex.: 2 h e 30 dias |
| Folgas e feriados | Agenda › Horários | Uma data por linha (AAAA-MM-DD) |
| Profissionais | Agenda › Profissionais | Cada um com serviços que atende e, se quiser, horários próprios. O cliente escolhe com quem ou “sem preferência” |
| Nome, texto, endereço, WhatsApp, cor | Agenda › Página e link | A cor deve ser a principal da marca |

Como funciona para o cliente final:

- o horário marcado some da página na hora (não há reserva dupla);
- o cliente recebe o link para cancelar sozinho;
- o estabelecimento confirma pelo WhatsApp com mensagem pronta, que já inclui o link de cancelamento.

Avisos automáticos (e-mail ou WhatsApp a cada agendamento e lembrete na véspera) chegam com o plano Blaze (`docs/ATIVACAO-BLAZE.md`).

## 2. Página do negócio

Parta de `modelo-agenda.html` (nesta pasta). Estrutura:

1. promessa e botão “Agendar” (`data-upe-link="agenda"`);
2. serviços (`<div data-upe-servicos></div>`: preço e duração vêm da agenda, nunca digite à mão);
3. equipe;
4. depoimentos;
5. agendamento embutido (`<div data-upe-agenda></div>`);
6. localização e WhatsApp;
7. perguntas frequentes.

- Para destacar um serviço, use `data-upe-link="agenda:<id-do-serviço>"` ou `<div data-upe-agenda data-servico="<id>">`.
- Serviços no visual da marca: `<template>` dentro de `data-upe-servicos` com `data-campo="nome|duracao|preco"` e um link `data-upe-acao="agendar"`.
- Deixe `<html data-upe-agenda="<agenda>" data-upe-whatsapp="…">`. No painel, as Ligações (SEO e integrações) têm prioridade.
- Valide: `node tools/validar-html.js pagina.html --agenda <agenda>`.
- Suba: Painel › Páginas › Nova página › Enviar o meu arquivo .html. Depois SEO e integrações › Ligações › Agenda e Publicar.

## 3. Dashboard

O dashboard é montado pela Upe no painel do cliente (Dashboards › Novo dashboard, só administrador). Fontes:

| Fonte | Colunas disponíveis |
|---|---|
| Agenda online | `data`, `hora`, `servico`, `situacao` (nova, confirmada, concluida, cancelada, faltou), `valor`, `cliente` |
| Landing pages | `data`, `tipo` (visita, lead, clique, whatsapp, rolagem), `pagina`, `aparelho`, `origem`, `visitante` |
| Planilha (CSV) | As colunas da planilha do cliente (1ª linha = nomes) |

Planilha do Google: Arquivo › Compartilhar › Publicar na Web › CSV. Cole o link.

**Atenção:** publicar na web deixa a planilha acessível a quem tiver o link. Para dados sensíveis (faturamento), espere a leitura privada, que chega com o plano Blaze (`docs/ATIVACAO-BLAZE.md`, função `planilha`). Nela a planilha fica privada e só é compartilhada com a conta de serviço.

Monte a planilha assim: uma linha por registro (venda, atendimento, lead); datas `AAAA-MM-DD` ou `DD/MM/AAAA`; valores numéricos sem texto (`1234,50` ou `1234.50`); categorias consistentes (mesma grafia).

Indicadores (máximo de 8; o dashboard deve responder perguntas, não mostrar tudo):

| Tipo | Use para | Campos |
|---|---|---|
| Número grande | Total do período, contagem, média | cálculo (quantidade, soma, média, último), coluna do valor, filtro `coluna=valor` |
| Barras por dia ou mês | Evolução | coluna de data, cálculo, “agrupar por mês” |
| Ranking | Quem ou o que mais vende | coluna de categoria, cálculo |
| Tabela | Últimos registros | (todas as colunas, 20 últimas linhas) |

Sugestões prontas pelo botão “Sugerir para a fonte”.

- Clínica ou estúdio: agendamentos, faturamento dos concluídos (soma de `valor` com `situacao=concluida`), faltas, por dia e ranking de serviços.
- Loja: pedidos e faturamento por mês e ranking de produtos (via planilha exportada).

## Checklist

- [ ] Serviços, horários (com pausa), profissionais e folgas cadastrados; página pública testada no celular
- [ ] Página do negócio com `data-upe-servicos` e/ou `data-upe-agenda`, sem preço digitado à mão
- [ ] Ligações da página com a agenda certa; validador sem ✗
- [ ] Link da agenda na bio, no Google Meu Negócio e na mensagem automática do WhatsApp
- [ ] Dashboard com até 8 indicadores, cada um respondendo uma pergunta do cliente
