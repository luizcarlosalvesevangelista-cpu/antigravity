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
| Projeto e acessos | sempre | dados, e-mail de login, código antigo, plano de branding, mensalidade |
| Serviços | sempre | ligar cada serviço (status, plano, extras, vencimento) e liberar os acessos |
| Apresentação e dossiê | branding | importar a **pasta do dossiê** (imagens, vídeos e PDF sobem sozinhos) |
| Conteúdo | mídias digitais | posts para aprovação e kits |
| Gráficos e recompra | papelaria gráfica | artes para aprovar e recompra |
| Páginas e sistemas | landing pages, sites, agenda ou dashboards | **enviar a página ou o sistema com a pasta de arquivos** |
| Pagamentos | sempre | cobranças de todos os serviços, com o serviço de cada uma |
| Inbox | sempre | conversa com o cliente |

### Serviços e liberação dos acessos

Na aba **Serviços**, ligue o que o cliente contratou e clique em **Salvar serviços e liberar acessos**. O painel cria sozinho:

| Serviço | O que é criado |
|---|---|
| Painel do cliente | `portal_convites/{email}` |
| Loja online (Upe ERP) | `empresas/{empresa}`, `convites/{email}` e a plataforma no Gerenciador do ERP; domínio próprio da loja, se houver |
| Landing pages e sites / Agenda e dashboards | `srv_clientes/{id do cliente}` e `srv_convites/{email}` |

### Enviar uma página, site ou sistema (com a pasta)

Na aba **Páginas e sistemas**, clique em **Adicionar página ou sistema** e preencha:

1. **Tipo:** landing page, site ou sistema.
2. **Nome e endereço:** a página fica em `lp.upecriativo.com.br/endereço`.
3. **Pasta da página ou do sistema** (recomendado): escolha a pasta inteira, com o `.html` principal (`index.html`) e as pastas de imagens, fontes, CSS, scripts e dados. Se tudo estiver dentro do `.html` ou em links da internet, escolha **só o arquivo .html**.
4. **Publicar agora:** sem marcar, a página fica como rascunho.
5. **Mostrar como painel do cliente:** o cliente ganha o botão **“Painel – (nome)”**, que abre o sistema dentro do painel dele.

Os arquivos sobem para o Storage (`lp/{endereço}/…`). Os caminhos são trocados sozinhos no HTML, dentro do CSS (fontes e imagens de fundo) e nos scripts e dados. Isso cobre o caminho escrito por inteiro, como `fetch("dados/itens.json")`. Um caminho montado pelo script enquanto roda não é trocado.

Em cada página da lista:

- **Substituir arquivos:** envia uma versão nova no mesmo endereço.
- **Tirar do ar / Publicar:** liga ou desliga a página.
- **Editor e análise:** abre o editor de textos, as visitas, os leads e o domínio próprio.

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

O cliente entra com o e-mail (um login para tudo). O código antigo continua valendo para o portal de branding.

## Painel em branco (HTML próprio)

Para qualquer serviço, a aba **Serviços** tem a opção **Painel em branco (HTML próprio)**:

- O HTML roda isolado, sem acesso ao login nem ao banco.
- A única ligação com o painel é a aba **Pagamentos** daquele serviço, por mensagens.

| Do HTML para o painel | Efeito |
|---|---|
| `parent.postMessage({ upe: "dados" }, "*")` | pede os dados do cliente |
| `parent.postMessage({ upe: "pagamentos" }, "*")` | abre os pagamentos do serviço |
| `parent.postMessage({ upe: "altura", h: 1200 }, "*")` | ajusta a altura |

Do painel para o HTML: `{ upe: "cliente", nome, marca, frente, status, emAberto, totalEmAberto }`.

## Técnico

- **Mesmo endereço:** o site principal publica também `apps/painel` e `apps/servicos` (ver `site/firebase.json`). O painel abre esses apps em `../apps/<app>/?embed=1`, então o login é o mesmo.
- **Storage:**
  - Contas de administrador têm a marca `upe: true` no login, gravada por `tools/firebase/marcar_admins.js`. Rode esse script ao criar um administrador novo.
  - As regras do Storage (`site/portal/storage.rules`) usam essa marca. Para publicá-las: `node tools/firebase/publicar_regras_storage.js`.
- **Regras do banco:** `portal_convites`, `portal_acessos`, `paineis_cliente`, `lp_paginas`, `lojas_dominios` em `site/portal/firestore.rules`.
- **Testes:**
  - `node tools/capturas/painel-central.js` (modo demonstração; inclui o envio de uma pasta de exemplo de `tools/capturas/fixtures/pagina-exemplo`);
  - `node tools/firebase/testar_conta.js` (regras de acesso no Firebase).
- **Demonstração:**
  - Admin: `admin@upe.demo` / `upe-demo`.
  - Cliente: `cliente@upe.demo` / `upe-demo`.
