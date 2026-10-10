/* Painel Upe Serviços: o cliente cria, edita, publica e analisa as landing pages, cuida da agenda online e vê os dashboards;
   a Upe (administrador) cadastra clientes, atribui planos de criação e mensalidade, gera cobranças e conecta domínios. */
import { db, auth, S, $, $$, toast, pill, vazio, topo, ctx, carregarCliente, paginasDoCliente, eventosDe, agendaDoCliente, tem, statusMensal, DIA } from "./nucleo.js";
import { DEMO, ADMIN_EMAIL, SITES, WHATS, PLANOS_PADRAO, FRENTES, esc, brl, hoje, msgErro } from "./srv.js";
import * as vPaginas from "./v-paginas.js"; import * as vAnalise from "./v-analise.js"; import * as vAgenda from "./v-agenda.js";
import * as vDash from "./v-dash.js"; import * as vConta from "./v-conta.js"; import * as vAdmin from "./v-admin.js";

/* ---------- login ---------- */
function telaLogin(msg = "", ok = "") {
  const L = $("#login"); L.hidden = false; $("#app").hidden = true;
  L.innerHTML = `<div class="lg-box">
    <h1>Upe <b>Serviços</b></h1>
    <p class="muted">Painel das landing pages, da agenda online e dos dashboards da Upe Criativo.</p>
    ${DEMO ? `<div class="banner"><b>Modo demonstração.</b> Os dados são fictícios e ficam só neste navegador.</div>
      <button class="btn azul" type="button" data-demo="cliente">Entrar como cliente (exemplo)</button>
      <button class="btn" type="button" data-demo="admin">Entrar como Upe (administrador)</button>` : `
    <form id="fLogin" class="form">
      <label class="f">E-mail<input name="email" type="email" required autocomplete="username"></label>
      <label class="f">Senha<input name="senha" type="password" required minlength="6" autocomplete="current-password"></label>
      <button class="btn azul" value="entrar">Entrar</button>
      <button class="btn" value="criar">Primeiro acesso: criar a minha senha</button>
    </form>
    <button class="lg-link" type="button" id="lgReset">Esqueci a senha</button>
    <div class="lg-sep">ou</div>
    <button class="btn" type="button" id="lgGoogle">Entrar com o Google</button>`}
    <p class="lg-err" id="lgErr">${esc(msg)}</p><p class="lg-ok" id="lgOk">${esc(ok)}</p>
    <p class="muted" style="font-size:12.5px">Ainda não é cliente? <a href="${SITES.lp}">Landing pages</a> · <a href="${SITES.sistemas}">Agenda e dashboards</a></p>
    <p class="muted" style="font-size:12px"><a href="https://upe-criativo.web.app/privacidade.html" target="_blank" rel="noopener">Privacidade</a> · <a href="https://upe-criativo.web.app/termos.html" target="_blank" rel="noopener">Termos de uso</a></p>
  </div>`;
  const err = m => { $("#lgErr").textContent = m; $("#lgOk").textContent = ""; };
  $$("[data-demo]", L).forEach(b => b.onclick = () => auth.entrar(b.dataset.demo === "admin" ? ADMIN_EMAIL : "cliente@exemplo.com"));
  const f = $("#fLogin");
  if (f) f.addEventListener("submit", async e => {
    e.preventDefault(); const fd = new FormData(f), b = e.submitter; b.disabled = true; err("");
    try { if (b.value === "criar") { await auth.criar(fd.get("email").trim(), fd.get("senha")); } else await auth.entrar(fd.get("email").trim(), fd.get("senha")); }
    catch (er) { err(msgErro(er)); } finally { b.disabled = false; }
  });
  $("#lgReset")?.addEventListener("click", async () => { const em = f.email.value.trim(); if (!em) return err("Digite o seu e-mail acima."); try { await auth.reset(em); $("#lgOk").textContent = "Enviamos um link para criar uma nova senha. Confira o e-mail (e o spam)."; $("#lgErr").textContent = ""; } catch (er) { err(msgErro(er)); } });
  $("#lgGoogle")?.addEventListener("click", async () => { try { await auth.google(); } catch (er) { err(msgErro(er)); } });
}
function telaAviso(titulo, texto, botoes = "") {
  const L = $("#login"); L.hidden = false; $("#app").hidden = true;
  L.innerHTML = `<div class="lg-box"><h1>Upe <b>Serviços</b></h1><h2 style="font-size:19px">${esc(titulo)}</h2><p class="muted">${texto}</p>${botoes}<button class="btn" type="button" id="lgSair">Sair</button></div>`;
  $("#lgSair").onclick = () => auth.sair();
}

async function ehAdmin(u) {
  if (!u || !u.emailVerified) return false;
  if ((u.email || "").toLowerCase() === ADMIN_EMAIL) return true;
  if (DEMO) return false;
  try { return !!(await db.get("admins/" + u.uid)); } catch { return false; }
}
auth.onChange(async u => {
  S.user = u;
  if (!u) return telaLogin();
  if (!u.emailVerified) return telaAviso("Confirme o seu e-mail", `Enviamos um link para <b>${esc(u.email)}</b>. Abra o e-mail, toque no link e depois volte aqui.`,
    `<button class="btn azul" type="button" id="lgJa">Já confirmei</button><button class="btn" type="button" id="lgRe">Reenviar o e-mail</button>`), $("#lgJa").onclick = async () => { const n = await auth.recarregar(); if (n?.emailVerified) location.reload(); else toast("Ainda não aparece como confirmado. Tente em alguns segundos."); }, $("#lgRe").onclick = async () => { await auth.verificar(); toast("E-mail reenviado."); };
  S.admin = await ehAdmin(u);
  try {
    S.cfg = (await db.get("srv_config/publico")) || {};
    S.recursos = (await db.get("srv_config/recursos").catch(() => null)) || {};
    if (S.admin) {
      S.clientes = (await db.list("srv_clientes")).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      S.cid = sessionStorage.getItem("srv-cid") || null;
      if (S.cid && !S.clientes.some(c => c.id === S.cid)) S.cid = null;
      if (!(await db.list("srv_planos")).length) await db.batch(PLANOS_PADRAO.map(p => ({ set: ["srv_planos/" + p.id, p] })));
    } else {
      let ac = await db.get("srv_acessos/" + u.uid);
      if (!ac) {
        const cv = await db.get("srv_convites/" + (u.email || "").toLowerCase());
        if (!cv) return telaAviso("Acesso ainda não liberado", `O e-mail <b>${esc(u.email)}</b> ainda não foi cadastrado pela Upe. Fale com a gente no WhatsApp para liberar o seu painel.`, `<a class="btn azul" href="https://wa.me/${WHATS}?text=${encodeURIComponent("Olá! Quero liberar o meu acesso ao Painel Upe Serviços: " + u.email)}" target="_blank" rel="noopener">Falar no WhatsApp</a>`);
        ac = { cid: cv.cid, email: (u.email || "").toLowerCase(), criadoEm: Date.now() };
        await db.set("srv_acessos/" + u.uid, ac);
      }
      S.cid = ac.cid;
    }
    await carregarCliente();
  } catch (er) { console.error(er); return telaAviso("Não foi possível abrir o painel", esc(msgErro(er))); }
  $("#login").hidden = true; $("#app").hidden = false;
  if (DEMO) await prepararDemo();
  rota();
});
async function prepararDemo() {
  for (const p of await db.list("lp_paginas")) if (!p.html && p.demoModelo) {
    const h = await (await fetch(`modelos/${p.demoModelo}.html`)).text(), { id, _path, ...d } = p;
    await db.set("lp_paginas/" + id, { ...d, html: h }); await db.set(`lp_paginas/${id}/privado/rascunho`, { html: h, em: d.atualizadoEm || Date.now() });
  }
}
$("#btnSair").onclick = () => { sessionStorage.removeItem("srv-cid"); auth.sair(); };

/* ---------- navegação ---------- */
function menu() {
  const it = (h, t, extra = "") => `<button type="button" data-ir="${h}" ${S.view.startsWith(h) ? 'aria-current="page"' : ""}><span>${esc(t)}</span>${extra}</button>`;
  let n = "";
  if (S.cliente) {
    n += it("#/inicio", "Início");
    if (tem("lp")) n += `<h4>Landing pages</h4>` + it("#/paginas", "Páginas") + it("#/analise", "Análise") + it("#/leads", "Leads") + it("#/dominios", "Domínio próprio");
    if (tem("agenda")) n += `<h4>Agenda online</h4>` + it("#/agenda", "Agenda");
    if (tem("dash") || tem("agenda") || tem("lp")) n += `<h4>Dashboards</h4>` + it("#/dash", "Dashboards");
    n += `<h4>Conta</h4>` + it("#/conta", "Plano e cobranças") + it("#/chamados", "Pedidos de ajuste");
  }
  if (S.admin) n += `<h4>Gestão Upe</h4>` + it("#/adm/clientes", "Clientes e planos") + it("#/adm/cobrancas", "Cobranças") + it("#/adm/planos", "Catálogo de planos") + it("#/adm/interessados", "Interessados") + it("#/adm/dominios", "Domínios") + it("#/adm/paginas", "Todas as páginas") + it("#/adm/chamados", "Pedidos de ajuste") + it("#/adm/config", "PIX e contato") + it("#/adm/erros", "Erros dos sites");
  $("#nav").innerHTML = n;
  $("#quem").innerHTML = S.admin
    ? `<span>Upe Criativo · administrador</span><label class="f" style="color:var(--side-muted)">Cliente aberto<select id="selCli"><option value="">Nenhum (só gestão)</option>${S.clientes.map(c => `<option value="${esc(c.id)}" ${c.id === S.cid ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></label>`
    : `<span>${esc(S.cliente?.nome || "")}</span><span style="color:var(--side-muted)">${esc(S.user?.email || "")}</span>`;
  $("#selCli")?.addEventListener("change", async e => { S.cid = e.target.value || null; sessionStorage.setItem("srv-cid", S.cid || ""); await carregarCliente(); location.hash = S.cid ? "#/inicio" : "#/adm/clientes"; rota(); });
}
document.addEventListener("click", e => { const b = e.target.closest("[data-ir]"); if (b) { e.preventDefault(); if (S.sujo && !confirm("Há alterações não salvas nesta página. Sair mesmo assim?")) return; S.sujo = false; location.hash = b.dataset.ir; } });
addEventListener("hashchange", () => rota());
addEventListener("beforeunload", e => { if (S.sujo) { e.preventDefault(); e.returnValue = ""; } });

const VIEWS = {};
async function rota() {
  if (!S.user || $("#app").hidden) return;
  let h = location.hash || "";
  if (!h || h === "#/") h = S.cliente ? "#/inicio" : "#/adm/clientes";
  if (!S.cliente && !h.startsWith("#/adm") ) h = "#/adm/clientes";
  if (h.startsWith("#/adm") && !S.admin) h = "#/inicio";
  S.view = h; menu();
  const [, a, b, c] = h.split("/"), chave = a === "adm" ? "adm/" + b : a;
  const fn = VIEWS[chave] || VIEWS.inicio;
  const M = $("#main"); M.innerHTML = `<div class="vazio">Carregando…</div>`; $(".barra-salvar")?.remove();
  try { await fn(M, a === "adm" ? c : b, a === "adm" ? h.split("/")[4] : c); } catch (er) { console.error(er); M.innerHTML = `<div class="card">${vazio("Não foi possível carregar esta seção. " + msgErro(er))}</div>`; }
  window.scrollTo(0, 0);
}
document.addEventListener("click", e => { if (e.target.id === "demoReset") { db.reset(); location.reload(); } });

/* ---------- início ---------- */
VIEWS.inicio = async M => {
  const c = S.cliente; if (!c) return VIEWS["adm/clientes"](M);
  let html = topo("Início", `<span class="muted">${esc(c.nome)}</span>`);
  const susp = (await (tem("lp") ? paginasDoCliente() : [])).filter(p => p.suspensa);
  if (susp.length) html += `<div class="banner" style="background:var(--crit-bg);color:var(--crit)"><b>Página fora do ar.</b> ${susp.length === 1 ? "Uma página está suspensa" : susp.length + " páginas estão suspensas"} por mensalidade em aberto. Veja em <a href="#/conta">Plano e cobranças</a>.</div>`;
  const kp = [];
  if (tem("lp")) {
    const pg = await paginasDoCliente(), ev = await eventosDe(pg.map(p => p.id), Date.now() - 30 * DIA);
    const vis = ev.filter(e => e.tipo === "visita"), uni = new Set(vis.map(e => e.vid)).size, leads = ev.filter(e => e.tipo === "lead").length;
    kp.push([vis.length, "visitas nas páginas (30 dias)"], [uni, "visitantes únicos"], [leads, "leads recebidos"], [uni ? (leads / uni * 100).toFixed(1).replace(".", ",") + "%" : "—", "conversão (leads ÷ visitantes)"]);
    const rasc = pg[0] ? await db.get(`lp_paginas/${pg[0].id}/privado/rascunho`) : null, doms = await db.list("lp_dominios", { where: [["cid", "==", S.cid]] });
    const p0 = pg[0] || {}, passos = [
      ["Criar a página", "Comece de um modelo ou envie o seu HTML", pg.length > 0, "#/paginas"],
      ["Editar os textos", "Troque títulos, fotos e contatos", !!(rasc && p0.html && rasc.em > (p0.criadoEm || 0) + 1000), pg[0] ? `#/pagina/${p0.id}/editar` : "#/paginas"],
      ["SEO e WhatsApp", "Título do Google e botão flutuante", !!(p0.seo?.descricao || p0.whatsapp?.ativo), pg[0] ? `#/pagina/${p0.id}/config` : "#/paginas"],
      ["Publicar", "Deixe a página no ar", pg.some(p => p.publicada), pg[0] ? `#/pagina/${p0.id}/editar` : "#/paginas"],
      ["Domínio próprio", "Use o endereço da sua marca", doms.some(d => d.status === "ativo"), "#/dominios"],
      ["Primeiro lead", "Alguém preencheu o formulário", leads > 0 || ev.some(e => e.tipo === "lead"), "#/leads"]];
    const feitos = passos.filter(p => p[2]).length;
    html += `<section class="card"><div class="card-h"><h3>Primeiros passos</h3><span class="eyebrow">${feitos} de ${passos.length}</span></div><div class="prog"><i style="width:${feitos / passos.length * 100}%"></i></div>
      <div class="passos">${passos.map((p, i) => `<button type="button" class="passo ${p[2] ? "ok" : ""}" data-ir="${p[3]}"><i>${p[2] ? "✓" : i + 1}</i><span><b>${esc(p[0])}</b><span>${esc(p[1])}</span></span></button>`).join("")}</div></section>`;
  }
  if (tem("agenda")) {
    const ag = await agendaDoCliente();
    if (ag) { const rs = await db.list(`agenda_paginas/${ag.id}/reservas`, { where: [["data", ">=", hoje()]] }); kp.push([rs.filter(r => r.data === hoje() && r.status !== "cancelada").length, "agendamentos hoje"], [rs.filter(r => r.status === "nova").length, "agendamentos a confirmar"]); }
  }
  if (kp.length) html += `<div class="kpis">${kp.map(k => `<div class="kpi"><b class="num">${esc(k[0])}</b><span>${esc(k[1])}</span></div>`).join("")}</div>`;
  const m = c.plano?.mensal;
  html += `<section class="card"><div class="card-h"><h3>Seu plano</h3><a class="btn sm" href="#/conta">Ver cobranças</a></div>
    <p>${(c.frentes || []).map(f => pill("info", FRENTES[f] || f)).join(" ")}</p>
    ${m?.nome ? `<p><b>${esc(m.nome)}</b> · ${brl(m.valor)}/mês · vence todo dia ${esc(m.dia || 10)} · ${statusMensal(m.status)}</p>` : `<p class="muted">Nenhuma mensalidade cadastrada.</p>`}</section>`;
  M.innerHTML = html;
};

[vPaginas, vAnalise, vAgenda, vDash, vConta, vAdmin].forEach(m => Object.assign(VIEWS, m.views || {}));
ctx.rota = rota;
