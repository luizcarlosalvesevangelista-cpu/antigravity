/* Dashboards: painéis de indicadores montados pela Upe para o cliente. Fontes: agenda (atendimentos), landing pages (eventos)
   ou uma planilha publicada como CSV (Google Planilhas › Arquivo › Compartilhar › Publicar na Web › CSV). */
import { db, S, $, $$, toast, dialogo, botoesDlg, vazio, topo, paginasDoCliente, eventosDe, agendaDoCliente, DIA, ctx } from "./nucleo.js";
import { esc, brl, uid } from "./srv.js";
import { grafBarras, grafRanking } from "./v-analise.js";

export const views = {};
const FONTES = { agenda: "Agenda online (agendamentos)", lp: "Landing pages (visitas, cliques e leads)", csv: "Planilha (link CSV)" };
const AGG = { contar: "Quantidade de linhas", soma: "Soma", media: "Média", ultimo: "Último valor" };
const TIPOS = { kpi: "Número grande", serie: "Barras por dia ou mês", ranking: "Ranking", tabela: "Tabela" };

/* ---------- dados ---------- */
export function lerCSV(txt) {
  const linhas = [], sep = (txt.split("\n")[0].match(/;/g) || []).length > (txt.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
  let cel = "", lin = [], q = false;
  for (let i = 0; i < txt.length; i++) { const c = txt[i];
    if (q) { if (c === '"' && txt[i + 1] === '"') { cel += '"'; i++; } else if (c === '"') q = false; else cel += c; }
    else if (c === '"') q = true; else if (c === sep) { lin.push(cel); cel = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; lin.push(cel); linhas.push(lin); lin = []; cel = ""; } else cel += c; }
  if (cel || lin.length) { lin.push(cel); linhas.push(lin); }
  const [cab, ...resto] = linhas.filter(l => l.some(x => x.trim()));
  return (resto || []).map(l => Object.fromEntries((cab || []).map((k, i) => [k.trim(), (l[i] ?? "").trim()])));
}
const num = v => { if (typeof v === "number") return v; const s = String(v ?? "").replace(/[R$\s%]/g, ""); const n = s.includes(",") ? +s.replace(/\./g, "").replace(",", ".") : +s; return isFinite(n) ? n : NaN; };
const data = v => { const s = String(v ?? ""); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`; m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; return ""; };
async function linhasDe(p) {
  if (p.fonte === "csv") { if (!p.csv) return []; const r = await fetch(p.csv); if (!r.ok) throw new Error("Não foi possível ler a planilha. Confira se ela está publicada como CSV."); return lerCSV(await r.text()); }
  if (p.fonte === "agenda") { const ag = await agendaDoCliente(); if (!ag) return []; const pr = Object.fromEntries((ag.servicos || []).map(s => [s.nome, +s.preco || 0]));
    return (await db.list(`agenda_paginas/${ag.id}/reservas`)).map(r => ({ data: r.data, hora: r.hora, servico: r.servico, situacao: r.status, valor: r.status === "cancelada" ? 0 : pr[r.servico] || 0, cliente: r.nome })); }
  if (p.fonte === "lp") { const pg = await paginasDoCliente(); return (await eventosDe(pg.map(x => x.id), Date.now() - 90 * DIA)).map(e => ({ data: new Date(e.t).toISOString().slice(0, 10), tipo: e.tipo, pagina: e.pagina, aparelho: e.disp || "", origem: (e.utm || "").split("|")[0] || e.ref || "direto", visitante: e.vid })); }
  return [];
}
const filtra = (ls, f) => { if (!f || !f.includes("=")) return ls; const [k, v] = f.split("=").map(s => s.trim()); return ls.filter(l => String(l[k] ?? "").toLowerCase() === v.toLowerCase()); };
const agrega = (ls, col, agg) => { if (agg === "contar") return ls.length; const vs = ls.map(l => num(l[col])).filter(n => !isNaN(n)); if (agg === "ultimo") return vs[vs.length - 1] ?? 0; const s = vs.reduce((a, b) => a + b, 0); return agg === "media" ? (vs.length ? s / vs.length : 0) : s; };
const fmtW = w => v => w.moeda ? brl(v) : (+v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function widget(w, ls) {
  const L = filtra(ls, w.filtro), f = fmtW(w);
  if (w.tipo === "kpi") return `<div class="kpi"><b class="num">${f(agrega(L, w.col, w.agg))}</b><span>${esc(w.rotulo)}</span></div>`;
  if (w.tipo === "serie") { const m = new Map(); L.forEach(l => { const d = data(l[w.colData]); if (!d) return; const k = w.periodo === "mes" ? d.slice(0, 7) : d; (m.get(k) || m.set(k, []).get(k)).push(l); });
    const ks = [...m.keys()].sort().slice(w.periodo === "mes" ? -12 : -31); return `<section class="card"><h3>${esc(w.rotulo)}</h3>${ks.length ? grafBarras(ks.map(k => ({ r: w.periodo === "mes" ? k.slice(5) + "/" + k.slice(2, 4) : k.slice(8) + "/" + k.slice(5, 7), v: agrega(m.get(k), w.col, w.agg) })), { rotulo: w.rotulo, fmt: f }) : `<p class="muted">Sem dados com data na coluna “${esc(w.colData)}”.</p>`}</section>`; }
  if (w.tipo === "ranking") { const m = new Map(); L.forEach(l => { const k = l[w.colCat]; if (k) (m.get(k) || m.set(k, []).get(k)).push(l); });
    return `<section class="card"><h3>${esc(w.rotulo)}</h3>${grafRanking([...m].map(([r, g]) => ({ r, v: agrega(g, w.col, w.agg) })).sort((a, b) => b.v - a.v).slice(0, 8), f)}</section>`; }
  if (w.tipo === "tabela") { const cols = Object.keys(L[0] || {}).slice(0, 7); return `<section class="card"><h3>${esc(w.rotulo)}</h3><div class="rolar"><table class="tabela"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${L.slice(-20).reverse().map(l => `<tr>${cols.map(c => `<td>${esc(l[c])}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`; }
  return "";
}
export function sugerir(fonte) {
  if (fonte === "agenda") return [{ id: uid(5), tipo: "kpi", rotulo: "Agendamentos", agg: "contar", filtro: "" }, { id: uid(5), tipo: "kpi", rotulo: "Faturamento previsto", agg: "soma", col: "valor", moeda: true }, { id: uid(5), tipo: "kpi", rotulo: "Cancelamentos", agg: "contar", filtro: "situacao=cancelada" },
    { id: uid(5), tipo: "serie", rotulo: "Agendamentos por dia", colData: "data", agg: "contar", periodo: "dia" }, { id: uid(5), tipo: "ranking", rotulo: "Serviços mais agendados", colCat: "servico", agg: "contar" }, { id: uid(5), tipo: "ranking", rotulo: "Faturamento por serviço", colCat: "servico", col: "valor", agg: "soma", moeda: true }];
  if (fonte === "lp") return [{ id: uid(5), tipo: "kpi", rotulo: "Visitas (90 dias)", agg: "contar", filtro: "tipo=visita" }, { id: uid(5), tipo: "kpi", rotulo: "Leads (90 dias)", agg: "contar", filtro: "tipo=lead" }, { id: uid(5), tipo: "kpi", rotulo: "Cliques no WhatsApp", agg: "contar", filtro: "tipo=whatsapp" },
    { id: uid(5), tipo: "serie", rotulo: "Visitas por dia", colData: "data", agg: "contar", filtro: "tipo=visita", periodo: "dia" }, { id: uid(5), tipo: "ranking", rotulo: "Origem das visitas", colCat: "origem", agg: "contar", filtro: "tipo=visita" }, { id: uid(5), tipo: "ranking", rotulo: "Leads por página", colCat: "pagina", agg: "contar", filtro: "tipo=lead" }];
  return [{ id: uid(5), tipo: "kpi", rotulo: "Linhas na planilha", agg: "contar" }, { id: uid(5), tipo: "tabela", rotulo: "Últimos registros" }];
}

views.dash = async (M, id) => {
  const ps = (await db.list("dash_paineis", { where: [["cid", "==", S.cid]] })).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const p = ps.find(x => x.id === id) || ps[0];
  M.innerHTML = topo("Dashboards", `${ps.length > 1 ? `<select class="in-txt" id="dSel" style="width:auto">${ps.map(x => `<option value="${esc(x.id)}" ${x === p ? "selected" : ""}>${esc(x.titulo)}</option>`).join("")}</select>` : ""}${S.admin ? `<button class="btn sm azul" type="button" id="dNovo">+ Novo dashboard</button>${p ? `<button class="btn sm" type="button" id="dEdit">Editar</button>` : ""}` : ""}`);
  $("#dSel")?.addEventListener("change", e => location.hash = "#/dash/" + e.target.value);
  $("#dNovo")?.addEventListener("click", () => editar(null));
  $("#dEdit")?.addEventListener("click", () => editar(p));
  if (!p) { M.insertAdjacentHTML("beforeend", `<section class="card">${vazio(S.admin ? "Este cliente ainda não tem dashboard. Crie um com os indicadores combinados." : "Seu dashboard aparece aqui assim que a Upe terminar de montar. Quer um? Peça em Pedidos de ajuste.")}</section>`); return; }
  let ls; try { ls = await linhasDe(p); } catch (e) { M.insertAdjacentHTML("beforeend", `<section class="card">${vazio(e.message)}</section>`); return; }
  const ws = p.widgets || [], kp = ws.filter(w => w.tipo === "kpi"), outros = ws.filter(w => w.tipo !== "kpi");
  M.insertAdjacentHTML("beforeend", `<p class="muted">${esc(p.titulo)} · fonte: ${esc(FONTES[p.fonte] || p.fonte)} · ${ls.length} registros${p.descricao ? " · " + esc(p.descricao) : ""}</p>
    ${kp.length ? `<div class="kpis">${kp.map(w => widget(w, ls)).join("")}</div>` : ""}<div class="grid2">${outros.map(w => widget(w, ls)).join("")}</div>`);
};

/* editor (só a Upe) */
function editar(p) {
  const D = p ? JSON.parse(JSON.stringify(p)) : { titulo: "Indicadores do negócio", fonte: "agenda", csv: "", widgets: sugerir("agenda"), ordem: Date.now() };
  const linhaW = (w, i) => `<div class="card" style="box-shadow:none;padding:12px;gap:8px" data-w="${i}">
    <div class="grid2"><label class="f">Tipo<select data-k="tipo">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}" ${w.tipo === k ? "selected" : ""}>${t}</option>`).join("")}</select></label><label class="f">Título<input data-k="rotulo" value="${esc(w.rotulo || "")}"></label></div>
    <div class="grid2"><label class="f">Cálculo<select data-k="agg">${Object.entries(AGG).map(([k, t]) => `<option value="${k}" ${w.agg === k ? "selected" : ""}>${t}</option>`).join("")}</select></label><label class="f">Coluna do valor<input data-k="col" value="${esc(w.col || "")}" placeholder="ex.: valor"></label></div>
    <div class="grid2"><label class="f">Coluna de data (barras) ou categoria (ranking)<input data-k="${w.tipo === "ranking" ? "colCat" : "colData"}" value="${esc(w.tipo === "ranking" ? w.colCat || "" : w.colData || "")}"></label><label class="f">Filtro (coluna=valor)<input data-k="filtro" value="${esc(w.filtro || "")}" placeholder="ex.: situacao=confirmada"></label></div>
    <div class="linha"><label class="chk"><input type="checkbox" data-k="moeda" ${w.moeda ? "checked" : ""}> Valor em reais</label><label class="chk"><input type="checkbox" data-k="periodo" ${w.periodo === "mes" ? "checked" : ""}> Agrupar por mês</label><button class="btn sm perigo" type="button" data-rmw="${i}">Remover</button></div></div>`;
  dialogo(`<h3>${p ? "Editar" : "Novo"} dashboard</h3>
    <label class="f">Título<input name="titulo" required value="${esc(D.titulo)}"></label>
    <label class="f">Fonte dos dados<select name="fonte">${Object.entries(FONTES).map(([k, t]) => `<option value="${k}" ${D.fonte === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
    <label class="f" id="lCsv">Link CSV da planilha publicada<input name="csv" type="url" value="${esc(D.csv || "")}" placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?output=csv"></label>
    <p class="muted" style="font-size:12.5px">Colunas da agenda: data, hora, servico, situacao, valor, cliente. Das landing pages: data, tipo (visita, lead, clique, whatsapp, rolagem), pagina, aparelho, origem, visitante.</p>
    <div class="linha"><b>Indicadores</b><button class="btn sm" type="button" id="wAdd">+ Indicador</button><button class="btn sm" type="button" id="wSug">Sugerir para a fonte</button></div><div id="wLista" style="display:grid;gap:8px"></div>
    <div class="linha" style="justify-content:space-between">${p ? `<button class="btn perigo" value="apagar">Apagar dashboard</button>` : "<span></span>"}<span class="linha"><button class="btn" value="cancelar" formnovalidate>Cancelar</button><button class="btn azul" value="ok">Salvar</button></span></div>`, async (fd, f, b) => {
    if (b?.value === "apagar") { if (!confirm("Apagar este dashboard?")) return false; await db.del("dash_paineis/" + p.id); toast("Dashboard apagado."); location.hash = "#/dash"; ctx.rota(); return; }
    const doc = { cid: S.cid, titulo: String(fd.get("titulo")).trim(), fonte: fd.get("fonte"), csv: String(fd.get("csv") || "").trim(), widgets: D.widgets, ordem: D.ordem || Date.now(), atualizadoEm: Date.now() };
    const id = p?.id || uid(12); await db.set("dash_paineis/" + id, doc); toast("Dashboard salvo."); location.hash = "#/dash/" + id; ctx.rota();
  }, f => {
    const pinta = () => { $("#wLista").innerHTML = D.widgets.map(linhaW).join(""); $("#lCsv").hidden = f.fonte.value !== "csv";
      $$("[data-w]", f).forEach(c => { const w = D.widgets[c.dataset.w]; $$("[data-k]", c).forEach(i => i.addEventListener("input", () => { const k = i.dataset.k; if (k === "moeda") w.moeda = i.checked; else if (k === "periodo") w.periodo = i.checked ? "mes" : "dia"; else w[k] = i.value; if (k === "tipo") pinta(); })); });
      $$("[data-rmw]", f).forEach(b => b.onclick = () => { D.widgets.splice(+b.dataset.rmw, 1); pinta(); }); };
    pinta(); f.fonte.onchange = pinta;
    $("#wAdd").onclick = () => { D.widgets.push({ id: uid(5), tipo: "kpi", rotulo: "Novo indicador", agg: "contar" }); pinta(); };
    $("#wSug").onclick = () => { D.widgets = sugerir(f.fonte.value); pinta(); };
  });
}
