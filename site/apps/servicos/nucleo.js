/* Núcleo do Painel Upe Serviços (banco, login, utilidades). Compartilhado pelas seções do painel
   (sem dependência das seções, para não haver importação circular)
   Dados: srv_* (clientes, planos, cobranças), lp_* (páginas, eventos, leads, domínios), agenda_paginas, dash_paineis. */
import { banco, login, DEMO, ADMIN_EMAIL, SITES, WHATS, PLANOS_PADRAO, FRENTES, esc, brl, hoje, slugify, uid, msgErro } from "./srv.js";
import { montar } from "./lp-render.js";
export { montar };
import { semente } from "./demo.js";

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const db = banco(semente), auth = login();
export const S = { user: null, admin: false, cid: null, cliente: null, clientes: [], view: "", cfg: {}, recursos: {}, sujo: false };
const DIA = 864e5;
const fmtData = d => d ? new Date(d.length === 10 ? d + "T12:00" : d).toLocaleDateString("pt-BR") : "—";
const fmtDH = t => t ? new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const mesNome = ref => new Date(ref + "-15T12:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
export function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 3200); }
const pill = (cls, t) => `<span class="pill ${cls}">${esc(t)}</span>`;
const vazio = (t, extra = "") => `<div class="vazio"><p>${esc(t)}</p>${extra}</div>`;

/* ---------- PIX (copia e cola) ---------- */
function crc16(s) { let c = 0xFFFF; for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, "0"); }
function pixCode(p, valor, txid) {
  const a = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 .\-]/g, "").trim(), f = (id, v) => id + String(v.length).padStart(2, "0") + v;
  const body = f("00", "01") + f("26", f("00", "br.gov.bcb.pix") + f("01", p.pixChave)) + f("52", "0000") + f("53", "986") + (valor > 0 ? f("54", (+valor).toFixed(2)) : "") + f("58", "BR") + f("59", a(p.pixNome || "UPE CRIATIVO").slice(0, 25).toUpperCase()) + f("60", a(p.pixCidade || "SAO PAULO").slice(0, 15).toUpperCase()) + f("62", f("05", String(txid).replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***")) + "6304";
  return body + crc16(body);
}

/* ---------- diálogo ---------- */
function dialogo(html, aoEnviar, aoAbrir) {
  const d = $("#dlg"); d.innerHTML = `<form class="d" method="dialog">${html}</form>`;
  const f = $("form", d);
  f.addEventListener("submit", async e => {
    const b = e.submitter; if (b && b.value === "cancelar") return;
    e.preventDefault(); if (b) b.disabled = true;
    try { const r = await aoEnviar(new FormData(f), f, b); if (r !== false) d.close(); } catch (er) { console.error(er); toast(msgErro(er)); } finally { if (b) b.disabled = false; }
  });
  d.showModal(); if (aoAbrir) aoAbrir(f);
  return d;
}
const botoesDlg = (ok = "Salvar") => `<div class="linha" style="justify-content:flex-end"><button class="btn" value="cancelar" formnovalidate>Cancelar</button><button class="btn azul" value="ok">${esc(ok)}</button></div>`;

export const tem = f => !!S.cliente && (S.cliente.frentes || []).includes(f);
const topo = (t, acoes = "") => `<div class="topo"><h2>${esc(t)}</h2><div class="acoes">${acoes}</div></div>${DEMO ? `<div class="banner"><b>Modo demonstração.</b> Clientes, páginas, visitas e reservas são fictícios e ficam só neste navegador. <button class="btn sm" type="button" id="demoReset">Restaurar exemplo</button></div>` : ""}`;
/* ---------- dados do cliente ---------- */
const paginasDoCliente = () => db.list("lp_paginas", { where: [["cid", "==", S.cid]] });
async function eventosDe(slugs, desde) { const out = []; for (const s of slugs) (await db.list(`lp_paginas/${s}/eventos`, { where: [["t", ">=", desde]], order: ["t", "asc"] })).forEach(e => out.push({ ...e, pagina: s })); return out; }
async function agendaDoCliente() { const l = await db.list("agenda_paginas", { where: [["cid", "==", S.cid]] }); return l[0] || null; }

export function statusMensal(s) { return ({ teste: pill("info", "Em teste"), ativo: pill("ok", "Em dia"), atrasado: pill("warn", "Em atraso"), suspenso: pill("crit", "Suspenso"), cancelado: pill("", "Cancelado") })[s] || pill("", s || "—"); }
export async function carregarCliente() { S.cliente = S.cid ? await db.get("srv_clientes/" + S.cid) : null; }
export { $, $$, dialogo, botoesDlg, pill, vazio, fmtData, fmtDH, mesNome, DIA, pixCode, paginasDoCliente, eventosDe, agendaDoCliente, topo };
export const ctx = { rota: () => {} };
