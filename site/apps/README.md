# Apps da Upe Criativo (projeto único `upecriativo-cc472`)

> **Cadastro de clientes, preços e o painel do cliente ficam no painel central** (`site/portal`): veja [`docs/PAINEL-CENTRAL.md`](../../docs/PAINEL-CENTRAL.md). Os apps abaixo abrem dentro dele (`?embed=1`, mesmo endereço) e as telas de administração de cada app ficam só para operar.

Os apps que antes ficavam nos projetos `upe-erp` e `upe-tv` agora rodam no mesmo projeto Firebase do site e do portal: um login, um banco de dados e um plano Blaze.

| Pasta | Endereço | O que é |
|---|---|---|
| `erp/` | https://erp.upecriativo.com.br | Página de vendas da plataforma (Upe ERP) e vídeo |
| `painel/` | https://painel.upecriativo.com.br | Painel de pedidos, loja e PDV de cada empresa cliente |
| `lojas/` | https://loja.upecriativo.com.br | Lojas públicas (`/nome-da-loja`) |
| `gestao/` | https://gestao.upecriativo.com.br | Gerenciador das plataformas (licenças, cobranças, suporte, páginas) |
| `tv/` | https://tv.upecriativo.com.br | Upe TV: app separado (campanhas, telas e player). Não faz parte do painel central |
| `servicos/` | https://servicos.upecriativo.com.br | Painel Upe Serviços: landing pages, agenda online e dashboards do cliente; Gestão Upe (clientes, planos, cobranças, domínios) |
| `lp/` | https://lp.upecriativo.com.br | Página de vendas das landing pages e páginas publicadas dos clientes (`/endereco` ou domínio próprio) |
| `sistemas/` | https://agenda.upecriativo.com.br | Página de vendas da agenda online e dos dashboards, e agendas públicas (`/endereco`) |

- Conexão: `*/upe-firebase.js` (ERP) e `tv/config.js` (TV) apontam para `upecriativo-cc472`.
- Administração: entra no gerenciador, no painel (como Upe) e no TV quem usa `upecriativo@gmail.com` **ou** é administrador do portal (`admins/{uid}`).
- Regras de segurança: `site/portal/firestore.rules` (portal + ERP + TV + Upe Serviços).
- Upe Serviços: o painel testa sem banco com `?demo=1` (dados fictícios no navegador). `lp/lp-render.js` tem uma cópia em `servicos/` e `sistemas/pub.js`, `vendas.js` e `vendas.css` têm cópias em `lp/`: ao mudar um, copie para o outro.
- Kit Upe (`lp/kit/upe-kit.js`): liga qualquer HTML aos produtos da loja do ERP, carrinho, agenda e WhatsApp pelos atributos `data-upe-*`. Contrato em `docs/KIT-UPE.md`; habilidades em `.claude/skills/` (landing-pages-upe, loja-erp-upe, sistema-upe); validador `tools/validar-html.js`. A loja (`lojas/loja.html`) aceita carrinho vindo do kit (`?add=`) e pode abrir com uma landing page como capa (`lojas/<loja>/publico/capa`).
- Erros de JavaScript de todos os sites vão para a coleção `erros` (Gestão Upe › Erros dos sites).
- Recursos do plano Blaze (funções em `site/functions`, Storage, e-mails, PIX automático): `docs/ATIVACAO-BLAZE.md` e `tools/blaze/ativar.sh`.
- Domínio próprio de landing page: o cliente pede no painel; a Upe adiciona o domínio no Hosting do site `upe-criativo-lp` e marca o pedido como ativo em Gestão Upe › Domínios.
- Postagens: ficam só no painel principal (Cronograma Upe). A aba "Redes sociais" do gerenciador foi retirada.
- `painel/` e `servicos/` também são publicados no site principal (`/apps/...`) para abrir dentro do painel central com o mesmo login. Use caminhos relativos nesses apps.
- Publicar: `cd site && firebase deploy --only hosting` (publica o site, o portal e os 8 apps).
