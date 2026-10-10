/* Kit Upe · liga qualquer HTML às plataformas da Upe Criativo (Upe ERP, agenda online, WhatsApp e pagamento).
   Uso: marque os elementos com atributos data-upe-* (contrato completo nas habilidades em .claude/skills e em /kit/README.md).
   Configuração (a primeira encontrada vale): window.UPE_KIT = {…}  →  atributos do <script src=".../upe-kit.js" data-loja="…">  →  <html data-upe-loja="…">.
     loja      endereço da loja do Upe ERP (upe-criativo-lojas.web.app/<loja>)
     agenda    endereço da agenda online (upe-criativo-sistemas.web.app/<agenda>)
     whatsapp  número com DDI e DDD, só dígitos (5511999999999)
     compra    "loja" (finaliza na loja do ERP) · "whatsapp" (pedido pronto no WhatsApp) · "gateway" (pagamento direto; precisa do servidor ligado)
     cor       cor dos botões gerados pelo kit (senão usa --upe-cor do CSS da página)
   Lê os dados públicos pela API REST do Firestore; não usa cookies. */
(function () {
  if (window.__upeKit) return; window.__upeKit = true;
  const P = "upecriativo-cc472", KEY = "AIzaSyDJqqSMLWZLKSt9K1jPzvvQgyikZy4q9vw";
  const API = `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents/`;
  const LOJAS = "https://upe-criativo-lojas.web.app", AGENDAS = "https://upe-criativo-sistemas.web.app", API_UPE = "https://upe-criativo-lp.web.app/api";
  const sc = document.currentScript, html = document.documentElement, W = window.UPE_KIT || {};
  const cfgDe = k => W[k] ?? sc?.dataset?.[k] ?? html.dataset["upe" + k[0].toUpperCase() + k.slice(1)] ?? "";
  const C = { loja: cfgDe("loja"), agenda: cfgDe("agenda"), whatsapp: String(cfgDe("whatsapp")).replace(/\D/g, ""), compra: cfgDe("compra") || "loja", cor: cfgDe("cor"), gateway: !!W.gateway, pagina: W.pagina || "" };
  /* <html data-upe-*> é só configuração: nunca vira elemento do kit */
  const $$ = (s, r = document) => [...r.querySelectorAll(s)].filter(e => e !== html);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = v => (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dec = v => v == null ? null : "stringValue" in v ? v.stringValue : "integerValue" in v ? +v.integerValue : "doubleValue" in v ? v.doubleValue : "booleanValue" in v ? v.booleanValue
    : "mapValue" in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)])) : "arrayValue" in v ? (v.arrayValue.values || []).map(dec) : null;
  const docDe = j => ({ id: j.name.split("/").pop(), ...Object.fromEntries(Object.entries(j.fields || {}).map(([k, x]) => [k, dec(x)])) });
  const ler = async c => { const r = await fetch(API + c + "?key=" + KEY); return r.ok ? docDe(await r.json()) : null; };
  const listar = async c => { const r = await fetch(API + c + "?pageSize=300&key=" + KEY); return r.ok ? ((await r.json()).documents || []).map(docDe) : []; };
  const evento = (alvo) => { try { window.dispatchEvent(new CustomEvent("upe:evento", { detail: { alvo } })); } catch (_) {} };

  /* ---------- estilo base (herda fonte e cores da página; tudo dentro de .upe-k) ---------- */
  const st = document.createElement("style"); st.setAttribute("data-upe-kit", "");
  st.textContent = `.upe-k{--k-cor:var(--upe-cor,${C.cor || "#1a73d9"});--k-txt:var(--upe-texto-botao,#fff);--k-borda:var(--upe-borda,rgba(0,0,0,.12));--k-fundo:var(--upe-fundo-card,#fff);--k-raio:var(--upe-raio,14px);font:inherit;color:inherit;box-sizing:border-box}
.upe-k *{box-sizing:border-box}.upe-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--upe-card-min,220px),1fr));gap:var(--upe-gap,18px)}
.upe-card{background:var(--k-fundo);border:1px solid var(--k-borda);border-radius:var(--k-raio);overflow:hidden;display:flex;flex-direction:column;color:#14171c}
.upe-card .upe-foto{aspect-ratio:1;background:#f2f2f2 center/cover no-repeat;display:block}.upe-card .upe-corpo{padding:14px;display:grid;gap:6px;flex:1;align-content:start}
.upe-card .upe-cat{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.7}.upe-card .upe-nome{font-weight:700;font-size:16px;line-height:1.25}
.upe-preco{font-weight:900;font-size:18px}.upe-de{text-decoration:line-through;opacity:.55;font-size:14px;margin-right:6px;font-weight:400}
.upe-bt{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:calc(var(--k-raio) - 4px);background:var(--k-cor);color:var(--k-txt);font:inherit;font-weight:700;padding:11px 14px;cursor:pointer;text-decoration:none;width:100%}
.upe-bt.sec{background:transparent;color:inherit;border:1px solid var(--k-borda)}.upe-bt[disabled]{opacity:.5;cursor:default}
.upe-flut{position:fixed;right:18px;bottom:90px;z-index:2147482990;border-radius:99px;width:auto;padding:12px 18px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.upe-qtd{display:inline-grid;place-items:center;min-width:22px;height:22px;border-radius:11px;background:#fff;color:#14171c;font-size:12px;font-weight:900;padding:0 6px}
.upe-gaveta{position:fixed;inset:0;z-index:2147483002;background:rgba(5,12,26,.5);display:flex;justify-content:flex-end}.upe-gaveta>div{background:#fff;color:#14171c;width:min(420px,100%);height:100%;display:flex;flex-direction:column;padding:18px;gap:12px;overflow:auto}
.upe-li{display:grid;grid-template-columns:56px 1fr auto;gap:10px;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px}.upe-li i{width:56px;height:56px;border-radius:10px;background:#f2f2f2 center/cover}
.upe-li .upe-q{display:flex;gap:6px;align-items:center}.upe-li .upe-q button{width:28px;height:28px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer}
.upe-servs{display:grid;gap:10px}.upe-serv{display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid var(--k-borda);border-radius:var(--k-raio);padding:14px;background:var(--k-fundo);color:#14171c}
.upe-serv .upe-bt{width:auto}.upe-agenda-fr{width:100%;border:0;min-height:640px;border-radius:var(--k-raio);background:transparent}.upe-vazio{opacity:.7;padding:12px 0}`;
  document.head.appendChild(st);

  /* ---------- links ---------- */
  const urlLoja = (extra = "") => C.loja ? `${LOJAS}/${C.loja}${extra || "?vitrine=1"}` : "#";
  const urlAgenda = (extra = "") => C.agenda ? `${AGENDAS}/${C.agenda}${extra}` : "#";
  const urlWa = msg => C.whatsapp ? `https://wa.me/${C.whatsapp}${msg ? "?text=" + encodeURIComponent(msg) : ""}` : "#";
  function ligarLinks(r = document) {
    $$("[data-upe-link]", r).forEach(a => {
      const v = a.dataset.upeLink, [tipo, arg] = v.split(":");
      const href = tipo === "inicio" ? (C.pagina ? "/" + (location.hostname.includes("web.app") ? C.pagina : "") : "/") : tipo === "loja" ? urlLoja() : tipo === "produto" ? urlLoja("/p/" + encodeURIComponent(arg || "")) : tipo === "agenda" ? urlAgenda(arg ? "?servico=" + encodeURIComponent(arg) : "") : tipo === "whatsapp" ? urlWa(a.dataset.mensagem || "") : tipo === "carrinho" ? "#carrinho" : a.getAttribute("href");
      if (href) a.setAttribute("href", href);
      if (/^https?:/.test(href) && !/^#/.test(href) && tipo !== "inicio") { a.target = a.target || "_blank"; a.rel = "noopener"; }
      if (tipo === "carrinho") a.addEventListener("click", e => { e.preventDefault(); abrirCarrinho(); });
    });
    $$("[data-upe-whatsapp]", r).forEach(a => { const n = (a.dataset.upeWhatsapp || C.whatsapp).replace(/\D/g, ""); if (!n) return; const u = `https://wa.me/${n}${a.dataset.mensagem ? "?text=" + encodeURIComponent(a.dataset.mensagem) : ""}`; if (a.tagName === "A") { a.href = u; a.target = "_blank"; a.rel = "noopener"; } else a.addEventListener("click", () => open(u, "_blank", "noopener")); });
  }

  /* ---------- loja: produtos e carrinho ---------- */
  let PRODS = null, CFG = {}; const KC = `upe-kit:${C.loja}:carrinho`;
  let CART = []; try { CART = JSON.parse(localStorage.getItem(KC) || "[]"); } catch (_) {}
  const salvar = () => { try { localStorage.setItem(KC, JSON.stringify(CART)); } catch (_) {} pintarContadores(); };
  const precoDe = p => +p.promo > 0 && +p.promo < +p.preco ? +p.promo : +p.preco || 0;
  const disp = p => p.estoque == null ? Infinity : Math.max(0, +p.estoque);
  async function carregarLoja() {
    if (PRODS || !C.loja) return PRODS || [];
    const [c, ps] = await Promise.all([ler(`lojas/${C.loja}/publico/config`), listar(`lojas/${C.loja}/produtos`)]);
    CFG = c || {}; PRODS = ps.filter(p => p.nome && p.oculto !== true && p.web !== false); return PRODS;
  }
  const P_ = id => PRODS?.find(p => p.id === id);
  function preencher(el, p) {
    const pr = precoDe(p), de = +p.promo > 0 && +p.promo < +p.preco ? +p.preco : 0, esg = disp(p) <= 0;
    $$("[data-campo]", el).forEach(x => { const k = x.dataset.campo;
      if (k === "imagem") { if (x.tagName === "IMG") { x.src = p.imagem || ""; x.alt = p.nome; } else x.style.backgroundImage = p.imagem ? `url("${p.imagem}")` : ""; }
      else if (k === "preco") x.textContent = brl(pr); else if (k === "preco-de") { x.textContent = de ? brl(de) : ""; x.hidden = !de; }
      else if (k === "nome") x.textContent = p.nome; else if (k === "descricao") x.textContent = p.descricao || ""; else if (k === "categoria") x.textContent = p.classe || "";
      else if (k === "estoque") x.textContent = esg ? "Esgotado" : p.estoque != null ? p.estoque + " em estoque" : ""; });
    $$("[data-upe-acao]", el).forEach(b => { b.dataset.pid = p.id; if (esg && /comprar|carrinho/.test(b.dataset.upeAcao)) { b.disabled = true; b.textContent = "Esgotado"; } });
  }
  const cardPadrao = p => { const pr = precoDe(p), de = +p.promo > 0 && +p.promo < +p.preco ? +p.preco : 0, esg = disp(p) <= 0;
    return `<article class="upe-card"><a class="upe-foto" href="${esc(urlLoja("/p/" + encodeURIComponent(p.id)))}" target="_blank" rel="noopener" style="background-image:url('${esc(p.imagem || "")}')" aria-label="${esc(p.nome)}"></a>
      <div class="upe-corpo">${p.classe ? `<span class="upe-cat">${esc(p.classe)}</span>` : ""}<span class="upe-nome">${esc(p.nome)}</span><span class="upe-preco">${de ? `<span class="upe-de">${brl(de)}</span>` : ""}${brl(pr)}</span>
      <button type="button" class="upe-bt" data-upe-acao="carrinho" data-pid="${esc(p.id)}" ${esg ? "disabled" : ""}>${esg ? "Esgotado" : "Adicionar ao carrinho"}</button></div></article>`; };
  async function pintarProdutos() {
    const alvos = $$("[data-upe-produtos],[data-upe-produto]"); if (!alvos.length) return;
    if (!C.loja) { alvos.forEach(a => a.innerHTML = `<p class="upe-vazio">Configure a loja (data-upe-loja) para mostrar os produtos.</p>`); return; }
    const ps = await carregarLoja();
    for (const a of alvos) {
      a.classList.add("upe-k");
      if (a.hasAttribute("data-upe-produto")) { const p = P_(a.dataset.upeProduto); if (!p) { a.hidden = true; continue; } if (a.querySelector("[data-campo]")) preencher(a, p); else a.innerHTML = cardPadrao(p); continue; }
      let l = ps.slice(); const cat = a.dataset.categoria, ids = (a.dataset.ids || "").split(",").map(s => s.trim()).filter(Boolean);
      if (cat) l = l.filter(p => (p.classe || "").toLowerCase() === cat.toLowerCase());
      if (ids.length) l = ids.map(P_).filter(Boolean);
      if (a.hasAttribute("data-destaque")) l = l.filter(p => +p.promo > 0 && +p.promo < +p.preco);
      const o = a.dataset.ordem; l.sort(o === "menor" ? (x, y) => precoDe(x) - precoDe(y) : o === "maior" ? (x, y) => precoDe(y) - precoDe(x) : (x, y) => (x.nome || "").localeCompare(y.nome || "", "pt-BR"));
      if (+a.dataset.limite) l = l.slice(0, +a.dataset.limite);
      const tpl = a.dataset.modelo ? document.querySelector(a.dataset.modelo) : a.querySelector("template");
      if (tpl) { const box = document.createElement("div"); box.className = a.dataset.classe || "upe-grade"; l.forEach(p => { const n = tpl.content.firstElementChild.cloneNode(true); preencher(n, p); box.appendChild(n); }); a.querySelectorAll(":scope > :not(template)").forEach(x => x.remove()); a.appendChild(box); }
      else a.innerHTML = l.length ? `<div class="upe-grade">${l.map(cardPadrao).join("")}</div>` : `<p class="upe-vazio">Nenhum produto disponível agora.</p>`;
    }
    $$("[data-upe-preco]").forEach(x => { const p = P_(x.dataset.upePreco); if (p) x.textContent = brl(precoDe(p)); });
    pintarContadores();
  }
  const totais = () => { const it = CART.map(x => ({ ...x, p: P_(String(x.pid).split("~")[0]) })).filter(x => x.p); return { it, total: +it.reduce((s, x) => s + precoDe(x.p) * x.qtd, 0).toFixed(2), n: it.reduce((s, x) => s + x.qtd, 0) }; };
  function addCarrinho(pid, q = 1) { const p = P_(pid); if (!p) return; const x = CART.find(i => i.pid === pid); const nq = (x?.qtd || 0) + q; if (p.estoque != null && nq > +p.estoque) return aviso("Quantidade acima do estoque."); if (x) x.qtd = nq; else CART.push({ pid, qtd: q }); CART = CART.filter(i => i.qtd > 0); salvar(); evento("Carrinho: " + p.nome); }
  function pintarContadores() { const n = totais().n; $$("[data-upe-carrinho] .upe-qtd,[data-upe-contador]").forEach(x => { x.textContent = n; x.hidden = !n; }); }
  function aviso(t) { const d = document.createElement("div"); d.textContent = t; d.setAttribute("role", "status"); d.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#14171c;color:#fff;padding:10px 16px;border-radius:12px;font:600 14px system-ui,sans-serif;z-index:2147483003"; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
  function msgPedido() { const t = totais(); return `Olá! Quero fazer este pedido${CFG.nome ? " na " + CFG.nome : ""}:\n` + t.it.map(x => `• ${x.qtd}x ${x.p.nome} (${brl(precoDe(x.p))})`).join("\n") + `\nTotal: ${brl(t.total)}`; }
  async function finalizar(modo) {
    const t = totais(); if (!t.n) return;
    if (modo === "whatsapp") { open(urlWa(msgPedido()), "_blank", "noopener"); evento("WhatsApp: pedido"); return; }
    if (modo === "gateway" && C.gateway) {
      try { const r = await fetch(API_UPE + "/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loja: C.loja, pagina: C.pagina, itens: t.it.map(x => ({ pid: x.pid, qtd: x.qtd })), volta: location.href }) });
        const j = await r.json(); if (j.url) { location.href = j.url; return; } } catch (_) {}
      aviso("Pagamento online indisponível agora. Vamos finalizar na loja.");
    }
    location.href = urlLoja("?add=" + encodeURIComponent(t.it.map(x => `${x.pid}:${x.qtd}`).join(",")) + "&de=" + encodeURIComponent(location.hostname));
  }
  function abrirCarrinho() {
    const t = totais(), g = document.createElement("div"); g.className = "upe-gaveta upe-k"; g.setAttribute("role", "dialog"); g.setAttribute("aria-label", "Carrinho");
    const modos = [C.compra === "gateway" && C.gateway ? `<button type="button" class="upe-bt" data-fim="gateway">Pagar agora</button>` : "", C.loja ? `<button type="button" class="upe-bt ${C.compra === "gateway" && C.gateway ? "sec" : ""}" data-fim="loja">Finalizar compra</button>` : "", C.whatsapp ? `<button type="button" class="upe-bt ${C.compra === "whatsapp" ? "" : "sec"}" data-fim="whatsapp">Pedir pelo WhatsApp</button>` : ""];
    if (C.compra === "whatsapp") modos.reverse();
    g.innerHTML = `<div><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:20px">Carrinho</b><button type="button" class="upe-bt sec" style="width:auto" data-fechar aria-label="Fechar">✕</button></div>
      ${t.it.length ? t.it.map(x => `<div class="upe-li"><i style="background-image:url('${esc(x.p.imagem || "")}')"></i><div><b>${esc(x.p.nome)}</b><div>${brl(precoDe(x.p))}</div></div><div class="upe-q"><button type="button" data-q="${esc(x.pid)}:-1" aria-label="Menos">−</button><b>${x.qtd}</b><button type="button" data-q="${esc(x.pid)}:1" aria-label="Mais">+</button></div></div>`).join("") + `<div style="display:flex;justify-content:space-between;font-size:18px"><span>Total</span><b>${brl(t.total)}</b></div>${modos.join("")}<p style="font-size:12px;opacity:.7">Frete, cupons e pagamento são confirmados na finalização.</p>` : `<p class="upe-vazio">Seu carrinho está vazio.</p>`}</div>`;
    g.addEventListener("click", e => { if (e.target === g || e.target.closest("[data-fechar]")) return g.remove(); const q = e.target.closest("[data-q]"); if (q) { const [pid, n] = q.dataset.q.split(":"); addCarrinho(pid, +n); g.remove(); abrirCarrinho(); } const f = e.target.closest("[data-fim]"); if (f) finalizar(f.dataset.fim); });
    document.body.appendChild(g);
  }
  function montarCarrinhos() {
    const els = $$("[data-upe-carrinho]");
    els.forEach(b => { b.classList.add("upe-k"); if (!b.innerHTML.trim()) b.innerHTML = `<button type="button" class="upe-bt ${b.hasAttribute("data-flutuante") ? "upe-flut" : ""}">Carrinho <span class="upe-qtd" hidden>0</span></button>`; b.addEventListener("click", e => { e.preventDefault(); abrirCarrinho(); }); });
    if (location.hash === "#carrinho") setTimeout(abrirCarrinho, 300);
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-upe-acao]"); if (!b || b.disabled || b.dataset.upeAcao === "agendar") return; const a = b.dataset.upeAcao, pid = b.dataset.pid || b.dataset.upeId; e.preventDefault();
    if (a === "carrinho") { addCarrinho(pid, 1); aviso("Adicionado ao carrinho"); }
    else if (a === "comprar") { addCarrinho(pid, 1); finalizar(C.compra); }
    else if (a === "whatsapp") { const p = P_(pid); open(urlWa(`Olá! Tenho interesse em ${p ? p.nome + " (" + brl(precoDe(p)) + ")" : "um produto"}.`), "_blank", "noopener"); evento("WhatsApp: " + (p?.nome || "")); }
    else if (a === "ver") open(urlLoja("/p/" + encodeURIComponent(pid)), "_blank", "noopener"); });

  /* ---------- agenda: serviços e agendamento embutido ---------- */
  async function pintarAgenda() {
    const sv = $$("[data-upe-servicos]"), emb = $$("[data-upe-agenda]"); if (!sv.length && !emb.length) return;
    emb.forEach(a => { const slug = a.dataset.upeAgenda || C.agenda; if (!slug) return; a.classList.add("upe-k"); a.innerHTML = `<iframe class="upe-agenda-fr" title="Agendar horário" loading="lazy" src="${esc(`${AGENDAS}/${slug}?embed=1${a.dataset.servico ? "&servico=" + encodeURIComponent(a.dataset.servico) : ""}`)}"></iframe>`; });
    if (!sv.length) return;
    const slug = sv[0].dataset.upeServicos || C.agenda, ag = slug ? await ler("agenda_paginas/" + slug) : null;
    sv.forEach(a => { a.classList.add("upe-k"); const tpl = a.querySelector("template");
      if (!ag) { a.innerHTML = `<p class="upe-vazio">Configure a agenda (data-upe-agenda) para mostrar os serviços.</p>`; return; }
      const l = (ag.servicos || []).slice(0, +a.dataset.limite || 99);
      if (tpl) { const box = document.createElement("div"); box.className = a.dataset.classe || "upe-servs"; l.forEach(s => { const n = tpl.content.firstElementChild.cloneNode(true); $$("[data-campo]", n).forEach(x => { const k = x.dataset.campo; x.textContent = k === "nome" ? s.nome : k === "duracao" ? s.dur + " min" : k === "preco" ? (+s.preco ? brl(s.preco) : "a combinar") : ""; }); $$("[data-upe-acao='agendar'],a[data-agendar]", n).forEach(b => { b.setAttribute("href", `${AGENDAS}/${slug}?servico=${encodeURIComponent(s.id)}`); b.target = "_blank"; b.rel = "noopener"; }); box.appendChild(n); }); a.querySelectorAll(":scope > :not(template)").forEach(x => x.remove()); a.appendChild(box); }
      else a.innerHTML = `<div class="upe-servs">${l.map(s => `<div class="upe-serv"><div><b>${esc(s.nome)}</b><div style="opacity:.75;font-size:14px">${s.dur} min · ${+s.preco ? brl(s.preco) : "a combinar"}</div></div><a class="upe-bt" href="${esc(`${AGENDAS}/${slug}?servico=${encodeURIComponent(s.id)}`)}" target="_blank" rel="noopener">Agendar</a></div>`).join("")}</div>`; });
  }
  addEventListener("message", e => { const d = e.data || {}; if (d.upeAgendaAltura) $$(".upe-agenda-fr").forEach(f => { if (f.contentWindow === e.source) f.style.height = Math.max(480, d.upeAgendaAltura) + "px"; }); });

  function iniciar() { ligarLinks(); montarCarrinhos(); pintarProdutos().catch(() => {}); pintarAgenda().catch(() => {}); }
  window.UpeKit = { config: C, abrirCarrinho, adicionar: addCarrinho, recarregar: iniciar };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
