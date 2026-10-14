/* ===== Conta única do cliente (incluído dentro do app.js) =====
   Um cadastro (ficha do cliente), um login (e-mail e senha do Firebase) e um painel com todos os serviços contratados.
   - Admin › ficha › Serviços: liga cada frente e, ao salvar, libera o acesso dos apps com o e-mail do cliente:
       portal_convites/{email} (painel central) · ERP: empresas/{empresa} + convites/{email} + upe/gestao/clientes/{Cxxxx} ·
       Landing pages e Sistemas: srv_clientes/{id do cliente} + srv_convites/{email}.
   - Admin › ficha › Páginas e sistemas: envia o HTML (e a pasta com imagens, fontes, CSS e dados) de uma página, site ou sistema;
     (pasta ou .zip). Os arquivos vão para o Storage no caminho original (lp/{endereço}/…) e abrem em lp.upecriativo.com.br/{endereço}/…;
     a página principal fica em lp_paginas/{endereço}.
   - Cliente: entra com o e-mail; no primeiro login o painel cria portal_acessos/{uid} e, quando houver convite, acessos/{uid} (ERP)
     e srv_acessos/{uid} (Serviços). Em “Meus serviços” cada serviço tem o botão “Painel – Loja X / Página X / Sistema X”,
     que abre o painel dele dentro do painel central (mesmo endereço, então o login vale para todos).
   - Painel personalizado: para qualquer frente, a Upe escolhe uma página ou sistema enviado (doc.paineis[frente] = { slug, arquivo });
     ele abre no endereço dele (isolado do painel) e só conversa com a subseção de pagamentos daquela frente (postMessage).
     HTML antigo de um arquivo só (paineis_cliente/{id}_{frente}) continua abrindo. */
const APP_URL = { erp: "../apps/painel/", landing: "../apps/servicos/", sistemas: "../apps/servicos/" };
const FRENTE_COB = { branding: "Branding e mídias", erp: "Loja online", landing: "Landing pages e sites", sistemas: "Agenda e dashboards" };
const LP_URL = "https://lp.upecriativo.com.br/", LOJA_URL = "https://loja.upecriativo.com.br/", AGENDA_URL = "https://agenda.upecriativo.com.br/";
const TIPOS_PAG = { landing: "Landing page", site: "Site", sistema: "Sistema" };
const lower = s => String(s || "").trim().toLowerCase();
const slugEmp = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "empresa-" + uid(4).toLowerCase();
const FRENTES_DO_CLIENTE = doc => [...((doc.plano?.branding || doc.plano?.midias || doc.plano?.grafica) ? ["branding"] : []), ...APP_IDS.filter(k => ativoApp((doc.apps || {})[k]))];
const temPainelProprio = (doc, k) => (doc.paineis || {})[k]?.modo === "personalizado";

/* ---------- liberação dos acessos (admin) ---------- */
async function provisionar(id, doc, priv) {
  const email = lower(priv.email), msgs = [], nome = doc.marca || doc.empresa || doc.nome, apps = doc.apps || {}, agora = new Date().toISOString();
  if (!email) return ["Sem e-mail na ficha: os painéis dos apps ficam sem acesso. Preencha o e-mail em Serviços › Acesso do cliente."];
  if (priv.emailConvite && priv.emailConvite !== email) { for (const c of ["portal_convites", "convites", "srv_convites"]) await S.del(`${c}/${priv.emailConvite}`).catch(() => {}); }
  await S.set(`portal_convites/${email}`, { cliente: id, criadoEm: Date.now() });
  priv.emailConvite = email; await S.set(`privado/${id}`, priv);
  // Upe ERP
  const erp = apps.erp;
  if (ativoApp(erp)) {
    erp.empresa = erp.empresa || slugEmp(nome);
    await S.set(`empresas/${erp.empresa}`, { nome, cliente: erp.empresa, portalId: id, atualizadoEm: agora }, true);
    await S.set(`convites/${email}`, { empresa: erp.empresa, papel: "dono", nome: doc.nome || nome, em: agora });
    if (!erp.gestaoId) { const g = await S.list("upe/gestao/clientes").catch(() => []); erp.gestaoId = "C" + String(Math.max(0, ...g.map(x => +String(x.id).replace(/\D/g, "") || 0)) + 1).padStart(4, "0"); }
    const stG = { teste: "teste", ativo: "ativo", pendente: "ativo", pausado: "suspenso" }[erp.status] || "ativo";
    await S.set(`upe/gestao/clientes/${erp.gestaoId}`, { empresa: nome, responsavel: doc.nome || "", email, whatsapp: priv.telefone || "", status: stG, dia: +erp.dia || 10, inicio: erp.inicio || todayIso(), testeAte: erp.fimTeste || "", extras: (erp.extras || []).join(""), plataforma: APPS_PADRAO.erp.painel, cnpj: priv.doc || "", portalId: id, empresaPainel: erp.empresa, criadoEm: erp.criadoGestao || agora }, true);
    erp.criadoGestao = erp.criadoGestao || agora;
    msgs.push(`ERP liberado: empresa ${erp.empresa}`);
  } else if (erp && erp.empresa) {
    const cv = await S.get(`convites/${email}`).catch(() => null); if (cv && cv.empresa === erp.empresa) await S.del(`convites/${email}`);
    if (erp.gestaoId) await S.set(`upe/gestao/clientes/${erp.gestaoId}`, { status: "cancelado" }, true).catch(() => {});
  }
  // Landing pages e Sistemas (Painel Upe Serviços), com o mesmo id do cliente
  const frentesSrv = [...(ativoApp(apps.landing) ? ["lp"] : []), ...(ativoApp(apps.sistemas) ? (apps.sistemas.modulos && apps.sistemas.modulos.length ? apps.sistemas.modulos : ["agenda", "dash"]) : [])];
  const srvExiste = await S.get(`srv_clientes/${id}`).catch(() => null);
  if (frentesSrv.length || srvExiste) {
    const cat = appsCat(state.cache.pub), a = ativoApp(apps.landing) ? apps.landing : apps.sistemas, app = ativoApp(apps.landing) ? "landing" : "sistemas";
    const pl = a ? cat[app].planos.find(p => p.k === a.plano) : null, stM = { teste: "teste", ativo: "ativo", pendente: "atrasado", pausado: "suspenso", cancelado: "cancelado" };
    await S.set(`srv_clientes/${id}`, { nome, emails: [email], whatsapp: priv.telefone || "", frentes: frentesSrv, portalId: id, atualizadoEm: Date.now(), criadoEm: (srvExiste && srvExiste.criadoEm) || Date.now(),
      plano: { ...((srvExiste && srvExiste.plano) || {}), mensal: a && pl ? { id: pl.k, nome: pl.nome, valor: valorAdesao(cat, app, a), dia: +a.dia || 10, status: stM[a.status] || "ativo", fimTeste: a.fimTeste || "" } : null } }, true);
    if (frentesSrv.length) { await S.set(`srv_convites/${email}`, { cid: id, criadoEm: Date.now() }); msgs.push(`Landing pages e Sistemas liberados (${frentesSrv.join(", ")})`); }
    else { const cv = await S.get(`srv_convites/${email}`).catch(() => null); if (cv && cv.cid === id) await S.del(`srv_convites/${email}`); }
  }
  return msgs;
}
const msgAcesso = (doc, priv) => `Olá, ${(doc.nome || "").split(" ")[0]}! O seu painel da Upe Criativo está pronto.\n\nEndereço: ${portalUrl()}\nE-mail: ${priv.email}\n\nNo primeiro acesso, toque em “Primeiro acesso: criar a minha senha” e confirme o e-mail. Por lá você acompanha todos os seus serviços e faz os pagamentos.`;

/* ---------- admin: ficha do cliente › Serviços ---------- */
async function aClienteApps(ct, { id, doc, priv, acoes, save }) {
  await carregarFontes();
  const cat = appsCat(state.cache.pub), peds = appPedidos(doc, acoes);
  doc.apps = doc.apps || {}; doc.paineis = doc.paineis || {};
  // domínios próprios: loja (lojas_dominios, conectado aqui) e landing pages (lp_dominios, pedidos pelo cliente no painel)
  const erp0 = doc.apps.erp || {}, [lojas, lpDoms, lojaDom, pgs] = await Promise.all([
    S.list("lojas").then(l => l.filter(x => x.empresa && x.empresa === erp0.empresa)).catch(() => []),
    S.list("lp_dominios").then(l => l.filter(x => x.cid === id)).catch(() => []),
    erp0.dominio ? S.get(`lojas_dominios/${erp0.dominio}`).catch(() => null) : null, paginasDoClienteAdm(id)]);
  const stDom = d => !d ? "" : d.status === "ativo" ? '<span class="pill ok">Conectado</span>' : d.status === "dns" ? '<span class="pill info">Falta o DNS do cliente</span>' : d.status === "conectar" ? '<span class="pill info">Conectando…</span>' : '<span class="pill warn">Pendente</span>';
  const dnsBox = d => d && d.dns && d.status !== "ativo" ? `<pre class="dnsbox">${esc(d.dns)}</pre>` : d && d.erro ? `<span class="muted small">Erro: ${esc(d.erro)}</span>` : "";
  const precoTxt = e => +e.preco ? brl(e.preco) + (e.unico ? " único" : "/mês") : "sob consulta";
  // painel personalizado: abre uma página ou sistema enviado (pasta ou .zip) dentro do painel do cliente
  const opcoesPainel = pgs.flatMap(pg => (pg.htmls && pg.htmls.length ? pg.htmls : [""]).map(h => [`${pg.id}|${h}`, `${pg.titulo || pg.id}${h ? " › " + h : ""}`]));
  const painelBox = k => { const p = doc.paineis[k] || {}, pers = p.modo === "personalizado", atual = p.slug ? `${p.slug}|${p.arquivo || ""}` : "";
    const pg = pgs.find(x => x.id === p.slug);
    return `<div class="grid painel-op" style="gap:6px"><span class="eb">Painel do cliente</span>
      <div class="row small" style="gap:12px"><label class="row" style="gap:6px"><input type="radio" name="pm-${k}" value="padrao" ${!pers ? "checked" : ""}>${k === "branding" ? "Portal padrão" : "Painel padrão do app"}</label><label class="row" style="gap:6px"><input type="radio" name="pm-${k}" value="personalizado" ${pers ? "checked" : ""}>Painel personalizado (página ou sistema próprio)</label></div>
      <div class="row small" data-pp="${k}" ${pers ? "" : "hidden"}><select data-ps="${k}" aria-label="Página ou sistema do painel" style="max-width:320px"><option value="">${opcoesPainel.length ? "— escolha a página ou o sistema —" : "— nenhum enviado ainda —"}</option>${opcoesPainel.map(([v, l]) => `<option value="${esc(v)}" ${v === atual ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
        <button class="btn sec sm" data-pnovo="${k}">Enviar pasta ou .zip</button>${pg ? `<a class="btn sec sm" href="${esc(urlPagina(pg, p.arquivo))}" target="_blank" rel="noopener">Ver</a>` : p.nome && !p.slug ? `<button class="btn sec sm" data-pv="${k}">Ver HTML antigo</button>` : ""}</div>
      <span class="muted small" data-pp="${k}" ${pers ? "" : "hidden"}>O sistema abre dentro do painel do cliente com todos os arquivos (imagens, fontes, scripts e dados), ao lado da aba Pagamentos desta frente. Para abrir os pagamentos: <code>parent.postMessage({ upe: "pagamentos" }, "*")</code>.</span></div>`; };
  const linkCampos = k => {
    const a = doc.apps[k] || {};
    if (k === "erp") return `<label class="f">Endereço da empresa no ERP<input data-k="empresa" value="${esc(a.empresa || "")}" placeholder="${esc(slugEmp(doc.marca || doc.empresa || doc.nome))}"></label>
      <div class="g2"><label class="f">Domínio próprio da loja<input data-k="dominio" value="${esc(a.dominio || "")}" placeholder="www.lojadocliente.com.br"></label>
      <label class="f">Loja que ele abre<select data-k="loja">${lojas.length ? lojas.map(l => `<option value="${esc(l.id)}" ${a.loja === l.id ? "selected" : ""}>${esc(l.nome || l.id)} · loja.upecriativo.com.br/${esc(l.id)}</option>`).join("") : `<option value="${esc(a.loja || "")}">${a.loja ? esc(a.loja) : "a loja aparece quando o cliente publicar"}</option>`}</select></label></div>
      ${a.dominio ? `<div class="row small">${stDom(lojaDom)}<span class="muted">${esc(a.dominio)}</span>${lojaDom && lojaDom.status === "ativo" ? `<a class="btn sec sm" href="https://${esc(a.dominio)}" target="_blank" rel="noopener">Abrir</a>` : ""}</div>${dnsBox(lojaDom)}` : `<span class="muted small">Com domínio, ao salvar a Upe conecta sozinha e os registros de DNS aparecem aqui e no painel do cliente.</span>`}`;
    if (k === "landing") return lpDoms.length ? `<div class="grid" style="gap:6px"><span class="eb">Domínios das páginas</span>${lpDoms.map(d => `<div class="grid" style="gap:4px"><div class="row small">${stDom(d)}<b>${esc(d.id)}</b><span class="muted">→ /${esc(d.slug || "")}</span>${d.status === "pendente" ? `<button class="btn sec sm" data-lpcon="${esc(d.id)}">Conectar agora</button>` : ""}</div>${dnsBox(d)}</div>`).join("")}</div>` : `<span class="muted small">O cliente pede o domínio das páginas no painel (Landing pages › Domínio próprio); ele aparece aqui para conectar.</span>`;
    if (k === "sistemas") { const mo = a.modulos && a.modulos.length ? a.modulos : ["agenda", "dash"]; return `<div class="row small" style="gap:12px"><label class="row" style="gap:6px"><input type="checkbox" data-mod="agenda" ${mo.includes("agenda") ? "checked" : ""}>Agenda online</label><label class="row" style="gap:6px"><input type="checkbox" data-mod="dash" ${mo.includes("dash") ? "checked" : ""}>Dashboards</label></div>`; }
    return "";
  };
  ct.innerHTML = `${peds.filter(p => p.status === "novo").length ? `<section class="card grid prio"><b>Pedidos do cliente</b>${peds.filter(p => p.status === "novo").map(p => `<div class="row" style="flex-wrap:nowrap"><span style="flex:1">${esc(cat[p.app]?.nome || p.app)}${p.extra ? ` · extra <b>${esc((cat[p.app]?.extras.find(e => e.k === p.extra) || {}).nome || p.extra)}</b>` : " · contratar"} <span class="muted small">${fdt(p.em)}</span></span><button class="btn sec sm" data-pok="${esc(p.id)}">Marcar como atendido</button></div>`).join("")}</section>` : ""}
    <section class="card grid"><div class="spread"><h3>Acesso do cliente</h3><span class="muted small">Um login para todos os serviços: o painel do cliente abre a loja, as páginas e os sistemas.</span></div>
      <div class="g2"><label class="f" for="svEmail">E-mail de acesso<input id="svEmail" type="email" value="${esc(priv.email || "")}" placeholder="cliente@empresa.com.br"></label>
        <div class="grid" style="gap:6px;align-content:end">${priv.emailConvite && lower(priv.emailConvite) === lower(priv.email) ? `<span class="pill ok" style="justify-self:start">Acesso liberado para ${esc(priv.emailConvite)}</span>` : `<span class="pill warn" style="justify-self:start">Acesso ainda não liberado</span>`}
        <div class="row">${priv.email ? `<button class="btn sec sm" id="svMsg">Copiar mensagem de acesso</button>${priv.telefone ? `<a class="btn sec sm" target="_blank" rel="noopener" href="${esc(waLink(priv.telefone, msgAcesso(doc, priv)))}">Enviar no WhatsApp</a>` : ""}` : ""}</div></div></div>
      <p class="muted small">O código de acesso antigo (${priv.codigo ? `<span class="code">${esc(priv.codigo)}</span>` : "—"}) continua valendo para o portal de branding, mas os painéis dos apps pedem o login com e-mail.</p></section>
    <div class="g2 svcards">
      <section class="card grid" data-frente="branding"><div class="spread"><h3>${esc(FRENTES_UPE.branding)}</h3>${FRENTES_DO_CLIENTE(doc).includes("branding") ? '<span class="pill ok">Ativo</span>' : '<span class="pill">Sem adesão</span>'}</div>
        <p class="muted small">Projeto, conteúdo, artes e recompra ficam no próprio portal. Planos e mensalidade em <a href="#/admin/cliente/${id}/projeto">Projeto e acessos</a>.</p>
        <div class="row">${["branding", "midias", "grafica"].filter(k => doc.plano?.[k]).map(k => `<span class="pill info">${esc((precosBranding(state.cache.pub).find(p => p.k === k) || {}).nome || k)}</span>`).join(" ") || '<span class="muted small">Nenhum plano de branding.</span>'}</div>
        ${painelBox("branding")}</section>
      ${APP_IDS.map(k => { const c = cat[k], a = doc.apps[k] || {};
      return `${k === "landing" ? `<h3 class="svgrupo">Páginas e sistemas <span class="muted small">landing pages, sites, agenda online e dashboards · o envio dos arquivos fica na aba “Páginas e sistemas”</span></h3>` : ""}<section class="card grid" data-app="${k}" data-frente="${k}"><div class="spread"><h3>${esc(c.nome)}</h3>${ativoApp(a) ? astPill(a.status) : '<span class="pill">Sem adesão</span>'}</div>
        <p class="muted small">${esc(c.desc)}</p>
        <div class="g2"><label class="f">Status<select data-k="status"><option value="">Sem adesão</option>${Object.entries(AST).map(([s, [l]]) => `<option value="${s}" ${a.status === s ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="f">Plano<select data-k="plano">${c.planos.map(p => `<option value="${esc(p.k)}" ${a.plano === p.k ? "selected" : ""}>${esc(p.nome)} · ${precoTxt(p)}</option>`).join("")}</select></label></div>
        ${linkCampos(k)}
        ${c.extras.length ? `<div class="grid" style="gap:4px"><span class="eb">Extras</span>${c.extras.map(e => `<label class="row small" style="gap:6px;flex-wrap:nowrap"><input type="checkbox" data-ex="${esc(e.k)}" ${(a.extras || []).includes(e.k) ? "checked" : ""}>${esc(e.nome)} <span class="muted">· ${precoTxt(e)}</span></label>`).join("")}</div>` : ""}
        <div class="g2"><label class="f">Dia do vencimento<input type="number" min="1" max="28" data-k="dia" value="${esc(a.dia || doc.recorrente?.dia || 10)}"></label><label class="f">Ajuste no valor (R$)<input type="number" step="0.01" data-k="ajuste" value="${esc(a.ajuste || 0)}"></label></div>
        <div class="g2"><label class="f">Início<input type="date" data-k="inicio" value="${esc(a.inicio || todayIso())}"></label><label class="f">Fim do teste<input type="date" data-k="fimTeste" value="${esc(a.fimTeste || (c.teste ? addDays(todayIso(), c.teste) : ""))}"></label></div>
        <label class="f">Observações (o cliente vê)<input data-k="obs" value="${esc(a.obs || "")}" placeholder="Ex.: loja em lojadacliente.com.br"></label>
        <div class="spread"><b class="num" data-tot>${brl(valorAdesao(cat, k, a))}/mês</b><span class="row">${ativoApp(a) ? `<button class="btn sec sm" data-ver="${k}">Ver como o cliente</button>` : ""}${a.status === "ativo" || a.status === "pendente" ? `<button class="btn sec sm" data-cob="${k}">Gerar cobrança do mês</button>` : ""}</span></div>
        ${painelBox(k)}
      </section>`; }).join("")}</div>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="caSv">Salvar serviços e liberar acessos</button></div>`;
  const collect = () => {
    APP_IDS.forEach(k => { const box = $(`[data-app="${k}"]`, ct); const v = n => ($(`[data-k="${n}"]`, box) || {}).value || "";
      const st = v("status"); if (!st) { if (doc.apps[k]) doc.apps[k] = { ...doc.apps[k], status: "cancelado" }; return; }
      const mods = $$("[data-mod]", box).filter(i => i.checked).map(i => i.dataset.mod);
      doc.apps[k] = { ...(doc.apps[k] || {}), status: st, plano: v("plano"), extras: $$("[data-ex]", box).filter(i => i.checked).map(i => i.dataset.ex), dia: +v("dia") || 10, ajuste: +v("ajuste") || 0, inicio: v("inicio"), fimTeste: v("fimTeste"), obs: v("obs").trim(),
        ...(k === "erp" ? { empresa: slugEmp(v("empresa") || doc.apps[k]?.empresa || doc.marca || doc.empresa || doc.nome), dominio: lower(v("dominio")).replace(/^https?:\/\//, "").replace(/\/.*$/, ""), loja: v("loja") } : {}), ...(k === "sistemas" ? { modulos: mods.length ? mods : ["agenda", "dash"] } : {}) }; });
    ["branding", ...APP_IDS].forEach(k => { const r = $(`input[name="pm-${k}"]:checked`, ct); if (!r) return; doc.paineis[k] = { ...(doc.paineis[k] || {}), modo: r.value };
      const [slug, arquivo] = (($(`[data-ps="${k}"]`, ct) || {}).value || "").split("|"), pg = pgs.find(x => x.id === slug);
      if (pg) doc.paineis[k] = { ...doc.paineis[k], slug, arquivo: arquivo || "", nome: pg.titulo || slug, previa: pg.previa || "", em: doc.paineis[k].slug === slug && doc.paineis[k].arquivo === arquivo ? doc.paineis[k].em : Date.now() }; });
    priv.email = lower($("#svEmail").value);
  };
  ct.querySelectorAll("[data-app] input, [data-app] select").forEach(i => i.addEventListener("input", () => { collect(); APP_IDS.forEach(k => { const t = $(`[data-app="${k}"] [data-tot]`, ct); if (t && doc.apps[k]) t.textContent = brl(valorAdesao(cat, k, doc.apps[k])) + "/mês"; }); }));
  $$('input[type=radio][name^="pm-"]', ct).forEach(r => r.onchange = () => { const k = r.name.slice(3); $$(`[data-pp="${k}"]`, ct).forEach(x => x.hidden = r.value !== "personalizado"); });
  $$("[data-pnovo]", ct).forEach(b => b.onclick = () => { collect(); enviarPagina(id, doc, null, save, { tipo: "sistema", frente: b.dataset.pnovo }); });
  $$("[data-pv]", ct).forEach(b => b.onclick = async () => { const d = await S.get(`paineis_cliente/${id}_${b.dataset.pv}`); if (!d) return toast("HTML não encontrado");
    modal("Painel personalizado · " + FRENTES_UPE[b.dataset.pv], `<iframe class="pp-frame" sandbox="allow-scripts allow-forms allow-popups" title="Prévia do painel"></iframe>`, `<button class="btn" data-close>Fechar</button>`, true); $(".pp-frame").srcdoc = d.html; });
  if ($("#svMsg")) $("#svMsg").onclick = () => copy(msgAcesso(doc, priv), "Mensagem copiada");
  $$("[data-ver]", ct).forEach(b => b.onclick = () => { ss.set("upe-cliente", id); ss.set("upe-voltar", `#/admin/cliente/${id}/apps`); go(`#/c/s-${b.dataset.ver}`); });
  $$("[data-lpcon]", ct).forEach(b => b.onclick = async () => { await S.set(`lp_dominios/${b.dataset.lpcon}`, { status: "conectar", pedidoConexaoEm: Date.now() }, true); toast("Conectando… os registros de DNS aparecem em instantes"); setTimeout(reAdmin, 12000); });
  $$("[data-pok]", ct).forEach(b => b.onclick = async () => { doc.pedidosAdm = doc.pedidosAdm || {}; doc.pedidosAdm[b.dataset.pok] = { ...(doc.pedidosAdm[b.dataset.pok] || {}), status: "entregue" }; collect(); await save("Pedido marcado como atendido"); });
  $$("[data-cob]", ct).forEach(b => b.onclick = async () => { collect(); const cob = cobrancaApp(cat, doc, b.dataset.cob, doc.apps[b.dataset.cob]); if (!cob) return toast("A cobrança deste mês já existe"); doc.acesso = { ...(doc.acesso || {}), pagamentos: true }; await save(`Cobrança de ${brl(cob.valor)} liberada no painel (vence ${fdate(cob.vencimento)})`); });
  $("#caSv").onclick = async () => {
    collect(); const b = $("#caSv"); b.disabled = true;
    try {
      const unicas = APP_IDS.flatMap(k => ativoApp(doc.apps[k]) ? cobrancasUnicas(cat, doc, k, doc.apps[k]) : []);
      if (FRENTES_DO_CLIENTE(doc).length > 0) doc.acesso = { ...(doc.acesso || {}), pagamentos: true };
      const msgs = await provisionar(id, doc, priv);
      // domínio próprio da loja
      const e = doc.apps.erp || {};
      if (erp0.dominio && erp0.dominio !== e.dominio) await S.del(`lojas_dominios/${erp0.dominio}`).catch(() => {});
      if (ativoApp(e) && e.dominio) {
        if (!/^[a-z0-9.-]{4,120}$/.test(e.dominio) || !e.dominio.includes(".")) throw new Error("domínio da loja inválido: " + e.dominio);
        const atual = await S.get(`lojas_dominios/${e.dominio}`).catch(() => null), slug = e.loja || (lojas[0] || {}).id || e.empresa;
        if (!atual) { await S.set(`lojas_dominios/${e.dominio}`, { empresa: e.empresa, slug, cliente: id, email: lower(priv.email), status: "conectar", criadoEm: Date.now() }); msgs.push("Domínio da loja: conectando " + e.dominio); }
        else if (atual.slug !== slug || atual.empresa !== e.empresa) await S.set(`lojas_dominios/${e.dominio}`, { slug, empresa: e.empresa }, true);
      }
      doc.atualizadoEm = Date.now(); await S.set(`clientes/${id}`, doc);
      toast([...msgs, unicas.length ? `${unicas.length} cobrança(s) de criação liberada(s)` : ""].filter(Boolean).join(" · ") || "Serviços salvos"); reAdmin();
    } catch (e) { console.error(e); toast("Não foi possível salvar tudo: " + (e.message || e)); b.disabled = false; }
  };
}

/* ---------- cliente: login com e-mail e abertura da conta ---------- */
async function contaAbrir(user) {
  const email = lower(user.email), u = user.uid;
  let ac = await S.get(`portal_acessos/${u}`);
  if (!ac) {
    const cv = await S.get(`portal_convites/${email}`);
    if (!cv) throw new Error(`O e-mail ${email} ainda não foi liberado pela Upe. Fale com a gente para liberar o seu painel.`);
    ac = { cliente: cv.cliente, email, criadoEm: Date.now() }; await S.set(`portal_acessos/${u}`, ac);
  }
  // acessos dos apps (silencioso: só cria quando a Upe liberou)
  try { if (!(await S.get(`acessos/${u}`))) { const c = await S.get(`convites/${email}`); if (c) await S.set(`acessos/${u}`, { empresa: c.empresa, papel: c.papel, email, em: new Date().toISOString() }); } } catch (e) {}
  try { if (!(await S.get(`srv_acessos/${u}`))) { const c = await S.get(`srv_convites/${email}`); if (c) await S.set(`srv_acessos/${u}`, { cid: c.cid, email, criadoEm: Date.now() }); } } catch (e) {}
  ss.set("upe-cliente", ac.cliente); ss.set("upe-conta", "1");
  return ac.cliente;
}
function gateConta(err = "", ok = "") {
  app.innerHTML = demoBar() + `<div class="gate"><div class="pat" style="background-image:${pat()}"></div><div class="box">
    <div class="logo">${WM}</div>
    <div class="grid" style="gap:8px"><h1>Painel do cliente</h1><p>Entre com o e-mail cadastrado pela Upe. Um login só para todos os seus serviços.</p></div>
    <form id="fConta" novalidate>
      <input class="pl" id="kEmail" type="email" autocomplete="username" placeholder="E-mail" aria-label="E-mail">
      <input class="pl" id="kPass" type="password" autocomplete="current-password" placeholder="Senha (mínimo 6 caracteres)" aria-label="Senha">
      ${err ? `<div class="err">${esc(err)}</div>` : ""}${ok ? `<div class="okmsg">${esc(ok)}</div>` : ""}
      <button class="btn" type="submit" value="entrar">Entrar</button>
      <button class="btn sec" type="submit" value="criar">Primeiro acesso: criar a minha senha</button>
    </form>
    <p class="alt"><button class="lnk" id="kReset">Esqueci a senha</button> · <button class="lnk" id="toCode">Tenho um código de acesso</button></p>
    <p class="alt">Não consegue entrar? <a href="${esc(waLink(CFG.whatsappUpe, "Olá! Preciso de ajuda para entrar no painel da Upe."))}" target="_blank" rel="noopener" style="color:var(--creme);font-weight:900">Fale com a Upe</a></p>
    <p class="alt"><button class="lnk" id="toAdm">Acesso administrador</button></p>
  </div></div>`;
  $("#kEmail").focus();
  $("#fConta").onsubmit = async e => {
    e.preventDefault(); const em = $("#kEmail").value.trim(), pw = $("#kPass").value, criar = e.submitter && e.submitter.value === "criar";
    if (!em || pw.length < 6) return gateConta("Digite o e-mail e uma senha de pelo menos 6 caracteres.");
    try { const user = criar ? await S.contaCriar(em, pw) : await S.contaEntrar(em, pw); await seguirConta(user); }
    catch (er) { gateConta(er.message); }
  };
  $("#kReset").onclick = async () => { const em = $("#kEmail").value.trim(); if (!em) return gateConta("Digite o seu e-mail acima para receber o link."); try { await S.contaReset(em); gateConta("", "Enviamos um link para criar uma nova senha. Confira o e-mail (e o spam)."); } catch (er) { gateConta(er.message); } };
  $("#toCode").onclick = () => gate("cliente");
  $("#toAdm").onclick = () => go("#/admin");
}
async function seguirConta(user) {
  if (!user) return gateConta();
  if (!user.emailVerified) return telaConfirmar(user);
  try { await contaAbrir(user); go("#/c/inicio"); } catch (er) { await S.contaSair(); gateConta(er.message); }
}
function telaConfirmar(user) {
  app.innerHTML = demoBar() + `<div class="gate"><div class="pat" style="background-image:${pat()}"></div><div class="box"><div class="logo">${WM}</div>
    <div class="grid" style="gap:8px"><h1>Confirme o seu e-mail</h1><p>Enviamos um link para <b>${esc(user.email)}</b>. Abra o e-mail, toque no link e volte aqui.</p></div>
    <button class="btn" id="kJa">Já confirmei</button><button class="btn sec" id="kRe">Reenviar o e-mail</button><p class="alt"><button class="lnk" id="kOut">Usar outro e-mail</button></p></div></div>`;
  $("#kJa").onclick = async () => { const u = await S.contaRecarregar(); if (u && u.emailVerified) seguirConta(u); else toast("Ainda não aparece como confirmado. Abra o link do e-mail e tente de novo."); };
  $("#kRe").onclick = async () => { try { await S.contaReenviar(); toast("E-mail reenviado"); } catch (e) { toast(e.message); } };
  $("#kOut").onclick = async () => { await S.contaSair(); gateConta(); };
}

/* ---------- cliente: um serviço dentro do painel (padrão do app ou painel personalizado) ---------- */
async function cServico(m, c, frente, sub) {
  const { id, doc } = c, a = (doc.apps || {})[frente] || {}, cat = appsCat(state.cfg), nome = frente === "branding" ? FRENTES_UPE.branding : (cat[frente] || {}).nome || frente;
  const proprio = temPainelProprio(doc, frente), aba = sub === "pagamentos" ? "pagamentos" : "painel";
  m.innerHTML = `<a href="#/c/servicos" class="small">← Meus serviços</a><div class="spread"><div class="grid" style="gap:4px"><span class="eb">Seus serviços</span><h1>${esc(nome)}</h1>${frente !== "branding" && a.status ? `<div class="row">${astPill(a.status)}${a.status === "teste" && a.fimTeste ? `<span class="muted small">teste grátis até ${fdate(a.fimTeste)}</span>` : ""}</div>` : ""}</div>
      <nav class="subtabs"><a class="tab" href="#/c/s-${frente}" ${aba === "painel" ? 'aria-current="page"' : ""}>Painel</a><a class="tab" href="#/c/s-${frente}/pagamentos" ${aba === "pagamentos" ? 'aria-current="page"' : ""}>Pagamentos</a></nav></div>
    <div id="svc"></div>`;
  const box = $("#svc", m);
  if (aba === "pagamentos") return cPagamentos(box, c, { frente, embutido: true });
  if (proprio) {
    const pp = doc.paineis[frente] || {}, cobs = cobrancasFrente(c, frente);
    const dados = { upe: "cliente", nome: doc.nome || "", marca: doc.marca || doc.empresa || "", frente, status: a.status || "", emAberto: cobs.filter(x => x.st === "aberta").length, totalEmAberto: cobs.filter(x => x.st === "aberta").reduce((t, x) => t + (+x.valor || 0), 0) };
    const ligar = fr => { const ouvir = e => { if (e.source !== fr.contentWindow || !e.data || typeof e.data !== "object") return;
        if (e.data.upe === "pagamentos") go(`#/c/s-${frente}/pagamentos`);
        else if (e.data.upe === "dados") fr.contentWindow.postMessage(dados, "*");
        else if (e.data.upe === "altura" && +e.data.h > 200) fr.style.height = Math.min(6000, +e.data.h) + "px"; };
      window.addEventListener("message", ouvir); const off = () => { window.removeEventListener("message", ouvir); window.removeEventListener("hashchange", off); }; window.addEventListener("hashchange", off);
      fr.addEventListener("load", () => fr.contentWindow.postMessage(dados, "*")); };
    // página ou sistema enviado com a pasta: abre no endereço dele (outro domínio, então fica isolado do painel)
    if (pp.slug) {
      const url = urlPagina({ id: pp.slug, publicada: false, previa: pp.previa }, pp.arquivo);
      box.innerHTML = `<iframe class="svc-frame pp" src="${esc(url)}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals" allow="clipboard-write; fullscreen" title="${esc(nome)}"></iframe><p class="muted small" style="margin-top:6px"><a href="${esc(url)}" target="_blank" rel="noopener">Abrir em tela cheia</a></p>`;
      return ligar($("iframe", box));
    }
    const d = await S.get(`paineis_cliente/${id}_${frente}`).catch(() => null);
    if (!d) { box.innerHTML = `<div class="empty"><b>Painel em preparação.</b><span>${S.mode === "firebase" && !S.contaAtual() ? "Entre com o seu e-mail para ver este painel." : "A Upe está montando o seu painel. Os pagamentos já estão na aba ao lado."}</span>${S.mode === "firebase" && !S.contaAtual() ? `<button class="btn" id="kLogin">Entrar com e-mail</button>` : ""}</div>`; if ($("#kLogin")) $("#kLogin").onclick = () => { ss.set("upe-cliente", null); gateConta(); }; return; }
    // HTML antigo (um arquivo só, sem a pasta)
    box.innerHTML = `<iframe class="svc-frame pp" sandbox="allow-scripts allow-forms allow-popups allow-downloads" title="${esc(nome)}"></iframe>`;
    const fr = $("iframe", box); ligar(fr); fr.srcdoc = d.html; return;
  }
  if (frente === "branding") return go("#/c/inicio");
  const precisaLogin = S.mode === "firebase" && !S.contaAtual();
  if (precisaLogin) { box.innerHTML = `<div class="empty"><b>Entre com o seu e-mail para abrir este painel.</b><span>O código de acesso vale só para o portal de branding. Os apps usam o login com e-mail (o mesmo para todos).</span><button class="btn" id="kLogin">Entrar com e-mail</button></div>`; $("#kLogin").onclick = () => { ss.set("upe-cliente", null); gateConta(); }; return; }
  if (frente === "erp" && a.dominio) {
    const d = await S.get(`lojas_dominios/${a.dominio}`).catch(() => null);
    if (d && d.status === "dns") box.insertAdjacentHTML("beforebegin", `<section class="card grid prio"><b>Falta um passo para ${esc(a.dominio)} abrir a sua loja</b><p class="small">No painel de onde o domínio foi registrado (Registro.br, GoDaddy, Hostinger…), crie estes registros de DNS. Em até 24 horas a loja abre com cadeado (HTTPS).</p><pre class="dnsbox">${esc(d.dns || "")}</pre></section>`);
    else if (d && d.status === "ativo") box.insertAdjacentHTML("beforebegin", `<p class="small">Sua loja: <a href="https://${esc(a.dominio)}" target="_blank" rel="noopener">${esc(a.dominio)}</a></p>`);
  }
  const adm = state.admin && ss.get("upe-voltar");
  const q = new URLSearchParams({ embed: "1" });
  if (frente === "landing" || frente === "sistemas") { q.set("frente", frente); if (adm) q.set("cid", id); }
  if (frente === "erp" && adm && a.empresa) q.set("empresa", a.empresa);
  if (S.mode === "demo") q.set("demo", "1");
  const url = APP_URL[frente] + "?" + q.toString();
  box.innerHTML = `<iframe class="svc-frame" src="${esc(url)}" title="${esc(nome)}" allow="clipboard-write; camera; fullscreen"></iframe><p class="muted small" style="margin-top:6px"><a href="${esc(url.replace("embed=1&", "").replace("embed=1", ""))}" target="_blank" rel="noopener">Abrir em tela cheia</a></p>`;
}

/* ---------- cobranças de todas as frentes ---------- */
function cobrancasFrente(c, frente) {
  const { doc, acoes } = c;
  return (doc.cobrancas || []).filter(x => x.liberada && (!frente || (x.app || "branding") === frente)).map(x => ({ ...x, st: cobStatus(x, acoes) }));
}
// cobranças antigas do Upe Serviços (srv_clientes/{cid}/cobrancas), mostradas junto das demais
async function cobrancasServicos() {
  if (S.mode !== "firebase" || !S.contaAtual()) return [];
  try { const sa = await S.get(`srv_acessos/${S.contaAtual().uid}`); if (!sa) return [];
    return (await S.list(`srv_clientes/${sa.cid}/cobrancas`)).map(x => ({ ...x, _srv: `srv_clientes/${sa.cid}/cobrancas/${x.id}` }));
  } catch (e) { return []; }
}

/* ---------- pasta do cliente no Storage: clientes/{marca}/dossie · criacao · paginas/{endereço} · marca · posts · graficos · kits ---------- */
// O nome sai da marca (ou empresa) na primeira vez e fica fixo, para os links não quebrarem se a marca mudar.
async function pastaDoCliente(id, doc) {
  if (doc.pasta) return doc.pasta;
  const c = state.cache.clients.find(x => x.id === id); if (c && c.doc.pasta) return doc.pasta = c.doc.pasta;
  const base = slugEmp(doc.marca || doc.empresa || doc.nome || (c && (c.doc.marca || c.doc.empresa || c.doc.nome))), usadas = new Set(state.cache.clients.filter(x => x.id !== id).map(x => x.doc.pasta).filter(Boolean));
  let p = base, n = 2; while (usadas.has(p)) p = `${base}-${n++}`;
  doc.pasta = p; if (c) c.doc.pasta = p; await S.set(`clientes/${id}`, { pasta: p }, true);
  return p;
}

/* ---------- posts ligados aos arquivos da pasta de criação ou do dossiê ---------- */
// mídia "solta": caminho relativo ou só o nome (ex.: "../conteudo/posts/s1-01-1.jpg"), sem endereço para abrir
const soltoU = u => !!u && !/^(https?:|idb:|\{assets\}|blob:|data:)/.test(u);
// arqs: [{ rel: "conteudo/posts/s1-01-1.jpg", url: async () => endereço }]; liga pelo caminho e, se não achar, pelo nome do arquivo
async function vincularPosts(doc, arqs) {
  const norm = u => decodeURIComponent(String(u)).replace(/^(\.\.?\/)+/, "").replace(/^\/+/, "").toLowerCase(), nome = u => norm(u).split("/").pop();
  const achar = u => { const n = norm(u), b = nome(u); return arqs.find(a => a.rel.toLowerCase() === n) || arqs.find(a => a.rel.toLowerCase().endsWith("/" + n)) || arqs.find(a => a.rel.toLowerCase().split("/").pop() === b); };
  let n = 0, faltam = 0;
  for (const p of doc.posts || []) {
    const novas = [];
    for (const m of p.midias || []) { if (!soltoU(m)) { novas.push(m); continue; } const a = achar(m); if (a) { novas.push(await a.url()); n++; } else { novas.push(m); faltam++; } }
    p.midias = novas;
    if (soltoU(p.capa)) { const a = achar(p.capa); if (a) { p.capa = await a.url(); n++; } else faltam++; }
  }
  return { n, faltam };
}

/* ---------- pastas e .zip: lidos no navegador e enviados com os caminhos originais ---------- */
// Os arquivos vão para o Storage no mesmo caminho relativo (lp/{endereço}/css/estilo.css…) e o servidor entrega cada um em
// lp.upecriativo.com.br/{endereço}/css/estilo.css. Nada é reescrito: caminhos relativos, módulos, fetch(), fontes e caminhos montados pelo script funcionam.
const LIXO = /(^|\/)(\.|__MACOSX\/)|thumbs\.db$|desktop\.ini$/i;
// "Escolher pasta": tira o nome da pasta escolhida do começo do caminho
function pastaDeArquivos(files) { const m = new Map(); for (const f of files) { const rel = (f.webkitRelativePath || f.name).split("/").slice(1).join("/") || f.name; if (!LIXO.test(rel)) m.set(rel, f); } return m; }
let JSZIP = null;
async function lerZip(arq, progresso = () => {}) {
  JSZIP = JSZIP || await new Promise((ok, no) => { if (window.JSZip) return ok(window.JSZip); const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; sc.onload = () => ok(window.JSZip); sc.onerror = () => no(new Error("não foi possível abrir o leitor de .zip")); document.head.appendChild(sc); });
  const z = await JSZIP.loadAsync(arq), nomes = Object.keys(z.files).filter(n => !z.files[n].dir && !LIXO.test(n));
  // pasta única no topo do .zip (ex.: Cliente_Dossie/…) sai do caminho, como na escolha de pasta
  const topo = nomes.length && nomes.every(n => n.includes("/") && n.split("/")[0] === nomes[0].split("/")[0]) ? nomes[0].split("/")[0] + "/" : "";
  const m = new Map(); let k = 0;
  for (const n of nomes) { progresso(`Abrindo o .zip ${++k}/${nomes.length}`); const rel = n.slice(topo.length); m.set(rel, new File([await z.files[n].async("blob")], rel.split("/").pop(), { type: tipoArq(rel) })); }
  return m;
}
const htmlsDe = m => [...m.keys()].filter(k => /\.html?$/i.test(k)).sort((a, b) => a.split("/").length - b.split("/").length || (/(^|\/)index\.html?$/i.test(b) - /(^|\/)index\.html?$/i.test(a)) || a.localeCompare(b));
// só uma subpasta (ex.: "landing/") vira a raiz publicada
const recortar = (m, dir) => { if (!dir) return m; const r = new Map(); for (const [k, f] of m) if (k.startsWith(dir)) r.set(k.slice(dir.length), f); return r; };
const tamanhoMB = m => ([...m.values()].reduce((t, f) => t + f.size, 0) / 1048576).toFixed(1);
// envia a pasta para {prefixo}/{caminho}, 6 arquivos por vez
async function subirPasta(prefixo, arquivos, progresso = () => {}) {
  const lista = [...arquivos.entries()]; let n = 0, i = 0;
  const um = async () => { while (i < lista.length) { const [rel, f] = lista[i++]; await S.uploadEm(f, `${prefixo}/${rel}`); progresso(`Enviando ${++n}/${lista.length}`); } };
  await Promise.all(Array.from({ length: Math.min(6, lista.length) }, um));
  return n;
}
// endereço público de uma página/sistema (rascunho abre com a chave de prévia)
const caminhoUrl = c => String(c || "").split("/").map(encodeURIComponent).join("/");
const urlPagina = (p, arquivo = "") => LP_URL + p.id + "/" + (arquivo && arquivo !== "index.html" ? caminhoUrl(arquivo) : "") + (!p.publicada && p.previa ? "?previa=" + p.previa : "");
async function paginasDoClienteAdm(cid) { return (await S.query("lp_paginas", "cid", cid).catch(() => [])).sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0)); }

/* ---------- admin: ficha do cliente › Páginas e sistemas ---------- */
async function aPaginas(ct, { id, doc, priv, save }) {
  const pgs = await paginasDoClienteAdm(id);
  ct.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><h3>Páginas e sistemas</h3><span class="muted small">Landing pages, sites e sistemas do cliente, publicados em <b>lp.upecriativo.com.br/endereço</b> ou no domínio dele.</span></div><button class="btn" id="pgNova">Adicionar página ou sistema</button></div>
    ${!ativoApp((doc.apps || {}).landing) && !ativoApp((doc.apps || {}).sistemas) ? `<div class="card" style="background:var(--warn-bg)">Ligue “Landing pages e sites” ou “Agenda e dashboards” em <a href="#/admin/cliente/${id}/apps">Serviços</a> para o cliente ver estas páginas no painel dele.</div>` : ""}
    <div class="card pad0 tbl">${pgs.length ? `<table><thead><tr><th>Página ou sistema</th><th>Endereço</th><th>Situação</th><th>Atualizada</th><th></th></tr></thead><tbody>${pgs.map(p => `<tr>
      <td><b>${esc(p.titulo || p.id)}</b><br><span class="muted small">${esc(TIPOS_PAG[p.tipo] || "Landing page")}${p.arquivos ? ` · ${p.arquivos} arquivo(s)` : ""}${(p.htmls || []).length > 1 ? ` · páginas: ${p.htmls.slice(0, 4).map(h => `<a href="${esc(urlPagina(p, h))}" target="_blank" rel="noopener">${esc(h)}</a>`).join(", ")}` : ""}${p.painelCliente ? " · aparece como painel do cliente" : ""}</span></td>
      <td class="small"><a href="${esc(urlPagina(p))}" target="_blank" rel="noopener">lp.upecriativo.com.br/${esc(p.id)}${p.raiz ? "/" : ""}</a>${p.dominio ? `<br><span class="muted">${esc(p.dominio)}</span>` : ""}</td>
      <td>${p.suspensa ? '<span class="pill bad">Suspensa</span>' : p.publicada ? '<span class="pill ok">No ar</span>' : '<span class="pill">Rascunho</span>'}</td>
      <td class="small num muted">${fdt(p.atualizadoEm)}</td>
      <td><div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn sec sm" data-sub="${esc(p.id)}">Substituir arquivos</button><button class="btn sec sm" data-pub="${esc(p.id)}">${p.publicada ? "Tirar do ar" : "Publicar"}</button><button class="btn sec sm" data-ed="${esc(p.id)}">Editor e análise</button></div></td></tr>`).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhuma página ou sistema ainda. Clique em “Adicionar página ou sistema”.</div>`}</div>`;
  $("#pgNova").onclick = () => enviarPagina(id, doc, null, save);
  $$("[data-sub]", ct).forEach(b => b.onclick = () => enviarPagina(id, doc, pgs.find(p => p.id === b.dataset.sub), save));
  $$("[data-pub]", ct).forEach(b => b.onclick = async () => { const p = pgs.find(x => x.id === b.dataset.pub); await S.set(`lp_paginas/${p.id}`, { publicada: !p.publicada, atualizadoEm: Date.now(), ...(p.publicada ? {} : { publicadoEm: Date.now() }) }, true); toast(p.publicada ? "Página tirada do ar" : "Página no ar"); reAdmin(); });
  $$("[data-ed]", ct).forEach(b => b.onclick = () => window.open(`../apps/servicos/?embed=1&frente=landing&cid=${encodeURIComponent(id)}#/pagina/${encodeURIComponent(b.dataset.ed)}/editar`, "_blank", "noopener"));
}
// opcoes.frente: o envio vira o painel personalizado daquela frente (Serviços › Painel do cliente)
function enviarPagina(id, doc, atual, save, opcoes = {}) {
  let pasta = null, htmlArq = null;
  const slugIni = atual ? atual.id : slugEmp((doc.marca || doc.empresa || doc.nome) + (opcoes.frente ? "-painel" : ""));
  modal(atual ? `Substituir arquivos · ${atual.titulo || atual.id}` : opcoes.frente ? `Painel personalizado · ${FRENTES_UPE[opcoes.frente]}` : "Adicionar página ou sistema", `
    <div class="g3"><label class="f" for="epTipo">Tipo<select id="epTipo">${Object.entries(TIPOS_PAG).map(([k, l]) => `<option value="${k}" ${(atual?.tipo || opcoes.tipo || "landing") === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f" for="epNome">Nome<input id="epNome" value="${esc(atual?.titulo || (doc.marca || doc.empresa || "") + (opcoes.frente ? " · painel" : ""))}"></label>
      <label class="f" for="epSlug">Endereço<input id="epSlug" value="${esc(slugIni)}" ${atual ? "disabled" : ""} pattern="[a-z0-9][a-z0-9-]{1,47}"></label></div>
    <p class="muted small">Fica em <b>lp.upecriativo.com.br/<span id="epVer">${esc(slugIni)}</span>/</b>. Cada arquivo da pasta abre no mesmo caminho (ex.: <code>…/css/estilo.css</code>), então imagens, fontes, scripts e dados funcionam como no computador.</p>
    <div class="g3"><label class="tg" style="flex-direction:column;align-items:flex-start;gap:8px"><b>Pasta</b><small>A pasta inteira, com o .html e as pastas de imagens, fontes, CSS, scripts e dados.</small><input type="file" id="epPasta" webkitdirectory multiple></label>
      <label class="tg" style="flex-direction:column;align-items:flex-start;gap:8px"><b>Ou um .zip</b><small>A mesma pasta compactada. Ele é aberto aqui no navegador.</small><input type="file" id="epZip" accept=".zip,application/zip"></label>
      <label class="tg" style="flex-direction:column;align-items:flex-start;gap:8px"><b>Ou só o .html</b><small>Quando tudo está dentro do arquivo ou em links da internet.</small><input type="file" id="epHtml" accept=".html,.htm,text/html"></label></div>
    <div id="epEsc" class="g2" hidden><label class="f" for="epRaiz">Pasta a publicar<select id="epRaiz"></select></label><label class="f" for="epPrin">Página principal<select id="epPrin"></select></label></div>
    <div id="epInfo" class="muted small"></div>
    <div class="g2"><label class="tg"><input type="checkbox" id="epPub" ${!atual || atual.publicada ? "checked" : ""}><span>Publicar agora<small>Sem marcar, fica como rascunho (abre só pelo link de prévia)</small></span></label>
      ${opcoes.frente ? `<input type="checkbox" id="epPainel" hidden>` : `<label class="tg"><input type="checkbox" id="epPainel" ${atual?.painelCliente ? "checked" : ""}><span>Mostrar como painel do cliente<small>Vira o botão “Painel – ${esc(atual?.titulo || "Sistema")}” em Meus serviços</small></span></label>`}</div>`,
    `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="epOk">Enviar e ${atual ? "atualizar" : "criar"}</button>`, true);
  const info = t => $("#epInfo").innerHTML = t;
  const mostrar = () => {
    const raiz = $("#epRaiz").value, m = recortar(pasta, raiz), hs = htmlsDe(m), ant = $("#epPrin").value;
    $("#epPrin").innerHTML = hs.map(h => `<option value="${esc(h)}">${esc(h)}</option>`).join("");
    const pref = opcoes.frente ? hs.find(h => /painel|admin|gest/i.test(h)) : null; $("#epPrin").value = hs.includes(ant) ? ant : pref || hs[0] || "";
    info(hs.length ? `<b>${m.size} arquivo(s)</b> · ${tamanhoMB(m)} MB${hs.length > 1 ? ` · ${hs.length} páginas .html (todas sobem e abrem pelo caminho delas)` : ""}` : '<span class="bad">Não há arquivo .html nesta pasta.</span>');
  };
  const carregar = m => {
    pasta = m; htmlArq = null; $("#epHtml").value = "";
    const hs = htmlsDe(m); if (!hs.length) { pasta = null; $("#epEsc").hidden = true; return info('<span class="bad">Não encontrei nenhum arquivo .html.</span>'); }
    // subpastas com .html (ex.: um dossiê com "landing/" e "site/" dentro): dá para publicar só uma delas
    const dirs = [...new Set(hs.filter(h => h.includes("/")).map(h => h.split("/")[0] + "/"))];
    $("#epRaiz").innerHTML = `<option value="">Pasta inteira</option>` + dirs.map(d => `<option value="${esc(d)}">Só ${esc(d)}</option>`).join("");
    $("#epRaiz").value = !hs.some(h => !h.includes("/")) && dirs.length ? dirs[0] : "";
    $("#epEsc").hidden = false; mostrar();
  };
  $("#epRaiz").onchange = mostrar;
  $("#epSlug").oninput = e => $("#epVer").textContent = slugEmp(e.target.value);
  $("#epTipo").onchange = e => { if (e.target.value === "sistema" && !opcoes.frente) $("#epPainel").checked = true; };
  $("#epPasta").onchange = e => { $("#epZip").value = ""; carregar(pastaDeArquivos(e.target.files)); };
  $("#epZip").onchange = async e => { const f = e.target.files[0]; if (!f) return; $("#epPasta").value = ""; try { carregar(await lerZip(f, info)); } catch (er) { pasta = null; info(`<span class="bad">Não consegui abrir o .zip: ${esc(er.message)}</span>`); } };
  $("#epHtml").onchange = e => { htmlArq = e.target.files[0] || null; if (!htmlArq) return; pasta = null; $("#epPasta").value = ""; $("#epZip").value = ""; $("#epEsc").hidden = true; info(`Arquivo: <b>${esc(htmlArq.name)}</b> · ${(htmlArq.size / 1024).toFixed(0)} KB`); };
  $("#epOk").onclick = async () => {
    const slug = atual ? atual.id : slugEmp($("#epSlug").value), titulo = $("#epNome").value.trim() || slug, b = $("#epOk");
    if (!/^[a-z0-9][a-z0-9-]{1,47}$/.test(slug)) return toast("Endereço inválido: use letras, números e hífen");
    if (!pasta && !htmlArq) return toast("Escolha a pasta, o .zip ou o arquivo .html");
    if (S.mode === "firebase" && pasta && !S.st) return toast("O Storage não está ligado no painel (config.js)");
    b.disabled = true;
    try {
      if (!atual) { const ja = await S.get(`lp_paginas/${slug}`).catch(() => null); if (ja) { b.disabled = false; return toast("Esse endereço já está em uso. Escolha outro."); } }
      let html = "", n = 0, extra = { raiz: false, principal: "", htmls: [], pasta: "" };
      if (pasta) {
        const m = recortar(pasta, $("#epRaiz").value), prin = $("#epPrin").value;
        html = await m.get(prin).text();
        const pref = `clientes/${await pastaDoCliente(id, doc)}/paginas/${slug}`;
        n = await subirPasta(pref, m, t => b.textContent = t);
        extra = { raiz: true, principal: prin, htmls: htmlsDe(m).slice(0, 60), pasta: pref };
      } else html = await htmlArq.text();
      if (html.length > 900000) throw new Error("o HTML principal passa de 900 KB. Tire imagens embutidas (base64) do arquivo e deixe-as na pasta.");
      const agora = Date.now(), tipo = $("#epTipo").value, publicar = $("#epPub").checked, previa = atual?.previa || uid(16);
      const base = atual ? {} : { cid: id, suspensa: false, seo: { titulo }, whatsapp: { ativo: false, numero: "", mensagem: "Olá! Vim pela página " + titulo }, pixel: {}, criadoEm: agora };
      await S.set(`lp_paginas/${slug}`, { ...base, cid: id, titulo, tipo, html, ...extra, previa, publicada: publicar, ...(publicar ? { publicadoEm: agora } : {}), arquivos: n, painelCliente: $("#epPainel").checked, atualizadoEm: agora, enviadoPor: "upe" }, !!atual);
      await S.set(`lp_paginas/${slug}/privado/rascunho`, { html, em: agora });
      doc.temPaginas = true;
      if (opcoes.frente) { doc.paineis = doc.paineis || {}; doc.paineis[opcoes.frente] = { modo: "personalizado", slug, arquivo: extra.principal, nome: titulo, previa, em: agora }; }
      dlg.close(); await save(`${TIPOS_PAG[tipo]} ${publicar ? "no ar" : "salva como rascunho"}${n ? ` com ${n} arquivo(s)` : ""}: lp.upecriativo.com.br/${slug}/${opcoes.frente ? ` · agora é o painel de ${FRENTES_UPE[opcoes.frente]}` : ""}`);
    } catch (e) { console.error(e); toast("Não foi possível enviar: " + (e.message || e)); b.disabled = false; b.textContent = `Enviar e ${atual ? "atualizar" : "criar"}`; }
  };
}

/* ---------- cliente: Meus serviços (o que contratou e os botões “Painel – …”) ---------- */
async function servicosDoCliente(c) {
  const { id, doc } = c, apps = doc.apps || {}, out = [], cat = appsCat(state.cfg);
  const nomeLoja = apps.erp?.loja || apps.erp?.empresa || "";
  if (ativoApp(apps.erp)) out.push({ frente: "erp", nome: "Loja online", sub: (cat.erp.planos.find(p => p.k === apps.erp.plano) || {}).nome || "", status: apps.erp.status,
    botoes: [[`Painel – Loja ${doc.marca || nomeLoja}`, `#/c/s-erp`], ...(nomeLoja ? [["Ver a loja ↗", apps.erp.dominio ? "https://" + apps.erp.dominio : LOJA_URL + (apps.erp.loja || nomeLoja), true]] : [])] });
  let pgs = [];
  if (ativoApp(apps.landing) || ativoApp(apps.sistemas)) pgs = (await S.query("lp_paginas", "cid", id).catch(() => [])).filter(p => p.publicada || p.painelCliente);
  if (ativoApp(apps.landing)) out.push({ frente: "landing", nome: "Landing pages e sites", sub: (cat.landing.planos.find(p => p.k === apps.landing.plano) || {}).nome || "", status: apps.landing.status,
    botoes: [["Painel – Páginas (editar, visitas e leads)", "#/c/s-landing"], ...pgs.filter(p => p.tipo !== "sistema").map(p => [`Ver ${p.titulo || p.id} ↗`, p.dominio ? "https://" + p.dominio : LP_URL + p.id, true])] });
  if (ativoApp(apps.sistemas)) out.push({ frente: "sistemas", nome: "Agenda e dashboards", sub: (apps.sistemas.modulos || ["agenda", "dash"]).map(m => m === "agenda" ? "Agenda online" : "Dashboards").join(" · "), status: apps.sistemas.status,
    botoes: [["Painel – Agenda e dashboards", "#/c/s-sistemas"]] });
  pgs.filter(p => p.tipo === "sistema" || p.painelCliente).forEach(p => out.push({ frente: "app", nome: p.titulo || p.id, sub: TIPOS_PAG[p.tipo] || "Sistema", status: p.publicada ? "ativo" : "pendente",
    botoes: [[`Painel – ${p.titulo || p.id}`, `#/c/app/${encodeURIComponent(p.id)}`], ["Abrir em outra aba ↗", p.dominio ? "https://" + p.dominio : LP_URL + p.id, true]] }));
  if (doc.plano?.branding || doc.plano?.midias || doc.plano?.grafica) out.unshift({ frente: "branding", nome: "Branding e mídias", sub: ["branding", "midias", "grafica"].filter(k => doc.plano?.[k]).map(k => ({ branding: "Branding", midias: "Mídias digitais", grafica: "Papelaria gráfica" })[k]).join(" · "), status: "ativo",
    botoes: [...(doc.acesso?.apresentacao && doc.apresentacao ? [["Apresentação da marca", "#/c/apresentacao"]] : []), ...(doc.plano?.midias && doc.acesso?.calendario ? [["Posts para aprovar", "#/c/conteudo"]] : []), ...(temPainelProprio(doc, "branding") ? [["Painel da marca", "#/c/s-branding"]] : [])] });
  return out;
}
const cardsServicos = svs => svs.length ? `<div class="g2 meus">${svs.map(sv => `<article class="card grid"><div class="spread"><div class="grid" style="gap:2px"><h3>${esc(sv.nome)}</h3>${sv.sub ? `<span class="muted small">${esc(sv.sub)}</span>` : ""}</div>${sv.frente === "branding" ? "" : astPill(sv.status)}</div>
  <div class="row">${sv.botoes.map(([l, h, fora], k) => `<a class="btn ${k ? "sec" : ""} sm" href="${esc(h)}" ${fora ? 'target="_blank" rel="noopener"' : ""}>${esc(l)}</a>`).join("")}</div></article>`).join("")}</div>` : `<div class="empty">Nenhum serviço ativo ainda. Fale com a Upe para começar.</div>`;
async function cMeusServicos(m, c) {
  const svs = await servicosDoCliente(c);
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Meus serviços</span><h1>O que você tem com a Upe</h1><p class="muted small">Cada serviço tem o seu painel. Os pagamentos de todos ficam em <a href="#/c/pagamentos">Pagamentos</a> e as conversas com a Upe em <a href="#/c/mensagens">Falar com a Upe</a>.</p></div>
    ${cardsServicos(svs)}
    <details class="card"><summary><b>Conhecer outros serviços da Upe</b></summary><div id="outros" style="margin-top:12px"></div></details>`;
  cApps($("#outros", m), c);
  const h = $("#outros h1", m); if (h) h.textContent = "Outros serviços";
}
// sistema ou página marcada como painel do cliente, aberta dentro do painel central
async function cAppProprio(m, c, slug) {
  const p = (await S.query("lp_paginas", "cid", c.id).catch(() => [])).find(x => x.id === slug);
  if (!p) { m.innerHTML = `<div class="empty"><b>Painel não encontrado.</b><a class="btn sec" href="#/c/servicos">Voltar</a></div>`; return; }
  const url = p.dominio ? "https://" + p.dominio : urlPagina(p);
  m.innerHTML = `<a href="#/c/servicos" class="small">← Meus serviços</a><div class="spread"><h1>${esc(p.titulo || p.id)}</h1><a class="btn sec sm" href="${esc(url)}" target="_blank" rel="noopener">Abrir em outra aba ↗</a></div>
    <iframe class="svc-frame" src="${esc(url)}" title="${esc(p.titulo || p.id)}" allow="clipboard-write; fullscreen"></iframe>`;
}
