# Site Upe Criativo

Site estático, sem dependências: `index.html`, `favicon.svg` e `assets/`. Os vídeos são os motions de `../motion/videos`.

## Editar

- Textos e layout: `src/page.html`. Depois rode `python3 src/build.py` para gerar o `index.html`.
- Contatos (WhatsApp, e-mail, Instagram, LinkedIn): objeto `CONTATO` no início do script em `src/page.html`.
- Portfólio: acrescente um item na lista `PROJETOS` (título, ano, tipos, capa, resumo, entregas, imagens e, se houver, vídeo). Ele aparece no portfólio, na página inicial e ganha uma página própria em `#case-<id>`.
- Nome: variáveis `NOME` e `NOME_CURTO` em `src/build.py`.
- Foto: troque o bloco `.portrait` da aba Sobre mim por uma `<img>`.

## Publicar no Firebase Hosting (como o Upe ERP e o Upe TV)

```
cd site
firebase init hosting   # escolha o projeto e mantenha o firebase.json existente
firebase deploy --only hosting
```
