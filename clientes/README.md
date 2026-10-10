# Projetos de clientes

Uma pasta por cliente, com tudo o que for subir no Painel Upe Serviços (https://upe-criativo-servicos.web.app):

```
clientes/<cliente>/
  briefing.md            marca, oferta, público, cores, WhatsApp, loja do ERP, agenda, domínio
  landing-<nome>.html    landing pages            (habilidade: landing-pages-upe)
  capa-loja.html         página inicial da loja    (habilidade: loja-erp-upe)
  pagina-agenda.html     página com agendamento    (habilidade: sistema-upe)
  dashboard.md           indicadores combinados e colunas da planilha (habilidade: sistema-upe)
```

Antes de subir qualquer HTML: `node tools/validar-html.js clientes/<cliente>/*.html`.

O contrato com a plataforma (produtos, carrinho, agenda, WhatsApp, leads) está em `docs/KIT-UPE.md`. As habilidades ficam em `.claude/skills/`: peça “crie a landing page do cliente X” ou “monte a capa da loja Y” e elas são usadas automaticamente.

Dados pessoais de clientes (CPF, contratos assinados, senhas) não entram aqui: o repositório não é lugar para isso.
