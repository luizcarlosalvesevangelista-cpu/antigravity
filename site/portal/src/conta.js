/* ===== Conta única do cliente (incluído dentro do app.js) =====
   Um cadastro (ficha do cliente), um login (e-mail e senha do Firebase) e um painel com todos os serviços contratados.
   - Admin › ficha › Serviços: liga cada frente e, ao salvar, libera o acesso dos apps com o e-mail do cliente:
       portal_convites/{email} (painel central) · ERP: empresas/{empresa} + convites/{email} + upe/gestao/clientes/{Cxxxx} ·
       Landing pages e Sistemas: srv_clientes/{id do cliente} + srv_convites/{email} · TV: código do anunciante.
   - Cliente: entra com o e-mail; no primeiro login o painel cria portal_acessos/{uid} e, quando houver convite, acessos/{uid} (ERP)
     e srv_acessos/{uid} (Serviços). Cada serviço abre dentro do painel (mesmo endereço, então o login vale para todos).
   - Painel personalizado: para qualquer frente, a Upe pode subir um HTML próprio (paineis_cliente/{id}_{frente}); ele abre isolado
     (sandbox) e só conversa com a subseção de pagamentos daquela frente (postMessage). */
const APP_URL = { erp: "../apps/painel/", landing: "../apps/servicos/", sistemas: "../apps/servicos/", tv: "../apps/tv/" };
const FRENTE_COB = { branding: "Branding e mídias", erp: "Upe ERP", tv: "Upe TV", landing: "Landing pages", sistemas: "Upe Sistemas" };
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
  if (ativoApp(apps.tv)) msgs.push(apps.tv.codigo ? `Upe TV ligado ao anunciante ${apps.tv.codigo}` : "Upe TV sem anunciante: escolha o anunciante na ficha");
  return msgs;
}
const msgAcesso = (doc, priv) => `Olá, ${(doc.nome || "").split(" ")[0]}! O seu painel da Upe Criativo está pronto.\n\nEndereço: ${portalUrl()}\nE-mail: ${priv.email}\n\nNo primeiro acesso, toque em “Primeiro acesso: criar a minha senha” e confirme o e-mail. Por lá você acompanha todos os seus serviços e faz os pagamentos.`;

/* ---------- admin: ficha do cliente › Serviços ---------- */
async function aClienteApps(ct, { id, doc, priv, acoes, save }) {
  await carregarFontes();
  const cat = appsCat(state.cache.pub), peds = appPedidos(doc, acoes), advs = (state.fontes.tvCfg || {}).advertisers || [];
  doc.apps = doc.apps || {}; doc.paineis = doc.paineis || {};
  // domínios próprios: loja (lojas_dominios, conectado aqui) e landing pages (lp_dominios, pedidos pelo cliente no painel)
  const erp0 = doc.apps.erp || {}, [lojas, lpDoms, lojaDom] = await Promise.all([
    S.list("lojas").then(l => l.filter(x => x.empresa && x.empresa === erp0.empresa)).catch(() => []),
    S.list("lp_dominios").then(l => l.filter(x => x.cid === id)).catch(() => []),
    erp0.dominio ? S.get(`lojas_dominios/${erp0.dominio}`).catch(() => null) : null]);
  const stDom = d => !d ? "" : d.status === "ativo" ? '<span class="pill ok">Conectado</span>' : d.status === "dns" ? '<span class="pill info">Falta o DNS do cliente</span>' : d.status === "conectar" ? '<span class="pill info">Conectando…</span>' : '<span class="pill warn">Pendente</span>';
  const dnsBox = d => d && d.dns && d.status !== "ativo" ? `<pre class="dnsbox">${esc(d.dns)}</pre>` : d && d.erro ? `<span class="muted small">Erro: ${esc(d.erro)}</span>` : "";
  const precoTxt = e => +e.preco ? brl(e.preco) + (e.unico ? " único" : "/mês") : "sob consulta";
  const painelBox = k => { const p = doc.paineis[k] || {}; return `<div class="grid painel-op" style="gap:6px"><span class="eb">Painel do cliente</span>
      <div class="row small" style="gap:12px"><label class="row" style="gap:6px"><input type="radio" name="pm-${k}" value="padrao" ${p.modo !== "personalizado" ? "checked" : ""}>${k === "branding" ? "Portal padrão" : "Painel padrão do app"}</label><label class="row" style="gap:6px"><input type="radio" name="pm-${k}" value="personalizado" ${p.modo === "personalizado" ? "checked" : ""}>Painel em branco (HTML próprio)</label></div>
      <div class="row small" data-pp="${k}" ${p.modo === "personalizado" ? "" : "hidden"}><input type="file" accept=".html,.htm,text/html" data-pf="${k}" aria-label="HTML do painel personalizado"><span class="muted">${p.nome ? `Atual: <b>${esc(p.nome)}</b> · ${fdt(p.em)}` : "Nenhum HTML enviado"}</span>${p.nome ? `<button class="btn sec sm" data-pv="${k}">Ver</button>` : ""}</div>
      <span class="muted small" data-pp="${k}" ${p.modo === "personalizado" ? "" : "hidden"}>O HTML abre isolado no painel do cliente, ao lado da aba Pagamentos desta frente. Ele pode pedir os dados do cliente e abrir os pagamentos com <code>parent.postMessage({ upe: "pagamentos" }, "*")</code>.</span></div>`; };
  const linkCampos = k => {
    const a = doc.apps[k] || {};
    if (k === "erp") return `<label class="f">Endereço da empresa no ERP<input data-k="empresa" value="${esc(a.empresa || "")}" placeholder="${esc(slugEmp(doc.marca || doc.empresa || doc.nome))}"></label>
      <div class="g2"><label class="f">Domínio próprio da loja<input data-k="dominio" value="${esc(a.dominio || "")}" placeholder="www.lojadocliente.com.br"></label>
      <label class="f">Loja que ele abre<select data-k="loja">${lojas.length ? lojas.map(l => `<option value="${esc(l.id)}" ${a.loja === l.id ? "selected" : ""}>${esc(l.nome || l.id)} · loja.upecriativo.com.br/${esc(l.id)}</option>`).join("") : `<option value="${esc(a.loja || "")}">${a.loja ? esc(a.loja) : "a loja aparece quando o cliente publicar"}</option>`}</select></label></div>
      ${a.dominio ? `<div class="row small">${stDom(lojaDom)}<span class="muted">${esc(a.dominio)}</span>${lojaDom && lojaDom.status === "ativo" ? `<a class="btn sec sm" href="https://${esc(a.dominio)}" target="_blank" rel="noopener">Abrir</a>` : ""}</div>${dnsBox(lojaDom)}` : `<span class="muted small">Com domínio, ao salvar a Upe conecta sozinha e os registros de DNS aparecem aqui e no painel do cliente.</span>`}`;
    if (k === "landing") return lpDoms.length ? `<div class="grid" style="gap:6px"><span class="eb">Domínios das páginas</span>${lpDoms.map(d => `<div class="grid" style="gap:4px"><div class="row small">${stDom(d)}<b>${esc(d.id)}</b><span class="muted">→ /${esc(d.slug || "")}</span>${d.status === "pendente" ? `<button class="btn sec sm" data-lpcon="${esc(d.id)}">Conectar agora</button>` : ""}</div>${dnsBox(d)}</div>`).join("")}</div>` : `<span class="muted small">O cliente pede o domínio das páginas no painel (Landing pages › Domínio próprio); ele aparece aqui para conectar.</span>`;
    if (k === "tv") return `<label class="f">Anunciante no Upe TV<select data-k="codigo"><option value="">— escolha —</option>${a.codigo && !advs.some(v => v.code === a.codigo) ? `<option value="${esc(a.codigo)}" selected>${esc(a.codigo)}</option>` : ""}${advs.map(v => `<option value="${esc(v.code)}" ${a.codigo === v.code ? "selected" : ""}>${esc(v.name)} · ${esc(v.code)}</option>`).join("")}</select></label>${advs.length ? "" : `<span class="muted small">Cadastre o anunciante no Upe TV para ligar aqui.</span>`}`;
    if (k === "sistemas") { const mo = a.modulos && a.modulos.length ? a.modulos : ["agenda", "dash"]; return `<div class="row small" style="gap:12px"><label class="row" style="gap:6px"><input type="checkbox" data-mod="agenda" ${mo.includes("agenda") ? "checked" : ""}>Agenda online</label><label class="row" style="gap:6px"><input type="checkbox" data-mod="dash" ${mo.includes("dash") ? "checked" : ""}>Dashboards</label></div>`; }
    return "";
  };
  ct.innerHTML = `${peds.filter(p => p.status === "novo").length ? `<section class="card grid prio"><b>Pedidos do cliente</b>${peds.filter(p => p.status === "novo").map(p => `<div class="row" style="flex-wrap:nowrap"><span style="flex:1">${esc(cat[p.app]?.nome || p.app)}${p.extra ? ` · extra <b>${esc((cat[p.app]?.extras.find(e => e.k === p.extra) || {}).nome || p.extra)}</b>` : " · contratar"} <span class="muted small">${fdt(p.em)}</span></span><button class="btn sec sm" data-pok="${esc(p.id)}">Marcar como atendido</button></div>`).join("")}</section>` : ""}
    <section class="card grid"><div class="spread"><h3>Acesso do cliente</h3><span class="muted small">Um login para todos os serviços: o painel central abre a loja, a TV, as landing pages e a agenda.</span></div>
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
      return `<section class="card grid" data-app="${k}" data-frente="${k}"><div class="spread"><h3>${esc(c.nome)}</h3>${ativoApp(a) ? astPill(a.status) : '<span class="pill">Sem adesão</span>'}</div>
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
  const htmlNovo = {};
  const collect = () => {
    APP_IDS.forEach(k => { const box = $(`[data-app="${k}"]`, ct); const v = n => ($(`[data-k="${n}"]`, box) || {}).value || "";
      const st = v("status"); if (!st) { if (doc.apps[k]) doc.apps[k] = { ...doc.apps[k], status: "cancelado" }; return; }
      const mods = $$("[data-mod]", box).filter(i => i.checked).map(i => i.dataset.mod);
      doc.apps[k] = { ...(doc.apps[k] || {}), status: st, plano: v("plano"), extras: $$("[data-ex]", box).filter(i => i.checked).map(i => i.dataset.ex), dia: +v("dia") || 10, ajuste: +v("ajuste") || 0, inicio: v("inicio"), fimTeste: v("fimTeste"), obs: v("obs").trim(),
        ...(k === "erp" ? { empresa: slugEmp(v("empresa") || doc.apps[k]?.empresa || doc.marca || doc.empresa || doc.nome), dominio: lower(v("dominio")).replace(/^https?:\/\//, "").replace(/\/.*$/, ""), loja: v("loja") } : {}), ...(k === "tv" ? { codigo: v("codigo") } : {}), ...(k === "sistemas" ? { modulos: mods.length ? mods : ["agenda", "dash"] } : {}) }; });
    ["branding", ...APP_IDS].forEach(k => { const r = $(`input[name="pm-${k}"]:checked`, ct); if (!r) return; doc.paineis[k] = { ...(doc.paineis[k] || {}), modo: r.value }; });
    priv.email = lower($("#svEmail").value);
  };
  ct.querySelectorAll("[data-app] input, [data-app] select").forEach(i => i.addEventListener("input", () => { collect(); APP_IDS.forEach(k => { const t = $(`[data-app="${k}"] [data-tot]`, ct); if (t && doc.apps[k]) t.textContent = brl(valorAdesao(cat, k, doc.apps[k])) + "/mês"; }); }));
  $$('input[type=radio][name^="pm-"]', ct).forEach(r => r.onchange = () => { const k = r.name.slice(3); $$(`[data-pp="${k}"]`, ct).forEach(x => x.hidden = r.value !== "personalizado"); });
  $$("[data-pf]", ct).forEach(inp => inp.onchange = async () => { const f = inp.files[0]; if (!f) return; if (f.size > 900000) { inp.value = ""; return toast("O HTML passa de 900 KB. Coloque imagens e vídeos em links."); }
    htmlNovo[inp.dataset.pf] = { nome: f.name, html: await f.text() }; toast(`${f.name} pronto: clique em Salvar`); });
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
      for (const [k, h] of Object.entries(htmlNovo)) { await S.set(`paineis_cliente/${id}_${k}`, { cliente: id, frente: k, html: h.html, nome: h.nome, em: Date.now() }); doc.paineis[k] = { ...(doc.paineis[k] || {}), modo: "personalizado", nome: h.nome, em: Date.now() }; }
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
  m.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Seus serviços</span><h1>${esc(nome)}</h1>${frente !== "branding" && a.status ? `<div class="row">${astPill(a.status)}${a.status === "teste" && a.fimTeste ? `<span class="muted small">teste grátis até ${fdate(a.fimTeste)}</span>` : ""}</div>` : ""}</div>
      <nav class="subtabs"><a class="tab" href="#/c/s-${frente}" ${aba === "painel" ? 'aria-current="page"' : ""}>Painel</a><a class="tab" href="#/c/s-${frente}/pagamentos" ${aba === "pagamentos" ? 'aria-current="page"' : ""}>Pagamentos</a></nav></div>
    <div id="svc"></div>`;
  const box = $("#svc", m);
  if (aba === "pagamentos") return cPagamentos(box, c, { frente, embutido: true });
  if (proprio) {
    const d = await S.get(`paineis_cliente/${id}_${frente}`).catch(() => null);
    if (!d) { box.innerHTML = `<div class="empty"><b>Painel em preparação.</b><span>${S.mode === "firebase" && !S.contaAtual() ? "Entre com o seu e-mail para ver este painel." : "A Upe está montando o seu painel. Os pagamentos já estão na aba ao lado."}</span>${S.mode === "firebase" && !S.contaAtual() ? `<button class="btn" id="kLogin">Entrar com e-mail</button>` : ""}</div>`; if ($("#kLogin")) $("#kLogin").onclick = () => { ss.set("upe-cliente", null); gateConta(); }; return; }
    box.innerHTML = `<iframe class="svc-frame pp" sandbox="allow-scripts allow-forms allow-popups allow-downloads" title="${esc(nome)}"></iframe>`;
    const fr = $("iframe", box), cobs = cobrancasFrente(c, frente);
    const dados = { upe: "cliente", nome: doc.nome || "", marca: doc.marca || doc.empresa || "", frente, status: a.status || "", emAberto: cobs.filter(x => x.st === "aberta").length, totalEmAberto: cobs.filter(x => x.st === "aberta").reduce((s, x) => s + (+x.valor || 0), 0) };
    const ouvir = e => { if (e.source !== fr.contentWindow || !e.data || typeof e.data !== "object") return;
      if (e.data.upe === "pagamentos") go(`#/c/s-${frente}/pagamentos`);
      else if (e.data.upe === "dados") fr.contentWindow.postMessage(dados, "*");
      else if (e.data.upe === "altura" && +e.data.h > 200) fr.style.height = Math.min(6000, +e.data.h) + "px"; };
    window.addEventListener("message", ouvir); const off = () => { window.removeEventListener("message", ouvir); window.removeEventListener("hashchange", off); }; window.addEventListener("hashchange", off);
    fr.onload = () => fr.contentWindow.postMessage(dados, "*");
    fr.srcdoc = d.html; return;
  }
  if (frente === "branding") return go("#/c/inicio");
  const precisaLogin = frente !== "tv" && S.mode === "firebase" && !S.contaAtual();
  if (precisaLogin) { box.innerHTML = `<div class="empty"><b>Entre com o seu e-mail para abrir este painel.</b><span>O código de acesso vale só para o portal de branding. Os apps usam o login com e-mail (o mesmo para todos).</span><button class="btn" id="kLogin">Entrar com e-mail</button></div>`; $("#kLogin").onclick = () => { ss.set("upe-cliente", null); gateConta(); }; return; }
  if (frente === "erp" && a.dominio) {
    const d = await S.get(`lojas_dominios/${a.dominio}`).catch(() => null);
    if (d && d.status === "dns") box.insertAdjacentHTML("beforebegin", `<section class="card grid prio"><b>Falta um passo para ${esc(a.dominio)} abrir a sua loja</b><p class="small">No painel de onde o domínio foi registrado (Registro.br, GoDaddy, Hostinger…), crie estes registros de DNS. Em até 24 horas a loja abre com cadeado (HTTPS).</p><pre class="dnsbox">${esc(d.dns || "")}</pre></section>`);
    else if (d && d.status === "ativo") box.insertAdjacentHTML("beforebegin", `<p class="small">Sua loja: <a href="https://${esc(a.dominio)}" target="_blank" rel="noopener">${esc(a.dominio)}</a></p>`);
  }
  if (frente === "tv" && !a.codigo) { box.innerHTML = `<div class="empty"><b>Upe TV em preparação.</b><span>Assim que a sua campanha for cadastrada, os relatórios das telas aparecem aqui.</span></div>`; return; }
  const adm = state.admin && ss.get("upe-voltar");
  const q = new URLSearchParams({ embed: "1" });
  if (frente === "landing" || frente === "sistemas") { q.set("frente", frente); if (adm) q.set("cid", id); }
  if (frente === "erp" && adm && a.empresa) q.set("empresa", a.empresa);
  if (S.mode === "demo") q.set("demo", "1");
  const url = APP_URL[frente] + "?" + q.toString() + (frente === "tv" ? "#cliente-" + encodeURIComponent(a.codigo) : "");
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
