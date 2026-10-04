# Portal Upe

Portal do cliente e painel do administrador para os serviços de **Branding, Mídias digitais e Papelaria gráfica**. Upe ERP e Upe TV ficam fora deste painel.

- **Cliente:** entra com o código `XXXX-XXXX-XXXX`. Vê só o que você liberar: a apresentação (aba 05 do dossiê), o manual da marca, o calendário de aprovação de posts, a aprovação de artes gráficas, a tela "Comprar de novo", os pagamentos por PIX ou cartão e as mensagens.
- **Administrador:** entra com e-mail e senha. Cadastra clientes (manualmente ou a partir dos contatos do site), gera e reenvia códigos, escolhe o que está incluso e o que o cliente vê, publica posts e artes para aprovação, libera recompras, cria e libera cobranças, responde mensagens e monta newsletters.

## Modo demonstração

Sem Firebase configurado, o portal funciona com dados de exemplo guardados só no navegador:

- Cliente: `AURO-RA26-DEMO`
- Admin: `admin@upe.demo` / `upe-demo`

## Colocar no ar com o Firebase

O portal usa o mesmo tipo de projeto Firebase do Upe ERP e do Upe TV.

1. No [console do Firebase](https://console.firebase.google.com), crie um projeto (ou use o do site) e um **app da Web**. Copie o objeto de configuração para `portal/config.js`, em `firebase:`.
2. **Authentication** → ative o provedor **E-mail/senha** → em *Users*, adicione o seu usuário de administrador com o seu e-mail pessoal e uma senha forte. Copie o **UID** desse usuário.
3. **Firestore Database** → crie o banco → crie a coleção `admins` com um documento cujo ID é o seu UID (pode ter um campo qualquer, por exemplo `ativo: true`). Só quem tem documento em `admins` entra no painel. O seu e-mail não fica em nenhum arquivo deste repositório.
4. **Storage** → ative, para enviar manuais, imagens, vídeos e artes direto pelo painel. Sem ele, use links.
5. Publique o site, o portal e as regras de segurança:
   ```
   cd site
   firebase deploy --only hosting,firestore:rules,storage
   ```
6. No painel, em **Configurações**, preencha a chave PIX, o nome do recebedor, a cidade e o link padrão de pagamento com cartão.

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

## Segurança, em resumo

- O código do cliente vira um hash SHA-256; o portal busca o cliente por esse hash. O id interno do cliente é aleatório.
- O cliente só cria "ações" (aprovar, pedir ajuste, mensagem, pedido, pagamento informado). Status, valores e cobranças só o admin altera (`firestore.rules`).
- E-mail, telefone, notas, código e dossiê ficam na coleção `privado`, que só o admin lê.
- Quem tem o código acessa o portal daquele cliente. Se um código vazar, gere outro na ficha do cliente.

## Editar

O código fica em `portal/src/` (`shell.html` e `app.js`). Depois de editar, rode `python3 site/portal/src/build.py`. Ele gera `portal/index.html` e `portal/app.js`.
