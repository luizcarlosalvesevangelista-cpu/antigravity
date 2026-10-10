#!/usr/bin/env node
/* Valida um HTML antes de subir no Painel Upe Serviços (landing page, capa de loja do Upe ERP ou página de agenda).
   Confere o tamanho, o básico de SEO e celular, os formulários (que viram leads) e o contrato do Kit Upe (data-upe-*).
   Uso: node tools/validar-html.js pagina.html [outra.html…] [--loja nome-da-loja] [--agenda endereco]
   Sai com código 1 se houver erro (✗). Avisos (⚠) não impedem a publicação. */
const fs = require("fs"), path = require("path");
const args = process.argv.slice(2), arqs = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] || "").startsWith("--")), op = k => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : ""; };
if (!arqs.length) { console.log("Uso: node tools/validar-html.js pagina.html [--loja nome-da-loja] [--agenda endereco]"); process.exit(2); }
const LIM = 880000;
const HOOKS = ["data-upe-produtos", "data-upe-produto", "data-upe-preco", "data-upe-carrinho", "data-upe-contador", "data-upe-acao", "data-upe-servicos", "data-upe-agenda", "data-upe-link", "data-upe-whatsapp", "data-upe-ignorar", "data-upe-loja", "data-upe-compra", "data-upe-cor", "data-upe-id"];
const ACOES = ["carrinho", "comprar", "whatsapp", "ver", "agendar"], LINKS = ["inicio", "loja", "agenda", "whatsapp", "carrinho", "produto"];
const CAMPOS = ["nome", "preco", "preco-de", "imagem", "descricao", "categoria", "estoque", "duracao"];
let falhou = false;
for (const arq of arqs) {
  const h = fs.readFileSync(arq, "utf8"), E = [], A = [], OK = [];
  const tem = re => re.test(h), conta = re => (h.match(re) || []).length;
  // tamanho e estrutura
  h.length > LIM ? E.push(`Arquivo com ${Math.ceil(h.length / 1024)} KB: o limite é 880 KB. Tire imagens embutidas (base64) e use links.`) : OK.push(`Tamanho ${Math.ceil(h.length / 1024)} KB (limite 880 KB)`);
  if (!tem(/<!doctype html>/i)) A.push("Falta <!doctype html> no início.");
  if (!tem(/<html[^>]*\blang=/i)) A.push('Falta o idioma: <html lang="pt-BR">.');
  if (!tem(/<meta[^>]+name=["']viewport/i)) E.push('Falta <meta name="viewport" content="width=device-width,initial-scale=1"> (a página fica minúscula no celular).');
  if (!tem(/<title>[^<]{3,}<\/title>/i)) A.push("Falta <title> (aparece na aba e no Google). Dá para definir também em SEO e integrações.");
  if (!tem(/<meta[^>]+name=["']description/i)) A.push("Falta <meta name=\"description\"> (descrição no Google). Dá para definir em SEO e integrações.");
  const b64 = [...h.matchAll(/data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]{1000,})/g)].map(m => m[1].length);
  if (b64.length) (b64.some(n => n > 150000) ? E : A).push(`${b64.length} imagem(ns) embutida(s) em base64 (${Math.ceil(b64.reduce((a, n) => a + n, 0) / 1024)} KB). Prefira links https://.`);
  if (tem(/(src|href)=["']http:\/\//i)) A.push("Há links ou imagens com http:// (sem cadeado). Use https://.");
  const semAlt = conta(/<img(?![^>]*\balt=)[^>]*>/gi); if (semAlt) A.push(`${semAlt} imagem(ns) sem texto alternativo (alt).`);
  if (tem(/<h1[\s>]/i)) OK.push("Tem título principal (h1)"); else A.push("Falta um título principal <h1>.");
  // scripts externos e formulários
  const ext = [...h.matchAll(/<script[^>]+src=["']([^"']+)/gi)].map(m => m[1]).filter(u => !/upe-criativo-lp\.web\.app\/kit\//.test(u));
  if (ext.length) A.push(`Scripts externos: ${ext.join(", ")}. Confira se são necessários (o Pixel e o Analytics são ligados no painel, com aviso de cookies).`);
  if (tem(/fbq\(|gtag\(|googletagmanager/i)) A.push("O HTML já traz Pixel/Analytics fixos: eles carregam sem o aviso de cookies (LGPD). Remova do HTML e ligue em SEO e integrações.");
  const forms = [...h.matchAll(/<form\b[\s\S]*?<\/form>/gi)].map(m => m[0]);
  forms.forEach((f, i) => { const nomes = [...f.matchAll(/<(input|select|textarea)\b[^>]*\bname=["']([^"']+)/gi)].map(m => m[2]), semNome = (f.match(/<(input|select|textarea)\b(?![^>]*\bname=)(?![^>]*type=["'](submit|button|hidden)["'])[^>]*>/gi) || []).length;
    if (semNome) E.push(`Formulário ${i + 1}: ${semNome} campo(s) sem name (não aparecem no lead).`);
    if (!nomes.some(n => /whats|telefone|celular|fone|email/i.test(n))) A.push(`Formulário ${i + 1}: sem campo de contato (whatsapp, telefone ou email). O painel usa esse campo para o botão de WhatsApp do lead.`);
    const act = (f.match(/<form\b[^>]*\baction=["']([^"']*)/i) || [])[1]; if (act && act !== "#") A.push(`Formulário ${i + 1} envia para ${act}: o lead é registrado no painel e o envio segue para esse endereço.`);
    if (/senha|password|cart[aã]o|cvv/i.test(nomes.join(" "))) E.push(`Formulário ${i + 1} pede senha ou dados de cartão: não é permitido em landing page (use a loja ou o pagamento do Kit).`); });
  if (forms.length) OK.push(`${forms.length} formulário(s): cada envio vira um lead no painel`);
  // Kit Upe
  const usados = [...new Set([...h.matchAll(/\b(data-upe-[a-z-]+)/g)].map(m => m[1]))];
  const desconhecidos = usados.filter(u => !HOOKS.includes(u) && !/^data-upe-ed$/.test(u)); if (desconhecidos.length) E.push(`Atributos do Kit desconhecidos: ${desconhecidos.join(", ")}.`);
  [...h.matchAll(/data-upe-acao=["']([^"']+)/g)].forEach(m => { if (!ACOES.includes(m[1])) E.push(`data-upe-acao="${m[1]}" inválido (use ${ACOES.join(", ")}).`); });
  [...h.matchAll(/data-upe-link=["']([^"']+)/g)].forEach(m => { if (!LINKS.includes(m[1].split(":")[0])) E.push(`data-upe-link="${m[1]}" inválido (use ${LINKS.join(", ")} ou produto:<id>).`); });
  [...h.matchAll(/data-campo=["']([^"']+)/g)].forEach(m => { if (!CAMPOS.includes(m[1])) A.push(`data-campo="${m[1]}" não é reconhecido (use ${CAMPOS.join(", ")}).`); });
  const loja = op("loja") || (h.match(/<html[^>]*data-upe-loja=["']([^"']+)/i) || [])[1], agenda = op("agenda") || (h.match(/data-upe-agenda=["']([a-z0-9-]+)/i) || [])[1];
  if (usados.some(u => /produt|preco|carrinho/.test(u)) && !loja) A.push("Usa produtos/carrinho mas não diz a loja: ligue a loja em SEO e integrações › Ligações (ou <html data-upe-loja=\"…\">).");
  if (usados.includes("data-upe-servicos") && !agenda) A.push("Usa serviços da agenda mas não diz a agenda: ligue em SEO e integrações › Ligações.");
  if (tem(/<template>[\s\S]*?<\/template>/i) && tem(/data-upe-produtos/)) { const t = h.match(/data-upe-produtos[^>]*>\s*<template>([\s\S]*?)<\/template>/i); if (t && !/data-campo=["']nome/.test(t[1])) A.push("O <template> dos produtos não tem data-campo=\"nome\"."); }
  if (usados.length) OK.push(`Kit Upe: ${usados.filter(u => HOOKS.includes(u)).join(", ")}`);
  if (tem(/<script[^>]+upe-kit\.js/i)) A.push("O HTML já carrega o upe-kit.js: na plataforma ele entra sozinho (deixe só se a página for hospedada fora da Upe).");
  console.log(`\n${path.basename(arq)}`);
  OK.forEach(m => console.log("  ✓ " + m)); A.forEach(m => console.log("  ⚠ " + m)); E.forEach(m => console.log("  ✗ " + m));
  console.log(E.length ? `  → ${E.length} erro(s): corrija antes de subir.` : "  → Pronto para subir no Painel Upe Serviços.");
  if (E.length) falhou = true;
}
process.exit(falhou ? 1 : 0);
