# Projetos de clientes

Uma pasta por cliente, com o nome da marca, no formato de `../cliente-modelo/` (o mesmo do Storage). Para um cliente novo, copie `cliente-modelo` e renomeie.

```
upe/adm/clientes/<marca>/
  briefing.md                 marca, oferta, público, cores, WhatsApp, loja do ERP, agenda, domínio
  paginas/<endereço>/         landing page, capa da loja ou página com agenda (index.html + css, js, img, fonts, dados)
  dashboard.md                indicadores combinados e colunas da planilha (habilidade: sistema-upe)
```

Habilidades: landing-pages-upe (landing), loja-erp-upe (capa da loja), sistema-upe (agenda e dashboards).

Antes de subir qualquer HTML: `node tools/validar-html.js upe/adm/clientes/<marca>/paginas/*/index.html`.

O contrato com a plataforma (produtos, carrinho, agenda, WhatsApp, leads) está em `docs/KIT-UPE.md`. As habilidades ficam em `.claude/skills/`: peça “crie a landing page do cliente X” ou “monte a capa da loja Y” e elas são usadas automaticamente.

Dados pessoais de clientes (CPF, contratos assinados, senhas) não entram aqui: o repositório não é lugar para isso.
