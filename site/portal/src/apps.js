/* ===== Apps Extra: Upe ERP, Upe TV e Upe Landing pages (incluído dentro do app.js) =====
   Catálogo em config/publico.apps (preços públicos, editáveis no painel).
   Adesão de cada cliente em clientes/{id}.apps[app] = { status, plano, extras[], dia, inicio, fimTeste, ajuste, obs }.
   Pedidos do cliente: ação "pedido" com alvo "app:<app>[:<extra>]". */
const APPS_PADRAO = {
  erp: { nome: "Upe ERP", desc: "Loja online, PDV e pedidos num só painel.", painel: "https://upe-criativo-painel.web.app", gestor: "https://upe-criativo-gestao.web.app", site: "https://upe-criativo-erp.web.app", lojas: "https://upe-criativo-lojas.web.app", teste: 14,
    planos: [{ k: "mensal", nome: "Plano mensal", preco: 49.99 }, { k: "upe", nome: "Cliente Upe (com branding ou mídias)", preco: 34.99 }],
    extras: [
      { k: "B", nome: "Banco de dados ampliado", desc: "Até 5.000 produtos e 2 GB de fotos.", preco: 9.9 },
      { k: "S", nome: "Servidor de integração", desc: "Até 3 integrações reais (pagamento, marketplace, ERP).", preco: 19.9 },
      { k: "F", nome: "API de frete e etiquetas", desc: "Cotação real na loja; etiquetas pagas à parte.", preco: 9.9 },
      { k: "E", nome: "Envio de e-mails", desc: "Newsletter real, até 5.000 e-mails por mês.", preco: 14.9 },
      { k: "K", nome: "Backup diário", desc: "Cópia diária guardada por 30 dias.", preco: 4.9 },
      { k: "D", nome: "Domínio próprio da loja", desc: "1 domínio com SSL; o registro é do cliente.", preco: 7.9 }] },
  tv: { nome: "Upe TV", desc: "A marca do cliente nas telas de estabelecimentos parceiros, com QR code.", painel: "https://upe-criativo-tv.web.app", teste: 0,
    planos: [{ k: "rodape", nome: "Rodapé", preco: 0 }, { k: "lateral", nome: "Lateral", preco: 0 }, { k: "cheia", nome: "Tela cheia", preco: 0 }, { k: "vitrine", nome: "Combo Vitrine", preco: 0 }, { k: "destaque", nome: "Combo Destaque", preco: 0 }, { k: "total", nome: "Presença Total", preco: 0 }, { k: "rede", nome: "Rede Upe", preco: 0 }],
    extras: [{ k: "cta", nome: "Página CTA + QR", desc: "Página da marca feita pela Upe, com QR e contagem de visitas.", preco: 0 }, { k: "motion", nome: "Motion do anúncio", desc: "Vídeo animado com a marca para as telas.", preco: 0 }, { k: "telas", nome: "Tela parceira adicional", desc: "Mais um estabelecimento na campanha.", preco: 0 }] },
  landing: { nome: "Upe Landing pages", desc: "Páginas de venda com a identidade do cliente.", painel: "", teste: 0, breve: true, planos: [], extras: [] }
};
const APP_IDS = ["erp", "tv", "landing"];
const AST = { teste: ["Em teste", "info"], ativo: ["Ativo", "ok"], pendente: ["Aguardando pagamento", "warn"], pausado: ["Pausado", ""], cancelado: ["Cancelado", ""] };
const astPill = s => { const [l, c] = AST[s] || [s, ""]; return `<span class="pill ${c}">${esc(l)}</span>`; };
function appsCat(pub) { const c = clone(APPS_PADRAO), o = (pub || {}).apps || {}; APP_IDS.forEach(k => { if (o[k]) c[k] = { ...c[k], ...o[k] }; if (/upe-(erp|tv)[.-]/.test(c[k].painel || "")) c[k].painel = APPS_PADRAO[k].painel; }); return c; }
const adesoes = doc => Object.entries(doc.apps || {}).filter(([, a]) => a && a.status && a.status !== "cancelado");
function valorAdesao(cat, app, a) {
  const c = cat[app] || { planos: [], extras: [] }, pl = c.planos.find(p => p.k === a.plano);
  return Math.round(((pl ? +pl.preco : 0) + (a.extras || []).reduce((s, k) => s + (+(c.extras.find(e => e.k === k) || {}).preco || 0), 0) + (+a.ajuste || 0)) * 100) / 100;
}
function proxVenc(a) { const d = new Date(todayIso() + "T12:00"), dia = Math.min(28, +a.dia || 10); let v = new Date(d.getFullYear(), d.getMonth(), dia, 12); if (v < d) v = new Date(d.getFullYear(), d.getMonth() + 1, dia, 12); return isoDay(v); }
const refMes = (app, venc) => `app-${app}-${venc.slice(0, 7)}`;
const appPedidos = (doc, acoes) => acoes.filter(a => a.tipo === "pedido" && String(a.alvo || "").startsWith("app:")).map(a => { const [, app, ex] = a.alvo.split(":"); return { ...a, app, extra: ex || "", status: doc.pedidosAdm?.[a.id]?.status || "novo" }; }).sort((x, y) => y.em - x.em);
function cobrancaApp(cat, doc, app, a) {
  const venc = proxVenc(a), ref = refMes(app, venc);
  if ((doc.cobrancas || []).some(c => c.ref === ref)) return null;
  const c = cat[app], pl = c.planos.find(p => p.k === a.plano), ex = (a.extras || []).map(k => (c.extras.find(e => e.k === k) || {}).nome).filter(Boolean);
  const cob = { id: uid(8), ref, app, descricao: `${c.nome} · ${pl ? pl.nome : "plano"}${ex.length ? " + " + ex.join(", ") : ""} · ${MESES[+venc.slice(5, 7) - 1]}`, valor: valorAdesao(cat, app, a), vencimento: venc, liberada: true, status: "aberta", pix: true, cartao: true, linkCartao: "", liberadaEm: Date.now() };
  doc.cobrancas = [...(doc.cobrancas || []), cob]; return cob;
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

/* ---------- admin: menu Apps Extra ---------- */
function aApps(w, app = "erp") {
  const cat = appsCat(state.cache.pub), c = cat[app] || cat.erp, clients = state.cache.clients;
  const ade = clients.map(cl => ({ cl, a: (cl.doc.apps || {})[app] })).filter(x => x.a && x.a.status && x.a.status !== "cancelado");
  const mrr = ade.filter(x => x.a.status === "ativo").reduce((s, x) => s + valorAdesao(cat, app, x.a), 0);
  const peds = clients.flatMap(cl => appPedidos(cl.doc, cl.acoes).filter(p => p.app === app).map(p => ({ ...p, cl })));
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Apps Extra</span><h1>${esc(c.nome)}</h1><p class="muted small">${esc(c.desc)}</p></div>
      <div class="row">${c.gestor ? `<a class="btn sec" href="${esc(c.gestor)}" target="_blank" rel="noopener">Gerenciador do ERP</a>` : ""}${c.site ? `<a class="btn sec" href="${esc(c.site)}" target="_blank" rel="noopener">Página de vendas</a>` : ""}${c.painel ? `<a class="btn sec" href="${esc(c.painel)}" target="_blank" rel="noopener">Abrir o painel do app</a>` : ""}${!c.breve ? `<button class="btn" id="apCob">Gerar cobranças do mês</button>` : ""}</div></div>
    ${admLinks(app)}
    <nav class="subtabs">${APP_IDS.map(k => `<a class="tab" href="#/admin/apps/${k}" ${k === app ? 'aria-current="page"' : ""}>${esc(cat[k].nome)}${cat[k].breve ? ' <span class="pill" style="margin-left:6px">em breve</span>' : ""}</a>`).join("")}</nav>
    ${c.breve ? `<section class="card grid"><h3>Em breve</h3><p class="muted">O Upe Landing pages entra aqui com o mesmo esquema dos outros apps: catálogo, adesão do cliente, cobrança única no portal e agenda unificada. Já dá para montar o catálogo abaixo e registrar o interesse dos clientes.</p></section>` : `
    <div class="g4"><div class="card stat"><b>${ade.filter(x => x.a.status === "ativo").length}</b><span>clientes ativos</span></div><div class="card stat"><b>${ade.filter(x => x.a.status === "teste").length}</b><span>em teste</span></div><div class="card stat"><b>${brl(mrr)}</b><span>por mês (ativos)</span></div><div class="card stat"><b>${peds.filter(p => p.status === "novo").length}</b><span>pedidos novos</span></div></div>`}
    ${peds.length ? `<section class="card grid"><h3>Pedidos dos clientes</h3><div class="tbl"><table><thead><tr><th>Data</th><th>Cliente</th><th>Pedido</th><th>Status</th><th></th></tr></thead><tbody>${peds.map(p => `<tr><td class="num">${fdt(p.em)}</td><td>${esc(p.cl.doc.marca || p.cl.doc.nome)}</td><td>${p.extra ? `Extra: <b>${esc((c.extras.find(e => e.k === p.extra) || {}).nome || p.extra)}</b>` : `<b>Contratar ${esc(c.nome)}</b>`}${p.texto ? `<br><span class="muted small">${esc(p.texto)}</span>` : ""}</td><td>${pill(p.status)}</td><td><a class="btn sec sm" href="#/admin/cliente/${p.cl.id}/apps">Abrir adesão</a></td></tr>`).join("")}</tbody></table></div></section>` : ""}
    ${!c.breve ? `<section class="card grid"><h3>Clientes com o app</h3>${ade.length ? `<div class="tbl"><table><thead><tr><th>Cliente</th><th>Plano e extras</th><th>Status</th><th>Mensal</th><th>Próximo vencimento</th><th></th></tr></thead><tbody>${ade.map(({ cl, a }) => `<tr><td><b>${esc(cl.doc.marca || cl.doc.nome)}</b></td><td class="small">${esc((c.planos.find(p => p.k === a.plano) || {}).nome || "—")}${(a.extras || []).length ? `<br><span class="muted">+ ${esc(a.extras.map(k => (c.extras.find(e => e.k === k) || {}).nome || k).join(", "))}</span>` : ""}</td><td>${astPill(a.status)}${a.status === "teste" && a.fimTeste ? `<br><span class="muted small">até ${fdate(a.fimTeste)}</span>` : ""}</td><td class="num">${brl(valorAdesao(cat, app, a))}</td><td class="num">${a.status === "ativo" || a.status === "pendente" ? fdate(proxVenc(a)) : "—"}</td><td><a class="btn sec sm" href="#/admin/cliente/${cl.id}/apps">Editar</a></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nenhum cliente com ${esc(c.nome)} ainda. Ative pela ficha do cliente → Apps Extra.</p>`}</section>` : ""}
    <section class="card grid"><div class="spread"><h3>Catálogo e preços</h3><span class="muted small">Aparece para os clientes no portal, em “Apps Upe”.</span></div>
      <div class="g2"><label class="f" for="apNome">Nome<input id="apNome" value="${esc(c.nome)}"></label><label class="f" for="apPainel">Endereço do painel do app<input id="apPainel" value="${esc(c.painel || "")}" placeholder="https://…"></label></div>
      <label class="f" for="apDesc">Descrição<input id="apDesc" value="${esc(c.desc)}"></label>
      <div class="g2"><label class="f" for="apTeste">Dias de teste grátis<input id="apTeste" type="number" min="0" value="${esc(c.teste || 0)}"></label><label class="tg" style="align-self:end"><input type="checkbox" id="apBreve" ${c.breve ? "checked" : ""}><span>Em breve<small>Mostra no portal sem permitir a contratação</small></span></label></div>
      <span class="eb">Planos</span><div class="grid" style="gap:6px" id="apPl">${c.planos.map((p, i) => rowCat("pl", i, p, false)).join("")}</div><div><button class="btn sec sm" id="apPlAdd">Adicionar plano</button></div>
      <span class="eb">Extras</span><div class="grid" style="gap:6px" id="apEx">${c.extras.map((e, i) => rowCat("ex", i, e, true)).join("")}</div><div><button class="btn sec sm" id="apExAdd">Adicionar extra</button></div>
      <p class="muted small">Preço 0 aparece como “sob consulta”.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" id="apSv">Salvar catálogo</button></div></section>`;
  const read = () => ({ ...c, nome: $("#apNome").value.trim() || c.nome, painel: $("#apPainel").value.trim(), desc: $("#apDesc").value.trim(), teste: +$("#apTeste").value || 0, breve: $("#apBreve").checked,
    planos: $$("[data-pl-n]", w).map((i, k) => ({ k: $(`[data-pl-k="${k}"]`, w).value.trim() || uid(4), nome: i.value.trim(), preco: +$(`[data-pl-p="${k}"]`, w).value || 0 })).filter(p => p.nome),
    extras: $$("[data-ex-n]", w).map((i, k) => ({ k: $(`[data-ex-k="${k}"]`, w).value.trim() || uid(4), nome: i.value.trim(), desc: $(`[data-ex-d="${k}"]`, w).value.trim(), preco: +$(`[data-ex-p="${k}"]`, w).value || 0 })).filter(p => p.nome) });
  const salvar = async nc => { const pub = { ...(state.cache.pub || {}) }; pub.apps = { ...(pub.apps || {}), [app]: nc }; await S.set("config/publico", pub); state.cache.pub = pub; toast("Catálogo salvo"); reAdmin(); };
  $("#apSv").onclick = () => salvar(read());
  $("#apPlAdd").onclick = () => { const nc = read(); nc.planos.push({ k: uid(4), nome: "Novo plano", preco: 0 }); state.cache.pub = { ...(state.cache.pub || {}), apps: { ...((state.cache.pub || {}).apps || {}), [app]: nc } }; aApps(w, app); };
  $("#apExAdd").onclick = () => { const nc = read(); nc.extras.push({ k: uid(4), nome: "Novo extra", desc: "", preco: 0 }); state.cache.pub = { ...(state.cache.pub || {}), apps: { ...((state.cache.pub || {}).apps || {}), [app]: nc } }; aApps(w, app); };
  $$("[data-del]", w).forEach(b => b.onclick = () => { const [t, i] = b.dataset.del.split(":"), nc = read(); nc[t === "pl" ? "planos" : "extras"].splice(+i, 1); state.cache.pub = { ...(state.cache.pub || {}), apps: { ...((state.cache.pub || {}).apps || {}), [app]: nc } }; aApps(w, app); });
  if ($("#apCob")) $("#apCob").onclick = async () => {
    let n = 0; for (const cl of clients) { const a = (cl.doc.apps || {})[app]; if (!a || !(a.status === "ativo" || a.status === "pendente")) continue; const d = clone(cl.doc); if (cobrancaApp(cat, d, app, a)) { d.acesso = { ...(d.acesso || {}), pagamentos: true }; await S.set(`clientes/${cl.id}`, d); n++; } }
    toast(n ? `${n} cobrança(s) gerada(s) e liberada(s) no portal` : "As cobranças deste mês já existem"); reAdmin(); };
}
const rowCat = (t, i, x, ex) => `<div class="row" style="flex-wrap:nowrap"><input data-${t}-k="${i}" value="${esc(x.k)}" aria-label="Código" style="max-width:80px"><input data-${t}-n="${i}" value="${esc(x.nome)}" aria-label="Nome">${ex ? `<input data-${t}-d="${i}" value="${esc(x.desc || "")}" aria-label="Descrição" placeholder="Descrição">` : ""}<input data-${t}-p="${i}" type="number" step="0.01" min="0" value="${esc(x.preco)}" aria-label="Preço (R$)" style="max-width:120px"><button class="btn sec sm" data-del="${t}:${i}" aria-label="Remover">×</button></div>`;

// acesso direto às áreas de administração de cada app (mesmo login do painel: e-mail e senha da Upe)
const ADM_LINKS = {
  erp: [["Gerenciador do ERP", "Licenças, cobranças, suporte e páginas", "https://upe-criativo-gestao.web.app/", true], ["Painel das empresas", "Entre como Upe e escolha a empresa", "https://upe-criativo-painel.web.app/", true], ["Lojas", "Endereço público das lojas", "https://upe-criativo-lojas.web.app/"], ["Página de vendas", "Página do Upe ERP", "https://upe-criativo-erp.web.app/"]],
  tv: [["Gestão do Upe TV", "Programação, campanhas, telas e anunciantes", "https://upe-criativo-tv.web.app/", true], ["Portal do anunciante", "Como o anunciante vê", "https://upe-criativo-tv.web.app/#cliente"]],
  landing: []
};
function admLinks(app) {
  const l = ADM_LINKS[app] || []; if (!l.length) return "";
  return `<section class="card grid admquick"><div class="spread"><h3>Acesso de administrador</h3><span class="muted small">Mesmo login do painel. No primeiro acesso de cada app, entre com o seu e-mail e senha; depois ele lembra.</span></div>
    <div class="admlinks">${l.map(([t, s, u, p]) => `<a class="admlink ${p ? "pri" : ""}" href="${esc(u)}" target="_blank" rel="noopener"><b>${esc(t)}</b><span>${esc(s)}</span></a>`).join("")}</div></section>`;
}

/* ---------- admin: ficha do cliente → Apps Extra ---------- */
function aClienteApps(ct, { id, doc, acoes, save }) {
  const cat = appsCat(state.cache.pub), peds = appPedidos(doc, acoes);
  doc.apps = doc.apps || {};
  ct.innerHTML = `${peds.filter(p => p.status === "novo").length ? `<section class="card grid prio"><b>Pedidos do cliente</b>${peds.filter(p => p.status === "novo").map(p => `<div class="row" style="flex-wrap:nowrap"><span style="flex:1">${esc(cat[p.app]?.nome || p.app)}${p.extra ? ` · extra <b>${esc((cat[p.app]?.extras.find(e => e.k === p.extra) || {}).nome || p.extra)}</b>` : " · contratar"} <span class="muted small">${fdt(p.em)}</span>${p.texto ? `<br><span class="small">${esc(p.texto)}</span>` : ""}</span><button class="btn sm" data-pok="${p.id}">Atendido</button></div>`).join("")}</section>` : ""}
    <p class="muted small">Os apps contratados ficam numa conta só: a cobrança sai em Pagamentos (PIX ou cartão), a renovação entra na agenda do cliente e no seu calendário, e o cliente vê tudo em “Apps Upe” no portal.</p>
    <div class="g3">${APP_IDS.map(k => { const c = cat[k], a = doc.apps[k] || {};
      return `<section class="card grid" data-app="${k}"><div class="spread"><h3>${esc(c.nome)}</h3>${a.status && a.status !== "cancelado" ? astPill(a.status) : c.breve ? '<span class="pill">em breve</span>' : '<span class="pill">Sem adesão</span>'}</div>
        <p class="muted small">${esc(c.desc)}</p>
        ${c.breve ? "" : `<label class="f">Status<select data-k="status"><option value="">Sem adesão</option>${Object.entries(AST).map(([s, [l]]) => `<option value="${s}" ${a.status === s ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="f">Plano<select data-k="plano">${c.planos.map(p => `<option value="${esc(p.k)}" ${a.plano === p.k ? "selected" : ""}>${esc(p.nome)} · ${+p.preco ? brl(p.preco) : "sob consulta"}</option>`).join("")}</select></label>
        <div class="grid" style="gap:4px"><span class="eb">Extras</span>${c.extras.map(e => `<label class="row small" style="gap:6px;flex-wrap:nowrap"><input type="checkbox" data-ex="${esc(e.k)}" ${(a.extras || []).includes(e.k) ? "checked" : ""}>${esc(e.nome)} <span class="muted">· ${+e.preco ? brl(e.preco) : "sob consulta"}</span></label>`).join("")}</div>
        <div class="g2"><label class="f">Dia do vencimento<input type="number" min="1" max="28" data-k="dia" value="${esc(a.dia || doc.recorrente?.dia || 10)}"></label><label class="f">Ajuste no valor (R$)<input type="number" step="0.01" data-k="ajuste" value="${esc(a.ajuste || 0)}"></label></div>
        <div class="g2"><label class="f">Início<input type="date" data-k="inicio" value="${esc(a.inicio || todayIso())}"></label><label class="f">Fim do teste<input type="date" data-k="fimTeste" value="${esc(a.fimTeste || (c.teste ? addDays(todayIso(), c.teste) : ""))}"></label></div>
        <label class="f">Observações (o cliente vê)<input data-k="obs" value="${esc(a.obs || "")}" placeholder="Ex.: loja em lojadacliente.com.br"></label>
        <div class="spread"><b class="num" data-tot>${brl(valorAdesao(cat, k, a))}/mês</b>${a.status === "ativo" || a.status === "pendente" ? `<button class="btn sec sm" data-cob="${k}">Gerar cobrança</button>` : ""}</div>`}
      </section>`; }).join("")}</div>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="caSv">Salvar apps do cliente</button></div>`;
  const collect = () => { APP_IDS.forEach(k => { const box = $(`[data-app="${k}"]`, ct); if (!box || !$("[data-k=status]", box)) return; const v = n => ($(`[data-k="${n}"]`, box) || {}).value || "";
    const st = v("status"); if (!st) { if (doc.apps[k]) doc.apps[k] = { ...doc.apps[k], status: "cancelado" }; return; }
    doc.apps[k] = { ...(doc.apps[k] || {}), status: st, plano: v("plano"), extras: $$("[data-ex]", box).filter(i => i.checked).map(i => i.dataset.ex), dia: +v("dia") || 10, ajuste: +v("ajuste") || 0, inicio: v("inicio"), fimTeste: v("fimTeste"), obs: v("obs").trim() }; }); };
  ct.querySelectorAll("[data-app] input, [data-app] select").forEach(i => i.oninput = () => { collect(); APP_IDS.forEach(k => { const t = $(`[data-app="${k}"] [data-tot]`, ct); if (t && doc.apps[k]) t.textContent = brl(valorAdesao(cat, k, doc.apps[k])) + "/mês"; }); });
  $("#caSv").onclick = async () => { collect(); if (adesoes(doc).length) doc.acesso = { ...(doc.acesso || {}), pagamentos: true }; await save("Apps do cliente salvos"); };
  $$("[data-cob]", ct).forEach(b => b.onclick = async () => { collect(); const cob = cobrancaApp(cat, doc, b.dataset.cob, doc.apps[b.dataset.cob]); if (!cob) return toast("A cobrança deste mês já existe"); doc.acesso = { ...(doc.acesso || {}), pagamentos: true }; await save(`Cobrança de ${brl(cob.valor)} liberada no portal (vence ${fdate(cob.vencimento)})`); });
  $$("[data-pok]", ct).forEach(b => b.onclick = async () => { doc.pedidosAdm = doc.pedidosAdm || {}; doc.pedidosAdm[b.dataset.pok] = { ...(doc.pedidosAdm[b.dataset.pok] || {}), status: "entregue" }; collect(); await save("Pedido marcado como atendido"); });
}

/* ---------- portal do cliente: Apps Upe ---------- */
function cApps(m, c) {
  const { doc, acoes } = c, cat = appsCat(state.cfg), meus = doc.apps || {}, peds = appPedidos(doc, acoes);
  const pediu = (app, ex = "") => peds.some(p => p.app === app && p.extra === ex && p.status === "novo");
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Apps Upe</span><h1>Ferramentas para o seu negócio</h1><p class="muted small">Os apps contratados ficam na mesma conta do seu projeto: um pagamento só e as renovações na sua agenda.</p></div>
    <div class="g3">${APP_IDS.map(k => { const ap = cat[k], a = meus[k], tem = a && a.status && a.status !== "cancelado";
      return `<article class="card grid"><div class="spread"><h3>${esc(ap.nome)}</h3>${tem ? astPill(a.status) : ap.breve ? '<span class="pill">em breve</span>' : ""}</div><p class="muted small">${esc(ap.desc)}</p>
        ${tem ? `<div class="grid" style="gap:2px"><span class="small"><b>Plano:</b> ${esc((ap.planos.find(p => p.k === a.plano) || {}).nome || "—")}</span>${(a.extras || []).length ? `<span class="small"><b>Extras:</b> ${esc(a.extras.map(x => (ap.extras.find(e => e.k === x) || {}).nome || x).join(", "))}</span>` : ""}<span class="small"><b>Mensal:</b> ${brl(valorAdesao(cat, k, a))}${a.status === "teste" && a.fimTeste ? ` · teste grátis até ${fdate(a.fimTeste)}` : a.status === "ativo" ? ` · renova em ${fdate(proxVenc(a))}` : ""}</span>${a.obs ? `<span class="small muted">${esc(a.obs)}</span>` : ""}</div>${ap.painel ? `<a class="btn sec sm" href="${esc(ap.painel)}" target="_blank" rel="noopener" style="justify-self:start">Abrir o ${esc(ap.nome)}</a>` : ""}`
        : ap.breve ? `<button class="btn sec sm" data-quero="${k}" ${pediu(k) ? "disabled" : ""}>${pediu(k) ? "Interesse enviado" : "Quero saber quando lançar"}</button>`
        : `<div class="grid" style="gap:2px">${ap.planos.slice(0, 3).map(p => `<span class="small">${esc(p.nome)} · <b>${+p.preco ? brl(p.preco) + "/mês" : "sob consulta"}</b></span>`).join("")}${ap.teste ? `<span class="small muted">${ap.teste} dias de teste grátis</span>` : ""}</div><button class="btn sm" data-quero="${k}" ${pediu(k) ? "disabled" : ""} style="justify-self:start">${pediu(k) ? "Pedido enviado" : "Quero contratar"}</button>`}
        ${tem && ap.extras.length ? `<details><summary class="small"><b>Pacotes extras</b></summary><div class="grid" style="gap:8px;margin-top:8px">${ap.extras.map(e => { const ja = (a.extras || []).includes(e.k); return `<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span style="flex:1" class="small"><b>${esc(e.nome)}</b> · ${+e.preco ? brl(e.preco) + "/mês" : "sob consulta"}<br><span class="muted">${esc(e.desc || "")}</span></span>${ja ? '<span class="pill ok">Contratado</span>' : `<button class="btn sec sm" data-quero="${k}:${esc(e.k)}" ${pediu(k, e.k) ? "disabled" : ""}>${pediu(k, e.k) ? "Pedido enviado" : "Adicionar"}</button>`}</div>`; }).join("")}</div></details>` : ""}
      </article>`; }).join("")}</div>`;
  $$("[data-quero]", m).forEach(b => b.onclick = async () => { const [app, ex] = b.dataset.quero.split(":"); b.disabled = true;
    await Api.act(c.id, { tipo: "pedido", alvo: `app:${app}${ex ? ":" + ex : ""}`, modo: "app", quantidade: 1, texto: "" }); toast("Pedido enviado. A Upe entra em contato para ativar."); refreshClient(); });
}
