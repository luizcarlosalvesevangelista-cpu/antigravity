// Troca no banco os endereços antigos (.web.app e projetos upe-erp/upe-tv) pelos do domínio próprio:
// legendas e roteiros do cronograma, configurações do portal e o HTML das landing pages (publicada, rascunho e versões).
// Uso: node migrar_enderecos.js            → só mostra o que muda
//      node migrar_enderecos.js --aplicar  → grava
const admin = require('firebase-admin'); admin.initializeApp({ projectId: 'upecriativo-cc472' }); const db = admin.firestore();
const D = 'upecriativo.com.br', APLICAR = process.argv.includes('--aplicar');
const FIXOS = [['upe-erp-painel.web.app', 'painel.' + D], ['upe-erp-lojas.web.app', 'loja.' + D], ['upe-erp-gestao.web.app', 'gestao.' + D], ['upe-erp.web.app', 'erp.' + D], ['upe-tv.web.app', 'tv.' + D]];
const SITES = { 'upe-criativo-erp': 'erp', 'upe-criativo-painel': 'painel', 'upe-criativo-lojas': 'loja', 'upe-criativo-gestao': 'gestao', 'upe-criativo-tv': 'tv', 'upe-criativo-lp': 'lp', 'upe-criativo-sistemas': 'agenda', 'upe-criativo-servicos': 'servicos', 'upe-criativo': 'www' };
const trocar = s => {
  let t = s; for (const [o, n] of FIXOS) t = t.split(o).join(n);
  for (const [site, sub] of Object.entries(SITES).sort((a, b) => b[0].length - a[0].length)) t = t.replace(new RegExp('(?:(?<=\\\\n)|(?<=\\n)|(?<![A-Za-z0-9.-]))' + site.replace(/-/g, '\\-') + '\\.web\\.app\\b', 'g'), sub + '.' + D);
  return t;
};
const fundo = v => typeof v === 'string' ? trocar(v) : Array.isArray(v) ? v.map(fundo) : v && typeof v === 'object' && !(v instanceof admin.firestore.Timestamp) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fundo(x)])) : v;
// coleções com textos que o público ou o cliente veem (eventos e logs ficam como estão)
const ALVOS = ['config', 'cronograma', 'lp_paginas', 'lp_paginas/*/privado', 'lp_paginas/*/versoes', 'clientes', 'srv_config', 'publico', 'agenda_paginas', 'dash_paineis', 'paineis_cliente'];
(async () => {
  let docs = 0, mud = 0;
  for (const alvo of ALVOS) {
    const partes = alvo.split('/'), refs = partes.length === 1 ? (await db.collection(alvo).get()).docs : (await db.collectionGroup(partes[2]).get()).docs.filter(d => d.ref.path.startsWith(partes[0] + '/'));
    for (const d of refs) {
      docs++; const antes = d.data(), depois = fundo(antes);
      if (JSON.stringify(antes) === JSON.stringify(depois)) continue;
      mud++; console.log((APLICAR ? 'gravado ' : 'mudaria ') + d.ref.path);
      if (APLICAR) await d.ref.set(depois);
    }
  }
  console.log(`${docs} documentos lidos, ${mud} ${APLICAR ? 'atualizados' : 'a atualizar (rode com --aplicar)'}`); process.exit(0);
})();
