# Upe Criativo · instruções para o Claude

Responda sempre em português.

## Contexto

Leia a **Parte 1** de `docs/historico-conversa.md` antes de começar. Ela descreve:

- a marca e as frentes;
- os endereços e o painel central;
- o Storage, as funções do servidor e as pastas;
- os guias e as pendências.

A Parte 2 é a conversa completa de 03/10 a 19/10/2026. Consulte quando precisar do motivo de uma decisão.

Esta pasta é a cópia da pasta central do HD. Os arquivos pesados e pessoais (PDFs originais, vídeos brutos, contratos) ficam só no HD, fora do Git.

## Regras

- O e-mail pessoal do Luiz (Outlook) nunca entra no site, no repositório ou em commits.
- Não citar o trabalho na Vepakum.
- YouTube: só material próprio ou de uso livre, sem risco de strike.
- Chaves de serviço, senhas (inclusive a senha de app do Gmail), CPF e contratos nunca entram no repositório. Chaves ficam fora da pasta do projeto.
- Não copiar dados dos projetos antigos `upe-erp` e `upe-tv`.
- Firebase: projeto único `upecriativo-cc472`, região `southamerica-east1`.
- O site é gerado de `site/src/page.html` e o painel de `site/portal/src/`. Depois de editar, rode:
  - `python3 site/src/build.py`
  - `python3 site/portal/src/build.py`

## Pedido em andamento (18/10/2026)

1. **Pasta da Upe:** procurar no HD, nas pastas da Upe, de clientes e de adm, o que é da própria Upe e do painel geral de administração. Juntar com o que está aqui numa única pasta organizada em `upe/adm/` (modelo: `upe/adm/README.md`).
2. **Fonte da Upe:** atualizar e colocar em uso a fonte criada da Upe.
   - Se o arquivo da fonte estiver no HD, use ele.
   - Se não estiver, desenhe o alfabeto a partir das letras do logotipo (`motion/studio/glyphs.json`):
     - altura 38,7, haste 8,3, barra 7,6;
     - canto superior esquerdo bem arredondado, os outros retos;
     - "olhos" em meio disco e ponto do i em cúpula.
3. **Dossiê da marca Upe:** no formato de `site/portal/modelos/Modelo_Dossie_Upe.html`.
4. **Apresentação para o Behance:** da marca Upe.
