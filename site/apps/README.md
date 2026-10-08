# Apps da Upe Criativo (projeto único `upecriativo-cc472`)

Os apps que antes ficavam nos projetos `upe-erp` e `upe-tv` agora rodam no mesmo projeto Firebase do site e do portal: um login, um banco de dados e um plano Blaze.

| Pasta | Endereço | O que é |
|---|---|---|
| `erp/` | https://upe-criativo-erp.web.app | Página de vendas da plataforma (Upe ERP) e vídeo |
| `painel/` | https://upe-criativo-painel.web.app | Painel de pedidos, loja e PDV de cada empresa cliente |
| `lojas/` | https://upe-criativo-lojas.web.app | Lojas públicas (`/nome-da-loja`) |
| `gestao/` | https://upe-criativo-gestao.web.app | Gerenciador das plataformas (licenças, cobranças, suporte, páginas) |
| `tv/` | https://upe-criativo-tv.web.app | Upe TV: campanhas, telas e player |
| `servicos/` | https://upe-criativo-servicos.web.app | Painel Upe Serviços: landing pages, agenda online e dashboards do cliente; Gestão Upe (clientes, planos, cobranças, domínios) |
| `lp/` | https://upe-criativo-lp.web.app | Página de vendas das landing pages e páginas publicadas dos clientes (`/endereco` ou domínio próprio) |
| `sistemas/` | https://upe-criativo-sistemas.web.app | Página de vendas da agenda online e dos dashboards, e agendas públicas (`/endereco`) |

- Conexão: `*/upe-firebase.js` (ERP) e `tv/config.js` (TV) apontam para `upecriativo-cc472`.
- Administração: entra no gerenciador, no painel (como Upe) e no TV quem usa `upecriativo@gmail.com` **ou** é administrador do portal (`admins/{uid}`).
- Regras de segurança: `site/portal/firestore.rules` (portal + ERP + TV + Upe Serviços).
- Upe Serviços: o painel testa sem banco com `?demo=1` (dados fictícios no navegador). `lp/lp-render.js` tem uma cópia em `servicos/` e `sistemas/pub.js`, `vendas.js` e `vendas.css` têm cópias em `lp/`: ao mudar um, copie para o outro.
- Domínio próprio de landing page: o cliente pede no painel; a Upe adiciona o domínio no Hosting do site `upe-criativo-lp` e marca o pedido como ativo em Gestão Upe › Domínios.
- Postagens: ficam só no painel principal (Cronograma Upe). A aba "Redes sociais" do gerenciador foi retirada.
- Publicar: `cd site && firebase deploy --only hosting` (publica o site, o portal e os 8 apps).
