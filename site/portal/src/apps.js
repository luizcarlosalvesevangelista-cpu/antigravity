/* ===== Serviços da Upe no painel central: Branding e mídias, Loja online (Upe ERP), Landing pages e sites, Agenda e dashboards (incluído dentro do app.js) =====
   Cadastro único: a ficha do cliente (clientes/{id}) liga cada frente; ao salvar, o painel cria sozinho o acesso de cada app
   (ERP: empresas/convites/gestão · Landing pages e Sistemas: srv_clientes/srv_convites, com o mesmo id do cliente).
   Preços: uma tela só (Serviços e preços), que grava direto na fonte de cada frente:
     ERP → upe/gestao/config/geral + publico/plano · Landing pages e Sistemas → srv_planos ·
     Branding, mídias e gráfica → config/publico.precos.branding.
   Adesão de cada cliente em clientes/{id}.apps[app] = { status, plano, extras[], dia, inicio, fimTeste, ajuste, obs, empresa, dominio, loja, modulos[] }.
   O Upe TV é um app separado e não faz parte deste painel.
   Pedidos do cliente: ação "pedido" com alvo "app:<app>[:<extra>]". Extras com unico:true são cobrados uma vez (criação), não todo mês. */
const APPS_PADRAO = {
  erp: { nome: "Upe ERP", curto: "Loja e pedidos", desc: "Loja online, PDV e pedidos num só painel.", painel: "https://painel.upecriativo.com.br", gestor: "https://gestao.upecriativo.com.br", site: "https://erp.upecriativo.com.br", lojas: "https://loja.upecriativo.com.br", teste: 14,
    planos: [{ k: "mensal", nome: "Plano mensal", preco: 49.99 }, { k: "upe", nome: "Cliente Upe (com branding ou mídias)", preco: 34.99 }],
    extras: [
      { k: "B", nome: "Banco de dados ampliado", desc: "Até 5.000 produtos e 2 GB de fotos.", preco: 9.9 },
      { k: "S", nome: "Servidor de integração", desc: "Até 3 integrações reais (pagamento, marketplace, ERP).", preco: 19.9 },
      { k: "F", nome: "API de frete e etiquetas", desc: "Cotação real na loja; etiquetas pagas à parte.", preco: 9.9 },
      { k: "E", nome: "Envio de e-mails", desc: "Newsletter real, até 5.000 e-mails por mês.", preco: 14.9 },
      { k: "K", nome: "Backup diário", desc: "Cópia diária guardada por 30 dias.", preco: 4.9 },
      { k: "D", nome: "Domínio próprio da loja", desc: "1 domínio com SSL; o registro é do cliente.", preco: 7.9 }] },
  landing: { nome: "Upe Landing pages", curto: "Landing pages", desc: "Páginas de venda com a marca do cliente, editor, domínio próprio e painel de visitas, cliques e leads.", painel: "https://servicos.upecriativo.com.br", site: "https://lp.upecriativo.com.br", teste: 0,
    planos: [{ k: "lp-hospedagem", nome: "Hospedagem", preco: 29.9 }, { k: "lp-hospedagem-ajustes", nome: "Hospedagem + ajustes", preco: 79.9 }],
    extras: [{ k: "lp-essencial", nome: "Criação: Landing page essencial", desc: "Até 5 seções, formulário e WhatsApp.", preco: 497, unico: true }, { k: "lp-completa", nome: "Criação: Landing page completa", desc: "Até 10 seções, copy, SEO e Pixel.", preco: 997, unico: true }] },
  sistemas: { nome: "Upe Sistemas", curto: "Agenda e dashboards", desc: "Agenda online para o cliente marcar horário e dashboards com os números do negócio.", painel: "https://servicos.upecriativo.com.br", site: "https://agenda.upecriativo.com.br", teste: 0,
    planos: [{ k: "ag-mensal", nome: "Agenda no ar", preco: 49.9 }, { k: "dash-mensal", nome: "Dashboard no ar", preco: 59.9 }],
    extras: [{ k: "ag-criacao", nome: "Criação: Agenda online", desc: "Serviços, horários e página.", preco: 697, unico: true }, { k: "dash-criacao", nome: "Criação: Dashboard sob medida", desc: "Até 8 indicadores e 3 gráficos.", preco: 1200, unico: true }] }
};
const APP_IDS = ["erp", "landing", "sistemas"];
// frentes do painel central (Branding é o próprio portal: projeto, conteúdo, artes e recompra)
const FRENTES_UPE = { branding: "Branding e mídias", erp: "Loja online (Upe ERP)", landing: "Landing pages e sites", sistemas: "Agenda e dashboards" };
const BRANDING_PADRAO = [
  { k: "branding", nome: "Branding completo", desc: "Identidade visual, manual da marca e apresentação.", preco: 0, unico: true },
  { k: "midias", nome: "Mídias digitais", desc: "Planejamento e criação de posts com aprovação no portal.", preco: 0 },
  { k: "grafica", nome: "Papelaria gráfica", desc: "Cartões, folders, embalagens e recompra pelo portal.", preco: 0, unico: true }];
const AST = { teste: ["Em teste", "info"], ativo: ["Ativo", "ok"], pendente: ["Aguardando pagamento", "warn"], pausado: ["Pausado", ""], cancelado: ["Cancelado", ""] };
const astPill = s => { const [l, c] = AST[s] || [s, ""]; return `<span class="pill ${c}">${esc(l)}</span>`; };

/* preços vivos de cada frente (leitura pública), carregados uma vez por tela */
async function carregarFontes() {
  const f = {};
  await Promise.all([
    S.list("srv_planos").then(l => { f.srv = l; }).catch(() => {}),
    S.get("publico/plano").then(d => { f.erp = d; }).catch(() => {})
  ]);
  state.fontes = f; return f;
}
const srvDe = (F, fr) => (F.srv || []).filter(p => fr.includes(p.frente) && p.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
function appsCat(pub) {
  const c = clone(APPS_PADRAO), o = (pub || {}).apps || {}, F = state.fontes || {};
  APP_IDS.forEach(k => { if (o[k]) c[k] = { ...c[k], ...o[k] }; if (/upe-erp[.-]/.test(c[k].painel || "")) c[k].painel = APPS_PADRAO[k].painel; });
  if (F.erp && +F.erp.mensal) {
    c.erp.planos = [{ k: "mensal", nome: "Plano mensal", preco: +F.erp.mensal }, { k: "upe", nome: "Cliente Upe (com branding ou mídias)", preco: +F.erp.upe || +F.erp.mensal }];
    if (Array.isArray(F.erp.extras) && F.erp.extras.length) c.erp.extras = F.erp.extras.map(x => ({ k: x.k, nome: x.nome, desc: x.desc || "", preco: +x.preco || 0 }));
    if (F.erp.teste != null) c.erp.teste = +F.erp.teste;
  }
  const mens = fr => srvDe(F, fr).filter(p => p.tipo === "mensal").map(p => ({ k: p.id, nome: p.nome, preco: +p.valor || 0, desc: p.descricao || "" }));
  const cria = fr => srvDe(F, fr).filter(p => p.tipo === "criacao").map(p => ({ k: p.id, nome: "Criação: " + String(p.nome).replace(/^Criação:\s*/i, ""), preco: +p.valor || 0, desc: p.descricao || "", unico: true }));
  if (mens(["lp"]).length) { c.landing.planos = mens(["lp"]); c.landing.extras = cria(["lp"]); }
  if (mens(["agenda", "dash"]).length) { c.sistemas.planos = mens(["agenda", "dash"]); c.sistemas.extras = cria(["agenda", "dash"]); }
  return c;
}
const precosBranding = pub => ((pub || {}).precos || {}).branding || BRANDING_PADRAO;
const ativoApp = a => !!(a && a.status && a.status !== "cancelado");
const adesoes = doc => Object.entries(doc.apps || {}).filter(([k, a]) => APP_IDS.includes(k) && ativoApp(a));
function valorAdesao(cat, app, a) {
  const c = cat[app] || { planos: [], extras: [] }, pl = c.planos.find(p => p.k === a.plano);
  return Math.round(((pl ? +pl.preco : 0) + (a.extras || []).reduce((s, k) => { const e = c.extras.find(x => x.k === k); return s + (e && !e.unico ? +e.preco || 0 : 0); }, 0) + (+a.ajuste || 0)) * 100) / 100;
}
function proxVenc(a) { const d = new Date(todayIso() + "T12:00"), dia = Math.min(28, +a.dia || 10); let v = new Date(d.getFullYear(), d.getMonth(), dia, 12); if (v < d) v = new Date(d.getFullYear(), d.getMonth() + 1, dia, 12); return isoDay(v); }
const refMes = (app, venc) => `app-${app}-${venc.slice(0, 7)}`;
const appPedidos = (doc, acoes) => acoes.filter(a => a.tipo === "pedido" && String(a.alvo || "").startsWith("app:")).map(a => { const [, app, ex] = a.alvo.split(":"); return { ...a, app, extra: ex || "", status: doc.pedidosAdm?.[a.id]?.status || "novo" }; }).sort((x, y) => y.em - x.em);
const novaCob = (o) => ({ id: uid(8), liberada: true, status: "aberta", pix: true, cartao: true, linkCartao: "", liberadaEm: Date.now(), ...o });
function cobrancaApp(cat, doc, app, a) {
  const venc = proxVenc(a), ref = refMes(app, venc);
  if ((doc.cobrancas || []).some(c => c.ref === ref)) return null;
  const c = cat[app], pl = c.planos.find(p => p.k === a.plano), ex = (a.extras || []).map(k => c.extras.find(e => e.k === k)).filter(e => e && !e.unico).map(e => e.nome);
  const cob = novaCob({ ref, app, descricao: `${c.nome} · ${pl ? pl.nome : "plano"}${ex.length ? " + " + ex.join(", ") : ""} · ${MESES[+venc.slice(5, 7) - 1]}`, valor: valorAdesao(cat, app, a), vencimento: venc });
  doc.cobrancas = [...(doc.cobrancas || []), cob]; return cob;
}
// extras de pagamento único (criação): uma cobrança por extra, só na primeira vez
function cobrancasUnicas(cat, doc, app, a) {
  const c = cat[app], out = [];
  (a.extras || []).forEach(k => { const e = c.extras.find(x => x.k === k); if (!e || !e.unico || !(+e.preco)) return; const ref = `app-${app}-unico-${k}`;
    if ((doc.cobrancas || []).some(x => x.ref === ref)) return;
    const cob = novaCob({ ref, app, descricao: `${c.nome} · ${e.nome}`, valor: +e.preco, vencimento: addDays(todayIso(), 5) }); doc.cobrancas = [...(doc.cobrancas || []), cob]; out.push(cob); });
  return out;
}
// eventos dos apps para os calendários (vencimentos e fim do teste)
function eventosApps(doc, cat, nm = "") {
  const ev = [];
  adesoes(doc).forEach(([app, a]) => { const c = cat[app]; if (!c) return;
    if (a.status === "teste" && a.fimTeste) ev.push({ id: `at:${app}`, data: a.fimTeste, titulo: `Fim do teste · ${c.nome}`, tag: c.nome, sub: nm || "Teste grátis", cls: daysTo(a.fimTeste) < 0 ? "bad" : "info", pill: astPill("teste"), app });
    if (a.status === "ativo" || a.status === "pendente") ev.push({ id: `av:${app}`, data: proxVenc(a), titulo: `Renovação · ${c.nome} · ${brl(valorAdesao(cat, app, a))}`, tag: c.nome, sub: nm || "Mensalidade do app", cls: "warn", pill: astPill(a.status), app });
  });
  return ev;
}

/* ---------- admin: menu Serviços e preços (uma aba por frente) ---------- */
async function aApps(w, app = "branding") {
  await carregarFontes();
  const cat = appsCat(state.cache.pub), clients = state.cache.clients, abas = ["branding", ...APP_IDS];
  const nav = `<nav class="subtabs">${abas.map(k => `<a class="tab" href="#/admin/apps/${k}" ${k === app ? 'aria-current="page"' : ""}>${esc(FRENTES_UPE[k])}</a>`).join("")}</nav>`;
  const topo = (t, d, botoes = "") => `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Serviços e preços</span><h1>${esc(t)}</h1><p class="muted small">${esc(d)}</p></div><div class="row">${botoes}</div></div>`;
  if (app === "branding") {
    const com = clients.filter(cl => cl.doc.plano?.branding || cl.doc.plano?.midias || cl.doc.plano?.grafica);
    w.innerHTML = topo("Branding e mídias", "Projeto de marca, mídias digitais e papelaria gráfica: o portal do cliente é o próprio painel desta frente.") + nav + `
      <div class="g4"><div class="card stat"><b>${com.length}</b><span>clientes</span></div><div class="card stat"><b>${com.filter(c => c.doc.plano?.midias).length}</b><span>com mídias digitais</span></div><div class="card stat"><b>${com.filter(c => c.doc.recorrente?.ativo).length}</b><span>com mensalidade</span></div><div class="card stat"><b>${brl(com.filter(c => c.doc.recorrente?.ativo).reduce((s, c) => s + (+c.doc.recorrente.valor || 0), 0))}</b><span>por mês</span></div></div>
      <section class="card grid"><h3>Clientes</h3>${com.length ? `<div class="tbl"><table><thead><tr><th>Cliente</th><th>Plano</th><th>Mensalidade</th><th></th></tr></thead><tbody>${com.map(cl => `<tr><td><b>${esc(cl.doc.marca || cl.doc.nome)}</b></td><td>${["branding", "midias", "grafica"].filter(k => cl.doc.plano?.[k]).map(k => `<span class="pill">${esc((precosBranding(state.cache.pub).find(p => p.k === k) || {}).nome || k)}</span>`).join(" ")}</td><td class="num">${cl.doc.recorrente?.ativo ? brl(cl.doc.recorrente.valor) : "—"}</td><td><a class="btn sec sm" href="#/admin/cliente/${cl.id}/projeto">Abrir</a></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nenhum cliente de branding ainda.</p>`}</section>
      <div id="precos"></div>`;
    return editorPrecos($("#precos", w), "branding", cat);
  }
  const c = cat[app], ade = clients.map(cl => ({ cl, a: (cl.doc.apps || {})[app] })).filter(x => ativoApp(x.a));
  const mrr = ade.filter(x => x.a.status === "ativo").reduce((s, x) => s + valorAdesao(cat, app, x.a), 0);
  const peds = clients.flatMap(cl => appPedidos(cl.doc, cl.acoes).filter(p => p.app === app).map(p => ({ ...p, cl })));
  w.innerHTML = topo(c.nome, c.desc, `${c.site ? `<a class="btn sec" href="${esc(c.site)}" target="_blank" rel="noopener">Página de vendas</a>` : ""}<button class="btn" id="apCob">Gerar cobranças do mês</button>`) + nav + `
    <div class="g4"><div class="card stat"><b>${ade.filter(x => x.a.status === "ativo").length}</b><span>clientes ativos</span></div><div class="card stat"><b>${ade.filter(x => x.a.status === "teste").length}</b><span>em teste</span></div><div class="card stat"><b>${brl(mrr)}</b><span>por mês (ativos)</span></div><div class="card stat"><b>${peds.filter(p => p.status === "novo").length}</b><span>pedidos novos</span></div></div>
    ${peds.length ? `<section class="card grid"><h3>Pedidos dos clientes</h3><div class="tbl"><table><thead><tr><th>Data</th><th>Cliente</th><th>Pedido</th><th>Status</th><th></th></tr></thead><tbody>${peds.map(p => `<tr><td class="num">${fdt(p.em)}</td><td>${esc(p.cl.doc.marca || p.cl.doc.nome)}</td><td>${p.extra ? `Extra: <b>${esc((c.extras.find(e => e.k === p.extra) || {}).nome || p.extra)}</b>` : `<b>Contratar ${esc(c.nome)}</b>`}${p.texto ? `<br><span class="muted small">${esc(p.texto)}</span>` : ""}</td><td>${pill(p.status)}</td><td><a class="btn sec sm" href="#/admin/cliente/${p.cl.id}/apps">Abrir na ficha</a></td></tr>`).join("")}</tbody></table></div></section>` : ""}
    <section class="card grid"><h3>Clientes com ${esc(c.nome)}</h3>${ade.length ? `<div class="tbl"><table><thead><tr><th>Cliente</th><th>Plano e extras</th><th>Status</th><th>Mensal</th><th>Próximo vencimento</th><th></th></tr></thead><tbody>${ade.map(({ cl, a }) => `<tr><td><b>${esc(cl.doc.marca || cl.doc.nome)}</b>${a.empresa ? `<br><span class="muted small">empresa ${esc(a.empresa)}</span>` : a.codigo ? `<br><span class="muted small">anunciante ${esc(a.codigo)}</span>` : ""}</td><td class="small">${esc((c.planos.find(p => p.k === a.plano) || {}).nome || "—")}${(a.extras || []).length ? `<br><span class="muted">+ ${esc(a.extras.map(k => (c.extras.find(e => e.k === k) || {}).nome || k).join(", "))}</span>` : ""}</td><td>${astPill(a.status)}${a.status === "teste" && a.fimTeste ? `<br><span class="muted small">até ${fdate(a.fimTeste)}</span>` : ""}</td><td class="num">${brl(valorAdesao(cat, app, a))}</td><td class="num">${a.status === "ativo" || a.status === "pendente" ? fdate(proxVenc(a)) : "—"}</td><td><a class="btn sec sm" href="#/admin/cliente/${cl.id}/apps">Editar</a></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nenhum cliente com ${esc(c.nome)} ainda. Ative pela ficha do cliente › Serviços.</p>`}</section>
    <div id="precos"></div>
    ${admLinks(app)}`;
  editorPrecos($("#precos", w), app, cat);
  $("#apCob").onclick = async () => {
    let n = 0; for (const cl of clients) { const a = (cl.doc.apps || {})[app]; if (!a || !(a.status === "ativo" || a.status === "pendente")) continue; const d = clone(cl.doc); if (cobrancaApp(cat, d, app, a)) { d.acesso = { ...(d.acesso || {}), pagamentos: true }; await S.set(`clientes/${cl.id}`, d); n++; } }
    toast(n ? `${n} cobrança(s) gerada(s) e liberada(s) no painel do cliente` : "As cobranças deste mês já existem"); reAdmin(); };
}

/* ---------- tela única de preços: cada frente grava na própria fonte ---------- */
const FONTE_PRECOS = {
  branding: "Mostrados na ficha do cliente (Projeto) e no portal.",
  erp: "Gravados no Gerenciador do ERP e no plano público (página das lojas, painéis e páginas de vendas do ERP).",
  landing: "Gravados no catálogo do Upe Serviços (página de vendas de landing pages e painel do cliente).",
  sistemas: "Gravados no catálogo do Upe Serviços (página de vendas da agenda e dos dashboards)."
};
function linhasPrecos(frente, cat) {
  const F = state.fontes || {};
  if (frente === "branding") return precosBranding(state.cache.pub).map(p => ({ ...p, tipo: p.unico ? "unico" : "mensal" }));
  if (frente === "erp") return [...cat.erp.planos.map(p => ({ ...p, tipo: "mensal", fixo: true })), ...cat.erp.extras.map(e => ({ ...e, tipo: "extra" }))];
  const fr = frente === "landing" ? ["lp"] : ["agenda", "dash"];
  const l = (F.srv || []).filter(p => fr.includes(p.frente)).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  if (!l.length) return [...cat[frente].planos.map(p => ({ ...p, tipo: "mensal" })), ...cat[frente].extras.map(e => ({ ...e, nome: e.nome.replace(/^Criação:\s*/, ""), tipo: "unico" }))].map(r => ({ ...r, sub: frente === "landing" ? "lp" : /^dash/.test(r.k) ? "dash" : "agenda", ativo: true }));
  return l.map(p => ({ k: p.id, nome: p.nome, preco: +p.valor || 0, desc: p.descricao || "", tipo: p.tipo === "criacao" ? "unico" : "mensal", sub: p.frente, ativo: p.ativo !== false, itens: p.itens || [], ordem: p.ordem || 0 }));
}
function editorPrecos(box, frente, cat) {
  let rows = linhasPrecos(frente, cat);
  const tipos = frente === "erp" ? null : [["mensal", "Mensal"], ["unico", "Pagamento único"]];
  const subs = frente === "sistemas" ? [["agenda", "Agenda"], ["dash", "Dashboard"]] : null;
  const render = () => {
    box.innerHTML = `<section class="card grid"><div class="spread"><h3>Preços · ${esc(FRENTES_UPE[frente])}</h3><span class="muted small">${esc(FONTE_PRECOS[frente])}</span></div>
      <div class="tbl"><table class="precos"><thead><tr><th>Nome</th><th>Descrição</th>${subs ? "<th>Serviço</th>" : ""}${tipos ? "<th>Cobrança</th>" : frente === "erp" ? "<th>Tipo</th>" : ""}<th>Valor (R$)</th>${frente === "landing" || frente === "sistemas" ? "<th>Na página de vendas</th>" : ""}<th></th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr data-i="${i}"><td><input data-f="nome" value="${esc(r.nome)}" aria-label="Nome"></td><td><input data-f="desc" value="${esc(r.desc || "")}" aria-label="Descrição"></td>
        ${subs ? `<td><select data-f="sub" aria-label="Serviço">${subs.map(([k, l]) => `<option value="${k}" ${r.sub === k ? "selected" : ""}>${l}</option>`).join("")}</select></td>` : ""}
        ${tipos ? `<td><select data-f="tipo" aria-label="Cobrança">${tipos.map(([k, l]) => `<option value="${k}" ${r.tipo === k ? "selected" : ""}>${l}</option>`).join("")}</select></td>` : frente === "erp" ? `<td class="small muted">${r.tipo === "extra" ? "Adicional mensal" : "Mensalidade"}</td>` : ""}
        <td><input data-f="preco" type="number" step="0.01" min="0" value="${esc(r.preco)}" aria-label="Valor" style="max-width:110px"></td>
        ${frente === "landing" || frente === "sistemas" ? `<td><label class="row small" style="gap:6px"><input type="checkbox" data-f="ativo" ${r.ativo !== false ? "checked" : ""}>Mostrar</label></td>` : ""}
        <td>${r.fixo ? "" : `<button class="btn sec sm" data-del="${i}" aria-label="Remover">Remover</button>`}</td></tr>`).join("")}</tbody></table></div>
      <div class="spread"><button class="btn sec sm" id="prAdd">Adicionar ${frente === "erp" ? "adicional" : "item"}</button><span class="muted small">Valor 0 aparece como “sob consulta”.</span><button class="btn" id="prSv">Salvar preços</button></div></section>`;
    const ler = () => { $$("tr[data-i]", box).forEach(tr => { const r = rows[+tr.dataset.i]; $$("[data-f]", tr).forEach(i => { const f = i.dataset.f; r[f] = i.type === "checkbox" ? i.checked : f === "preco" ? +i.value || 0 : i.value.trim(); }); }); };
    $("#prAdd", box).onclick = () => { ler(); rows.push({ k: "", nome: "", desc: "", preco: 0, tipo: frente === "erp" ? "extra" : "mensal", sub: subs ? subs[0][0] : "", ativo: true, novo: true }); render(); };
    $$("[data-del]", box).forEach(b => b.onclick = () => { ler(); rows.splice(+b.dataset.del, 1); render(); });
    $("#prSv", box).onclick = async () => { ler(); const b = $("#prSv", box); b.disabled = true;
      try { await salvarPrecos(frente, rows.filter(r => r.nome)); toast("Preços salvos na fonte de " + FRENTES_UPE[frente]); reAdmin(); }
      catch (e) { console.error(e); toast("Não foi possível salvar: " + (e.message || e)); b.disabled = false; } };
  };
  render();
}
const chave = (pre, nome) => (pre + String(nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).slice(0, 40) || pre + uid(4);
async function salvarPrecos(frente, rows) {
  const F = state.fontes || {}, agora = new Date().toISOString();
  if (frente === "branding") {
    const pub = { ...(state.cache.pub || {}) }; pub.precos = { ...(pub.precos || {}), branding: rows.map(r => ({ k: r.k || chave("", r.nome), nome: r.nome, desc: r.desc, preco: r.preco, unico: r.tipo === "unico" })) };
    await S.set("config/publico", pub); state.cache.pub = pub; return;
  }
  if (frente === "erp") {
    const mensal = (rows.find(r => r.k === "mensal") || {}).preco, upe = (rows.find(r => r.k === "upe") || {}).preco;
    const g = (await S.get("upe/gestao/config/geral").catch(() => null)) || {}, antigos = Object.fromEntries((g.extras || (F.erp || {}).extras || []).map(x => [x.k, x]));
    const extras = rows.filter(r => r.tipo === "extra").map(r => { const k = r.k || chave("X", r.nome).slice(0, 6).toUpperCase(); const a = antigos[k] || {}; return { k, nome: r.nome, desc: r.desc, preco: r.preco, custo: +a.custo || 0, cap: a.cap || "" }; });
    await S.set("upe/gestao/config/geral", { mensal, upe, extras, atualizadoEm: agora }, true);
    await S.set("publico/plano", { mensal, upe, extras, atualizadoEm: agora }, true);
    return;
  }
  const fr = frente === "landing" ? ["lp"] : ["agenda", "dash"], atuais = (F.srv || []).filter(p => fr.includes(p.frente));
  const ids = new Set();
  for (const [i, r] of rows.entries()) {
    const sub = frente === "landing" ? "lp" : (r.sub || "agenda"), id = r.k || chave(sub + "-", r.nome); ids.add(id);
    const { id: _id, ...ant } = atuais.find(p => p.id === id) || {};
    await S.set(`srv_planos/${id}`, { ...ant, frente: sub, tipo: r.tipo === "unico" ? "criacao" : "mensal", nome: r.nome, valor: r.preco, descricao: r.desc, itens: ant.itens || [], ordem: i + 1, ativo: r.ativo !== false });
  }
  for (const p of atuais) if (!ids.has(p.id)) await S.del(`srv_planos/${p.id}`);
}

// acesso direto às áreas de administração de cada app (mesmo login do painel: e-mail e senha da Upe)
const ADM_LINKS = {
  erp: [["Gerenciador do ERP", "Licenças, limites, suporte e páginas de vendas", "https://gestao.upecriativo.com.br/", true], ["Painel das empresas", "Entre como Upe e escolha a empresa", "https://painel.upecriativo.com.br/", true], ["Lojas", "Endereço público das lojas", "https://loja.upecriativo.com.br/"], ["Página de vendas", "Página do Upe ERP", "https://erp.upecriativo.com.br/"]],
  landing: [["Ferramentas do Upe Serviços", "Todas as páginas, domínios, interessados e erros dos sites", "https://servicos.upecriativo.com.br/#/adm/paginas", true], ["Página de vendas", "Upe Landing pages", "https://lp.upecriativo.com.br/"], ["Página de exemplo", "lp.upecriativo.com.br/exemplo", "https://lp.upecriativo.com.br/exemplo"]],
  sistemas: [["Ferramentas do Upe Serviços", "Interessados, domínios e erros dos sites", "https://servicos.upecriativo.com.br/#/adm/interessados", true], ["Página de vendas", "Agenda online e dashboards", "https://agenda.upecriativo.com.br/"], ["Agenda de exemplo", "Como o cliente final agenda", "https://agenda.upecriativo.com.br/exemplo"]]
};
function admLinks(app) {
  const l = ADM_LINKS[app] || []; if (!l.length) return "";
  return `<section class="card grid admquick"><div class="spread"><h3>Ferramentas de administrador</h3><span class="muted small">Cadastro de clientes e preços ficam aqui no painel central. Estas telas são só para operar cada app.</span></div>
    <div class="admlinks">${l.map(([t, s, u, p]) => `<a class="admlink ${p ? "pri" : ""}" href="${esc(u)}" target="_blank" rel="noopener"><b>${esc(t)}</b><span>${esc(s)}</span></a>`).join("")}</div></section>`;
}

/* ---------- portal do cliente: Apps Upe (contratar mais serviços) ---------- */
function cApps(m, c) {
  const { doc, acoes } = c, cat = appsCat(state.cfg), meus = doc.apps || {}, peds = appPedidos(doc, acoes);
  const pediu = (app, ex = "") => peds.some(p => p.app === app && p.extra === ex && p.status === "novo");
  const precoTxt = e => +e.preco ? brl(e.preco) + (e.unico ? " (pagamento único)" : "/mês") : "sob consulta";
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Serviços Upe</span><h1>Ferramentas para o seu negócio</h1><p class="muted small">Tudo o que você contrata fica nesta mesma conta: um login, um lugar para pagar e as renovações na sua agenda.</p></div>
    <div class="g4">${APP_IDS.map(k => { const ap = cat[k], a = meus[k], tem = ativoApp(a);
      return `<article class="card grid"><div class="spread"><h3>${esc(ap.nome)}</h3>${tem ? astPill(a.status) : ap.breve ? '<span class="pill">em breve</span>' : ""}</div><p class="muted small">${esc(ap.desc)}</p>
        ${tem ? `<div class="grid" style="gap:2px"><span class="small"><b>Plano:</b> ${esc((ap.planos.find(p => p.k === a.plano) || {}).nome || "—")}</span>${(a.extras || []).length ? `<span class="small"><b>Extras:</b> ${esc(a.extras.map(x => (ap.extras.find(e => e.k === x) || {}).nome || x).join(", "))}</span>` : ""}<span class="small"><b>Mensal:</b> ${brl(valorAdesao(cat, k, a))}${a.status === "teste" && a.fimTeste ? ` · teste grátis até ${fdate(a.fimTeste)}` : a.status === "ativo" ? ` · renova em ${fdate(proxVenc(a))}` : ""}</span>${a.obs ? `<span class="small muted">${esc(a.obs)}</span>` : ""}</div><a class="btn sec sm" href="#/c/s-${k}" style="justify-self:start">Abrir o painel</a>`
        : ap.breve ? `<button class="btn sec sm" data-quero="${k}" ${pediu(k) ? "disabled" : ""}>${pediu(k) ? "Interesse enviado" : "Quero saber quando lançar"}</button>`
        : `<div class="grid" style="gap:2px">${ap.planos.slice(0, 3).map(p => `<span class="small">${esc(p.nome)} · <b>${precoTxt(p)}</b></span>`).join("")}${ap.teste ? `<span class="small muted">${ap.teste} dias de teste grátis</span>` : ""}</div><button class="btn sm" data-quero="${k}" ${pediu(k) ? "disabled" : ""} style="justify-self:start">${pediu(k) ? "Pedido enviado" : "Quero contratar"}</button>`}
        ${tem && ap.extras.length ? `<details><summary class="small"><b>Pacotes extras</b></summary><div class="grid" style="gap:8px;margin-top:8px">${ap.extras.map(e => { const ja = (a.extras || []).includes(e.k); return `<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span style="flex:1" class="small"><b>${esc(e.nome)}</b> · ${precoTxt(e)}<br><span class="muted">${esc(e.desc || "")}</span></span>${ja ? '<span class="pill ok">Contratado</span>' : `<button class="btn sec sm" data-quero="${k}:${esc(e.k)}" ${pediu(k, e.k) ? "disabled" : ""}>${pediu(k, e.k) ? "Pedido enviado" : "Adicionar"}</button>`}</div>`; }).join("")}</div></details>` : ""}
      </article>`; }).join("")}</div>`;
  $$("[data-quero]", m).forEach(b => b.onclick = async () => { const [app, ex] = b.dataset.quero.split(":"); b.disabled = true;
    await Api.act(c.id, { tipo: "pedido", alvo: `app:${app}${ex ? ":" + ex : ""}`, modo: "app", quantidade: 1, texto: "" }); toast("Pedido enviado. A Upe entra em contato para ativar."); refreshClient(); });
}
