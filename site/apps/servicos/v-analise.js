/* Análise das landing pages (visitas, visitantes, cliques, WhatsApp, leads, origens, aparelhos, rolagem) e os gráficos usados também nos dashboards. */
import { S, db, $, $$, topo, vazio, paginasDoCliente, eventosDe, DIA } from "./nucleo.js";
import { esc } from "./srv.js";

export const views = {};
const nf = n => (+n || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const diaISO = t => new Date(t - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const rotDia = d => d.slice(8, 10) + "/" + d.slice(5, 7);

/* barras verticais de uma série (dia → valor), com dica ao passar o mouse e tabela para quem não vê o gráfico */
export function grafBarras(pontos, { rotulo = "", fmt = nf } = {}) {
  const W = 720, H = 220, pl = 36, pb = 24, pt = 8, n = Math.max(1, pontos.length), max = Math.max(1, ...pontos.map(p => p.v));
  const passo = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000].find(s => max / s <= 4) || Math.ceil(max / 4);
  const topoV = Math.ceil(max / passo) * passo, y = v => pt + (H - pt - pb) * (1 - v / topoV), bw = (W - pl) / n, gap = Math.min(2, bw * .2);
  let g = "";
  for (let v = 0; v <= topoV; v += passo) g += `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)" stroke-width="1"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${fmt(v)}</text>`;
  const cada = Math.ceil(n / 8);
  pontos.forEach((p, i) => {
    const x = pl + i * bw + gap / 2, w = Math.max(1, bw - gap), h = Math.max(0, y(0) - y(p.v)), r = Math.min(4, w / 2, h);
    const d = h > 0 ? `M${x},${y(0)} V${y(p.v) + r} q0,-${r} ${r},-${r} H${x + w - r} q${r},0 ${r},${r} V${y(0)} Z` : "";
    g += `<g data-i="${i}"><rect x="${pl + i * bw}" y="${pt}" width="${bw}" height="${H - pt - pb}" fill="transparent"/>${d ? `<path d="${d}" fill="var(--bar)"/>` : ""}</g>`;
    if (i % cada === 0) g += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(p.r)}</text>`;
  });
  const id = "g" + Math.random().toString(36).slice(2, 8);
  setTimeout(() => {
    const el = document.getElementById(id); if (!el) return; const tip = $(".tip", el), svg = $("svg", el);
    svg.addEventListener("mousemove", e => { const gEl = e.target.closest("g[data-i]"); if (!gEl) { tip.hidden = true; return; } const p = pontos[+gEl.dataset.i], b = el.getBoundingClientRect(); tip.hidden = false; tip.textContent = `${p.r}: ${fmt(p.v)}${rotulo ? " " + rotulo : ""}`; tip.style.left = (e.clientX - b.left) + "px"; tip.style.top = (e.clientY - b.top) + "px"; });
    svg.addEventListener("mouseleave", () => tip.hidden = true);
  });
  return `<div class="graf" id="${id}"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(rotulo)} por período">${g}</svg><div class="tip" hidden></div>
    <details><summary class="muted" style="font-size:12.5px;cursor:pointer">Ver em tabela</summary><div class="rolar"><table class="tabela"><tbody>${pontos.map(p => `<tr><td>${esc(p.r)}</td><td class="num">${fmt(p.v)}</td></tr>`).join("")}</tbody></table></div></details></div>`;
}
/* ranking em barras horizontais (mesma cor, valor ao lado) */
export function grafRanking(itens, fmt = nf) {
  if (!itens.length) return `<p class="muted">Sem dados no período.</p>`;
  const max = Math.max(1, ...itens.map(i => i.v));
  return `<div class="barras-h">${itens.map(i => `<div><span class="t"><span title="${esc(i.r)}">${esc(i.r)}</span><i style="width:${i.v / max * 100}%"></i></span><b class="num">${fmt(i.v)}</b></div>`).join("")}</div>`;
}
export function porDia(lista, dias, campoT = "t", valor = () => 1) {
  const fim = Date.now(), m = new Map();
  for (let i = dias - 1; i >= 0; i--) m.set(diaISO(fim - i * DIA), 0);
  for (const x of lista) { const d = typeof x[campoT] === "number" ? diaISO(x[campoT]) : String(x[campoT]).slice(0, 10); if (m.has(d)) m.set(d, m.get(d) + valor(x)); }
  return [...m].map(([d, v]) => ({ r: rotDia(d), v }));
}
const conta = (lista, chave, top = 6) => { const m = new Map(); lista.forEach(x => { const k = chave(x); if (k) m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((a, b) => b[1] - a[1]).slice(0, top).map(([r, v]) => ({ r, v })); };

views.analise = async (M, slugSel, per) => {
  const pg = await paginasDoCliente(), dias = +(per || 30), slug = slugSel && slugSel !== "todas" ? slugSel : "todas";
  M.innerHTML = topo("Análise", pg.length ? `<select class="in-txt" id="aPg" style="width:auto"><option value="todas">Todas as páginas</option>${pg.map(p => `<option value="${esc(p.id)}" ${p.id === slug ? "selected" : ""}>${esc(p.titulo || p.id)}</option>`).join("")}</select>
    <div class="seg" role="group" aria-label="Período">${[7, 30, 90].map(d => `<button type="button" data-per="${d}" aria-pressed="${d === dias}">${d} dias</button>`).join("")}</div>` : "");
  if (!pg.length) { M.insertAdjacentHTML("beforeend", `<section class="card">${vazio("Crie e publique uma página para ver as visitas aqui.")}</section>`); return; }
  const ir = (s, d) => location.hash = `#/analise/${s}/${d}`;
  $("#aPg").onchange = e => ir(e.target.value, dias); $$("[data-per]").forEach(b => b.onclick = () => ir(slug, b.dataset.per));
  const A = await agregar(slug === "todas" ? pg.map(p => p.id) : [slug], dias);
  const vis = { length: A.visitas }, uni = A.unicos, leads = { length: A.leads }, wa = { length: A.whatsapp }, cli = { length: A.cliques };
  const conv = uni ? leads.length / uni * 100 : 0;
  const rol = [25, 50, 75, 100].map(n => ({ r: `Chegou a ${n}% da página`, v: A.rolagem[n] || 0 }));
  const top = (m, n = 6) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([r, v]) => ({ r, v }));
  M.insertAdjacentHTML("beforeend", `<div class="kpis">
      <div class="kpi"><b class="num">${nf(vis.length)}</b><span>visitas</span></div>
      <div class="kpi"><b class="num">${nf(uni)}</b><span>visitantes únicos${A.resumido ? " (somados por dia)" : ""}</span></div>
      <div class="kpi"><b class="num">${nf(leads.length)}</b><span>leads (formulários enviados)</span></div>
      <div class="kpi"><b class="num">${conv.toFixed(1).replace(".", ",")}%</b><span>conversão (leads ÷ visitantes)</span></div>
      <div class="kpi"><b class="num">${nf(wa.length)}</b><span>cliques no WhatsApp</span></div>
      <div class="kpi"><b class="num">${nf(cli.length)}</b><span>outros cliques em botões e links</span></div></div>
    <section class="card"><div class="card-h"><h3>Visitas por dia</h3><span class="muted">últimos ${dias} dias</span></div>${grafBarras(A.porDia.map(d => ({ r: d.r, v: d.visitas })), { rotulo: "visitas" })}</section>
    <section class="card"><div class="card-h"><h3>Leads por dia</h3><span class="muted">últimos ${dias} dias</span></div>${grafBarras(A.porDia.map(d => ({ r: d.r, v: d.leads })), { rotulo: "leads" })}</section>
    <div class="grid2">
      <section class="card"><h3>De onde vieram</h3>${grafRanking(top(A.origens))}<p class="muted" style="font-size:12.5px">Use links com <code>?utm_source=instagram</code> nos anúncios e na bio para separar cada origem.</p></section>
      <section class="card"><h3>Aparelhos</h3>${grafRanking(top(A.disp))}</section>
      <section class="card"><h3>Botões mais clicados</h3>${grafRanking(top(A.alvos, 8))}</section>
      <section class="card"><h3>Até onde leram</h3>${grafRanking(rol)}<p class="muted" style="font-size:12.5px">Visitantes únicos que rolaram a página até cada ponto. Se poucos chegam ao formulário, suba a chamada principal.</p></section>
    </div>`);
};

/* junta os números do período: usa os resumos diários (gerados pelo servidor) quando existem e os eventos crus só do que falta */
async function agregar(slugs, dias) {
  const fim = Date.now(), ini = fim - dias * DIA, hojeIni = new Date(new Date().toDateString()).getTime(), A = { visitas: 0, unicos: 0, leads: 0, whatsapp: 0, cliques: 0, origens: {}, disp: {}, alvos: {}, rolagem: { 25: 0, 50: 0, 75: 0, 100: 0 }, resumido: false };
  const dmap = new Map(); for (let i = dias - 1; i >= 0; i--) dmap.set(diaISO(fim - i * DIA), { visitas: 0, leads: 0 });
  const soma = (m, k, n = 1) => { k = k || "(vazio)"; m[k] = (m[k] || 0) + n; };
  for (const sl of slugs) {
    const rs = await db.list(`lp_paginas/${sl}/resumos`, { where: [["dia", ">=", diaISO(ini)]] }).catch(() => []);
    let desde = ini;
    if (rs.length) { A.resumido = true; desde = hojeIni;
      for (const r of rs) { if (r.dia >= diaISO(hojeIni)) continue; A.visitas += r.visitas || 0; A.unicos += r.unicos || 0; A.leads += r.leads || 0; A.whatsapp += r.whatsapp || 0; A.cliques += r.cliques || 0;
        for (const [k, v] of Object.entries(r.origens || {})) soma(A.origens, k, v); for (const [k, v] of Object.entries(r.disp || {})) soma(A.disp, k, v); for (const [k, v] of Object.entries(r.alvos || {})) soma(A.alvos, k, v);
        [25, 50, 75, 100].forEach(n => A.rolagem[n] += (r.rolagem || {})[n] || 0); const d = dmap.get(r.dia); if (d) { d.visitas += r.visitas || 0; d.leads += r.leads || 0; } } }
    const ev = await eventosDe([sl], desde), vids = new Set(), rol = { 25: new Set(), 50: new Set(), 75: new Set(), 100: new Set() };
    for (const e of ev) { const d = dmap.get(diaISO(e.t));
      if (e.tipo === "visita") { A.visitas++; vids.add(e.vid); soma(A.origens, (e.utm || "").split("|")[0] || e.ref || "Direto ou desconhecido"); soma(A.disp, e.disp || "desconhecido"); if (d) d.visitas++; }
      else if (e.tipo === "lead") { A.leads++; if (d) d.leads++; } else if (e.tipo === "whatsapp") { A.whatsapp++; soma(A.alvos, "WhatsApp: " + (e.alvo || "botão")); } else if (e.tipo === "clique") { A.cliques++; soma(A.alvos, e.alvo); }
      else if (e.tipo === "rolagem") [25, 50, 75, 100].forEach(n => { if (e.prof >= n) rol[n].add(e.vid); }); }
    A.unicos += vids.size; [25, 50, 75, 100].forEach(n => A.rolagem[n] += rol[n].size);
  }
  A.porDia = [...dmap].map(([d, v]) => ({ r: rotDia(d), ...v }));
  return A;
}
