# Como publicar o site da Upe Criativo no seu domínio

A pasta `public_html/` é o site pronto. Não precisa de instalação nem de banco de dados: são arquivos estáticos.

## O que tem dentro

| Caminho | O que é |
|---|---|
| `index.html` | Site da Upe (home, portfólio, sobre mim, contato) |
| `assets/` | Imagens, vídeos e motions do site |
| `portal/` | Área do cliente e painel do administrador (`seudominio.com.br/portal/`) |
| `portal/kits/` | Kits de conteúdo (branding completo; Upe TV e Upe ERP só com o HTML) |
| `portal/cronograma/` | Cronograma de postagem padrão da Upe |
| `portal/modelos/` | Modelo de dossiê em branco |

## Opção 1 · Hospedagem comum (Hostinger, HostGator, Locaweb, KingHost…)

1. Entre no painel da hospedagem → **Gerenciador de arquivos** (ou use FTP, por exemplo o FileZilla).
2. Abra a pasta `public_html` (às vezes `www` ou `htdocs`) do seu domínio.
3. Envie **o conteúdo** da pasta `public_html/` deste pacote, sem a pasta em volta. O `index.html` precisa ficar direto na raiz.
   - Dica: envie o `.zip` e use **Extrair** no próprio gerenciador. É bem mais rápido que enviar arquivo por arquivo (são cerca de 130 MB).
4. Ative o **SSL / HTTPS** no painel (Let's Encrypt grátis).
5. Abra `https://seudominio.com.br` e `https://seudominio.com.br/portal/`.

## Opção 2 · Firebase Hosting (recomendado para o portal funcionar de verdade)

Use o projeto completo (`upe-projeto-completo.zip`, pasta `site/`), que já tem o `firebase.json` e as regras de segurança:

```
npm install -g firebase-tools
firebase login
cd site
firebase use --add      # escolha o seu projeto
firebase deploy
```

Depois, em Firebase → Hosting → **Adicionar domínio personalizado**, siga os passos de DNS (registros A/TXT no seu registrador, como o Registro.br).

## Opção 3 · Netlify, Vercel ou Cloudflare Pages

Arraste a pasta `public_html/` para o painel (Netlify Drop: app.netlify.com/drop) e conecte o domínio em **Domain settings**.

## Antes de divulgar: deixar tudo ativo

- **Portal em modo demonstração:** sem o Firebase configurado, o portal funciona com dados de exemplo guardados só no navegador de quem abre (cliente `AURO-RA26-DEMO`, admin `admin@upe.demo` / `upe-demo`). Para clientes reais, preencha `portal/config.js` com os dados do seu projeto Firebase (passo a passo no `site/portal/README.md` do projeto completo). Isso também troca o login de demonstração pelo seu.
- **Formulário de contato:** hoje, quem envia é levado ao WhatsApp com a mensagem pronta. Para receber os contatos por e-mail sem expor o seu endereço, crie um formulário no Formspree e cole o endereço em `formulario: ""`, no arquivo `site/src/page.html` do projeto completo. Depois rode `python3 site/src/build.py` e publique de novo. O e-mail que recebe fica só na conta do Formspree, fora do site.
- **Upe TV e Upe ERP:** copie as pastas `feed/`, `carrossel/`, `reels/` e `stories/` dos kits originais para `portal/kits/upe-tv/` e `portal/kits/upe-erp/`.
- O `portal/` tem `noindex`: não aparece no Google. O site principal aparece.
