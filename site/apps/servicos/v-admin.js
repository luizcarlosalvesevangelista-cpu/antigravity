/* Gestão Upe: clientes e atribuição de planos (criação + mensalidade), cobranças, catálogo de planos, interessados, domínios, páginas e configurações. */
import { db, S, $, $$, toast, dialogo, botoesDlg, pill, vazio, topo, fmtData, fmtDH, mesNome, statusMensal, carregarCliente, ctx } from "./nucleo.js";
import { FRENTES, PLANOS_PADRAO, SITES, esc, brl, hoje, slugify, uid } from "./srv.js";
import { stCob, thread, ligarThreads } from "./v-conta.js";
import { DNS_PADRAO } from "./v-paginas.js";

export const views = {};
const planos = async () => (await db.list("srv_planos")).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
const recarregaClientes = async () => { S.clientes = (await db.list("srv_clientes")).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")); };
const abrirCliente = async cid => { S.cid = cid; sessionStorage.setItem("srv-cid", cid); await carregarCliente(); location.hash = "#/inicio"; };
const refAtual = () => hoje().slice(0, 7);

/* ---------- clientes ---------- */
views["adm/clientes"] = async M => {
  await recarregaClientes();
  const cobs = await db.group("cobrancas");
  const atraso = cid => cobs.filter(c => c._path.startsWith(`srv_clientes/${cid}/`) && c.status === "aberta" && c.venc < hoje()).length;
  const mrr = S.clientes.filter(c => ["ativo", "atrasado"].includes(c.plano?.mensal?.status)).reduce((s, c) => s + (+c.plano.mensal.valor || 0), 0);
  M.innerHTML = topo("Clientes e planos", `<button class="btn azul" type="button" id="novoCli">+ Novo cliente</button>`) +
    `<div class="kpis"><div class="kpi"><b class="num">${S.clientes.length}</b><span>clientes</span></div><div class="kpi"><b class="num">${brl(mrr)}</b><span>mensalidades ativas por mês</span></div>
      <div class="kpi"><b class="num">${S.clientes.filter(c => c.plano?.mensal?.status === "teste").length}</b><span>em teste</span></div><div class="kpi"><b class="num">${S.clientes.filter(c => atraso(c.id)).length}</b><span>com cobrança vencida</span></div></div>
    <section class="card">${S.clientes.length ? `<div class="rolar"><table class="tabela"><thead><tr><th>Cliente</th><th>Serviços</th><th>Criação</th><th>Mensalidade</th><th>Situação</th><th></th></tr></thead><tbody>
      ${S.clientes.map(c => { const cr = c.plano?.criacao || {}, m = c.plano?.mensal || {}, at = atraso(c.id); return `<tr><td><b>${esc(c.nome)}</b><br><span class="muted">${esc((c.emails || []).join(", "))}</span></td>
        <td>${(c.frentes || []).map(f => pill("info", FRENTES[f] || f)).join(" ")}</td><td>${cr.nome ? `${esc(cr.nome)}<br><span class="muted">${brl(cr.valor)} · ${cr.status === "pago" ? "pago" : "a receber"}</span>` : "—"}</td>
        <td>${m.nome ? `${esc(m.nome)}<br><span class="muted">${brl(m.valor)}/mês · dia ${esc(m.dia || 10)}</span>` : "—"}</td><td>${statusMensal(m.status)} ${at ? pill("crit", at + " vencida" + (at > 1 ? "s" : "")) : ""}</td>
        <td><div class="linha"><button class="btn sm azul" type="button" data-abrir="${esc(c.id)}">Abrir painel</button><button class="btn sm" type="button" data-editar="${esc(c.id)}">Editar</button></div></td></tr>`; }).join("")}</tbody></table></div>` : vazio("Nenhum cliente ainda. Cadastre o primeiro ou converta um interessado.")}</section>`;
  $("#novoCli").onclick = () => editarCliente(null);
  $$("[data-abrir]").forEach(b => b.onclick = () => abrirCliente(b.dataset.abrir));
  $$("[data-editar]").forEach(b => b.onclick = () => editarCliente(S.clientes.find(c => c.id === b.dataset.editar)));
};
export async function editarCliente(c, pre = {}) {
  const ps = await planos(), cr = c?.plano?.criacao || {}, m = c?.plano?.mensal || {};
  const opt = (tipo, sel) => `<option value="">— nenhum —</option>${ps.filter(p => p.tipo === tipo && p.ativo !== false).map(p => `<option value="${esc(p.id)}" data-valor="${p.valor}" ${sel === p.id ? "selected" : ""}>${esc(FRENTES[p.frente] || p.frente)} · ${esc(p.nome)} · ${brl(p.valor)}${tipo === "mensal" ? "/mês" : ""}</option>`).join("")}`;
  dialogo(`<h3>${c ? "Editar cliente" : "Novo cliente"}</h3>
    <label class="f">Nome do cliente ou empresa<input name="nome" required value="${esc(c?.nome || pre.nome || "")}"></label>
    <label class="f">E-mails com acesso ao painel (um por linha)<textarea name="emails" rows="2" required>${esc((c?.emails || (pre.email ? [pre.email] : [])).join("\n"))}</textarea></label>
    <div class="grid2"><label class="f">WhatsApp<input name="whatsapp" value="${esc(c?.whatsapp || pre.whatsapp || "")}"></label><label class="f">CPF ou CNPJ<input name="doc" value="${esc(c?.doc || "")}"></label></div>
    <fieldset style="border:1px solid var(--line);border-radius:10px;padding:10px 12px"><legend class="eyebrow">Serviços contratados</legend><div class="linha">${Object.entries(FRENTES).map(([k, t]) => `<label class="chk"><input type="checkbox" name="frentes" value="${k}" ${(c?.frentes || (pre.frente ? [pre.frente] : [])).includes(k) ? "checked" : ""}> ${t}</label>`).join("")}</div></fieldset>
    <fieldset style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:grid;gap:10px"><legend class="eyebrow">Plano de criação</legend>
      <label class="f">Plano<select name="crId">${opt("criacao", cr.id)}</select></label>
      <div class="grid3"><label class="f">Valor (R$)<input name="crValor" type="number" step="0.01" min="0" value="${cr.valor ?? ""}"></label><label class="f">Parcelas<input name="crParc" type="number" min="1" max="12" value="${cr.parcelas || 1}"></label><label class="f">Pagamento<select name="crStatus"><option value="pendente">Pendente</option><option value="pago" ${cr.status === "pago" ? "selected" : ""}>Pago</option></select></label></div>
      <label class="f">Entrega prevista<input name="crPrazo" type="date" value="${esc(cr.prazo || "")}"></label></fieldset>
    <fieldset style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:grid;gap:10px"><legend class="eyebrow">Mensalidade</legend>
      <label class="f">Plano<select name="mId">${opt("mensal", m.id)}</select></label>
      <div class="grid3"><label class="f">Valor por mês (R$)<input name="mValor" type="number" step="0.01" min="0" value="${m.valor ?? ""}"></label><label class="f">Dia do vencimento<input name="mDia" type="number" min="1" max="28" value="${m.dia || 10}"></label>
        <label class="f">Situação<select name="mStatus">${[["teste", "Em teste"], ["ativo", "Ativa (em dia)"], ["atrasado", "Em atraso"], ["suspenso", "Suspensa"], ["cancelado", "Cancelada"]].map(([k, t]) => `<option value="${k}" ${(m.status || "teste") === k ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
      <label class="f">Fim do teste grátis<input name="mFim" type="date" value="${esc(m.fimTeste || "")}"></label></fieldset>
    <label class="f">Observações internas<textarea name="obs" rows="2">${esc(c?.obs || "")}</textarea></label>
    <div class="linha" style="justify-content:space-between">${c ? `<span class="linha"><button class="btn" value="cobranca" formnovalidate>Gerar cobrança</button><button class="btn ${c.paginasSuspensas ? "" : "perigo"}" value="suspender" formnovalidate>${c.paginasSuspensas ? "Reativar páginas" : "Suspender páginas"}</button></span>` : "<span></span>"}<span class="linha"><button class="btn" value="cancelar" formnovalidate>Cancelar</button><button class="btn azul" value="ok">Salvar</button></span></div>`, async (fd, f, b) => {
    if (b?.value === "cobranca") { novaCobranca(c); return; }
    if (b?.value === "suspender") { await suspender(c, !c.paginasSuspensas); return; }
    const emails = String(fd.get("emails")).split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(e => /.+@.+\..+/.test(e));
    if (!emails.length) { toast("Informe ao menos um e-mail válido."); return false; }
    const pl = id => ps.find(p => p.id === id);
    const cid = c?.id || slugify(fd.get("nome")).slice(0, 30) + "-" + uid(4);
    const doc = { nome: String(fd.get("nome")).trim(), emails, whatsapp: String(fd.get("whatsapp")).trim(), doc: String(fd.get("doc")).trim(), frentes: fd.getAll("frentes"), obs: String(fd.get("obs")),
      plano: { criacao: fd.get("crId") ? { id: fd.get("crId"), nome: pl(fd.get("crId"))?.nome || "", valor: +fd.get("crValor") || 0, parcelas: +fd.get("crParc") || 1, status: fd.get("crStatus"), prazo: fd.get("crPrazo") || "" } : null,
        mensal: fd.get("mId") ? { id: fd.get("mId"), nome: pl(fd.get("mId"))?.nome || "", valor: +fd.get("mValor") || 0, dia: +fd.get("mDia") || 10, status: fd.get("mStatus"), fimTeste: fd.get("mFim") || "" } : null },
      paginasSuspensas: !!c?.paginasSuspensas, criadoEm: c?.criadoEm || Date.now(), atualizadoEm: Date.now() };
    await db.set("srv_clientes/" + cid, doc);
    const antigos = (c?.emails || []).filter(e => !emails.includes(e));
    await db.batch([...emails.map(e => ({ set: ["srv_convites/" + e, { cid, criadoEm: Date.now() }] })), ...antigos.map(e => ({ del: "srv_convites/" + e }))]);
    if (!c && doc.plano.criacao?.valor > 0) await db.set(`srv_clientes/${cid}/cobrancas/criacao`, { tipo: "criacao", descricao: "Criação: " + doc.plano.criacao.nome, valor: doc.plano.criacao.valor, venc: hoje(), status: doc.plano.criacao.status === "pago" ? "paga" : "aberta", criadoEm: Date.now() });
    if (pre.interessado) await db.set("srv_interessados/" + pre.interessado, { status: "cliente" }, { merge: true });
    toast(c ? "Cliente atualizado." : `Cliente cadastrado. Peça para ${emails[0]} entrar em ${SITES.servicos.replace("https://", "")} com “Primeiro acesso”.`);
    await recarregaClientes(); if (S.cid === cid) await carregarCliente(); ctx.rota();
  }, f => {
    const auto = (sel, inp) => f[sel].addEventListener("change", () => { const o = f[sel].selectedOptions[0]; if (o?.dataset.valor) f[inp].value = o.dataset.valor; });
    auto("crId", "crValor"); auto("mId", "mValor");
  });
}
async function suspender(c, sim) {
  if (!confirm(sim ? `Suspender as páginas de ${c.nome}? Elas saem do ar até você reativar.` : `Reativar as páginas de ${c.nome}?`)) return false;
  const pgs = await db.list("lp_paginas", { where: [["cid", "==", c.id]] });
  for (const p of pgs) await db.set("lp_paginas/" + p.id, { suspensa: sim }, { merge: true });
  await db.set("srv_clientes/" + c.id, { paginasSuspensas: sim, plano: { ...c.plano, mensal: c.plano?.mensal ? { ...c.plano.mensal, status: sim ? "suspenso" : "ativo" } : null } }, { merge: true });
  toast(sim ? "Páginas suspensas." : "Páginas reativadas."); await recarregaClientes(); ctx.rota();
}
function novaCobranca(c) {
  setTimeout(() => dialogo(`<h3>Nova cobrança · ${esc(c.nome)}</h3><label class="f">Descrição<input name="descricao" required value="Criação: ${esc(c.plano?.criacao?.nome || "")}"></label>
    <div class="grid2"><label class="f">Valor (R$)<input name="valor" type="number" step="0.01" min="0" required value="${c.plano?.criacao?.valor || ""}"></label><label class="f">Vencimento<input name="venc" type="date" required value="${hoje()}"></label></div>${botoesDlg("Gerar")}`, async fd => {
    await db.add(`srv_clientes/${c.id}/cobrancas`, { tipo: "avulsa", descricao: String(fd.get("descricao")).trim(), valor: +fd.get("valor"), venc: fd.get("venc"), status: "aberta", criadoEm: Date.now() }); toast("Cobrança gerada."); ctx.rota(); }), 50);
}

/* ---------- cobranças ---------- */
views["adm/cobrancas"] = async (M, filtro = "abertas") => {
  await recarregaClientes();
  const nome = p => S.clientes.find(c => p.startsWith(`srv_clientes/${c.id}/`))?.nome || "—", cidDe = p => p.split("/")[1];
  let cobs = (await db.group("cobrancas")).sort((a, b) => (b.venc || "").localeCompare(a.venc || ""));
  const total = s => cobs.filter(s).reduce((a, c) => a + (+c.valor || 0), 0);
  const F = { abertas: c => ["aberta", "informada"].includes(c.status), vencidas: c => c.status === "aberta" && c.venc < hoje(), informadas: c => c.status === "informada", pagas: c => c.status === "paga", todas: () => true };
  const ref = refAtual();
  M.innerHTML = topo("Cobranças", `<button class="btn azul" type="button" id="gerarMes">Gerar mensalidades de ${esc(mesNome(ref))}</button>`) +
    `<div class="kpis"><div class="kpi"><b class="num">${brl(total(F.abertas))}</b><span>a receber</span></div><div class="kpi"><b class="num">${brl(total(F.vencidas))}</b><span>vencido</span></div>
      <div class="kpi"><b class="num">${cobs.filter(F.informadas).length}</b><span>pagamentos informados para conferir</span></div><div class="kpi"><b class="num">${brl(total(c => c.status === "paga" && (c.pagoEm ? new Date(c.pagoEm).toISOString().slice(0, 7) === ref : false)))}</b><span>recebido neste mês</span></div></div>
    <div class="abas">${Object.keys(F).map(k => `<button type="button" aria-selected="${k === filtro}" data-ir="#/adm/cobrancas/${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join("")}</div>
    <section class="card">${cobs.filter(F[filtro] || F.abertas).length ? `<div class="rolar"><table class="tabela"><thead><tr><th>Cliente</th><th>Descrição</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th></th></tr></thead><tbody>
      ${cobs.filter(F[filtro] || F.abertas).map(c => `<tr><td><b>${esc(nome(c._path))}</b></td><td>${esc(c.descricao || "")}${c.obsCliente ? `<br><span class="muted">“${esc(c.obsCliente)}”</span>` : ""}</td><td class="num">${fmtData(c.venc)}</td><td class="num">${brl(c.valor)}</td><td>${stCob(c)}</td>
        <td><div class="linha">${c.status !== "paga" && c.status !== "cancelada" ? `<button class="btn sm azul" type="button" data-paga="${esc(c._path)}">Marcar paga</button><button class="btn sm" type="button" data-canc="${esc(c._path)}">Cancelar</button>` : ""}
        ${c.status === "aberta" && c.venc < hoje() ? `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${esc(String(S.clientes.find(x => x.id === cidDe(c._path))?.whatsapp || "").replace(/\D/g, "").replace(/^(?!55)/, "55"))}?text=${encodeURIComponent(`Olá! A cobrança “${c.descricao}” de ${brl(c.valor)} venceu em ${fmtData(c.venc)}. Pode pagar pelo painel: ${SITES.servicos}`)}">Lembrar</a>` : ""}</div></td></tr>`).join("")}</tbody></table></div>` : vazio("Nada por aqui.")}</section>
    <section class="card"><h3>Atrasos</h3><p class="muted">Clientes com mensalidade vencida há mais de 10 dias podem ter as páginas suspensas (elas saem do ar até o pagamento).</p>
      ${(() => { const lim = new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10), ids = [...new Set(cobs.filter(c => c.status === "aberta" && c.venc < lim).map(c => cidDe(c._path)))].filter(id => !S.clientes.find(c => c.id === id)?.paginasSuspensas);
        return ids.length ? ids.map(id => `<div class="linha"><b>${esc(S.clientes.find(c => c.id === id)?.nome || id)}</b><button class="btn sm perigo" type="button" data-susp="${esc(id)}">Suspender páginas</button></div>`).join("") : `<p class="muted">Ninguém com atraso acima de 10 dias.</p>`; })()}</section>`;
  $$("[data-paga]").forEach(b => b.onclick = async () => { await db.set(b.dataset.paga, { status: "paga", pagoEm: Date.now() }, { merge: true });
    const c = S.clientes.find(x => x.id === cidDe(b.dataset.paga)); if (c?.plano?.mensal?.status === "atrasado") await db.set("srv_clientes/" + c.id, { plano: { ...c.plano, mensal: { ...c.plano.mensal, status: "ativo" } } }, { merge: true });
    toast("Cobrança paga."); ctx.rota(); });
  $$("[data-canc]").forEach(b => b.onclick = async () => { if (!confirm("Cancelar esta cobrança?")) return; await db.set(b.dataset.canc, { status: "cancelada" }, { merge: true }); toast("Cancelada."); ctx.rota(); });
  $$("[data-susp]").forEach(b => b.onclick = () => suspender(S.clientes.find(c => c.id === b.dataset.susp), true));
  $("#gerarMes").onclick = async () => {
    const alvo = S.clientes.filter(c => ["ativo", "atrasado"].includes(c.plano?.mensal?.status) && c.plano.mensal.valor > 0); let n = 0;
    for (const c of alvo) { const p = `srv_clientes/${c.id}/cobrancas/m-${ref}`; if (await db.get(p)) continue;
      await db.set(p, { tipo: "mensalidade", ref, descricao: `${c.plano.mensal.nome} · ${mesNome(ref)}`, valor: c.plano.mensal.valor, venc: `${ref}-${String(c.plano.mensal.dia || 10).padStart(2, "0")}`, status: "aberta", criadoEm: Date.now() }); n++; }
    for (const c of S.clientes) { const venc = cobs.some(x => x._path.startsWith(`srv_clientes/${c.id}/`) && x.status === "aberta" && x.venc < hoje()); if (venc && c.plano?.mensal?.status === "ativo") await db.set("srv_clientes/" + c.id, { plano: { ...c.plano, mensal: { ...c.plano.mensal, status: "atrasado" } } }, { merge: true }); }
    toast(n ? `${n} mensalidade${n > 1 ? "s" : ""} gerada${n > 1 ? "s" : ""}.` : "As mensalidades deste mês já estavam geradas."); ctx.rota(); };
};

/* ---------- catálogo de planos ---------- */
views["adm/planos"] = async M => {
  const ps = await planos();
  M.innerHTML = topo("Catálogo de planos", `<button class="btn azul" type="button" id="novoPl">+ Plano</button>`) +
    `<p class="muted">Estes planos aparecem nas páginas de vendas e na hora de cadastrar um cliente. Valores iniciais são exemplos: ajuste aos seus preços.</p>` +
    Object.entries(FRENTES).map(([f, t]) => `<section class="card"><h3>${esc(t)}</h3><div class="rolar"><table class="tabela"><thead><tr><th>Plano</th><th>Tipo</th><th>Valor</th><th>Na página de vendas</th><th></th></tr></thead><tbody>
      ${ps.filter(p => p.frente === f).map(p => `<tr><td><b>${esc(p.nome)}</b><br><span class="muted">${esc(p.descricao || "")}</span></td><td>${p.tipo === "mensal" ? "Mensalidade" : "Criação"}</td><td class="num">${brl(p.valor)}${p.tipo === "mensal" ? "/mês" : ""}</td><td>${p.ativo !== false ? pill("ok", "Aparece") : pill("", "Oculto")}</td><td><button class="btn sm" type="button" data-pl="${esc(p.id)}">Editar</button></td></tr>`).join("")}</tbody></table></div></section>`).join("");
  const ed = p => dialogo(`<h3>${p ? "Editar plano" : "Novo plano"}</h3>
    <div class="grid2"><label class="f">Serviço<select name="frente">${Object.entries(FRENTES).map(([k, t]) => `<option value="${k}" ${p?.frente === k ? "selected" : ""}>${t}</option>`).join("")}</select></label><label class="f">Tipo<select name="tipo"><option value="criacao">Criação (uma vez)</option><option value="mensal" ${p?.tipo === "mensal" ? "selected" : ""}>Mensalidade</option></select></label></div>
    <label class="f">Nome<input name="nome" required value="${esc(p?.nome || "")}"></label><label class="f">Valor (R$)<input name="valor" type="number" step="0.01" min="0" required value="${p?.valor ?? ""}"></label>
    <label class="f">Descrição curta<input name="descricao" value="${esc(p?.descricao || "")}"></label><label class="f">O que inclui (um item por linha)<textarea name="itens" rows="4">${esc((p?.itens || []).join("\n"))}</textarea></label>
    <div class="grid2"><label class="f">Ordem<input name="ordem" type="number" value="${p?.ordem ?? ps.length + 1}"></label><label class="chk" style="align-self:end"><input type="checkbox" name="ativo" ${p?.ativo !== false ? "checked" : ""}> Mostrar na página de vendas</label></div>${botoesDlg()}`, async fd => {
    const id = p?.id || slugify(fd.get("frente") + "-" + fd.get("nome"));
    await db.set("srv_planos/" + id, { frente: fd.get("frente"), tipo: fd.get("tipo"), nome: String(fd.get("nome")).trim(), valor: +fd.get("valor"), descricao: String(fd.get("descricao")).trim(), itens: String(fd.get("itens")).split("\n").map(s => s.trim()).filter(Boolean), ordem: +fd.get("ordem") || 0, ativo: !!fd.get("ativo") });
    toast("Plano salvo."); ctx.rota(); });
  $("#novoPl").onclick = () => ed(null); $$("[data-pl]").forEach(b => b.onclick = () => ed(ps.find(p => p.id === b.dataset.pl)));
};

/* ---------- interessados ---------- */
views["adm/interessados"] = async M => {
  const ls = (await db.list("srv_interessados")).sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  const ST = { novo: "Novo", contato: "Em contato", proposta: "Proposta enviada", cliente: "Virou cliente", perdido: "Perdido" };
  M.innerHTML = topo("Interessados") + `<p class="muted">Quem preencheu o formulário das páginas de vendas de Landing pages e de Agenda e dashboards.</p><section class="card">${ls.length ? `<div class="rolar"><table class="tabela"><thead><tr><th>Quando</th><th>Nome</th><th>Interesse</th><th>Mensagem</th><th>Situação</th><th></th></tr></thead><tbody>
    ${ls.map(x => `<tr><td class="num">${fmtDH(x.criadoEm)}</td><td><b>${esc(x.nome)}</b><br><span class="muted">${esc(x.whatsapp || "")} ${esc(x.email || "")}</span></td><td>${esc(FRENTES[x.frente] || x.frente || "")}${x.plano ? `<br><span class="muted">${esc(x.plano)}</span>` : ""}</td><td>${esc(x.mensagem || "")}</td>
      <td><select class="in-txt" data-st="${esc(x.id)}" style="width:auto;padding:5px 8px">${Object.entries(ST).map(([k, t]) => `<option value="${k}" ${x.status === k ? "selected" : ""}>${t}</option>`).join("")}</select></td>
      <td><div class="linha">${x.whatsapp ? `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${esc(String(x.whatsapp).replace(/\D/g, "").replace(/^(?!55)/, "55"))}?text=${encodeURIComponent("Olá, " + String(x.nome).split(" ")[0] + "! Aqui é da Upe Criativo. Vi o seu interesse em " + (FRENTES[x.frente] || "nossos serviços") + ".")}">WhatsApp</a>` : ""}
        ${x.status !== "cliente" ? `<button class="btn sm azul" type="button" data-conv="${esc(x.id)}">Virar cliente</button>` : ""}</div></td></tr>`).join("")}</tbody></table></div>` : vazio("Ninguém ainda. Os formulários das páginas de vendas chegam aqui.")}</section>`;
  $$("[data-st]").forEach(s => s.onchange = async () => { await db.set("srv_interessados/" + s.dataset.st, { status: s.value }, { merge: true }); toast("Atualizado."); });
  $$("[data-conv]").forEach(b => b.onclick = () => { const x = ls.find(y => y.id === b.dataset.conv); editarCliente(null, { nome: x.nome, email: x.email, whatsapp: x.whatsapp, frente: x.frente, interessado: x.id }); });
};

/* ---------- domínios ---------- */
views["adm/dominios"] = async M => {
  const ds = (await db.list("lp_dominios")).sort((a, b) => (a.status === "ativo") - (b.status === "ativo"));
  M.innerHTML = topo("Domínios") + `<section class="card"><h3>Como conectar</h3><ol style="margin:0;padding-left:20px;display:grid;gap:6px">
      <li>Abra o <a href="https://console.firebase.google.com/project/upecriativo-cc472/hosting/sites/upe-criativo-lp" target="_blank" rel="noopener">Hosting do site upe-criativo-lp</a> › <b>Adicionar domínio personalizado</b> e digite o domínio do pedido.</li>
      <li>Copie os registros que o Firebase mostrar e cole no pedido abaixo (“Enviar DNS ao cliente”).</li>
      <li>Quando o Firebase mostrar <b>Conectado</b>, marque o pedido como ativo. A página passa a abrir no domínio.</li></ol></section>
    <section class="card">${ds.length ? `<div class="rolar"><table class="tabela"><thead><tr><th>Domínio</th><th>Cliente</th><th>Página</th><th>Situação</th><th></th></tr></thead><tbody>${ds.map(d => `<tr><td><b>${esc(d.id)}</b></td><td>${esc(d.cliente || d.cid)}</td><td>${esc(d.slug)}</td>
      <td>${d.status === "ativo" ? pill("ok", "Ativo") : d.status === "dns" ? pill("info", "DNS enviado") : pill("warn", "Pedido novo")}</td>
      <td><div class="linha"><button class="btn sm" type="button" data-dns="${esc(d.id)}">Enviar DNS ao cliente</button>${d.status !== "ativo" ? `<button class="btn sm azul" type="button" data-ativo="${esc(d.id)}">Marcar ativo</button>` : `<a class="btn sm" href="https://${esc(d.id)}" target="_blank" rel="noopener">Abrir ↗</a>`}</div></td></tr>`).join("")}</tbody></table></div>` : vazio("Nenhum pedido de domínio.")}</section>`;
  $$("[data-dns]").forEach(b => b.onclick = () => { const d = ds.find(x => x.id === b.dataset.dns); dialogo(`<h3>DNS de ${esc(d.id)}</h3><label class="f">Registros (como o Firebase mostrou)<textarea name="dns" rows="5">${esc(d.dns || DNS_PADRAO)}</textarea></label>${botoesDlg("Enviar ao cliente")}`, async fd => {
    await db.set("lp_dominios/" + d.id, { dns: String(fd.get("dns")), status: d.status === "ativo" ? "ativo" : "dns" }, { merge: true }); toast("O cliente já vê os registros no painel."); ctx.rota(); }); });
  $$("[data-ativo]").forEach(b => b.onclick = async () => { await db.set("lp_dominios/" + b.dataset.ativo, { status: "ativo", ativoEm: Date.now() }, { merge: true }); toast("Domínio ativo."); ctx.rota(); });
};

/* ---------- todas as páginas ---------- */
views["adm/paginas"] = async M => {
  await recarregaClientes();
  const ps = (await db.list("lp_paginas")).sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
  M.innerHTML = topo("Todas as páginas") + `<section class="card">${ps.length ? `<div class="rolar"><table class="tabela"><thead><tr><th>Página</th><th>Cliente</th><th>Situação</th><th>Atualizada</th><th></th></tr></thead><tbody>${ps.map(p => `<tr>
    <td><b>${esc(p.titulo || p.id)}</b><br><code class="end">${esc(p.id)}</code></td><td>${esc(S.clientes.find(c => c.id === p.cid)?.nome || p.cid)}</td><td>${p.suspensa ? pill("crit", "Suspensa") : p.publicada ? pill("ok", "No ar") : pill("warn", "Rascunho")}</td><td class="num">${fmtDH(p.atualizadoEm)}</td>
    <td><div class="linha"><button class="btn sm" type="button" data-cli="${esc(p.cid)}" data-pg="${esc(p.id)}">Editar</button>${p.publicada && !p.suspensa ? `<a class="btn sm" href="${SITES.lp}/${esc(p.id)}" target="_blank" rel="noopener">Ver ↗</a>` : ""}</div></td></tr>`).join("")}</tbody></table></div>` : vazio("Nenhuma página criada ainda.")}</section>`;
  $$("[data-pg]").forEach(b => b.onclick = async () => { S.cid = b.dataset.cli; sessionStorage.setItem("srv-cid", S.cid); await carregarCliente(); location.hash = `#/pagina/${b.dataset.pg}/editar`; });
};

/* ---------- pedidos de ajuste (todos) ---------- */
views["adm/chamados"] = async M => {
  const ls = (await db.group("chamados")).sort((a, b) => ((a.status === "resolvido") - (b.status === "resolvido")) || (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
  M.innerHTML = topo("Pedidos de ajuste") + `<section class="card">${ls.length ? ls.map(ch => thread(ch, true)).join("") : vazio("Nenhum pedido.")}</section>`;
  ligarThreads(M, ls, "", "upe");
};

/* ---------- PIX e contato ---------- */
views["adm/config"] = async M => {
  const c = S.cfg || {};
  M.innerHTML = topo("PIX e contato") + `<section class="card form" style="max-width:640px"><p class="muted">Usado para gerar o PIX copia e cola das cobranças no painel dos clientes. Fica visível para quem abre uma cobrança.</p>
    <label class="f">Chave PIX<input id="cPix" value="${esc(c.pixChave || "")}" placeholder="CNPJ, e-mail, telefone ou chave aleatória"></label>
    <div class="grid2"><label class="f">Nome do recebedor<input id="cNome" value="${esc(c.pixNome || "Upe Criativo")}" maxlength="25"></label><label class="f">Cidade<input id="cCid" value="${esc(c.pixCidade || "Sao Paulo")}" maxlength="15"></label></div>
    <label class="f">WhatsApp de atendimento<input id="cWa" value="${esc(c.whatsapp || "5511934393249")}"></label><button class="btn azul" type="button" id="cSalvar" style="justify-self:start">Salvar</button></section>`;
  $("#cSalvar").onclick = async () => { S.cfg = { pixChave: $("#cPix").value.trim(), pixNome: $("#cNome").value.trim(), pixCidade: $("#cCid").value.trim(), whatsapp: $("#cWa").value.replace(/\D/g, "") }; await db.set("srv_config/publico", S.cfg); toast("Salvo."); };
};
