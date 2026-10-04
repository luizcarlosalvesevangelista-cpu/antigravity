# Portal Upe

Portal do cliente e painel do administrador para os serviços de **Branding, Mídias digitais e Papelaria gráfica**. Upe ERP e Upe TV ficam fora deste painel.

- **Cliente:** entra com o código `XXXX-XXXX-XXXX`. Vê só o que você liberar: a apresentação (aba 05 do dossiê), o manual da marca, o calendário de aprovação de posts, a aprovação de artes gráficas, a tela "Comprar de novo", os pagamentos por PIX ou cartão e as mensagens.
- **Administrador:** entra com e-mail e senha. Cadastra clientes (manualmente ou a partir dos contatos do site), gera e reenvia códigos, escolhe o que está incluso e o que o cliente vê, publica posts e artes para aprovação, libera recompras, cria e libera cobranças, responde mensagens e monta newsletters.

## Agenda, reuniões, cronograma e notificações

- **Cliente:** menu na barra lateral com a **Agenda** (postagens agendadas, prazos de entrega, vencimentos e reuniões) e a lista "Próximos" sempre à vista. O sininho avisa sobre posts e artes para aprovar, cobranças, mensagens, reuniões e prazos.
- **Kits de conteúdo:** na ficha do cliente → Conteúdo → **Importar kit (HTML + arquivos)**. Escolha a pasta do "Kit Instagram" (index.html + feed/, carrossel/, reels/, stories/). Os posts entram no calendário de aprovação com legenda, data e arquivos, e o cliente ganha a página do kit para baixar tudo e copiar as legendas.
- **Prazos de entrega:** em Projeto e acessos. Aparecem na agenda do cliente e no seu calendário.
- **Calendário (admin):** posts de todos os clientes, entregas, vencimentos, reuniões e o cronograma da Upe, com filtros. **Agendar reunião** com cliente ou lead (contato do site): gera o convite para WhatsApp, e-mail, Google Agenda e arquivo .ics; a reunião aparece na agenda do cliente.
- **Cronograma Upe:** o plano de postagem do @upecriativo (abas Instagram, YouTube e Sem data), com status, legendas, roteiros e arquivos. "Carregar cronograma padrão" lê `cronograma/upe-cronograma.json`. "Importar kit" coloca qualquer kit novo no cronograma.
- **Sininho (admin):** contatos novos, aprovações, ajustes, mensagens, pedidos, pagamentos informados, reuniões de hoje e amanhã, o que publicar hoje, vencimentos e prazos próximos.

### Aprovação, ajustes e tags

- **Tags acima da prévia** (grade e lista, no cronograma e no portal do cliente): **Repost**, **Aprovado**, **Reprovado** e **Nova versão**. O cronograma tem os status Planejado, Roteiro, Pronto, Aprovado, Reprovado e Publicado.
- **Repost:** marque "Repost de" no item (cronograma ou post do cliente). O card mostra de novo a peça original no lugar, com a tag Repost.
- **Download só depois de aprovar:** o cliente vê o post, a legenda e os comentários; os botões de baixar aparecem quando ele aprova.
- **Ajuste por comentário:** o cliente pede ajuste escrevendo o que mudar. O pedido aparece como **Prioridade** no topo do seu sininho, com link direto para o post. Em **Devolver corrigido**, envie o arquivo novo (substitui o anterior) e uma mensagem opcional: o post vira a versão seguinte, o cliente recebe aviso no sininho e nas mensagens (e por e-mail, com a extensão Trigger Email do Firebase) e aprova de novo. Vale também para as artes gráficas.
- **Hashtags, bio e direct:** os textos de copiar dos kits ficam logo abaixo das abas Instagram | YouTube | Sem data do cronograma (filtrados pelo pilar escolhido).
- **Timeline por app:** aba do Cronograma Upe com ritmo, horários, formatos e fases para Instagram, YouTube, LinkedIn, TikTok, WhatsApp e Google. Para cada cliente, a timeline sai da ficha "Canais" e da jornada do dossiê e aparece em Conteúdo (para você e para o cliente).
- **YouTube em versão história:** cada vídeo do canal tem um roteiro em 8 atos (história, contexto, narrativa, clímax, pergunta, solução, fundamentação e CTA) e um motion com áudio e efeitos em `kits/upe-branding/youtube/historia-*.mp4` (gerados em `motion/studio`, `run_yt.sh`). Só material próprio da Upe: nada de trechos de vídeos ou prints de terceiros, para não correr risco de strike.

### Kits da Upe

- `kits/upe-branding/`: kit completo (artes, carrosséis, stories, reels com som, thumbnails e plano de YouTube).
- `kits/upe-tv/` e `kits/upe-erp/`: só o `index.html` dos seus kits está aqui. **Copie para cada pasta as subpastas `feed/`, `carrossel/`, `reels/` e `stories/` dos kits originais** para as imagens e vídeos aparecerem no cronograma.
- Para refazer o cronograma depois de mudar um kit, rode de novo o gerador (instruções em `cronograma/README.md`).

## Modo demonstração

Sem Firebase configurado, o portal funciona com dados de exemplo guardados só no navegador:

- Cliente: `AURO-RA26-DEMO`
- Admin: `admin@upe.demo` / `upe-demo`

## Colocar no ar com o Firebase

O portal usa o mesmo tipo de projeto Firebase do Upe ERP e do Upe TV. São 10 a 15 minutos:

**No console do Firebase** ([console.firebase.google.com](https://console.firebase.google.com)):

1. **Criar projeto** (ex.: `upe-criativo`). O Google Analytics é opcional.
2. **Adicionar app → Web** (ícone `</>`). Copie o objeto `firebaseConfig` e cole em `portal/config.js`, no lugar de `firebase: null` (o modelo está comentado no arquivo). Esses dados são públicos por natureza: a proteção vem das regras de segurança.
3. **Authentication → Começar → E-mail/senha → Ativar.**
4. **Firestore Database → Criar banco de dados** → modo produção → região `southamerica-east1` (São Paulo).
5. **Storage → Começar** (mesma região). Para enviar arquivos pelo painel. O Storage pede o plano Blaze (pago por uso, com cota grátis); sem ele, use links para os arquivos.
6. **Configurações do projeto → Contas de serviço → Gerar nova chave privada.** Guarde o arquivo .json fora do repositório: ele dá acesso total ao projeto.

**No seu computador** (precisa do Node.js 18 ou mais novo):

```
npm install -g firebase-tools
firebase login
cd site
firebase use --add                     # escolha o projeto criado
firebase deploy --only firestore:rules,storage,hosting

cd portal/setup
npm install
export GOOGLE_APPLICATION_CREDENTIALS=/caminho/da/chave.json     # Windows: set GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\chave.json
node configurar-firebase.mjs --projeto SEU-PROJETO --email seu-email-de-admin
```

O script cria o seu usuário de administrador, libera o acesso ao painel (`admins/{uid}`), grava as configurações de pagamento e carrega o cronograma da Upe. Ele mostra um link para você definir a senha. O e-mail do administrador não fica salvo em nenhum arquivo do site.

Depois, no painel, em **Configurações**, confira a chave PIX, o nome do recebedor, a cidade e o link de pagamento com cartão. Para usar o seu domínio: **Hosting → Adicionar domínio personalizado**.

**Testar sem projeto (emuladores):** em `portal/config.js`, use qualquer `projectId` começado por `demo-` e `emulador: true`; rode `firebase emulators:start --project demo-upe` na pasta `site/` (com `emulators` no firebase.json) e o script acima com `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`.

### Formulário do site → "Contatos do site"

Em `site/src/page.html`, preencha `CONTATO.firebase` com o mesmo `projectId` e `apiKey` do passo 1 e rode `python3 site/src/build.py`. Cada mensagem do formulário vira um contato no painel, de onde você cria o cliente com um clique.

### Enviar newsletters de verdade

Instale a extensão **Trigger Email from Firestore** (coleção `mail`) com o SMTP do e-mail que vai enviar, por exemplo o Gmail da Upe com senha de app. O botão "Enviar" coloca um e-mail personalizado por destinatário nessa fila. Sem a extensão, use "Copiar HTML" ou "Abrir no meu e-mail".

## Pagamentos

- **PIX:** o QR Code e o copia e cola são gerados com o valor da cobrança a partir da sua chave (padrão BR Code do Banco Central). Teste em Configurações → "Testar QR de R$ 1,00".
- **Cartão:** por link de pagamento (Mercado Pago, InfinitePay, PagSeguro, Stripe…). O portal nunca pede dados de cartão.
- A confirmação é manual: o cliente toca em "Já paguei" e você confirma em Pagamentos.

## Dossiê

Importe o dossiê preenchido (modelo em `portal/modelos/Modelo_Dossie_Upe.html`) na ficha do cliente, em **Apresentação e dossiê**. O arquivo completo fica salvo só para o administrador. O cliente vê apenas a aba 05 (apresentação, filme, motions, feed e PDF). Informe o endereço da pasta do dossiê publicado para o portal achar as imagens e os vídeos.

Postagens no dossiê: preencha `postagens` (data, tipo, título, legenda e arquivos) ou o feed da aba 05. Ao importar, cada postagem com arquivo entra no calendário de aprovação do cliente (sem duplicar o que já existe), e a ficha "Canais" gera a timeline por app.

## Segurança, em resumo

- O código do cliente vira um hash SHA-256; o portal busca o cliente por esse hash. O id interno do cliente é aleatório.
- O cliente só cria "ações" (aprovar, pedir ajuste, mensagem, pedido, pagamento informado). Status, valores e cobranças só o admin altera (`firestore.rules`).
- E-mail, telefone, notas, código e dossiê ficam na coleção `privado`, que só o admin lê.
- Quem tem o código acessa o portal daquele cliente. Se um código vazar, gere outro na ficha do cliente.

## Editar

O código fica em `portal/src/` (`shell.html` e `app.js`). Depois de editar, rode `python3 site/portal/src/build.py`. Ele gera `portal/index.html` e `portal/app.js`.
