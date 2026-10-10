# Ativação do plano Blaze e do domínio próprio

Tudo já está pronto no repositório. Falta só pagar, criar algumas contas e rodar um script.

## O que liga com o Blaze

| Recurso | Onde aparece | Código |
|---|---|---|
| E-mails automáticos (novo lead, novo agendamento, lembrete, mensalidade, atraso, domínio conectado, avisos do portal) | caixa de entrada do cliente e da Upe | `site/functions/index.js` + extensão Trigger Email |
| Lembrete da véspera para o cliente final, com link de cancelamento | e-mail; WhatsApp se houver serviço de envio | função `lembretes` |
| Resumo diário das landing pages e limpeza de eventos com mais de 13 meses (LGPD) | Análise mais rápida | função `resumoDiario` |
| Mensalidades geradas sozinhas, lembrete de atraso e suspensão automática (opcional) | Gestão Upe › Cobranças | função `cobrancas` |
| PIX automático das cobranças (confirma sozinho) | Plano e cobranças › Pagar com PIX | função `api` (`/api/pix`) |
| Pagamento direto nas páginas (carrinho do Kit Upe → Mercado Pago do lojista) | Ligações › “Pagamento direto na página” | função `api` (`/api/checkout`, `/api/mp`) |
| Prévia certa ao compartilhar landing pages (WhatsApp, Facebook, LinkedIn) | qualquer link de página | função `lpRender` |
| Domínio do cliente conectado sozinho | Gestão Upe › Domínios › Conectar automaticamente | funções `dominioConectar` e `dominiosVerificar` |
| Planilha privada nos dashboards | Dashboards › fonte “Planilha privada do Google” | função `planilha` |
| Envio de imagens no editor de landing pages; vídeos do Upe TV para todas as telas | editor e gestão da TV | Storage + `portal/storage.rules` |
| Backup diário de 7 dias, semanal de 8 semanas e proteção contra exclusão do banco | (automático) | `tools/blaze/ativar.sh` |

## Passo a passo

### 1. Pagar o Blaze

Acesse https://console.firebase.google.com/project/upecriativo-cc472/usage/details › **Modificar plano** › Blaze.

Crie logo um **alerta de orçamento** de R$ 50/mês (Google Cloud › Faturamento › Orçamentos e alertas). No volume atual, o custo esperado fica entre R$ 0 e R$ 30 por mês, porque a maior parte cabe na cota gratuita.

### 2. Conta de e-mail para envio (recomendado)

O mais simples é o Gmail da Upe com **senha de app**: Conta Google › Segurança › Verificação em duas etapas › Senhas de app.

Com a senha, o endereço de envio (SMTP) fica assim:

```
smtps://upecriativo@gmail.com:SENHA-DE-APP@smtp.gmail.com:465
```

Para mais de 500 e-mails por dia, use Brevo ou Resend (gratuitos até um limite) e o SMTP deles.

### 3. Mercado Pago (opcional, para PIX automático)

Mercado Pago › Seu negócio › Configurações › Credenciais de produção › **Access Token** (`APP_USR-…`).

- **Cobranças da Upe:** use o token da conta da Upe no script.
- **Lojas que vendem pela página:** cada lojista passa o próprio token, cadastrado em Gestão Upe › PIX e contato › Pagamento online das lojas.

### 4. WhatsApp automático (opcional)

Precisa de um serviço de envio (Z-API, Evolution API, ou a API oficial do WhatsApp Business por um parceiro). Ele dá uma URL que recebe `{ "phone": "5511…", "message": "…" }`.

Sem isso, os avisos vão por e-mail e o painel continua com os botões de WhatsApp com mensagem pronta.

### 5. Rodar o script

Pode pedir para o Claude rodar, enviando a chave de serviço como nas outras vezes. Ou rode no seu computador:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=~/chaves/upecriativo-cc472.json
export SMTP_URI='smtps://upecriativo@gmail.com:SENHA-DE-APP@smtp.gmail.com:465'
export EMAIL_REMETENTE='Upe Criativo <upecriativo@gmail.com>'
export MP_ACCESS_TOKEN='APP_USR-…'          # opcional
export WHATSAPP_WEBHOOK='https://…'         # opcional
bash tools/blaze/ativar.sh
```

O script liga as APIs, cria o Storage, liga backup e proteção do banco, grava os segredos, instala a extensão de e-mail, publica regras e funções, muda as landing pages para o modo servidor e marca os recursos como ligados no painel. Pode rodar de novo sem problema.

Para voltar ao modo sem servidor: `python3 tools/blaze/firebase_blaze.py --desligar` e publique o hosting.

### 6. App Check (proteção contra robôs, recomendado)

1. Console Firebase › App Check › registre o app web com **reCAPTCHA Enterprise**.
2. Deixe em **modo de monitoramento** por 2 semanas e veja quantas requisições ficariam sem verificação.

Antes de exigir (enforce) no Firestore, os gravadores públicos precisam mandar o token do App Check. São eles: o rastreador das páginas, o formulário de interessados, a agenda pública e o kit. Peça ao Claude: “ligar App Check nos gravadores públicos”. Sem isso, exigir o App Check bloquearia visitas e agendamentos.

### 7. Publicação automática pelo GitHub (opcional)

1. No repositório: Settings › Secrets and variables › Actions › **New secret** `FIREBASE_SA` com o conteúdo do JSON da chave.
2. Em Variables, crie `BLAZE` = `1` para publicar também as funções.

A partir daí, todo merge na `main` roda os testes e publica.

## Domínio próprio (upecriativo.com.br)

1. Registre em https://registro.br (cerca de R$ 40 por ano).
2. Troque os endereços no código. O primeiro comando só mostra o que muda; o segundo grava:
   ```bash
   python3 tools/trocar-dominio.py upecriativo.com.br
   python3 tools/trocar-dominio.py upecriativo.com.br --aplicar
   python3 site/src/build.py && python3 site/portal/src/build.py
   ```
3. Crie os domínios no Hosting e veja os registros de DNS: `python3 tools/trocar-dominio.py upecriativo.com.br --conectar`.
4. No Registro.br › DNS, crie os registros mostrados no console (A e TXT de cada subdomínio).
5. Autorize no login: `cd tools/firebase && node dominios_login.js www.upecriativo.com.br painel.upecriativo.com.br servicos.upecriativo.com.br …` (a lista sai do passo 2).
6. Publique: `cd site && npx firebase-tools deploy --only hosting --project upecriativo-cc472`.

Os endereços `.web.app` continuam funcionando, então links antigos não quebram.
