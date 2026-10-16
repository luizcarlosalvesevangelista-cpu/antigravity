# Painel central: um painel só para a Upe e um para cada cliente

O portal (`site/portal`, endereço `www.upecriativo.com.br/portal/`) é o painel único da Upe Criativo. Ele cobre quatro frentes:

- Branding e mídias
- Loja online (Upe ERP)
- Landing pages e sites
- Agenda e dashboards

O Upe TV é um app separado (`tv.upecriativo.com.br`) e não faz parte deste painel.

## Para a Upe (administrador)

### A ficha do cliente se adapta aos serviços

Em **Clientes**, abra a ficha. As abas aparecem conforme o que o cliente contratou:

| Aba | Quando aparece | Para quê |
|---|---|---|
| Projeto e acessos | sempre | dados, e-mail de login, código antigo, plano de branding, mensalidade, **arquivos da marca** (manual, manual editável, certificado de anterioridade) |
| Serviços | sempre | ligar cada serviço (status, plano, extras, vencimento) e liberar os acessos |
| Apresentação e dossiê | branding | importar a **pasta ou o .zip do dossiê** (tudo sobe com os mesmos caminhos) |
| Conteúdo | mídias digitais | posts para aprovação, kits e a **pasta de criação** (pasta ou .zip) |
| Gráficos e recompra | papelaria gráfica | artes para aprovar e recompra |
| Páginas e sistemas | sempre | **enviar página, site, sistema ou painel (pasta ou .zip)** |
| Pagamentos | sempre | cobranças de todos os serviços, com o serviço de cada uma |
| Inbox | sempre | conversa com o cliente |

### Serviços e liberação dos acessos

Na aba **Serviços**, ligue o que o cliente contratou e clique em **Salvar serviços e liberar acessos**. O painel cria sozinho:

| Serviço | O que é criado |
|---|---|
| Painel do cliente | `portal_convites/{email}` |
| Loja online (Upe ERP) | `empresas/{empresa}`, `convites/{email}` e a plataforma no Gerenciador do ERP; domínio próprio da loja, se houver |
| Landing pages e sites / Agenda e dashboards | `srv_clientes/{id do cliente}` e `srv_convites/{email}` |

### Enviar uma página, site ou sistema (pasta ou .zip)

Na aba **Páginas e sistemas** (aparece em todo cliente), clique em **Adicionar página ou sistema** e preencha:

1. **Tipo:** landing page, site ou sistema.
2. **Nome e endereço:** a página fica em `lp.upecriativo.com.br/endereço/`.
3. **Arquivos:** escolha a **pasta** inteira, o **.zip** dela ou, se tudo estiver dentro do arquivo, **só o .html**.
4. **Pasta a publicar:** num .zip com várias pastas (ex.: um dossiê com `landing/` e `site/`), escolha só a que vai ao ar.
5. **Página principal:** o `.html` que abre no endereço. Os outros `.html` da pasta também abrem pelo caminho deles (ex.: `…/endereço/painel.html`).
6. **Publicar agora:** sem marcar, fica como rascunho e abre só pelo link de prévia (o link da lista já leva a chave).
7. **Mostrar como painel do cliente:** o cliente ganha o botão **“Painel – (nome)”**.

**Como os arquivos funcionam:** cada arquivo sobe para o Storage no **mesmo caminho** da pasta (`lp/{endereço}/css/estilo.css`) e o servidor entrega em `lp.upecriativo.com.br/{endereço}/css/estilo.css`. Nada é reescrito, então funcionam como no computador:

- caminhos relativos no HTML e no CSS (imagens, fontes, fundos);
- scripts e módulos (`<script src="js/app.js">`, `import`);
- dados lidos pelo script (`fetch("dados/itens.json")`), inclusive caminhos montados enquanto roda.

Textos (HTML, CSS, JS, JSON, SVG) saem direto do servidor; imagens, fontes, vídeos e PDFs vão para o endereço do Storage.

Se o sistema usa banco de dados próprio (ex.: vitrine com reservas), aponte a configuração dele para o projeto `upecriativo-cc472` antes de enviar. As regras de `landings/{id}` (peças, reservas, clientes) já estão no `firestore.rules`; quem administra fica em `landings/{id}.donos` (e-mails).

Em cada página da lista:

- **Substituir arquivos:** envia uma versão nova no mesmo endereço.
- **Tirar do ar / Publicar:** liga ou desliga a página.
- **Editor e análise:** abre o editor de textos, as visitas, os leads e o domínio próprio.

### Pasta do cliente no Storage

Cada cliente tem uma pasta com o nome da marca: `clientes/<marca>/`. O nome é criado no primeiro envio e não muda depois.

| Pasta | O que guarda |
|---|---|
| `dossie/` | dossiê completo; só a Upe abre, pelo link do dossiê |
| `criacao/` | pasta de criação dos posts |
| `paginas/<endereço>/` | páginas, sites e sistemas |
| `marca/` | manual, manual editável e certificado |
| `posts/`, `graficos/`, `kits/` | envios avulsos |

O modelo dessa pasta para o HD está em `upe/adm/cliente-modelo/`; veja `upe/adm/README.md`.

### Pasta de criação e vínculo dos posts

Em **Conteúdo › Pasta de criação**:

- **Enviar pasta** ou **Enviar .zip:** sobe para `clientes/<marca>/criacao/` com os mesmos caminhos e liga os posts aos arquivos.
- **Vincular arquivos já enviados:** procura na pasta de criação e no dossiê já enviados e liga os posts que ainda estão sem arquivo.

O vínculo é feito pelo caminho e, se não achar, pelo nome do arquivo. O aviso “post(s) com arquivo sem vínculo” mostra quantos faltam.

### Arquivos da marca

Em **Projeto e acessos › Recorrência e arquivos da marca**, envie:

- o manual em PDF;
- o manual editável (AI, InDesign, PDF editável ou .zip);
- o certificado de anterioridade (PDF da iT'sMine), com a data do registro.

Com o acesso **Baixar o manual da marca** ligado, o cliente vê o card **Arquivos da marca** no Início. O certificado aparece em destaque, com o selo, ao lado do manual.

### Preços num lugar só

Em **Serviços e preços**, cada aba grava direto na fonte que as páginas de vendas e os apps usam:

| Aba | Onde grava |
|---|---|
| Branding e mídias | `config/publico.precos.branding` |
| Loja online | `upe/gestao/config/geral` e `publico/plano` |
| Landing pages e sites | `srv_planos` (frente `lp`) |
| Agenda e dashboards | `srv_planos` (frentes `agenda` e `dash`) |

## Para o cliente

O painel do cliente é simples:

- **Início:** os serviços contratados, com os botões de cada painel, e o que está pendente.
- **Meus serviços:** um cartão por serviço. Cada cartão traz o botão do painel do serviço:
  - **Painel – Loja (marca):** pedidos, produtos e PDV.
  - **Painel – Páginas:** editar, visitas, leads e domínio.
  - **Painel – Agenda e dashboards.**
  - **Painel – (sistema próprio):** quando a Upe marca um sistema como painel do cliente.

  Há também links para ver a loja e as páginas no ar, e um espaço para conhecer outros serviços.
- **Pagamentos:** todas as cobranças, com filtro por serviço.
- **Falar com a Upe:** mensagens.
- **Seções de branding** (apresentação, conteúdo, artes e recompra): só aparecem para quem contratou.
- **Arquivos da marca:** manual em PDF, manual editável e certificado de anterioridade com selo.

O cliente entra com o e-mail (um login para tudo). O código antigo continua valendo para o portal de branding.

## Painel personalizado (página ou sistema próprio)

Para qualquer serviço, a aba **Serviços › Painel do cliente** tem a opção **Painel personalizado**:

- Escolha uma página ou sistema já enviado (ex.: `hash › painel.html`) ou clique em **Enviar pasta ou .zip**.
- O sistema abre dentro do painel do cliente, no endereço dele (isolado do painel), com todos os arquivos.
- A única ligação com o painel é a aba **Pagamentos** daquele serviço, por mensagens.

| Do sistema para o painel | Efeito |
|---|---|
| `parent.postMessage({ upe: "dados" }, "*")` | pede os dados do cliente |
| `parent.postMessage({ upe: "pagamentos" }, "*")` | abre os pagamentos do serviço |
| `parent.postMessage({ upe: "altura", h: 1200 }, "*")` | ajusta a altura |

Do painel para o sistema: `{ upe: "cliente", nome, marca, frente, status, emAberto, totalEmAberto }`.

Painéis antigos de um `.html` só continuam abrindo.

## Dossiê

Em **Apresentação e dossiê**, use **Importar pasta do dossiê** ou **Importar .zip do dossiê**. Tudo sobe para `dossies/{chave}/…` com os mesmos caminhos. O dossiê completo abre por um link só da Upe (`lp.upecriativo.com.br/_d/{chave}/…`, chave aleatória). A aba 05 vira a apresentação do cliente, e os posts entram no calendário.

## Portfólio do site (Behance)

Em **Configurações › Portfólio do site (Behance)**:

1. Informe o usuário do Behance (o final de `behance.net/<usuário>`). Se quiser, cole também links de projetos, um por linha.
2. Clique em **Atualizar do Behance agora**. Os projetos aparecem em alguns segundos.
3. Para cada projeto, escolha se fica visível, a frente (Branding, Redesign, Motion) e a ordem. Depois clique em **Salvar portfólio**.

O site mostra os projetos na seção Portfólio, e cada card abre o projeto no Behance. Os projetos da Upe (Upe Criativo e Upe ERP) continuam no site se a opção estiver marcada. O servidor busca o Behance de novo a cada 6 horas; um projeto novo entra visível e como Branding até você mudar.

## Técnico

- **Mesmo endereço:** o site principal publica também `apps/painel` e `apps/servicos` (ver `site/firebase.json`). O painel abre esses apps em `../apps/<app>/?embed=1`, então o login é o mesmo.
- **Storage:**
  - Contas de administrador têm a marca `upe: true` no login, gravada por `tools/firebase/marcar_admins.js`. Rode esse script ao criar um administrador novo.
  - As regras do Storage (`site/portal/storage.rules`) usam essa marca. Para publicá-las: `node tools/firebase/publicar_regras_storage.js`.
- **Regras do banco:** `portal_convites`, `portal_acessos`, `paineis_cliente`, `lp_paginas`, `lojas_dominios`, `landings` em `site/portal/firestore.rules`.
- **Servidor das páginas:** a função `lpRender` entrega a página principal (montada, com SEO e medição), os arquivos da pasta (`lp/{endereço}/…`) e os dossiês (`/_d/{chave}/…`).
- **Testes:**
  - `node tools/capturas/painel-central.js` (modo demonstração; inclui o envio de uma pasta e de um .zip de exemplo de `tools/capturas/fixtures/pagina-exemplo`);
  - `node tools/firebase/testar_conta.js` (regras de acesso no Firebase).
- **Demonstração:**
  - Admin: `admin@upe.demo` / `upe-demo`.
  - Cliente: `cliente@upe.demo` / `upe-demo`.
