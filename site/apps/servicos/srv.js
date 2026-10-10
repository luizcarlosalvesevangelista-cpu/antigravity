/* Upe Serviços (Landing pages, Agenda online e Dashboards): conexão com o projeto único upecriativo-cc472.
   Usado pelo painel (upe-criativo-servicos), pelas páginas públicas (upe-criativo-lp, upe-criativo-sistemas) e pelas páginas de vendas.
   Modo demonstração (?demo=1): os mesmos comandos gravam só no navegador, com dados de exemplo, sem tocar no banco.
   A chave web abaixo é pública por natureza: quem protege os dados são as regras (portal/firestore.rules). */
const V = "10.14.1", G = `https://www.gstatic.com/firebasejs/${V}/`;
export const CONFIG = {
  apiKey: "AIzaSyDJqqSMLWZLKSt9K1jPzvvQgyikZy4q9vw",
  authDomain: "upecriativo-cc472.firebaseapp.com",
  projectId: "upecriativo-cc472",
  storageBucket: "upecriativo-cc472.firebasestorage.app",
  messagingSenderId: "574926941318",
  appId: "1:574926941318:web:effa37317480bde29fb507",
};
export const SITES = { servicos: "https://upe-criativo-servicos.web.app", lp: "https://upe-criativo-lp.web.app", sistemas: "https://upe-criativo-sistemas.web.app", site: "https://upe-criativo.web.app" };
export const ADMIN_EMAIL = "upecriativo@gmail.com";
export const WHATS = "5511934393249";

const qs = new URLSearchParams(location.search);
const LSD = (() => { try { return localStorage; } catch { return null; } })();
export const DEMO = qs.has("demo") ? qs.get("demo") !== "0" : (LSD && LSD.getItem("srv-demo") === "1");
try { if (qs.has("demo")) LSD.setItem("srv-demo", qs.get("demo") !== "0" ? "1" : "0"); } catch {}

export const uid = (n = 20) => { const a = "abcdefghijkmnopqrstuvwxyz23456789"; let s = ""; const r = crypto.getRandomValues(new Uint8Array(n)); for (const x of r) s += a[x % a.length]; return s; };
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const cmp = (a, op, b) => op === "==" ? a === b : op === ">=" ? a >= b : op === "<=" ? a <= b : op === ">" ? a > b : op === "<" ? a < b : op === "!=" ? a !== b : op === "array-contains" ? Array.isArray(a) && a.includes(b) : op === "in" ? b.includes(a) : false;

/* ---------- banco de demonstração (localStorage) ---------- */
function demoDb(seed) {
  const K = "srv-demo-db-v1";
  let M; try { M = JSON.parse(LSD.getItem(K) || "null"); } catch { M = null; }
  if (!M) { M = seed ? seed() : {}; save(); }
  function save() { try { LSD.setItem(K, JSON.stringify(M)); } catch (e) { console.warn("demo cheio", e); } }
  const filhos = col => Object.keys(M).filter(k => k.startsWith(col + "/") && !k.slice(col.length + 1).includes("/"));
  const aplica = (arr, o = {}) => {
    let r = arr;
    for (const [f, op, v] of o.where || []) r = r.filter(x => cmp(x[f], op, v));
    if (o.order) { const [f, d] = o.order; r = r.slice().sort((a, b) => (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * (d === "desc" ? -1 : 1)); }
    if (o.limit) r = r.slice(0, o.limit);
    return r;
  };
  return {
    demo: true,
    async get(p) { return M[p] ? { id: p.split("/").pop(), ...clone(M[p]) } : null; },
    async list(col, o) { return aplica(filhos(col).map(k => ({ id: k.split("/").pop(), _path: k, ...clone(M[k]) })), o); },
    async group(nome, o) { return aplica(Object.keys(M).filter(k => { const s = k.split("/"); return s.length >= 2 && s[s.length - 2] === nome; }).map(k => ({ id: k.split("/").pop(), _path: k, ...clone(M[k]) })), o); },
    async set(p, d, op = {}) { M[p] = op.merge && M[p] ? { ...M[p], ...clone(d) } : clone(d); save(); },
    async add(col, d) { const id = uid(); M[col + "/" + id] = clone(d); save(); return id; },
    async del(p) { delete M[p]; Object.keys(M).filter(k => k.startsWith(p + "/")).forEach(k => delete M[k]); save(); },
    async batch(ops) { for (const o of ops) { if (o.set) await this.set(o.set[0], o.set[1], o.set[2]); if (o.create) { if (M[o.create[0]]) throw { code: "permission-denied" }; await this.set(o.create[0], o.create[1]); } if (o.del) await this.del(o.del); } },
    reset() { M = seed ? seed() : {}; save(); },
  };
}

/* ---------- Firestore ---------- */
let FB = null;
async function fb() {
  if (FB) return FB;
  const [a, au, f] = await Promise.all([import(G + "firebase-app.js"), import(G + "firebase-auth.js"), import(G + "firebase-firestore.js")]);
  const app = a.initializeApp(CONFIG), auth = au.getAuth(app), db = f.initializeFirestore(app, { ignoreUndefinedProperties: true });
  FB = { a, au, f, app, auth, db }; return FB;
}
function realDb() {
  const q = async (ref, o = {}) => {
    const { f } = FB; const parts = [];
    for (const [k, op, v] of o.where || []) parts.push(f.where(k, op, v));
    if (o.order) parts.push(f.orderBy(o.order[0], o.order[1] || "asc"));
    if (o.limit) parts.push(f.limit(o.limit));
    const s = await f.getDocs(parts.length ? f.query(ref, ...parts) : ref);
    return s.docs.map(d => ({ id: d.id, _path: d.ref.path, ...d.data() }));
  };
  return {
    demo: false,
    async get(p) { await fb(); const s = await FB.f.getDoc(FB.f.doc(FB.db, p)); return s.exists() ? { id: s.id, ...s.data() } : null; },
    async list(col, o) { await fb(); return q(FB.f.collection(FB.db, col), o); },
    async group(nome, o) { await fb(); return q(FB.f.collectionGroup(FB.db, nome), o); },
    async set(p, d, op = {}) { await fb(); return FB.f.setDoc(FB.f.doc(FB.db, p), d, op.merge ? { merge: true } : {}); },
    async add(col, d) { await fb(); const r = await FB.f.addDoc(FB.f.collection(FB.db, col), d); return r.id; },
    async del(p) { await fb(); return FB.f.deleteDoc(FB.f.doc(FB.db, p)); },
    async batch(ops) {
      await fb(); const b = FB.f.writeBatch(FB.db);
      for (const o of ops) { if (o.set) b.set(FB.f.doc(FB.db, o.set[0]), o.set[1], o.set[2]?.merge ? { merge: true } : {}); if (o.create) b.set(FB.f.doc(FB.db, o.create[0]), o.create[1]); if (o.del) b.delete(FB.f.doc(FB.db, o.del)); }
      return b.commit();
    },
  };
}
/* recursos do plano Blaze: envio de arquivos (Storage), funções e token do usuário */
export async function enviarArquivo(caminho, arquivo) {
  if (DEMO) return await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(arquivo); });
  const { app } = await fb(), st = await import(G + "firebase-storage.js"), ref = st.ref(st.getStorage(app), caminho);
  await st.uploadBytes(ref, arquivo, { contentType: arquivo.type, cacheControl: "public, max-age=31536000" }); return st.getDownloadURL(ref);
}
export async function chamar(nome, dados) { if (DEMO) throw new Error("Indisponível no modo demonstração."); const { app } = await fb(), fn = await import(G + "firebase-functions.js"); return (await fn.httpsCallable(fn.getFunctions(app, "southamerica-east1"), nome)(dados)).data; }
export async function tokenUsuario() { if (DEMO) return ""; const { auth } = await fb(); return auth.currentUser ? auth.currentUser.getIdToken() : ""; }
export const API = "https://upe-criativo-lp.web.app/api";

export function banco(seed) { return DEMO ? demoDb(seed) : realDb(); }

/* ---------- login ---------- */
const MSG = {
  "auth/popup-closed-by-user": "A janela do Google foi fechada antes de terminar.",
  "auth/popup-blocked": "O navegador bloqueou a janela do Google. Libere pop-ups para este site.",
  "auth/invalid-credential": "E-mail ou senha incorretos.", "auth/wrong-password": "E-mail ou senha incorretos.", "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.", "auth/network-request-failed": "Sem conexão com a internet.",
  "auth/email-already-in-use": "Esse e-mail já tem conta. Use “Entrar” ou “Esqueci a senha”.", "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/invalid-email": "E-mail inválido.", "auth/missing-password": "Digite a senha.", "auth/unauthorized-domain": "Este endereço ainda não está autorizado no login do Firebase.",
  "permission-denied": "Sem permissão para isso. Confira se entrou com o e-mail cadastrado pela Upe.", "tempo": "O servidor demorou para responder. Tente de novo.",
};
export const msgErro = e => MSG[e?.code] || (e?.message && !/firebase/i.test(e.message) ? e.message : "Não deu certo agora. Tente de novo.");
const comTempo = (p, ms = 20000) => Promise.race([p, new Promise((_, no) => setTimeout(() => no({ code: "tempo" }), ms))]);

export function login() {
  if (DEMO) {
    let quem = null; try { quem = JSON.parse(LSD.getItem("srv-demo-user") || "null"); } catch {}
    const subs = [];
    const set = u => { quem = u; try { LSD.setItem("srv-demo-user", JSON.stringify(u)); } catch {} subs.forEach(f => f(u)); };
    return {
      demo: true,
      onChange(f) { subs.push(f); setTimeout(() => f(quem), 0); },
      async entrar(email) { set({ uid: email === ADMIN_EMAIL ? "demo-admin" : "demo-cliente", email, emailVerified: true, displayName: email === ADMIN_EMAIL ? "Upe Criativo" : "Cliente exemplo" }); },
      async google() { return this.entrar("cliente@exemplo.com"); },
      async criar(email) { return this.entrar(email); },
      async reset() {}, async verificar() {}, async recarregar() { return quem; },
      async sair() { set(null); },
    };
  }
  return {
    demo: false,
    onChange(f) { fb().then(({ au, auth }) => au.onAuthStateChanged(auth, f)); },
    async entrar(email, senha) { const { au, auth } = await fb(); return comTempo(au.signInWithEmailAndPassword(auth, email, senha)); },
    async google() { const { au, auth } = await fb(); const p = new au.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); return au.signInWithPopup(auth, p); },
    async criar(email, senha) { const { au, auth } = await fb(); const c = await comTempo(au.createUserWithEmailAndPassword(auth, email, senha)); await au.sendEmailVerification(c.user); return c; },
    async reset(email) { const { au, auth } = await fb(); return au.sendPasswordResetEmail(auth, email); },
    async verificar() { const { au, auth } = await fb(); return au.sendEmailVerification(auth.currentUser); },
    async recarregar() { const { auth } = await fb(); await auth.currentUser?.reload(); return auth.currentUser; },
    async sair() { const { au, auth } = await fb(); return au.signOut(auth); },
  };
}

/* ---------- planos padrão (a Upe edita no painel; valores de exemplo) ---------- */
export const PLANOS_PADRAO = [
  { id: "lp-envio", frente: "lp", tipo: "criacao", nome: "Envie o seu HTML", valor: 0, descricao: "Você já tem a página pronta: é só subir o arquivo e publicar.", itens: ["Publicação no endereço Upe", "Painel de análise e leads", "Conexão do seu domínio"], ordem: 1, ativo: true },
  { id: "lp-essencial", frente: "lp", tipo: "criacao", nome: "Landing page essencial", valor: 497, descricao: "Uma página de venda com a sua marca, pronta em até 7 dias úteis.", itens: ["Até 5 seções", "Formulário de contato e botão de WhatsApp", "Versão para celular", "1 rodada de ajustes"], ordem: 2, ativo: true },
  { id: "lp-completa", frente: "lp", tipo: "criacao", nome: "Landing page completa", valor: 997, descricao: "Página completa com texto de venda, SEO e marcação de anúncios.", itens: ["Até 10 seções", "Texto de venda (copy) incluso", "SEO, Meta Pixel e Google Analytics", "2 rodadas de ajustes"], ordem: 3, ativo: true },
  { id: "lp-hospedagem", frente: "lp", tipo: "mensal", nome: "Hospedagem", valor: 29.9, descricao: "Página no ar com painel de análise.", itens: ["Página no ar 24 h", "Visitas, cliques e leads no painel", "Domínio próprio conectado"], ordem: 4, ativo: true },
  { id: "lp-hospedagem-ajustes", frente: "lp", tipo: "mensal", nome: "Hospedagem + ajustes", valor: 79.9, descricao: "A Upe faz pequenas alterações todo mês.", itens: ["Tudo da Hospedagem", "Até 2 pedidos de ajuste por mês", "Relatório mensal de resultados"], ordem: 5, ativo: true },
  { id: "ag-criacao", frente: "agenda", tipo: "criacao", nome: "Agenda online", valor: 697, descricao: "Página de agendamento com os seus serviços e horários.", itens: ["Serviços com duração e preço", "Horários por dia da semana", "Confirmação pelo WhatsApp", "Link para a bio e o Google"], ordem: 6, ativo: true },
  { id: "ag-mensal", frente: "agenda", tipo: "mensal", nome: "Agenda no ar", valor: 49.9, descricao: "Agendamentos ilimitados com painel.", itens: ["Agendamentos ilimitados", "Painel com a agenda do dia", "Dashboard de atendimentos"], ordem: 7, ativo: true },
  { id: "dash-criacao", frente: "dash", tipo: "criacao", nome: "Dashboard sob medida", valor: 1200, descricao: "Indicadores do seu negócio num painel só, a partir das suas planilhas.", itens: ["Reunião para definir os indicadores", "Até 8 indicadores e 3 gráficos", "Atualização automática pela planilha"], ordem: 8, ativo: true },
  { id: "dash-mensal", frente: "dash", tipo: "mensal", nome: "Dashboard no ar", valor: 59.9, descricao: "Painel sempre atualizado, com suporte.", itens: ["Painel online 24 h", "Ajustes de indicadores", "Suporte pelo WhatsApp"], ordem: 9, ativo: true },
];
export const FRENTES = { lp: "Landing pages", agenda: "Agenda online", dash: "Dashboards" };

/* ---------- utilidades ---------- */
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const brl = v => (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const hoje = () => new Date().toISOString().slice(0, 10);
export const slugify = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
