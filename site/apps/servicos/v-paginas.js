/* Landing pages: lista, nova página (modelo, HTML enviado ou em branco), editor (visual, código, configurações, versões), leads e domínio próprio. */
import { db, S, $, $$, toast, dialogo, botoesDlg, pill, vazio, topo, fmtDH, fmtData, paginasDoCliente, montar, ctx } from "./nucleo.js";
import { SITES, esc, slugify, uid, msgErro, DEMO } from "./srv.js";

const LIM = 880000;
const urlPagina = s => `${SITES.lp}/${s}`;
const statusPag = p => p.suspensa ? pill("crit", "Suspensa") : p.publicada ? pill("ok", "No ar") : pill("warn", "Rascunho");
const MODELOS = { servico: "Serviço local (avaliação, consulta, orçamento)", lancamento: "Lançamento ou evento (inscrição)" };
const BRANCO = `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Minha página</title>\n<style>body{font:18px/1.6 system-ui,sans-serif;margin:0;padding:48px 20px;max-width:760px;margin-inline:auto}h1{font-size:44px;line-height:1.1}a.btn{display:inline-block;background:#1a73d9;color:#fff;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:700}</style>\n</head>\n<body>\n<h1>Título da sua oferta</h1>\n<p>Explique em duas frases o que você oferece e para quem.</p>\n<p><a class="btn" href="#contato">Quero saber mais</a></p>\n<form id="contato"><p><input name="nome" placeholder="Nome" required> <input name="whatsapp" placeholder="WhatsApp" required> <button type="submit">Enviar</button></p></form>\n</body>\n</html>\n`;

export const views = {};

/* ---------- lista ---------- */
views.paginas = async M => {
  const pg = (await paginasDoCliente()).sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
  M.innerHTML = topo("Páginas", `<button class="btn azul" type="button" id="novaPag">+ Nova página</button>`) +
    `<section class="card">${pg.length ? pg.map(p => `<div class="pagina">
        <div class="miniatura"><iframe sandbox title="Miniatura" loading="lazy" data-mini="${esc(p.id)}"></iframe></div>
        <div style="display:grid;gap:4px;min-width:0"><b style="font-size:16px">${esc(p.titulo || p.id)}</b><span>${statusPag(p)} <code class="end">${esc(urlPagina(p.id).replace(/^https:\/\//, ""))}</code></span>
          <span class="muted" style="font-size:12.5px">Atualizada ${fmtDH(p.atualizadoEm)}${p.dominio ? " · domínio " + esc(p.dominio) : ""}</span></div>
        <div class="linha"><a class="btn azul sm" href="#/pagina/${esc(p.id)}/editar">Editar</a>${p.publicada && !p.suspensa ? `<a class="btn sm" href="${esc(urlPagina(p.id))}" target="_blank" rel="noopener">Ver no ar ↗</a>` : ""}<a class="btn sm" href="#/analise/${esc(p.id)}">Análise</a></div>
      </div>`).join('<hr style="border:0;border-top:1px solid var(--line);width:100%">') : vazio("Nenhuma página ainda.", `<button class="btn azul" type="button" data-nova>Criar a primeira página</button>`)}</section>`;
  for (const p of pg) { const f = $(`[data-mini="${CSS.escape(p.id)}"]`); if (f) f.srcdoc = montar(p.html || "", { seo: p.seo }, null).replace(/<script[\s\S]*?<\/script>/gi, ""); }
  $("#novaPag").onclick = novaPagina; $("[data-nova]")?.addEventListener("click", novaPagina);
};
function novaPagina() {
  dialogo(`<h3>Nova página</h3>
    <label class="f">Nome da página<input name="titulo" required maxlength="80" placeholder="Ex.: Avaliação gratuita"></label>
    <label class="f">Endereço<input name="slug" required pattern="[a-z0-9][a-z0-9-]{1,47}" maxlength="48" placeholder="minha-pagina"></label>
    <p class="muted" style="font-size:12.5px">A página fica em <code class="end" id="prevEnd">${esc(SITES.lp.replace(/^https:\/\//, ""))}/…</code>. Depois você pode conectar o seu domínio.</p>
    <fieldset style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:grid;gap:8px"><legend class="eyebrow">Começar de</legend>
      ${Object.entries(MODELOS).map(([k, t], i) => `<label class="chk"><input type="radio" name="origem" value="${k}" ${i ? "" : "checked"}> Modelo: ${esc(t)}</label>`).join("")}
      <label class="chk"><input type="radio" name="origem" value="arquivo"> Enviar o meu arquivo .html</label>
      <input type="file" name="arquivo" accept=".html,.htm,text/html" hidden>
      <label class="chk"><input type="radio" name="origem" value="branco"> Página em branco</label></fieldset>
    ${botoesDlg("Criar página")}`, async (fd, f) => {
    const slug = slugify(fd.get("slug")), titulo = String(fd.get("titulo")).trim();
    if (slug.length < 2) { toast("Escolha um endereço com pelo menos 2 letras."); return false; }
    if (await db.get("lp_paginas/" + slug).catch(() => ({ ocupado: true }))) { toast("Esse endereço já está em uso. Escolha outro."); return false; }
    const o = fd.get("origem"); let html = BRANCO;
    if (o === "arquivo") { const a = f.arquivo.files[0]; if (!a) { toast("Escolha o arquivo .html."); return false; } html = await a.text(); }
    else if (MODELOS[o]) html = await (await fetch(`modelos/${o}.html`)).text();
    if (html.length > LIM) { toast("O arquivo passou de 880 KB. Use imagens por link (não embutidas) e tente de novo."); return false; }
    const agora = Date.now();
    await db.set("lp_paginas/" + slug, { cid: S.cid, titulo, html, publicada: false, suspensa: false, seo: { titulo }, whatsapp: { ativo: false, numero: (S.cliente?.whatsapp || "").replace(/\D/g, ""), mensagem: "Olá! Vim pela página " + titulo }, pixel: {}, criadoEm: agora, atualizadoEm: agora });
    await db.set(`lp_paginas/${slug}/privado/rascunho`, { html, em: agora });
    toast("Página criada. Edite e publique quando estiver pronta.");
    location.hash = `#/pagina/${slug}/editar`;
  }, f => {
    f.titulo.addEventListener("input", () => { if (!f.slug.dataset.mexeu) f.slug.value = slugify(f.titulo.value); $("#prevEnd").textContent = SITES.lp.replace(/^https:\/\//, "") + "/" + (f.slug.value || "…"); });
    f.slug.addEventListener("input", () => { f.slug.dataset.mexeu = 1; $("#prevEnd").textContent = SITES.lp.replace(/^https:\/\//, "") + "/" + slugify(f.slug.value); });
    $$('[name="origem"]', f).forEach(r => r.addEventListener("change", () => { f.arquivo.hidden = f.origem.value !== "arquivo"; if (!f.arquivo.hidden) f.arquivo.click(); }));
  });
}

/* ---------- editor ---------- */
/* script colocado só na prévia (iframe isolado, sem acesso ao painel): torna os textos editáveis e devolve o HTML pelo postMessage */
const EDITOR = `<script data-upe-editor>(function(){var SEL="h1,h2,h3,h4,h5,h6,p,li,a,button,span,b,strong,em,small,label,summary,td,th,blockquote,figcaption,dt,dd";
function txtDireto(el){for(var n of el.childNodes)if(n.nodeType===3&&n.textContent.trim())return true;return false}
document.querySelectorAll(SEL).forEach(function(el){if(txtDireto(el)&&!el.closest("[contenteditable]")){el.contentEditable="true";el.setAttribute("data-upe-ed","")}});
var st=document.createElement("style");st.setAttribute("data-upe-editor","");st.textContent="[data-upe-ed]{outline:1px dashed rgba(26,115,217,.35);outline-offset:2px;cursor:text}[data-upe-ed]:hover,[data-upe-ed]:focus{outline:2px solid #1a73d9}img{cursor:pointer}img:hover{outline:3px solid #ff7a59}";document.head.appendChild(st);
document.addEventListener("click",function(e){var a=e.target.closest("a,button");if(a)e.preventDefault();var im=e.target.closest("img");if(im){var i=[].indexOf.call(document.images,im);parent.postMessage({upe:"img",i:i,src:im.getAttribute("src")||""},"*")}},true);
document.addEventListener("submit",function(e){e.preventDefault()},true);
function html(){var c=document.documentElement.cloneNode(true);c.querySelectorAll("[data-upe-editor]").forEach(function(x){x.remove()});c.querySelectorAll("[data-upe-ed]").forEach(function(x){x.removeAttribute("contenteditable");x.removeAttribute("data-upe-ed")});return"<!doctype html>\\n"+c.outerHTML}
var t;document.addEventListener("input",function(){clearTimeout(t);t=setTimeout(function(){parent.postMessage({upe:"html",html:html()},"*")},350)});
addEventListener("message",function(e){var d=e.data||{};if(d.upe==="troca-img"){var im=document.images[d.i];if(im){im.setAttribute("src",d.src);im.removeAttribute("srcset");parent.postMessage({upe:"html",html:html()},"*")}}});
})();<\/script>`;
const comEditor = h => /<\/body>/i.test(h) ? h.replace(/<\/body>(?![\s\S]*<\/body>)/i, EDITOR + "</body>") : h + EDITOR;

views.pagina = async (M, slug, aba = "editar") => {
  const p = await db.get("lp_paginas/" + slug);
  if (!p) { M.innerHTML = topo("Página") + `<section class="card">${vazio("Página não encontrada.")}</section>`; return; }
  const r = await db.get(`lp_paginas/${slug}/privado/rascunho`);
  const E = { html: r?.html ?? p.html ?? "", cfg: { titulo: p.titulo || "", seo: { ...(p.seo || {}) }, whatsapp: { ...(p.whatsapp || {}) }, pixel: { ...(p.pixel || {}) } }, modo: "editar", tela: "pc" };
  const publicadoIgual = () => E.html === (p.html || "") && JSON.stringify(E.cfg) === JSON.stringify({ titulo: p.titulo || "", seo: p.seo || {}, whatsapp: p.whatsapp || {}, pixel: p.pixel || {} });
  M.innerHTML = topo(p.titulo || slug, `${statusPag(p)}${p.publicada && !p.suspensa ? `<a class="btn sm" href="${esc(urlPagina(slug))}" target="_blank" rel="noopener">Ver no ar ↗</a>` : ""}<a class="btn sm" href="#/paginas">← Páginas</a>`) +
    `<div class="abas" role="tablist">${[["editar", "Editar"], ["codigo", "Código HTML"], ["config", "SEO e integrações"], ["versoes", "Versões"]].map(([k, t]) => `<button role="tab" type="button" aria-selected="${k === aba}" data-ir="#/pagina/${esc(slug)}/${k}">${t}</button>`).join("")}</div><div id="corpo"></div>`;
  const corpo = $("#corpo");
  const barra = document.createElement("div"); barra.className = "barra-salvar"; document.body.append(barra);
  const pintaBarra = () => {
    const pub = publicadoIgual();
    barra.innerHTML = `<span>${S.sujo ? "<b>Alterações não salvas.</b>" : pub ? (p.publicada ? "Tudo publicado." : "Página ainda não publicada.") : "Rascunho salvo, ainda não publicado."}</span>
      <span class="linha">${S.sujo ? `<button class="btn" type="button" id="bDesc">Descartar</button><button class="btn" type="button" id="bSalvar">Salvar rascunho</button>` : ""}
      ${p.publicada ? `<button class="btn" type="button" id="bTirar">Tirar do ar</button>` : ""}<button class="btn azul" type="button" id="bPub" ${p.suspensa ? "disabled title=\"Página suspensa pela Upe\"" : ""}>${p.publicada ? "Publicar alterações" : "Publicar página"}</button></span>`;
    $("#bDesc", barra)?.addEventListener("click", () => { S.sujo = false; ctx.rota(); });
    $("#bSalvar", barra)?.addEventListener("click", salvarRascunho);
    $("#bPub", barra).onclick = publicar;
    $("#bTirar", barra)?.addEventListener("click", async () => { if (!confirm("Tirar a página do ar? O endereço passa a mostrar “Página indisponível”.")) return; await db.set("lp_paginas/" + slug, { publicada: false, atualizadoEm: Date.now() }, { merge: true }); p.publicada = false; toast("Página fora do ar."); pintaBarra(); });
  };
  const marca = () => { S.sujo = true; pintaBarra(); };
  async function salvarRascunho() {
    if (E.html.length > LIM) return toast("A página passou de 880 KB. Tire imagens embutidas (base64) e use links.");
    await db.set(`lp_paginas/${slug}/privado/rascunho`, { html: E.html, em: Date.now() });
    await db.set("lp_paginas/" + slug, { titulo: E.cfg.titulo, atualizadoEm: Date.now() }, { merge: true });
    S.sujo = false; toast("Rascunho salvo."); pintaBarra();
  }
  async function publicar() {
    if (E.html.length > LIM) return toast("A página passou de 880 KB. Tire imagens embutidas (base64) e use links.");
    const agora = Date.now();
    await db.set(`lp_paginas/${slug}/privado/rascunho`, { html: E.html, em: agora });
    const { id: _i, ...base } = p;
    await db.set("lp_paginas/" + slug, { ...base, html: E.html, titulo: E.cfg.titulo, seo: E.cfg.seo, whatsapp: E.cfg.whatsapp, pixel: E.cfg.pixel, publicada: true, atualizadoEm: agora, publicadoEm: agora, cid: p.cid, suspensa: !!p.suspensa });
    await db.add(`lp_paginas/${slug}/versoes`, { html: E.html, em: agora, autor: S.user?.email || "", titulo: E.cfg.titulo });
    const vs = (await db.list(`lp_paginas/${slug}/versoes`)).sort((a, b) => b.em - a.em); for (const v of vs.slice(20)) await db.del(`lp_paginas/${slug}/versoes/${v.id}`);
    Object.assign(p, { html: E.html, titulo: E.cfg.titulo, seo: E.cfg.seo, whatsapp: E.cfg.whatsapp, pixel: E.cfg.pixel, publicada: true });
    S.sujo = false; toast("Página publicada."); pintaBarra();
  }
  pintaBarra();

  if (aba === "editar") {
    corpo.innerHTML = `<div class="editor"><div class="palco"><div class="palco-barra">
        <div class="seg" role="group" aria-label="Modo"><button type="button" data-modo="editar" aria-pressed="true">Editar textos</button><button type="button" data-modo="ver" aria-pressed="false">Prévia</button></div>
        <div class="seg" role="group" aria-label="Tela"><button type="button" data-tela="pc" aria-pressed="true">Computador</button><button type="button" data-tela="cel" aria-pressed="false">Celular</button></div></div>
      <div class="tela" id="tela"><iframe id="fr" sandbox="allow-scripts allow-popups" title="Prévia da página"></iframe></div></div>
      <aside class="card"><h3>Como editar</h3><p class="muted">Clique em qualquer texto da prévia e digite. Clique numa imagem para trocar o link dela. As mudanças vão para o rascunho; o público só vê depois de <b>Publicar</b>.</p>
        <p class="muted">Precisa mudar cores, seções ou colocar código? Use a aba <b>Código HTML</b> ou peça na seção <a href="#/chamados">Pedidos de ajuste</a>.</p>
        <label class="f">Nome da página (só no painel)<input id="edTitulo" value="${esc(E.cfg.titulo)}" maxlength="80"></label>
        <div class="linha"><span class="muted">Tamanho: <b class="num" id="edTam"></b> de 880 KB</span></div></aside></div>`;
    const fr = $("#fr");
    const carrega = () => { $("#edTam").textContent = Math.ceil(E.html.length / 1024) + " KB"; fr.srcdoc = E.modo === "editar" ? comEditor(E.html) : montar(E.html, E.cfg, null); };
    carrega();
    $$("[data-modo]").forEach(b => b.onclick = () => { E.modo = b.dataset.modo; $$("[data-modo]").forEach(x => x.setAttribute("aria-pressed", x === b)); carrega(); });
    $$("[data-tela]").forEach(b => b.onclick = () => { $("#tela").classList.toggle("cel", b.dataset.tela === "cel"); $$("[data-tela]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
    $("#edTitulo").oninput = e => { E.cfg.titulo = e.target.value; marca(); };
    const onMsg = e => {
      if (e.source !== fr.contentWindow) return; const d = e.data || {};
      if (d.upe === "html" && typeof d.html === "string") { E.html = d.html; $("#edTam").textContent = Math.ceil(E.html.length / 1024) + " KB"; marca(); }
      if (d.upe === "img") { const src = prompt("Link da nova imagem (https://…). Dica: envie a foto ao Google Drive, Imgur ou ao seu site e cole o link da imagem.", d.src); if (src && /^https?:\/\//.test(src)) fr.contentWindow.postMessage({ upe: "troca-img", i: d.i, src }, "*"); }
    };
    addEventListener("message", onMsg); addEventListener("hashchange", () => removeEventListener("message", onMsg), { once: true });
  }
  if (aba === "codigo") {
    corpo.innerHTML = `<section class="card"><div class="card-h"><h3>Código HTML</h3><div class="linha"><label class="btn sm">Importar .html<input type="file" id="imp" accept=".html,.htm,text/html" hidden></label><button class="btn sm" type="button" id="baixar">Baixar .html</button></div></div>
      <p class="muted">Cole aqui o HTML completo da página (com &lt;html&gt;, &lt;head&gt; e &lt;body&gt;). Imagens devem estar em links (https://…); arquivos embutidos deixam a página pesada.</p>
      <textarea class="codigo" id="cod" spellcheck="false" aria-label="Código HTML"></textarea></section>`;
    const t = $("#cod"); t.value = E.html;
    t.oninput = () => { E.html = t.value; marca(); };
    t.onkeydown = e => { if (e.key === "Tab") { e.preventDefault(); const s = t.selectionStart; t.setRangeText("  ", s, t.selectionEnd, "end"); E.html = t.value; marca(); } };
    $("#imp").onchange = async e => { const a = e.target.files[0]; if (!a) return; const h = await a.text(); if (h.length > LIM) return toast("Arquivo acima de 880 KB."); t.value = E.html = h; marca(); toast("Arquivo importado. Confira e publique."); };
    $("#baixar").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([E.html], { type: "text/html" })); a.download = slug + ".html"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); };
  }
  if (aba === "config") {
    const c = E.cfg;
    corpo.innerHTML = `<div class="grid2">
      <section class="card form"><h3>Google e redes sociais (SEO)</h3>
        <label class="f">Título na aba e no Google<input data-k="seo.titulo" value="${esc(c.seo.titulo || "")}" maxlength="70"></label>
        <label class="f">Descrição no Google (até 160 letras)<textarea data-k="seo.descricao" maxlength="160" rows="3">${esc(c.seo.descricao || "")}</textarea></label>
        <label class="f">Imagem ao compartilhar (link https://…)<input data-k="seo.imagem" value="${esc(c.seo.imagem || "")}" type="url" placeholder="https://"></label>
        <div class="card" style="box-shadow:none;background:var(--bg)"><span class="eyebrow">Prévia no Google</span><b style="color:#1a0dab;font-size:17px" id="gT"></b><span style="color:#006621;font-size:13px">${esc(urlPagina(slug))}</span><span class="muted" id="gD"></span></div></section>
      <section class="card form"><h3>Botão de WhatsApp</h3>
        <label class="chk"><input type="checkbox" data-k="whatsapp.ativo" ${c.whatsapp.ativo ? "checked" : ""}> Mostrar o botão flutuante no canto da página</label>
        <label class="f">Número com DDD (só números, com 55)<input data-k="whatsapp.numero" value="${esc(c.whatsapp.numero || "")}" inputmode="numeric" placeholder="5511999999999"></label>
        <label class="f">Mensagem que já vem escrita<input data-k="whatsapp.mensagem" value="${esc(c.whatsapp.mensagem || "")}" maxlength="200"></label>
        <h3 style="margin-top:8px">Anúncios e métricas</h3>
        <label class="f">Meta Pixel (Facebook e Instagram): ID<input data-k="pixel.meta" value="${esc(c.pixel.meta || "")}" inputmode="numeric" placeholder="123456789012345"></label>
        <label class="f">Google Analytics 4: ID de medição<input data-k="pixel.ga4" value="${esc(c.pixel.ga4 || "")}" placeholder="G-XXXXXXX"></label>
        <p class="muted" style="font-size:12.5px">O painel já mede visitas, cliques, rolagem e leads sozinho. Pixel e Analytics são para quem anuncia.</p></section></div>`;
    const prev = () => { $("#gT").textContent = c.seo.titulo || c.titulo || slug; $("#gD").textContent = c.seo.descricao || "Escreva uma descrição para aparecer aqui."; };
    prev();
    $$("[data-k]", corpo).forEach(i => i.addEventListener("input", () => { const [a, b] = i.dataset.k.split("."); c[a][b] = i.type === "checkbox" ? i.checked : i.value.trim(); if (a === "whatsapp" && b === "numero") c.whatsapp.numero = i.value.replace(/\D/g, ""); prev(); marca(); }));
  }
  if (aba === "versoes") {
    const vs = (await db.list(`lp_paginas/${slug}/versoes`)).sort((a, b) => b.em - a.em);
    corpo.innerHTML = `<section class="card"><h3>Versões publicadas</h3><p class="muted">Cada publicação guarda uma cópia (até as 20 últimas). Restaurar leva a versão para o rascunho; confira e publique.</p>
      ${vs.length ? `<div class="rolar"><table class="tabela"><thead><tr><th>Publicada em</th><th>Por</th><th>Tamanho</th><th></th></tr></thead><tbody>${vs.map((v, i) => `<tr><td>${fmtDH(v.em)} ${i === 0 ? pill("ok", "No ar") : ""}</td><td>${esc(v.autor || "—")}</td><td class="num">${Math.ceil((v.html || "").length / 1024)} KB</td><td><button class="btn sm" type="button" data-rest="${esc(v.id)}">Restaurar</button></td></tr>`).join("")}</tbody></table></div>` : vazio("Nenhuma versão ainda. Ela aparece aqui quando você publica.")}</section>`;
    $$("[data-rest]").forEach(b => b.onclick = async () => { const v = vs.find(x => x.id === b.dataset.rest); E.html = v.html; await db.set(`lp_paginas/${slug}/privado/rascunho`, { html: v.html, em: Date.now() }); toast("Versão restaurada no rascunho. Confira em Editar e publique."); pintaBarra(); });
  }
};

/* ---------- leads ---------- */
views.leads = async (M, slugSel) => {
  const pg = await paginasDoCliente(); const slug = slugSel || pg[0]?.id;
  M.innerHTML = topo("Leads", pg.length ? `<select class="in-txt" id="selPg" style="width:auto">${pg.map(p => `<option value="${esc(p.id)}" ${p.id === slug ? "selected" : ""}>${esc(p.titulo || p.id)}</option>`).join("")}</select>` : "");
  if (!slug) { M.insertAdjacentHTML("beforeend", `<section class="card">${vazio("Crie uma página com formulário para receber leads.")}</section>`); return; }
  $("#selPg").onchange = e => location.hash = "#/leads/" + e.target.value;
  const ls = (await db.list(`lp_paginas/${slug}/leads`)).sort((a, b) => b.t - a.t);
  const cols = [...new Set(ls.flatMap(l => Object.keys(l.campos || {})))].slice(0, 6);
  const tel = l => { const k = Object.keys(l.campos || {}).find(k => /whats|telefone|celular|fone/i.test(k)); const n = k ? String(l.campos[k]).replace(/\D/g, "") : ""; return n.length >= 10 ? (n.length <= 11 ? "55" + n : n) : ""; };
  const ST = { novo: "Novo", contato: "Em contato", cliente: "Virou cliente", descartado: "Descartado" };
  M.insertAdjacentHTML("beforeend", `<section class="card"><div class="card-h"><h3>${ls.length} ${ls.length === 1 ? "lead" : "leads"}</h3>${ls.length ? `<button class="btn sm" type="button" id="csv">Baixar planilha (.csv)</button>` : ""}</div>
    ${ls.length ? `<div class="rolar"><table class="tabela"><thead><tr><th>Quando</th>${cols.map(c => `<th>${esc(c)}</th>`).join("")}<th>Origem</th><th>Situação</th><th></th></tr></thead><tbody>
      ${ls.map(l => `<tr><td class="num">${fmtDH(l.t)}</td>${cols.map(c => `<td>${esc(l.campos?.[c] ?? "")}</td>`).join("")}<td>${esc((l.utm || "").split("|")[0] || "direto")}</td>
        <td><select class="in-txt" data-st="${esc(l.id)}" style="width:auto;padding:5px 8px">${Object.entries(ST).map(([k, t]) => `<option value="${k}" ${l.status === k ? "selected" : ""}>${t}</option>`).join("")}</select></td>
        <td>${tel(l) ? `<a class="btn sm" href="https://wa.me/${tel(l)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</td></tr>`).join("")}</tbody></table></div>` : vazio("Nenhum lead ainda. Eles chegam aqui quando alguém envia o formulário da página.")}</section>`);
  $$("[data-st]").forEach(s => s.onchange = async () => { await db.set(`lp_paginas/${slug}/leads/${s.dataset.st}`, { status: s.value }, { merge: true }); toast("Situação atualizada."); });
  $("#csv")?.addEventListener("click", () => {
    const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const linhas = [["data", ...cols, "origem", "situacao"].map(q).join(";"), ...ls.map(l => [new Date(l.t).toLocaleString("pt-BR"), ...cols.map(c => l.campos?.[c]), (l.utm || "").split("|")[0], ST[l.status] || l.status].map(q).join(";"))];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + linhas.join("\n")], { type: "text/csv" })); a.download = `leads-${slug}.csv`; a.click();
  });
};

/* ---------- domínio próprio ---------- */
export const DNS_PADRAO = "Tipo A · Nome @ · Valor 199.36.158.100\nTipo TXT · Nome @ · Valor hosting-site=upe-criativo-lp";
views.dominios = async M => {
  const [pg, ds] = await Promise.all([paginasDoCliente(), db.list("lp_dominios", { where: [["cid", "==", S.cid]] })]);
  M.innerHTML = topo("Domínio próprio", `<button class="btn azul" type="button" id="novoDom" ${pg.length ? "" : "disabled"}>+ Conectar domínio</button>`) +
    `<section class="card"><h3>Como funciona</h3><ol style="margin:0;padding-left:20px;display:grid;gap:6px">
      <li>Você informa o domínio (ex.: <b>www.suamarca.com.br</b>) e qual página ele abre.</li>
      <li>A Upe prepara a conexão e mostra aqui os registros de DNS.</li>
      <li>Você (ou quem cuida do seu domínio: Registro.br, GoDaddy, Hostinger…) cria esses registros.</li>
      <li>Em até 24 h o domínio passa a abrir a sua página, com cadeado (HTTPS).</li></ol></section>
    <section class="card"><h3>Seus domínios</h3>${ds.length ? ds.map(d => `<div class="card" style="box-shadow:none">
      <div class="card-h"><b style="font-size:16px">${esc(d.id)}</b>${d.status === "ativo" ? pill("ok", "Conectado") : d.status === "dns" ? pill("info", "Falta criar o DNS") : pill("warn", "Aguardando a Upe")}</div>
      <span class="muted">Abre a página <b>${esc(pg.find(p => p.id === d.slug)?.titulo || d.slug)}</b></span>
      ${d.status !== "pendente" ? `<div><span class="eyebrow">Registros de DNS</span><pre style="white-space:pre-wrap;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px;margin:6px 0 0;font-size:13px">${esc(d.dns || DNS_PADRAO)}</pre></div>` : `<p class="muted">A Upe recebeu o pedido e responde em até 1 dia útil com os registros de DNS.</p>`}
      <div class="linha">${d.status === "ativo" ? `<a class="btn sm" href="https://${esc(d.id)}" target="_blank" rel="noopener">Abrir ↗</a>` : ""}<button class="btn sm perigo" type="button" data-rm="${esc(d.id)}">Remover</button></div></div>`).join("") : vazio("Nenhum domínio conectado. Sua página funciona no endereço da Upe enquanto isso.")}</section>`;
  $("#novoDom").onclick = () => dialogo(`<h3>Conectar domínio</h3>
    <label class="f">Domínio<input name="host" required placeholder="www.suamarca.com.br" pattern="[A-Za-z0-9.-]{4,120}"></label>
    <label class="f">Página que ele abre<select name="slug">${pg.map(p => `<option value="${esc(p.id)}">${esc(p.titulo || p.id)}</option>`).join("")}</select></label>
    <p class="muted" style="font-size:12.5px">Ainda não tem domínio? Registre em registro.br (domínios .com.br) e volte aqui.</p>${botoesDlg("Pedir conexão")}`, async fd => {
    const host = String(fd.get("host")).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9.-]{4,120}$/.test(host) || !host.includes(".")) { toast("Domínio inválido."); return false; }
    try { await db.set("lp_dominios/" + host, { cid: S.cid, slug: fd.get("slug"), status: "pendente", criadoEm: Date.now(), cliente: S.cliente?.nome || "" }); }
    catch (e) { toast(e?.code === "permission-denied" ? "Esse domínio já foi pedido por outra conta. Fale com a Upe." : msgErro(e)); return false; }
    await db.set("lp_paginas/" + fd.get("slug"), { dominio: host }, { merge: true }).catch(() => {});
    toast("Pedido enviado à Upe."); ctx.rota();
  });
  $$("[data-rm]").forEach(b => b.onclick = async () => { if (!confirm(`Remover ${b.dataset.rm}? A página volta a abrir só no endereço da Upe.`)) return; await db.del("lp_dominios/" + b.dataset.rm); toast("Domínio removido."); ctx.rota(); });
};
