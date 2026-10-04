/* Portal Upe · cliente + administrador
   Dados: Firebase (Auth + Firestore + Storage) quando PORTAL_CONFIG.firebase existe; senão, modo demonstração no navegador. */
(() => {
"use strict";
const CFG = window.PORTAL_CONFIG || {};
const G = __GLYPHS__;
const LETTERS = ["P", "E", "C", "R", "I1", "A", "T", "I2", "V", "O"];
const WM = `<svg class="wm" viewBox="786 2599 350 48" aria-hidden="true">${["N", "U", ...LETTERS].map(k => `<path d="${G[k]}"/>`).join("")}</svg>`;
const ICON = `<svg class="wm" viewBox="786 2599 36 48" aria-hidden="true"><path d="${G.N}"/><path d="${G.U}"/></svg>`;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $("#app"), dlg = $("#dlg");

/* ---------------- utilidades ---------------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = n => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pad = n => String(n).padStart(2, "0");
const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fdate = s => { if (!s) return "—"; const [y, m, d] = String(s).slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
const fdt = ms => { if (!ms) return ""; const d = new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const uid = (n = 20) => { const a = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint8Array(n)); return [...r].map(x => a[x % a.length]).join(""); };
const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => { const r = crypto.getRandomValues(new Uint8Array(12)); const s = [...r].map(x => CODE_ABC[x % 32]).join(""); return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`; };
const normCode = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
async function sha256(s) {
  if (crypto.subtle) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return "x" + (h >>> 0).toString(16); // só para navegadores sem crypto.subtle no modo demo
}
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} } };
const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.remove("hide"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hide"), 2600); }
async function copy(text, okMsg = "Copiado") { try { await navigator.clipboard.writeText(text); toast(okMsg); } catch (e) { toast("Selecione o texto e copie manualmente"); } }
const waLink = (num, txt) => `https://wa.me/${String(num || "").replace(/\D/g, "")}${txt ? `?text=${encodeURIComponent(txt)}` : ""}`;
const portalUrl = () => location.href.split("#")[0];
function kind(url, tipo) {
  if (tipo === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url || "")) return "video";
  if (tipo === "audio" || /\.(mp3|wav|m4a|ogg)(\?|$)/i.test(url || "")) return "audio";
  if (/\.pdf(\?|$)/i.test(url || "")) return "pdf";
  return url ? "img" : "none";
}
function mediaHTML(url, tipo, cls = "") {
  const k = kind(url, tipo), u = esc(url);
  if (k === "video") return `<video class="${cls}" src="${u}" controls playsinline preload="metadata"></video>`;
  if (k === "audio") return `<audio src="${u}" controls preload="metadata"></audio>`;
  if (k === "pdf") return `<a class="btn sec sm" href="${u}" target="_blank" rel="noopener">Abrir PDF</a>`;
  if (k === "img") return `<img class="${cls}" src="${u}" alt="">`;
  return "";
}

/* ---------------- status ---------------- */
const ST = {
  rascunho: ["Rascunho", ""], pendente: ["Aguardando aprovação", "warn"], aprovado: ["Aprovado", "ok"], ajustes: ["Ajustes pedidos", "bad"],
  publicado: ["Publicado", "info"], orcamento: ["Orçamento", ""], producao: ["Em produção", "info"], entregue: ["Entregue", "ok"],
  novo: ["Novo", "warn"], cancelado: ["Cancelado", ""], aberta: ["Em aberto", "warn"], paga: ["Paga", "ok"], informado: ["Pagamento informado", "info"],
  convertido: ["Virou cliente", "ok"], arquivado: ["Arquivado", ""]
};
const pill = s => { const [l, c] = ST[s] || [s, ""]; return `<span class="pill ${c}">${esc(l)}</span>`; };
const evCls = s => (ST[s] || ["", ""])[1];
const TIPOS_POST = { imagem: "Imagem", carrossel: "Carrossel", video: "Vídeo", reels: "Reels", story: "Story", legenda: "Legenda", audio: "Áudio" };

function statusOf(item, acoes) {
  const v = item.versao || 1;
  let best = { status: item.status || "pendente", texto: item.nota || "", em: item.statusEm || 0, por: "upe" };
  for (const a of acoes) {
    if (a.alvo !== item.id || (a.versao || 1) !== v || (a.tipo !== "aprovar" && a.tipo !== "ajuste")) continue;
    if (a.em > best.em) best = { status: a.tipo === "aprovar" ? "aprovado" : "ajustes", texto: a.texto || "", em: a.em, por: "cliente" };
  }
  return best;
}
const thread = (doc, acoes) => [
  ...(doc.mensagens || []).map(m => ({ ...m, autor: "upe" })),
  ...acoes.filter(a => a.tipo === "mensagem").map(a => ({ id: a.id, autor: "cliente", texto: a.texto, em: a.em }))
].sort((a, b) => a.em - b.em);
const pedidosOf = (doc, acoes) => acoes.filter(a => a.tipo === "pedido").map(a => ({ ...a, status: doc.pedidosAdm?.[a.id]?.status || "novo" })).sort((a, b) => b.em - a.em);
function cobStatus(c, acoes) { if (c.status === "paga" || c.status === "cancelado") return c.status; return acoes.some(a => a.tipo === "pagamento" && a.alvo === c.id) ? "informado" : "aberta"; }
function pendencias(doc, acoes, lastSeen = 0) {
  const vis = it => it.status !== "rascunho" && it.status !== "orcamento";
  const posts = (doc.posts || []).filter(vis).filter(p => statusOf(p, acoes).status === "pendente");
  const artes = (doc.graficos || []).filter(vis).filter(g => statusOf(g, acoes).status === "pendente");
  const cobs = (doc.cobrancas || []).filter(c => c.liberada && cobStatus(c, acoes) === "aberta");
  const msgs = thread(doc, acoes).filter(m => m.autor === "upe" && m.em > lastSeen);
  return { posts, artes, cobs, msgs };
}

/* ---------------- PIX (BR Code) ---------------- */
const noAcc = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 .@+\-_/]/g, " ").replace(/\s+/g, " ").trim();
const emv = (id, v) => id + String(v.length).padStart(2, "0") + v;
function crc16(s) { let c = 0xFFFF; for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, "0"); }
function pixPayload({ chave, nome, cidade, valor, txid, descricao }) {
  const gui = emv("00", "br.gov.bcb.pix") + emv("01", String(chave).trim()) + (descricao ? emv("02", noAcc(descricao).slice(0, 40)) : "");
  let p = emv("00", "01") + emv("26", gui) + emv("52", "0000") + emv("53", "986") + (valor ? emv("54", Number(valor).toFixed(2)) : "") +
    emv("58", "BR") + emv("59", noAcc(nome).slice(0, 25) || "UPE CRIATIVO") + emv("60", noAcc(cidade).slice(0, 15) || "SAO PAULO") +
    emv("62", emv("05", (noAcc(txid).replace(/[^A-Za-z0-9]/g, "") || "***").slice(0, 25)));
  p += "6304"; return p + crc16(p);
}

/* ---------------- armazenamento ---------------- */
const DEMO_KEY = "upe-portal-demo-v1";
class LocalStore {
  constructor() { this.mode = "demo"; let d = null; try { d = JSON.parse(ls.get(DEMO_KEY)); } catch (e) {} this.d = d && d.cols ? d : { cols: {} }; }
  async init() { if (!this.d.seeded) { await seedDemo(this); this.d.seeded = true; this.save(); } }
  save() { ls.set(DEMO_KEY, JSON.stringify(this.d)); }
  sp(path) { const i = path.lastIndexOf("/"); return [path.slice(0, i), path.slice(i + 1)]; }
  async get(path) { const [c, id] = this.sp(path); return clone(this.d.cols[c]?.[id]) || null; }
  async set(path, data, merge = false) { const [c, id] = this.sp(path); const col = this.d.cols[c] || (this.d.cols[c] = {}); col[id] = merge ? { ...(col[id] || {}), ...clone(data) } : clone(data); this.save(); }
  async add(c, data) { const id = uid(); await this.set(`${c}/${id}`, data); return id; }
  async del(path) { const [c, id] = this.sp(path); if (this.d.cols[c]) delete this.d.cols[c][id]; this.save(); }
  async list(c) { return Object.entries(this.d.cols[c] || {}).map(([id, v]) => ({ id, ...clone(v) })); }
  async login(email, pass) { if (email.trim().toLowerCase() === "admin@upe.demo" && pass === "upe-demo") { ss.set("upe-adm", "1"); return true; } throw new Error("E-mail ou senha incorretos."); }
  async currentAdmin() { return ss.get("upe-adm") === "1"; }
  async logout() { ss.set("upe-adm", null); }
  async upload(file) { return URL.createObjectURL(file); }
  reset() { ls.set(DEMO_KEY, null); location.reload(); }
}
class FireStore {
  constructor(cfg) { this.mode = "firebase"; this.cfg = cfg; }
  async init() {
    const v = "10.12.2", base = `https://cdn.jsdelivr.net/npm/firebase@${v}/`;
    for (const f of ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js", "firebase-storage-compat.js"]) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = base + f; s.onload = ok; s.onerror = () => no(new Error("Não foi possível carregar o Firebase.")); document.head.appendChild(s); });
    firebase.initializeApp(this.cfg); this.db = firebase.firestore(); this.auth = firebase.auth(); try { this.st = firebase.storage(); } catch (e) { this.st = null; }
    this.ready = new Promise(r => { const off = this.auth.onAuthStateChanged(u => { off(); r(u); }); });
  }
  async get(p) { const s = await this.db.doc(p).get(); return s.exists ? s.data() : null; }
  async set(p, d, merge = false) { await this.db.doc(p).set(d, { merge }); }
  async add(c, d) { return (await this.db.collection(c).add(d)).id; }
  async del(p) { await this.db.doc(p).delete(); }
  async list(c) { const s = await this.db.collection(c).get(); return s.docs.map(d => ({ id: d.id, ...d.data() })); }
  async login(email, pass) {
    const r = await this.auth.signInWithEmailAndPassword(email.trim(), pass).catch(() => { throw new Error("E-mail ou senha incorretos."); });
    if (!(await this.get(`admins/${r.user.uid}`))) { await this.auth.signOut(); throw new Error("Este usuário não está liberado como administrador."); }
    return true;
  }
  async currentAdmin() { const u = await this.ready && this.auth.currentUser; if (!u) return false; try { return !!(await this.get(`admins/${u.uid}`)); } catch (e) { return false; } }
  async logout() { await this.auth.signOut(); }
  async upload(file, path) { if (!this.st) return null; const ref = this.st.ref(`${path}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`); await ref.put(file); return await ref.getDownloadURL(); }
}
const S = CFG.firebase ? new FireStore(CFG.firebase) : new LocalStore();

/* ---------------- regras de negócio ---------------- */
const Api = {
  async clientIdByCode(code) { const n = normCode(code); if (n.length !== 12) return null; const c = await S.get(`codigos/${await sha256(n)}`); return c?.clienteId || null; },
  async loadClient(id) { const doc = await S.get(`clientes/${id}`); if (!doc) return null; const acoes = (await S.list(`clientes/${id}/acoes`)).sort((a, b) => a.em - b.em); return { id, doc, acoes }; },
  async act(id, a) { return S.add(`clientes/${id}/acoes`, { ...a, em: Date.now() }); },
  blankClient(over = {}) {
    return Object.assign({ nome: "", empresa: "", marca: "", criadoEm: Date.now(), ativo: true,
      plano: { branding: true, midias: false, grafica: false },
      acesso: { apresentacao: false, manual: false, calendario: false, graficos: false, recompra: false, pagamentos: false },
      recorrente: { ativo: false, valor: 0, dia: 10, descricao: "Mensalidade" },
      incluso: [], manual: { url: "", nome: "" }, apresentacao: null, posts: [], graficos: [], cobrancas: [], mensagens: [], pedidosAdm: {}, lidoAdmEm: 0 }, over);
  },
  async createClient(doc, priv = {}) {
    const id = uid(), code = genCode(), hash = await sha256(normCode(code));
    await S.set(`clientes/${id}`, doc); await S.set(`privado/${id}`, { ...priv, codigo: code, codigoHash: hash, criadoEm: Date.now() }); await S.set(`codigos/${hash}`, { clienteId: id });
    return { id, code };
  },
  async regenCode(id) {
    const p = (await S.get(`privado/${id}`)) || {}; if (p.codigoHash) await S.del(`codigos/${p.codigoHash}`).catch(() => {});
    const code = genCode(), hash = await sha256(normCode(code)); await S.set(`codigos/${hash}`, { clienteId: id }); await S.set(`privado/${id}`, { ...p, codigo: code, codigoHash: hash }); return code;
  },
  async deleteClient(id) {
    const p = await S.get(`privado/${id}`); if (p?.codigoHash) await S.del(`codigos/${p.codigoHash}`).catch(() => {});
    for (const a of await S.list(`clientes/${id}/acoes`)) await S.del(`clientes/${id}/acoes/${a.id}`);
    await S.del(`privado/${id}`); await S.del(`clientes/${id}`);
  },
  async listClients() {
    const [cs, ps] = await Promise.all([S.list("clientes"), S.list("privado")]);
    const pm = Object.fromEntries(ps.map(p => [p.id, p]));
    return Promise.all(cs.map(async c => ({ id: c.id, doc: c, priv: pm[c.id] || {}, acoes: (await S.list(`clientes/${c.id}/acoes`)).sort((a, b) => a.em - b.em) })));
  },
  async config() { return (await S.get("config/publico")) || {}; }
};

/* ---------------- dados de demonstração ---------------- */
async function seedDemo(st) {
  const A = CFG.assetsDemo || "../assets/";
  const day = o => { const d = new Date(); d.setDate(d.getDate() + o); return isoDay(d); };
  const now = Date.now(), H = 3600e3;
  const doc = Api.blankClient({
    nome: "Marina Alves", empresa: "Café Aurora (exemplo)", marca: "Café Aurora",
    plano: { branding: true, midias: true, grafica: true },
    acesso: { apresentacao: true, manual: true, calendario: true, graficos: true, recompra: true, pagamentos: true },
    recorrente: { ativo: true, valor: 890, dia: 10, descricao: "Mídias digitais · mensalidade" },
    incluso: [{ item: "Diagnóstico e pesquisa", feito: true }, { item: "Redesign do logotipo", feito: true }, { item: "Manual da marca", feito: true }, { item: "12 posts por mês no Instagram", feito: false }, { item: "Cartão de visita e cardápio", feito: false }],
    manual: { url: A + "img/brand.jpg", nome: "Manual da marca Café Aurora (arquivo de exemplo)" },
    apresentacao: {
      marca: "Café Aurora", lede: "A proposta completa do redesign, com o filme da marca e o feed para ampliar.", pdf: "", pdfTamanho: "", baseUrl: "",
      cores: [{ nome: "Azul Aurora", hex: "#0C4F7F" }, { nome: "Creme", hex: "#F2F0E1" }, { nome: "Ardósia", hex: "#798EA6" }],
      slides: [{ nome: "Capa", img: A + "img/filme-h.jpg" }, { nome: "Identidade", img: A + "img/brand.jpg" }, { nome: "Redesenho", img: A + "img/redesign.jpg" }, { nome: "Filme da marca", tipo: "filme" }, { nome: "Instagram", tipo: "instagram" }],
      filme: { titulo: "Filme da marca", texto: "", video: A + "video/filme-h.mp4", poster: A + "img/filme-h.jpg", duracao: "1:42" },
      motions: [], semanas: ["Semana 1 · lançamento"],
      instagram: [{ img: A + "img/brand.jpg", titulo: "Nova identidade", data: "", semana: 1, legenda: "" }, { img: A + "img/redesign.jpg", titulo: "Antes e depois", data: "", semana: 1, legenda: "" }, { img: A + "img/filme-h.jpg", titulo: "Assinatura", data: "", semana: 1, legenda: "" }]
    },
    posts: [
      { id: uid(8), data: day(1), tipo: "imagem", titulo: "Lançamento da nova marca", midias: [A + "img/brand.jpg"], legenda: "Chegou a nova cara do Café Aurora ☕\nMesma receita, marca nova. Vem conhecer!", versao: 1, status: "pendente", statusEm: now - 5 * H },
      { id: uid(8), data: day(3), tipo: "carrossel", titulo: "Antes e depois", midias: [A + "img/redesign.jpg", A + "img/filme-h.jpg"], legenda: "Deslize para ver o antes e depois →", versao: 1, status: "pendente", statusEm: now - 4 * H },
      { id: uid(8), data: day(-2), tipo: "reels", titulo: "Bastidores do redesign", midias: [A + "video/filme-h.mp4"], legenda: "Como nasceu a nova identidade.", versao: 1, status: "aprovado", statusEm: now - 50 * H },
      { id: uid(8), data: day(6), tipo: "legenda", titulo: "Legenda do cardápio da semana", midias: [], legenda: "Cardápio da semana: pão na chapa, bolo de fubá e café coado. Peça pelo WhatsApp!", versao: 1, status: "pendente", statusEm: now - 2 * H }
    ],
    graficos: [
      { id: uid(8), produto: "Cartão de visita", specs: "9 × 5 cm · couché 300 g · 4×4 cores · laminação fosca", quantidade: 1000, valor: 189, arte: A + "img/brand.jpg", versao: 1, status: "aprovado", statusEm: now - 200 * H, recompra: true, precoRecompra: 169 },
      { id: uid(8), produto: "Cardápio de balcão", specs: "A4 · couché 250 g · frente e verso", quantidade: 50, valor: 240, arte: A + "img/redesign.jpg", versao: 2, status: "pendente", statusEm: now - 3 * H, recompra: false, precoRecompra: 0 },
      { id: uid(8), produto: "Adesivo para copos", specs: "5 cm redondo · vinil · corte especial", quantidade: 500, valor: 155, arte: "", versao: 1, status: "orcamento", statusEm: now - H, recompra: false, precoRecompra: 0 }
    ],
    cobrancas: [
      { id: uid(8), descricao: "Mídias digitais · " + MESES[new Date().getMonth()], valor: 890, vencimento: day(5), liberada: true, status: "aberta", pix: true, cartao: true, linkCartao: "" },
      { id: uid(8), descricao: "Cartões de visita (1.000 un.)", valor: 189, vencimento: day(-20), liberada: true, status: "paga", pix: true, cartao: false, linkCartao: "" }
    ],
    mensagens: [{ id: uid(8), texto: "Oi, Marina! Os posts da semana já estão no calendário para você aprovar.", em: now - 6 * H }]
  });
  const cs = doc; const { id } = await Api.createClient(cs, { email: "marina@cafeaurora.exemplo", telefone: "5511900000000", notas: "Cliente de exemplo do modo demonstração." });
  // código fixo do demo
  const p = await st.get(`privado/${id}`); await st.del(`codigos/${p.codigoHash}`); const code = "AURO-RA26-DEMO", h = await sha256(normCode(code));
  await st.set(`codigos/${h}`, { clienteId: id }); await st.set(`privado/${id}`, { ...p, codigo: code, codigoHash: h });
  await st.add(`clientes/${id}/acoes`, { tipo: "mensagem", texto: "Perfeito! Vou olhar hoje à tarde.", em: now - 5 * H });
  await st.add(`clientes/${id}/acoes`, { tipo: "pedido", alvo: cs.graficos[0].id, quantidade: 1000, modo: "alterado", texto: "Trocar o telefone para (11) 90000-0000.", em: now - 30 * H });
  const d2 = Api.blankClient({ nome: "Rafael Souza", empresa: "Studio Bento (exemplo)", marca: "Studio Bento", plano: { branding: true, midias: false, grafica: false },
    acesso: { apresentacao: false, manual: false, calendario: false, graficos: false, recompra: false, pagamentos: true },
    incluso: [{ item: "Diagnóstico", feito: true }, { item: "Conceito e identidade", feito: false }, { item: "Manual da marca", feito: false }],
    cobrancas: [{ id: uid(8), descricao: "Branding · entrada (50%)", valor: 1500, vencimento: day(2), liberada: true, status: "aberta", pix: true, cartao: true, linkCartao: "" }] });
  await Api.createClient(d2, { email: "rafael@studiobento.exemplo", telefone: "5511911111111" });
  await st.add("contatos", { nome: "Juliana Prado", contato: "juliana@floresdeprado.exemplo", assunto: "Redesign", mensagem: "Minha floricultura tem um logo antigo e queria modernizar sem perder a essência.", em: now - 20 * H, status: "novo" });
  await st.add("contatos", { nome: "Pedro Lima", contato: "11 98888-7777", assunto: "Branding", mensagem: "Vou abrir uma hamburgueria e preciso da marca completa.", em: now - 70 * H, status: "novo" });
  await st.set("config/publico", { pixChave: "upecriativo@gmail.com", pixNome: "Upe Criativo", pixCidade: "Sao Paulo", linkCartao: "", whatsapp: CFG.whatsappUpe || "" });
  for (const t of TEMPLATES()) await st.set(`templates/${t.id}`, t);
}

/* ---------------- modal ---------------- */
function modal(title, body, foot = "", wide = false) {
  dlg.style.width = wide ? "min(1000px, calc(100vw - 24px))" : "";
  dlg.innerHTML = `<div class="mh"><h2>${title}</h2><button class="x" data-close aria-label="Fechar">×</button></div><div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ""}`;
  dlg.querySelectorAll("[data-close]").forEach(b => b.onclick = () => dlg.close());
  if (!dlg.open) dlg.showModal();
  return dlg;
}
dlg.addEventListener("close", () => dlg.querySelectorAll("video,audio").forEach(m => m.pause()));
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

/* ---------------- roteador ---------------- */
let state = { client: null, cfg: {}, admin: false, cache: {} };
const go = h => { if (location.hash === h) route(); else location.hash = h; };
window.addEventListener("hashchange", () => route());
async function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [area, ...rest] = h.split("/");
  try {
    if (area === "admin") return await adminRoute(rest);
    if (area === "c") return await clientRoute(rest[0] || "inicio");
    const cid = ss.get("upe-cliente");
    if (cid) return go("#/c/inicio");
    return gate();
  } catch (e) { console.error(e); app.innerHTML = `<div class="cl-main"><div class="empty"><b>Algo deu errado.</b><span>${esc(e.message)}</span><button class="btn" onclick="location.reload()">Recarregar</button></div></div>`; }
}
const demoBar = () => S.mode === "demo" ? `<div class="demo"><b>Modo demonstração.</b> Os dados ficam só neste navegador. Cliente de exemplo: <span class="code">AURO-RA26-DEMO</span> · Admin: admin@upe.demo / upe-demo</div>` : "";
const pat = () => { const s = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130"><defs><mask id="m" maskUnits="userSpaceOnUse" x="780" y="2590" width="60" height="60"><rect x="780" y="2590" width="60" height="60" fill="#fff"/><path d="${G.U}" fill="#000"/></mask></defs><g fill="#798EA6" transform="translate(65 65) rotate(45) scale(1.7) translate(-804.4 -2620)"><path d="${G.N}"/><rect x="795" y="2605.45" width="18.9" height="30.6" mask="url(#m)"/></g></svg>`; return `url("data:image/svg+xml,${encodeURIComponent(s)}")`; };

/* ---------------- acesso ---------------- */
function gate(mode = "cliente", err = "") {
  app.innerHTML = demoBar() + `<div class="gate"><div class="pat" style="background-image:${pat()}"></div><div class="box">
    <div class="logo">${WM}</div>
    ${mode === "cliente" ? `
      <div class="grid" style="gap:8px"><h1>Portal do cliente</h1><p>Digite o código de acesso que você recebeu da Upe.</p></div>
      <form id="fCode" autocomplete="off" novalidate>
        <div class="codein"><input id="c1" maxlength="4" inputmode="text" aria-label="Código, parte 1" autocapitalize="characters"><span>-</span><input id="c2" maxlength="4" aria-label="Código, parte 2" autocapitalize="characters"><span>-</span><input id="c3" maxlength="4" aria-label="Código, parte 3" autocapitalize="characters"></div>
        ${err ? `<div class="err">${esc(err)}</div>` : ""}
        <button class="btn" type="submit">Entrar</button>
      </form>
      <p class="alt">Não tem o código? <a href="${esc(waLink(CFG.whatsappUpe, "Olá! Preciso do meu código de acesso ao portal Upe."))}" target="_blank" rel="noopener" style="color:var(--creme);font-weight:900">Fale com a Upe</a></p>
      <p class="alt"><button class="lnk" id="toAdm">Acesso administrador</button></p>` : `
      <div class="grid" style="gap:8px"><h1>Administrador</h1><p>Entre com o seu e-mail e senha.</p></div>
      <form id="fAdm" novalidate>
        <input class="pl" id="aEmail" type="email" autocomplete="username" placeholder="E-mail" aria-label="E-mail">
        <input class="pl" id="aPass" type="password" autocomplete="current-password" placeholder="Senha" aria-label="Senha">
        ${err ? `<div class="err">${esc(err)}</div>` : ""}
        <button class="btn" type="submit">Entrar no painel</button>
      </form>
      <p class="alt"><button class="lnk" id="toCli">Sou cliente</button></p>`}
  </div></div>`;
  if (mode === "cliente") {
    const ins = ["#c1", "#c2", "#c3"].map(s => $(s));
    ins.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        const v = normCode(inp.value);
        if (v.length > 4) { const all = normCode(ins.map(x => x.value).join("")); ins.forEach((x, k) => x.value = all.slice(k * 4, k * 4 + 4)); ins[Math.min(2, Math.floor(all.length / 4))].focus(); return; }
        inp.value = v; if (v.length === 4 && i < 2) ins[i + 1].focus();
      });
      inp.addEventListener("keydown", e => { if (e.key === "Backspace" && !inp.value && i > 0) ins[i - 1].focus(); });
      inp.addEventListener("paste", e => { const t = normCode(e.clipboardData.getData("text")); if (t.length >= 8) { e.preventDefault(); ins.forEach((x, k) => x.value = t.slice(k * 4, k * 4 + 4)); ins[2].focus(); } });
    });
    ins[0].focus();
    $("#fCode").onsubmit = async e => {
      e.preventDefault(); const code = ins.map(x => x.value).join("");
      if (normCode(code).length !== 12) return gate("cliente", "O código tem 12 caracteres, no formato XXXX-XXXX-XXXX.");
      const id = await Api.clientIdByCode(code);
      if (!id) return gate("cliente", "Código não encontrado. Confira e tente de novo.");
      ss.set("upe-cliente", id); go("#/c/inicio");
    };
    $("#toAdm").onclick = () => go("#/admin");
  } else {
    $("#aEmail").focus();
    $("#fAdm").onsubmit = async e => {
      e.preventDefault();
      try { await S.login($("#aEmail").value, $("#aPass").value); state.admin = true; go("#/admin/clientes"); }
      catch (er) { gate("admin", er.message); }
    };
    $("#toCli").onclick = () => { history.replaceState(null, "", "#/"); gate(); };
  }
}

/* =====================================================================
   ÁREA DO CLIENTE
   ===================================================================== */
async function clientRoute(tab) {
  const id = ss.get("upe-cliente"); if (!id) return go("#/");
  const c = await Api.loadClient(id); if (!c || c.doc.ativo === false) { ss.set("upe-cliente", null); return gate("cliente", "Este acesso não está ativo. Fale com a Upe."); }
  state.client = c; state.cfg = await Api.config();
  const { doc, acoes } = c, ac = doc.acesso || {}, pl = doc.plano || {};
  const seenKey = `upe-visto-${id}`, lastSeen = +(ls.get(seenKey) || 0);
  const pend = pendencias(doc, acoes, lastSeen);
  const recItems = (doc.graficos || []).filter(g => g.recompra && statusOf(g, acoes).status !== "rascunho");
  const tabs = [
    ["inicio", "Início", 0, true],
    ["apresentacao", "Apresentação", 0, ac.apresentacao && doc.apresentacao],
    ["conteudo", "Conteúdo", pend.posts.length, pl.midias && ac.calendario],
    ["graficos", "Materiais gráficos", pend.artes.length, pl.grafica && ac.graficos],
    ["produtos", "Comprar de novo", 0, pl.grafica && ac.recompra && recItems.length],
    ["pagamentos", "Pagamentos", pend.cobs.length, ac.pagamentos],
    ["mensagens", "Mensagens", tab === "mensagens" ? 0 : pend.msgs.length, true]
  ].filter(t => t[3]);
  if (!tabs.some(t => t[0] === tab)) tab = "inicio";
  if (tab === "mensagens") ls.set(seenKey, String(Date.now()));
  app.innerHTML = demoBar() + `
    <header class="cl-top"><div class="in"><div class="logo">${WM}</div>
      <div class="who"><b>${esc(doc.marca || doc.empresa || doc.nome)}</b><span>${esc(doc.nome)}</span></div>
      <button class="btn sec sm" id="sair">Sair</button></div></header>
    <nav class="tabs" aria-label="Seções do portal"><div class="in">${tabs.map(([k, l, n]) => `<a class="tab" href="#/c/${k}" ${k === tab ? 'aria-current="page"' : ""}>${l}${n ? `<span class="cnt">${n}</span>` : ""}</a>`).join("")}</div></nav>
    <main class="cl-main" id="cmain"></main>`;
  $("#sair").onclick = () => { ss.set("upe-cliente", null); go("#/"); };
  const m = $("#cmain");
  ({ inicio: cInicio, apresentacao: cApres, conteudo: cConteudo, graficos: cGraficos, produtos: cProdutos, pagamentos: cPagamentos, mensagens: cMensagens })[tab](m, c, { pend, recItems, tabs });
}
const refreshClient = () => clientRoute((location.hash.split("/")[2]) || "inicio");

function cInicio(m, { doc }, { pend, tabs }) {
  const has = k => tabs.some(t => t[0] === k);
  const inc = doc.incluso || [], done = inc.filter(i => i.feito).length;
  const cards = [
    has("conteudo") && [`${pend.posts.length}`, pend.posts.length === 1 ? "post aguardando a sua aprovação" : "posts aguardando a sua aprovação", "#/c/conteudo"],
    has("graficos") && [`${pend.artes.length}`, pend.artes.length === 1 ? "arte gráfica para aprovar" : "artes gráficas para aprovar", "#/c/graficos"],
    has("pagamentos") && [brl(pend.cobs.reduce((s, c) => s + (+c.valor || 0), 0)), pend.cobs.length ? `em ${pend.cobs.length} cobrança${pend.cobs.length > 1 ? "s" : ""} em aberto` : "nenhuma cobrança em aberto", "#/c/pagamentos"],
    [`${pend.msgs.length}`, pend.msgs.length === 1 ? "mensagem nova da Upe" : "mensagens novas da Upe", "#/c/mensagens"]
  ].filter(Boolean);
  m.innerHTML = `
    <div class="grid" style="gap:6px"><span class="eb">Seu projeto</span><h1>Olá, ${esc((doc.nome || "").split(" ")[0] || "tudo bem")}!</h1>
      <div class="row">${doc.plano?.branding ? '<span class="pill info">Branding</span>' : ""}${doc.plano?.midias ? '<span class="pill info">Mídias digitais</span>' : ""}${doc.plano?.grafica ? '<span class="pill info">Papelaria gráfica</span>' : ""}</div></div>
    <div class="g4">${cards.map(([n, l, h]) => `<a class="card stat" href="${h}" style="text-decoration:none;color:inherit"><b>${n}</b><span>${l}</span></a>`).join("")}</div>
    <div class="g2">
      <section class="card grid"><div class="spread"><h3>O que está incluso</h3><span class="muted small num">${done} de ${inc.length}</span></div>
        ${inc.length ? `<div class="bar"><i style="width:${inc.length ? done / inc.length * 100 : 0}%"></i></div><ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px">${inc.map(i => `<li class="row" style="flex-wrap:nowrap"><span class="pill ${i.feito ? "ok" : ""}">${i.feito ? "Feito" : "A fazer"}</span><span>${esc(i.item)}</span></li>`).join("")}</ul>` : `<p class="muted">A Upe vai listar aqui as etapas do seu projeto.</p>`}
      </section>
      <div class="grid">
        ${doc.acesso?.manual && doc.manual?.url ? `<section class="card grid"><span class="eb">Manual da marca</span><h3>${esc(doc.manual.nome || "Manual da marca")}</h3><p class="muted small">Logotipos, cores, tipografia e regras de uso.</p><div><a class="btn" href="${esc(doc.manual.url)}" target="_blank" rel="noopener" download>Baixar o manual</a></div></section>` : ""}
        ${has("apresentacao") ? `<section class="card grid"><span class="eb">Apresentação</span><h3>${esc(doc.apresentacao.marca || doc.marca || "A sua marca")}</h3><p class="muted small">${esc(doc.apresentacao.lede || "A proposta completa do projeto.")}</p><div><a class="btn sec" href="#/c/apresentacao">Ver a apresentação</a></div></section>` : ""}
        ${doc.recorrente?.ativo ? `<section class="card grid"><span class="eb">Plano recorrente</span><h3>${esc(doc.recorrente.descricao || "Mensalidade")}</h3><p class="muted">${brl(doc.recorrente.valor)} por mês · vence todo dia ${esc(doc.recorrente.dia)}</p></section>` : ""}
        <section class="card grid"><span class="eb">Precisa de algo?</span><p class="muted small">Escreva para a Upe por aqui ou pelo WhatsApp.</p><div class="row"><a class="btn sec" href="#/c/mensagens">Enviar mensagem</a>${state.cfg.whatsapp || CFG.whatsappUpe ? `<a class="btn sec" href="${esc(waLink(state.cfg.whatsapp || CFG.whatsappUpe, `Olá! Sou ${doc.nome} (${doc.marca || doc.empresa}).`))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</div></section>
      </div>
    </div>`;
}

/* ---------- apresentação (aba 05 do dossiê) ---------- */
function resolveUrl(p, base) { if (!p) return ""; if (/^(https?:|blob:|data:)/.test(p) || !base) return p; try { return new URL(p, base).href; } catch (e) { return p; } }
function cApres(m, { doc }) {
  const A = doc.apresentacao || {}, R = p => resolveUrl(p, A.baseUrl), slides = (A.slides || []).filter(s => s.img || s.tipo);
  let i = 0;
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Apresentação</span><h1>${esc(A.marca || doc.marca || "")}</h1>${A.lede ? `<p class="muted">${esc(A.lede)}</p>` : ""}</div>
    ${A.cores?.length ? `<div class="row">${A.cores.map(c => `<span class="row small" style="gap:6px"><i style="width:18px;height:18px;border-radius:50%;background:${esc(c.hex)};border:1px solid var(--line);display:inline-block"></i>${esc(c.nome)}</span>`).join("")}</div>` : ""}
    ${slides.length ? `<div class="player" id="pl"><div class="stage" id="stg"></div><div class="pbar"><button id="pp" aria-label="Tela anterior">←</button><span class="nm" id="pn"></span><button id="pf">Tela cheia</button><button id="px" aria-label="Próxima tela">→</button></div></div>
      <div class="rail" id="rail">${slides.map((s, k) => `<button data-k="${k}"><div class="rt">${s.img ? `<img src="${esc(R(s.img))}" alt="">` : esc({ filme: "Filme", motions: "Motions", instagram: "Instagram" }[s.tipo] || "Tela")}</div><span>${k + 1}. ${esc(s.nome || "")}</span></button>`).join("")}</div>` : `<div class="empty">A apresentação ainda não foi publicada.</div>`}
    ${A.pdf ? `<div><a class="btn sec" href="${esc(R(A.pdf))}" target="_blank" rel="noopener">Baixar em PDF${A.pdfTamanho ? ` (${esc(A.pdfTamanho)})` : ""}</a></div>` : ""}`;
  if (!slides.length) return;
  const stg = $("#stg");
  const show = k => {
    i = (k + slides.length) % slides.length; const s = slides[i];
    stg.querySelectorAll("video").forEach(v => v.pause());
    if (s.tipo === "filme" && A.filme?.video) stg.innerHTML = `<video src="${esc(R(A.filme.video))}" poster="${esc(R(A.filme.poster))}" controls playsinline></video>`;
    else if (s.tipo === "motions" && A.motions?.length) stg.innerHTML = `<div class="igg" style="grid-template-columns:repeat(2,1fr)">${A.motions.map(mo => `<video src="${esc(R(mo.video))}" poster="${esc(R(mo.poster))}" controls playsinline style="border-radius:8px"></video>`).join("")}</div>`;
    else if (s.tipo === "instagram" && A.instagram?.length) { stg.innerHTML = `<div class="igg">${A.instagram.map((p, k2) => `<button data-ig="${k2}" aria-label="Ampliar ${esc(p.titulo)}"><img src="${esc(R(p.img))}" alt="${esc(p.titulo)}"></button>`).join("")}</div>`; stg.querySelectorAll("[data-ig]").forEach(b => b.onclick = () => { const p = A.instagram[+b.dataset.ig]; modal(esc(p.titulo || "Post"), `<div class="media-box"><img src="${esc(R(p.img))}" alt=""></div>${p.legenda ? `<div class="legenda">${esc(p.legenda)}</div>` : ""}`); }); }
    else stg.innerHTML = s.img ? `<img src="${esc(R(s.img))}" alt="${esc(s.nome)}">` : `<div class="ph">${esc(s.nome)}</div>`;
    $("#pn").textContent = `${i + 1} de ${slides.length} · ${s.nome || ""}`;
    $$("#rail button").forEach(b => b.setAttribute("aria-current", +b.dataset.k === i ? "true" : "false"));
  };
  $("#pp").onclick = () => show(i - 1); $("#px").onclick = () => show(i + 1);
  $("#pf").onclick = () => { const el = $("#pl"); (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => toast("Tela cheia não está disponível aqui")); };
  $$("#rail button").forEach(b => b.onclick = () => show(+b.dataset.k));
  $("#pl").tabIndex = 0; $("#pl").addEventListener("keydown", e => { if (e.key === "ArrowRight") show(i + 1); if (e.key === "ArrowLeft") show(i - 1); });
  show(0);
}

/* ---------- conteúdo: calendário de aprovação ---------- */
let calMonth = null;
function cConteudo(m, c) {
  const { doc, acoes } = c;
  const posts = (doc.posts || []).filter(p => p.status !== "rascunho").map(p => ({ ...p, ef: statusOf(p, acoes) })).sort((a, b) => a.data.localeCompare(b.data));
  if (!calMonth) { const nx = posts.find(p => p.ef.status === "pendente"); const d = nx ? new Date(nx.data + "T12:00") : new Date(); calMonth = [d.getFullYear(), d.getMonth()]; }
  const filt = ss.get("upe-cf") || "todos";
  const draw = () => {
    const [Y, M] = calMonth, first = new Date(Y, M, 1), start = new Date(Y, M, 1 - first.getDay()), today = isoDay(new Date());
    const inMonth = posts.filter(p => p.data.startsWith(`${Y}-${pad(M + 1)}`)).filter(p => filt === "todos" || p.ef.status === filt);
    let cells = ""; for (let k = 0; k < 42; k++) { const d = new Date(start); d.setDate(start.getDate() + k); const iso = isoDay(d);
      const evs = posts.filter(p => p.data === iso && (filt === "todos" || p.ef.status === filt));
      cells += `<div class="day ${d.getMonth() !== M ? "out" : ""} ${iso === today ? "today" : ""}"><span class="d">${d.getDate()}</span>${evs.map(p => `<button class="ev ${evCls(p.ef.status)}" data-p="${p.id}" title="${esc(p.titulo)}">${esc(TIPOS_POST[p.tipo] || p.tipo)} · ${esc(p.titulo)}</button>`).join("")}</div>`; }
    m.innerHTML = `<div class="spread"><div class="grid" style="gap:6px"><span class="eb">Calendário de conteúdo</span><h1>Aprove os seus posts</h1><p class="muted small">Imagens, vídeos, legendas e áudios. Toque em um post para ver e aprovar.</p></div>
      <div class="row"><button class="btn sec sm" id="mPrev" aria-label="Mês anterior">←</button><b style="min-width:150px;text-align:center;text-transform:capitalize">${MESES[M]} ${Y}</b><button class="btn sec sm" id="mNext" aria-label="Próximo mês">→</button></div></div>
      <div class="row" role="group" aria-label="Filtrar">${[["todos", "Todos"], ["pendente", "Aguardando aprovação"], ["aprovado", "Aprovados"], ["ajustes", "Ajustes pedidos"], ["publicado", "Publicados"]].map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${filt === k}">${l}</button>`).join("")}</div>
      <div class="card pad0"><div class="cal">${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => `<div class="dow">${d}</div>`).join("")}${cells}</div></div>
      <div class="agenda" aria-label="Lista do mês">${inMonth.length ? inMonth.map(p => { const d = new Date(p.data + "T12:00"); return `<button class="agi" data-p="${p.id}"><span class="dt">${pad(d.getDate())}/${pad(d.getMonth() + 1)}<small>${["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][d.getDay()]}</small></span><span><b>${esc(p.titulo)}</b><br><span class="muted small">${esc(TIPOS_POST[p.tipo] || p.tipo)}</span></span>${pill(p.ef.status)}</button>`; }).join("") : `<div class="empty">Nenhum post neste mês.</div>`}</div>`;
    $("#mPrev").onclick = () => { calMonth = M ? [Y, M - 1] : [Y - 1, 11]; draw(); };
    $("#mNext").onclick = () => { calMonth = M < 11 ? [Y, M + 1] : [Y + 1, 0]; draw(); };
    $$("[data-f]", m).forEach(b => b.onclick = () => { ss.set("upe-cf", b.dataset.f); cConteudo(m, c); });
    $$("[data-p]", m).forEach(b => b.onclick = () => postModal(posts.find(p => p.id === b.dataset.p), c));
  };
  draw();
}
function postModal(p, c) {
  const can = p.ef.status === "pendente" || p.ef.status === "ajustes";
  modal(esc(p.titulo), `
    <div class="row">${pill(p.ef.status)}<span class="muted small">${esc(TIPOS_POST[p.tipo] || p.tipo)} · ${fdate(p.data)}${(p.versao || 1) > 1 ? ` · versão ${p.versao}` : ""}</span></div>
    ${(p.midias || []).map(u => `<div class="media-box">${mediaHTML(u, p.tipo)}</div>`).join("")}
    ${p.legenda ? `<div><span class="eb">Legenda</span><div class="legenda">${esc(p.legenda)}</div></div>` : ""}
    ${p.ef.texto && p.ef.status === "ajustes" ? `<div class="card" style="background:var(--bad-bg)"><b>Seu pedido de ajuste:</b> ${esc(p.ef.texto)}</div>` : ""}
    ${can ? `<label class="f" for="pCom">Comentário (obrigatório para pedir ajuste)<textarea id="pCom" placeholder="Ex.: trocar a foto, mudar a primeira frase da legenda…"></textarea></label>` : ""}`,
    can ? `<button class="btn bad" id="pAj">Pedir ajuste</button><button class="btn ok" id="pOk">Aprovar</button>` : `<button class="btn sec" data-close>Fechar</button>`);
  if (!can) return;
  $("#pOk").onclick = async () => { await Api.act(c.id, { tipo: "aprovar", alvo: p.id, versao: p.versao || 1, texto: $("#pCom").value.trim() }); dlg.close(); toast("Post aprovado"); refreshClient(); };
  $("#pAj").onclick = async () => { const t = $("#pCom").value.trim(); if (!t) { $("#pCom").focus(); return toast("Escreva o que precisa mudar"); } await Api.act(c.id, { tipo: "ajuste", alvo: p.id, versao: p.versao || 1, texto: t }); dlg.close(); toast("Pedido de ajuste enviado"); refreshClient(); };
}

/* ---------- materiais gráficos ---------- */
function cGraficos(m, c) {
  const { doc, acoes } = c;
  const gs = (doc.graficos || []).filter(g => g.status !== "orcamento" && g.status !== "rascunho").map(g => ({ ...g, ef: statusOf(g, acoes) }));
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Papelaria gráfica</span><h1>Aprove as suas artes</h1><p class="muted small">Confira a arte, as especificações e o valor antes de ir para a gráfica.</p></div>
    ${gs.length ? `<div class="g3">${gs.map(g => `<article class="card grid">
      <div class="thumb">${g.arte ? mediaHTML(g.arte) : "Arte em preparação"}</div>
      <div class="spread"><h3>${esc(g.produto)}</h3>${pill(g.ef.status)}</div>
      <dl class="spec"><dt>Especificação</dt><dd>${esc(g.specs)}</dd><dt>Quantidade</dt><dd class="num">${esc(Number(g.quantidade || 0).toLocaleString("pt-BR"))}</dd><dt>Valor</dt><dd class="num"><b>${brl(g.valor)}</b></dd>${(g.versao || 1) > 1 ? `<dt>Versão</dt><dd>${g.versao}</dd>` : ""}</dl>
      ${g.ef.status === "ajustes" && g.ef.texto ? `<p class="small" style="color:var(--bad)"><b>Seu ajuste:</b> ${esc(g.ef.texto)}</p>` : ""}
      ${g.ef.status === "pendente" || g.ef.status === "ajustes" ? `<div class="row"><button class="btn ok sm" data-ok="${g.id}">Aprovar arte</button><button class="btn bad sm" data-aj="${g.id}">Pedir ajuste</button>${g.arte ? `<button class="btn sec sm" data-ver="${g.id}">Ampliar</button>` : ""}</div>` : (g.arte ? `<div><button class="btn sec sm" data-ver="${g.id}">Ampliar</button></div>` : "")}
    </article>`).join("")}</div>` : `<div class="empty">Nenhuma arte para aprovar agora.</div>`}`;
  $$("[data-ver]", m).forEach(b => b.onclick = () => { const g = gs.find(x => x.id === b.dataset.ver); modal(esc(g.produto), `<div class="media-box">${mediaHTML(g.arte)}</div>`); });
  $$("[data-ok]", m).forEach(b => b.onclick = async () => { const g = gs.find(x => x.id === b.dataset.ok); await Api.act(c.id, { tipo: "aprovar", alvo: g.id, versao: g.versao || 1, texto: "" }); toast("Arte aprovada"); refreshClient(); });
  $$("[data-aj]", m).forEach(b => b.onclick = () => { const g = gs.find(x => x.id === b.dataset.aj);
    modal(`Ajuste em ${esc(g.produto)}`, `<label class="f" for="gCom">O que precisa mudar?<textarea id="gCom"></textarea></label>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="gSend">Enviar pedido</button>`);
    $("#gSend").onclick = async () => { const t = $("#gCom").value.trim(); if (!t) return $("#gCom").focus(); await Api.act(c.id, { tipo: "ajuste", alvo: g.id, versao: g.versao || 1, texto: t }); dlg.close(); toast("Pedido de ajuste enviado"); refreshClient(); }; });
}

/* ---------- comprar de novo ---------- */
function cProdutos(m, c, { recItems }) {
  const { doc, acoes } = c, peds = pedidosOf(doc, acoes);
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Comprar de novo</span><h1>Seus materiais aprovados</h1><p class="muted small">Peça de novo igual ou com alterações. A Upe confirma o pedido e libera a cobrança.</p></div>
    <div class="g3">${recItems.map(g => `<article class="card grid"><div class="thumb">${g.arte ? mediaHTML(g.arte) : esc(g.produto)}</div><h3>${esc(g.produto)}</h3><p class="muted small">${esc(g.specs)}</p>
      <p class="num"><b>${brl(g.precoRecompra || g.valor)}</b> <span class="muted small">por ${esc(Number(g.quantidade || 0).toLocaleString("pt-BR"))} un.</span></p>
      <div class="row"><button class="btn sm" data-rb="${g.id}" data-m="igual">Comprar igual</button><button class="btn sec sm" data-rb="${g.id}" data-m="alterado">Com alterações</button></div></article>`).join("")}</div>
    <section class="card grid"><h3>Meus pedidos</h3>${peds.length ? `<div class="tbl"><table><thead><tr><th>Data</th><th>Produto</th><th>Qtd.</th><th>Tipo</th><th>Status</th></tr></thead><tbody>${peds.map(p => { const g = (doc.graficos || []).find(x => x.id === p.alvo); return `<tr><td class="num">${fdt(p.em)}</td><td>${esc(g?.produto || "—")}${p.texto ? `<br><span class="muted small">${esc(p.texto)}</span>` : ""}</td><td class="num">${esc(Number(p.quantidade || 0).toLocaleString("pt-BR"))}</td><td>${p.modo === "alterado" ? "Com alterações" : "Igual"}</td><td>${pill(p.status)}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="muted">Você ainda não fez pedidos por aqui.</p>`}</section>`;
  $$("[data-rb]", m).forEach(b => b.onclick = () => {
    const g = recItems.find(x => x.id === b.dataset.rb), alt = b.dataset.m === "alterado";
    modal(`${alt ? "Comprar com alterações" : "Comprar de novo"} · ${esc(g.produto)}`, `
      <label class="f" for="rQ">Quantidade<input id="rQ" type="number" min="1" value="${esc(g.quantidade || 1)}"></label>
      ${alt ? `<label class="f" for="rT">O que muda? (texto, telefone, endereço, cor…)<textarea id="rT"></textarea></label>` : `<p class="muted small">Mesma arte e especificação: ${esc(g.specs)}.</p>`}`,
      `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="rSend">Enviar pedido</button>`);
    $("#rSend").onclick = async () => { const q = +$("#rQ").value, t = alt ? $("#rT").value.trim() : ""; if (!q) return $("#rQ").focus(); if (alt && !t) return $("#rT").focus();
      await Api.act(c.id, { tipo: "pedido", alvo: g.id, quantidade: q, modo: alt ? "alterado" : "igual", texto: t }); dlg.close(); toast("Pedido enviado para a Upe"); refreshClient(); };
  });
}

/* ---------- pagamentos ---------- */
function cPagamentos(m, c) {
  const { doc, acoes } = c, cfg = state.cfg;
  const cobs = (doc.cobrancas || []).filter(x => x.liberada).map(x => ({ ...x, st: cobStatus(x, acoes) })).sort((a, b) => (a.st === "paga") - (b.st === "paga") || String(a.vencimento).localeCompare(b.vencimento));
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Pagamentos</span><h1>Suas cobranças</h1><p class="muted small">Pague por PIX ou cartão. Depois de pagar, toque em “Já paguei” para a Upe confirmar.</p></div>
    ${doc.recorrente?.ativo ? `<div class="card spread"><div><span class="eb">Plano recorrente</span><h3>${esc(doc.recorrente.descricao)}</h3></div><div class="num"><b>${brl(doc.recorrente.valor)}</b><span class="muted small"> / mês · dia ${esc(doc.recorrente.dia)}</span></div></div>` : ""}
    ${cobs.length ? `<div class="grid">${cobs.map(x => `<article class="card spread">
      <div class="grid" style="gap:4px"><h3>${esc(x.descricao)}</h3><span class="muted small">Vencimento ${fdate(x.vencimento)}</span></div>
      <div class="row"><b class="num" style="font-size:1.2rem">${brl(x.valor)}</b>${pill(x.st)}</div>
      ${x.st === "aberta" || x.st === "informado" ? `<div class="row" style="width:100%;justify-content:flex-end">
        ${x.pix && cfg.pixChave ? `<button class="btn sm" data-pix="${x.id}">Pagar com PIX</button>` : ""}
        ${x.cartao && (x.linkCartao || cfg.linkCartao) ? `<a class="btn sec sm" href="${esc(x.linkCartao || cfg.linkCartao)}" target="_blank" rel="noopener">Pagar com cartão</a>` : ""}
        ${x.st === "aberta" ? `<button class="btn sec sm" data-paid="${x.id}">Já paguei</button>` : `<span class="muted small">A Upe vai confirmar o seu pagamento.</span>`}</div>` : ""}
    </article>`).join("")}</div>` : `<div class="empty">Nenhuma cobrança liberada no momento.</div>`}`;
  $$("[data-pix]", m).forEach(b => b.onclick = () => {
    const x = cobs.find(y => y.id === b.dataset.pix);
    const payload = pixPayload({ chave: cfg.pixChave, nome: cfg.pixNome, cidade: cfg.pixCidade, valor: x.valor, txid: ("UPE" + x.id).slice(0, 25), descricao: x.descricao });
    modal("Pagar com PIX", `<div class="grid" style="justify-items:center;text-align:center;gap:12px"><b class="num" style="font-size:1.6rem">${brl(x.valor)}</b><span class="muted small">${esc(x.descricao)}</span><div class="qrbox" id="qr"></div>
      <span class="muted small">Recebedor: ${esc(cfg.pixNome || "")}</span></div><div><span class="eb">PIX copia e cola</span><div class="cc" id="ccx">${esc(payload)}</div></div>`,
      `<button class="btn sec" id="cpx">Copiar código</button><button class="btn" id="paid2">Já paguei</button>`);
    try { new QRCode($("#qr"), { text: payload, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M }); } catch (e) { $("#qr").innerHTML = '<span class="muted small">Use o código copia e cola abaixo.</span>'; }
    $("#cpx").onclick = () => copy(payload, "Código PIX copiado");
    $("#paid2").onclick = async () => { await Api.act(c.id, { tipo: "pagamento", alvo: x.id, metodo: "pix" }); dlg.close(); toast("Obrigado! A Upe vai confirmar."); refreshClient(); };
  });
  $$("[data-paid]", m).forEach(b => b.onclick = async () => { await Api.act(c.id, { tipo: "pagamento", alvo: b.dataset.paid, metodo: "informado" }); toast("Obrigado! A Upe vai confirmar."); refreshClient(); });
}

/* ---------- mensagens ---------- */
function threadHTML(msgs, me) { return msgs.length ? msgs.map(x => `<div class="msg ${x.autor === me ? "me" : "them"}">${esc(x.texto)}<small>${x.autor === "upe" ? "Upe" : "Cliente"} · ${fdt(x.em)}</small></div>`).join("") : `<div class="empty">Nenhuma mensagem ainda.</div>`; }
function cMensagens(m, c) {
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Mensagens</span><h1>Fale com a Upe</h1><p class="muted small">Para dúvidas e situações específicas do seu projeto.</p></div>
    <section class="card grid"><div class="thread" id="th">${threadHTML(thread(c.doc, c.acoes), "cliente")}</div>
    <form class="compose" id="cf"><label class="f" style="flex:1" for="ct">Sua mensagem<textarea id="ct" rows="2"></textarea></label><button class="btn" type="submit">Enviar</button></form></section>`;
  const th = $("#th"); th.scrollTop = th.scrollHeight;
  $("#cf").onsubmit = async e => { e.preventDefault(); const t = $("#ct").value.trim(); if (!t) return; await Api.act(c.id, { tipo: "mensagem", texto: t }); refreshClient(); };
}

/* =====================================================================
   PAINEL DO ADMINISTRADOR
   ===================================================================== */
async function adminRoute(rest) {
  if (!(await S.currentAdmin())) return gate("admin");
  state.admin = true;
  const [sec = "clientes", a1, a2] = rest;
  const [clients, contatos] = await Promise.all([Api.listClients(), S.list("contatos")]);
  state.cache.clients = clients; state.cache.contatos = contatos;
  const unread = clients.reduce((s, c) => s + c.acoes.filter(a => a.tipo === "mensagem" && a.em > (c.doc.lidoAdmEm || 0)).length, 0);
  const novos = contatos.filter(c => (c.status || "novo") === "novo").length;
  const nav = [["clientes", "Clientes", 0], ["contatos", "Contatos do site", novos], ["mensagens", "Inbox", unread], ["newsletter", "Newsletter", 0], ["config", "Configurações", 0]];
  const cur = sec === "cliente" ? "clientes" : sec;
  app.innerHTML = demoBar() + `<div class="adm"><aside class="side"><div class="logo">${WM}</div><nav class="nav">${nav.map(([k, l, n]) => `<a href="#/admin/${k}" ${k === cur ? 'aria-current="page"' : ""}><span>${l}</span>${n ? `<span class="cnt">${n}</span>` : ""}</a>`).join("")}</nav>
    <div class="foot"><span>${S.mode === "demo" ? "Modo demonstração" : "Firebase conectado"}</span><button class="lnk" id="logout">Sair</button></div></aside><main class="work" id="w"></main></div>`;
  $("#logout").onclick = async () => { await S.logout(); state.admin = false; go("#/"); };
  const w = $("#w");
  if (sec === "clientes") return aClientes(w, clients);
  if (sec === "cliente") return aCliente(w, a1, a2 || "projeto");
  if (sec === "contatos") return aContatos(w, contatos);
  if (sec === "mensagens") return aInbox(w, clients, a1);
  if (sec === "newsletter") return a1 ? aNewsEditor(w, a1) : aNewsletter(w);
  if (sec === "config") return aConfig(w);
  go("#/admin/clientes");
}
const reAdmin = () => route();

function aClientes(w, clients) {
  const q = ss.get("upe-aq") || "";
  const rows = clients.filter(c => !q || `${c.doc.nome} ${c.doc.empresa} ${c.doc.marca} ${c.priv.email || ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.doc.criadoEm || 0) - (a.doc.criadoEm || 0));
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Painel Upe</span><h1>Clientes</h1></div><div class="row"><input id="aq" placeholder="Buscar cliente" value="${esc(q)}" aria-label="Buscar cliente" style="width:220px"><button class="btn" id="novo">Novo cliente</button></div></div>
    <div class="g4">${[
      ["Clientes ativos", clients.filter(c => c.doc.ativo !== false).length],
      ["Aguardando aprovação", clients.reduce((s, c) => { const p = pendencias(c.doc, c.acoes); return s + p.posts.length + p.artes.length; }, 0)],
      ["A receber (liberado)", brl(clients.reduce((s, c) => s + (c.doc.cobrancas || []).filter(x => x.liberada && cobStatus(x, c.acoes) !== "paga" && x.status !== "cancelado").reduce((t, x) => t + (+x.valor || 0), 0), 0))],
      ["Pedidos de recompra novos", clients.reduce((s, c) => s + pedidosOf(c.doc, c.acoes).filter(p => p.status === "novo").length, 0)]
    ].map(([l, n]) => `<div class="card stat"><b>${n}</b><span>${l}</span></div>`).join("")}</div>
    <div class="card pad0 tbl">${rows.length ? `<table><thead><tr><th>Cliente</th><th>Plano</th><th>Pendências</th><th>Pagamentos</th><th>Última atividade</th></tr></thead><tbody>${rows.map(c => {
      const p = pendencias(c.doc, c.acoes), last = Math.max(c.doc.criadoEm || 0, ...c.acoes.map(a => a.em)), unread = c.acoes.filter(a => a.tipo === "mensagem" && a.em > (c.doc.lidoAdmEm || 0)).length;
      const inf = (c.doc.cobrancas || []).filter(x => cobStatus(x, c.acoes) === "informado").length;
      return `<tr class="click" data-id="${c.id}" tabindex="0"><td><b>${esc(c.doc.marca || c.doc.empresa || c.doc.nome)}</b><br><span class="muted small">${esc(c.doc.nome)}${c.doc.ativo === false ? " · inativo" : ""}</span></td>
      <td><div class="row" style="gap:4px">${c.doc.plano?.branding ? '<span class="pill">Branding</span>' : ""}${c.doc.plano?.midias ? '<span class="pill">Mídias</span>' : ""}${c.doc.plano?.grafica ? '<span class="pill">Gráfica</span>' : ""}${c.doc.recorrente?.ativo ? '<span class="pill info">Recorrente</span>' : ""}</div></td>
      <td class="small">${p.posts.length ? `${p.posts.length} post(s) · ` : ""}${p.artes.length ? `${p.artes.length} arte(s) · ` : ""}${unread ? `<b>${unread} msg nova(s)</b>` : ""}${!p.posts.length && !p.artes.length && !unread ? '<span class="muted">—</span>' : ""}</td>
      <td class="small">${inf ? `<span class="pill info">${inf} informado(s)</span>` : p.cobs.length ? `${p.cobs.length} em aberto` : '<span class="muted">—</span>'}</td>
      <td class="small num muted">${fdt(last)}</td></tr>`; }).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhum cliente${q ? " encontrado" : " ainda"}. <button class="btn" id="novo2">Cadastrar o primeiro</button></div>`}</div>`;
  $("#aq").oninput = e => { ss.set("upe-aq", e.target.value); clearTimeout(w._t); w._t = setTimeout(() => { aClientes(w, clients); const i = $("#aq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
  $$("tr[data-id]", w).forEach(r => { r.onclick = () => go(`#/admin/cliente/${r.dataset.id}/projeto`); r.onkeydown = e => { if (e.key === "Enter") r.click(); }; });
  [$("#novo"), $("#novo2")].filter(Boolean).forEach(b => b.onclick = () => newClientModal());
}

function newClientModal(pre = {}) {
  modal("Novo cliente", `
    <div class="g2"><label class="f" for="nNome">Nome do contato<input id="nNome" value="${esc(pre.nome || "")}"></label><label class="f" for="nEmp">Empresa<input id="nEmp" value="${esc(pre.empresa || "")}"></label></div>
    <div class="g2"><label class="f" for="nMarca">Marca<input id="nMarca" value="${esc(pre.marca || pre.empresa || "")}"></label><label class="f" for="nEmail">E-mail<input id="nEmail" type="email" value="${esc(pre.email || "")}"></label></div>
    <div class="g2"><label class="f" for="nTel">WhatsApp (com DDD)<input id="nTel" value="${esc(pre.telefone || "")}" placeholder="11 90000-0000"></label><span></span></div>
    <span class="eb">Plano</span>
    <div class="g3"><label class="tg"><input type="checkbox" id="pB" checked>Branding</label><label class="tg"><input type="checkbox" id="pM" ${pre.assunto === "Mídias" ? "checked" : ""}>Mídias digitais</label><label class="tg"><input type="checkbox" id="pG">Papelaria gráfica</label></div>
    ${pre.mensagem ? `<div class="legenda small"><b>Mensagem do contato:</b> ${esc(pre.mensagem)}</div>` : ""}`,
    `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="nSave">Cadastrar e gerar código</button>`);
  $("#nSave").onclick = async () => {
    const nome = $("#nNome").value.trim(); if (!nome) return $("#nNome").focus();
    const tel = $("#nTel").value.replace(/\D/g, "");
    const doc = Api.blankClient({ nome, empresa: $("#nEmp").value.trim(), marca: $("#nMarca").value.trim(), plano: { branding: $("#pB").checked, midias: $("#pM").checked, grafica: $("#pG").checked } });
    doc.acesso = { apresentacao: false, manual: false, calendario: doc.plano.midias, graficos: doc.plano.grafica, recompra: false, pagamentos: true };
    const { id, code } = await Api.createClient(doc, { email: $("#nEmail").value.trim(), telefone: tel ? (tel.length <= 11 ? "55" + tel : tel) : "", origemContato: pre.contatoId || "" });
    if (pre.contatoId) await S.set(`contatos/${pre.contatoId}`, { status: "convertido", clienteId: id }, true);
    codeModal(id, code, doc, { telefone: tel ? (tel.length <= 11 ? "55" + tel : tel) : "", email: $("#nEmail").value.trim() });
  };
}
function codeModal(id, code, doc, priv) {
  const msg = `Olá, ${(doc.nome || "").split(" ")[0]}! Seu acesso ao portal da Upe Criativo está pronto.\n\nLink: ${portalUrl()}\nCódigo: ${code}\n\nPor lá você acompanha o projeto, aprova conteúdos e artes e faz pagamentos.`;
  modal("Código de acesso", `<p>Envie este código para <b>${esc(doc.nome)}</b>. Ele dá acesso ao portal desse cliente.</p>
    <div class="card" style="text-align:center"><span class="code" style="font-size:1.6rem">${esc(code)}</span></div>
    <div class="legenda small">${esc(msg)}</div>`,
    `<button class="btn sec" id="cpc">Copiar mensagem</button>${priv.telefone ? `<a class="btn sec" href="${esc(waLink(priv.telefone, msg))}" target="_blank" rel="noopener">Enviar no WhatsApp</a>` : ""}${priv.email ? `<a class="btn sec" href="mailto:${esc(priv.email)}?subject=${encodeURIComponent("Seu acesso ao portal Upe")}&body=${encodeURIComponent(msg)}">E-mail</a>` : ""}<button class="btn" id="goC">Abrir cliente</button>`);
  $("#cpc").onclick = () => copy(msg, "Mensagem copiada");
  $("#goC").onclick = () => { dlg.close(); go(`#/admin/cliente/${id}/projeto`); };
}

/* ---------- ficha do cliente ---------- */
async function aCliente(w, id, tab) {
  const c = state.cache.clients.find(x => x.id === id); if (!c) return go("#/admin/clientes");
  const doc = clone(c.doc), priv = clone(c.priv), acoes = c.acoes;
  const p = pendencias(doc, acoes), unread = acoes.filter(a => a.tipo === "mensagem" && a.em > (doc.lidoAdmEm || 0)).length, pedNovos = pedidosOf(doc, acoes).filter(x => x.status === "novo").length;
  const tabs = [["projeto", "Projeto e acessos", 0], ["apresentacao", "Apresentação e dossiê", 0], ["conteudo", "Conteúdo", p.posts.length], ["graficos", "Gráficos e recompra", pedNovos], ["pagamentos", "Pagamentos", (doc.cobrancas || []).filter(x => cobStatus(x, acoes) === "informado").length], ["mensagens", "Inbox", unread]];
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><a href="#/admin/clientes" class="small">← Clientes</a><h1>${esc(doc.marca || doc.empresa || doc.nome)}</h1><span class="muted">${esc(doc.nome)}${priv.email ? ` · ${esc(priv.email)}` : ""}</span></div>
    <div class="row"><button class="btn sec sm" id="vCli">Ver como cliente</button></div></div>
    <nav class="subtabs">${tabs.map(([k, l, n]) => `<a class="tab" href="#/admin/cliente/${id}/${k}" ${k === tab ? 'aria-current="page"' : ""}>${l}${n ? `<span class="cnt">${n}</span>` : ""}</a>`).join("")}</nav>
    <div id="ct" class="grid" style="gap:16px"></div>`;
  $("#vCli").onclick = () => { ss.set("upe-cliente", id); window.open(portalUrl() + "#/c/inicio", "_blank") || go("#/c/inicio"); };
  const save = async (msg = "Salvo") => { doc.atualizadoEm = Date.now(); await S.set(`clientes/${id}`, doc); toast(msg); reAdmin(); };
  const ct = $("#ct");
  ({ projeto: aProjeto, apresentacao: aApres, conteudo: aConteudo, graficos: aGraficosA, pagamentos: aPagamentosA, mensagens: aMsgA })[tab](ct, { id, doc, priv, acoes, save });
}

function aProjeto(ct, { id, doc, priv, save }) {
  const tg = (k, l, s, grp = "acesso") => `<label class="tg"><input type="checkbox" data-${grp}="${k}" ${doc[grp]?.[k] ? "checked" : ""}><span>${l}${s ? `<small>${s}</small>` : ""}</span></label>`;
  ct.innerHTML = `
    <div class="g2">
      <section class="card grid"><h3>Dados do cliente</h3>
        <div class="g2"><label class="f" for="dNome">Nome do contato<input id="dNome" value="${esc(doc.nome)}"></label><label class="f" for="dEmp">Empresa<input id="dEmp" value="${esc(doc.empresa)}"></label></div>
        <div class="g2"><label class="f" for="dMarca">Marca<input id="dMarca" value="${esc(doc.marca)}"></label><label class="f" for="dEmail">E-mail (newsletter)<input id="dEmail" type="email" value="${esc(priv.email || "")}"></label></div>
        <div class="g2"><label class="f" for="dTel">WhatsApp<input id="dTel" value="${esc(priv.telefone || "")}"></label><label class="tg" style="align-self:end"><input type="checkbox" id="dAtivo" ${doc.ativo !== false ? "checked" : ""}>Acesso ativo</label></div>
        <label class="f" for="dNotas">Notas internas (o cliente não vê)<textarea id="dNotas">${esc(priv.notas || "")}</textarea></label>
      </section>
      <section class="card grid"><h3>Código de acesso</h3>
        <div class="card" style="text-align:center;background:var(--bg-2)"><span class="code" style="font-size:1.3rem">${esc(priv.codigo || "—")}</span></div>
        <div class="row"><button class="btn sec sm" id="cShow">Enviar código</button><button class="btn sec sm" id="cRegen">Gerar novo código</button></div>
        <p class="muted small">Ao gerar um novo código, o anterior deixa de funcionar.</p>
        <h3 style="margin-top:8px">Plano</h3>
        <div class="g3">${tg("branding", "Branding", "", "plano")}${tg("midias", "Mídias digitais", "", "plano")}${tg("grafica", "Papelaria gráfica", "", "plano")}</div>
      </section>
    </div>
    <section class="card grid"><h3>O que o cliente vê no portal</h3>
      <div class="g3">${tg("apresentacao", "Apresentação", "Aba 05 do dossiê")}${tg("manual", "Baixar o manual da marca")}${tg("calendario", "Calendário de aprovação", "Precisa do plano Mídias digitais")}${tg("graficos", "Aprovar materiais gráficos", "Precisa do plano Papelaria gráfica")}${tg("recompra", "Comprar de novo", "Só itens com recompra liberada")}${tg("pagamentos", "Pagamentos", "Só cobranças liberadas")}</div>
    </section>
    <div class="g2">
      <section class="card grid"><div class="spread"><h3>Incluso no projeto</h3><button class="btn sec sm" id="incAdd">Adicionar item</button></div>
        <div class="grid" id="incList" style="gap:8px">${(doc.incluso || []).map((it, k) => `<div class="row" style="flex-wrap:nowrap"><input type="checkbox" data-incf="${k}" ${it.feito ? "checked" : ""} aria-label="Feito"><input data-inct="${k}" value="${esc(it.item)}" aria-label="Item"><button class="btn sec sm" data-incd="${k}" aria-label="Remover">×</button></div>`).join("") || '<p class="muted small">Nenhum item. Ex.: “Manual da marca”, “12 posts por mês”.</p>'}</div>
      </section>
      <section class="card grid"><h3>Recorrência e manual</h3>
        <label class="tg"><input type="checkbox" id="rAt" ${doc.recorrente?.ativo ? "checked" : ""}><span>Serviço recorrente<small>Mensalidade de mídias ou manutenção</small></span></label>
        <div class="g3"><label class="f" for="rDesc">Descrição<input id="rDesc" value="${esc(doc.recorrente?.descricao || "Mensalidade")}"></label><label class="f" for="rVal">Valor (R$)<input id="rVal" type="number" step="0.01" value="${esc(doc.recorrente?.valor || 0)}"></label><label class="f" for="rDia">Dia do vencimento<input id="rDia" type="number" min="1" max="28" value="${esc(doc.recorrente?.dia || 10)}"></label></div>
        <label class="f" for="mUrl">Manual da marca: link do arquivo (PDF)<input id="mUrl" value="${esc(doc.manual?.url || "")}" placeholder="https://…"></label>
        <div class="row"><label class="f" for="mNome" style="flex:1">Nome do arquivo<input id="mNome" value="${esc(doc.manual?.nome || "")}"></label><label class="btn sec sm" style="align-self:end">Enviar arquivo<input type="file" id="mFile" accept=".pdf,image/*" hidden></label></div>
      </section>
    </div>
    <div class="spread"><button class="btn bad sm" id="del">Excluir cliente</button><button class="btn" id="sv">Salvar alterações</button></div>`;
  $("#incAdd").onclick = () => { collect(); doc.incluso.push({ item: "", feito: false }); aProjeto(ct, { id, doc, priv, save }); $$("[data-inct]", ct).pop().focus(); };
  $$("[data-incd]", ct).forEach(b => b.onclick = () => { collect(); doc.incluso.splice(+b.dataset.incd, 1); aProjeto(ct, { id, doc, priv, save }); });
  $("#mFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; toast("Enviando…"); const u = await S.upload(f, `clientes/${id}/manual`); if (u) { $("#mUrl").value = u; if (!$("#mNome").value) $("#mNome").value = f.name; toast(S.mode === "demo" ? "Arquivo anexado só nesta sessão (modo demonstração)" : "Arquivo enviado"); } else toast("Ative o Firebase Storage para enviar arquivos"); };
  function collect() {
    Object.assign(doc, { nome: $("#dNome").value.trim(), empresa: $("#dEmp").value.trim(), marca: $("#dMarca").value.trim(), ativo: $("#dAtivo").checked });
    $$("[data-acesso]", ct).forEach(i => doc.acesso[i.dataset.acesso] = i.checked);
    $$("[data-plano]", ct).forEach(i => doc.plano[i.dataset.plano] = i.checked);
    doc.incluso = $$("[data-inct]", ct).map((i, k) => ({ item: i.value.trim(), feito: $(`[data-incf="${k}"]`, ct).checked }));
    doc.recorrente = { ativo: $("#rAt").checked, descricao: $("#rDesc").value.trim(), valor: +$("#rVal").value || 0, dia: +$("#rDia").value || 10 };
    doc.manual = { url: $("#mUrl").value.trim(), nome: $("#mNome").value.trim() };
    Object.assign(priv, { email: $("#dEmail").value.trim(), telefone: $("#dTel").value.replace(/\D/g, ""), notas: $("#dNotas").value });
  }
  $("#sv").onclick = async () => { collect(); doc.incluso = doc.incluso.filter(i => i.item); await S.set(`privado/${id}`, priv); await save(); };
  $("#cShow").onclick = () => codeModal(id, priv.codigo, doc, priv);
  $("#cRegen").onclick = () => { modal("Gerar novo código?", `<p>O código atual (<span class="code">${esc(priv.codigo)}</span>) vai parar de funcionar.</p>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="rg">Gerar novo código</button>`);
    $("#rg").onclick = async () => { const code = await Api.regenCode(id); priv.codigo = code; dlg.close(); codeModal(id, code, doc, priv); }; };
  $("#del").onclick = () => { modal("Excluir cliente?", `<p>Isso apaga <b>${esc(doc.marca || doc.nome)}</b>, o código de acesso, os posts, as artes, as cobranças e as mensagens. Não dá para desfazer.</p>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn bad" id="dl">Excluir</button>`);
    $("#dl").onclick = async () => { await Api.deleteClient(id); dlg.close(); toast("Cliente excluído"); go("#/admin/clientes"); }; };
}

/* ---------- apresentação e dossiê ---------- */
function parseDossie(html) {
  const i = html.lastIndexOf("const DADOS"), j = i < 0 ? -1 : html.indexOf("</script>", i);
  if (i < 0 || j < 0) throw new Error("Não encontrei o objeto DADOS neste arquivo. Use o modelo de dossiê da Upe.");
  try { return new Function(html.slice(i, j) + "\n;return DADOS;")(); } // arquivo do próprio admin
  catch (e) { throw new Error("O objeto DADOS do dossiê tem um erro: " + e.message); }
}
function apresFromDossie(D, baseUrl) {
  const A = D.apresentacao || {}, R = D.redesign || {};
  const strip = v => (typeof v === "string" && /^\[.*\]$/.test(v.trim())) ? "" : v;
  return {
    marca: strip(D.projeto?.marca) || "", lede: strip(A.lede) || "", pdf: A.pdf || "", pdfTamanho: strip(A.pdfTamanho) || "", baseUrl: baseUrl || "",
    cores: (D.marca?.cores || []).filter(c => !/^\[/.test(c.nome)).map(c => ({ nome: c.nome, hex: c.hex })),
    slides: (A.slides || []).map(s => ({ nome: s.nome, tipo: s.tipo || "img", img: s.img || "" })),
    filme: R.filme ? { titulo: strip(R.filme.titulo), texto: strip(R.filme.texto), video: R.filme.video || "", poster: R.filme.poster || "", duracao: strip(R.filme.duracao) } : null,
    motions: (R.motions || []).filter(mo => mo.video).map(mo => ({ video: mo.video, poster: mo.poster || "", titulo: strip(mo.titulo), duracao: strip(mo.duracao) })),
    semanas: (A.semanas || []).map(strip).filter(Boolean),
    instagram: (A.instagram || []).filter(p => p.img).map(p => ({ img: p.img, titulo: strip(p.titulo), data: strip(p.data), semana: p.semana, legenda: strip(p.legenda) }))
  };
}
function aApres(ct, { id, doc, priv, save }) {
  const A = doc.apresentacao || { slides: [], instagram: [], motions: [] };
  const hasDossie = !!priv.dossie;
  ct.innerHTML = `
    <div class="g2">
      <section class="card grid"><h3>Dossiê do cliente</h3>
        <p class="muted small">Importe o dossiê preenchido (arquivo do modelo Upe). O dossiê completo fica salvo só para você. O cliente vê apenas a <b>aba 05 · Apresentação</b>.</p>
        <div class="row">${hasDossie ? `<span class="pill ok">Dossiê salvo${priv.dossieNome ? ` · ${esc(priv.dossieNome)}` : ""}</span>` : '<span class="pill">Nenhum dossiê salvo</span>'}<span class="muted small">${priv.dossieEm ? fdt(priv.dossieEm) : ""}</span></div>
        <label class="f" for="dBase">Endereço da pasta do dossiê (para achar imagens e vídeos)<input id="dBase" value="${esc(A.baseUrl || "")}" placeholder="https://seusite.web.app/clientes/marca/dossie/"></label>
        <div class="row"><label class="btn sm">Importar dossiê (.html)<input type="file" id="dFile" accept=".html,text/html" hidden></label>${hasDossie ? `<button class="btn sec sm" id="dOpen">Abrir dossiê completo</button>` : ""}<a class="btn sec sm" href="modelos/Modelo_Dossie_Upe.html" target="_blank" rel="noopener">Modelo em branco</a></div>
      </section>
      <section class="card grid"><h3>O que o cliente vê</h3>
        <div class="row"><span class="pill ${doc.acesso?.apresentacao ? "ok" : ""}">${doc.acesso?.apresentacao ? "Apresentação liberada" : "Apresentação oculta"}</span><a class="small" href="#/admin/cliente/${id}/projeto">Mudar em Projeto e acessos</a></div>
        <label class="f" for="aMarca">Título<input id="aMarca" value="${esc(A.marca || doc.marca || "")}"></label>
        <label class="f" for="aLede">Texto de abertura<textarea id="aLede">${esc(A.lede || "")}</textarea></label>
        <label class="f" for="aPdf">PDF da apresentação (link)<input id="aPdf" value="${esc(A.pdf || "")}"></label>
      </section>
    </div>
    <section class="card grid"><div class="spread"><h3>Telas da apresentação</h3><button class="btn sec sm" id="sAdd">Adicionar tela</button></div>
      <p class="muted small">Tipo “imagem” mostra a imagem. “Filme”, “Motions” e “Instagram” viram telas interativas com os vídeos e o feed do dossiê.</p>
      <div class="grid" style="gap:8px">${(A.slides || []).map((s, k) => `<div class="row" style="flex-wrap:nowrap"><span class="muted small num" style="width:22px">${k + 1}</span><input data-sn="${k}" value="${esc(s.nome)}" aria-label="Nome da tela" style="max-width:220px"><select data-st="${k}" aria-label="Tipo" style="max-width:130px">${["img", "filme", "motions", "instagram"].map(t => `<option value="${t}" ${(s.tipo || "img") === t ? "selected" : ""}>${{ img: "Imagem", filme: "Filme", motions: "Motions", instagram: "Instagram" }[t]}</option>`).join("")}</select><input data-si="${k}" value="${esc(s.img || "")}" placeholder="caminho ou link da imagem" aria-label="Imagem"><button class="btn sec sm" data-sd="${k}" aria-label="Remover tela">×</button></div>`).join("") || '<p class="muted small">Nenhuma tela ainda. Importe um dossiê ou adicione telas.</p>'}</div>
      <div class="row muted small">Filme: ${A.filme?.video ? esc(A.filme.video) : "não definido"} · Motions: ${(A.motions || []).length} · Posts do Instagram: ${(A.instagram || []).length}</div>
    </section>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="aSv">Salvar apresentação</button></div>`;
  const collect = () => {
    const slides = $$("[data-sn]", ct).map((i, k) => ({ nome: i.value.trim(), tipo: $(`[data-st="${k}"]`, ct).value, img: $(`[data-si="${k}"]`, ct).value.trim() }));
    doc.apresentacao = { ...A, marca: $("#aMarca").value.trim(), lede: $("#aLede").value.trim(), pdf: $("#aPdf").value.trim(), baseUrl: $("#dBase").value.trim(), slides };
  };
  $("#sAdd").onclick = () => { collect(); doc.apresentacao.slides.push({ nome: "Nova tela", tipo: "img", img: "" }); aApres(ct, { id, doc, priv, save }); };
  $$("[data-sd]", ct).forEach(b => b.onclick = () => { collect(); doc.apresentacao.slides.splice(+b.dataset.sd, 1); aApres(ct, { id, doc, priv, save }); });
  $("#aSv").onclick = async () => { collect(); await save("Apresentação salva"); };
  $("#dFile").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const html = await f.text(), D = parseDossie(html), base = $("#dBase").value.trim();
      doc.apresentacao = apresFromDossie(D, base);
      Object.assign(priv, { dossie: html, dossieNome: f.name, dossieEm: Date.now() });
      if (html.length > 900000) toast("Dossiê grande: guarde as imagens fora do arquivo");
      await S.set(`privado/${id}`, priv); await save("Dossiê importado. A aba 05 virou a apresentação do cliente.");
    } catch (er) { toast(er.message); }
  };
  if ($("#dOpen")) $("#dOpen").onclick = () => { const b = new Blob([priv.dossie], { type: "text/html" }); const u = URL.createObjectURL(b); if (!window.open(u, "_blank")) toast("Permita pop-ups para abrir o dossiê"); };
}

/* ---------- conteúdo (posts) ---------- */
function aConteudo(ct, { id, doc, acoes, save }) {
  const posts = (doc.posts || []).map(p => ({ ...p, ef: statusOf(p, acoes) })).sort((a, b) => b.data.localeCompare(a.data));
  ct.innerHTML = `${!doc.plano?.midias ? `<div class="card" style="background:var(--warn-bg)">Este cliente não está no plano Mídias digitais. Os posts só aparecem para ele com o plano e o acesso “Calendário de aprovação” ligados.</div>` : ""}
    <div class="spread"><h3>Posts para aprovação</h3><button class="btn" id="pNew">Novo post</button></div>
    <div class="card pad0 tbl">${posts.length ? `<table><thead><tr><th>Data</th><th>Post</th><th>Tipo</th><th>Status</th><th>Retorno do cliente</th><th></th></tr></thead><tbody>${posts.map(p => `<tr><td class="num">${fdate(p.data)}</td><td><b>${esc(p.titulo)}</b>${(p.versao || 1) > 1 ? ` <span class="muted small">v${p.versao}</span>` : ""}</td><td>${esc(TIPOS_POST[p.tipo] || p.tipo)}</td><td>${pill(p.ef.status)}</td><td class="small">${p.ef.por === "cliente" ? esc(p.ef.texto || (p.ef.status === "aprovado" ? "Aprovou" : "")) + ` <span class="muted">· ${fdt(p.ef.em)}</span>` : '<span class="muted">—</span>'}</td><td><button class="btn sec sm" data-ed="${p.id}">Editar</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhum post ainda.</div>`}</div>`;
  const edit = p => {
    const n = !p; p = p || { id: uid(8), data: isoDay(new Date()), tipo: "imagem", titulo: "", midias: [], legenda: "", versao: 1, status: "pendente" };
    modal(n ? "Novo post" : "Editar post", `
      <div class="g3"><label class="f" for="eD">Data de publicação<input id="eD" type="date" value="${esc(p.data)}"></label><label class="f" for="eT">Tipo<select id="eT">${Object.entries(TIPOS_POST).map(([k, l]) => `<option value="${k}" ${p.tipo === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f" for="eS">Status<select id="eS">${["rascunho", "pendente", "aprovado", "ajustes", "publicado"].map(s => `<option value="${s}" ${(p.ef?.status || p.status) === s ? "selected" : ""}>${ST[s][0]}</option>`).join("")}</select></label></div>
      <label class="f" for="eTi">Título<input id="eTi" value="${esc(p.titulo)}"></label>
      <label class="f" for="eM">Mídias (um link por linha: imagem, vídeo ou áudio)<textarea id="eM" rows="3">${esc((p.midias || []).join("\n"))}</textarea></label>
      <div><label class="btn sec sm">Enviar arquivos<input type="file" id="eF" multiple accept="image/*,video/*,audio/*" hidden></label></div>
      <label class="f" for="eL">Legenda<textarea id="eL" rows="5">${esc(p.legenda)}</textarea></label>
      ${!n ? `<label class="tg"><input type="checkbox" id="eV"><span>Enviar como nova versão<small>Volta para “Aguardando aprovação” e o cliente aprova de novo</small></span></label>` : ""}`,
      `${!n ? `<button class="btn bad" id="eX">Excluir</button>` : ""}<button class="btn sec" data-close>Cancelar</button><button class="btn" id="eOk">Salvar</button>`);
    $("#eF").onchange = async e => { toast("Enviando…"); const urls = []; for (const f of e.target.files) { const u = await S.upload(f, `clientes/${id}/posts`); if (u) urls.push(u); } if (urls.length) { $("#eM").value = [$("#eM").value.trim(), ...urls].filter(Boolean).join("\n"); toast(S.mode === "demo" ? "Arquivos anexados só nesta sessão (demonstração)" : "Arquivos enviados"); } else toast("Ative o Firebase Storage para enviar arquivos"); };
    $("#eOk").onclick = async () => {
      const t = $("#eTi").value.trim(); if (!t) return $("#eTi").focus();
      const base = (doc.posts || []).find(x => x.id === p.id) || {};
      const newVer = $("#eV")?.checked, st = newVer ? "pendente" : $("#eS").value;
      const np = { ...base, id: p.id, data: $("#eD").value, tipo: $("#eT").value, titulo: t, midias: $("#eM").value.split("\n").map(s => s.trim()).filter(Boolean), legenda: $("#eL").value, versao: (base.versao || 1) + (newVer ? 1 : 0) };
      if (n || newVer || st !== p.ef?.status) { np.status = st; np.statusEm = Date.now(); }
      doc.posts = n ? [...(doc.posts || []), np] : doc.posts.map(x => x.id === p.id ? np : x);
      dlg.close(); await save("Post salvo");
    };
    if ($("#eX")) $("#eX").onclick = async () => { doc.posts = doc.posts.filter(x => x.id !== p.id); dlg.close(); await save("Post excluído"); };
  };
  $("#pNew").onclick = () => edit(null);
  $$("[data-ed]", ct).forEach(b => b.onclick = () => edit(posts.find(p => p.id === b.dataset.ed)));
}

/* ---------- gráficos e recompra ---------- */
function aGraficosA(ct, { id, doc, acoes, save }) {
  const gs = (doc.graficos || []).map(g => ({ ...g, ef: statusOf(g, acoes) })), peds = pedidosOf(doc, acoes);
  ct.innerHTML = `${!doc.plano?.grafica ? `<div class="card" style="background:var(--warn-bg)">Este cliente não está no plano Papelaria gráfica. As artes só aparecem para ele com o plano e o acesso ligados.</div>` : ""}
    <div class="spread"><h3>Materiais gráficos</h3><button class="btn" id="gNew">Novo material</button></div>
    <div class="card pad0 tbl">${gs.length ? `<table><thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th><th>Status</th><th>Recompra</th><th></th></tr></thead><tbody>${gs.map(g => `<tr><td><b>${esc(g.produto)}</b>${(g.versao || 1) > 1 ? ` <span class="muted small">v${g.versao}</span>` : ""}<br><span class="muted small">${esc(g.specs)}</span>${g.ef.por === "cliente" && g.ef.texto ? `<br><span class="small" style="color:var(--bad)">Cliente: ${esc(g.ef.texto)}</span>` : ""}</td><td class="num">${esc(Number(g.quantidade || 0).toLocaleString("pt-BR"))}</td><td class="num">${brl(g.valor)}</td><td>${pill(g.ef.status)}</td><td>${g.recompra ? `<span class="pill ok">Liberada · ${brl(g.precoRecompra || g.valor)}</span>` : '<span class="muted small">—</span>'}</td><td><button class="btn sec sm" data-ed="${g.id}">Editar</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhum material ainda.</div>`}</div>
    <h3>Pedidos de recompra</h3>
    <div class="card pad0 tbl">${peds.length ? `<table><thead><tr><th>Data</th><th>Produto</th><th>Qtd.</th><th>Pedido</th><th>Status</th><th></th></tr></thead><tbody>${peds.map(p => { const g = gs.find(x => x.id === p.alvo); return `<tr><td class="num">${fdt(p.em)}</td><td>${esc(g?.produto || "—")}</td><td class="num">${esc(Number(p.quantidade).toLocaleString("pt-BR"))}</td><td class="small">${p.modo === "alterado" ? `<b>Com alterações:</b> ${esc(p.texto)}` : "Igual ao anterior"}</td><td><select data-ps="${p.id}" aria-label="Status do pedido">${["novo", "producao", "entregue", "cancelado"].map(s => `<option value="${s}" ${p.status === s ? "selected" : ""}>${ST[s][0]}</option>`).join("")}</select></td><td>${doc.pedidosAdm?.[p.id]?.cobrancaId ? '<span class="pill ok">Cobrança criada</span>' : `<button class="btn sec sm" data-pc="${p.id}">Gerar cobrança</button>`}</td></tr>`; }).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhum pedido de recompra.</div>`}</div>`;
  const edit = g => {
    const n = !g; g = g || { id: uid(8), produto: "", specs: "", quantidade: 100, valor: 0, arte: "", versao: 1, status: "orcamento", recompra: false, precoRecompra: 0 };
    modal(n ? "Novo material gráfico" : "Editar material", `
      <div class="g2"><label class="f" for="gP">Produto<input id="gP" value="${esc(g.produto)}" placeholder="Cartão de visita, flyer, cardápio…"></label><label class="f" for="gS">Status<select id="gS">${["orcamento", "pendente", "aprovado", "ajustes", "producao", "entregue"].map(s => `<option value="${s}" ${(g.ef?.status || g.status) === s ? "selected" : ""}>${ST[s][0]}${s === "orcamento" ? " (cliente não vê)" : ""}</option>`).join("")}</select></label></div>
      <label class="f" for="gSp">Especificação<input id="gSp" value="${esc(g.specs)}" placeholder="Formato · papel · cores · acabamento"></label>
      <div class="g2"><label class="f" for="gQ">Quantidade<input id="gQ" type="number" value="${esc(g.quantidade)}"></label><label class="f" for="gV">Valor (R$)<input id="gV" type="number" step="0.01" value="${esc(g.valor)}"></label></div>
      <label class="f" for="gA">Arte (link da imagem ou PDF)<input id="gA" value="${esc(g.arte)}"></label>
      <div><label class="btn sec sm">Enviar arte<input type="file" id="gF" accept="image/*,.pdf" hidden></label></div>
      <span class="eb">Recompra</span>
      <div class="g2"><label class="tg"><input type="checkbox" id="gR" ${g.recompra ? "checked" : ""}><span>Liberar para comprar de novo<small>Aparece em “Comprar de novo” para o cliente</small></span></label><label class="f" for="gRP">Preço da recompra (R$)<input id="gRP" type="number" step="0.01" value="${esc(g.precoRecompra || "")}" placeholder="igual ao valor"></label></div>
      ${!n ? `<label class="tg"><input type="checkbox" id="gNv"><span>Enviar como nova versão da arte<small>Volta para “Aguardando aprovação”</small></span></label>` : ""}`,
      `${!n ? `<button class="btn bad" id="gX">Excluir</button>` : ""}<button class="btn sec" data-close>Cancelar</button><button class="btn" id="gOk">Salvar</button>`);
    $("#gF").onchange = async e => { const f = e.target.files[0]; if (!f) return; const u = await S.upload(f, `clientes/${id}/graficos`); if (u) { $("#gA").value = u; toast("Arte anexada"); } else toast("Ative o Firebase Storage para enviar arquivos"); };
    $("#gOk").onclick = async () => {
      const pr = $("#gP").value.trim(); if (!pr) return $("#gP").focus();
      const base = (doc.graficos || []).find(x => x.id === g.id) || {}, nv = $("#gNv")?.checked, st = nv ? "pendente" : $("#gS").value;
      const ng = { ...base, id: g.id, produto: pr, specs: $("#gSp").value.trim(), quantidade: +$("#gQ").value || 0, valor: +$("#gV").value || 0, arte: $("#gA").value.trim(), recompra: $("#gR").checked, precoRecompra: +$("#gRP").value || 0, versao: (base.versao || 1) + (nv ? 1 : 0) };
      if (n || nv || st !== g.ef?.status) { ng.status = st; ng.statusEm = Date.now(); }
      if (ng.recompra && !doc.acesso.recompra) doc.acesso.recompra = true;
      doc.graficos = n ? [...(doc.graficos || []), ng] : doc.graficos.map(x => x.id === g.id ? ng : x);
      dlg.close(); await save("Material salvo");
    };
    if ($("#gX")) $("#gX").onclick = async () => { doc.graficos = doc.graficos.filter(x => x.id !== g.id); dlg.close(); await save("Material excluído"); };
  };
  $("#gNew").onclick = () => edit(null);
  $$("[data-ed]", ct).forEach(b => b.onclick = () => edit(gs.find(g => g.id === b.dataset.ed)));
  $$("[data-ps]", ct).forEach(s => s.onchange = async () => { doc.pedidosAdm = doc.pedidosAdm || {}; doc.pedidosAdm[s.dataset.ps] = { ...(doc.pedidosAdm[s.dataset.ps] || {}), status: s.value }; await save("Pedido atualizado"); });
  $$("[data-pc]", ct).forEach(b => b.onclick = async () => {
    const p = peds.find(x => x.id === b.dataset.pc), g = gs.find(x => x.id === p.alvo), unit = (g?.precoRecompra || g?.valor || 0) / (g?.quantidade || 1);
    const cob = { id: uid(8), descricao: `${g?.produto || "Material gráfico"} · recompra (${Number(p.quantidade).toLocaleString("pt-BR")} un.)`, valor: Math.round(unit * p.quantidade * 100) / 100, vencimento: isoDay(new Date(Date.now() + 5 * 864e5)), liberada: false, status: "aberta", pix: true, cartao: true, linkCartao: "" };
    doc.cobrancas = [...(doc.cobrancas || []), cob]; doc.pedidosAdm = doc.pedidosAdm || {}; doc.pedidosAdm[p.id] = { ...(doc.pedidosAdm[p.id] || {}), cobrancaId: cob.id };
    await save("Cobrança criada (ainda não liberada). Confira em Pagamentos.");
  });
}

/* ---------- pagamentos ---------- */
function aPagamentosA(ct, { id, doc, acoes, save }) {
  const cobs = (doc.cobrancas || []).map(x => ({ ...x, st: cobStatus(x, acoes) })).sort((a, b) => String(b.vencimento).localeCompare(a.vencimento));
  ct.innerHTML = `<div class="spread"><h3>Cobranças</h3><div class="row">${doc.recorrente?.ativo ? `<button class="btn sec" id="cMes">Gerar mensalidade</button>` : ""}<button class="btn" id="cNew">Nova cobrança</button></div></div>
    ${doc.acesso?.pagamentos ? "" : `<div class="card" style="background:var(--warn-bg)">O acesso a Pagamentos está desligado para este cliente.</div>`}
    <div class="card pad0 tbl">${cobs.length ? `<table><thead><tr><th>Descrição</th><th>Vencimento</th><th>Valor</th><th>Visível ao cliente</th><th>Status</th><th></th></tr></thead><tbody>${cobs.map(x => `<tr><td><b>${esc(x.descricao)}</b><br><span class="muted small">${[x.pix && "PIX", x.cartao && "Cartão"].filter(Boolean).join(" · ")}</span></td><td class="num">${fdate(x.vencimento)}</td><td class="num">${brl(x.valor)}</td><td><label class="row small" style="gap:6px"><input type="checkbox" data-lib="${x.id}" ${x.liberada ? "checked" : ""}>${x.liberada ? "Liberada" : "Oculta"}</label></td><td>${pill(x.st)}</td><td><div class="row" style="gap:6px">${x.st !== "paga" ? `<button class="btn ok sm" data-pg="${x.id}">Confirmar pagamento</button>` : ""}<button class="btn sec sm" data-ed="${x.id}">Editar</button></div></td></tr>`).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhuma cobrança.</div>`}</div>`;
  const edit = x => {
    const n = !x; x = x || { id: uid(8), descricao: "", valor: 0, vencimento: isoDay(new Date(Date.now() + 5 * 864e5)), liberada: true, status: "aberta", pix: true, cartao: true, linkCartao: "" };
    modal(n ? "Nova cobrança" : "Editar cobrança", `
      <label class="f" for="xD">Descrição<input id="xD" value="${esc(x.descricao)}" placeholder="Branding · entrada, Mensalidade de outubro…"></label>
      <div class="g2"><label class="f" for="xV">Valor (R$)<input id="xV" type="number" step="0.01" value="${esc(x.valor)}"></label><label class="f" for="xVe">Vencimento<input id="xVe" type="date" value="${esc(x.vencimento)}"></label></div>
      <div class="g3"><label class="tg"><input type="checkbox" id="xP" ${x.pix ? "checked" : ""}>PIX</label><label class="tg"><input type="checkbox" id="xC" ${x.cartao ? "checked" : ""}>Cartão</label><label class="tg"><input type="checkbox" id="xL" ${x.liberada ? "checked" : ""}>Liberar ao cliente</label></div>
      <label class="f" for="xLk">Link de pagamento com cartão (opcional; sem ele, usa o link padrão das configurações)<input id="xLk" value="${esc(x.linkCartao)}" placeholder="https://link.mercadopago.com.br/…"></label>
      <label class="f" for="xS">Status<select id="xS">${["aberta", "paga", "cancelado"].map(s => `<option value="${s}" ${x.status === s ? "selected" : ""}>${ST[s][0]}</option>`).join("")}</select></label>`,
      `${!n ? `<button class="btn bad" id="xX">Excluir</button>` : ""}<button class="btn sec" data-close>Cancelar</button><button class="btn" id="xOk">Salvar</button>`);
    $("#xOk").onclick = async () => { const d = $("#xD").value.trim(); if (!d) return $("#xD").focus();
      const nx = { ...x, descricao: d, valor: +$("#xV").value || 0, vencimento: $("#xVe").value, pix: $("#xP").checked, cartao: $("#xC").checked, liberada: $("#xL").checked, linkCartao: $("#xLk").value.trim(), status: $("#xS").value };
      doc.cobrancas = n ? [...(doc.cobrancas || []), nx] : doc.cobrancas.map(y => y.id === x.id ? nx : y); dlg.close(); await save("Cobrança salva"); };
    if ($("#xX")) $("#xX").onclick = async () => { doc.cobrancas = doc.cobrancas.filter(y => y.id !== x.id); dlg.close(); await save("Cobrança excluída"); };
  };
  $("#cNew").onclick = () => edit(null);
  if ($("#cMes")) $("#cMes").onclick = () => { const d = new Date(), v = new Date(d.getFullYear(), d.getMonth() + (d.getDate() > (doc.recorrente.dia || 10) ? 1 : 0), doc.recorrente.dia || 10);
    edit(null); $("#xD").value = `${doc.recorrente.descricao || "Mensalidade"} · ${MESES[v.getMonth()]}`; $("#xV").value = doc.recorrente.valor; $("#xVe").value = isoDay(v); };
  $$("[data-ed]", ct).forEach(b => b.onclick = () => edit(doc.cobrancas.find(x => x.id === b.dataset.ed)));
  $$("[data-lib]", ct).forEach(i => i.onchange = async () => { doc.cobrancas = doc.cobrancas.map(x => x.id === i.dataset.lib ? { ...x, liberada: i.checked } : x); await save(i.checked ? "Cobrança liberada ao cliente" : "Cobrança oculta"); });
  $$("[data-pg]", ct).forEach(b => b.onclick = async () => { doc.cobrancas = doc.cobrancas.map(x => x.id === b.dataset.pg ? { ...x, status: "paga", pagaEm: Date.now() } : x); await save("Pagamento confirmado"); });
}

/* ---------- inbox ---------- */
function aMsgA(ct, { id, doc, acoes, save }) {
  ct.innerHTML = `<section class="card grid"><div class="thread" id="th">${threadHTML(thread(doc, acoes), "upe")}</div>
    <form class="compose" id="af"><label class="f" style="flex:1" for="at">Responder<textarea id="at" rows="2"></textarea></label><button class="btn" type="submit">Enviar</button></form></section>`;
  const th = $("#th"); th.scrollTop = th.scrollHeight;
  const unread = acoes.some(a => a.tipo === "mensagem" && a.em > (doc.lidoAdmEm || 0));
  if (unread) { doc.lidoAdmEm = Date.now(); S.set(`clientes/${id}`, doc); }
  $("#af").onsubmit = async e => { e.preventDefault(); const t = $("#at").value.trim(); if (!t) return; doc.mensagens = [...(doc.mensagens || []), { id: uid(8), texto: t, em: Date.now() }]; doc.lidoAdmEm = Date.now(); await save("Mensagem enviada"); };
}
function aInbox(w, clients) {
  const rows = clients.map(c => { const t = thread(c.doc, c.acoes); const last = t[t.length - 1]; return { c, last, unread: c.acoes.filter(a => a.tipo === "mensagem" && a.em > (c.doc.lidoAdmEm || 0)).length }; })
    .filter(r => r.last).sort((a, b) => b.unread - a.unread || b.last.em - a.last.em);
  w.innerHTML = `<div class="grid" style="gap:4px"><span class="eb">Inbox</span><h1>Mensagens dos clientes</h1></div>
    <div class="grid">${rows.length ? rows.map(({ c, last, unread }) => `<a class="card spread" href="#/admin/cliente/${c.id}/mensagens" style="text-decoration:none;color:inherit"><div class="grid" style="gap:4px;min-width:0"><b>${esc(c.doc.marca || c.doc.nome)}</b><span class="muted small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${last.autor === "upe" ? "Você: " : ""}${esc(last.texto)}</span></div><div class="row">${unread ? `<span class="pill warn">${unread} nova(s)</span>` : ""}<span class="muted small num">${fdt(last.em)}</span></div></a>`).join("") : `<div class="empty">Nenhuma conversa ainda.</div>`}</div>`;
}

/* ---------- contatos do site ---------- */
function aContatos(w, contatos) {
  const f = ss.get("upe-cf2") || "novo";
  const rows = contatos.map(c => ({ ...c, status: c.status || "novo" })).filter(c => f === "todos" || c.status === f).sort((a, b) => b.em - a.em);
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Formulário do site</span><h1>Contatos</h1></div><button class="btn" id="cAdd">Adicionar contato manual</button></div>
    <div class="row">${[["novo", "Novos"], ["convertido", "Viraram cliente"], ["arquivado", "Arquivados"], ["todos", "Todos"]].map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${l}</button>`).join("")}</div>
    <div class="grid">${rows.length ? rows.map(c => `<article class="card grid"><div class="spread"><div><b>${esc(c.nome)}</b> <span class="muted small">· ${esc(c.contato)}</span></div><div class="row">${pill(c.status)}<span class="pill info">${esc(c.assunto || "—")}</span><span class="muted small num">${fdt(c.em)}</span></div></div>
      <p>${esc(c.mensagem)}</p>
      <div class="row">${c.status !== "convertido" ? `<button class="btn sm" data-cv="${c.id}">Criar cliente</button>` : `<a class="btn sec sm" href="#/admin/cliente/${esc(c.clienteId)}/projeto">Abrir cliente</a>`}
      ${/@/.test(c.contato) ? `<a class="btn sec sm" href="mailto:${esc(c.contato)}">Responder por e-mail</a>` : `<a class="btn sec sm" href="${esc(waLink(c.contato.replace(/\D/g, "").length <= 11 ? "55" + c.contato.replace(/\D/g, "") : c.contato, `Olá, ${c.nome}! Aqui é da Upe Criativo, recebi a sua mensagem.`))}" target="_blank" rel="noopener">Responder no WhatsApp</a>`}
      ${c.status === "novo" ? `<button class="btn sec sm" data-ar="${c.id}">Arquivar</button>` : ""}</div></article>`).join("") : `<div class="empty">Nenhum contato aqui.</div>`}</div>
    <p class="muted small">Os contatos chegam pelo formulário do site quando o Firebase está configurado no site (veja o README).</p>`;
  $$("[data-f]", w).forEach(b => b.onclick = () => { ss.set("upe-cf2", b.dataset.f); aContatos(w, contatos); });
  $$("[data-ar]", w).forEach(b => b.onclick = async () => { await S.set(`contatos/${b.dataset.ar}`, { status: "arquivado" }, true); toast("Contato arquivado"); reAdmin(); });
  $$("[data-cv]", w).forEach(b => b.onclick = () => { const c = contatos.find(x => x.id === b.dataset.cv); const em = /@/.test(c.contato) ? c.contato.trim() : "", tel = em ? "" : c.contato;
    newClientModal({ nome: c.nome, email: em, telefone: tel, assunto: c.assunto, mensagem: c.mensagem, contatoId: c.id }); });
  $("#cAdd").onclick = () => { modal("Novo contato", `<div class="g2"><label class="f" for="kN">Nome<input id="kN"></label><label class="f" for="kC">E-mail ou WhatsApp<input id="kC"></label></div>
      <label class="f" for="kA">Assunto<select id="kA"><option>Branding</option><option>Redesign</option><option>Mídias</option><option>Papelaria gráfica</option><option>Outro assunto</option></select></label><label class="f" for="kM">Anotações<textarea id="kM"></textarea></label>`,
    `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="kOk">Salvar</button>`);
    $("#kOk").onclick = async () => { const n = $("#kN").value.trim(); if (!n) return $("#kN").focus(); await S.add("contatos", { nome: n, contato: $("#kC").value.trim(), assunto: $("#kA").value, mensagem: $("#kM").value.trim(), em: Date.now(), status: "novo", origem: "manual" }); dlg.close(); toast("Contato salvo"); reAdmin(); }; };
}

/* =====================================================================
   NEWSLETTER
   ===================================================================== */
const BLOCOS = {
  cabecalho: { nome: "Cabeçalho com logo", props: { fundo: "#0C4F7F" } },
  titulo: { nome: "Título", props: { texto: "Título", alinhar: "left" } },
  texto: { nome: "Texto", props: { texto: "Escreva aqui. Use {{nome}}, {{empresa}} e {{marca}}." } },
  imagem: { nome: "Imagem", props: { url: "", alt: "", link: "" } },
  botao: { nome: "Botão", props: { texto: "Abrir meu portal", link: "{{portal}}", cor: "#0C4F7F" } },
  status: { nome: "Status do projeto", props: { titulo: "Como está o seu projeto" } },
  cobranca: { nome: "Cobranças em aberto", props: { titulo: "Pagamentos disponíveis" } },
  produtos: { nome: "Produtos para recomprar", props: { titulo: "Peça de novo com um clique" } },
  promo: { nome: "Ação promocional", props: { selo: "Promoção", titulo: "1.000 cartões de visita", texto: "Couché 300 g, laminação fosca.", preco: "149,00", precoAntigo: "189,00", cupom: "UPE10", validade: "até 31/10", botao: "Quero aproveitar", link: "{{portal}}" } },
  divisor: { nome: "Divisor", props: {} },
  rodape: { nome: "Rodapé", props: { texto: "Upe Criativo · Branding, Redesign, Mídias e Papelaria gráfica\nupecriativo@gmail.com · Para não receber mais, responda “sair”." } }
};
const B = (tipo, over = {}) => ({ id: uid(6), tipo, props: { ...clone(BLOCOS[tipo].props), ...over } });
function TEMPLATES() {
  return [
    { id: "status-projeto", nome: "Status do projeto", assunto: "{{nome}}, veja como está o seu projeto", blocos: [B("cabecalho"), B("titulo", { texto: "Olá, {{nome}}!" }), B("texto", { texto: "Passando para atualizar o andamento da {{marca}}. Confira abaixo o que está pronto e o que espera por você." }), B("status"), B("botao"), B("rodape")] },
    { id: "aprovacao", nome: "Aprovação pendente", assunto: "Tem conteúdo esperando a sua aprovação", blocos: [B("cabecalho"), B("titulo", { texto: "Seus posts e artes estão prontos" }), B("texto", { texto: "{{nome}}, para manter o calendário em dia, aprove ou peça ajustes pelo portal. Leva só alguns minutos." }), B("status", { titulo: "Aguardando você" }), B("botao", { texto: "Aprovar agora" }), B("rodape")] },
    { id: "cobranca", nome: "Cobrança liberada", assunto: "Sua cobrança da Upe está disponível", blocos: [B("cabecalho"), B("titulo", { texto: "Pagamento disponível" }), B("cobranca"), B("texto", { texto: "Pague por PIX ou cartão direto no portal. Depois de pagar, toque em “Já paguei”." }), B("botao", { texto: "Pagar no portal" }), B("rodape")] },
    { id: "promo-grafica", nome: "Promoção de materiais gráficos", assunto: "Condição especial para os seus impressos", blocos: [B("cabecalho"), B("titulo", { texto: "Hora de repor os seus impressos" }), B("promo"), B("produtos"), B("botao", { texto: "Ver meus produtos" }), B("rodape")] },
    { id: "newsletter-mensal", nome: "Newsletter mensal", assunto: "Novidades da Upe Criativo", blocos: [B("cabecalho"), B("titulo", { texto: "Novidades do mês" }), B("texto", { texto: "Conte aqui uma novidade, um case novo ou uma dica de marca." }), B("imagem"), B("texto", { texto: "Um segundo assunto, com um convite claro." }), B("botao", { texto: "Falar com a Upe", link: "https://wa.me/" + (CFG.whatsappUpe || "") }), B("rodape")] }
  ];
}
function mergeData(r) {
  const doc = r?.doc || {}, acoes = r?.acoes || [];
  const p = r ? pendencias(doc, acoes) : { posts: [], artes: [], cobs: [] };
  return { nome: (r?.doc?.nome || r?.nome || "cliente").split(" ")[0], empresa: doc.empresa || "", marca: doc.marca || doc.empresa || "sua marca", portal: portalUrl(), p, doc, acoes };
}
const tagsIn = (s, d) => String(s || "").replace(/\{\{(\w+)\}\}/g, (_, k) => d[k] ?? "");
function emailHTML(tpl, d) {
  const E = s => esc(tagsIn(s, d)), logoSrc = new URL((CFG.siteUrl || "../") + "assets/img/upe-logo-creme.png", location.href).href;
  const row = inner => `<tr><td style="padding:0 32px">${inner}</td></tr>`;
  const list = items => items.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items.map(([a, b]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #E6E3D6;font:400 15px Arial,sans-serif;color:#172431">${a}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #E6E3D6;font:700 14px Arial,sans-serif;color:#0C4F7F;white-space:nowrap">${b}</td></tr>`).join("")}</table>` : `<p style="font:400 15px Arial,sans-serif;color:#56636F;margin:0">Nada pendente por aqui. Tudo em dia!</p>`;
  const h3 = t => `<h3 style="font:900 18px Arial,sans-serif;color:#172431;margin:24px 0 8px">${E(t)}</h3>`;
  const body = tpl.blocos.map(b => { const P = b.props; switch (b.tipo) {
    case "cabecalho": return `<tr><td style="background:${esc(P.fundo)};padding:26px 32px"><img src="${esc(logoSrc)}" alt="Upe Criativo" width="180" style="display:block;width:180px;height:auto;border:0"></td></tr>`;
    case "titulo": return row(`<h1 style="font:900 28px/1.15 Arial,sans-serif;color:#0C4F7F;margin:28px 0 8px;text-align:${esc(P.alinhar)}">${E(P.texto)}</h1>`);
    case "texto": return row(`<p style="font:400 16px/1.55 Arial,sans-serif;color:#172431;margin:12px 0">${E(P.texto).replace(/\n/g, "<br>")}</p>`);
    case "imagem": return P.url ? row(`${P.link ? `<a href="${E(P.link)}">` : ""}<img src="${E(P.url)}" alt="${E(P.alt)}" width="536" style="display:block;width:100%;height:auto;border:0;border-radius:10px;margin:12px 0">${P.link ? "</a>" : ""}`) : row(`<div style="background:#ECEADF;border-radius:10px;padding:40px;text-align:center;font:700 13px Arial,sans-serif;color:#56636F;margin:12px 0">Imagem</div>`);
    case "botao": return row(`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="background:${esc(P.cor)};border-radius:999px"><a href="${E(P.link)}" style="display:inline-block;padding:14px 26px;font:900 15px Arial,sans-serif;color:#F2F0E1;text-decoration:none">${E(P.texto)}</a></td></tr></table>`);
    case "status": { const items = [...d.p.posts.map(x => [`Post: ${esc(x.titulo)}`, "Aguardando aprovação"]), ...d.p.artes.map(x => [`Arte: ${esc(x.produto)}`, "Aguardando aprovação"]), ...(d.doc.incluso || []).map(i => [esc(i.item), i.feito ? "Feito ✓" : "Em andamento"])];
      return row(h3(P.titulo) + list(items)); }
    case "cobranca": return row(h3(P.titulo) + list(d.p.cobs.map(c => [`${esc(c.descricao)}<br><span style="color:#56636F;font-size:13px">Vence ${fdate(c.vencimento)}</span>`, brl(c.valor)])));
    case "produtos": { const items = (d.doc.graficos || []).filter(g => g.recompra).map(g => [`${esc(g.produto)}<br><span style="color:#56636F;font-size:13px">${esc(g.specs)}</span>`, brl(g.precoRecompra || g.valor)]);
      return items.length || !d.doc.nome ? row(h3(P.titulo) + list(items)) : ""; }
    case "promo": return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0C4F7F;border-radius:14px;margin:16px 0"><tr><td style="padding:24px">
      <span style="display:inline-block;background:#F2C14E;color:#3A2A00;font:900 11px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:999px">${E(P.selo)}</span>
      <h2 style="font:900 24px Arial,sans-serif;color:#F2F0E1;margin:12px 0 6px">${E(P.titulo)}</h2><p style="font:400 15px Arial,sans-serif;color:#DCE3EC;margin:0 0 12px">${E(P.texto)}</p>
      <p style="margin:0 0 12px;font:900 28px Arial,sans-serif;color:#F2F0E1">R$ ${E(P.preco)} ${P.precoAntigo ? `<s style="font:400 16px Arial,sans-serif;color:#A9BBD0">R$ ${E(P.precoAntigo)}</s>` : ""}</p>
      ${P.cupom ? `<p style="margin:0 0 14px;font:400 14px Arial,sans-serif;color:#F2F0E1">Cupom <b style="border:1.5px dashed #F2F0E1;padding:3px 8px;border-radius:6px">${E(P.cupom)}</b> ${E(P.validade)}</p>` : ""}
      <a href="${E(P.link)}" style="display:inline-block;background:#F2F0E1;color:#0C4F7F;padding:12px 22px;border-radius:999px;font:900 14px Arial,sans-serif;text-decoration:none">${E(P.botao)}</a></td></tr></table>`);
    case "divisor": return row(`<hr style="border:0;border-top:1px solid #E6E3D6;margin:20px 0">`);
    case "rodape": return `<tr><td style="padding:26px 32px;background:#F2F0E1;font:400 12px/1.6 Arial,sans-serif;color:#56636F">${E(P.texto).replace(/\n/g, "<br>")}</td></tr>`;
    default: return ""; } }).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(tpl.assunto)}</title></head><body style="margin:0;background:#ECEADF"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECEADF;padding:24px 0"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden">${body}<tr><td style="height:8px"></td></tr></table></td></tr></table></body></html>`;
}
async function aNewsletter(w) {
  const tpls = await S.list("templates"), envios = (await S.list("envios")).sort((a, b) => b.em - a.em);
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">E-mail marketing</span><h1>Newsletter</h1><p class="muted small">Modelos editáveis por blocos, com os dados de cada cliente: nome, status do projeto, cobranças e produtos.</p></div><button class="btn" id="tNew">Novo modelo</button></div>
    <div class="g3">${tpls.map(t => `<a class="card grid" href="#/admin/newsletter/${esc(t.id)}" style="text-decoration:none;color:inherit"><span class="eb">${(t.blocos || []).length} blocos</span><h3>${esc(t.nome)}</h3><p class="muted small">${esc(t.assunto)}</p></a>`).join("")}</div>
    <section class="card grid"><h3>Envios</h3>${envios.length ? `<div class="tbl"><table><thead><tr><th>Data</th><th>Modelo</th><th>Destinatários</th><th>Como</th></tr></thead><tbody>${envios.map(e => `<tr><td class="num">${fdt(e.em)}</td><td>${esc(e.modelo)}</td><td class="num">${e.total}</td><td>${esc(e.via)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nenhum envio ainda.</p>`}</section>`;
  $("#tNew").onclick = async () => { const t = { id: uid(10), nome: "Novo modelo", assunto: "Assunto do e-mail", blocos: [B("cabecalho"), B("titulo"), B("texto"), B("botao"), B("rodape")] }; await S.set(`templates/${t.id}`, t); go(`#/admin/newsletter/${t.id}`); };
}
async function aNewsEditor(w, tid) {
  const tpl = await S.get(`templates/${tid}`); if (!tpl) return go("#/admin/newsletter");
  const clients = state.cache.clients, contatos = state.cache.contatos;
  let sel = null, prevId = clients[0]?.id || "";
  const FIELD = { texto: "Texto", titulo: "Título", url: "Link da imagem", alt: "Texto alternativo", link: "Link", cor: "Cor", fundo: "Cor de fundo", selo: "Selo", preco: "Preço (R$)", precoAntigo: "Preço antigo (R$)", cupom: "Cupom", validade: "Validade", botao: "Texto do botão", alinhar: "Alinhamento" };
  const AUD = [["todos", "Todos os clientes"], ["midias", "Plano Mídias digitais"], ["grafica", "Plano Papelaria gráfica"], ["branding", "Plano Branding"], ["pendencias", "Com aprovações pendentes"], ["cobranca", "Com cobrança em aberto"], ["recompra", "Com produtos para recompra"], ["contatos", "Contatos do site (não clientes)"]];
  let aud = "todos";
  const recipients = () => {
    if (aud === "contatos") return contatos.filter(c => c.status !== "convertido" && /@/.test(c.contato)).map(c => ({ email: c.contato.trim(), nome: c.nome, r: null }));
    return clients.filter(c => c.doc.ativo !== false && c.priv.email).filter(c => { const p = pendencias(c.doc, c.acoes);
      return aud === "todos" || (aud === "pendencias" ? p.posts.length + p.artes.length > 0 : aud === "cobranca" ? p.cobs.length > 0 : aud === "recompra" ? (c.doc.graficos || []).some(g => g.recompra) : c.doc.plano?.[aud]); })
      .map(c => ({ email: c.priv.email, nome: c.doc.nome, r: c }));
  };
  const draw = () => {
    w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><a class="small" href="#/admin/newsletter">← Newsletter</a><h1>${esc(tpl.nome)}</h1></div><div class="row"><button class="btn sec" id="tDel">Excluir modelo</button><button class="btn" id="tSave">Salvar modelo</button></div></div>
      <div class="nl"><div class="grid">
        <section class="card grid"><div class="g2"><label class="f" for="tN">Nome do modelo<input id="tN" value="${esc(tpl.nome)}"></label><label class="f" for="tA">Assunto do e-mail<input id="tA" value="${esc(tpl.assunto)}"></label></div><p class="muted small">Variáveis: {{nome}} {{empresa}} {{marca}} {{portal}}</p></section>
        <section class="grid" style="gap:8px">${tpl.blocos.map((b, k) => `<div class="blk ${sel === b.id ? "sel" : ""}"><div class="bh" data-bs="${b.id}"><b>${esc(BLOCOS[b.tipo]?.nome || b.tipo)}</b><button data-up="${k}" aria-label="Subir">↑</button><button data-dn="${k}" aria-label="Descer">↓</button><button data-dup="${k}" aria-label="Duplicar">⧉</button><button data-rm="${k}" aria-label="Remover">×</button></div>
          ${sel === b.id ? `<div class="bb">${Object.keys(b.props).length ? Object.entries(b.props).map(([pk, pv]) => pk === "alinhar" ? `<label class="f">${FIELD[pk]}<select data-pk="${pk}"><option value="left" ${pv === "left" ? "selected" : ""}>Esquerda</option><option value="center" ${pv === "center" ? "selected" : ""}>Centro</option></select></label>` : (pk === "cor" || pk === "fundo") ? `<label class="f">${FIELD[pk]}<input type="color" data-pk="${pk}" value="${esc(pv)}"></label>` : (pk === "texto" && ["texto", "rodape", "promo"].includes(b.tipo)) ? `<label class="f">${FIELD[pk]}<textarea data-pk="${pk}" rows="3">${esc(pv)}</textarea></label>` : `<label class="f">${FIELD[pk] || pk}<input data-pk="${pk}" value="${esc(pv)}"></label>`).join("") : `<p class="muted small">${b.tipo === "divisor" ? "Linha separadora." : "Este bloco é preenchido com os dados de cada cliente."}</p>`}</div>` : ""}</div>`).join("")}</section>
        <section class="card grid"><span class="eb">Adicionar bloco</span><div class="row">${Object.entries(BLOCOS).map(([k, v]) => `<button class="chip" data-add="${k}">+ ${v.nome}</button>`).join("")}</div></section>
        <section class="card grid"><h3>Enviar</h3>
          <label class="f" for="aud">Para quem<select id="aud">${AUD.map(([k, l]) => `<option value="${k}" ${aud === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <p class="small"><b class="num" id="rc"></b> <span class="muted">destinatário(s) com e-mail</span></p>
          <div class="row"><button class="btn" id="sQ">Enviar</button><button class="btn sec" id="sB">Abrir no meu e-mail (Cco)</button><button class="btn sec" id="sC">Copiar HTML</button><button class="btn sec" id="sD">Baixar HTML</button></div>
          <p class="muted small">${S.mode === "firebase" ? "“Enviar” coloca um e-mail personalizado por destinatário na fila do Firebase (extensão Trigger Email). Veja o README." : "No modo demonstração, “Enviar” só registra o envio, sem mandar e-mails."}</p></section>
      </div>
      <div class="preview"><div class="spread" style="margin-bottom:10px"><b class="small">Pré-visualização</b><select id="pv" aria-label="Ver com os dados de" style="max-width:260px">${clients.map(c => `<option value="${c.id}" ${prevId === c.id ? "selected" : ""}>${esc(c.doc.marca || c.doc.nome)}</option>`).join("")}<option value="" ${!prevId ? "selected" : ""}>Sem cliente</option></select></div><iframe id="pf" title="Pré-visualização do e-mail"></iframe></div></div>`;
    const render = () => { const r = clients.find(c => c.id === prevId) || null; $("#pf").srcdoc = emailHTML(tpl, mergeData(r)); $("#rc").textContent = recipients().length; };
    render();
    $("#tN").oninput = e => tpl.nome = e.target.value; $("#tA").oninput = e => { tpl.assunto = e.target.value; };
    $$("[data-bs]", w).forEach(h => h.onclick = e => { if (e.target.closest("button")) return; sel = sel === h.dataset.bs ? null : h.dataset.bs; draw(); });
    const mv = (k, d) => { const a = tpl.blocos, j = k + d; if (j < 0 || j >= a.length) return; [a[k], a[j]] = [a[j], a[k]]; draw(); };
    $$("[data-up]", w).forEach(b => b.onclick = () => mv(+b.dataset.up, -1)); $$("[data-dn]", w).forEach(b => b.onclick = () => mv(+b.dataset.dn, 1));
    $$("[data-rm]", w).forEach(b => b.onclick = () => { tpl.blocos.splice(+b.dataset.rm, 1); draw(); });
    $$("[data-dup]", w).forEach(b => b.onclick = () => { const k = +b.dataset.dup; tpl.blocos.splice(k + 1, 0, { ...clone(tpl.blocos[k]), id: uid(6) }); draw(); });
    $$("[data-add]", w).forEach(b => b.onclick = () => { const nb = B(b.dataset.add); tpl.blocos.splice(Math.max(tpl.blocos.length - 1, 0), 0, nb); sel = nb.id; draw(); });
    $$("[data-pk]", w).forEach(i => i.oninput = () => { const b = tpl.blocos.find(x => x.id === sel); b.props[i.dataset.pk] = i.value; clearTimeout(w._r); w._r = setTimeout(render, 200); });
    $("#pv").onchange = e => { prevId = e.target.value; render(); };
    $("#aud").onchange = e => { aud = e.target.value; render(); };
    $("#tSave").onclick = async () => { await S.set(`templates/${tpl.id}`, tpl); toast("Modelo salvo"); };
    $("#tDel").onclick = async () => { await S.del(`templates/${tpl.id}`); toast("Modelo excluído"); go("#/admin/newsletter"); };
    $("#sC").onclick = () => copy(emailHTML(tpl, mergeData(clients.find(c => c.id === prevId) || null)), "HTML copiado");
    $("#sD").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([emailHTML(tpl, mergeData(clients.find(c => c.id === prevId) || null))], { type: "text/html" })); a.download = `${tpl.id}.html`; a.click(); };
    $("#sB").onclick = () => { const rs = recipients(); if (!rs.length) return toast("Nenhum destinatário com e-mail"); location.href = `mailto:?bcc=${encodeURIComponent(rs.map(r => r.email).join(","))}&subject=${encodeURIComponent(tagsIn(tpl.assunto, mergeData(null)))}`; };
    $("#sQ").onclick = () => { const rs = recipients(); if (!rs.length) return toast("Nenhum destinatário com e-mail");
      modal("Enviar newsletter?", `<p>“${esc(tpl.assunto)}” para <b>${rs.length}</b> destinatário(s). Cada pessoa recebe a versão com os próprios dados.</p><div class="legenda small">${rs.map(r => esc(r.email)).join(", ")}</div>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="sGo">Enviar agora</button>`);
      $("#sGo").onclick = async () => {
        await S.set(`templates/${tpl.id}`, tpl);
        if (S.mode === "firebase") for (const r of rs) { const d = mergeData(r.r || { nome: r.nome }); await S.add("mail", { to: r.email, message: { subject: tagsIn(tpl.assunto, d), html: emailHTML(tpl, d) } }); }
        await S.add("envios", { modelo: tpl.nome, total: rs.length, via: S.mode === "firebase" ? "Fila do Firebase" : "Demonstração (não enviado)", em: Date.now() });
        dlg.close(); toast(S.mode === "firebase" ? "E-mails na fila de envio" : "Envio registrado (demonstração)");
      }; };
  };
  draw();
}

/* ---------- configurações ---------- */
async function aConfig(w) {
  const cfg = await Api.config();
  w.innerHTML = `<div class="grid" style="gap:4px"><span class="eb">Painel Upe</span><h1>Configurações</h1></div>
    <div class="g2">
      <section class="card grid"><h3>Recebimento por PIX</h3><p class="muted small">Usado para gerar o QR Code e o copia e cola de cada cobrança, com o valor certo.</p>
        <label class="f" for="kC">Chave PIX<input id="kC" value="${esc(cfg.pixChave || "")}" placeholder="e-mail, telefone (+55…), CPF/CNPJ ou chave aleatória"></label>
        <div class="g2"><label class="f" for="kN">Nome do recebedor (até 25 letras)<input id="kN" maxlength="25" value="${esc(cfg.pixNome || "")}"></label><label class="f" for="kCi">Cidade (até 15 letras)<input id="kCi" maxlength="15" value="${esc(cfg.pixCidade || "")}"></label></div>
        <button class="btn sec sm" id="kT" style="justify-self:start">Testar QR de R$ 1,00</button></section>
      <section class="card grid"><h3>Cartão e contato</h3>
        <label class="f" for="kL">Link de pagamento padrão (cartão)<input id="kL" value="${esc(cfg.linkCartao || "")}" placeholder="Mercado Pago, InfinitePay, PagSeguro, Stripe…"></label>
        <p class="muted small">Cada cobrança pode ter o próprio link. O portal nunca pede número de cartão.</p>
        <label class="f" for="kW">WhatsApp da Upe (para o cliente falar com você)<input id="kW" value="${esc(cfg.whatsapp || CFG.whatsappUpe || "")}"></label></section>
    </div>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="kS">Salvar configurações</button></div>
    <section class="card grid"><h3>Dados e conexão</h3>
      <p>${S.mode === "firebase" ? `Conectado ao Firebase, projeto <b>${esc(CFG.firebase.projectId)}</b>.` : "Modo demonstração: os dados ficam só neste navegador. Para usar com clientes de verdade, configure o Firebase em <code>portal/config.js</code> (passo a passo no README)."}</p>
      ${S.mode === "demo" ? `<div><button class="btn bad sm" id="kR">Apagar dados de demonstração</button></div>` : ""}</section>`;
  const read = () => ({ pixChave: $("#kC").value.trim(), pixNome: $("#kN").value.trim(), pixCidade: $("#kCi").value.trim(), linkCartao: $("#kL").value.trim(), whatsapp: $("#kW").value.replace(/\D/g, "") });
  $("#kS").onclick = async () => { await S.set("config/publico", read()); toast("Configurações salvas"); };
  $("#kT").onclick = () => { const c = read(); if (!c.pixChave) return toast("Informe a chave PIX"); const pl = pixPayload({ chave: c.pixChave, nome: c.pixNome, cidade: c.pixCidade, valor: 1, txid: "TESTEUPE" });
    modal("Teste de PIX (R$ 1,00)", `<div style="text-align:center"><div class="qrbox" id="qr"></div></div><div class="cc">${esc(pl)}</div><p class="muted small">Leia com o app do banco e confira o nome do recebedor antes de pagar.</p>`); try { new QRCode($("#qr"), { text: pl, width: 200, height: 200 }); } catch (e) {} };
  if ($("#kR")) $("#kR").onclick = () => S.reset();
}

/* ---------------- início ---------------- */
(async () => {
  try { await S.init(); }
  catch (e) { app.innerHTML = `<div class="gate"><div class="box"><div class="logo">${WM}</div><h1>Não foi possível conectar</h1><p>${esc(e.message)}</p></div></div>`; return; }
  route();
})();
})();
