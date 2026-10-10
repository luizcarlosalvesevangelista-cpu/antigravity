# Painel central: cadastro, preços e painel do cliente num lugar só

O portal (`site/portal`, endereço `www.upecriativo.com.br/portal/`) é o **painel central** de todas as frentes: Branding e mídias, Upe ERP, Upe TV, Landing pages e Upe Sistemas (agenda e dashboards).

Os outros painéis (Gerenciador do ERP, admin do Upe Serviços, gestão da TV) continuam no ar como **ferramentas de operação**. Você não cadastra clientes nem muda preços por lá.

## Para a Upe (administrador)

### Cadastro único do cliente

1. Em **Clientes › Novo cliente**, preencha nome, empresa, marca, e-mail e WhatsApp.
2. Na ficha do cliente, abra **Serviços** e ligue cada frente: status, plano, extras, vencimento e observações.
   - **Upe ERP:** endereço da empresa no painel (ex.: `cafe-aurora`).
   - **Upe TV:** o anunciante cadastrado na TV.
   - **Upe Sistemas:** agenda, dashboards ou os dois.
3. Clique em **Salvar serviços e liberar acessos**. O painel faz sozinho o que antes era feito em cada app:

| Frente | O que é criado |
|---|---|
| Painel central | `portal_convites/{email}` |
| Upe ERP | `empresas/{empresa}`, `convites/{email}` (papel dono) e a plataforma no Gerenciador do ERP (`upe/gestao/clientes/Cxxxx`) |
| Landing pages e Sistemas | `srv_clientes/{id do cliente}` (mesmo id da ficha) e `srv_convites/{email}` |
| Upe TV | ligação com o código do anunciante |

4. Use **Copiar mensagem de acesso** ou **Enviar no WhatsApp** para mandar o endereço e as instruções ao cliente.

Ao cancelar uma frente, o convite daquela frente é retirado. Ao trocar o e-mail em Projeto e acessos, os convites passam para o e-mail novo.

### Preços: uma tela, separada por frente

Em **Serviços e preços**, cada aba grava direto na fonte que as páginas de vendas e os apps usam:

| Aba | Onde grava | Quem mostra o preço |
|---|---|---|
| Branding e mídias | `config/publico.precos.branding` | Ficha do cliente (preço de tabela da mensalidade) |
| Upe ERP | `upe/gestao/config/geral` e `publico/plano` | Gerenciador do ERP, página das lojas, painéis e páginas de vendas do ERP |
| Upe TV | `app/config` (planos da TV) | Painel da TV, anúncio da Upe nas telas, portal do anunciante |
| Landing pages | `srv_planos` (frente `lp`) | Página de vendas de landing pages |
| Upe Sistemas | `srv_planos` (frentes `agenda` e `dash`) | Página de vendas da agenda e dos dashboards |

Os campos de preço do Gerenciador do ERP e da TV ficaram somente leitura, com link para cá.

Itens com cobrança **Pagamento único** (criação de página, agenda, dashboard) geram uma cobrança só, quando são marcados na ficha. Eles não entram na mensalidade.

### Cobranças

Todas as cobranças ficam na ficha do cliente, em **Pagamentos**. Cada cobrança tem um campo **Serviço** e aparece no painel do cliente, na aba Pagamentos daquele serviço.

Em **Serviços e preços › (frente) › Gerar cobranças do mês**, as mensalidades de todos os clientes daquela frente são geradas de uma vez.

## Para o cliente

- **Login:** entra em `www.upecriativo.com.br/portal/` com o e-mail cadastrado. No primeiro acesso, toca em “Primeiro acesso: criar a minha senha” e confirma o e-mail. O código antigo (`XXXX-XXXX-XXXX`) continua valendo para o portal de branding.
- **Menu “Seus serviços”:** um item para cada frente contratada. Cada serviço abre dentro do painel:
  - Upe ERP: painel de pedidos, loja e PDV.
  - Landing pages: páginas, análise, leads e domínio.
  - Upe Sistemas: agenda e dashboards.
  - Upe TV: relatório do anunciante.

  Como tudo está no mesmo endereço, o login vale para todos. Cada serviço tem as abas **Painel** e **Pagamentos**.
- **Pagamentos:** todas as cobranças juntas, com filtro por serviço, PIX, cartão e “Já paguei”. As cobranças antigas do Upe Serviços também aparecem.
- **Contratar serviços:** catálogo com os preços atuais. O pedido chega na ficha do cliente.

## Painel em branco (HTML personalizado)

Para qualquer frente, inclusive Branding, a ficha › Serviços tem a opção **Painel em branco (HTML próprio)**.

1. Escolha a opção e envie o arquivo `.html` (até 900 KB; imagens e vídeos por link).
2. Salve.

O cliente passa a ver o seu HTML no lugar do painel padrão, sempre ao lado da aba **Pagamentos** daquele serviço.

- **Isolamento:** o HTML roda isolado (`iframe sandbox`, sem acesso ao login nem ao banco).
- **Comunicação:** a única ligação com o painel é por mensagens, descritas abaixo.
- **Armazenamento:** o arquivo fica em `paineis_cliente/{cliente}_{frente}`. Só a Upe grava; só o próprio cliente, logado com e-mail, lê.

### Contrato de mensagens (`postMessage`)

| Do HTML para o painel | Efeito |
|---|---|
| `parent.postMessage({ upe: "dados" }, "*")` | Pede os dados do cliente (o painel também envia sozinho ao carregar) |
| `parent.postMessage({ upe: "pagamentos" }, "*")` | Abre a aba Pagamentos deste serviço |
| `parent.postMessage({ upe: "altura", h: 1200 }, "*")` | Ajusta a altura da área do painel (em px) |

Do painel para o HTML: `{ upe: "cliente", nome, marca, frente, status, emAberto, totalEmAberto }`.

```html
<script>
addEventListener("message", e => {
  if (e.data && e.data.upe === "cliente") document.querySelector("#ola").textContent = "Olá, " + e.data.marca;
});
parent.postMessage({ upe: "dados" }, "*");
document.querySelector("#pagar").onclick = () => parent.postMessage({ upe: "pagamentos" }, "*");
</script>
```

## Técnico

- **Mesmo endereço:** o site principal publica também `apps/painel`, `apps/servicos` e `apps/tv` (veja `site/firebase.json`). O portal abre esses apps em `../apps/<app>/?embed=1`, então o login do Firebase é compartilhado.
- **Modo embutido:**
  - Painel do ERP: esconde “Plano e assinatura” e “Sair”.
  - Upe Serviços: mostra só as seções da frente, como abas no topo, sem “Plano e cobranças”.
  - TV: esconde a barra de voltar.
- **Regras:** `portal_convites`, `portal_acessos` e `paineis_cliente` em `site/portal/firestore.rules`. Teste: `node tools/firebase/testar_conta.js` (cria e apaga um usuário de teste).
- **Teste de ponta a ponta (modo demonstração):** `node tools/capturas/painel-central.js`. O teste faz login do admin, edita preços, libera acessos e entra como cliente.
- **Demonstração:**
  - Admin: `admin@upe.demo` / `upe-demo`.
  - Cliente com e-mail: `cliente@upe.demo` / `upe-demo`.
  - Código: `AURO-RA26-DEMO`.
