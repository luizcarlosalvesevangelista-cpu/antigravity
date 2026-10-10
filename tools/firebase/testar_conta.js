// Testa as regras da conta única do cliente (portal_convites, portal_acessos, paineis_cliente) com um usuário de teste.
// Cria e apaga tudo o que usa. Uso: GOOGLE_APPLICATION_CREDENTIALS=chave.json node testar_conta.js
const admin = require('firebase-admin'); admin.initializeApp({ projectId: 'upecriativo-cc472' });
const K = 'AIzaSyDJqqSMLWZLKSt9K1jPzvvQgyikZy4q9vw', B = 'https://firestore.googleapis.com/v1/projects/upecriativo-cc472/databases/(default)/documents';
const enc = v => typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v) };
const corpo = d => JSON.stringify({ fields: Object.fromEntries(Object.entries(d).map(([k, x]) => [k, enc(x)])) });
const db = admin.firestore(), EMAIL = 'teste-conta-' + Date.now() + '@exemplo.com', SENHA = 'teste-' + Math.random().toString(36).slice(2, 10);
let falhas = 0; const conf = (nome, obtido, esperado) => { const ok = obtido === esperado; if (!ok) falhas++; console.log(`${ok ? '✓' : '✗'} ${nome}: ${obtido} (esperado ${esperado})`); };
(async () => {
  const u = await admin.auth().createUser({ email: EMAIL, password: SENHA, emailVerified: true });
  try {
    const tk = (await (await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${K}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: SENHA, returnSecureToken: true }) })).json()).idToken;
    const H = { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' };
    const criar = async (p, d) => (await fetch(`${B}/${p.split('/').slice(0, -1).join('/')}?documentId=${p.split('/').pop()}`, { method: 'POST', headers: H, body: corpo(d) })).status;
    const ler = async (p, h = H) => (await fetch(`${B}/${p}`, { headers: h })).status;
    conf('acesso sem convite', await criar(`portal_acessos/${u.uid}`, { cliente: 'teste-cli', email: EMAIL, criadoEm: Date.now() }), 403);
    await db.doc(`portal_convites/${EMAIL}`).set({ cliente: 'teste-cli', criadoEm: Date.now() });
    await db.doc('paineis_cliente/teste-cli_erp').set({ cliente: 'teste-cli', frente: 'erp', html: '<p>ok</p>', nome: 'x.html', em: Date.now() });
    await db.doc('paineis_cliente/teste-outro_erp').set({ cliente: 'teste-outro', frente: 'erp', html: '<p>não</p>', nome: 'y.html', em: Date.now() });
    conf('ler o próprio convite', await ler(`portal_convites/${EMAIL}`), 200);
    conf('ler convite de outro e-mail', await ler('portal_convites/outro@exemplo.com'), 403);
    conf('painel personalizado antes do acesso', await ler('paineis_cliente/teste-cli_erp'), 403);
    conf('acesso com cliente diferente do convite', await criar(`portal_acessos/${u.uid}`, { cliente: 'teste-outro', email: EMAIL, criadoEm: Date.now() }), 403);
    conf('acesso com campo a mais', await criar(`portal_acessos/${u.uid}`, { cliente: 'teste-cli', email: EMAIL, criadoEm: Date.now(), admin: 'sim' }), 403);
    conf('acesso igual ao convite', await criar(`portal_acessos/${u.uid}`, { cliente: 'teste-cli', email: EMAIL, criadoEm: Date.now() }), 200);
    conf('painel personalizado do próprio cliente', await ler('paineis_cliente/teste-cli_erp'), 200);
    conf('painel personalizado de outro cliente', await ler('paineis_cliente/teste-outro_erp'), 403);
    conf('painel personalizado sem login', await ler('paineis_cliente/teste-cli_erp', {}), 403);
    conf('cliente gravando painel personalizado', await criar('paineis_cliente/teste-cli_tv', { cliente: 'teste-cli', frente: 'tv', html: 'x' }), 403);
    conf('cliente gravando convite', await criar('portal_convites/hack@exemplo.com', { cliente: 'teste-cli' }), 403);
  } finally {
    await admin.auth().deleteUser(u.uid);
    for (const p of [`portal_convites/${EMAIL}`, `portal_acessos/${u.uid}`, 'paineis_cliente/teste-cli_erp', 'paineis_cliente/teste-outro_erp', 'paineis_cliente/teste-cli_tv', 'portal_convites/hack@exemplo.com']) await db.doc(p).delete().catch(() => {});
  }
  console.log(falhas ? `${falhas} falha(s)` : 'Todas as regras da conta única conferem.'); process.exit(falhas ? 1 : 0);
})();
