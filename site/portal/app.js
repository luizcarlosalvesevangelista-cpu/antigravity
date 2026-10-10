/* Modelos editáveis de post (estilo Canva) das frentes da Upe: Upe ERP, Upe TV, Loja Upe, Upe Landing pages e Upe Sistemas (agenda e dashboards).
   Desenha no <canvas> com Lato e as imagens do site. Usado pelo editor do painel (Cronograma Upe → Modelos)
   e pelo gerador das artes e reels do cronograma (mesmo arquivo, mesmo resultado).
   UpeModelos.render(canvas, modelo, { base, t }) → Promise. t (0…1) anima a entrada dos elementos (reels). */
(function () {
  const FRENTES = {
    erp: { nome: "Upe ERP", chip: "UPE ERP", base: "#234e7b", escuro: "#0b1d3a", destaque: "#5fb3ff", creme: "#f2f0e2", tinta: "#0d1b33", cta: "Teste 14 dias grátis", rodape: "Loja online, PDV e pedidos num só painel",
      imagens: ["assets/img/ui/erp-painel.jpg", "assets/img/ui/erp-pdv.jpg", "assets/img/ui/erp-pedidos.jpg"] },
    tv: { nome: "Upe TV", chip: "UPE TV", base: "#0C4F7F", escuro: "#061A2B", destaque: "#F2B33D", creme: "#F2F0E1", tinta: "#0b1a26", cta: "Anuncie no Upe TV", rodape: "Sua marca na tela certa",
      imagens: ["assets/img/ui/tv-tela.jpg", "assets/img/ui/tv-portal.jpg", "assets/img/ui/tv-qr.jpg"] },
    loja: { nome: "Loja Upe", chip: "LOJA UPE", base: "#0b1d3a", escuro: "#060f20", destaque: "#ff7a59", creme: "#f4f1ea", tinta: "#0d1b33", cta: "Monte a sua loja", rodape: "A loja online da sua marca",
      imagens: ["assets/img/ui/loja-vitrine.jpg", "assets/img/ui/loja-produtos.jpg", "assets/img/ui/loja-pix.jpg", "assets/img/ui/loja-pedido.jpg", "assets/img/ui/loja-produto.jpg"] },
    landing: { nome: "Upe Landing pages", chip: "LANDING PAGES", base: "#3a2f6b", escuro: "#1d1738", destaque: "#c9b8ff", creme: "#f3f0fa", tinta: "#1d1738", cta: "Quero a minha página", rodape: "Páginas de venda com painel de resultados",
      imagens: ["assets/img/ui/lp-editor.jpg", "assets/img/ui/lp-analise.jpg", "assets/img/ui/lp-pagina.jpg", "assets/img/ui/lp-leads.jpg"] },
    sistemas: { nome: "Upe Sistemas", chip: "UPE SISTEMAS", base: "#1f5c50", escuro: "#0d2a24", destaque: "#7fe0c4", creme: "#eef6f2", tinta: "#0d2a24", cta: "Quero a minha agenda", rodape: "Agenda online e dashboards sob medida",
      imagens: ["assets/img/ui/ag-celular.jpg", "assets/img/ui/dash-painel.jpg", "assets/img/ui/ag-painel.jpg", "assets/img/ui/ag-celular-2.jpg"] }
  };
  const FORMATOS = { feed: { nome: "Feed 4:5", w: 1080, h: 1350 }, story: { nome: "Story / Reels 9:16", w: 1080, h: 1920 }, quadrado: { nome: "Quadrado 1:1", w: 1080, h: 1080 }, video: { nome: "Vídeo / capa YouTube 16:9", w: 1920, h: 1080 } };
  const LAYOUTS = { capa: "Título forte", foto: "Imagem + texto", tela: "Tela do app", lista: "Lista numerada", cta: "Chamada final" };
  const padrao = (frente = "erp", layout = "capa", formato = "feed") => { const F = FRENTES[frente] || FRENTES.erp;
    return { frente, layout, formato, tema: layout === "lista" ? "claro" : "escuro", eyebrow: F.nome, titulo: "Escreva o título do post", texto: "Um texto curto que explica a ideia em uma ou duas frases.", cta: F.cta, itens: ["Primeiro ponto", "Segundo ponto", "Terceiro ponto"], imagem: F.imagens[0] || "", handle: "@upecriativo", slide: "" }; };

  /* ---------- utilidades ---------- */
  const cache = new Map();
  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (cache.has(src)) return cache.get(src);
    const p = new Promise(ok => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
    cache.set(src, p); return p;
  }
  const url = (p, base) => !p ? "" : /^(data:|blob:|https?:)/.test(p) ? p : (base || "") + p;
  const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);
  const fase = (t, a, b) => t == null ? 1 : ease((t - a) / (b - a));   // progresso de um elemento entre a e b
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function linhas(ctx, txt, maxW) {
    const out = []; String(txt || "").split("\n").forEach(par => { let l = ""; par.split(/\s+/).filter(Boolean).forEach(w => { const t = l ? l + " " + w : w; if (ctx.measureText(t).width > maxW && l) { out.push(l); l = w; } else l = t; }); out.push(l); });
    return out;
  }
  // escreve texto com quebra automática, diminuindo a fonte até caber em maxL linhas
  function texto(ctx, txt, x, y, maxW, { size, min = 28, peso = 900, cor, maxL = 4, lh = 1.08, alpha = 1, dy = 0 }) {
    let s = size, ls;
    for (; s >= min; s -= 2) { ctx.font = `${peso} ${s}px Lato, "Helvetica Neue", Arial, sans-serif`; ls = linhas(ctx, txt, maxW); if (ls.length <= maxL) break; }
    if (ls.length > maxL) { ls = ls.slice(0, maxL); ls[maxL - 1] = ls[maxL - 1].replace(/\s*\S*$/, "") + "…"; }
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = cor; ctx.textBaseline = "alphabetic";
    ls.forEach((l, i) => ctx.fillText(l, x, y + dy + s * 0.92 + i * s * lh));
    ctx.restore(); return { h: ls.length * s * lh, s };
  }
  function capaImg(ctx, img, x, y, w, h, zoom = 1) {
    if (!img) { ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(x, y, w, h); return; }
    const r = Math.max(w / img.width, h / img.height) * zoom, iw = img.width * r, ih = img.height * r;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); ctx.restore();
  }
  function padrao45(ctx, W, H, cor, a) { // padrão diagonal sutil da marca
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = cor; ctx.lineWidth = 3;
    for (let x = -H; x < W + H; x += 56) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H * .6, H); ctx.stroke(); }
    ctx.restore();
  }
  let LOGO = null;
  function logo(ctx, cor, x, y, h, base) {
    if (!LOGO) return; const w = LOGO.width * h / LOGO.height, c = document.createElement("canvas"); c.width = Math.ceil(w); c.height = Math.ceil(h);
    const g = c.getContext("2d"); g.drawImage(LOGO, 0, 0, w, h); g.globalCompositeOperation = "source-in"; g.fillStyle = cor; g.fillRect(0, 0, w, h);
    ctx.drawImage(c, x, y); return w;
  }
  function chip(ctx, txt, x, y, cor, fundo) {
    ctx.font = `900 26px Lato, Arial, sans-serif`; const w = ctx.measureText(txt).width + 44;
    ctx.save(); rr(ctx, x, y, w, 50, 25); if (fundo) { ctx.fillStyle = fundo; ctx.fill(); } else { ctx.strokeStyle = cor; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = fundo ? cor : cor; ctx.fillText(txt, x + 22, y + 35); ctx.restore(); return w;
  }
  function botao(ctx, txt, x, y, F, escuro, alpha = 1) {
    ctx.font = `900 40px Lato, Arial, sans-serif`; const w = ctx.measureText(txt).width + 96;
    ctx.save(); ctx.globalAlpha *= alpha; rr(ctx, x, y, w, 96, 48); ctx.fillStyle = escuro ? F.creme : F.base; ctx.fill();
    ctx.fillStyle = escuro ? F.base : F.creme; ctx.fillText(txt, x + 48, y + 62); ctx.restore(); return w;
  }

  // tela do app dentro da área (x, y, w, h): imagem larga → janela de navegador; imagem alta → celular centralizado
  function tela(ctx, img, x, y, w, h, a, t) {
    const z = 1 + (t == null ? 0 : (1 - t) * .05);
    if (img && img.height > img.width * 1.1) {
      const ph = h, pw = Math.min(w, ph * img.width / img.height + 36), px = x + (w - pw) / 2;
      ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20; rr(ctx, px, y, pw, ph, 56); ctx.fillStyle = "#11151c"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = a; rr(ctx, px + 16, y + 16, pw - 32, ph - 32, 42); ctx.clip(); ctx.fillStyle = "#fff"; ctx.fillRect(px, y, pw, ph);
      const r = (pw - 32) / img.width; ctx.drawImage(img, px + 16, y + 16, pw - 32, img.height * r); ctx.restore();
      ctx.save(); ctx.globalAlpha = a; rr(ctx, px + pw / 2 - 60, y + 26, 120, 26, 13); ctx.fillStyle = "#11151c"; ctx.fill(); ctx.restore(); return;
    }
    const fh = Math.min(h, img ? w * img.height / img.width + 46 : w * .62);
    ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20; rr(ctx, x, y, w, fh, 26); ctx.fillStyle = "#e9edf3"; ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha = a; rr(ctx, x, y, w, fh, 26); ctx.clip(); ctx.fillStyle = "#dfe4ec"; ctx.fillRect(x, y, w, 46); ["#ff6159", "#ffbd2e", "#28c941"].forEach((c, i) => { ctx.beginPath(); ctx.arc(x + 30 + i * 26, y + 23, 8, 0, 7); ctx.fillStyle = c; ctx.fill(); });
    capaImg(ctx, img, x, y + 46, w, fh - 46, z); ctx.restore();
  }

  /* ---------- desenho ---------- */
  async function render(canvas, m0, opts = {}) {
    const m = { ...padrao(m0.frente, m0.layout, m0.formato), ...m0 }, F = FRENTES[m.frente] || FRENTES.erp, FM = FORMATOS[m.formato] || FORMATOS.feed;
    const W = FM.w, H = FM.h, t = opts.t, base = opts.base || "";
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (document.fonts && document.fonts.load) { try { await Promise.all([document.fonts.load("900 60px Lato"), document.fonts.load("400 40px Lato"), document.fonts.load("700 40px Lato")]); } catch (e) {} }
    LOGO = LOGO || await loadImg(url("assets/img/upe-logo-creme.png", base));
    const img = m.layout === "foto" || m.layout === "tela" ? await loadImg(url(m.imagem, base)) : null;
    const escuro = m.tema !== "claro", bg = escuro ? (m.layout === "cta" ? F.escuro : F.base) : F.creme, fg = escuro ? F.creme : F.tinta, sub = escuro ? "rgba(242,240,226,.82)" : "rgba(13,27,51,.75)";
    const largo = W > H * 1.3, M = largo ? 110 : 88, story = H > 1500;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    padrao45(ctx, W, H, escuro ? "#ffffff" : F.base, escuro ? .05 : .05);
    // brilho no canto
    const gr = ctx.createRadialGradient(W * .9, 0, 10, W * .9, 0, W * .9); gr.addColorStop(0, escuro ? "rgba(255,255,255,.14)" : "rgba(12,79,127,.08)"); gr.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const topoY = story ? 150 : 88, a1 = fase(t, 0, .12), a2 = fase(t, .08, .3), a3 = fase(t, .22, .45), a4 = fase(t, .4, .6), a5 = fase(t, .55, .75);
    // cabeçalho: logo + chip da frente
    { ctx.save(); ctx.globalAlpha = a1; const lw = logo(ctx, fg, M, topoY, 44) || 0; chip(ctx, F.chip, M + lw + 26, topoY - 3, escuro ? F.destaque : F.base); ctx.restore(); }
    if (m.slide) { ctx.save(); ctx.globalAlpha = a1; ctx.font = "700 30px Lato, Arial"; ctx.fillStyle = sub; const tw = ctx.measureText(m.slide).width; ctx.fillText(m.slide, W - M - tw, topoY + 34); ctx.restore(); }
    const rodape = () => { ctx.save(); ctx.globalAlpha = a5; ctx.fillStyle = sub; ctx.font = "700 30px Lato, Arial"; ctx.fillText(m.handle, M, H - (story ? 120 : 72)); const r = F.rodape, rw = ctx.measureText(r).width; ctx.fillText(r, W - M - rw, H - (story ? 120 : 72)); ctx.restore(); };
    const ey = (y) => { if (!m.eyebrow) return 0; ctx.save(); ctx.globalAlpha = a2; ctx.font = "900 30px Lato, Arial"; ctx.fillStyle = escuro ? F.destaque : F.base; ctx.fillText(String(m.eyebrow).toUpperCase().split("").join(String.fromCharCode(8202)), M, y + 30); ctx.restore(); return 64; };
    const slideUp = a => (1 - a) * 40;
    if (largo && (m.layout === "foto" || m.layout === "tela")) {   // 16:9: texto à esquerda, tela à direita
      const cw = W * .44; let y = topoY + 150; y += ey(y);
      y += texto(ctx, m.titulo, M, y, cw, { size: 96, min: 48, cor: fg, maxL: 4, alpha: a2, dy: slideUp(a2) }).h + 26;
      if (m.texto) texto(ctx, m.texto, M, y, cw, { size: 38, min: 28, peso: 400, cor: sub, maxL: 3, lh: 1.3, alpha: a3 });
      if (m.cta) botao(ctx, m.cta, M, H - 230, F, escuro, a5);
      const ax = M + cw + 70, aw = W - ax - M + 30, ay = topoY + 20, ah = H - ay - 150;
      tela(ctx, img, ax, ay + slideUp(a3), aw, ah, a3, t);
      rodape(); return canvas;
    }
    if (m.layout === "foto") {
      const iy = topoY + 100, ih = Math.round(H * (story ? .40 : .36)), z = 1 + (t == null ? 0 : (1 - t) * .08);
      ctx.save(); ctx.globalAlpha = a2; ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; rr(ctx, M, iy, W - M * 2, ih, 28); ctx.fillStyle = bg; ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = a2; rr(ctx, M, iy, W - M * 2, ih, 28); ctx.clip(); capaImg(ctx, img, M, iy, W - M * 2, ih, z); ctx.restore();
      let y = iy + ih + 54; y += ey(y);
      y += texto(ctx, m.titulo, M, y, W - M * 2, { size: story ? 92 : 70, min: 42, cor: fg, maxL: story ? 3 : 2, alpha: a3, dy: slideUp(a3) }).h + 20;
      texto(ctx, m.texto, M, y, W - M * 2, { size: 38, min: 28, peso: 400, cor: sub, maxL: story ? 5 : 2, lh: 1.32, alpha: a4 });
      if (m.cta) botao(ctx, m.cta, M, H - (story ? 330 : 210), F, escuro, a5);
      rodape(); return canvas;
    }
    if (m.layout === "tela") {
      let y = topoY + 110; y += ey(y);
      y += texto(ctx, m.titulo, M, y, W - M * 2, { size: story ? 96 : 82, min: 44, cor: fg, maxL: 3, alpha: a2, dy: slideUp(a2) }).h + 22;
      if (m.texto) y += texto(ctx, m.texto, M, y, W - M * 2, { size: 38, min: 28, peso: 400, cor: sub, maxL: 2, lh: 1.3, alpha: a3 }).h + 30;
      // moldura de navegador/aparelho com a tela do app
      const fy = y + slideUp(a3) * 2, fw = W - M * 2 + 40, fx = M - 20, fh = H - fy - (story ? 300 : 190);
      tela(ctx, img, fx, fy, fw, fh, a3, t);
      if (m.cta) botao(ctx, m.cta, M, H - (story ? 250 : 165), F, escuro, a5);
      if (!m.cta) rodape(); else { ctx.save(); ctx.globalAlpha = a5; ctx.fillStyle = sub; ctx.font = "700 30px Lato, Arial"; const hw = ctx.measureText(m.handle).width; ctx.fillText(m.handle, W - M - hw, H - (story ? 192 : 107)); ctx.restore(); }
      return canvas;
    }
    if (m.layout === "lista") {
      let y = topoY + (story ? 170 : 130); y += ey(y);
      y += texto(ctx, m.titulo, M, y, W - M * 2, { size: story ? 88 : 72, min: 40, cor: fg, maxL: 3, alpha: a2, dy: slideUp(a2) }).h + 40;
      const its = (m.itens || []).filter(Boolean).slice(0, 6), gap = story ? 40 : 26;
      its.forEach((it, i) => { const a = fase(t, .25 + i * .07, .45 + i * .07);
        ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(M + 34, y + 34, 34, 0, 7); ctx.fillStyle = escuro ? F.destaque : F.base; ctx.fill();
        ctx.fillStyle = escuro ? F.escuro : F.creme; ctx.font = "900 34px Lato, Arial"; const n = String(i + 1), nw = ctx.measureText(n).width; ctx.fillText(n, M + 34 - nw / 2, y + 46); ctx.restore();
        const h = texto(ctx, it, M + 100, y + 4, W - M * 2 - 100, { size: 42, min: 30, peso: 700, cor: fg, maxL: 2, lh: 1.2, alpha: a }).h; y += Math.max(70, h) + gap; });
      if (m.texto && y < H - 300) texto(ctx, m.texto, M, y + 10, W - M * 2, { size: 34, min: 26, peso: 400, cor: sub, maxL: 2, lh: 1.3, alpha: a5 });
      rodape(); return canvas;
    }
    if (m.layout === "cta") {
      let y = H * (story ? .3 : largo ? .2 : .24); y += ey(y);
      y += texto(ctx, m.titulo, M, y, W - M * 2, { size: story ? 120 : 104, min: 50, cor: fg, maxL: largo ? 2 : 4, alpha: a2, dy: slideUp(a2) }).h + 30;
      if (m.texto) y += texto(ctx, m.texto, M, y, W - M * 2, { size: 42, min: 30, peso: 400, cor: sub, maxL: 3, lh: 1.3, alpha: a3 }).h + 50;
      if (m.cta) botao(ctx, m.cta, M, y, F, escuro, a4);
      rodape(); return canvas;
    }
    // capa (padrão)
    let y = topoY + (story ? 260 : 170); y += ey(y);
    const tt = texto(ctx, m.titulo, M, y, largo ? W * .7 : W - M * 2, { size: story ? 132 : largo ? 120 : 112, min: 54, cor: fg, maxL: story ? 5 : largo ? 3 : 4, alpha: a2, dy: slideUp(a2) }); y += tt.h + 34;
    ctx.save(); ctx.globalAlpha = a3; rr(ctx, M, y, 150 * a3, 12, 6); ctx.fillStyle = escuro ? F.destaque : F.base; ctx.fill(); ctx.restore(); y += 58;
    if (m.texto) texto(ctx, m.texto, M, y, largo ? W * .6 : W - M * 2, { size: 44, min: 30, peso: 400, cor: sub, maxL: story ? 6 : largo ? 2 : 4, lh: 1.32, alpha: a4 });
    if (m.cta) botao(ctx, m.cta, M, H - (story ? 340 : 240), F, escuro, a5);
    rodape(); return canvas;
  }
  window.UpeModelos = { FRENTES, FORMATOS, LAYOUTS, padrao, render, loadImg };
})();

/* Leitor de "Kit Instagram" (HTML gerado pela Upe): feed, carrosséis, reels (com capas), stories, YouTube e calendário.
   parseKit(doc, hoje) -> { titulo, itens: [{ ref, formato, titulo, legenda, midias, capa, data }] }
   Os caminhos das mídias saem como estão no HTML (relativos à pasta do kit). */
function parseKit(doc, hoje = new Date()) {
  const txt = el => (el ? el.textContent : "").trim();
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const num = s => { const m = String(s).match(/(\d+)/); return m ? +m[1] : null; };
  const after = id => { const h = doc.getElementById(id); if (!h) return []; const out = []; let n = h.nextElementSibling; while (n && n.tagName !== "H2") { out.push(n); n = n.nextElementSibling; } return out; };
  const nameOf = a => { const b = a.querySelector(".info b"); if (!b) return ""; const c = b.cloneNode(true); c.querySelectorAll(".tag").forEach(t => t.remove()); return c.textContent.trim(); };
  const itens = [];
  // título legível: 1ª frase da legenda (sem emoji) ou o nome do arquivo arrumado
  const tituloDe = (nome, leg) => { let l = String(leg || "").split("\n")[0].replace(/[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
    if (l.length > 90) { const m = l.match(/^.{20,90}?[.!?](\s|$)/); l = m ? m[0].trim() : l.slice(0, 80).replace(/\s\S*$/, "") + "…"; }
    if (l && !/^como usar/i.test(l)) return l;
    const m = String(nome).match(/^(reel-)?(\d+)-(.+)$/); return m ? (m[1] ? "Reel " : "") + m[2] + " · " + m[3].replace(/-/g, " ") : nome; };
  // feed
  after("feed").forEach(sec => sec.querySelectorAll("article.peca").forEach(a => {
    const nm = nameOf(a), im = a.querySelector(".midia img, .midia video");
    itens.push({ ref: "feed:" + num(nm), formato: "feed", arquivo: nm, titulo: tituloDe(nm, txt(a.querySelector("pre"))), legenda: txt(a.querySelector("pre")), midias: im ? [im.getAttribute("src")] : [], capa: "", data: "" });
  }));
  // carrosséis
  after("carrosseis").forEach(sec => { if (!sec.matches || !sec.matches("section.car")) return;
    const h3 = sec.querySelector("h3"); const c = h3 ? h3.cloneNode(true) : null; if (c) c.querySelectorAll(".tag").forEach(t => t.remove());
    const t = c ? c.textContent.split(" · ")[0].trim() : "Carrossel";
    itens.push({ ref: "car:" + norm(t), formato: "carrossel", titulo: t, legenda: txt(sec.querySelector("pre")), midias: [...sec.querySelectorAll(".faixa img")].map(i => i.getAttribute("src")), capa: "", data: "" });
  });
  // reels + capas
  const capas = [];
  after("reels").forEach(sec => sec.querySelectorAll("article.peca").forEach(a => {
    const nm = nameOf(a), v = a.querySelector(".midia video"), im = a.querySelector(".midia img");
    if (v) itens.push({ ref: "reel:" + num(nm), formato: "reels", arquivo: nm, titulo: tituloDe(nm, txt(a.querySelector("pre"))), legenda: txt(a.querySelector("pre")), midias: [v.getAttribute("src")], capa: "", data: "" });
    else if (im) capas.push({ n: num(nm.replace(/^capa\s*·\s*/i, "")), src: im.getAttribute("src") });
  }));
  capas.forEach(c => { const r = itens.find(i => i.ref === "reel:" + c.n); if (r) r.capa = c.src; });
  // stories
  const stories = [];
  after("stories").forEach(sec => sec.querySelectorAll("article.peca").forEach(a => {
    const nm = nameOf(a), im = a.querySelector(".midia img");
    stories.push({ n: num(nm), nome: nm, src: im ? im.getAttribute("src") : "", inst: txt(a.querySelector("pre")) });
  }));
  // youtube (kits da Upe)
  after("youtube").forEach(sec => sec.querySelectorAll("article.peca").forEach(a => {
    const im = a.querySelector(".midia img"), ro = a.querySelector("pre.roteiro");
    itens.push({ ref: "yt:" + (a.dataset.id || norm(nameOf(a))), formato: a.dataset.formato || "youtube", titulo: nameOf(a), legenda: txt(a.querySelector("pre.descricao") || a.querySelector("pre")),
      roteiro: ro ? txt(ro) : "", midias: a.dataset.video ? [a.dataset.video] : [], capa: im ? im.getAttribute("src") : "", data: a.dataset.data || "" });
  }));
  // calendário
  const ano = d => { const [dd, mm] = d.split("/").map(Number); let y = hoje.getFullYear(); const dt = new Date(y, mm - 1, dd); if (dt - hoje < -60 * 864e5) y++; else if (dt - hoje > 300 * 864e5) y--; return `${y}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`; };
  const cal = doc.getElementById("calendario"); let tbl = null; for (let n = cal && cal.nextElementSibling; n && n.tagName !== "H2"; n = n.nextElementSibling) if (n.tagName === "TABLE") { tbl = n; break; }
  const entradas = [];
  if (tbl) tbl.querySelectorAll("tr").forEach(tr => {
    const td = [...tr.querySelectorAll("td")].map(x => x.textContent.trim()); if (td.length < 4 || !/^\d{1,2}\/\d{1,2}$/.test(td[0])) return;
    const data = ano(td[0]), fmt = norm(td[2]), peca = td[3];
    if (fmt.startsWith("feed")) { const it = itens.find(i => i.ref === "feed:" + num(peca)); if (it && !it.data) it.data = data; else if (!it) entradas.push({ data, formato: "feed", titulo: peca }); }
    else if (fmt.startsWith("reel")) { const it = itens.find(i => i.ref === "reel:" + num(peca)); if (it && !it.data) it.data = data; }
    else if (fmt.startsWith("carross")) {
      const w = norm(peca).split(" ").filter(x => x.length > 2); let best = null, sc = 0;
      itens.filter(i => i.formato === "carrossel").forEach(i => { const t = norm(i.titulo); const s = w.filter(x => t.includes(x)).length / (w.length || 1); if (s > sc) { sc = s; best = i; } });
      if (best && sc >= .5 && !best.data) best.data = data;
    } else if (fmt.startsWith("story")) {
      let ns = (peca.match(/\b\d{2}\b/g) || []).map(Number);
      if (/\ba\b/.test(peca) && ns.length === 2) ns = Array.from({ length: ns[1] - ns[0] + 1 }, (_, k) => ns[0] + k);
      let sel = stories.filter(s => ns.includes(s.n));
      if (!sel.length) { const w = norm(peca).split(" ").filter(x => x.length > 3); sel = stories.filter(s => w.some(x => norm(s.nome).includes(x.slice(0, 6)))).slice(0, 2); }
      entradas.push({ data, formato: "story", titulo: peca, legenda: sel.map(s => s.inst).filter(Boolean).join("\n\n"), midias: sel.map(s => s.src).filter(Boolean) });
    }
  });
  entradas.forEach((e, k) => itens.push({ ref: "story:" + e.data + ":" + k, formato: e.formato, titulo: e.titulo, legenda: e.legenda || "", midias: e.midias || [], capa: "", data: e.data }));
  // stories que não entraram no calendário ficam disponíveis sem data
  stories.filter(s => !itens.some(i => i.formato === "story" && i.midias.includes(s.src))).forEach(s => itens.push({ ref: "story:" + s.n, formato: "story", titulo: s.nome, legenda: s.inst, midias: s.src ? [s.src] : [], capa: "", data: "" }));
  // hashtags, bio e direct (blocos com botão "Copiar …")
  const extras = after("hashtags").filter(n => n.matches && n.matches(".info")).map(n => ({ rotulo: txt(n.querySelector("button")).replace(/^copiar\s*/i, "") || "Texto", texto: txt(n.querySelector("pre")) })).filter(e => e.texto);
  return { titulo: txt(doc.querySelector("header h1")) || txt(doc.querySelector("title")), itens, extras };
}
if (typeof module !== "undefined") module.exports = { parseKit };

/* Portal Upe · cliente + administrador
   Dados: Firebase (Auth + Firestore + Storage) quando PORTAL_CONFIG.firebase existe; senão, modo demonstração no navegador. */
(() => {
"use strict";
const CFG = window.PORTAL_CONFIG || {};
const G = {"U": "M 812.05 2605.51 L 808.33 2605.51 C 809.1 2606.7 809.76 2607.97 810.29 2609.32 C 810.3 2609.33 810.3 2609.35 810.31 2609.37 C 810.95 2611.01 811.42 2612.75 811.68 2614.56 C 812.25 2618.48 811.84 2622.43 810.54 2626.03 C 810.86 2626.07 811.38 2626.18 811.92 2626.47 C 812.7 2626.89 813.63 2627.79 813.7 2629.64 C 813.79 2632.04 812.46 2633.9 811.66 2634.8 C 811.55 2634.93 811.39 2635 811.23 2635 C 811.16 2635 811.08 2634.98 811.01 2634.96 C 810.78 2634.87 810.64 2634.65 810.64 2634.4 L 810.7 2631.87 C 810.71 2631.42 810.48 2631 810.11 2630.76 C 809.73 2630.52 809.2 2630.27 808.56 2630.01 C 808.39 2630.18 808.19 2630.31 807.97 2630.4 L 807.75 2631.98 C 807.67 2632.57 807.16 2633.02 806.57 2633.02 L 805.51 2633.02 C 805.46 2633.42 805.39 2633.8 805.31 2634.14 C 805.07 2635.09 804.76 2635.57 804.36 2635.57 C 803.97 2635.57 803.65 2635.09 803.41 2634.14 C 803.33 2633.8 803.27 2633.42 803.21 2633.02 L 802.43 2633.02 C 801.84 2633.02 801.33 2632.57 801.25 2631.98 L 801.04 2630.41 C 800.81 2630.31 800.61 2630.17 800.43 2630 C 799.77 2630.26 799.25 2630.52 798.86 2630.76 C 798.48 2631 798.25 2631.42 798.27 2631.87 L 798.32 2634.4 C 798.33 2634.65 798.18 2634.87 797.95 2634.96 C 797.88 2634.98 797.81 2635 797.74 2635 C 797.57 2635 797.42 2634.93 797.3 2634.8 C 796.5 2633.9 795.18 2632.04 795.27 2629.64 C 795.33 2627.79 796.27 2626.89 797.05 2626.47 C 797.61 2626.17 798.15 2626.06 798.46 2626.02 C 797.16 2622.43 796.75 2618.48 797.32 2614.56 C 797.58 2612.75 798.05 2611.01 798.69 2609.37 C 798.7 2609.35 798.7 2609.33 798.71 2609.32 C 799.24 2607.97 799.9 2606.7 800.67 2605.51 L 788.57 2605.51 L 788.57 2622.07 C 788.57 2626.13 789.5 2629.85 791.35 2633.22 C 793.2 2636.59 795.91 2639.26 799.49 2641.24 C 803.07 2643.23 807.35 2644.21 812.32 2644.21 L 820.39 2644.21 L 820.39 2605.51 Z M 812.05 2605.51 ", "N": "M 807.03 2603.74 C 805.59 2603.18 803.34 2603.19 801.95 2603.85 C 803.12 2602.35 803.71 2601.73 804.37 2601.19 C 804.45 2601.12 804.55 2601.12 804.63 2601.19 C 805.21 2601.69 805.64 2602.05 807.03 2603.74 ", "P": "M 857.14 2615.61 C 857.02 2617.67 856.43 2619.39 855.36 2620.77 C 854.3 2622.14 853.02 2623.25 851.53 2624.09 C 850.03 2624.93 848.01 2625.87 845.46 2626.92 C 843.27 2627.83 841.5 2628.64 840.12 2629.34 C 838.74 2630.03 837.44 2630.92 836.21 2631.99 C 834.97 2633.06 833.99 2634.4 833.26 2635.99 C 832.54 2637.59 832.17 2639.48 832.17 2641.67 L 832.17 2644.21 L 823.83 2644.21 L 823.83 2641.67 C 823.83 2637.72 824.75 2634.3 826.57 2631.38 C 828.41 2628.47 831.19 2625.84 834.93 2623.5 C 836.11 2622.75 837.28 2622.1 838.45 2621.54 C 839.63 2620.98 841.02 2620.36 842.64 2619.67 C 844.74 2618.79 846.26 2618.05 847.2 2617.48 C 848.14 2616.9 848.66 2616.2 848.77 2615.4 C 848.91 2614.48 848.69 2613.9 848.11 2613.64 C 847.54 2613.38 846.88 2613.24 846.13 2613.24 L 830.64 2613.24 L 830.64 2605.51 L 847.04 2605.51 C 848.88 2605.51 850.59 2605.96 852.18 2606.87 C 853.77 2607.78 855.01 2609.02 855.91 2610.57 C 856.81 2612.13 857.22 2613.81 857.14 2615.61  M 827.91 2613.66 C 825.66 2613.66 823.83 2611.84 823.83 2609.59 C 823.83 2607.33 825.66 2605.51 827.91 2605.51 ", "E": "M 865.48 2628.74 L 865.48 2636.48 L 886.59 2636.48 L 886.59 2644.21 L 857.14 2644.21 L 857.14 2627.68 C 857.14 2623.62 858.06 2619.9 859.91 2616.54 C 861.76 2613.16 864.48 2610.49 868.06 2608.5 C 871.64 2606.5 875.91 2605.51 880.89 2605.51 L 886.59 2605.51 L 886.59 2613.24 L 880.62 2613.24 C 877.83 2613.24 875.16 2613.85 872.63 2615.06 C 870.09 2616.28 868.19 2618.26 866.94 2621.01 L 886.59 2621.01 L 886.59 2628.74 Z M 865.48 2628.74 ", "C": "M 927.23 2644.21 L 897.77 2644.21 L 897.77 2627.68 C 897.77 2623.62 898.7 2619.9 900.55 2616.54 C 902.4 2613.17 905.11 2610.49 908.69 2608.5 C 912.27 2606.5 916.55 2605.51 921.52 2605.51 L 927.23 2605.51 L 927.23 2613.24 L 921.25 2613.24 C 918.84 2613.24 916.5 2613.7 914.21 2614.61 C 911.93 2615.52 910.01 2617.1 908.45 2619.36 C 906.89 2621.61 906.11 2624.62 906.11 2628.38 L 906.11 2636.48 L 927.23 2636.48 Z M 927.23 2644.21  M 918.17 2629.86 C 915.92 2629.86 914.09 2628.03 914.09 2625.78 C 914.09 2623.52 915.92 2621.7 918.17 2621.7 ", "R": "M 942.43 2631.66 C 941.01 2632.85 939.92 2634.25 939.15 2635.88 C 938.38 2637.49 938 2639.42 938 2641.67 L 938 2644.21 L 929.66 2644.21 L 929.66 2641.67 C 929.66 2637.72 930.57 2634.3 932.4 2631.38 C 934.23 2628.47 937.02 2625.84 940.76 2623.5 C 941.93 2622.75 943.1 2622.09 944.28 2621.54 C 945.45 2620.98 946.84 2620.36 948.46 2619.68 C 950.57 2618.79 952.09 2618.05 953.03 2617.47 C 953.97 2616.9 954.49 2616.21 954.59 2615.39 C 954.73 2614.48 954.52 2613.9 953.94 2613.64 C 953.36 2613.38 952.7 2613.24 951.95 2613.24 L 929.66 2613.24 L 929.66 2605.51 L 952.86 2605.51 C 954.7 2605.51 956.41 2605.96 958 2606.87 C 959.59 2607.78 960.84 2609.02 961.73 2610.57 C 962.63 2612.13 963.04 2613.81 962.96 2615.61 C 962.84 2617.67 962.25 2619.39 961.19 2620.77 C 960.13 2622.14 958.85 2623.25 957.35 2624.09 C 955.85 2624.93 953.83 2625.88 951.29 2626.93 C 950.66 2627.19 950.19 2627.38 949.89 2627.5 L 964.93 2644.21 L 953.71 2644.21 Z M 942.43 2631.66 ", "I1": "M 967.36 2613.91 L 975.7 2613.91 L 975.7 2644.21 L 967.36 2644.21 Z M 967.36 2613.91  M 967.45 2609.59 C 967.45 2607.33 969.28 2605.51 971.53 2605.51 C 973.79 2605.51 975.61 2607.33 975.61 2609.59 ", "A": "M 999.3 2644.21 L 978.13 2644.21 L 978.13 2627.68 C 978.13 2623.62 979.05 2619.9 980.91 2616.54 C 982.76 2613.17 985.47 2610.49 989.05 2608.5 C 992.63 2606.5 996.91 2605.51 1001.88 2605.51 L 1009.95 2605.51 L 1009.95 2644.21 L 1001.61 2644.21 L 1001.61 2613.24 C 999.2 2613.24 996.86 2613.7 994.57 2614.61 C 992.29 2615.52 990.37 2617.1 988.81 2619.36 C 987.25 2621.61 986.47 2624.62 986.47 2628.38 L 986.47 2636.48 L 999.3 2636.48 Z M 999.3 2644.21 ", "T": "M 1025 2613.24 L 1012.38 2613.24 L 1012.38 2605.51 L 1045.7 2605.51 C 1045.85 2605.51 1045.96 2605.62 1045.96 2605.76 L 1045.96 2613.24 L 1033.34 2613.24 L 1033.34 2644.21 L 1025 2644.21 Z M 1025 2613.24 ", "I2": "M 1048.39 2613.57 L 1056.73 2613.57 L 1056.73 2644.21 L 1048.39 2644.21 Z M 1048.39 2613.57  M 1048.48 2609.59 C 1048.48 2607.33 1050.31 2605.51 1052.56 2605.51 C 1054.81 2605.51 1056.64 2607.33 1056.64 2609.59 ", "V": "M 1083.91 2644.21 L 1074.32 2644.21 C 1074.32 2640.33 1073.97 2636.64 1073.27 2633.13 C 1072.55 2629.62 1071.64 2626.43 1070.52 2623.55 C 1069.39 2620.68 1068.2 2618.15 1066.94 2615.96 C 1065.67 2613.76 1064.48 2611.92 1063.36 2610.42 C 1062.23 2608.93 1060.84 2607.29 1059.16 2605.51 L 1069.96 2605.51 C 1071.27 2607.14 1072.35 2608.64 1073.19 2609.98 C 1074.03 2611.33 1074.88 2612.96 1075.73 2614.88 C 1076.59 2616.8 1077.34 2618.98 1077.96 2621.42 C 1078.59 2623.86 1078.98 2626.44 1079.12 2629.17 C 1079.36 2626.44 1079.82 2623.86 1080.48 2621.42 C 1081.15 2618.98 1081.9 2616.8 1082.74 2614.88 C 1083.58 2612.96 1084.4 2611.33 1085.2 2609.98 C 1086 2608.64 1087.02 2607.14 1088.28 2605.51 L 1099.08 2605.51 C 1097.4 2607.29 1095.99 2608.93 1094.86 2610.42 C 1093.73 2611.92 1092.54 2613.76 1091.28 2615.96 C 1090.03 2618.15 1088.84 2620.68 1087.72 2623.55 C 1086.6 2626.43 1085.68 2629.62 1084.97 2633.13 C 1084.27 2636.64 1083.91 2640.33 1083.91 2644.21 ", "O": "M 1109.85 2613.24 L 1109.85 2621.34 C 1109.85 2625.13 1110.63 2628.14 1112.18 2630.38 C 1113.74 2632.63 1115.66 2634.2 1117.95 2635.11 C 1120.23 2636.02 1122.58 2636.48 1124.98 2636.48 L 1124.98 2628.38 C 1124.98 2624.62 1124.21 2621.61 1122.65 2619.36 C 1121.09 2617.1 1119.17 2615.52 1116.89 2614.61 C 1114.6 2613.7 1112.25 2613.24 1109.85 2613.24 M 1109.85 2605.51 C 1114.76 2605.55 1118.99 2606.57 1122.53 2608.57 C 1126.07 2610.57 1128.75 2613.25 1130.58 2616.59 C 1132.41 2619.94 1133.33 2623.64 1133.33 2627.68 L 1133.33 2644.21 L 1124.98 2644.21 C 1120.07 2644.18 1115.84 2643.16 1112.3 2641.16 C 1108.77 2639.18 1106.08 2636.5 1104.25 2633.14 C 1102.42 2629.79 1101.5 2626.09 1101.5 2622.07 L 1101.5 2605.51 Z M 1109.85 2605.51  M 1119.42 2628.97 C 1117.17 2628.97 1115.34 2627.15 1115.34 2624.89 C 1115.34 2622.64 1117.17 2620.82 1119.42 2620.82 "};
const LETTERS = ["P", "E", "C", "R", "I1", "A", "T", "I2", "V", "O"];
const WM = `<svg class="wm" viewBox="786 2599 350 48" aria-hidden="true">${["N", "U", ...LETTERS].map(k => `<path d="${G[k]}"/>`).join("")}</svg>`;
const ICON = `<svg class="wm" viewBox="786 2599 36 48" aria-hidden="true"><path d="${G.N}"/><path d="${G.U}"/></svg>`;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $("#app"), dlg = $("#dlg");

/* ---------------- utilidades ---------------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = n => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pad = n => String(n).padStart(2, "0");
const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fdate = s => { if (!s) return "—"; const [y, m, d] = String(s).slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
const fdt = ms => { if (!ms) return ""; const d = new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const uid = (n = 20) => { const a = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint8Array(n)); return [...r].map(x => a[x % a.length]).join(""); };
const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => { const r = crypto.getRandomValues(new Uint8Array(12)); const s = [...r].map(x => CODE_ABC[x % 32]).join(""); return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`; };
const normCode = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
async function sha256(s) {
  if (crypto.subtle) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return "x" + (h >>> 0).toString(16); // só para navegadores sem crypto.subtle no modo demo
}
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
// armazenamento com reserva em memória: quando o navegador bloqueia o storage, o portal continua funcionando nesta aba
const mkStore = name => { const mem = new Map(); const st = () => { try { return window[name]; } catch (e) { return null; } };
  return { get(k) { try { const v = st()?.getItem(k); if (v != null) return v; } catch (e) {} return mem.has(k) ? mem.get(k) : null; },
           set(k, v) { v == null ? mem.delete(k) : mem.set(k, String(v)); try { v == null ? st()?.removeItem(k) : st()?.setItem(k, v); } catch (e) {} } }; };
const ss = mkStore("sessionStorage"), ls = mkStore("localStorage");
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.remove("hide"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hide"), 2600); }
async function copy(text, okMsg = "Copiado") { try { await navigator.clipboard.writeText(text); toast(okMsg); } catch (e) { toast("Selecione o texto e copie manualmente"); } }
const waLink = (num, txt) => `https://wa.me/${String(num || "").replace(/\D/g, "")}${txt ? `?text=${encodeURIComponent(txt)}` : ""}`;
const portalUrl = () => location.href.split("#")[0];
/* mídias: "{assets}" = pasta assets do site; "idb:" = arquivo enviado no modo demonstração (guardado no IndexedDB) */
const MEDIA = new Map();
const resolveMedia = u => { if (!u) return ""; u = String(u); if (u.startsWith("{assets}")) return (CFG.assetsDemo || "../assets/") + u.slice(8); if (u.startsWith("idb:")) return MEDIA.get(u.slice(4)) || ""; return u; };
const idb = {
  db: null,
  open() { return new Promise((ok, no) => { try { const r = indexedDB.open("upe-portal-arquivos", 1); r.onupgradeneeded = () => r.result.createObjectStore("f"); r.onsuccess = () => { this.db = r.result; ok(this.db); }; r.onerror = () => no(r.error); } catch (e) { no(e); } }); },
  tx(mode) { return this.db.transaction("f", mode).objectStore("f"); },
  put(k, v) { return new Promise((ok, no) => { try { const r = this.tx("readwrite").put(v, k); r.onsuccess = ok; r.onerror = () => no(r.error); } catch (e) { no(e); } }); },
  all() { return new Promise((ok, no) => { const out = []; try { const r = this.tx("readonly").openCursor(); r.onsuccess = () => { const c = r.result; if (c) { out.push([c.key, c.value]); c.continue(); } else ok(out); }; r.onerror = () => no(r.error); } catch (e) { no(e); } }); },
  clear() { return new Promise(ok => { try { const r = this.tx("readwrite").clear(); r.onsuccess = ok; r.onerror = ok; } catch (e) { ok(); } }); }
};
function kind(url, tipo) {
  if (tipo === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url || "")) return "video";
  if (tipo === "audio" || /\.(mp3|wav|m4a|ogg)(\?|$)/i.test(url || "")) return "audio";
  if (/\.pdf(\?|$)/i.test(url || "")) return "pdf";
  return url ? "img" : "none";
}
function mediaHTML(url, tipo, cls = "", nodl = false) {
  const k = kind(url, tipo), u = esc(resolveMedia(url));
  if (k === "video") return `<video class="${cls}" src="${u}" controls ${nodl ? 'controlslist="nodownload"' : ""} playsinline preload="metadata"></video>`;
  if (k === "audio") return `<audio src="${u}" controls preload="metadata"></audio>`;
  if (k === "pdf") return `<a class="btn sec sm" href="${u}" target="_blank" rel="noopener">Abrir PDF</a>`;
  if (k === "img") return `<img class="${cls}" src="${u}" alt="">`;
  return "";
}

/* ---------------- status ---------------- */
const ST = {
  rascunho: ["Rascunho", ""], pendente: ["Aguardando aprovação", "warn"], aprovado: ["Aprovado", "ok"], ajustes: ["Ajustes pedidos", "bad"],
  publicado: ["Publicado", "info"], orcamento: ["Orçamento", ""], producao: ["Em produção", "info"], entregue: ["Entregue", "ok"],
  novo: ["Novo", "warn"], cancelado: ["Cancelado", ""], aberta: ["Em aberto", "warn"], paga: ["Paga", "ok"], informado: ["Pagamento informado", "info"],
  convertido: ["Virou cliente", "ok"], arquivado: ["Arquivado", ""]
};
const pill = s => { const [l, c] = ST[s] || [s, ""]; return `<span class="pill ${c}">${esc(l)}</span>`; };
const evCls = s => (ST[s] || ["", ""])[1];
const TIPOS_POST = { imagem: "Imagem", carrossel: "Carrossel", video: "Vídeo", reels: "Reels", story: "Story", legenda: "Legenda", audio: "Áudio" };

function statusOf(item, acoes) {
  const v = item.versao || 1;
  let best = { status: item.status || "pendente", texto: item.nota || "", em: item.statusEm || 0, por: "upe" };
  for (const a of acoes) {
    if (a.alvo !== item.id || (a.versao || 1) !== v || (a.tipo !== "aprovar" && a.tipo !== "ajuste")) continue;
    if (a.em > best.em) best = { status: a.tipo === "aprovar" ? "aprovado" : "ajustes", texto: a.texto || "", em: a.em, por: "cliente" };
  }
  return best;
}
const thread = (doc, acoes) => [
  ...(doc.mensagens || []).map(m => ({ ...m, autor: "upe" })),
  ...acoes.filter(a => a.tipo === "mensagem").map(a => ({ id: a.id, autor: "cliente", texto: a.texto, em: a.em }))
].sort((a, b) => a.em - b.em);
const pedidosOf = (doc, acoes) => acoes.filter(a => a.tipo === "pedido" && !String(a.alvo || "").startsWith("app:")).map(a => ({ ...a, status: doc.pedidosAdm?.[a.id]?.status || "novo" })).sort((a, b) => b.em - a.em);
function cobStatus(c, acoes) { if (c.status === "paga" || c.status === "cancelado") return c.status; return acoes.some(a => a.tipo === "pagamento" && a.alvo === c.id) ? "informado" : "aberta"; }
function pendencias(doc, acoes, lastSeen = 0) {
  const vis = it => it.status !== "rascunho" && it.status !== "orcamento";
  const posts = (doc.posts || []).filter(vis).filter(p => statusOf(p, acoes).status === "pendente");
  const artes = (doc.graficos || []).filter(vis).filter(g => statusOf(g, acoes).status === "pendente");
  const cobs = (doc.cobrancas || []).filter(c => c.liberada && cobStatus(c, acoes) === "aberta");
  const msgs = thread(doc, acoes).filter(m => m.autor === "upe" && m.em > lastSeen);
  return { posts, artes, cobs, msgs };
}

/* ---------------- PIX (BR Code) ---------------- */
const noAcc = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 .@+\-_/]/g, " ").replace(/\s+/g, " ").trim();
const emv = (id, v) => id + String(v.length).padStart(2, "0") + v;
function crc16(s) { let c = 0xFFFF; for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, "0"); }
function pixPayload({ chave, nome, cidade, valor, txid, descricao }) {
  const gui = emv("00", "br.gov.bcb.pix") + emv("01", String(chave).trim()) + (descricao ? emv("02", noAcc(descricao).slice(0, 40)) : "");
  let p = emv("00", "01") + emv("26", gui) + emv("52", "0000") + emv("53", "986") + (valor ? emv("54", Number(valor).toFixed(2)) : "") +
    emv("58", "BR") + emv("59", noAcc(nome).slice(0, 25) || "UPE CRIATIVO") + emv("60", noAcc(cidade).slice(0, 15) || "SAO PAULO") +
    emv("62", emv("05", (noAcc(txid).replace(/[^A-Za-z0-9]/g, "") || "***").slice(0, 25)));
  p += "6304"; return p + crc16(p);
}

/* ---------------- armazenamento ---------------- */
const DEMO_KEY = "upe-portal-demo-v5";
class LocalStore {
  constructor() { this.mode = "demo"; let d = null; try { d = JSON.parse(ls.get(DEMO_KEY)); } catch (e) {} this.d = d && d.cols ? d : { cols: {} }; }
  async init() {
    try { await idb.open(); for (const [k, v] of await idb.all()) MEDIA.set(k, URL.createObjectURL(v)); this.idb = true; } catch (e) { this.idb = false; }
    if (!this.d.seeded) { await seedDemo(this); this.d.seeded = true; this.save(); }
  }
  save() { ls.set(DEMO_KEY, JSON.stringify(this.d)); }
  sp(path) { const i = path.lastIndexOf("/"); return [path.slice(0, i), path.slice(i + 1)]; }
  async get(path) { const [c, id] = this.sp(path); return clone(this.d.cols[c]?.[id]) || null; }
  async set(path, data, merge = false) { const [c, id] = this.sp(path); const col = this.d.cols[c] || (this.d.cols[c] = {}); col[id] = merge ? { ...(col[id] || {}), ...clone(data) } : clone(data); this.save(); }
  async add(c, data) { const id = uid(); await this.set(`${c}/${id}`, data); return id; }
  async del(path) { const [c, id] = this.sp(path); if (this.d.cols[c]) delete this.d.cols[c][id]; this.save(); }
  async list(c) { return Object.entries(this.d.cols[c] || {}).map(([id, v]) => ({ id, ...clone(v) })); }
  async login(email, pass) { if (email.trim().toLowerCase() === "admin@upe.demo" && pass === "upe-demo") { ss.set("upe-adm", "1"); return true; } throw new Error("E-mail ou senha incorretos."); }
  async currentAdmin() { return ss.get("upe-adm") === "1"; }
  async logout() { ss.set("upe-adm", null); }
  async upload(file) { const k = uid(12) + "/" + file.name.replace(/[^\w.\-]/g, "_"); MEDIA.set(k, URL.createObjectURL(file)); if (this.idb) { try { await idb.put(k, file); } catch (e) { this.idb = false; } } return "idb:" + k; }
  async reset() { ls.set(DEMO_KEY, null); if (this.idb) await idb.clear(); location.reload(); }
}
class FireStore {
  constructor(cfg) { this.mode = "firebase"; this.cfg = cfg; }
  async init() {
    const v = "10.12.2", base = `https://cdn.jsdelivr.net/npm/firebase@${v}/`;
    for (const f of ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js", "firebase-storage-compat.js"]) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = base + f; s.onload = ok; s.onerror = () => no(new Error("Não foi possível carregar o Firebase.")); document.head.appendChild(s); });
    firebase.initializeApp(this.cfg); this.db = firebase.firestore(); this.auth = firebase.auth(); try { this.st = this.cfg.storageBucket ? firebase.storage() : null; } catch (e) { this.st = null; }
    if (CFG.emulador) { const h = location.hostname; this.auth.useEmulator(`http://${h}:9099`); this.db.useEmulator(h, 8080); if (this.st) this.st.useEmulator(h, 9199); } // testes locais (firebase emulators:start)
    this.ready = new Promise(r => { const off = this.auth.onAuthStateChanged(u => { off(); r(u); }); });
  }
  async get(p) { const s = await this.db.doc(p).get(); return s.exists ? s.data() : null; }
  async set(p, d, merge = false) { await this.db.doc(p).set(d, { merge }); }
  async add(c, d) { return (await this.db.collection(c).add(d)).id; }
  async del(p) { await this.db.doc(p).delete(); }
  async list(c) { const s = await this.db.collection(c).get(); return s.docs.map(d => ({ id: d.id, ...d.data() })); }
  async login(email, pass) {
    const r = await this.auth.signInWithEmailAndPassword(email.trim(), pass).catch(e => { throw new Error({ "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos ou redefina a senha.", "auth/network-request-failed": "Sem conexão com o Firebase. Verifique a internet.", "auth/user-disabled": "Este usuário está desativado." }[e.code] || "E-mail ou senha incorretos."); });
    if (!(await this.get(`admins/${r.user.uid}`))) { await this.auth.signOut(); throw new Error("Este usuário não está liberado como administrador."); }
    return true;
  }
  async currentAdmin() { await this.ready; const u = this.auth.currentUser; if (!u) return false; try { return !!(await this.get(`admins/${u.uid}`)); } catch (e) { return false; } }
  async logout() { await this.auth.signOut(); }
  // sufixo aleatório: envios em paralelo com o mesmo nome não se sobrescrevem
  async upload(file, path) { if (!this.st) return null; const ref = this.st.ref(`${path}/${Date.now()}-${uid(5)}-${file.name.replace(/[^\w.\-]/g, "_")}`); await ref.put(file); return await ref.getDownloadURL(); }
}
const S = CFG.firebase ? new FireStore(CFG.firebase) : new LocalStore();

/* ---------------- regras de negócio ---------------- */
const Api = {
  async clientIdByCode(code) { const n = normCode(code); if (n.length !== 12) return null; const c = await S.get(`codigos/${await sha256(n)}`); return c?.clienteId || null; },
  async loadClient(id) { const doc = await S.get(`clientes/${id}`); if (!doc) return null; const acoes = (await S.list(`clientes/${id}/acoes`)).sort((a, b) => a.em - b.em); return { id, doc, acoes }; },
  async act(id, a) { return S.add(`clientes/${id}/acoes`, { ...a, em: Date.now() }); },
  blankClient(over = {}) {
    return Object.assign({ nome: "", empresa: "", marca: "", criadoEm: Date.now(), ativo: true,
      plano: { branding: true, midias: false, grafica: false },
      acesso: { apresentacao: false, manual: false, calendario: false, graficos: false, recompra: false, pagamentos: false },
      recorrente: { ativo: false, valor: 0, dia: 10, descricao: "Mensalidade" },
      incluso: [], manual: { url: "", nome: "" }, apresentacao: null, posts: [], graficos: [], cobrancas: [], mensagens: [], pedidosAdm: {}, lidoAdmEm: 0 }, over);
  },
  async createClient(doc, priv = {}) {
    const id = uid(), code = genCode(), hash = await sha256(normCode(code));
    await S.set(`clientes/${id}`, doc); await S.set(`privado/${id}`, { ...priv, codigo: code, codigoHash: hash, criadoEm: Date.now() }); await S.set(`codigos/${hash}`, { clienteId: id });
    return { id, code };
  },
  async regenCode(id) {
    const p = (await S.get(`privado/${id}`)) || {}; if (p.codigoHash) await S.del(`codigos/${p.codigoHash}`).catch(() => {});
    const code = genCode(), hash = await sha256(normCode(code)); await S.set(`codigos/${hash}`, { clienteId: id }); await S.set(`privado/${id}`, { ...p, codigo: code, codigoHash: hash }); return code;
  },
  async deleteClient(id) {
    const p = await S.get(`privado/${id}`); if (p?.codigoHash) await S.del(`codigos/${p.codigoHash}`).catch(() => {});
    for (const a of await S.list(`clientes/${id}/acoes`)) await S.del(`clientes/${id}/acoes/${a.id}`);
    await S.del(`privado/${id}`); await S.del(`clientes/${id}`);
  },
  async listClients() {
    const [cs, ps] = await Promise.all([S.list("clientes"), S.list("privado")]);
    const pm = Object.fromEntries(ps.map(p => [p.id, p]));
    return Promise.all(cs.map(async c => ({ id: c.id, doc: c, priv: pm[c.id] || {}, acoes: (await S.list(`clientes/${c.id}/acoes`)).sort((a, b) => a.em - b.em) })));
  },
  async config() { return (await S.get("config/publico")) || {}; }
};

/* ---------------- dados de demonstração ---------------- */
async function seedDemo(st) {
  const A = CFG.assetsDemo || "../assets/";
  const day = o => { const d = new Date(); d.setDate(d.getDate() + o); return isoDay(d); };
  const now = Date.now(), H = 3600e3;
  const doc = Api.blankClient({
    nome: "Marina Alves", empresa: "Café Aurora (exemplo)", marca: "Café Aurora",
    plano: { branding: true, midias: true, grafica: true },
    acesso: { apresentacao: true, manual: true, calendario: true, graficos: true, recompra: true, pagamentos: true },
    recorrente: { ativo: true, valor: 890, dia: 10, descricao: "Mídias digitais · mensalidade" },
    incluso: [{ item: "Diagnóstico e pesquisa", feito: true }, { item: "Redesign do logotipo", feito: true }, { item: "Manual da marca", feito: true }, { item: "12 posts por mês no Instagram", feito: false }, { item: "Cartão de visita e cardápio", feito: false }],
    manual: { url: A + "img/brand.jpg", nome: "Manual da marca Café Aurora (arquivo de exemplo)" },
    apresentacao: {
      marca: "Café Aurora", lede: "A proposta completa do redesign, com o filme da marca e o feed para ampliar.", pdf: "", pdfTamanho: "", baseUrl: "",
      cores: [{ nome: "Azul Aurora", hex: "#0C4F7F" }, { nome: "Creme", hex: "#F2F0E1" }, { nome: "Ardósia", hex: "#798EA6" }],
      slides: [{ nome: "Capa", img: A + "img/filme-h.jpg" }, { nome: "Identidade", img: A + "img/brand.jpg" }, { nome: "Redesenho", img: A + "img/redesign.jpg" }, { nome: "Filme da marca", tipo: "filme" }, { nome: "Instagram", tipo: "instagram" }],
      filme: { titulo: "Filme da marca", texto: "", video: A + "video/filme-h.mp4", poster: A + "img/filme-h.jpg", duracao: "1:42" },
      motions: [], semanas: ["Semana 1 · lançamento"],
      instagram: [{ img: A + "img/brand.jpg", titulo: "Nova identidade", data: "", semana: 1, legenda: "" }, { img: A + "img/redesign.jpg", titulo: "Antes e depois", data: "", semana: 1, legenda: "" }, { img: A + "img/filme-h.jpg", titulo: "Assinatura", data: "", semana: 1, legenda: "" }]
    },
    apps: { erp: { status: "teste", plano: "upe", extras: ["E"], dia: 10, ajuste: 0, inicio: day(-12), fimTeste: day(2), obs: "Loja em cafeaurora.upe (exemplo)" }, tv: { status: "ativo", plano: "vitrine", extras: ["cta"], dia: 15, ajuste: 189.9, inicio: day(-40), fimTeste: "", obs: "2 telas parceiras no bairro" } },
    perfil: { nome: "Café Aurora", canais: ["instagram", "whatsapp", "google", "loja"], negocio: "Cafeteria de bairro com delivery", regiao: "São Paulo · zona oeste", publicos: ["Vizinhos que tomam café todo dia", "Quem trabalha perto e pede delivery"], atributos: ["Café coado", "Pão na chapa", "Bolos caseiros"],
      jornada: [{ etapa: "Descobrir", texto: "Reels do café sendo coado e do balcão" }, { etapa: "Confiar", texto: "Avaliações do Google e fotos de clientes" }, { etapa: "Escolher", texto: "Cardápio da semana nos stories" }, { etapa: "Comprar", texto: "Pedido pelo WhatsApp e iFood" }], em: now - 72 * H },
    posts: [
      { id: "p-lanc", data: day(1), tipo: "imagem", titulo: "Lançamento da nova marca", midias: [A + "img/brand.jpg"], legenda: "Chegou a nova cara do Café Aurora ☕\nMesma receita, marca nova. Vem conhecer!", versao: 2, status: "pendente", statusEm: now - 1 * H, historico: [{ em: now - 1 * H, v: 2, texto: "Troquei a foto pela versão com o letreiro novo." }] },
      { id: "p-antes", data: day(3), tipo: "carrossel", titulo: "Antes e depois", midias: [A + "img/redesign.jpg", A + "img/filme-h.jpg"], legenda: "Deslize para ver o antes e depois →", versao: 1, status: "pendente", statusEm: now - 4 * H },
      { id: "p-bast", data: day(-2), tipo: "reels", titulo: "Bastidores do redesign", midias: [A + "video/filme-h.mp4"], legenda: "Como nasceu a nova identidade.", versao: 1, status: "aprovado", statusEm: now - 50 * H },
      { id: "p-repost", data: day(8), tipo: "story", titulo: "Repost: bastidores do redesign", repostDe: "p-bast", midias: [], legenda: "", versao: 1, status: "pendente", statusEm: now - 2 * H },
      { id: uid(8), data: day(6), tipo: "legenda", titulo: "Legenda do cardápio da semana", midias: [], legenda: "Cardápio da semana: pão na chapa, bolo de fubá e café coado. Peça pelo WhatsApp!", versao: 1, status: "pendente", statusEm: now - 2 * H }
    ],
    graficos: [
      { id: uid(8), produto: "Cartão de visita", specs: "9 × 5 cm · couché 300 g · 4×4 cores · laminação fosca", quantidade: 1000, valor: 189, arte: A + "img/brand.jpg", versao: 1, status: "aprovado", statusEm: now - 200 * H, recompra: true, precoRecompra: 169 },
      { id: uid(8), produto: "Cardápio de balcão", specs: "A4 · couché 250 g · frente e verso", quantidade: 50, valor: 240, arte: A + "img/redesign.jpg", versao: 2, status: "pendente", statusEm: now - 3 * H, recompra: false, precoRecompra: 0 },
      { id: uid(8), produto: "Adesivo para copos", specs: "5 cm redondo · vinil · corte especial", quantidade: 500, valor: 155, arte: "", versao: 1, status: "orcamento", statusEm: now - H, recompra: false, precoRecompra: 0 }
    ],
    cobrancas: [
      { id: uid(8), descricao: "Mídias digitais · " + MESES[new Date().getMonth()], valor: 890, vencimento: day(5), liberada: true, status: "aberta", pix: true, cartao: true, linkCartao: "" },
      { id: uid(8), descricao: "Cartões de visita (1.000 un.)", valor: 189, vencimento: day(-20), liberada: true, status: "paga", pix: true, cartao: false, linkCartao: "" }
    ],
    mensagens: [{ id: uid(8), texto: "Oi, Marina! Os posts da semana já estão no calendário para você aprovar.", em: now - 6 * H }]
  });
  const cs = doc; const { id } = await Api.createClient(cs, { email: "marina@cafeaurora.exemplo", telefone: "5511900000000", notas: "Cliente de exemplo do modo demonstração." });
  // código fixo do demo
  const p = await st.get(`privado/${id}`); await st.del(`codigos/${p.codigoHash}`); const code = "AURO-RA26-DEMO", h = await sha256(normCode(code));
  await st.set(`codigos/${h}`, { clienteId: id }); await st.set(`privado/${id}`, { ...p, codigo: code, codigoHash: h });
  await st.add(`clientes/${id}/acoes`, { tipo: "mensagem", texto: "Perfeito! Vou olhar hoje à tarde.", em: now - 5 * H });
  await st.add(`clientes/${id}/acoes`, { tipo: "pedido", alvo: "app:erp:K", modo: "app", quantidade: 1, texto: "", em: now - 4 * H });
  await st.add(`clientes/${id}/acoes`, { tipo: "ajuste", alvo: "p-lanc", versao: 1, texto: "Pode usar a foto com o letreiro novo?", em: now - 3 * H });
  await st.add(`clientes/${id}/acoes`, { tipo: "ajuste", alvo: "p-antes", versao: 1, texto: "Na 2ª imagem, escrever “desde 1998” no rodapé.", em: now - 90 * 6e4 });
  await st.add(`clientes/${id}/acoes`, { tipo: "pedido", alvo: cs.graficos[0].id, quantidade: 1000, modo: "alterado", texto: "Trocar o telefone para (11) 90000-0000.", em: now - 30 * H });
  const d2 = Api.blankClient({ nome: "Rafael Souza", empresa: "Studio Bento (exemplo)", marca: "Studio Bento", plano: { branding: true, midias: false, grafica: false },
    acesso: { apresentacao: false, manual: false, calendario: false, graficos: false, recompra: false, pagamentos: true },
    incluso: [{ item: "Diagnóstico", feito: true }, { item: "Conceito e identidade", feito: false }, { item: "Manual da marca", feito: false }],
    cobrancas: [{ id: uid(8), descricao: "Branding · entrada (50%)", valor: 1500, vencimento: day(2), liberada: true, status: "aberta", pix: true, cartao: true, linkCartao: "" }] });
  await Api.createClient(d2, { email: "rafael@studiobento.exemplo", telefone: "5511911111111" });
  await st.add("contatos", { nome: "Juliana Prado", contato: "juliana@floresdeprado.exemplo", assunto: "Redesign", mensagem: "Minha floricultura tem um logo antigo e queria modernizar sem perder a essência.", em: now - 20 * H, status: "novo" });
  await st.add("contatos", { nome: "Pedro Lima", contato: "11 98888-7777", assunto: "Branding", mensagem: "Vou abrir uma hamburgueria e preciso da marca completa.", em: now - 70 * H, status: "novo" });
  await st.set("config/publico", { pixChave: "upecriativo@gmail.com", pixNome: "Upe Criativo", pixCidade: "Sao Paulo", linkCartao: "", whatsapp: CFG.whatsappUpe || "" });
  for (const t of TEMPLATES()) await st.set(`templates/${t.id}`, t);
  // prazos, reuniões e cronograma da Upe
  const cli = await st.get(`clientes/${id}`);
  cli.entregas = [{ id: uid(8), titulo: "Manual da marca (versão final)", data: day(4), status: "pendente" }, { id: uid(8), titulo: "Artes do cardápio de balcão", data: day(9), status: "pendente" }, { id: uid(8), titulo: "Redesign do logotipo", data: day(-12), status: "entregue" }];
  const r1 = { id: uid(10), titulo: "Apresentação do calendário de novembro", data: day(2), hora: "15:00", duracao: 45, com: "cliente", clienteId: id, nome: cs.nome, email: "marina@cafeaurora.exemplo", telefone: "5511900000000", link: "https://meet.google.com/abc-defg-hij", local: "", notas: "Revisar posts de novembro e a campanha de fim de ano.", status: "marcada" };
  cli.reunioes = [{ id: r1.id, titulo: r1.titulo, data: r1.data, hora: r1.hora, duracao: r1.duracao, link: r1.link, local: "", notas: r1.notas, status: "marcada" }];
  await st.set(`clientes/${id}`, cli); await st.set(`reunioes/${r1.id}`, r1);
  const leads = await st.list("contatos"), lj = leads.find(l => l.nome === "Juliana Prado");
  if (lj) { const r2 = { id: uid(10), titulo: "Conversa sobre o redesign da floricultura", data: day(3), hora: "10:30", duracao: 30, com: "lead", contatoId: lj.id, nome: lj.nome, email: lj.contato, telefone: "", link: "", local: "WhatsApp vídeo", notas: "", status: "marcada" }; await st.set(`reunioes/${r2.id}`, r2); }
  try { const arq = await cronogramaArquivo(); for (const it of arq.itens) await st.set(`cronograma/${it.id}`, it); await st.set(`cronograma/${EXTRAS_ID}`, { id: EXTRAS_ID, tipo: "extras", lista: arq.extras || [] });
    // exemplo de aprovado e reprovado no cronograma
    for (const [k, stt] of [[0, "publicado"], [1, "aprovado"], [2, "reprovado"]]) { const it = arq.itens.filter(x => x.canal !== "youtube" && x.data)[k]; if (it) await st.set(`cronograma/${it.id}`, { ...it, status: stt }); } } catch (e) {}
}

/* ---------------- modal ---------------- */
function modal(title, body, foot = "", wide = false) {
  dlg.style.width = wide ? "min(1000px, calc(100vw - 24px))" : "";
  dlg.innerHTML = `<div class="mh"><h2>${title}</h2><button class="x" data-close aria-label="Fechar">×</button></div><div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ""}`;
  dlg.querySelectorAll("[data-close]").forEach(b => b.onclick = () => dlg.close());
  if (!dlg.open) dlg.showModal();
  return dlg;
}
dlg.addEventListener("close", () => dlg.querySelectorAll("video,audio").forEach(m => m.pause()));
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

/* ---------------- roteador ---------------- */
let state = { client: null, cfg: {}, admin: false, cache: {} };
const go = h => { if (location.hash === h) route(); else location.hash = h; };
window.addEventListener("hashchange", () => route());
async function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [area, ...rest] = h.split("/");
  try {
    if (area === "admin") return await adminRoute(rest);
    if (area === "c") return await clientRoute(rest[0] || "inicio", rest[1]);
    const cid = ss.get("upe-cliente");
    if (cid) return go("#/c/inicio");
    return gate();
  } catch (e) { console.error(e); app.innerHTML = `<div class="cl-main"><div class="empty"><b>Algo deu errado.</b><span>${esc(e.message)}</span><button class="btn" onclick="location.reload()">Recarregar</button></div></div>`; }
}
const demoBar = () => S.mode === "demo" ? `<div class="demo"><b>Modo demonstração.</b> Os dados ficam só neste navegador. Cliente de exemplo: <span class="code">AURO-RA26-DEMO</span> · Admin: admin@upe.demo / upe-demo</div>` : "";
const pat = () => { const s = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130"><defs><mask id="m" maskUnits="userSpaceOnUse" x="780" y="2590" width="60" height="60"><rect x="780" y="2590" width="60" height="60" fill="#fff"/><path d="${G.U}" fill="#000"/></mask></defs><g fill="#798EA6" transform="translate(65 65) rotate(45) scale(1.7) translate(-804.4 -2620)"><path d="${G.N}"/><rect x="795" y="2605.45" width="18.9" height="30.6" mask="url(#m)"/></g></svg>`; return `url("data:image/svg+xml,${encodeURIComponent(s)}")`; };

/* ---------------- acesso ---------------- */
function gate(mode = "cliente", err = "") {
  app.innerHTML = demoBar() + `<div class="gate"><div class="pat" style="background-image:${pat()}"></div><div class="box">
    <div class="logo">${WM}</div>
    ${mode === "cliente" ? `
      <div class="grid" style="gap:8px"><h1>Portal do cliente</h1><p>Digite o código de acesso que você recebeu da Upe.</p></div>
      <form id="fCode" autocomplete="off" novalidate>
        <div class="codein"><input id="c1" maxlength="4" inputmode="text" aria-label="Código, parte 1" autocapitalize="characters"><span>-</span><input id="c2" maxlength="4" aria-label="Código, parte 2" autocapitalize="characters"><span>-</span><input id="c3" maxlength="4" aria-label="Código, parte 3" autocapitalize="characters"></div>
        ${err ? `<div class="err">${esc(err)}</div>` : ""}
        <button class="btn" type="submit">Entrar</button>
      </form>
      <p class="alt">Não tem o código? <a href="${esc(waLink(CFG.whatsappUpe, "Olá! Preciso do meu código de acesso ao portal Upe."))}" target="_blank" rel="noopener" style="color:var(--creme);font-weight:900">Fale com a Upe</a></p>
      <p class="alt"><button class="lnk" id="toAdm">Acesso administrador</button></p>` : `
      <div class="grid" style="gap:8px"><h1>Administrador</h1><p>Entre com o seu e-mail e senha.</p></div>
      <form id="fAdm" novalidate>
        <input class="pl" id="aEmail" type="email" autocomplete="username" placeholder="E-mail" aria-label="E-mail">
        <input class="pl" id="aPass" type="password" autocomplete="current-password" placeholder="Senha" aria-label="Senha">
        ${err ? `<div class="err">${esc(err)}</div>` : ""}
        <button class="btn" type="submit">Entrar no painel</button>
      </form>
      <p class="alt"><button class="lnk" id="toCli">Sou cliente</button></p>`}
  </div></div>`;
  if (mode === "cliente") {
    const ins = ["#c1", "#c2", "#c3"].map(s => $(s));
    ins.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        const v = normCode(inp.value);
        if (v.length > 4) { const all = normCode(ins.map(x => x.value).join("")); ins.forEach((x, k) => x.value = all.slice(k * 4, k * 4 + 4)); ins[Math.min(2, Math.floor(all.length / 4))].focus(); return; }
        inp.value = v; if (v.length === 4 && i < 2) ins[i + 1].focus();
      });
      inp.addEventListener("keydown", e => { if (e.key === "Backspace" && !inp.value && i > 0) ins[i - 1].focus(); });
      inp.addEventListener("paste", e => { const t = normCode(e.clipboardData.getData("text")); if (t.length >= 8) { e.preventDefault(); ins.forEach((x, k) => x.value = t.slice(k * 4, k * 4 + 4)); ins[2].focus(); } });
    });
    ins[0].focus();
    $("#fCode").onsubmit = async e => {
      e.preventDefault(); const code = ins.map(x => x.value).join("");
      if (normCode(code).length !== 12) return gate("cliente", "O código tem 12 caracteres, no formato XXXX-XXXX-XXXX.");
      const id = await Api.clientIdByCode(code);
      if (!id) return gate("cliente", "Código não encontrado. Confira e tente de novo.");
      ss.set("upe-cliente", id); go("#/c/inicio");
    };
    $("#toAdm").onclick = () => go("#/admin");
  } else {
    $("#aEmail").focus();
    $("#fAdm").onsubmit = async e => {
      e.preventDefault();
      try { await S.login($("#aEmail").value, $("#aPass").value); state.admin = true; go("#/admin/clientes"); }
      catch (er) { gate("admin", er.message); }
    };
    $("#toCli").onclick = () => { history.replaceState(null, "", "#/"); gate(); };
  }
}

/* =====================================================================
   ÁREA DO CLIENTE
   ===================================================================== */
async function clientRoute(tab, arg) {
  const id = ss.get("upe-cliente"); if (!id) return go("#/");
  const c = await Api.loadClient(id); if (!c || c.doc.ativo === false) { ss.set("upe-cliente", null); return gate("cliente", "Este acesso não está ativo. Fale com a Upe."); }
  state.client = c; state.cfg = await Api.config();
  const { doc, acoes } = c, ac = doc.acesso || {}, pl = doc.plano || {};
  const seenKey = `upe-visto-${id}`, lastSeen = +(ls.get(seenKey) || 0);
  const pend = pendencias(doc, acoes, lastSeen);
  const recItems = (doc.graficos || []).filter(g => g.recompra && statusOf(g, acoes).status !== "rascunho");
  const tabs = [
    ["inicio", "Início", 0, true],
    ["agenda", "Agenda", 0, true],
    ["apresentacao", "Apresentação", 0, ac.apresentacao && doc.apresentacao],
    ["conteudo", "Conteúdo", pend.posts.length, pl.midias && ac.calendario],
    ["graficos", "Materiais gráficos", pend.artes.length, pl.grafica && ac.graficos],
    ["produtos", "Comprar de novo", 0, pl.grafica && ac.recompra && recItems.length],
    ["apps", "Apps Upe", 0, APP_IDS.some(k => !appsCat(state.cfg)[k].breve) || adesoes(doc).length],
    ["pagamentos", "Pagamentos", pend.cobs.length, ac.pagamentos],
    ["mensagens", "Mensagens", tab === "mensagens" ? 0 : pend.msgs.length, true]
  ].filter(t => t[3]);
  const kitView = tab === "kit" && pl.midias && ac.calendario;
  if (kitView) tab = "conteudo"; else if (!tabs.some(t => t[0] === tab)) tab = "inicio";
  if (tab === "mensagens") ls.set(seenKey, String(Date.now()));
  const voltar = state.admin && ss.get("upe-voltar");
  const prox = proximos(doc, acoes);
  app.innerHTML = demoBar() + (voltar ? `<div class="asadm">Você está vendo o portal como este cliente.<a href="${esc(voltar)}" id="voltarAdm">Voltar ao painel</a></div>` : "") + `
    <div class="adm cli"><aside class="side cside"><div class="logo">${WM}</div>
      <div class="cname"><b>${esc(doc.marca || doc.empresa || doc.nome)}</b><span>${esc(doc.nome)}</span></div>
      <nav class="nav" aria-label="Seções do portal">${tabs.map(([k, l, n]) => `<a href="#/c/${k}" ${k === tab ? 'aria-current="page"' : ""}><span>${l}</span>${n ? `<span class="cnt">${n}</span>` : ""}</a>`).join("")}</nav>
      <div class="prox"><span class="eb">Próximos</span>${prox.length ? prox.map(e => `<a href="#/c/agenda" class="proxi"><b>${fdate(e.data).slice(0, 5)}${e.hora ? " · " + e.hora : ""}</b><span>${esc(e.tag)}: ${esc(e.titulo)}</span></a>`).join("") : '<span class="small" style="opacity:.7">Nada marcado.</span>'}</div>
      <div class="foot"><button class="lnk" id="sair">Sair</button></div></aside>
    <main class="work"><div class="wtop"><span class="eb">Portal do cliente</span><div id="bellH"></div></div><div id="cmain" class="grid" style="gap:18px"></div></main></div>`;
  bell($("#bellH"), "cli-" + id, notifsCliente(doc, acoes));
  $("#sair").onclick = () => { ss.set("upe-cliente", null); ss.set("upe-voltar", null); go(voltar || "#/"); };
  if (voltar) $("#voltarAdm").onclick = () => { ss.set("upe-cliente", null); ss.set("upe-voltar", null); };
  const m = $("#cmain");
  if (kitView) return cKit(m, c, arg);
  ({ inicio: cInicio, agenda: cAgenda, apresentacao: cApres, conteudo: cConteudo, graficos: cGraficos, produtos: cProdutos, pagamentos: cPagamentos, mensagens: cMensagens, apps: cApps })[tab](m, c, { pend, recItems, tabs, arg });
}
const refreshClient = () => clientRoute((location.hash.split("/")[2]) || "inicio");

function cInicio(m, { doc }, { pend, tabs }) {
  const has = k => tabs.some(t => t[0] === k);
  const inc = doc.incluso || [], done = inc.filter(i => i.feito).length;
  const cards = [
    has("conteudo") && [`${pend.posts.length}`, pend.posts.length === 1 ? "post aguardando a sua aprovação" : "posts aguardando a sua aprovação", "#/c/conteudo"],
    has("graficos") && [`${pend.artes.length}`, pend.artes.length === 1 ? "arte gráfica para aprovar" : "artes gráficas para aprovar", "#/c/graficos"],
    has("pagamentos") && [brl(pend.cobs.reduce((s, c) => s + (+c.valor || 0), 0)), pend.cobs.length ? `em ${pend.cobs.length} cobrança${pend.cobs.length > 1 ? "s" : ""} em aberto` : "nenhuma cobrança em aberto", "#/c/pagamentos"],
    [`${pend.msgs.length}`, pend.msgs.length === 1 ? "mensagem nova da Upe" : "mensagens novas da Upe", "#/c/mensagens"]
  ].filter(Boolean);
  m.innerHTML = `
    <div class="grid" style="gap:6px"><span class="eb">Seu projeto</span><h1>Olá, ${esc((doc.nome || "").split(" ")[0] || "tudo bem")}!</h1>
      <div class="row">${doc.plano?.branding ? '<span class="pill info">Branding</span>' : ""}${doc.plano?.midias ? '<span class="pill info">Mídias digitais</span>' : ""}${doc.plano?.grafica ? '<span class="pill info">Papelaria gráfica</span>' : ""}</div></div>
    <div class="g4">${cards.map(([n, l, h]) => `<a class="card stat" href="${h}" style="text-decoration:none;color:inherit"><b>${n}</b><span>${l}</span></a>`).join("")}</div>
    <div class="g2">
      <section class="card grid"><div class="spread"><h3>O que está incluso</h3><span class="muted small num">${done} de ${inc.length}</span></div>
        ${inc.length ? `<div class="bar"><i style="width:${inc.length ? done / inc.length * 100 : 0}%"></i></div><ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px">${inc.map(i => `<li class="row" style="flex-wrap:nowrap"><span class="pill ${i.feito ? "ok" : ""}">${i.feito ? "Feito" : "A fazer"}</span><span>${esc(i.item)}</span></li>`).join("")}</ul>` : `<p class="muted">A Upe vai listar aqui as etapas do seu projeto.</p>`}
      </section>
      <div class="grid">
        ${doc.acesso?.manual && doc.manual?.url ? `<section class="card grid"><span class="eb">Manual da marca</span><h3>${esc(doc.manual.nome || "Manual da marca")}</h3><p class="muted small">Logotipos, cores, tipografia e regras de uso.</p><div><a class="btn" href="${esc(resolveMedia(doc.manual.url))}" target="_blank" rel="noopener" download>Baixar o manual</a></div></section>` : ""}
        ${has("apresentacao") ? `<section class="card grid"><span class="eb">Apresentação</span><h3>${esc(doc.apresentacao.marca || doc.marca || "A sua marca")}</h3><p class="muted small">${esc(doc.apresentacao.lede || "A proposta completa do projeto.")}</p><div><a class="btn sec" href="#/c/apresentacao">Ver a apresentação</a></div></section>` : ""}
        ${doc.recorrente?.ativo ? `<section class="card grid"><span class="eb">Plano recorrente</span><h3>${esc(doc.recorrente.descricao || "Mensalidade")}</h3><p class="muted">${brl(doc.recorrente.valor)} por mês · vence todo dia ${esc(doc.recorrente.dia)}</p></section>` : ""}
        <section class="card grid"><span class="eb">Precisa de algo?</span><p class="muted small">Escreva para a Upe por aqui ou pelo WhatsApp.</p><div class="row"><a class="btn sec" href="#/c/mensagens">Enviar mensagem</a>${state.cfg.whatsapp || CFG.whatsappUpe ? `<a class="btn sec" href="${esc(waLink(state.cfg.whatsapp || CFG.whatsappUpe, `Olá! Sou ${doc.nome} (${doc.marca || doc.empresa}).`))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</div></section>
      </div>
    </div>`;
}

/* ---------- apresentação (aba 05 do dossiê) ---------- */
function resolveUrl(p, base) { if (!p) return ""; if (/^(\{assets\}|idb:)/.test(p)) return resolveMedia(p); if (/^(https?:|blob:|data:)/.test(p) || !base) return p; try { return new URL(p, base).href; } catch (e) { return p; } }
function cApres(m, { doc }) {
  const A = doc.apresentacao || {}, R = p => resolveUrl(p, A.baseUrl), slides = (A.slides || []).filter(s => s.img || s.tipo);
  let i = 0;
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Apresentação</span><h1>${esc(A.marca || doc.marca || "")}</h1>${A.lede ? `<p class="muted">${esc(A.lede)}</p>` : ""}</div>
    ${A.cores?.length ? `<div class="row">${A.cores.map(c => `<span class="row small" style="gap:6px"><i style="width:18px;height:18px;border-radius:50%;background:${esc(c.hex)};border:1px solid var(--line);display:inline-block"></i>${esc(c.nome)}</span>`).join("")}</div>` : ""}
    ${slides.length ? `<div class="player" id="pl"><div class="stage" id="stg"></div><div class="pbar"><button id="pp" aria-label="Tela anterior">←</button><span class="nm" id="pn"></span><button id="pf">Tela cheia</button><button id="px" aria-label="Próxima tela">→</button></div></div>
      <div class="rail" id="rail">${slides.map((s, k) => `<button data-k="${k}"><div class="rt">${s.img ? `<img src="${esc(R(s.img))}" alt="">` : esc({ filme: "Filme", motions: "Motions", instagram: "Instagram" }[s.tipo] || "Tela")}</div><span>${k + 1}. ${esc(s.nome || "")}</span></button>`).join("")}</div>` : `<div class="empty">A apresentação ainda não foi publicada.</div>`}
    ${A.pdf ? `<div><a class="btn sec" href="${esc(R(A.pdf))}" target="_blank" rel="noopener">Baixar em PDF${A.pdfTamanho ? ` (${esc(A.pdfTamanho)})` : ""}</a></div>` : ""}`;
  if (!slides.length) return;
  const stg = $("#stg");
  const show = k => {
    i = (k + slides.length) % slides.length; const s = slides[i];
    stg.querySelectorAll("video").forEach(v => v.pause());
    if (s.tipo === "filme" && A.filme?.video) stg.innerHTML = `<video src="${esc(R(A.filme.video))}" poster="${esc(R(A.filme.poster))}" controls playsinline></video>`;
    else if (s.tipo === "motions" && A.motions?.length) stg.innerHTML = `<div class="igg" style="grid-template-columns:repeat(2,1fr)">${A.motions.map(mo => `<video src="${esc(R(mo.video))}" poster="${esc(R(mo.poster))}" controls playsinline style="border-radius:8px"></video>`).join("")}</div>`;
    else if (s.tipo === "instagram" && A.instagram?.length) { stg.innerHTML = `<div class="igg">${A.instagram.map((p, k2) => `<button data-ig="${k2}" aria-label="Ampliar ${esc(p.titulo)}"><img src="${esc(R(p.img))}" alt="${esc(p.titulo)}"></button>`).join("")}</div>`; stg.querySelectorAll("[data-ig]").forEach(b => b.onclick = () => { const p = A.instagram[+b.dataset.ig]; modal(esc(p.titulo || "Post"), `<div class="media-box"><img src="${esc(R(p.img))}" alt=""></div>${p.legenda ? `<div class="legenda">${esc(p.legenda)}</div>` : ""}`); }); }
    else stg.innerHTML = s.img ? `<img src="${esc(R(s.img))}" alt="${esc(s.nome)}">` : `<div class="ph">${esc(s.nome)}</div>`;
    $("#pn").textContent = `${i + 1} de ${slides.length} · ${s.nome || ""}`;
    $$("#rail button").forEach(b => b.setAttribute("aria-current", +b.dataset.k === i ? "true" : "false"));
  };
  $("#pp").onclick = () => show(i - 1); $("#px").onclick = () => show(i + 1);
  $("#pf").onclick = () => { const el = $("#pl"); (el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => toast("Tela cheia não está disponível aqui")); };
  $$("#rail button").forEach(b => b.onclick = () => show(+b.dataset.k));
  $("#pl").tabIndex = 0; $("#pl").addEventListener("keydown", e => { if (e.key === "ArrowRight") show(i + 1); if (e.key === "ArrowLeft") show(i - 1); });
  show(0);
}

/* ---------- conteúdo: calendário de aprovação ---------- */
let calMonth = null;
// link direto (#/…/post) abre o item uma vez; tira o id do endereço para não reabrir ao salvar
const semAlvo = () => { try { history.replaceState(null, "", location.hash.replace(/\/[^/]+$/, "")); } catch (e) {} };
function cConteudo(m, c, opt = {}) {
  const { doc, acoes } = c;
  const posts = (doc.posts || []).filter(p => p.status !== "rascunho").map(p => ({ ...comRepost(p, doc.posts), ef: statusOf(p, acoes) })).sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  if (!calMonth) { const nx = posts.find(p => p.ef.status === "pendente"); const d = nx && nx.data ? new Date(nx.data + "T12:00") : new Date(); calMonth = [d.getFullYear(), d.getMonth()]; }
  const filt = ss.get("upe-cf") || "todos";
  const cvw = ls.get("upe-ccvw") || "cal";
  const draw = () => {
    const [Y, M] = calMonth, first = new Date(Y, M, 1), start = new Date(Y, M, 1 - first.getDay()), today = isoDay(new Date());
    const inMonth = posts.filter(p => (p.data || "").startsWith(`${Y}-${pad(M + 1)}`)).filter(p => filt === "todos" || p.ef.status === filt);
    let cells = ""; for (let k = 0; k < 42; k++) { const d = new Date(start); d.setDate(start.getDate() + k); const iso = isoDay(d);
      const evs = posts.filter(p => p.data === iso && (filt === "todos" || p.ef.status === filt));
      cells += `<div class="day ${d.getMonth() !== M ? "out" : ""} ${iso === today ? "today" : ""}"><span class="d">${d.getDate()}</span>${evs.map(p => `<button class="ev ${evCls(p.ef.status)}" data-p="${p.id}" title="${esc(p.titulo)}">${ehRepost(p) ? "Repost · " : ""}${esc(TIPOS_POST[p.tipo] || p.tipo)} · ${esc(p.titulo)}</button>`).join("")}</div>`; }
    const kits = (doc.kits || []).filter(k => (doc.posts || []).some(p => p.kitId === k.id && p.status !== "rascunho"));
    const tl = doc.perfil ? timelineApps(doc.perfil) : [];
    m.innerHTML = (kits.length ? `<section class="card grid"><span class="eb">Kits de conteúdo</span><div class="row">${kits.map(k => `<a class="btn sec sm" href="#/c/kit/${esc(k.id)}">${esc(k.nome)} · ${(doc.posts || []).filter(p => p.kitId === k.id && p.status !== "rascunho").length} peças</a>`).join("")}</div><p class="muted small">Os arquivos ficam liberados para baixar depois que você aprova cada peça.</p></section>` : "") + `<div class="spread"><div class="grid" style="gap:6px"><span class="eb">Calendário de conteúdo</span><h1>Aprove os seus posts</h1><p class="muted small">Toque em um post para ver, aprovar ou pedir ajuste com um comentário. Depois de aprovado, o download fica liberado.</p></div>
      <div class="row"><button class="btn sec sm" id="mPrev" aria-label="Mês anterior">←</button><b style="min-width:150px;text-align:center;text-transform:capitalize">${MESES[M]} ${Y}</b><button class="btn sec sm" id="mNext" aria-label="Próximo mês">→</button></div></div>
      <div class="row" role="group" aria-label="Filtrar">${[["todos", "Todos"], ["pendente", "Aguardando aprovação"], ["aprovado", "Aprovados"], ["ajustes", "Ajustes pedidos"], ["publicado", "Publicados"]].map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${filt === k}">${l}</button>`).join("")}<span style="flex:1"></span><button class="chip" data-cv="cal" aria-pressed="${cvw !== "grade"}">Calendário</button><button class="chip" data-cv="grade" aria-pressed="${cvw === "grade"}">Grade</button></div>
      ${cvw === "grade" ? gradePosts(posts.filter(p => filt === "todos" || p.ef.status === filt)) : `<div class="card pad0"><div class="cal">${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => `<div class="dow">${d}</div>`).join("")}${cells}</div></div>
      <div class="agenda" aria-label="Lista do mês">${inMonth.length ? inMonth.map(p => { const d = new Date(p.data + "T12:00"), cp = capaDe(p); return `<button class="agi agt" data-p="${p.id}"><span class="dt">${pad(d.getDate())}/${pad(d.getMonth() + 1)}<small>${["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][d.getDay()]}</small></span><span class="lthumb">${tagsHTML(p.ef.status, p)}<span class="thumb" style="width:52px;aspect-ratio:4/5;border-radius:8px">${cp ? imgTag(cp) : `<span class="small">${esc(TIPOS_POST[p.tipo] || "")}</span>`}</span></span><span style="min-width:0"><b>${esc(p.titulo)}</b><br><span class="muted small">${esc(TIPOS_POST[p.tipo] || p.tipo)}${(p.versao || 1) > 1 ? ` · versão ${p.versao}` : ""}</span></span>${pill(p.ef.status)}</button>`; }).join("") : `<div class="empty">Nenhum post neste mês.</div>`}</div>`}
      ${tl.length ? `<details class="card"><summary><b>Timeline sugerida para cada app</b> <span class="muted small">a partir do diagnóstico da sua marca</span></summary>${timelineHTML(tl, "")}</details>` : ""}`;
    if ($("#mPrev")) $("#mPrev").onclick = () => { calMonth = M ? [Y, M - 1] : [Y - 1, 11]; draw(); };
    if ($("#mNext")) $("#mNext").onclick = () => { calMonth = M < 11 ? [Y, M + 1] : [Y + 1, 0]; draw(); };
    $$("[data-f]", m).forEach(b => b.onclick = () => { ss.set("upe-cf", b.dataset.f); cConteudo(m, c); });
    $$("[data-p]", m).forEach(b => b.onclick = () => postModal(posts.find(p => p.id === b.dataset.p), c));
    $$("[data-cv]", m).forEach(b => b.onclick = () => { ls.set("upe-ccvw", b.dataset.cv); cConteudo(m, c); });
  };
  draw();
  const alvo = opt.arg && posts.find(p => p.id === opt.arg); if (alvo) { semAlvo(); postModal(alvo, c); }
}
// conversa do post: pedidos de ajuste do cliente e devoluções da Upe, por versão
function conversaPost(p, acoes, adm = false) {
  const its = [...acoes.filter(a => a.alvo === p.id && (a.tipo === "ajuste" || (a.tipo === "aprovar" && a.texto))).map(a => ({ em: a.em, por: "cliente", texto: a.texto, v: a.versao || 1, tipo: a.tipo })), ...(p.historico || []).map(h => ({ ...h, por: "upe" }))].sort((a, b) => a.em - b.em);
  return its.length ? `<div style="display:flex;flex-direction:column;gap:6px"><span class="eb">Comentários</span>${its.map(i => `<div class="msg ${(i.por === "upe") === adm ? "me" : "them"}"><b class="small">${i.por === "upe" ? "Upe" : adm ? "Cliente" : "Você"} · v${i.v}${i.tipo === "aprovar" ? " · aprovou" : i.tipo === "ajuste" ? " · pediu ajuste" : ""}</b><div>${esc(i.texto || "")}</div><small>${fdt(i.em)}</small></div>`).join("")}</div>` : "";
}
function postModal(p, c) {
  const can = p.ef.status === "pendente" || p.ef.status === "ajustes", lib = p.ef.status === "aprovado" || p.ef.status === "publicado";
  modal(esc(p.titulo), `
    ${tagsHTML(p.ef.status, p)}
    <div class="row">${pill(p.ef.status)}<span class="muted small">${esc(TIPOS_POST[p.tipo] || p.tipo)} · ${fdate(p.data)}${(p.versao || 1) > 1 ? ` · versão ${p.versao}` : ""}</span></div>
    ${p._orig ? `<div class="card" style="background:var(--info-bg)"><b>Repost</b> de “${esc(p._orig.titulo)}”${p._orig.data ? ` (${fdate(p._orig.data)})` : ""}.</div>` : ""}
    ${p.ef.status === "pendente" && (p.versao || 1) > 1 ? `<div class="card" style="background:var(--warn-bg)"><b>Ajuste feito.</b> Esta é a versão ${p.versao}, corrigida a partir do seu comentário. Confira e aprove.</div>` : ""}
    ${(p.midias || []).map(u => `<div class="media-box" ${lib ? "" : "data-nodl"}>${mediaHTML(u, p.tipo, "", !lib)}</div>`).join("")}
    ${p.legenda ? `<div><span class="eb">Legenda</span><div class="legenda">${esc(p.legenda)}</div></div>` : ""}
    <div class="row">${p.legenda ? `<button class="btn sec sm" id="pCpL">Copiar legenda</button>` : ""}${lib ? (p.midias || []).map((u, i) => dlBtn(u, p.midias.length > 1 ? `Baixar arquivo ${i + 1}` : "Baixar arquivo")).join("") + (p.capa ? dlBtn(p.capa, "Baixar capa") : "") : (p.midias || []).length ? `<span class="pill">Download liberado depois da aprovação</span>` : ""}</div>
    ${conversaPost(p, c.acoes)}
    ${can ? `<label class="f" for="pCom">Comentário (obrigatório para pedir ajuste)<textarea id="pCom" placeholder="Ex.: trocar a foto, mudar a primeira frase da legenda…"></textarea></label>` : ""}`,
    can ? `<button class="btn bad" id="pAj">Pedir ajuste</button><button class="btn ok" id="pOk">Aprovar</button>` : `<button class="btn sec" data-close>Fechar</button>`);
  if ($("#pCpL")) $("#pCpL").onclick = () => copy(p.legenda, "Legenda copiada");
  if (!can) return;
  $("#pOk").onclick = async () => { await Api.act(c.id, { tipo: "aprovar", alvo: p.id, versao: p.versao || 1, texto: $("#pCom").value.trim() }); dlg.close(); toast("Post aprovado. O download está liberado."); refreshClient(); };
  $("#pAj").onclick = async () => { const t = $("#pCom").value.trim(); if (!t) { $("#pCom").focus(); return toast("Escreva o que precisa mudar"); } await Api.act(c.id, { tipo: "ajuste", alvo: p.id, versao: p.versao || 1, texto: t }); dlg.close(); toast("Pedido de ajuste enviado. A Upe avisa quando a nova versão estiver pronta."); refreshClient(); };
}

/* ---------- materiais gráficos ---------- */
function cGraficos(m, c) {
  const { doc, acoes } = c;
  const gs = (doc.graficos || []).filter(g => g.status !== "orcamento" && g.status !== "rascunho").map(g => ({ ...g, ef: statusOf(g, acoes) }));
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Papelaria gráfica</span><h1>Aprove as suas artes</h1><p class="muted small">Confira a arte, as especificações e o valor antes de ir para a gráfica.</p></div>
    ${gs.length ? `<div class="g3">${gs.map(g => `<article class="card grid">
      <div class="thumb">${g.arte ? mediaHTML(g.arte) : "Arte em preparação"}</div>
      <div class="spread"><h3>${esc(g.produto)}</h3>${pill(g.ef.status)}</div>
      <dl class="spec"><dt>Especificação</dt><dd>${esc(g.specs)}</dd><dt>Quantidade</dt><dd class="num">${esc(Number(g.quantidade || 0).toLocaleString("pt-BR"))}</dd><dt>Valor</dt><dd class="num"><b>${brl(g.valor)}</b></dd>${(g.versao || 1) > 1 ? `<dt>Versão</dt><dd>${g.versao}</dd>` : ""}</dl>
      ${g.ef.status === "ajustes" && g.ef.texto ? `<p class="small" style="color:var(--bad)"><b>Seu ajuste:</b> ${esc(g.ef.texto)}</p>` : ""}
      ${g.ef.status === "pendente" || g.ef.status === "ajustes" ? `<div class="row"><button class="btn ok sm" data-ok="${g.id}">Aprovar arte</button><button class="btn bad sm" data-aj="${g.id}">Pedir ajuste</button>${g.arte ? `<button class="btn sec sm" data-ver="${g.id}">Ampliar</button>` : ""}</div>` : (g.arte ? `<div><button class="btn sec sm" data-ver="${g.id}">Ampliar</button></div>` : "")}
    </article>`).join("")}</div>` : `<div class="empty">Nenhuma arte para aprovar agora.</div>`}`;
  $$("[data-ver]", m).forEach(b => b.onclick = () => { const g = gs.find(x => x.id === b.dataset.ver); modal(esc(g.produto), `<div class="media-box">${mediaHTML(g.arte)}</div>`); });
  $$("[data-ok]", m).forEach(b => b.onclick = async () => { const g = gs.find(x => x.id === b.dataset.ok); await Api.act(c.id, { tipo: "aprovar", alvo: g.id, versao: g.versao || 1, texto: "" }); toast("Arte aprovada"); refreshClient(); });
  $$("[data-aj]", m).forEach(b => b.onclick = () => { const g = gs.find(x => x.id === b.dataset.aj);
    modal(`Ajuste em ${esc(g.produto)}`, `<label class="f" for="gCom">O que precisa mudar?<textarea id="gCom"></textarea></label>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="gSend">Enviar pedido</button>`);
    $("#gSend").onclick = async () => { const t = $("#gCom").value.trim(); if (!t) return $("#gCom").focus(); await Api.act(c.id, { tipo: "ajuste", alvo: g.id, versao: g.versao || 1, texto: t }); dlg.close(); toast("Pedido de ajuste enviado"); refreshClient(); }; });
}

/* ---------- comprar de novo ---------- */
function cProdutos(m, c, { recItems }) {
  const { doc, acoes } = c, peds = pedidosOf(doc, acoes);
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Comprar de novo</span><h1>Seus materiais aprovados</h1><p class="muted small">Peça de novo igual ou com alterações. A Upe confirma o pedido e libera a cobrança.</p></div>
    <div class="g3">${recItems.map(g => `<article class="card grid"><div class="thumb">${g.arte ? mediaHTML(g.arte) : esc(g.produto)}</div><h3>${esc(g.produto)}</h3><p class="muted small">${esc(g.specs)}</p>
      <p class="num"><b>${brl(g.precoRecompra || g.valor)}</b> <span class="muted small">por ${esc(Number(g.quantidade || 0).toLocaleString("pt-BR"))} un.</span></p>
      <div class="row"><button class="btn sm" data-rb="${g.id}" data-m="igual">Comprar igual</button><button class="btn sec sm" data-rb="${g.id}" data-m="alterado">Com alterações</button></div></article>`).join("")}</div>
    <section class="card grid"><h3>Meus pedidos</h3>${peds.length ? `<div class="tbl"><table><thead><tr><th>Data</th><th>Produto</th><th>Qtd.</th><th>Tipo</th><th>Status</th></tr></thead><tbody>${peds.map(p => { const g = (doc.graficos || []).find(x => x.id === p.alvo); return `<tr><td class="num">${fdt(p.em)}</td><td>${esc(g?.produto || "—")}${p.texto ? `<br><span class="muted small">${esc(p.texto)}</span>` : ""}</td><td class="num">${esc(Number(p.quantidade || 0).toLocaleString("pt-BR"))}</td><td>${p.modo === "alterado" ? "Com alterações" : "Igual"}</td><td>${pill(p.status)}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="muted">Você ainda não fez pedidos por aqui.</p>`}</section>`;
  $$("[data-rb]", m).forEach(b => b.onclick = () => {
    const g = recItems.find(x => x.id === b.dataset.rb), alt = b.dataset.m === "alterado";
    modal(`${alt ? "Comprar com alterações" : "Comprar de novo"} · ${esc(g.produto)}`, `
      <label class="f" for="rQ">Quantidade<input id="rQ" type="number" min="1" value="${esc(g.quantidade || 1)}"></label>
      ${alt ? `<label class="f" for="rT">O que muda? (texto, telefone, endereço, cor…)<textarea id="rT"></textarea></label>` : `<p class="muted small">Mesma arte e especificação: ${esc(g.specs)}.</p>`}`,
      `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="rSend">Enviar pedido</button>`);
    $("#rSend").onclick = async () => { const q = +$("#rQ").value, t = alt ? $("#rT").value.trim() : ""; if (!q) return $("#rQ").focus(); if (alt && !t) return $("#rT").focus();
      await Api.act(c.id, { tipo: "pedido", alvo: g.id, quantidade: q, modo: alt ? "alterado" : "igual", texto: t }); dlg.close(); toast("Pedido enviado para a Upe"); refreshClient(); };
  });
}

/* ---------- pagamentos ---------- */
function cPagamentos(m, c) {
  const { doc, acoes } = c, cfg = state.cfg;
  const cobs = (doc.cobrancas || []).filter(x => x.liberada).map(x => ({ ...x, st: cobStatus(x, acoes) })).sort((a, b) => (a.st === "paga") - (b.st === "paga") || String(a.vencimento).localeCompare(b.vencimento));
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Pagamentos</span><h1>Suas cobranças</h1><p class="muted small">Pague por PIX ou cartão. Depois de pagar, toque em “Já paguei” para a Upe confirmar.</p></div>
    ${doc.recorrente?.ativo ? `<div class="card spread"><div><span class="eb">Plano recorrente</span><h3>${esc(doc.recorrente.descricao)}</h3></div><div class="num"><b>${brl(doc.recorrente.valor)}</b><span class="muted small"> / mês · dia ${esc(doc.recorrente.dia)}</span></div></div>` : ""}
    ${cobs.length ? `<div class="grid">${cobs.map(x => `<article class="card spread">
      <div class="grid" style="gap:4px"><h3>${esc(x.descricao)}</h3><span class="muted small">Vencimento ${fdate(x.vencimento)}</span></div>
      <div class="row"><b class="num" style="font-size:1.2rem">${brl(x.valor)}</b>${pill(x.st)}</div>
      ${x.st === "aberta" || x.st === "informado" ? `<div class="row" style="width:100%;justify-content:flex-end">
        ${x.pix && cfg.pixChave ? `<button class="btn sm" data-pix="${x.id}">Pagar com PIX</button>` : ""}
        ${x.cartao && (x.linkCartao || cfg.linkCartao) ? `<a class="btn sec sm" href="${esc(x.linkCartao || cfg.linkCartao)}" target="_blank" rel="noopener">Pagar com cartão</a>` : ""}
        ${x.st === "aberta" ? `<button class="btn sec sm" data-paid="${x.id}">Já paguei</button>` : `<span class="muted small">A Upe vai confirmar o seu pagamento.</span>`}</div>` : ""}
    </article>`).join("")}</div>` : `<div class="empty">Nenhuma cobrança liberada no momento.</div>`}`;
  $$("[data-pix]", m).forEach(b => b.onclick = () => {
    const x = cobs.find(y => y.id === b.dataset.pix);
    const payload = pixPayload({ chave: cfg.pixChave, nome: cfg.pixNome, cidade: cfg.pixCidade, valor: x.valor, txid: ("UPE" + x.id).slice(0, 25), descricao: x.descricao });
    modal("Pagar com PIX", `<div class="grid" style="justify-items:center;text-align:center;gap:12px"><b class="num" style="font-size:1.6rem">${brl(x.valor)}</b><span class="muted small">${esc(x.descricao)}</span><div class="qrbox" id="qr"></div>
      <span class="muted small">Recebedor: ${esc(cfg.pixNome || "")}</span></div><div><span class="eb">PIX copia e cola</span><div class="cc" id="ccx">${esc(payload)}</div></div>`,
      `<button class="btn sec" id="cpx">Copiar código</button><button class="btn" id="paid2">Já paguei</button>`);
    try { new QRCode($("#qr"), { text: payload, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M }); } catch (e) { $("#qr").innerHTML = '<span class="muted small">Use o código copia e cola abaixo.</span>'; }
    $("#cpx").onclick = () => copy(payload, "Código PIX copiado");
    $("#paid2").onclick = async () => { await Api.act(c.id, { tipo: "pagamento", alvo: x.id, metodo: "pix" }); dlg.close(); toast("Obrigado! A Upe vai confirmar."); refreshClient(); };
  });
  $$("[data-paid]", m).forEach(b => b.onclick = async () => { await Api.act(c.id, { tipo: "pagamento", alvo: b.dataset.paid, metodo: "informado" }); toast("Obrigado! A Upe vai confirmar."); refreshClient(); });
}

/* ---------- mensagens ---------- */
function threadHTML(msgs, me) { return msgs.length ? msgs.map(x => `<div class="msg ${x.autor === me ? "me" : "them"}">${esc(x.texto)}<small>${x.autor === "upe" ? "Upe" : "Cliente"} · ${fdt(x.em)}</small></div>`).join("") : `<div class="empty">Nenhuma mensagem ainda.</div>`; }
function cMensagens(m, c) {
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Mensagens</span><h1>Fale com a Upe</h1><p class="muted small">Para dúvidas e situações específicas do seu projeto.</p></div>
    <section class="card grid"><div class="thread" id="th">${threadHTML(thread(c.doc, c.acoes), "cliente")}</div>
    <form class="compose" id="cf"><label class="f" style="flex:1" for="ct">Sua mensagem<textarea id="ct" rows="2"></textarea></label><button class="btn" type="submit">Enviar</button></form></section>`;
  const th = $("#th"); th.scrollTop = th.scrollHeight;
  $("#cf").onsubmit = async e => { e.preventDefault(); const t = $("#ct").value.trim(); if (!t) return; await Api.act(c.id, { tipo: "mensagem", texto: t }); refreshClient(); };
}

/* =====================================================================
   PAINEL DO ADMINISTRADOR
   ===================================================================== */
async function adminRoute(rest) {
  if (!(await S.currentAdmin())) return gate("admin");
  state.admin = true;
  const [sec = "clientes", a1, a2, a3] = rest;
  const [clients, contatos, reunioes, cron0, pub] = await Promise.all([Api.listClients(), S.list("contatos"), S.list("reunioes"), S.list("cronograma"), Api.config()]);
  const crono = cron0.filter(x => x.id !== EXTRAS_ID), exDoc = cron0.find(x => x.id === EXTRAS_ID);
  let extras = exDoc ? exDoc.lista || [] : null; if (!extras) { try { extras = (await cronogramaArquivo()).extras || []; } catch (e) { extras = []; } }
  Object.assign(state.cache, { clients, contatos, reunioes, crono, extras, pub });
  const unread = clients.reduce((s, c) => s + c.acoes.filter(a => a.tipo === "mensagem" && a.em > (c.doc.lidoAdmEm || 0)).length, 0);
  const novos = contatos.filter(c => (c.status || "novo") === "novo").length;
  const hoje = todayIso(), agendaHoje = reunioes.filter(r => r.data === hoje && r.status !== "cancelada").length + crono.filter(x => x.data === hoje && x.status !== "publicado").length;
  const nav = [["clientes", "Clientes", 0], ["calendario", "Calendário", agendaHoje], ["cronograma", "Cronograma Upe", 0], ["apps", "Apps Extra", clients.reduce((s, c) => s + appPedidos(c.doc, c.acoes).filter(p => p.status === "novo").length, 0)], ["contatos", "Contatos do site", novos], ["mensagens", "Inbox", unread], ["newsletter", "Newsletter", 0], ["config", "Configurações", 0]];
  const cur = sec === "cliente" ? "clientes" : sec;
  app.innerHTML = demoBar() + `<div class="adm"><aside class="side"><div class="logo">${WM}</div><nav class="nav">${nav.map(([k, l, n]) => `<a href="#/admin/${k}" ${k === cur ? 'aria-current="page"' : ""}><span>${l}</span>${n ? `<span class="cnt">${n}</span>` : ""}</a>` + (k === "apps" ? APP_IDS.map(ap => `<a class="sub" href="#/admin/apps/${ap}" ${cur === "apps" && (a1 || "erp") === ap ? 'aria-current="true"' : ""}><span>${esc(APPS_PADRAO[ap].nome.replace("Upe ", ""))}</span></a>`).join("") : "")).join("")}</nav>
    <div class="foot"><span>${S.mode === "demo" ? "Modo demonstração" : "Firebase conectado"}</span><button class="lnk" id="logout">Sair</button></div></aside><main class="work"><div class="wtop"><button class="btn sec sm" id="topReu">Agendar reunião</button><div id="bellH"></div></div><div id="w" class="grid" style="gap:18px"></div></main></div>`;
  bell($("#bellH"), "adm", notifsAdmin(state.cache)); $("#topReu").onclick = () => reuniaoModal();
  $("#logout").onclick = async () => { await S.logout(); state.admin = false; go("#/"); };
  const w = $("#w");
  if (sec === "clientes") return aClientes(w, clients);
  if (sec === "calendario") return aCalendario(w);
  if (sec === "cronograma") return aCronograma(w, a1 || "instagram", a2 || "");
  if (sec === "apps") return aApps(w, APP_IDS.includes(a1) ? a1 : "erp");
  if (sec === "cliente") return aCliente(w, a1, a2 || "projeto", a3);
  if (sec === "contatos") return aContatos(w, contatos);
  if (sec === "mensagens") return aInbox(w, clients, a1);
  if (sec === "newsletter") return a1 ? aNewsEditor(w, a1) : aNewsletter(w);
  if (sec === "config") return aConfig(w);
  go("#/admin/clientes");
}
const reAdmin = () => route();

function aClientes(w, clients) {
  const q = ss.get("upe-aq") || "";
  const rows = clients.filter(c => !q || `${c.doc.nome} ${c.doc.empresa} ${c.doc.marca} ${c.priv.email || ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.doc.criadoEm || 0) - (a.doc.criadoEm || 0));
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Painel Upe</span><h1>Clientes</h1></div><div class="row"><input id="aq" placeholder="Buscar cliente" value="${esc(q)}" aria-label="Buscar cliente" style="width:220px"><button class="btn" id="novo">Novo cliente</button></div></div>
    <div class="g4">${[
      ["Clientes ativos", clients.filter(c => c.doc.ativo !== false).length],
      ["Aguardando aprovação", clients.reduce((s, c) => { const p = pendencias(c.doc, c.acoes); return s + p.posts.length + p.artes.length; }, 0)],
      ["A receber (liberado)", brl(clients.reduce((s, c) => s + (c.doc.cobrancas || []).filter(x => x.liberada && cobStatus(x, c.acoes) !== "paga" && x.status !== "cancelado").reduce((t, x) => t + (+x.valor || 0), 0), 0))],
      ["Pedidos de recompra novos", clients.reduce((s, c) => s + pedidosOf(c.doc, c.acoes).filter(p => p.status === "novo").length, 0)]
    ].map(([l, n]) => `<div class="card stat"><b>${n}</b><span>${l}</span></div>`).join("")}</div>
    <div class="card pad0 tbl">${rows.length ? `<table><thead><tr><th>Cliente</th><th>Plano</th><th>Pendências</th><th>Pagamentos</th><th>Última atividade</th></tr></thead><tbody>${rows.map(c => {
      const p = pendencias(c.doc, c.acoes), last = Math.max(c.doc.criadoEm || 0, ...c.acoes.map(a => a.em)), unread = c.acoes.filter(a => a.tipo === "mensagem" && a.em > (c.doc.lidoAdmEm || 0)).length;
      const inf = (c.doc.cobrancas || []).filter(x => cobStatus(x, c.acoes) === "informado").length;
      return `<tr class="click" data-id="${c.id}" tabindex="0"><td><b>${esc(c.doc.marca || c.doc.empresa || c.doc.nome)}</b><br><span class="muted small">${esc(c.doc.nome)}${c.doc.ativo === false ? " · inativo" : ""}</span></td>
      <td><div class="row" style="gap:4px">${c.doc.plano?.branding ? '<span class="pill">Branding</span>' : ""}${c.doc.plano?.midias ? '<span class="pill">Mídias</span>' : ""}${c.doc.plano?.grafica ? '<span class="pill">Gráfica</span>' : ""}${c.doc.recorrente?.ativo ? '<span class="pill info">Recorrente</span>' : ""}</div></td>
      <td class="small">${p.posts.length ? `${p.posts.length} post(s) · ` : ""}${p.artes.length ? `${p.artes.length} arte(s) · ` : ""}${unread ? `<b>${unread} msg nova(s)</b>` : ""}${!p.posts.length && !p.artes.length && !unread ? '<span class="muted">—</span>' : ""}</td>
      <td class="small">${inf ? `<span class="pill info">${inf} informado(s)</span>` : p.cobs.length ? `${p.cobs.length} em aberto` : '<span class="muted">—</span>'}</td>
      <td class="small num muted">${fdt(last)}</td></tr>`; }).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhum cliente${q ? " encontrado" : " ainda"}. <button class="btn" id="novo2">Cadastrar o primeiro</button></div>`}</div>`;
  $("#aq").oninput = e => { ss.set("upe-aq", e.target.value); clearTimeout(w._t); w._t = setTimeout(() => { aClientes(w, clients); const i = $("#aq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
  $$("tr[data-id]", w).forEach(r => { r.onclick = () => go(`#/admin/cliente/${r.dataset.id}/projeto`); r.onkeydown = e => { if (e.key === "Enter") r.click(); }; });
  [$("#novo"), $("#novo2")].filter(Boolean).forEach(b => b.onclick = () => newClientModal());
}

function newClientModal(pre = {}) {
  modal("Novo cliente", `
    <div class="g2"><label class="f" for="nNome">Nome do contato<input id="nNome" value="${esc(pre.nome || "")}"></label><label class="f" for="nEmp">Empresa<input id="nEmp" value="${esc(pre.empresa || "")}"></label></div>
    <div class="g2"><label class="f" for="nMarca">Marca<input id="nMarca" value="${esc(pre.marca || pre.empresa || "")}"></label><label class="f" for="nEmail">E-mail<input id="nEmail" type="email" value="${esc(pre.email || "")}"></label></div>
    <div class="g2"><label class="f" for="nTel">WhatsApp (com DDD)<input id="nTel" value="${esc(pre.telefone || "")}" placeholder="11 90000-0000"></label><span></span></div>
    <span class="eb">Plano</span>
    <div class="g3"><label class="tg"><input type="checkbox" id="pB" checked>Branding</label><label class="tg"><input type="checkbox" id="pM" ${pre.assunto === "Mídias" ? "checked" : ""}>Mídias digitais</label><label class="tg"><input type="checkbox" id="pG">Papelaria gráfica</label></div>
    ${pre.mensagem ? `<div class="legenda small"><b>Mensagem do contato:</b> ${esc(pre.mensagem)}</div>` : ""}`,
    `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="nSave">Cadastrar e gerar código</button>`);
  $("#nSave").onclick = async () => {
    const nome = $("#nNome").value.trim(); if (!nome) return $("#nNome").focus();
    const tel = $("#nTel").value.replace(/\D/g, "");
    const doc = Api.blankClient({ nome, empresa: $("#nEmp").value.trim(), marca: $("#nMarca").value.trim(), plano: { branding: $("#pB").checked, midias: $("#pM").checked, grafica: $("#pG").checked } });
    doc.acesso = { apresentacao: false, manual: false, calendario: doc.plano.midias, graficos: doc.plano.grafica, recompra: false, pagamentos: true };
    const { id, code } = await Api.createClient(doc, { email: $("#nEmail").value.trim(), telefone: tel ? (tel.length <= 11 ? "55" + tel : tel) : "", origemContato: pre.contatoId || "" });
    if (pre.contatoId) await S.set(`contatos/${pre.contatoId}`, { status: "convertido", clienteId: id }, true);
    codeModal(id, code, doc, { telefone: tel ? (tel.length <= 11 ? "55" + tel : tel) : "", email: $("#nEmail").value.trim() });
  };
}
function codeModal(id, code, doc, priv) {
  const msg = `Olá, ${(doc.nome || "").split(" ")[0]}! Seu acesso ao portal da Upe Criativo está pronto.\n\nLink: ${portalUrl()}\nCódigo: ${code}\n\nPor lá você acompanha o projeto, aprova conteúdos e artes e faz pagamentos.`;
  modal("Código de acesso", `<p>Envie este código para <b>${esc(doc.nome)}</b>. Ele dá acesso ao portal desse cliente.</p>
    <div class="card" style="text-align:center"><span class="code" style="font-size:1.6rem">${esc(code)}</span></div>
    <div class="legenda small">${esc(msg)}</div>`,
    `<button class="btn sec" id="cpc">Copiar mensagem</button>${priv.telefone ? `<a class="btn sec" href="${esc(waLink(priv.telefone, msg))}" target="_blank" rel="noopener">Enviar no WhatsApp</a>` : ""}${priv.email ? `<a class="btn sec" href="mailto:${esc(priv.email)}?subject=${encodeURIComponent("Seu acesso ao portal Upe")}&body=${encodeURIComponent(msg)}">E-mail</a>` : ""}<button class="btn" id="goC">Abrir cliente</button>`);
  $("#cpc").onclick = () => copy(msg, "Mensagem copiada");
  $("#goC").onclick = () => { dlg.close(); go(`#/admin/cliente/${id}/projeto`); };
}

/* ---------- ficha do cliente ---------- */
async function aCliente(w, id, tab, alvo) {
  const c = state.cache.clients.find(x => x.id === id); if (!c) return go("#/admin/clientes");
  const doc = clone(c.doc), priv = clone(c.priv), acoes = c.acoes;
  const p = pendencias(doc, acoes), unread = acoes.filter(a => a.tipo === "mensagem" && a.em > (doc.lidoAdmEm || 0)).length, pedNovos = pedidosOf(doc, acoes).filter(x => x.status === "novo").length;
  const ajustes = [...(doc.posts || []), ...(doc.graficos || [])].filter(x => statusOf(x, acoes).status === "ajustes");
  const tabs = [["projeto", "Projeto e acessos", 0], ["apresentacao", "Apresentação e dossiê", 0], ["conteudo", "Conteúdo", p.posts.length + (doc.posts || []).filter(x => ajustes.includes(x)).length], ["graficos", "Gráficos e recompra", pedNovos], ["pagamentos", "Pagamentos", (doc.cobrancas || []).filter(x => cobStatus(x, acoes) === "informado").length], ["apps", "Apps Extra", appPedidos(doc, acoes).filter(x => x.status === "novo").length], ["mensagens", "Inbox", unread]];
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><a href="#/admin/clientes" class="small">← Clientes</a><h1>${esc(doc.marca || doc.empresa || doc.nome)}</h1><span class="muted">${esc(doc.nome)}${priv.email ? ` · ${esc(priv.email)}` : ""}</span></div>
    <div class="row"><button class="btn sec sm" id="vCli">Ver como cliente</button></div></div>
    <nav class="subtabs">${tabs.map(([k, l, n]) => `<a class="tab" href="#/admin/cliente/${id}/${k}" ${k === tab ? 'aria-current="page"' : ""}>${l}${n ? `<span class="cnt">${n}</span>` : ""}</a>`).join("")}</nav>
    <div id="ct" class="grid" style="gap:16px"></div>`;
  $("#vCli").onclick = () => { ss.set("upe-cliente", id); ss.set("upe-voltar", `#/admin/cliente/${id}/projeto`); go("#/c/inicio"); };
  const save = async (msg = "Salvo") => { doc.atualizadoEm = Date.now(); await S.set(`clientes/${id}`, doc); toast(msg); reAdmin(); };
  const ct = $("#ct");
  ({ projeto: aProjeto, apresentacao: aApres, conteudo: aConteudo, graficos: aGraficosA, pagamentos: aPagamentosA, mensagens: aMsgA, apps: aClienteApps })[tab](ct, { id, doc, priv, acoes, save, alvo });
}

function aProjeto(ct, { id, doc, priv, save }) {
  const tg = (k, l, s, grp = "acesso") => `<label class="tg"><input type="checkbox" data-${grp}="${k}" ${doc[grp]?.[k] ? "checked" : ""}><span>${l}${s ? `<small>${s}</small>` : ""}</span></label>`;
  ct.innerHTML = `
    <div class="g2">
      <section class="card grid"><h3>Dados do cliente</h3>
        <div class="g2"><label class="f" for="dNome">Nome do contato<input id="dNome" value="${esc(doc.nome)}"></label><label class="f" for="dEmp">Empresa<input id="dEmp" value="${esc(doc.empresa)}"></label></div>
        <div class="g2"><label class="f" for="dMarca">Marca<input id="dMarca" value="${esc(doc.marca)}"></label><label class="f" for="dEmail">E-mail (newsletter)<input id="dEmail" type="email" value="${esc(priv.email || "")}"></label></div>
        <div class="g2"><label class="f" for="dTel">WhatsApp<input id="dTel" value="${esc(priv.telefone || "")}"></label><label class="tg" style="align-self:end"><input type="checkbox" id="dAtivo" ${doc.ativo !== false ? "checked" : ""}>Acesso ativo</label></div>
        <label class="f" for="dNotas">Notas internas (o cliente não vê)<textarea id="dNotas">${esc(priv.notas || "")}</textarea></label>
      </section>
      <section class="card grid"><h3>Código de acesso</h3>
        <div class="card" style="text-align:center;background:var(--bg-2)"><span class="code" style="font-size:1.3rem">${esc(priv.codigo || "—")}</span></div>
        <div class="row"><button class="btn sec sm" id="cShow">Enviar código</button><button class="btn sec sm" id="cRegen">Gerar novo código</button></div>
        <p class="muted small">Ao gerar um novo código, o anterior deixa de funcionar.</p>
        <h3 style="margin-top:8px">Plano</h3>
        <div class="g3">${tg("branding", "Branding", "", "plano")}${tg("midias", "Mídias digitais", "", "plano")}${tg("grafica", "Papelaria gráfica", "", "plano")}</div>
      </section>
    </div>
    <section class="card grid"><h3>O que o cliente vê no portal</h3>
      <div class="g3">${tg("apresentacao", "Apresentação", "Aba 05 do dossiê")}${tg("manual", "Baixar o manual da marca")}${tg("calendario", "Calendário de aprovação", "Precisa do plano Mídias digitais")}${tg("graficos", "Aprovar materiais gráficos", "Precisa do plano Papelaria gráfica")}${tg("recompra", "Comprar de novo", "Só itens com recompra liberada")}${tg("pagamentos", "Pagamentos", "Só cobranças liberadas")}</div>
    </section>
    <div class="g2">
      <section class="card grid"><div class="spread"><h3>Incluso no projeto</h3><button class="btn sec sm" id="incAdd">Adicionar item</button></div>
        <div class="grid" id="incList" style="gap:8px">${(doc.incluso || []).map((it, k) => `<div class="row" style="flex-wrap:nowrap"><input type="checkbox" data-incf="${k}" ${it.feito ? "checked" : ""} aria-label="Feito"><input data-inct="${k}" value="${esc(it.item)}" aria-label="Item"><button class="btn sec sm" data-incd="${k}" aria-label="Remover">×</button></div>`).join("") || '<p class="muted small">Nenhum item. Ex.: “Manual da marca”, “12 posts por mês”.</p>'}</div>
      </section>
      <section class="card grid"><h3>Recorrência e manual</h3>
        <label class="tg"><input type="checkbox" id="rAt" ${doc.recorrente?.ativo ? "checked" : ""}><span>Serviço recorrente<small>Mensalidade de mídias ou manutenção</small></span></label>
        <div class="g3"><label class="f" for="rDesc">Descrição<input id="rDesc" value="${esc(doc.recorrente?.descricao || "Mensalidade")}"></label><label class="f" for="rVal">Valor (R$)<input id="rVal" type="number" step="0.01" value="${esc(doc.recorrente?.valor || 0)}"></label><label class="f" for="rDia">Dia do vencimento<input id="rDia" type="number" min="1" max="28" value="${esc(doc.recorrente?.dia || 10)}"></label></div>
        <label class="f" for="mUrl">Manual da marca: link do arquivo (PDF)<input id="mUrl" value="${esc(doc.manual?.url || "")}" placeholder="https://…"></label>
        <div class="row"><label class="f" for="mNome" style="flex:1">Nome do arquivo<input id="mNome" value="${esc(doc.manual?.nome || "")}"></label><label class="btn sec sm" style="align-self:end">Enviar arquivo<input type="file" id="mFile" accept=".pdf,image/*" hidden></label></div>
      </section>
    </div>
    ${entregasHTML(doc)}
    <div class="spread"><div class="row"><button class="btn bad sm" id="del">Excluir cliente</button><button class="btn sec sm" id="reu">Agendar reunião</button></div><button class="btn" id="sv">Salvar alterações</button></div>`;
  $("#reu").onclick = () => reuniaoModal({}, { com: "cliente", clienteId: id, titulo: `Reunião · ${doc.marca || doc.nome}` });
  $("#enAdd").onclick = () => { collect(); doc.entregas.push({ id: uid(8), titulo: "", data: addDays(todayIso(), 7), status: "pendente" }); aProjeto(ct, { id, doc, priv, save }); const l = [...ct.querySelectorAll("[data-ent]")].pop(); l && l.focus(); };
  ct.querySelectorAll("[data-endel]").forEach(b => b.onclick = () => { collect(); doc.entregas.splice(+b.dataset.endel, 1); aProjeto(ct, { id, doc, priv, save }); });
  $("#incAdd").onclick = () => { collect(); doc.incluso.push({ item: "", feito: false }); aProjeto(ct, { id, doc, priv, save }); $$("[data-inct]", ct).pop().focus(); };
  $$("[data-incd]", ct).forEach(b => b.onclick = () => { collect(); doc.incluso.splice(+b.dataset.incd, 1); aProjeto(ct, { id, doc, priv, save }); });
  $("#mFile").onchange = async e => { const f = e.target.files[0]; if (!f) return; toast("Enviando…"); const u = await S.upload(f, `clientes/${id}/manual`); if (u) { $("#mUrl").value = u; if (!$("#mNome").value) $("#mNome").value = f.name; toast(S.mode === "demo" && !S.idb ? "Arquivo anexado só até fechar a página (modo demonstração)" : "Arquivo enviado"); } else toast("Ative o Firebase Storage para enviar arquivos"); };
  function collect() {
    Object.assign(doc, { nome: $("#dNome").value.trim(), empresa: $("#dEmp").value.trim(), marca: $("#dMarca").value.trim(), ativo: $("#dAtivo").checked });
    $$("[data-acesso]", ct).forEach(i => doc.acesso[i.dataset.acesso] = i.checked);
    $$("[data-plano]", ct).forEach(i => doc.plano[i.dataset.plano] = i.checked);
    doc.incluso = $$("[data-inct]", ct).map((i, k) => ({ item: i.value.trim(), feito: $(`[data-incf="${k}"]`, ct).checked }));
    doc.recorrente = { ativo: $("#rAt").checked, descricao: $("#rDesc").value.trim(), valor: +$("#rVal").value || 0, dia: +$("#rDia").value || 10 };
    doc.manual = { url: $("#mUrl").value.trim(), nome: $("#mNome").value.trim() };
    Object.assign(priv, { email: $("#dEmail").value.trim(), telefone: $("#dTel").value.replace(/\D/g, ""), notas: $("#dNotas").value });
    doc.entregas = doc.entregas || []; entregasCollect(ct, doc);
  }
  $("#sv").onclick = async () => { collect(); doc.incluso = doc.incluso.filter(i => i.item); await S.set(`privado/${id}`, priv); await save(); };
  $("#cShow").onclick = () => codeModal(id, priv.codigo, doc, priv);
  $("#cRegen").onclick = () => { modal("Gerar novo código?", `<p>O código atual (<span class="code">${esc(priv.codigo)}</span>) vai parar de funcionar.</p>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="rg">Gerar novo código</button>`);
    $("#rg").onclick = async () => { const code = await Api.regenCode(id); priv.codigo = code; dlg.close(); codeModal(id, code, doc, priv); }; };
  $("#del").onclick = () => { modal("Excluir cliente?", `<p>Isso apaga <b>${esc(doc.marca || doc.nome)}</b>, o código de acesso, os posts, as artes, as cobranças e as mensagens. Não dá para desfazer.</p>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn bad" id="dl">Excluir</button>`);
    $("#dl").onclick = async () => { await Api.deleteClient(id); dlg.close(); toast("Cliente excluído"); go("#/admin/clientes"); }; };
}

/* ---------- apresentação e dossiê ---------- */
function parseDossie(html) {
  const i = html.lastIndexOf("const DADOS"), j = i < 0 ? -1 : html.indexOf("</script>", i);
  if (i < 0 || j < 0) throw new Error("Não encontrei o objeto DADOS neste arquivo. Use o modelo de dossiê da Upe.");
  try { return new Function(html.slice(i, j) + "\n;return DADOS;")(); } // arquivo do próprio admin
  catch (e) { throw new Error("O objeto DADOS do dossiê tem um erro: " + e.message); }
}
function apresFromDossie(D, baseUrl) {
  const A = D.apresentacao || {}, R = D.redesign || {};
  const strip = v => (typeof v === "string" && /^\[.*\]$/.test(v.trim())) ? "" : v;
  return {
    marca: strip(D.projeto?.marca) || "", lede: strip(A.lede) || "", pdf: A.pdf || "", pdfTamanho: strip(A.pdfTamanho) || "", baseUrl: baseUrl || "",
    cores: (D.marca?.cores || []).filter(c => !/^\[/.test(c.nome)).map(c => ({ nome: c.nome, hex: c.hex })),
    slides: (A.slides || []).map(s => ({ nome: s.nome, tipo: s.tipo || "img", img: s.img || "" })),
    filme: R.filme ? { titulo: strip(R.filme.titulo), texto: strip(R.filme.texto), video: R.filme.video || "", poster: R.filme.poster || "", duracao: strip(R.filme.duracao) } : null,
    motions: (R.motions || []).filter(mo => mo.video).map(mo => ({ video: mo.video, poster: mo.poster || "", titulo: strip(mo.titulo), duracao: strip(mo.duracao) })),
    semanas: (A.semanas || []).map(strip).filter(Boolean),
    instagram: (A.instagram || []).filter(p => p.img).map(p => ({ img: p.img, titulo: strip(p.titulo), data: strip(p.data), semana: p.semana, legenda: strip(p.legenda) }))
  };
}
function aApres(ct, { id, doc, priv, save }) {
  const A = doc.apresentacao || { slides: [], instagram: [], motions: [] };
  const hasDossie = !!priv.dossie;
  ct.innerHTML = `
    <div class="g2">
      <section class="card grid"><h3>Dossiê do cliente</h3>
        <p class="muted small">Importe o dossiê preenchido (arquivo do modelo Upe). O dossiê completo fica salvo só para você. O cliente vê apenas a <b>aba 05 · Apresentação</b>. As postagens do dossiê (<code>postagens</code> e o feed da aba 05) entram no calendário de aprovação, e a ficha “Canais” gera a timeline por app.</p>
        <div class="row">${hasDossie ? `<span class="pill ok">Dossiê salvo${priv.dossieNome ? ` · ${esc(priv.dossieNome)}` : ""}</span>` : '<span class="pill">Nenhum dossiê salvo</span>'}<span class="muted small">${priv.dossieEm ? fdt(priv.dossieEm) : ""}</span></div>
        <label class="f" for="dBase">Endereço da pasta do dossiê (para achar imagens e vídeos)<input id="dBase" value="${esc(A.baseUrl || "")}" placeholder="https://seusite.web.app/clientes/marca/dossie/"></label>
        <div class="row"><label class="btn sm">Importar dossiê (.html)<input type="file" id="dFile" accept=".html,text/html" hidden></label>${hasDossie ? `<button class="btn sec sm" id="dOpen">Abrir dossiê completo</button>` : ""}<a class="btn sec sm" href="modelos/Modelo_Dossie_Upe.html" target="_blank" rel="noopener">Modelo em branco</a></div>
      </section>
      <section class="card grid"><h3>O que o cliente vê</h3>
        <div class="row"><span class="pill ${doc.acesso?.apresentacao ? "ok" : ""}">${doc.acesso?.apresentacao ? "Apresentação liberada" : "Apresentação oculta"}</span><a class="small" href="#/admin/cliente/${id}/projeto">Mudar em Projeto e acessos</a></div>
        <label class="f" for="aMarca">Título<input id="aMarca" value="${esc(A.marca || doc.marca || "")}"></label>
        <label class="f" for="aLede">Texto de abertura<textarea id="aLede">${esc(A.lede || "")}</textarea></label>
        <label class="f" for="aPdf">PDF da apresentação (link)<input id="aPdf" value="${esc(A.pdf || "")}"></label>
      </section>
    </div>
    <section class="card grid"><div class="spread"><h3>Telas da apresentação</h3><button class="btn sec sm" id="sAdd">Adicionar tela</button></div>
      <p class="muted small">Tipo “imagem” mostra a imagem. “Filme”, “Motions” e “Instagram” viram telas interativas com os vídeos e o feed do dossiê.</p>
      <div class="grid" style="gap:8px">${(A.slides || []).map((s, k) => `<div class="row" style="flex-wrap:nowrap"><span class="muted small num" style="width:22px">${k + 1}</span><input data-sn="${k}" value="${esc(s.nome)}" aria-label="Nome da tela" style="max-width:220px"><select data-st="${k}" aria-label="Tipo" style="max-width:130px">${["img", "filme", "motions", "instagram"].map(t => `<option value="${t}" ${(s.tipo || "img") === t ? "selected" : ""}>${{ img: "Imagem", filme: "Filme", motions: "Motions", instagram: "Instagram" }[t]}</option>`).join("")}</select><input data-si="${k}" value="${esc(s.img || "")}" placeholder="caminho ou link da imagem" aria-label="Imagem"><button class="btn sec sm" data-sd="${k}" aria-label="Remover tela">×</button></div>`).join("") || '<p class="muted small">Nenhuma tela ainda. Importe um dossiê ou adicione telas.</p>'}</div>
      <div class="row muted small">Filme: ${A.filme?.video ? esc(A.filme.video) : "não definido"} · Motions: ${(A.motions || []).length} · Posts do Instagram: ${(A.instagram || []).length}</div>
    </section>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="aSv">Salvar apresentação</button></div>`;
  const collect = () => {
    const slides = $$("[data-sn]", ct).map((i, k) => ({ nome: i.value.trim(), tipo: $(`[data-st="${k}"]`, ct).value, img: $(`[data-si="${k}"]`, ct).value.trim() }));
    doc.apresentacao = { ...A, marca: $("#aMarca").value.trim(), lede: $("#aLede").value.trim(), pdf: $("#aPdf").value.trim(), baseUrl: $("#dBase").value.trim(), slides };
  };
  $("#sAdd").onclick = () => { collect(); doc.apresentacao.slides.push({ nome: "Nova tela", tipo: "img", img: "" }); aApres(ct, { id, doc, priv, save }); };
  $$("[data-sd]", ct).forEach(b => b.onclick = () => { collect(); doc.apresentacao.slides.splice(+b.dataset.sd, 1); aApres(ct, { id, doc, priv, save }); });
  $("#aSv").onclick = async () => { collect(); await save("Apresentação salva"); };
  $("#dFile").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const html = await f.text(), D = parseDossie(html), base = $("#dBase").value.trim();
      doc.apresentacao = apresFromDossie(D, base);
      doc.perfil = perfilDoDossie(D, doc);
      const novos = postsDoDossie(D, base, doc);
      if (novos.length) { doc.posts = [...(doc.posts || []), ...novos]; doc.kits = [...(doc.kits || []).filter(k => k.id !== "dossie"), { id: "dossie", nome: "Posts do dossiê", importadoEm: Date.now(), total: (doc.posts || []).filter(p => p.kitId === "dossie").length }]; }
      Object.assign(priv, { dossie: html, dossieNome: f.name, dossieEm: Date.now() });
      if (html.length > 900000) toast("Dossiê grande: guarde as imagens fora do arquivo");
      await S.set(`privado/${id}`, priv); await save(`Dossiê importado. A aba 05 virou a apresentação${novos.length ? ` e ${novos.length} post(s) entraram no calendário de aprovação` : ""}. Timeline por app atualizada.`);
    } catch (er) { toast(er.message); }
  };
  if ($("#dOpen")) $("#dOpen").onclick = () => { modal(`Dossiê · ${esc(priv.dossieNome || doc.marca || "")}`, `<iframe id="dosF" title="Dossiê completo" style="width:100%;height:75vh;border:0;border-radius:10px;background:#fff"></iframe>`, "", true); $("#dosF").srcdoc = priv.dossie; };
}

/* ---------- conteúdo (posts) ---------- */
// avisa o cliente: mensagem no portal (aparece no sininho) e e-mail pela fila do Firebase, se houver e-mail
async function avisarCliente(doc, priv, texto, assunto) {
  doc.mensagens = [...(doc.mensagens || []), { id: uid(8), texto, em: Date.now() }];
  if (S.mode === "firebase" && priv?.email) try { await S.add("mail", { to: priv.email, message: { subject: assunto || "Novidade no seu portal Upe", html: `<p>Olá, ${esc((doc.nome || "").split(" ")[0])}!</p><p>${esc(texto)}</p><p>Acesse o portal da Upe Criativo com o seu código para ver e aprovar.</p>` } }); } catch (e) {}
}
function aConteudo(ct, { id, doc, priv, acoes, save, alvo }) {
  const posts = (doc.posts || []).map(p => ({ ...comRepost(p, doc.posts), ef: statusOf(p, acoes) })).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const aj = posts.filter(p => p.ef.status === "ajustes" && p.ef.por === "cliente").sort((a, b) => b.ef.em - a.ef.em);
  const tl = timelineApps(doc.perfil || { canais: ["instagram", "whatsapp", "google"] });
  ct.innerHTML = `${!doc.plano?.midias ? `<div class="card" style="background:var(--warn-bg)">Este cliente não está no plano Mídias digitais. Os posts só aparecem para ele com o plano e o acesso “Calendário de aprovação” ligados.</div>` : ""}
    ${aj.length ? `<section class="card grid prio"><div class="spread"><div><span class="tagx bad">Prioridade</span> <b>${aj.length} ajuste${aj.length > 1 ? "s" : ""} pedido${aj.length > 1 ? "s" : ""} pelo cliente</b></div><span class="muted small">Ajuste e devolva o arquivo corrigido: o cliente é avisado na hora.</span></div>
      ${aj.map(p => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><div style="flex:1;min-width:0"><b>${esc(p.titulo)}</b> <span class="muted small">v${p.versao || 1} · ${fdate(p.data)} · ${fdt(p.ef.em)}</span><div class="small">“${esc(p.ef.texto)}”</div></div><button class="btn sm" data-ed="${p.id}">Devolver corrigido</button></div>`).join("")}</section>` : ""}
    <div class="spread"><h3>Posts para aprovação</h3><div class="row"><button class="btn sec" id="pKit">Importar kit (HTML + arquivos)</button><button class="btn" id="pNew">Novo post</button></div></div>
    ${(doc.kits || []).length ? `<div class="row small">${doc.kits.map(k => `<span class="pill info">${esc(k.nome)} · ${k.total}</span>`).join("")}</div>` : ""}
    <div class="card pad0 tbl">${posts.length ? `<table><thead><tr><th>Data</th><th>Prévia</th><th>Post</th><th>Status</th><th>Retorno do cliente</th><th></th></tr></thead><tbody>${posts.map(p => { const cp = capaDe(p); return `<tr ${p.ef.status === "ajustes" ? 'class="rowprio"' : ""}><td class="num">${fdate(p.data)}</td><td style="width:84px"><div class="lthumb">${tagsHTML(p.ef.status, p)}<div class="thumb" style="width:56px;aspect-ratio:4/5;border-radius:8px">${cp ? imgTag(cp) : `<span class="small">${esc(TIPOS_POST[p.tipo] || "")}</span>`}</div></div></td><td><b>${esc(p.titulo)}</b>${(p.versao || 1) > 1 ? ` <span class="muted small">v${p.versao}</span>` : ""}<br><span class="muted small">${esc(TIPOS_POST[p.tipo] || p.tipo)}${p.origem ? " · " + esc(p.origem) : ""}${p._orig ? ` · repost de “${esc(p._orig.titulo)}”` : ""}</span></td><td>${pill(p.ef.status)}</td><td class="small">${p.ef.por === "cliente" ? esc(p.ef.texto || (p.ef.status === "aprovado" ? "Aprovou" : "")) + ` <span class="muted">· ${fdt(p.ef.em)}</span>` : '<span class="muted">—</span>'}</td><td><button class="btn ${p.ef.status === "ajustes" ? "" : "sec"} sm" data-ed="${p.id}">${p.ef.status === "ajustes" ? "Devolver corrigido" : "Editar"}</button></td></tr>`; }).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhum post ainda. Importe um kit ou o dossiê com postagens (aba Apresentação e dossiê).</div>`}</div>
    <details class="card" ${doc.perfil ? "" : ""}><summary><b>Timeline sugerida por app</b> <span class="muted small">${doc.perfil ? `a partir do dossiê${doc.perfil.em ? " · " + fdt(doc.perfil.em) : ""}` : "padrão: importe o dossiê para personalizar"}</span></summary>${timelineHTML(tl, doc.perfil ? `Canais do diagnóstico: ${doc.perfil.canais.map(k => APPS[k]?.nome || k).join(", ")}. O cliente também vê esta sugestão no portal.` : "")}</details>`;
  const edit = p => {
    const n = !p; p = p || { id: uid(8), data: isoDay(new Date()), tipo: "imagem", titulo: "", midias: [], legenda: "", versao: 1, status: "pendente" };
    const base0 = (doc.posts || []).find(x => x.id === p.id) || p, ajuste = p.ef?.status === "ajustes";
    const origs = (doc.posts || []).filter(x => x.id !== p.id && !x.repostDe && (x.midias || []).length);
    modal(n ? "Novo post" : ajuste ? "Devolver post corrigido" : "Editar post", `
      ${ajuste ? `<div class="card" style="background:var(--bad-bg)"><span class="tagx bad">Prioridade</span> <b>O cliente pediu ajuste na versão ${p.versao || 1}:</b><div>“${esc(p.ef.texto)}”</div><span class="muted small">${fdt(p.ef.em)}</span></div>` : ""}
      ${!n ? conversaPost(p, acoes, true) : ""}
      <div class="g3"><label class="f" for="eD">Data de publicação<input id="eD" type="date" value="${esc(p.data)}"></label><label class="f" for="eT">Tipo<select id="eT">${Object.entries(TIPOS_POST).map(([k, l]) => `<option value="${k}" ${p.tipo === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f" for="eS">Status<select id="eS">${["rascunho", "pendente", "aprovado", "ajustes", "publicado"].map(s => `<option value="${s}" ${(p.ef?.status || p.status) === s ? "selected" : ""}>${ST[s][0]}</option>`).join("")}</select></label></div>
      <label class="f" for="eTi">Título<input id="eTi" value="${esc(p.titulo)}"></label>
      <label class="f" for="eM">Mídias (um link por linha: imagem, vídeo ou áudio)${ajuste ? " · troque pelo arquivo corrigido" : ""}<textarea id="eM" rows="3">${esc((base0.midias || []).join("\n"))}</textarea></label>
      <div><label class="btn ${ajuste ? "" : "sec"} sm">${ajuste ? "Enviar arquivo corrigido" : "Enviar arquivos"}<input type="file" id="eF" multiple accept="image/*,video/*,audio/*" hidden></label>${ajuste ? ' <label class="small row" style="display:inline-flex;gap:6px"><input type="checkbox" id="eRep" checked>Substituir os arquivos atuais</label>' : ""}</div>
      <label class="f" for="eL">Legenda<textarea id="eL" rows="5">${esc(base0.legenda || "")}</textarea></label>
      <label class="f" for="eRp">Repost de (opcional)<select id="eRp"><option value="">Não é repost</option>${origs.map(y => `<option value="${esc(y.id)}" ${base0.repostDe === y.id ? "selected" : ""}>${fdate(y.data)} · ${esc(y.titulo.slice(0, 60))}</option>`).join("")}</select></label>
      ${!n ? `<label class="tg"><input type="checkbox" id="eV" ${ajuste ? "checked" : ""}><span>Enviar como nova versão${ajuste ? " (devolver corrigido)" : ""}<small>Volta para “Aguardando aprovação”, o cliente é avisado e aprova de novo</small></span></label>
      <label class="f" for="eN">Mensagem para o cliente (opcional)<input id="eN" placeholder="Ex.: troquei a foto e encurtei a legenda"></label>` : ""}`,
      `${!n ? `<button class="btn bad" id="eX">Excluir</button>` : ""}<button class="btn sec" data-close>Cancelar</button><button class="btn" id="eOk">${ajuste ? "Devolver corrigido" : "Salvar"}</button>`, true);
    let trocou = false;
    $("#eF").onchange = async e => { toast("Enviando…"); const urls = []; for (const f of e.target.files) { const u = await S.upload(f, `clientes/${id}/posts`); if (u) urls.push(u); } if (urls.length) { $("#eM").value = ($("#eRep")?.checked && !trocou ? urls : [$("#eM").value.trim(), ...urls].filter(Boolean)).join("\n"); trocou = true; toast(S.mode === "demo" && !S.idb ? "Arquivos anexados só até fechar a página (modo demonstração)" : "Arquivos enviados"); } else toast("Ative o Firebase Storage para enviar arquivos"); };
    $("#eOk").onclick = async () => {
      const t = $("#eTi").value.trim(); if (!t) return $("#eTi").focus();
      const base = (doc.posts || []).find(x => x.id === p.id) || {};
      const newVer = $("#eV")?.checked, st = newVer ? "pendente" : $("#eS").value, nota = $("#eN")?.value.trim() || "";
      const np = { ...base, id: p.id, data: $("#eD").value, tipo: $("#eT").value, titulo: t, midias: $("#eM").value.split("\n").map(s => s.trim()).filter(Boolean), legenda: $("#eL").value, versao: (base.versao || 1) + (newVer ? 1 : 0), repostDe: $("#eRp").value || undefined };
      if (!np.repostDe) delete np.repostDe;
      if (n || newVer || st !== p.ef?.status) { np.status = st; np.statusEm = Date.now(); }
      if (newVer) { np.historico = [...(base.historico || []), { em: Date.now(), v: np.versao, texto: nota || (ajuste ? "Ajuste feito. Nova versão para aprovar." : "Nova versão para aprovar.") }];
        await avisarCliente(doc, priv, `${ajuste ? "Ajuste pronto" : "Nova versão"}: “${t}” (versão ${np.versao}) está no calendário para você aprovar.${nota ? " " + nota : ""}`, `Ajuste pronto: ${t}`); }
      doc.posts = n ? [...(doc.posts || []), np] : doc.posts.map(x => x.id === p.id ? np : x);
      dlg.close(); await save(newVer ? "Nova versão enviada. O cliente foi avisado." : "Post salvo");
    };
    if ($("#eX")) $("#eX").onclick = async () => { doc.posts = doc.posts.filter(x => x.id !== p.id); dlg.close(); await save("Post excluído"); };
  };
  $("#pNew").onclick = () => edit(null);
  $("#pKit").onclick = () => kitImport({ alvo: "cliente", id, doc, save });
  $$("[data-ed]", ct).forEach(b => b.onclick = () => edit(posts.find(p => p.id === b.dataset.ed)));
  const a = alvo && posts.find(p => p.id === alvo); if (a) { semAlvo(); edit(a); }
}

/* ---------- gráficos e recompra ---------- */
function aGraficosA(ct, { id, doc, priv, acoes, save, alvo }) {
  const gs = (doc.graficos || []).map(g => ({ ...g, ef: statusOf(g, acoes) })), peds = pedidosOf(doc, acoes);
  ct.innerHTML = `${!doc.plano?.grafica ? `<div class="card" style="background:var(--warn-bg)">Este cliente não está no plano Papelaria gráfica. As artes só aparecem para ele com o plano e o acesso ligados.</div>` : ""}
    <div class="spread"><h3>Materiais gráficos</h3><button class="btn" id="gNew">Novo material</button></div>
    <div class="card pad0 tbl">${gs.length ? `<table><thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th><th>Status</th><th>Recompra</th><th></th></tr></thead><tbody>${gs.map(g => `<tr><td><b>${esc(g.produto)}</b>${(g.versao || 1) > 1 ? ` <span class="muted small">v${g.versao}</span>` : ""}<br><span class="muted small">${esc(g.specs)}</span>${g.ef.por === "cliente" && g.ef.texto ? `<br><span class="small" style="color:var(--bad)">Cliente: ${esc(g.ef.texto)}</span>` : ""}</td><td class="num">${esc(Number(g.quantidade || 0).toLocaleString("pt-BR"))}</td><td class="num">${brl(g.valor)}</td><td>${pill(g.ef.status)}</td><td>${g.recompra ? `<span class="pill ok">Liberada · ${brl(g.precoRecompra || g.valor)}</span>` : '<span class="muted small">—</span>'}</td><td><button class="btn ${g.ef.status === "ajustes" ? "" : "sec"} sm" data-ed="${g.id}">${g.ef.status === "ajustes" ? "Devolver corrigido" : "Editar"}</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhum material ainda.</div>`}</div>
    <h3>Pedidos de recompra</h3>
    <div class="card pad0 tbl">${peds.length ? `<table><thead><tr><th>Data</th><th>Produto</th><th>Qtd.</th><th>Pedido</th><th>Status</th><th></th></tr></thead><tbody>${peds.map(p => { const g = gs.find(x => x.id === p.alvo); return `<tr><td class="num">${fdt(p.em)}</td><td>${esc(g?.produto || "—")}</td><td class="num">${esc(Number(p.quantidade).toLocaleString("pt-BR"))}</td><td class="small">${p.modo === "alterado" ? `<b>Com alterações:</b> ${esc(p.texto)}` : "Igual ao anterior"}</td><td><select data-ps="${p.id}" aria-label="Status do pedido">${["novo", "producao", "entregue", "cancelado"].map(s => `<option value="${s}" ${p.status === s ? "selected" : ""}>${ST[s][0]}</option>`).join("")}</select></td><td>${doc.pedidosAdm?.[p.id]?.cobrancaId ? '<span class="pill ok">Cobrança criada</span>' : `<button class="btn sec sm" data-pc="${p.id}">Gerar cobrança</button>`}</td></tr>`; }).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhum pedido de recompra.</div>`}</div>`;
  const edit = g => {
    const n = !g; g = g || { id: uid(8), produto: "", specs: "", quantidade: 100, valor: 0, arte: "", versao: 1, status: "orcamento", recompra: false, precoRecompra: 0 };
    const ajuste = g.ef?.status === "ajustes" && g.ef.por === "cliente";
    modal(n ? "Novo material gráfico" : ajuste ? "Devolver arte corrigida" : "Editar material", `
      ${ajuste ? `<div class="card" style="background:var(--bad-bg)"><span class="tagx bad">Prioridade</span> <b>O cliente pediu ajuste na versão ${g.versao || 1}:</b><div>“${esc(g.ef.texto)}”</div></div>` : ""}
      <div class="g2"><label class="f" for="gP">Produto<input id="gP" value="${esc(g.produto)}" placeholder="Cartão de visita, flyer, cardápio…"></label><label class="f" for="gS">Status<select id="gS">${["orcamento", "pendente", "aprovado", "ajustes", "producao", "entregue"].map(s => `<option value="${s}" ${(g.ef?.status || g.status) === s ? "selected" : ""}>${ST[s][0]}${s === "orcamento" ? " (cliente não vê)" : ""}</option>`).join("")}</select></label></div>
      <label class="f" for="gSp">Especificação<input id="gSp" value="${esc(g.specs)}" placeholder="Formato · papel · cores · acabamento"></label>
      <div class="g2"><label class="f" for="gQ">Quantidade<input id="gQ" type="number" value="${esc(g.quantidade)}"></label><label class="f" for="gV">Valor (R$)<input id="gV" type="number" step="0.01" value="${esc(g.valor)}"></label></div>
      <label class="f" for="gA">Arte (link da imagem ou PDF)<input id="gA" value="${esc(g.arte)}"></label>
      <div><label class="btn sec sm">Enviar arte<input type="file" id="gF" accept="image/*,.pdf" hidden></label></div>
      <span class="eb">Recompra</span>
      <div class="g2"><label class="tg"><input type="checkbox" id="gR" ${g.recompra ? "checked" : ""}><span>Liberar para comprar de novo<small>Aparece em “Comprar de novo” para o cliente</small></span></label><label class="f" for="gRP">Preço da recompra (R$)<input id="gRP" type="number" step="0.01" value="${esc(g.precoRecompra || "")}" placeholder="igual ao valor"></label></div>
      ${!n ? `<label class="tg"><input type="checkbox" id="gNv" ${ajuste ? "checked" : ""}><span>Enviar como nova versão da arte<small>Volta para “Aguardando aprovação”</small></span></label>` : ""}`,
      `${!n ? `<button class="btn bad" id="gX">Excluir</button>` : ""}<button class="btn sec" data-close>Cancelar</button><button class="btn" id="gOk">Salvar</button>`);
    $("#gF").onchange = async e => { const f = e.target.files[0]; if (!f) return; const u = await S.upload(f, `clientes/${id}/graficos`); if (u) { $("#gA").value = u; toast("Arte anexada"); } else toast("Ative o Firebase Storage para enviar arquivos"); };
    $("#gOk").onclick = async () => {
      const pr = $("#gP").value.trim(); if (!pr) return $("#gP").focus();
      const base = (doc.graficos || []).find(x => x.id === g.id) || {}, nv = $("#gNv")?.checked, st = nv ? "pendente" : $("#gS").value;
      const ng = { ...base, id: g.id, produto: pr, specs: $("#gSp").value.trim(), quantidade: +$("#gQ").value || 0, valor: +$("#gV").value || 0, arte: $("#gA").value.trim(), recompra: $("#gR").checked, precoRecompra: +$("#gRP").value || 0, versao: (base.versao || 1) + (nv ? 1 : 0) };
      if (n || nv || st !== g.ef?.status) { ng.status = st; ng.statusEm = Date.now(); }
      if (ng.recompra && !doc.acesso.recompra) doc.acesso.recompra = true;
      if (nv) await avisarCliente(doc, priv, `${ajuste ? "Arte corrigida" : "Nova versão da arte"}: “${pr}” (versão ${ng.versao}) está pronta para você aprovar.`, `Arte corrigida: ${pr}`);
      doc.graficos = n ? [...(doc.graficos || []), ng] : doc.graficos.map(x => x.id === g.id ? ng : x);
      dlg.close(); await save("Material salvo");
    };
    if ($("#gX")) $("#gX").onclick = async () => { doc.graficos = doc.graficos.filter(x => x.id !== g.id); dlg.close(); await save("Material excluído"); };
  };
  $("#gNew").onclick = () => edit(null);
  $$("[data-ed]", ct).forEach(b => b.onclick = () => edit(gs.find(g => g.id === b.dataset.ed)));
  const ga = alvo && gs.find(g => g.id === alvo); if (ga) { semAlvo(); edit(ga); }
  $$("[data-ps]", ct).forEach(s => s.onchange = async () => { doc.pedidosAdm = doc.pedidosAdm || {}; doc.pedidosAdm[s.dataset.ps] = { ...(doc.pedidosAdm[s.dataset.ps] || {}), status: s.value }; await save("Pedido atualizado"); });
  $$("[data-pc]", ct).forEach(b => b.onclick = async () => {
    const p = peds.find(x => x.id === b.dataset.pc), g = gs.find(x => x.id === p.alvo), unit = (g?.precoRecompra || g?.valor || 0) / (g?.quantidade || 1);
    const cob = { id: uid(8), descricao: `${g?.produto || "Material gráfico"} · recompra (${Number(p.quantidade).toLocaleString("pt-BR")} un.)`, valor: Math.round(unit * p.quantidade * 100) / 100, vencimento: isoDay(new Date(Date.now() + 5 * 864e5)), liberada: false, status: "aberta", pix: true, cartao: true, linkCartao: "" };
    doc.cobrancas = [...(doc.cobrancas || []), cob]; doc.pedidosAdm = doc.pedidosAdm || {}; doc.pedidosAdm[p.id] = { ...(doc.pedidosAdm[p.id] || {}), cobrancaId: cob.id };
    await save("Cobrança criada (ainda não liberada). Confira em Pagamentos.");
  });
}

/* ---------- pagamentos ---------- */
function aPagamentosA(ct, { id, doc, acoes, save }) {
  const cobs = (doc.cobrancas || []).map(x => ({ ...x, st: cobStatus(x, acoes) })).sort((a, b) => String(b.vencimento).localeCompare(a.vencimento));
  ct.innerHTML = `<div class="spread"><h3>Cobranças</h3><div class="row">${doc.recorrente?.ativo ? `<button class="btn sec" id="cMes">Gerar mensalidade</button>` : ""}<button class="btn" id="cNew">Nova cobrança</button></div></div>
    ${doc.acesso?.pagamentos ? "" : `<div class="card" style="background:var(--warn-bg)">O acesso a Pagamentos está desligado para este cliente.</div>`}
    <div class="card pad0 tbl">${cobs.length ? `<table><thead><tr><th>Descrição</th><th>Vencimento</th><th>Valor</th><th>Visível ao cliente</th><th>Status</th><th></th></tr></thead><tbody>${cobs.map(x => `<tr><td><b>${esc(x.descricao)}</b><br><span class="muted small">${[x.pix && "PIX", x.cartao && "Cartão"].filter(Boolean).join(" · ")}</span></td><td class="num">${fdate(x.vencimento)}</td><td class="num">${brl(x.valor)}</td><td><label class="row small" style="gap:6px"><input type="checkbox" data-lib="${x.id}" ${x.liberada ? "checked" : ""}>${x.liberada ? "Liberada" : "Oculta"}</label></td><td>${pill(x.st)}</td><td><div class="row" style="gap:6px">${x.st !== "paga" ? `<button class="btn ok sm" data-pg="${x.id}">Confirmar pagamento</button>` : ""}<button class="btn sec sm" data-ed="${x.id}">Editar</button></div></td></tr>`).join("")}</tbody></table>` : `<div class="empty" style="margin:16px">Nenhuma cobrança.</div>`}</div>`;
  const edit = x => {
    const n = !x; x = x || { id: uid(8), descricao: "", valor: 0, vencimento: isoDay(new Date(Date.now() + 5 * 864e5)), liberada: true, status: "aberta", pix: true, cartao: true, linkCartao: "" };
    modal(n ? "Nova cobrança" : "Editar cobrança", `
      <label class="f" for="xD">Descrição<input id="xD" value="${esc(x.descricao)}" placeholder="Branding · entrada, Mensalidade de outubro…"></label>
      <div class="g2"><label class="f" for="xV">Valor (R$)<input id="xV" type="number" step="0.01" value="${esc(x.valor)}"></label><label class="f" for="xVe">Vencimento<input id="xVe" type="date" value="${esc(x.vencimento)}"></label></div>
      <div class="g3"><label class="tg"><input type="checkbox" id="xP" ${x.pix ? "checked" : ""}>PIX</label><label class="tg"><input type="checkbox" id="xC" ${x.cartao ? "checked" : ""}>Cartão</label><label class="tg"><input type="checkbox" id="xL" ${x.liberada ? "checked" : ""}>Liberar ao cliente</label></div>
      <label class="f" for="xLk">Link de pagamento com cartão (opcional; sem ele, usa o link padrão das configurações)<input id="xLk" value="${esc(x.linkCartao)}" placeholder="https://link.mercadopago.com.br/…"></label>
      <label class="f" for="xS">Status<select id="xS">${["aberta", "paga", "cancelado"].map(s => `<option value="${s}" ${x.status === s ? "selected" : ""}>${ST[s][0]}</option>`).join("")}</select></label>`,
      `${!n ? `<button class="btn bad" id="xX">Excluir</button>` : ""}<button class="btn sec" data-close>Cancelar</button><button class="btn" id="xOk">Salvar</button>`);
    $("#xOk").onclick = async () => { const d = $("#xD").value.trim(); if (!d) return $("#xD").focus();
      const nx = { ...x, liberadaEm: !x.liberada && $("#xL").checked ? Date.now() : (x.liberadaEm || 0), descricao: d, valor: +$("#xV").value || 0, vencimento: $("#xVe").value, pix: $("#xP").checked, cartao: $("#xC").checked, liberada: $("#xL").checked, linkCartao: $("#xLk").value.trim(), status: $("#xS").value };
      doc.cobrancas = n ? [...(doc.cobrancas || []), nx] : doc.cobrancas.map(y => y.id === x.id ? nx : y); dlg.close(); await save("Cobrança salva"); };
    if ($("#xX")) $("#xX").onclick = async () => { doc.cobrancas = doc.cobrancas.filter(y => y.id !== x.id); dlg.close(); await save("Cobrança excluída"); };
  };
  $("#cNew").onclick = () => edit(null);
  if ($("#cMes")) $("#cMes").onclick = () => { const d = new Date(), v = new Date(d.getFullYear(), d.getMonth() + (d.getDate() > (doc.recorrente.dia || 10) ? 1 : 0), doc.recorrente.dia || 10);
    edit(null); $("#xD").value = `${doc.recorrente.descricao || "Mensalidade"} · ${MESES[v.getMonth()]}`; $("#xV").value = doc.recorrente.valor; $("#xVe").value = isoDay(v); };
  $$("[data-ed]", ct).forEach(b => b.onclick = () => edit(doc.cobrancas.find(x => x.id === b.dataset.ed)));
  $$("[data-lib]", ct).forEach(i => i.onchange = async () => { doc.cobrancas = doc.cobrancas.map(x => x.id === i.dataset.lib ? { ...x, liberada: i.checked, liberadaEm: i.checked ? Date.now() : x.liberadaEm } : x); await save(i.checked ? "Cobrança liberada ao cliente" : "Cobrança oculta"); });
  $$("[data-pg]", ct).forEach(b => b.onclick = async () => { doc.cobrancas = doc.cobrancas.map(x => x.id === b.dataset.pg ? { ...x, status: "paga", pagaEm: Date.now() } : x); await save("Pagamento confirmado"); });
}

/* ---------- inbox ---------- */
function aMsgA(ct, { id, doc, acoes, save }) {
  ct.innerHTML = `<section class="card grid"><div class="thread" id="th">${threadHTML(thread(doc, acoes), "upe")}</div>
    <form class="compose" id="af"><label class="f" style="flex:1" for="at">Responder<textarea id="at" rows="2"></textarea></label><button class="btn" type="submit">Enviar</button></form></section>`;
  const th = $("#th"); th.scrollTop = th.scrollHeight;
  const unread = acoes.some(a => a.tipo === "mensagem" && a.em > (doc.lidoAdmEm || 0));
  if (unread) { doc.lidoAdmEm = Date.now(); S.set(`clientes/${id}`, doc); }
  $("#af").onsubmit = async e => { e.preventDefault(); const t = $("#at").value.trim(); if (!t) return; doc.mensagens = [...(doc.mensagens || []), { id: uid(8), texto: t, em: Date.now() }]; doc.lidoAdmEm = Date.now(); await save("Mensagem enviada"); };
}
function aInbox(w, clients) {
  const rows = clients.map(c => { const t = thread(c.doc, c.acoes); const last = t[t.length - 1]; return { c, last, unread: c.acoes.filter(a => a.tipo === "mensagem" && a.em > (c.doc.lidoAdmEm || 0)).length }; })
    .filter(r => r.last).sort((a, b) => b.unread - a.unread || b.last.em - a.last.em);
  w.innerHTML = `<div class="grid" style="gap:4px"><span class="eb">Inbox</span><h1>Mensagens dos clientes</h1></div>
    <div class="grid">${rows.length ? rows.map(({ c, last, unread }) => `<a class="card spread" href="#/admin/cliente/${c.id}/mensagens" style="text-decoration:none;color:inherit"><div class="grid" style="gap:4px;min-width:0"><b>${esc(c.doc.marca || c.doc.nome)}</b><span class="muted small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${last.autor === "upe" ? "Você: " : ""}${esc(last.texto)}</span></div><div class="row">${unread ? `<span class="pill warn">${unread} nova(s)</span>` : ""}<span class="muted small num">${fdt(last.em)}</span></div></a>`).join("") : `<div class="empty">Nenhuma conversa ainda.</div>`}</div>`;
}

/* ---------- contatos do site ---------- */
function aContatos(w, contatos) {
  const f = ss.get("upe-cf2") || "novo";
  const rows = contatos.map(c => ({ ...c, status: c.status || "novo" })).filter(c => f === "todos" || c.status === f).sort((a, b) => b.em - a.em);
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Formulário do site</span><h1>Contatos</h1></div><button class="btn" id="cAdd">Adicionar contato manual</button></div>
    <div class="row">${[["novo", "Novos"], ["convertido", "Viraram cliente"], ["arquivado", "Arquivados"], ["todos", "Todos"]].map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${l}</button>`).join("")}</div>
    <div class="grid">${rows.length ? rows.map(c => `<article class="card grid"><div class="spread"><div><b>${esc(c.nome)}</b> <span class="muted small">· ${esc(c.contato)}</span></div><div class="row">${pill(c.status)}<span class="pill info">${esc(c.assunto || "—")}</span><span class="muted small num">${fdt(c.em)}</span></div></div>
      <p>${esc(c.mensagem)}</p>
      <div class="row">${c.status !== "convertido" ? `<button class="btn sm" data-cv="${c.id}">Criar cliente</button>` : `<a class="btn sec sm" href="#/admin/cliente/${esc(c.clienteId)}/projeto">Abrir cliente</a>`}
      ${/@/.test(c.contato) ? `<a class="btn sec sm" href="mailto:${esc(c.contato)}">Responder por e-mail</a>` : `<a class="btn sec sm" href="${esc(waLink(c.contato.replace(/\D/g, "").length <= 11 ? "55" + c.contato.replace(/\D/g, "") : c.contato, `Olá, ${c.nome}! Aqui é da Upe Criativo, recebi a sua mensagem.`))}" target="_blank" rel="noopener">Responder no WhatsApp</a>`}
      <button class="btn sec sm" data-reu="${c.id}">Agendar reunião</button>${c.status === "novo" ? `<button class="btn sec sm" data-ar="${c.id}">Arquivar</button>` : ""}</div></article>`).join("") : `<div class="empty">Nenhum contato aqui.</div>`}</div>
    <p class="muted small">Os contatos chegam pelo formulário do site quando o Firebase está configurado no site (veja o README).</p>`;
  $$("[data-f]", w).forEach(b => b.onclick = () => { ss.set("upe-cf2", b.dataset.f); aContatos(w, contatos); });
  $$("[data-reu]", w).forEach(b => b.onclick = () => { const c = contatos.find(x => x.id === b.dataset.reu); reuniaoModal({}, { com: "lead", contatoId: c.id, titulo: `Conversa com ${c.nome} · ${c.assunto || "Upe"}` }); });
  $$("[data-ar]", w).forEach(b => b.onclick = async () => { await S.set(`contatos/${b.dataset.ar}`, { status: "arquivado" }, true); toast("Contato arquivado"); reAdmin(); });
  $$("[data-cv]", w).forEach(b => b.onclick = () => { const c = contatos.find(x => x.id === b.dataset.cv); const em = /@/.test(c.contato) ? c.contato.trim() : "", tel = em ? "" : c.contato;
    newClientModal({ nome: c.nome, email: em, telefone: tel, assunto: c.assunto, mensagem: c.mensagem, contatoId: c.id }); });
  $("#cAdd").onclick = () => { modal("Novo contato", `<div class="g2"><label class="f" for="kN">Nome<input id="kN"></label><label class="f" for="kC">E-mail ou WhatsApp<input id="kC"></label></div>
      <label class="f" for="kA">Assunto<select id="kA"><option>Branding</option><option>Redesign</option><option>Mídias</option><option>Papelaria gráfica</option><option>Outro assunto</option></select></label><label class="f" for="kM">Anotações<textarea id="kM"></textarea></label>`,
    `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="kOk">Salvar</button>`);
    $("#kOk").onclick = async () => { const n = $("#kN").value.trim(); if (!n) return $("#kN").focus(); await S.add("contatos", { nome: n, contato: $("#kC").value.trim(), assunto: $("#kA").value, mensagem: $("#kM").value.trim(), em: Date.now(), status: "novo", origem: "manual" }); dlg.close(); toast("Contato salvo"); reAdmin(); }; };
}

/* =====================================================================
   NEWSLETTER
   ===================================================================== */
const BLOCOS = {
  cabecalho: { nome: "Cabeçalho com logo", props: { fundo: "#0C4F7F" } },
  titulo: { nome: "Título", props: { texto: "Título", alinhar: "left" } },
  texto: { nome: "Texto", props: { texto: "Escreva aqui. Use {{nome}}, {{empresa}} e {{marca}}." } },
  imagem: { nome: "Imagem", props: { url: "", alt: "", link: "" } },
  botao: { nome: "Botão", props: { texto: "Abrir meu portal", link: "{{portal}}", cor: "#0C4F7F" } },
  status: { nome: "Status do projeto", props: { titulo: "Como está o seu projeto" } },
  cobranca: { nome: "Cobranças em aberto", props: { titulo: "Pagamentos disponíveis" } },
  produtos: { nome: "Produtos para recomprar", props: { titulo: "Peça de novo com um clique" } },
  promo: { nome: "Ação promocional", props: { selo: "Promoção", titulo: "1.000 cartões de visita", texto: "Couché 300 g, laminação fosca.", preco: "149,00", precoAntigo: "189,00", cupom: "UPE10", validade: "até 31/10", botao: "Quero aproveitar", link: "{{portal}}" } },
  divisor: { nome: "Divisor", props: {} },
  rodape: { nome: "Rodapé", props: { texto: "Upe Criativo · Branding, Redesign, Mídias e Papelaria gráfica\nupecriativo@gmail.com · Para não receber mais, responda “sair”." } }
};
const B = (tipo, over = {}) => ({ id: uid(6), tipo, props: { ...clone(BLOCOS[tipo].props), ...over } });
function TEMPLATES() {
  return [
    { id: "status-projeto", nome: "Status do projeto", assunto: "{{nome}}, veja como está o seu projeto", blocos: [B("cabecalho"), B("titulo", { texto: "Olá, {{nome}}!" }), B("texto", { texto: "Passando para atualizar o andamento da {{marca}}. Confira abaixo o que está pronto e o que espera por você." }), B("status"), B("botao"), B("rodape")] },
    { id: "aprovacao", nome: "Aprovação pendente", assunto: "Tem conteúdo esperando a sua aprovação", blocos: [B("cabecalho"), B("titulo", { texto: "Seus posts e artes estão prontos" }), B("texto", { texto: "{{nome}}, para manter o calendário em dia, aprove ou peça ajustes pelo portal. Leva só alguns minutos." }), B("status", { titulo: "Aguardando você" }), B("botao", { texto: "Aprovar agora" }), B("rodape")] },
    { id: "cobranca", nome: "Cobrança liberada", assunto: "Sua cobrança da Upe está disponível", blocos: [B("cabecalho"), B("titulo", { texto: "Pagamento disponível" }), B("cobranca"), B("texto", { texto: "Pague por PIX ou cartão direto no portal. Depois de pagar, toque em “Já paguei”." }), B("botao", { texto: "Pagar no portal" }), B("rodape")] },
    { id: "promo-grafica", nome: "Promoção de materiais gráficos", assunto: "Condição especial para os seus impressos", blocos: [B("cabecalho"), B("titulo", { texto: "Hora de repor os seus impressos" }), B("promo"), B("produtos"), B("botao", { texto: "Ver meus produtos" }), B("rodape")] },
    { id: "newsletter-mensal", nome: "Newsletter mensal", assunto: "Novidades da Upe Criativo", blocos: [B("cabecalho"), B("titulo", { texto: "Novidades do mês" }), B("texto", { texto: "Conte aqui uma novidade, um case novo ou uma dica de marca." }), B("imagem"), B("texto", { texto: "Um segundo assunto, com um convite claro." }), B("botao", { texto: "Falar com a Upe", link: "https://wa.me/" + (CFG.whatsappUpe || "") }), B("rodape")] }
  ];
}
function mergeData(r) {
  const doc = r?.doc || {}, acoes = r?.acoes || [];
  const p = r ? pendencias(doc, acoes) : { posts: [], artes: [], cobs: [] };
  return { nome: (r?.doc?.nome || r?.nome || "cliente").split(" ")[0], empresa: doc.empresa || "", marca: doc.marca || doc.empresa || "sua marca", portal: portalUrl(), p, doc, acoes };
}
const tagsIn = (s, d) => String(s || "").replace(/\{\{(\w+)\}\}/g, (_, k) => d[k] ?? "");
function emailHTML(tpl, d) {
  const E = s => esc(tagsIn(s, d)), logoSrc = new URL((CFG.siteUrl || "../") + "assets/img/upe-logo-creme.png", location.href).href;
  const row = inner => `<tr><td style="padding:0 32px">${inner}</td></tr>`;
  const list = items => items.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items.map(([a, b]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #E6E3D6;font:400 15px Arial,sans-serif;color:#172431">${a}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #E6E3D6;font:700 14px Arial,sans-serif;color:#0C4F7F;white-space:nowrap">${b}</td></tr>`).join("")}</table>` : `<p style="font:400 15px Arial,sans-serif;color:#56636F;margin:0">Nada pendente por aqui. Tudo em dia!</p>`;
  const h3 = t => `<h3 style="font:900 18px Arial,sans-serif;color:#172431;margin:24px 0 8px">${E(t)}</h3>`;
  const body = tpl.blocos.map(b => { const P = b.props; switch (b.tipo) {
    case "cabecalho": return `<tr><td style="background:${esc(P.fundo)};padding:26px 32px"><img src="${esc(logoSrc)}" alt="Upe Criativo" width="180" style="display:block;width:180px;height:auto;border:0"></td></tr>`;
    case "titulo": return row(`<h1 style="font:900 28px/1.15 Arial,sans-serif;color:#0C4F7F;margin:28px 0 8px;text-align:${esc(P.alinhar)}">${E(P.texto)}</h1>`);
    case "texto": return row(`<p style="font:400 16px/1.55 Arial,sans-serif;color:#172431;margin:12px 0">${E(P.texto).replace(/\n/g, "<br>")}</p>`);
    case "imagem": return P.url ? row(`${P.link ? `<a href="${E(P.link)}">` : ""}<img src="${E(P.url)}" alt="${E(P.alt)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:10px;margin:12px 0">${P.link ? "</a>" : ""}`) : row(`<div style="background:#ECEADF;border-radius:10px;padding:40px;text-align:center;font:700 13px Arial,sans-serif;color:#56636F;margin:12px 0">Imagem</div>`);
    case "botao": return row(`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="background:${esc(P.cor)};border-radius:999px"><a href="${E(P.link)}" style="display:inline-block;padding:14px 26px;font:900 15px Arial,sans-serif;color:#F2F0E1;text-decoration:none">${E(P.texto)}</a></td></tr></table>`);
    case "status": { const items = [...d.p.posts.map(x => [`Post: ${esc(x.titulo)}`, "Aguardando aprovação"]), ...d.p.artes.map(x => [`Arte: ${esc(x.produto)}`, "Aguardando aprovação"]), ...(d.doc.incluso || []).map(i => [esc(i.item), i.feito ? "Feito ✓" : "Em andamento"])];
      return row(h3(P.titulo) + list(items)); }
    case "cobranca": return row(h3(P.titulo) + list(d.p.cobs.map(c => [`${esc(c.descricao)}<br><span style="color:#56636F;font-size:13px">Vence ${fdate(c.vencimento)}</span>`, brl(c.valor)])));
    case "produtos": { const items = (d.doc.graficos || []).filter(g => g.recompra).map(g => [`${esc(g.produto)}<br><span style="color:#56636F;font-size:13px">${esc(g.specs)}</span>`, brl(g.precoRecompra || g.valor)]);
      return items.length || !d.doc.nome ? row(h3(P.titulo) + list(items)) : ""; }
    case "promo": return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0C4F7F;border-radius:14px;margin:16px 0"><tr><td style="padding:24px">
      <span style="display:inline-block;background:#F2C14E;color:#3A2A00;font:900 11px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:999px">${E(P.selo)}</span>
      <h2 style="font:900 24px Arial,sans-serif;color:#F2F0E1;margin:12px 0 6px">${E(P.titulo)}</h2><p style="font:400 15px Arial,sans-serif;color:#DCE3EC;margin:0 0 12px">${E(P.texto)}</p>
      <p style="margin:0 0 12px;font:900 28px Arial,sans-serif;color:#F2F0E1">R$ ${E(P.preco)} ${P.precoAntigo ? `<s style="font:400 16px Arial,sans-serif;color:#A9BBD0">R$ ${E(P.precoAntigo)}</s>` : ""}</p>
      ${P.cupom ? `<p style="margin:0 0 14px;font:400 14px Arial,sans-serif;color:#F2F0E1">Cupom <b style="border:1.5px dashed #F2F0E1;padding:3px 8px;border-radius:6px">${E(P.cupom)}</b> ${E(P.validade)}</p>` : ""}
      <a href="${E(P.link)}" style="display:inline-block;background:#F2F0E1;color:#0C4F7F;padding:12px 22px;border-radius:999px;font:900 14px Arial,sans-serif;text-decoration:none">${E(P.botao)}</a></td></tr></table>`);
    case "divisor": return row(`<hr style="border:0;border-top:1px solid #E6E3D6;margin:20px 0">`);
    case "rodape": return `<tr><td style="padding:26px 32px;background:#F2F0E1;font:400 12px/1.6 Arial,sans-serif;color:#56636F">${E(P.texto).replace(/\n/g, "<br>")}</td></tr>`;
    default: return ""; } }).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(tpl.assunto)}</title></head><body style="margin:0;background:#ECEADF"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECEADF;padding:24px 12px"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden">${body}<tr><td style="height:8px"></td></tr></table></td></tr></table></body></html>`;
}
async function aNewsletter(w) {
  let tpls = await S.list("templates");
  if (!tpls.length && !ls.get("upe-tpl-ok")) { for (const t of TEMPLATES()) await S.set(`templates/${t.id}`, t); ls.set("upe-tpl-ok", "1"); tpls = await S.list("templates"); } // primeiro acesso: modelos prontos
  const envios = (await S.list("envios")).sort((a, b) => b.em - a.em);
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">E-mail marketing</span><h1>Newsletter</h1><p class="muted small">Modelos editáveis por blocos, com os dados de cada cliente: nome, status do projeto, cobranças e produtos.</p></div><button class="btn" id="tNew">Novo modelo</button></div>
    <div class="g3">${tpls.map(t => `<a class="card grid" href="#/admin/newsletter/${esc(t.id)}" style="text-decoration:none;color:inherit"><span class="eb">${(t.blocos || []).length} blocos</span><h3>${esc(t.nome)}</h3><p class="muted small">${esc(t.assunto)}</p></a>`).join("")}</div>
    <section class="card grid"><h3>Envios</h3>${envios.length ? `<div class="tbl"><table><thead><tr><th>Data</th><th>Modelo</th><th>Destinatários</th><th>Como</th></tr></thead><tbody>${envios.map(e => `<tr><td class="num">${fdt(e.em)}</td><td>${esc(e.modelo)}</td><td class="num">${e.total}</td><td>${esc(e.via)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nenhum envio ainda.</p>`}</section>`;
  $("#tNew").onclick = async () => { const t = { id: uid(10), nome: "Novo modelo", assunto: "Assunto do e-mail", blocos: [B("cabecalho"), B("titulo"), B("texto"), B("botao"), B("rodape")] }; await S.set(`templates/${t.id}`, t); go(`#/admin/newsletter/${t.id}`); };
}
async function aNewsEditor(w, tid) {
  const tpl = await S.get(`templates/${tid}`); if (!tpl) return go("#/admin/newsletter");
  const clients = state.cache.clients, contatos = state.cache.contatos;
  let sel = null, prevId = clients[0]?.id || "";
  const FIELD = { texto: "Texto", titulo: "Título", url: "Link da imagem", alt: "Texto alternativo", link: "Link", cor: "Cor", fundo: "Cor de fundo", selo: "Selo", preco: "Preço (R$)", precoAntigo: "Preço antigo (R$)", cupom: "Cupom", validade: "Validade", botao: "Texto do botão", alinhar: "Alinhamento" };
  const AUD = [["todos", "Todos os clientes"], ["midias", "Plano Mídias digitais"], ["grafica", "Plano Papelaria gráfica"], ["branding", "Plano Branding"], ["pendencias", "Com aprovações pendentes"], ["cobranca", "Com cobrança em aberto"], ["recompra", "Com produtos para recompra"], ["contatos", "Contatos do site (não clientes)"]];
  let aud = "todos";
  const recipients = () => {
    if (aud === "contatos") return contatos.filter(c => c.status !== "convertido" && /@/.test(c.contato)).map(c => ({ email: c.contato.trim(), nome: c.nome, r: null }));
    return clients.filter(c => c.doc.ativo !== false && c.priv.email).filter(c => { const p = pendencias(c.doc, c.acoes);
      return aud === "todos" || (aud === "pendencias" ? p.posts.length + p.artes.length > 0 : aud === "cobranca" ? p.cobs.length > 0 : aud === "recompra" ? (c.doc.graficos || []).some(g => g.recompra) : c.doc.plano?.[aud]); })
      .map(c => ({ email: c.priv.email, nome: c.doc.nome, r: c }));
  };
  const draw = () => {
    w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><a class="small" href="#/admin/newsletter">← Newsletter</a><h1>${esc(tpl.nome)}</h1></div><div class="row"><button class="btn sec" id="tDel">Excluir modelo</button><button class="btn" id="tSave">Salvar modelo</button></div></div>
      <div class="nl"><div class="grid">
        <section class="card grid"><div class="g2"><label class="f" for="tN">Nome do modelo<input id="tN" value="${esc(tpl.nome)}"></label><label class="f" for="tA">Assunto do e-mail<input id="tA" value="${esc(tpl.assunto)}"></label></div><p class="muted small">Variáveis: {{nome}} {{empresa}} {{marca}} {{portal}}</p></section>
        <section class="grid" style="gap:8px">${tpl.blocos.map((b, k) => `<div class="blk ${sel === b.id ? "sel" : ""}"><div class="bh" data-bs="${b.id}"><b>${esc(BLOCOS[b.tipo]?.nome || b.tipo)}</b><button data-up="${k}" aria-label="Subir">↑</button><button data-dn="${k}" aria-label="Descer">↓</button><button data-dup="${k}" aria-label="Duplicar">⧉</button><button data-rm="${k}" aria-label="Remover">×</button></div>
          ${sel === b.id ? `<div class="bb">${Object.keys(b.props).length ? Object.entries(b.props).map(([pk, pv]) => pk === "alinhar" ? `<label class="f">${FIELD[pk]}<select data-pk="${pk}"><option value="left" ${pv === "left" ? "selected" : ""}>Esquerda</option><option value="center" ${pv === "center" ? "selected" : ""}>Centro</option></select></label>` : (pk === "cor" || pk === "fundo") ? `<label class="f">${FIELD[pk]}<input type="color" data-pk="${pk}" value="${esc(pv)}"></label>` : (pk === "texto" && ["texto", "rodape", "promo"].includes(b.tipo)) ? `<label class="f">${FIELD[pk]}<textarea data-pk="${pk}" rows="3">${esc(pv)}</textarea></label>` : `<label class="f">${FIELD[pk] || pk}<input data-pk="${pk}" value="${esc(pv)}"></label>`).join("") : `<p class="muted small">${b.tipo === "divisor" ? "Linha separadora." : "Este bloco é preenchido com os dados de cada cliente."}</p>`}</div>` : ""}</div>`).join("")}</section>
        <section class="card grid"><span class="eb">Adicionar bloco</span><div class="row">${Object.entries(BLOCOS).map(([k, v]) => `<button class="chip" data-add="${k}">+ ${v.nome}</button>`).join("")}</div></section>
        <section class="card grid"><h3>Enviar</h3>
          <label class="f" for="aud">Para quem<select id="aud">${AUD.map(([k, l]) => `<option value="${k}" ${aud === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <p class="small"><b class="num" id="rc"></b> <span class="muted">destinatário(s) com e-mail</span></p>
          <div class="row"><button class="btn" id="sQ">Enviar</button><button class="btn sec" id="sB">Abrir no meu e-mail (Cco)</button><button class="btn sec" id="sC">Copiar HTML</button><button class="btn sec" id="sD">Baixar HTML</button></div>
          <p class="muted small">${S.mode === "firebase" ? "“Enviar” coloca um e-mail personalizado por destinatário na fila do Firebase (extensão Trigger Email). Veja o README." : "No modo demonstração, “Enviar” só registra o envio, sem mandar e-mails."}</p></section>
      </div>
      <div class="preview"><div class="spread" style="margin-bottom:10px"><b class="small">Pré-visualização</b><select id="pv" aria-label="Ver com os dados de" style="max-width:260px">${clients.map(c => `<option value="${c.id}" ${prevId === c.id ? "selected" : ""}>${esc(c.doc.marca || c.doc.nome)}</option>`).join("")}<option value="" ${!prevId ? "selected" : ""}>Sem cliente</option></select></div><iframe id="pf" title="Pré-visualização do e-mail"></iframe></div></div>`;
    const render = () => { const r = clients.find(c => c.id === prevId) || null; $("#pf").srcdoc = emailHTML(tpl, mergeData(r)); $("#rc").textContent = recipients().length; };
    render();
    $("#tN").oninput = e => tpl.nome = e.target.value; $("#tA").oninput = e => { tpl.assunto = e.target.value; };
    $$("[data-bs]", w).forEach(h => h.onclick = e => { if (e.target.closest("button")) return; sel = sel === h.dataset.bs ? null : h.dataset.bs; draw(); });
    const mv = (k, d) => { const a = tpl.blocos, j = k + d; if (j < 0 || j >= a.length) return; [a[k], a[j]] = [a[j], a[k]]; draw(); };
    $$("[data-up]", w).forEach(b => b.onclick = () => mv(+b.dataset.up, -1)); $$("[data-dn]", w).forEach(b => b.onclick = () => mv(+b.dataset.dn, 1));
    $$("[data-rm]", w).forEach(b => b.onclick = () => { tpl.blocos.splice(+b.dataset.rm, 1); draw(); });
    $$("[data-dup]", w).forEach(b => b.onclick = () => { const k = +b.dataset.dup; tpl.blocos.splice(k + 1, 0, { ...clone(tpl.blocos[k]), id: uid(6) }); draw(); });
    $$("[data-add]", w).forEach(b => b.onclick = () => { const nb = B(b.dataset.add); tpl.blocos.splice(Math.max(tpl.blocos.length - 1, 0), 0, nb); sel = nb.id; draw(); });
    $$("[data-pk]", w).forEach(i => i.oninput = () => { const b = tpl.blocos.find(x => x.id === sel); b.props[i.dataset.pk] = i.value; clearTimeout(w._r); w._r = setTimeout(render, 200); });
    $("#pv").onchange = e => { prevId = e.target.value; render(); };
    $("#aud").onchange = e => { aud = e.target.value; render(); };
    $("#tSave").onclick = async () => { await S.set(`templates/${tpl.id}`, tpl); toast("Modelo salvo"); };
    $("#tDel").onclick = async () => { await S.del(`templates/${tpl.id}`); toast("Modelo excluído"); go("#/admin/newsletter"); };
    $("#sC").onclick = () => copy(emailHTML(tpl, mergeData(clients.find(c => c.id === prevId) || null)), "HTML copiado");
    $("#sD").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([emailHTML(tpl, mergeData(clients.find(c => c.id === prevId) || null))], { type: "text/html" })); a.download = `${tpl.id}.html`; a.click(); };
    $("#sB").onclick = () => { const rs = recipients(); if (!rs.length) return toast("Nenhum destinatário com e-mail"); location.href = `mailto:?bcc=${encodeURIComponent(rs.map(r => r.email).join(","))}&subject=${encodeURIComponent(tagsIn(tpl.assunto, mergeData(null)))}`; };
    $("#sQ").onclick = () => { const rs = recipients(); if (!rs.length) return toast("Nenhum destinatário com e-mail");
      modal("Enviar newsletter?", `<p>“${esc(tpl.assunto)}” para <b>${rs.length}</b> destinatário(s). Cada pessoa recebe a versão com os próprios dados.</p><div class="legenda small">${rs.map(r => esc(r.email)).join(", ")}</div>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="sGo">Enviar agora</button>`);
      $("#sGo").onclick = async () => {
        await S.set(`templates/${tpl.id}`, tpl);
        if (S.mode === "firebase") for (const r of rs) { const d = mergeData(r.r || { nome: r.nome }); await S.add("mail", { to: r.email, message: { subject: tagsIn(tpl.assunto, d), html: emailHTML(tpl, d) } }); }
        await S.add("envios", { modelo: tpl.nome, total: rs.length, via: S.mode === "firebase" ? "Fila do Firebase" : "Demonstração (não enviado)", em: Date.now() });
        dlg.close(); toast(S.mode === "firebase" ? "E-mails na fila de envio" : "Envio registrado (demonstração)");
      }; };
  };
  draw();
}

/* ---------- configurações ---------- */
async function aConfig(w) {
  const cfg = await Api.config();
  w.innerHTML = `<div class="grid" style="gap:4px"><span class="eb">Painel Upe</span><h1>Configurações</h1></div>
    <div class="g2">
      <section class="card grid"><h3>Recebimento por PIX</h3><p class="muted small">Usado para gerar o QR Code e o copia e cola de cada cobrança, com o valor certo.</p>
        <label class="f" for="kC">Chave PIX<input id="kC" value="${esc(cfg.pixChave || "")}" placeholder="e-mail, telefone (+55…), CPF/CNPJ ou chave aleatória"></label>
        <div class="g2"><label class="f" for="kN">Nome do recebedor (até 25 letras)<input id="kN" maxlength="25" value="${esc(cfg.pixNome || "")}"></label><label class="f" for="kCi">Cidade (até 15 letras)<input id="kCi" maxlength="15" value="${esc(cfg.pixCidade || "")}"></label></div>
        <button class="btn sec sm" id="kT" style="justify-self:start">Testar QR de R$ 1,00</button></section>
      <section class="card grid"><h3>Cartão e contato</h3>
        <label class="f" for="kL">Link de pagamento padrão (cartão)<input id="kL" value="${esc(cfg.linkCartao || "")}" placeholder="Mercado Pago, InfinitePay, PagSeguro, Stripe…"></label>
        <p class="muted small">Cada cobrança pode ter o próprio link. O portal nunca pede número de cartão.</p>
        <label class="f" for="kW">WhatsApp da Upe (para o cliente falar com você)<input id="kW" value="${esc(cfg.whatsapp || CFG.whatsappUpe || "")}"></label></section>
    </div>
    <div class="row" style="justify-content:flex-end"><button class="btn" id="kS">Salvar configurações</button></div>
    <section class="card grid"><h3>Dados e conexão</h3>
      <p>${S.mode === "firebase" ? `Conectado ao Firebase, projeto <b>${esc(CFG.firebase.projectId)}</b>.` : "Modo demonstração: os dados ficam só neste navegador. Para usar com clientes de verdade, configure o Firebase em <code>portal/config.js</code> (passo a passo no README)."}</p>
      ${S.mode === "demo" ? `<div><button class="btn bad sm" id="kR">Apagar dados de demonstração</button></div>` : ""}</section>`;
  const read = () => ({ pixChave: $("#kC").value.trim(), pixNome: $("#kN").value.trim(), pixCidade: $("#kCi").value.trim(), linkCartao: $("#kL").value.trim(), whatsapp: $("#kW").value.replace(/\D/g, "") });
  $("#kS").onclick = async () => { await S.set("config/publico", read()); toast("Configurações salvas"); };
  $("#kT").onclick = () => { const c = read(); if (!c.pixChave) return toast("Informe a chave PIX"); const pl = pixPayload({ chave: c.pixChave, nome: c.pixNome, cidade: c.pixCidade, valor: 1, txid: "TESTEUPE" });
    modal("Teste de PIX (R$ 1,00)", `<div style="text-align:center"><div class="qrbox" id="qr"></div></div><div class="cc">${esc(pl)}</div><p class="muted small">Leia com o app do banco e confira o nome do recebedor antes de pagar.</p>`); try { new QRCode($("#qr"), { text: pl, width: 200, height: 200 }); } catch (e) {} };
  if ($("#kR")) $("#kR").onclick = () => S.reset();
}

/* ===== Agenda, reuniões, cronograma, kits e notificações (incluído dentro do app.js) ===== */

/* ---------- datas e convites ---------- */
const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const todayIso = () => isoDay(new Date());
const addDays = (iso, n) => { const d = new Date(iso + "T12:00"); d.setDate(d.getDate() + n); return isoDay(d); };
const daysTo = iso => Math.round((new Date(iso + "T12:00") - new Date(todayIso() + "T12:00")) / 864e5);
const quando = iso => { const n = daysTo(iso); return n === 0 ? "hoje" : n === 1 ? "amanhã" : n === -1 ? "ontem" : n < 0 ? `há ${-n} dias` : `em ${n} dias`; };
const FMT_LBL = { feed: "Feed", carrossel: "Carrossel", reels: "Reels", story: "Story", youtube: "YouTube", shorts: "Shorts", imagem: "Imagem", video: "Vídeo", legenda: "Legenda", audio: "Áudio" };
function gcal(ev) {
  const s = (ev.data + "T" + (ev.hora || "09:00")).replace(/[-:]/g, "") + "00", end = new Date(new Date(`${ev.data}T${ev.hora || "09:00"}`).getTime() + (ev.duracao || 60) * 6e4);
  const e = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.titulo)}&dates=${s}/${e}&details=${encodeURIComponent(ev.notas || "")}&location=${encodeURIComponent(ev.link || ev.local || "")}`;
}
function ics(ev) {
  const dt = (d, h) => (d + "T" + h).replace(/[-:]/g, "") + "00", end = new Date(new Date(`${ev.data}T${ev.hora || "09:00"}`).getTime() + (ev.duracao || 60) * 6e4);
  const e = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
  const t = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Upe Criativo//Portal//PT", "BEGIN:VEVENT", `UID:${ev.id}@upe`, `DTSTART:${dt(ev.data, ev.hora || "09:00")}`, `DTEND:${e}`, `SUMMARY:${ev.titulo}`, `DESCRIPTION:${(ev.notas || "").replace(/\n/g, "\\n")}`, `LOCATION:${ev.link || ev.local || ""}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(t);
}
const conviteTxt = ev => `Olá${ev.nome ? ", " + ev.nome.split(" ")[0] : ""}! Reunião com a Upe Criativo:\n\n${ev.titulo}\n${DOW[new Date(ev.data + "T12:00").getDay()]}, ${fdate(ev.data)} às ${ev.hora}${ev.duracao ? ` (${ev.duracao} min)` : ""}\n${ev.link ? "Link: " + ev.link : ev.local ? "Local: " + ev.local : ""}\n\nAdicionar à agenda: ${gcal(ev)}`;

/* ---------- arquivos que faltam (kits sem a pasta de mídias) ---------- */
document.addEventListener("error", e => {
  const t = e.target; if (!(t instanceof HTMLImageElement || t instanceof HTMLVideoElement) || t.dataset.miss) return;
  if (!t.closest("#app, dialog")) return; t.dataset.miss = "1";
  const nome = decodeURIComponent((t.getAttribute("src") || "").split("#")[0].split("/").slice(-2).join("/"));
  if (t instanceof HTMLVideoElement) { // pode ser só o navegador sem o formato do vídeo: mantém o player e oferece o arquivo
    const n = document.createElement("div"); n.className = "vnote"; n.innerHTML = t.closest("[data-nodl]") ? "Se o vídeo não tocar aqui, tente outro navegador. O download libera depois da aprovação." : `Se o vídeo não tocar aqui, <a href="${esc(t.getAttribute("src") || "")}" target="_blank" rel="noopener" download>abra ou baixe o arquivo</a>.`; t.after(n); return; }
  const d = document.createElement("div"); d.className = "miss"; d.textContent = "Arquivo não encontrado · " + nome;
  t.replaceWith(d);
}, true);
const dlBtn = (url, label = "Baixar") => resolveMedia(url) ? `<a class="btn sec sm" href="${esc(resolveMedia(url))}" download="${esc(fileName(url))}" target="_blank" rel="noopener">${label}</a>` : "";
const imgTag = u => `<img src="${esc(resolveMedia(u))}" alt="" loading="lazy">`;
const capaDe = x => x.capa || ((x.midias || []).find(u => kind(u) === "img") || "");
const fileName = u => decodeURIComponent(String(u || "").split("?")[0].split("/").pop() || "arquivo");

/* ---------- tags acima da prévia (repost, aprovado, reprovado, nova versão) ---------- */
const TAGS_ST = { aprovado: ["Aprovado", "ok"], publicado: ["Publicado", "info"], ajustes: ["Reprovado · ajuste", "bad"], reprovado: ["Reprovado", "bad"] };
const ehRepost = x => !!(x && (x.repost || x.repostDe || /^repost\b/i.test(x.titulo || "")));
function tagsHTML(st, x = {}, sempre = false) {
  const t = [];
  if (ehRepost(x)) t.push(`<span class="tagx rp">Repost</span>`);
  const m = TAGS_ST[st]; if (m) t.push(`<span class="tagx ${m[1]}">${m[0]}</span>`);
  if (st === "pendente" && (x.versao || 1) > 1) t.push(`<span class="tagx warn">Nova versão · v${x.versao}</span>`);
  if (x.historia) t.push(`<span class="tagx">História</span>`);
  return t.length || sempre ? `<span class="tagbar">${t.join("")}</span>` : "";
}
// repost: o card mostra de novo a peça original (mídias, capa e legenda) com a tag
function comRepost(x, lista) {
  if (!x || !x.repostDe) return x;
  const o = (lista || []).find(y => y.id === x.repostDe); if (!o) return x;
  return { ...x, midias: (x.midias || []).length ? x.midias : o.midias || [], capa: x.capa || o.capa || "", legenda: x.legenda || o.legenda || "", _orig: o };
}

/* ---------- calendário genérico ---------- */
const calState = {};
function calendar(el, key, events, onPick, opts = {}) {
  if (!calState[key]) { const nx = events.filter(e => e.data >= todayIso()).sort((a, b) => a.data.localeCompare(b.data))[0]; const d = new Date((nx ? nx.data : todayIso()) + "T12:00"); calState[key] = [d.getFullYear(), d.getMonth()]; }
  const draw = () => {
    const [Y, M] = calState[key], first = new Date(Y, M, 1), start = new Date(Y, M, 1 - first.getDay()), today = todayIso(), pre = `${Y}-${pad(M + 1)}`;
    let cells = ""; for (let k = 0; k < 42; k++) { const d = new Date(start); d.setDate(start.getDate() + k); const iso = isoDay(d);
      const evs = events.filter(e => e.data === iso).sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
      cells += `<div class="day ${d.getMonth() !== M ? "out" : ""} ${iso === today ? "today" : ""}"><span class="d">${d.getDate()}</span>${evs.slice(0, 4).map(e => `<button class="ev ${e.cls || ""}" data-ev="${esc(e.id)}" title="${esc(e.titulo)}">${e.hora ? e.hora + " " : ""}${esc(e.tag ? e.tag + " · " : "")}${esc(e.titulo)}</button>`).join("")}${evs.length > 4 ? `<button class="ev more" data-day="${iso}">+${evs.length - 4}</button>` : ""}</div>`; }
    const month = events.filter(e => e.data.startsWith(pre)).sort((a, b) => (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || "")));
    el.innerHTML = `<div class="spread"><div class="row"><button class="btn sec sm" data-m="-1" aria-label="Mês anterior">←</button><b style="min-width:150px;text-align:center;text-transform:capitalize">${MESES[M]} ${Y}</b><button class="btn sec sm" data-m="1" aria-label="Próximo mês">→</button><button class="btn sec sm" data-m="0">Hoje</button></div>${opts.legend || ""}</div>
      <div class="card pad0"><div class="cal">${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => `<div class="dow">${d}</div>`).join("")}${cells}</div></div>
      <div class="agenda">${month.length ? month.map(e => { const d = new Date(e.data + "T12:00"); return `<button class="agi" data-ev="${esc(e.id)}"><span class="dt">${pad(d.getDate())}/${pad(d.getMonth() + 1)}<small>${DOW[d.getDay()].toLowerCase()}${e.hora ? " · " + e.hora : ""}</small></span><span style="min-width:0"><b>${esc(e.titulo)}</b><br><span class="muted small">${esc(e.sub || e.tag || "")}</span></span>${e.pill || ""}</button>`; }).join("") : `<div class="empty">Nada marcado neste mês.</div>`}</div>`;
    el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const n = +b.dataset.m; if (!n) { const d = new Date(); calState[key] = [d.getFullYear(), d.getMonth()]; } else { let [y, m] = calState[key]; m += n; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } calState[key] = [y, m]; } draw(); });
    el.querySelectorAll("[data-ev]").forEach(b => b.onclick = () => onPick(events.find(e => e.id === b.dataset.ev)));
    el.querySelectorAll("[data-day]").forEach(b => b.onclick = () => { const evs = events.filter(e => e.data === b.dataset.day); modal(fdate(b.dataset.day), `<div class="agenda">${evs.map(e => `<button class="agi" data-ev2="${esc(e.id)}"><span class="dt">${e.hora || ""}</span><span><b>${esc(e.titulo)}</b><br><span class="muted small">${esc(e.sub || e.tag || "")}</span></span>${e.pill || ""}</button>`).join("")}</div>`);
      dlg.querySelectorAll("[data-ev2]").forEach(x => x.onclick = () => { dlg.close(); onPick(events.find(e => e.id === x.dataset.ev2)); }); });
  };
  draw();
}

/* ---------- sininho ---------- */
function bell(host, key, items) {
  const seen = +(ls.get(`upe-bell-${key}`) || 0), dia = ls.get(`upe-bell-dia-${key}`) === todayIso();
  const isNew = n => n.prioridade || (n.lembrete ? !dia : n.em > seen), fresh = items.filter(isNew);
  host.innerHTML = `<div class="bellw"><button class="bellb" id="bellBtn" aria-label="Notificações${fresh.length ? `: ${fresh.length} novas` : ""}" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>${fresh.length ? `<span class="bellc">${fresh.length > 99 ? "99+" : fresh.length}</span>` : ""}</button>
    <div class="bellp hide" id="bellP" role="dialog" aria-label="Notificações"><div class="spread" style="padding:12px 14px;border-bottom:1px solid var(--line)"><b>Notificações</b><button class="lnk small" id="bellAll">Marcar como lidas</button></div>
    <div class="belll">${items.length ? items.map(n => `<a class="belli ${isNew(n) ? "new" : ""} ${n.prioridade ? "prio" : ""}" href="${esc(n.href || "#")}"><span class="bico ${n.cls || ""}"></span><span style="min-width:0">${n.prioridade ? '<span class="tagx bad">Prioridade</span><br>' : ""}<b>${esc(n.titulo)}</b>${n.sub ? `<br><span class="muted small">${esc(n.sub)}</span>` : ""}</span><span class="muted small num" style="white-space:nowrap">${n.lembrete ? "lembrete" : fdt(n.em)}</span></a>`).join("") : `<div class="empty" style="margin:14px">Tudo em dia.</div>`}</div></div></div>`;
  const btn = host.querySelector("#bellBtn"), p = host.querySelector("#bellP");
  const mark = () => { ls.set(`upe-bell-${key}`, String(Date.now())); ls.set(`upe-bell-dia-${key}`, todayIso()); };
  btn.onclick = e => { e.stopPropagation(); const open = p.classList.toggle("hide") === false; btn.setAttribute("aria-expanded", open); if (open) { mark(); btn.querySelector(".bellc")?.remove(); } };
  host.querySelector("#bellAll").onclick = () => { mark(); p.querySelectorAll(".new").forEach(x => x.classList.remove("new")); };
  p.querySelectorAll("a").forEach(a => a.onclick = () => p.classList.add("hide"));
  document.addEventListener("click", e => { if (!host.contains(e.target)) p.classList.add("hide"); });
}
function notifsCliente(doc, acoes) {
  const out = [], vis = it => it.status !== "rascunho" && it.status !== "orcamento", t = todayIso();
  const pend0 = (doc.posts || []).filter(vis).filter(p => statusOf(p, acoes).status === "pendente");
  // ajuste devolvido pela Upe: aviso próprio, com link direto para o post
  pend0.filter(p => (p.versao || 1) > 1).forEach(p => out.push({ em: p.statusEm || 0, titulo: `Ajuste pronto: nova versão de “${p.titulo}” para aprovar`, sub: `Versão ${p.versao} · ${fdate(p.data)}`, href: `#/c/conteudo/${p.id}`, cls: "warn" }));
  const pend = pend0.filter(p => (p.versao || 1) <= 1);
  if (pend.length === 1) out.push({ em: pend[0].statusEm || 0, titulo: `Post para aprovar: ${pend[0].titulo}`, sub: `${FMT_LBL[pend[0].tipo] || pend[0].tipo} · ${fdate(pend[0].data)}`, href: `#/c/conteudo/${pend[0].id}`, cls: "warn" });
  else if (pend.length) out.push({ em: Math.max(...pend.map(p => p.statusEm || 0)), titulo: `${pend.length} posts aguardando a sua aprovação`, sub: `O próximo é de ${fdate(pend.map(p => p.data).filter(Boolean).sort()[0])}`, href: "#/c/conteudo", cls: "warn" });
  (doc.graficos || []).filter(vis).forEach(g => { if (statusOf(g, acoes).status === "pendente") out.push({ em: g.statusEm || 0, titulo: (g.versao || 1) > 1 ? `Arte corrigida para aprovar: ${g.produto}` : `Arte para aprovar: ${g.produto}`, sub: (g.versao || 1) > 1 ? `Versão ${g.versao}` : "", href: "#/c/graficos", cls: "warn" }); });
  (doc.cobrancas || []).filter(c => c.liberada && cobStatus(c, acoes) === "aberta").forEach(c => { const n = daysTo(c.vencimento);
    out.push({ em: c.liberadaEm || 0, titulo: `Cobrança: ${c.descricao}`, sub: `${brl(c.valor)} · vence ${fdate(c.vencimento)}`, href: "#/c/pagamentos", cls: n < 0 ? "bad" : "info" });
    if (n <= 3) out.push({ lembrete: true, em: 0, titulo: n < 0 ? `Cobrança vencida: ${c.descricao}` : `Vencimento ${quando(c.vencimento)}: ${c.descricao}`, href: "#/c/pagamentos", cls: n < 0 ? "bad" : "warn" }); });
  thread(doc, acoes).filter(m => m.autor === "upe").slice(-5).forEach(m => out.push({ em: m.em, titulo: "Mensagem da Upe", sub: m.texto.slice(0, 80), href: "#/c/mensagens", cls: "info" }));
  adesoes(doc).filter(([, a]) => a.status === "teste" && a.fimTeste && daysTo(a.fimTeste) <= 3).forEach(([k, a]) => out.push({ lembrete: true, em: 0, titulo: `Seu teste do ${APPS_PADRAO[k]?.nome || k} termina ${quando(a.fimTeste)}`, href: "#/c/apps", cls: "info" }));
  (doc.reunioes || []).filter(r => r.data >= t && daysTo(r.data) <= 2).forEach(r => out.push({ lembrete: true, em: 0, titulo: `Reunião ${quando(r.data)} às ${r.hora}`, sub: r.titulo, href: "#/c/agenda", cls: "info" }));
  (doc.entregas || []).filter(e => e.status !== "entregue" && daysTo(e.data) <= 3).forEach(e => out.push({ lembrete: true, em: 0, titulo: `Entrega ${quando(e.data)}: ${e.titulo}`, href: "#/c/agenda", cls: daysTo(e.data) < 0 ? "bad" : "warn" }));
  return out.sort((a, b) => (!!b.lembrete - !!a.lembrete) || b.em - a.em);
}
function notifsAdmin({ clients, contatos, reunioes, crono }) {
  const out = [], t = todayIso(), nm = c => c.doc.marca || c.doc.nome;
  contatos.filter(c => (c.status || "novo") === "novo").forEach(c => out.push({ em: c.em || 0, titulo: `Novo contato: ${c.nome}`, sub: `${c.assunto || ""} · ${c.contato || ""}`, href: "#/admin/contatos", cls: "warn" }));
  // PRIORIDADE: pedidos de ajuste do cliente ainda sem nova versão
  const prio = new Set();
  clients.forEach(c => [...(c.doc.posts || []).map(x => [x, "conteudo"]), ...(c.doc.graficos || []).map(x => [x, "graficos"])].forEach(([x, aba]) => {
    const ef = statusOf(x, c.acoes); if (ef.status !== "ajustes" || ef.por !== "cliente") return; prio.add(x.id);
    out.push({ prioridade: true, em: ef.em, titulo: `${nm(c)} pediu ajuste: ${x.titulo || x.produto}`, sub: ef.texto ? `“${ef.texto.slice(0, 90)}”` : "", href: `#/admin/cliente/${c.id}/${aba}/${x.id}`, cls: "bad" });
  }));
  clients.forEach(c => c.acoes.slice(-30).forEach(a => {
    if (a.tipo === "ajuste" && prio.has(a.alvo)) return;
    const alvo = [...(c.doc.posts || []), ...(c.doc.graficos || [])].find(x => x.id === a.alvo);
    const map = { aprovar: ["aprovou", "ok", alvo?.produto ? "graficos" : "conteudo"], ajuste: ["pediu ajuste em", "bad", alvo?.produto ? "graficos" : "conteudo"], mensagem: ["enviou uma mensagem", "info", "mensagens"], pedido: ["pediu recompra", "warn", "graficos"], pagamento: ["informou um pagamento", "info", "pagamentos"] }[a.tipo];
    if (map) out.push({ em: a.em, titulo: `${nm(c)} ${map[0]}${alvo ? " " + (alvo.titulo || alvo.produto) : ""}`, sub: a.texto ? a.texto.slice(0, 80) : "", href: `#/admin/cliente/${c.id}/${map[2]}`, cls: map[1] });
  }));
  clients.forEach(c => { appPedidos(c.doc, c.acoes).filter(p => p.status === "novo").forEach(p => { const ap = appsCat(state.cache.pub)[p.app]; out.push({ em: p.em, titulo: `${nm(c)} pediu ${p.extra ? "um extra do" : ""} ${ap ? ap.nome : p.app}`.replace(/\s+/g, " "), sub: p.extra ? (ap?.extras.find(e => e.k === p.extra) || {}).nome || p.extra : "Contratar o app", href: `#/admin/cliente/${c.id}/apps`, cls: "warn" }); });
    adesoes(c.doc).filter(([, a]) => a.status === "teste" && a.fimTeste && daysTo(a.fimTeste) <= 3).forEach(([k, a]) => out.push({ lembrete: true, em: 0, titulo: `Teste do ${APPS_PADRAO[k]?.nome || k} termina ${quando(a.fimTeste)}: ${nm(c)}`, href: `#/admin/cliente/${c.id}/apps`, cls: "info" })); });
  reunioes.filter(r => r.data >= t && daysTo(r.data) <= 1 && r.status !== "cancelada").forEach(r => out.push({ lembrete: true, em: 0, titulo: `Reunião ${quando(r.data)} às ${r.hora}: ${r.titulo}`, sub: r.nome || "", href: "#/admin/calendario", cls: "info" }));
  const hoje = crono.filter(x => x.data === t && x.status !== "publicado");
  if (hoje.length) out.push({ lembrete: true, em: 0, titulo: `Publicar hoje: ${hoje.length} item(ns) do cronograma Upe`, sub: hoje.map(x => `${x.hora} ${FMT_LBL[x.formato] || x.formato}`).join(" · "), href: "#/admin/cronograma", cls: "warn" });
  clients.forEach(c => {
    (c.doc.cobrancas || []).filter(x => x.liberada && cobStatus(x, c.acoes) === "aberta" && daysTo(x.vencimento) <= 3).forEach(x => out.push({ lembrete: true, em: 0, titulo: `${daysTo(x.vencimento) < 0 ? "Vencida" : "Vence " + quando(x.vencimento)}: ${nm(c)}`, sub: `${x.descricao} · ${brl(x.valor)}`, href: `#/admin/cliente/${c.id}/pagamentos`, cls: daysTo(x.vencimento) < 0 ? "bad" : "warn" }));
    (c.doc.entregas || []).filter(e => e.status !== "entregue" && daysTo(e.data) <= 3).forEach(e => out.push({ lembrete: true, em: 0, titulo: `Entrega ${quando(e.data)}: ${e.titulo}`, sub: nm(c), href: `#/admin/cliente/${c.id}/projeto`, cls: daysTo(e.data) < 0 ? "bad" : "warn" }));
    (c.doc.posts || []).filter(p => p.status !== "rascunho" && daysTo(p.data) >= 0 && daysTo(p.data) <= 1 && statusOf(p, c.acoes).status === "pendente").forEach(p => out.push({ lembrete: true, em: 0, titulo: `Post de ${quando(p.data)} sem aprovação: ${nm(c)}`, sub: p.titulo, href: `#/admin/cliente/${c.id}/conteudo`, cls: "warn" }));
  });
  return out.sort((a, b) => (!!b.prioridade - !!a.prioridade) || (!!b.lembrete - !!a.lembrete) || b.em - a.em).slice(0, 60);
}

/* ---------- eventos do cliente (agenda) ---------- */
function eventosCliente(doc, acoes) {
  const ev = [];
  (doc.posts || []).filter(p => p.status !== "rascunho" && p.data).forEach(p => { const s = statusOf(p, acoes).status; ev.push({ id: "p:" + p.id, data: p.data, hora: p.hora || "", titulo: p.titulo, tag: FMT_LBL[p.tipo] || "Post", sub: "Postagem agendada", cls: evCls(s), pill: pill(s), k: "post", ref: p }); });
  (doc.entregas || []).forEach(e => ev.push({ id: "e:" + e.id, data: e.data, titulo: e.titulo, tag: "Entrega", sub: e.descricao || "Prazo de entrega", cls: e.status === "entregue" ? "ok" : daysTo(e.data) < 0 ? "bad" : "info", pill: pill(e.status === "entregue" ? "entregue" : "pendente").replace("Aguardando aprovação", "Em andamento"), k: "entrega", ref: e }));
  (doc.cobrancas || []).filter(c => c.liberada).forEach(c => { const s = cobStatus(c, acoes); ev.push({ id: "c:" + c.id, data: c.vencimento, titulo: `${c.descricao} · ${brl(c.valor)}`, tag: "Vencimento", sub: "Pagamento", cls: s === "paga" ? "ok" : daysTo(c.vencimento) < 0 ? "bad" : "warn", pill: pill(s), k: "cob", ref: c }); });
  (doc.reunioes || []).filter(r => r.status !== "cancelada").forEach(r => ev.push({ id: "r:" + r.id, data: r.data, hora: r.hora, titulo: r.titulo, tag: "Reunião", sub: r.link ? "Online" : r.local || "Reunião", cls: "info", pill: '<span class="pill info">Reunião</span>', k: "reuniao", ref: r }));
  eventosApps(doc, appsCat(state.cfg)).forEach(e => ev.push({ ...e, k: "app" }));
  return ev;
}
function reuniaoView(r, adminCtx) {
  modal(esc(r.titulo), `<div class="row"><span class="pill info">Reunião</span><span class="muted">${DOW[new Date(r.data + "T12:00").getDay()]}, ${fdate(r.data)} às ${esc(r.hora)}${r.duracao ? ` · ${r.duracao} min` : ""}</span></div>
    ${r.nome ? `<p><b>Com:</b> ${esc(r.nome)}</p>` : ""}${r.link ? `<p><b>Link:</b> <a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.link)}</a></p>` : ""}${r.local ? `<p><b>Local:</b> ${esc(r.local)}</p>` : ""}${r.notas ? `<div class="legenda">${esc(r.notas)}</div>` : ""}`,
    `<a class="btn sec" href="${esc(gcal(r))}" target="_blank" rel="noopener">Google Agenda</a><a class="btn sec" href="${ics(r)}" download="reuniao-upe.ics">Arquivo .ics</a>${adminCtx ? `<button class="btn" id="rEd">Editar</button>` : r.link ? `<a class="btn" href="${esc(r.link)}" target="_blank" rel="noopener">Entrar na reunião</a>` : ""}`);
  if (adminCtx) $("#rEd").onclick = () => reuniaoModal(r);
}

/* ---------- área do cliente: agenda e kits ---------- */
function cAgenda(m, c) {
  const ev = eventosCliente(c.doc, c.acoes);
  m.innerHTML = `<div class="grid" style="gap:6px"><span class="eb">Agenda</span><h1>Tudo o que está marcado</h1><p class="muted small">Postagens agendadas, prazos de entrega, vencimentos e reuniões.</p></div><div id="calA" class="grid"></div>`;
  calendar($("#calA"), "cli-" + c.id, ev, e => {
    if (e.k === "post") { const p = { ...comRepost(e.ref, c.doc.posts), ef: statusOf(e.ref, c.acoes) }; postModal(p, c); }
    else if (e.k === "cob") go("#/c/pagamentos");
    else if (e.k === "reuniao") reuniaoView(e.ref, false);
    else if (e.k === "app") go("#/c/apps");
    else modal(esc(e.ref.titulo), `<div class="row">${e.pill}<span class="muted">Prazo: ${fdate(e.ref.data)} (${quando(e.ref.data)})</span></div>${e.ref.descricao ? `<p>${esc(e.ref.descricao)}</p>` : ""}`);
  }, { legend: `<div class="row small"><span class="pill warn">Aguardando</span><span class="pill ok">Aprovado / pago</span><span class="pill info">Reunião / entrega</span><span class="pill bad">Atrasado</span></div>` });
}
function proximos(doc, acoes) { return eventosCliente(doc, acoes).filter(e => e.data >= todayIso() && e.cls !== "ok").sort((a, b) => (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || ""))).slice(0, 5); }
function cKit(m, c, kitId) {
  const k = (c.doc.kits || []).find(x => x.id === kitId), todos = c.doc.posts || [], posts = todos.filter(p => p.kitId === kitId && p.status !== "rascunho").map(p => ({ ...comRepost(p, todos), ef: statusOf(p, c.acoes) })).sort((a, b) => (a.data || "z").localeCompare(b.data || "z"));
  const lib = p => p.ef.status === "aprovado" || p.ef.status === "publicado";
  if (!k) { m.innerHTML = `<div class="empty">Kit não encontrado.</div>`; return; }
  m.innerHTML = `<div class="grid" style="gap:6px"><a class="small" href="#/c/conteudo">← Conteúdo</a><span class="eb">Kit de conteúdo</span><h1>${esc(k.nome)}</h1><p class="muted small">${posts.length} peças. Aprove cada peça para liberar o download dos arquivos.</p></div>
    <div class="g3">${posts.map(p => `<article class="card grid">${tagsHTML(p.ef.status, p, true)}<div class="thumb" ${lib(p) ? "" : "data-nodl"} style="aspect-ratio:${p.tipo === "reels" || p.tipo === "story" ? "9/16" : "4/5"}">${mediaHTML(p.capa && p.tipo === "reels" ? p.midias[0] : (p.midias || [])[0], p.tipo, "", !lib(p))}</div>
      <div class="spread"><b>${esc(p.titulo)}</b><span class="pill">${esc(FMT_LBL[p.tipo] || p.tipo)}</span></div><span class="muted small">${p.data ? fdate(p.data) : "Sem data"}${(p.midias || []).length > 1 ? ` · ${p.midias.length} arquivos` : ""}</span>
      ${p.legenda ? `<div class="legenda small" style="max-height:140px;overflow:auto">${esc(p.legenda)}</div>` : ""}
      <div class="row">${p.legenda ? `<button class="btn sec sm" data-cp="${p.id}">Copiar legenda</button>` : ""}${lib(p) ? (p.midias || []).map((u, i) => dlBtn(u, p.midias.length > 1 ? `Baixar ${i + 1}` : "Baixar arquivo")).join("") + (p.capa ? dlBtn(p.capa, "Baixar capa") : "") : `<button class="btn sm" data-ap="${p.id}">${p.ef.status === "ajustes" ? "Ver o ajuste" : "Ver e aprovar"}</button><span class="muted small">Download libera após aprovar</span>`}</div></article>`).join("")}</div>`;
  m.querySelectorAll("[data-cp]").forEach(b => b.onclick = () => copy(posts.find(p => p.id === b.dataset.cp).legenda, "Legenda copiada"));
  m.querySelectorAll("[data-ap]").forEach(b => b.onclick = () => postModal(posts.find(p => p.id === b.dataset.ap), c));
}

/* ---------- reuniões (admin) ---------- */
function reuniaoModal(r0 = {}, pre = {}) {
  const r = { id: uid(10), titulo: "Reunião", data: addDays(todayIso(), 1), hora: "10:00", duracao: 45, com: "cliente", clienteId: "", contatoId: "", nome: "", email: "", telefone: "", link: "", local: "", notas: "", status: "marcada", ...pre, ...r0 };
  const clients = state.cache.clients || [], contatos = state.cache.contatos || [];
  modal(r0.id ? "Editar reunião" : "Agendar reunião", `
    <div class="g3"><label class="f" for="mCom">Com quem<select id="mCom"><option value="cliente" ${r.com === "cliente" ? "selected" : ""}>Cliente</option><option value="lead" ${r.com === "lead" ? "selected" : ""}>Lead (contato do site)</option><option value="outro" ${r.com === "outro" ? "selected" : ""}>Outra pessoa</option></select></label>
    <label class="f" for="mCli" id="wCli">Cliente<select id="mCli"><option value="">Escolha…</option>${clients.map(c => `<option value="${c.id}" ${r.clienteId === c.id ? "selected" : ""}>${esc(c.doc.marca || c.doc.nome)}</option>`).join("")}</select></label>
    <label class="f" for="mLead" id="wLead">Lead<select id="mLead"><option value="">Escolha…</option>${contatos.map(c => `<option value="${c.id}" ${r.contatoId === c.id ? "selected" : ""}>${esc(c.nome)} · ${esc(c.assunto || "")}</option>`).join("")}</select></label>
    <label class="f" for="mNome" id="wNome">Nome<input id="mNome" value="${esc(r.nome)}"></label></div>
    <label class="f" for="mTit">Assunto<input id="mTit" value="${esc(r.titulo)}" placeholder="Apresentação do redesign, briefing, alinhamento do mês…"></label>
    <div class="g3"><label class="f" for="mData">Data<input id="mData" type="date" value="${esc(r.data)}"></label><label class="f" for="mHora">Hora<input id="mHora" type="time" value="${esc(r.hora)}"></label><label class="f" for="mDur">Duração (min)<input id="mDur" type="number" min="15" step="15" value="${esc(r.duracao)}"></label></div>
    <div class="g2"><label class="f" for="mLink">Link da reunião (Meet, Zoom, WhatsApp)<input id="mLink" value="${esc(r.link)}" placeholder="https://meet.google.com/…"></label><label class="f" for="mLocal">Ou local<input id="mLocal" value="${esc(r.local)}"></label></div>
    <label class="f" for="mNotas">Pauta e notas<textarea id="mNotas">${esc(r.notas)}</textarea></label>
    ${r0.id ? `<label class="f" for="mSt">Status<select id="mSt">${["marcada", "realizada", "cancelada"].map(s => `<option ${r.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>` : ""}`,
    `${r0.id ? `<button class="btn bad" id="mDel">Excluir</button>` : ""}<button class="btn sec" data-close>Cancelar</button><button class="btn" id="mOk">Salvar e enviar convite</button>`, true);
  const sync = () => { const v = $("#mCom").value; $("#wCli").style.display = v === "cliente" ? "" : "none"; $("#wLead").style.display = v === "lead" ? "" : "none"; $("#wNome").style.display = v === "outro" ? "" : "none"; };
  $("#mCom").onchange = sync; sync();
  $("#mOk").onclick = async () => {
    const com = $("#mCom").value, cli = clients.find(c => c.id === $("#mCli").value), lead = contatos.find(c => c.id === $("#mLead").value);
    if (com === "cliente" && !cli) return $("#mCli").focus(); if (com === "lead" && !lead) return $("#mLead").focus();
    const leadEmail = lead && /@/.test(lead.contato) ? lead.contato.trim() : "", leadTel = lead && !leadEmail ? lead.contato.replace(/\D/g, "") : "";
    const nr = { ...r, com, titulo: $("#mTit").value.trim() || "Reunião", data: $("#mData").value, hora: $("#mHora").value || "10:00", duracao: +$("#mDur").value || 45, link: $("#mLink").value.trim(), local: $("#mLocal").value.trim(), notas: $("#mNotas").value.trim(), status: $("#mSt")?.value || r.status,
      clienteId: cli?.id || "", contatoId: lead?.id || "", nome: cli ? cli.doc.nome : lead ? lead.nome : $("#mNome").value.trim(), email: cli ? cli.priv.email || "" : leadEmail, telefone: cli ? cli.priv.telefone || "" : leadTel && leadTel.length <= 11 ? "55" + leadTel : leadTel };
    await S.set(`reunioes/${nr.id}`, nr);
    // espelho para o cliente ver na agenda
    for (const c of clients) {
      const had = (c.doc.reunioes || []).some(x => x.id === nr.id), want = nr.clienteId === c.id && nr.status !== "cancelada";
      if (!had && !want) continue;
      const d = clone(c.doc); d.reunioes = (d.reunioes || []).filter(x => x.id !== nr.id);
      if (want) d.reunioes.push({ id: nr.id, titulo: nr.titulo, data: nr.data, hora: nr.hora, duracao: nr.duracao, link: nr.link, local: nr.local, notas: nr.notas, status: nr.status });
      await S.set(`clientes/${c.id}`, d);
    }
    convite(nr);
  };
  if ($("#mDel")) $("#mDel").onclick = async () => { await S.del(`reunioes/${r.id}`); for (const c of clients.filter(c => (c.doc.reunioes || []).some(x => x.id === r.id))) { const d = clone(c.doc); d.reunioes = d.reunioes.filter(x => x.id !== r.id); await S.set(`clientes/${c.id}`, d); } dlg.close(); toast("Reunião excluída"); reAdmin(); };
}
function convite(r) {
  const msg = conviteTxt(r);
  modal("Convite da reunião", `<p>Reunião salva${r.clienteId ? " e já aparece na agenda do cliente" : ""}. Envie o convite:</p><div class="legenda small">${esc(msg)}</div>`,
    `<button class="btn sec" id="cvCp">Copiar</button>${r.telefone ? `<a class="btn sec" href="${esc(waLink(r.telefone, msg))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}${r.email ? `<a class="btn sec" href="mailto:${esc(r.email)}?subject=${encodeURIComponent("Reunião com a Upe Criativo · " + fdate(r.data))}&body=${encodeURIComponent(msg)}">E-mail</a>` : ""}<a class="btn sec" href="${esc(gcal(r))}" target="_blank" rel="noopener">Google Agenda</a><button class="btn" id="cvOk">Concluir</button>`);
  $("#cvCp").onclick = () => copy(msg, "Convite copiado");
  $("#cvOk").onclick = () => { dlg.close(); reAdmin(); };
}

/* ---------- calendário do admin ---------- */
const CAT = { posts: "Posts de clientes", entregas: "Entregas", venc: "Vencimentos", apps: "Apps Extra", reunioes: "Reuniões", insta: "Cronograma Upe · Instagram", yt: "Cronograma Upe · YouTube" };
function aCalendario(w) {
  const { clients, reunioes, crono } = state.cache;
  let on; try { on = JSON.parse(ls.get("upe-calf") || "null"); } catch (e) {} on = on || Object.fromEntries(Object.keys(CAT).map(k => [k, true])); Object.keys(CAT).forEach(k => { if (!(k in on)) on[k] = true; });
  const ev = [];
  clients.forEach(c => { const nm = c.doc.marca || c.doc.nome;
    if (on.posts) (c.doc.posts || []).filter(p => p.data).forEach(p => { const s = statusOf(p, c.acoes).status; ev.push({ id: `p:${c.id}:${p.id}`, data: p.data, hora: p.hora || "", titulo: p.titulo, tag: nm, sub: `${nm} · ${FMT_LBL[p.tipo] || p.tipo}`, cls: evCls(s), pill: pill(s), go: `#/admin/cliente/${c.id}/conteudo` }); });
    if (on.entregas) (c.doc.entregas || []).forEach(e => ev.push({ id: `e:${c.id}:${e.id}`, data: e.data, titulo: e.titulo, tag: "Entrega", sub: nm, cls: e.status === "entregue" ? "ok" : daysTo(e.data) < 0 ? "bad" : "info", pill: e.status === "entregue" ? pill("entregue") : '<span class="pill warn">Prazo</span>', go: `#/admin/cliente/${c.id}/projeto` }));
    if (on.apps !== false) eventosApps(c.doc, appsCat(state.cache.pub), nm).forEach(e => ev.push({ ...e, id: e.id + ":" + c.id, titulo: `${nm} · ${e.titulo}`, go: `#/admin/cliente/${c.id}/apps` }));
    if (on.venc) (c.doc.cobrancas || []).filter(x => x.status !== "cancelado").forEach(x => { const s = cobStatus(x, c.acoes); ev.push({ id: `c:${c.id}:${x.id}`, data: x.vencimento, titulo: `${nm} · ${brl(x.valor)}`, tag: "Vence", sub: x.descricao + (x.liberada ? "" : " (oculta)"), cls: s === "paga" ? "ok" : daysTo(x.vencimento) < 0 ? "bad" : "warn", pill: pill(s), go: `#/admin/cliente/${c.id}/pagamentos` }); });
  });
  if (on.reunioes) reunioes.filter(r => r.status !== "cancelada").forEach(r => ev.push({ id: "r:" + r.id, data: r.data, hora: r.hora, titulo: r.titulo, tag: "Reunião", sub: `${r.com === "lead" ? "Lead" : r.com === "cliente" ? "Cliente" : ""}${r.nome ? " · " + r.nome : ""}`, cls: "info", pill: '<span class="pill info">Reunião</span>', r }));
  crono.filter(x => x.data && ((x.canal === "youtube" && on.yt) || (x.canal !== "youtube" && on.insta))).forEach(x => ev.push({ id: "u:" + x.id, data: x.data, hora: x.hora, titulo: x.titulo, tag: x.canal === "youtube" ? (x.formato === "shorts" ? "Shorts" : "YouTube") : FMT_LBL[x.formato] || x.formato, sub: `Upe · ${x.pilar}`, cls: x.status === "publicado" || x.status === "aprovado" ? "ok" : x.status === "reprovado" ? "bad" : x.canal === "youtube" ? "info" : "", pill: cstPill(x.status), u: x }));
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Painel Upe</span><h1>Calendário</h1></div><div class="row"><button class="btn sec" id="nCr">Novo item no cronograma</button><button class="btn" id="nR">Agendar reunião</button></div></div>
    <div class="row" role="group" aria-label="Mostrar">${Object.entries(CAT).map(([k, l]) => `<button class="chip" data-cat="${k}" aria-pressed="${!!on[k]}">${l}</button>`).join("")}</div><div id="calAd" class="grid"></div>`;
  w.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { on[b.dataset.cat] = !on[b.dataset.cat]; ls.set("upe-calf", JSON.stringify(on)); aCalendario(w); });
  $("#nR").onclick = () => reuniaoModal(); $("#nCr").onclick = () => cronoModal(null);
  calendar($("#calAd"), "adm", ev, e => { if (e.r) reuniaoView(e.r, true); else if (e.u) cronoModal(e.u); else go(e.go); });
}

/* ---------- cronograma da Upe ---------- */
const PILARES = ["Branding", "Rebranding", "Marca", "Publicidade e marketing", "E-commerce", "Upe TV", "Upe ERP", "Loja Upe", "Landing pages", "Upe Sistemas", "YouTube"];
const CST = { planejado: "Planejado", roteiro: "Roteiro", pronto: "Pronto", aprovado: "Aprovado", reprovado: "Reprovado", publicado: "Publicado" };
const cstPill = s => `<span class="pill ${{ aprovado: "ok", publicado: "info", reprovado: "bad", pronto: "warn" }[s] || ""}">${esc(CST[s] || s)}</span>`;
async function cronogramaArquivo() {
  if (window.UPE_CRONOGRAMA) return window.UPE_CRONOGRAMA;
  try { const r = await fetch("cronograma/upe-cronograma.json"); if (r.ok) return await r.json(); } catch (e) {}
  throw new Error("Não encontrei cronograma/upe-cronograma.json.");
}
async function cronogramaPadrao() { return (await cronogramaArquivo()).itens; }
// hashtags, bio e direct dos kits ficam num documento à parte da coleção do cronograma
const EXTRAS_ID = "_extras";
async function salvarExtras(lista) { await S.set(`cronograma/${EXTRAS_ID}`, { id: EXTRAS_ID, tipo: "extras", lista }); }
async function carregarCronogramaPadrao() { const arq = await cronogramaArquivo(); for (const it of arq.itens) await S.set(`cronograma/${it.id}`, it); await salvarExtras(arq.extras || []); return arq.itens.length; }
function aCronograma(w, aba = "instagram", alvo = "") {
  const crono = state.cache.crono;
  const pf = ss.get("upe-pf") || "", rows = crono.filter(x => aba === "semdata" ? !x.data : x.data && (aba === "youtube" ? x.canal === "youtube" : x.canal !== "youtube")).filter(x => !pf || x.pilar === pf).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).map(x => comRepost(x, crono));
  const cnt = k => crono.filter(x => k === "semdata" ? !x.data : x.data && (k === "youtube" ? x.canal === "youtube" : x.canal !== "youtube")).length;
  const vw = ls.get("upe-cvw") || "lista";
  const semanas = {}; rows.forEach(x => { const d = new Date((x.data || todayIso()) + "T12:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = x.data ? isoDay(d) : "sem"; (semanas[k] = semanas[k] || []).push(x); });
  const tabs = [["instagram", "Instagram", cnt("instagram")], ["youtube", "YouTube", cnt("youtube")], ["semdata", "Sem data", cnt("semdata")], ["timeline", "Timeline por app", 0], ["modelos", "Modelos editáveis", 0]];
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">@upecriativo · YouTube</span><h1>Cronograma Upe</h1><p class="muted small">Branding, rebranding, marca, publicidade e marketing, e-commerce, Upe TV e Upe ERP.</p></div>
      <div class="row"><button class="btn sec" id="cKit">Importar kit</button><button class="btn sec" id="cDup">Limpar duplicados</button><button class="btn sec" id="cPad">${crono.length ? "Refazer cronograma" : "Carregar cronograma padrão"}</button><button class="btn" id="cNew">Novo item</button></div></div>
    <nav class="subtabs">${tabs.map(([k, l, n]) => `<a class="tab" href="#/admin/cronograma/${k}" ${k === aba ? 'aria-current="page"' : ""}>${l}${k !== "timeline" ? `<span class="cnt" style="background:var(--mute-bg);color:var(--fg-2)">${n}</span>` : ""}</a>`).join("")}</nav>
    ${extrasHTML(state.cache.extras || [], pf)}
    <div id="cBody" class="grid" style="gap:18px"></div>`;
  const body = $("#cBody");
  w.querySelectorAll("[data-xc]").forEach(b => b.onclick = () => copy((state.cache.extras || [])[+b.dataset.xc].texto, "Copiado"));
  $("#cDup").onclick = async () => { const r = await limparDuplicados(); toast(r.rem || r.fix ? `${r.rem} duplicados removidos · ${r.fix} pilares corrigidos` : "Nenhum duplicado encontrado"); reAdmin(); };
  $("#cNew").onclick = () => cronoModal(null);
  $("#cKit").onclick = () => kitImport({ alvo: "cronograma" });
  $("#cPad").onclick = () => { if (!crono.length) return refazer();
    modal("Refazer o cronograma?", `<p>Apaga os ${crono.length} itens atuais (inclusive os importados) e carrega de novo o cronograma padrão da Upe: kit de branding, Upe TV, Upe ERP e YouTube, com as datas organizadas.</p><p class="muted small">Depois, importe as pastas dos kits do Upe TV e do Upe ERP: os arquivos entram nos itens que já estão no cronograma, sem duplicar.</p>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn bad" id="rfOk">Refazer</button>`);
    $("#rfOk").onclick = () => { dlg.close(); refazer(); }; };
  const refazer = async () => { try { for (const x of crono) await S.del(`cronograma/${x.id}`); const n = await carregarCronogramaPadrao(); toast(`Cronograma refeito: ${n} itens`); reAdmin(); } catch (e) { toast(e.message); } };
  if (aba === "modelos") { aModelos(body, alvo ? crono.find(x => x.id === alvo) || null : null); return; }
  if (aba === "timeline") { body.innerHTML = timelineHTML(timelineApps(PERFIL_UPE, crono), "Sugestão de timeline para cada app da Upe, a partir do cronograma e dos públicos da marca."); return; }
  body.innerHTML = `<div class="row" style="align-items:flex-end"><div class="row" role="group" aria-label="Visualização" style="margin-right:8px"><button class="chip" data-vw="lista" aria-pressed="${vw === "lista"}">Lista</button><button class="chip" data-vw="grade" aria-pressed="${vw === "grade"}">Grade</button></div><label class="f" for="pf" style="max-width:240px">Pilar<select id="pf"><option value="">Todos</option>${PILARES.map(p => `<option ${pf === p ? "selected" : ""}>${p}</option>`).join("")}</select></label>
      <span class="muted small">${rows.filter(x => x.status === "publicado").length} de ${rows.length} publicados · ${rows.filter(x => x.status === "aprovado").length} aprovados · ${rows.filter(x => x.status === "reprovado").length} reprovados</span></div>
    ${rows.length && vw === "grade" ? gradeHTML(rows, aba === "youtube") : rows.length ? Object.entries(semanas).map(([k, its]) => `<section class="grid" style="gap:8px"><h3>${k === "sem" ? "Sem data" : `Semana de ${fdate(k)}`}</h3>
      <div class="card pad0 tbl"><table><tbody>${its.map(x => `<tr class="click" data-u="${esc(x.id)}" tabindex="0"><td style="width:92px" class="num small">${x.data ? `<b>${fdate(x.data).slice(0, 5)}</b> ${DOW[new Date(x.data + "T12:00").getDay()].toLowerCase()}<br>${esc(x.hora || "")}` : "—"}</td>
        <td style="width:${x.canal === "youtube" && x.formato === "youtube" ? 116 : 84}px"><div class="lthumb">${tagsHTML(x.status, x)}<div class="thumb" style="width:${x.canal === "youtube" && x.formato === "youtube" ? 104 : 64}px;aspect-ratio:${x.canal === "youtube" && x.formato === "youtube" ? "16/9" : "4/5"};border-radius:8px">${capaDe(x) ? imgTag(capaDe(x)) : `<span class="small">${esc(FMT_LBL[x.formato] || "")}</span>`}</div></div></td>
        <td><b>${esc(x.titulo)}</b><br><span class="muted small">${esc(FMT_LBL[x.formato] || x.formato)} · ${esc(x.pilar || "")} · ${esc(x.origem || "")}${x._orig ? ` · repost de “${esc(x._orig.titulo)}”` : ""}</span></td>
        <td style="width:150px"><select data-st="${esc(x.id)}" aria-label="Status">${Object.entries(CST).map(([s, l]) => `<option value="${s}" ${x.status === s ? "selected" : ""}>${l}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div></section>`).join("") : `<div class="empty">${crono.length ? "Nada aqui com este filtro." : "Carregue o cronograma padrão da Upe (kits do Upe TV, do Upe ERP e o kit de branding) ou importe um kit."}</div>`}`;
  $("#pf").onchange = e => { ss.set("upe-pf", e.target.value); aCronograma(w, aba); };
  w.querySelectorAll("[data-vw]").forEach(b => b.onclick = () => { ls.set("upe-cvw", b.dataset.vw); aCronograma(w, aba); });
  w.querySelectorAll("[data-g]").forEach(b => b.onclick = () => cronoModal(crono.find(x => x.id === b.dataset.g)));
  w.querySelectorAll("tr[data-u]").forEach(r => { r.onclick = e => { if (e.target.closest("select")) return; cronoModal(crono.find(x => x.id === r.dataset.u)); }; r.onkeydown = e => { if (e.key === "Enter") r.click(); }; });
  w.querySelectorAll("[data-st]").forEach(s => s.onchange = async () => { const x = crono.find(y => y.id === s.dataset.st); x.status = s.value; await S.set(`cronograma/${x.id}`, x); toast("Status atualizado"); aCronograma(w, aba); });
}
// "Hashtags, bio e direct" dos kits, logo abaixo das abas Instagram | YouTube | Sem data
function extrasHTML(lista, pf) {
  const idx = lista.map((e, i) => ({ ...e, i })).filter(e => !pf || !PILARES.includes(e.kit) || e.kit === pf || (pf === "Branding" && /branding/i.test(e.kit)));
  if (!idx.length) return "";
  const kits = [...new Set(idx.map(e => e.kit || "Kit"))], open = ls.get("upe-xopen") !== "0";
  return `<details class="card xpanel" ${open ? "open" : ""} id="xPan"><summary><span class="eb">Copiar e colar</span><b>Hashtags, bio e direct</b><span class="muted small">${idx.length} textos · ${kits.join(" · ")}</span></summary>
    <div class="xgrid">${kits.map(k => `<div class="grid" style="gap:8px;align-content:start"><span class="pill info" style="justify-self:start">${esc(k)}</span>${idx.filter(e => (e.kit || "Kit") === k).map(e => `<div class="xi"><div class="spread"><b class="small" style="text-transform:capitalize">${esc(e.rotulo)}</b><button class="btn sec sm" data-xc="${e.i}">Copiar</button></div><pre class="legenda small">${esc(e.texto)}</pre></div>`).join("")}</div>`).join("")}</div></details>`;
}
document.addEventListener("toggle", e => { if (e.target.id === "xPan") ls.set("upe-xopen", e.target.open ? "1" : "0"); }, true);
function gradeHTML(rows, yt) {
  return `<div class="feedgrid ${yt ? "yt" : ""}">${rows.map(x => { const c = capaDe(x), vid = (x.midias || []).find(u => kind(u, "") === "video");
    return `<button class="gcell" data-g="${esc(x.id)}" title="${esc(x.titulo)}">${tagsHTML(x.status, x, true)}<span class="gimg">${c ? imgTag(c) : vid ? `<video src="${esc(resolveMedia(vid))}#t=1" muted preload="metadata"></video>` : `<span class="gph">${esc(FMT_LBL[x.formato] || "")}<br><small>${esc(x.titulo)}</small></span>`}
      <span class="gtop">${x.data ? fdate(x.data).slice(0, 5) : "s/ data"}</span><span class="gfmt">${esc(FMT_LBL[x.formato] || x.formato)}${(x.midias || []).length > 1 ? " · " + x.midias.length : ""}</span></span></button>`; }).join("")}</div>`;
}
function gradePosts(posts) {
  if (!posts.length) return `<div class="empty">Nenhum post aqui.</div>`;
  return `<p class="muted small">Prévia do feed, na ordem de publicação.</p><div class="feedgrid">${[...posts].sort((a, b) => (b.data || "").localeCompare(a.data || "")).map(p => { const c = p.capa || (p.midias || []).find(u => kind(u) === "img"), vid = (p.midias || []).find(u => kind(u, p.tipo) === "video");
    return `<button class="gcell" data-p="${esc(p.id)}" title="${esc(p.titulo)}">${tagsHTML(p.ef.status, p, true)}<span class="gimg">${c ? imgTag(c) : vid ? `<video src="${esc(resolveMedia(vid))}#t=1" muted preload="metadata"></video>` : `<span class="gph">${esc(FMT_LBL[p.tipo] || "")}<br><small>${esc(p.titulo)}</small></span>`}<span class="gtop">${p.data ? fdate(p.data).slice(0, 5) : "s/ data"}</span><span class="gfmt">${esc(FMT_LBL[p.tipo] || p.tipo)}</span>${p.ef.status === "pendente" ? '<span class="gok" style="background:var(--warn)">!</span>' : ""}</span></button>`; }).join("")}</div>`;
}
async function limparDuplicados() {
  const crono = state.cache.crono, keep = [], rem = []; let fix = 0;
  const score = x => (x.midias || []).filter(solid).length * 2 + (x.data ? 1 : 0) + (String(x.origem || "").startsWith("Kit ") ? 1 : 0);
  for (const x of [...crono].sort((a, b) => score(b) - score(a))) {
    const same = (k) => k.formato === x.formato && k.canal === x.canal && ((k.pilar === x.pilar && tkey(k.formato, k.titulo) === tkey(x.formato, x.titulo)) || ((k.midias || []).length && (k.midias || []).map(fkey).join() === (x.midias || []).map(fkey).join()));
    const ex = keep.find(same);
    if (ex) { (x.midias || []).forEach((u, i) => { if (solid(u) && !solid((ex.midias || [])[i])) { ex.midias = ex.midias || []; ex.midias[i] = u; } }); if (!ex.data && x.data) ex.data = x.data; rem.push(x); }
    else keep.push(x);
  }
  for (const x of keep) { const p = x.canal === "youtube" ? x.pilar : pilarDoKit(x.origem); if (p && p !== "Branding" && x.pilar !== p && !String(x.origem || "").includes("Branding")) { x.pilar = p; fix++; } }
  for (const x of rem) await S.del(`cronograma/${x.id}`);
  for (const x of keep) await S.set(`cronograma/${x.id}`, x);
  return { rem: rem.length, fix };
}
function cronoModal(x0) {
  const n = !x0, crono = state.cache.crono || [];
  const x = x0 || { id: "upe-" + uid(8), data: todayIso(), hora: "12:00", canal: "instagram", formato: "feed", pilar: "Branding", titulo: "", legenda: "", roteiro: "", midias: [], capa: "", status: "planejado", origem: "Manual" };
  const v = comRepost(x, crono), view = !n, H = x.historia, yt = x.canal === "youtube";
  const outras = (v.midias || []).filter(u => !H || u !== H.video);
  const origs = crono.filter(y => y.id !== x.id && y.canal === x.canal && !y.repostDe && (y.midias || []).length).sort((a, b) => (a.data || "z").localeCompare(b.data || "z"));
  modal(n ? "Novo item do cronograma" : esc(x.titulo), `
    ${view ? `${tagsHTML(x.status, x)}<div class="row">${cstPill(x.status)}<span class="pill info">${esc(FMT_LBL[x.formato] || x.formato)}</span><span class="pill">${esc(x.pilar)}</span><span class="muted small">${x.data ? `${DOW[new Date(x.data + "T12:00").getDay()]}, ${fdate(x.data)} · ${esc(x.hora)}` : "Sem data"} · ${esc(x.origem || "")}</span></div>
      ${v._orig ? `<div class="card" style="background:var(--info-bg)"><b>Repost</b> de “${esc(v._orig.titulo)}”${v._orig.data ? ` (${fdate(v._orig.data)})` : ""}. O card mostra a peça original de novo.</div>` : ""}
      ${H ? `<section class="card grid hist"><div class="spread"><div><span class="eb">Versão história do canal</span><h3>${esc(H.titulo)}</h3></div>${H.video ? dlBtn(H.video, "Baixar motion") : ""}</div>
        ${H.video ? `<div class="media-box">${mediaHTML(H.video, "video")}</div>` : ""}
        <ol class="beats">${(H.beats || []).map(b => `<li><b>${esc(b.rotulo)}</b><span>${esc(b.texto)}</span></li>`).join("")}</ol>
        <p class="muted small">Motion com áudio e efeitos feito só com material próprio da Upe (marca, telas dos apps e textos). Sem trechos de vídeos ou prints de terceiros: sem risco de strike de direitos autorais.</p></section>` : ""}
      ${outras.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${outras.map(u => `<div class="media-box" style="min-height:120px">${mediaHTML(u, x.formato === "reels" || x.formato === "shorts" || x.formato === "youtube" ? "video" : "")}</div>`).join("")}</div>` : v.capa && !H ? `<div class="media-box">${imgTag(v.capa)}</div>` : ""}
      <div class="row">${outras.map((u, i) => dlBtn(u, outras.length > 1 ? `Baixar ${i + 1}` : "Baixar arquivo")).join("")}${v.capa ? dlBtn(v.capa, yt ? "Baixar thumbnail" : "Baixar capa") : ""}${v.legenda ? `<button class="btn sm" id="xCp">Copiar ${yt ? "descrição" : "legenda"}</button>` : ""}<button class="btn sm" id="xZip" title="Arquivos, legenda e dados do post num .zip">Baixar pacote (.zip)</button></div>` : ""}
    <div class="g3"><label class="f" for="xD">Data<input id="xD" type="date" value="${esc(x.data)}"></label><label class="f" for="xH">Hora<input id="xH" type="time" value="${esc(x.hora)}"></label><label class="f" for="xSt">Status<select id="xSt">${Object.entries(CST).map(([s, l]) => `<option value="${s}" ${x.status === s ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <div class="g3"><label class="f" for="xC">Canal<select id="xC"><option value="instagram" ${!yt ? "selected" : ""}>Instagram</option><option value="youtube" ${yt ? "selected" : ""}>YouTube</option></select></label><label class="f" for="xF">Formato<select id="xF">${["feed", "carrossel", "reels", "story", "youtube", "shorts"].map(f => `<option value="${f}" ${x.formato === f ? "selected" : ""}>${FMT_LBL[f]}</option>`).join("")}</select></label><label class="f" for="xP">Pilar<select id="xP">${PILARES.map(p => `<option ${x.pilar === p ? "selected" : ""}>${p}</option>`).join("")}</select></label></div>
    <label class="f" for="xT">Título<input id="xT" value="${esc(x.titulo)}"></label>
    <label class="f" for="xRp">Repost de (opcional: o card mostra a peça original com a tag Repost)<select id="xRp"><option value="">Não é repost</option>${origs.map(y => `<option value="${esc(y.id)}" ${x.repostDe === y.id ? "selected" : ""}>${y.data ? fdate(y.data).slice(0, 5) + " · " : ""}${esc(FMT_LBL[y.formato] || y.formato)} · ${esc(y.titulo.slice(0, 70))}</option>`).join("")}</select></label>
    <label class="f" for="xL">${yt ? "Descrição" : "Legenda"}<textarea id="xL" rows="6">${esc(x.legenda)}</textarea></label>
    <label class="f" for="xR">Roteiro / notas<textarea id="xR" rows="${H ? 8 : 3}">${esc(x.roteiro || "")}</textarea></label>
    <label class="f" for="xM">Arquivos (um link por linha)<textarea id="xM" rows="2">${esc((x.midias || []).join("\n"))}</textarea></label>`,
    `${!n ? `<button class="btn bad" id="xX">Excluir</button>` : ""}${!n && x.canal !== "youtube" ? `<button class="btn sec" id="xMod">${x.modelo ? "Editar no modelo" : "Criar arte no modelo"}</button>` : ""}<button class="btn sec" data-close>Fechar</button><button class="btn" id="xOk">Salvar</button>`, true);
  if ($("#xMod")) $("#xMod").onclick = () => { dlg.close(); go(`#/admin/cronograma/modelos/${x.id}`); };
  if ($("#xCp")) $("#xCp").onclick = () => copy(v.legenda, "Copiado");
  if ($("#xZip")) $("#xZip").onclick = () => pacotePost(v, $("#xZip"));
  $("#xOk").onclick = async () => {
    const t = $("#xT").value.trim(); if (!t) return $("#xT").focus();
    const rp = $("#xRp").value;
    Object.assign(x, { data: $("#xD").value, hora: $("#xH").value, status: $("#xSt").value, canal: $("#xC").value, formato: $("#xF").value, pilar: $("#xP").value, titulo: t, legenda: $("#xL").value, roteiro: $("#xR").value, midias: $("#xM").value.split("\n").map(s => s.trim()).filter(Boolean), repostDe: rp || "", repost: !!rp || (x.repost && !x.repostDe) });
    if (!x.repostDe) delete x.repostDe;
    await S.set(`cronograma/${x.id}`, x); dlg.close(); toast("Cronograma salvo"); reAdmin();
  };
  if ($("#xX")) $("#xX").onclick = async () => { await S.del(`cronograma/${x.id}`); dlg.close(); toast("Item excluído"); reAdmin(); };
}

/* ---------- importar kit (HTML + pasta de arquivos) ---------- */
// chave de um arquivo: as 2 últimas partes do caminho ("feed/01-x.jpg", "1-apresentacao/01.jpg")
const fkey = u => String(u || "").split("?")[0].split("/").slice(-2).join("/").toLowerCase();
const tkey = (f, t) => f + "|" + String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const solid = u => /^(idb:|https?:|data:)/.test(u || "") || String(u || "").startsWith("{assets}") || String(u || "").startsWith("kits/");
function pilarDoKit(nome) { const n = String(nome || "").toLowerCase(); if (/upe tv|\btv\b/.test(n)) return "Upe TV"; if (/erp|plataforma de vendas|loja/.test(n)) return "Upe ERP"; if (/branding|marca/.test(n)) return "Branding"; return ""; }
function acharTodos(lista, it, mesmoKit) { return lista.filter(x => acharIgual([x], it, mesmoKit)); }
function acharIgual(lista, it, mesmoKit = () => true) {
  // mesmo título, ou exatamente o mesmo conjunto de arquivos
  const set = x => [...new Set((x.midias || []).map(fkey).filter(Boolean))].sort().join("|"), ks = set(it), fm = f => ({ imagem: "feed", video: "youtube" }[f] || f);
  // o título só vale dentro do mesmo kit (kits diferentes podem ter peças com o mesmo nome)
  return lista.find(x => (mesmoKit(x) && tkey(fm(x.formato || x.tipo), x.titulo) === tkey(fm(it.formato), it.titulo)) || (ks && set(x) === ks));
}
const FMT_TIPO = { feed: "imagem", carrossel: "carrossel", reels: "reels", story: "story", youtube: "video", shorts: "reels" };
function kitImport(target) {
  let files = new Map(), html = "", parsed = null, baseHref = "";
  modal("Importar kit de conteúdo", `
    <p class="muted small">Use o “Kit Instagram” em HTML com as pastas de arquivos (feed, carrossel, reels, stories). As legendas, os arquivos e as datas do calendário do kit entram ${target.alvo === "cliente" ? "no calendário de aprovação do cliente, com os arquivos para ele baixar" : "no cronograma da Upe"}.</p>
    <div class="g2"><label class="tg" style="flex-direction:column;align-items:flex-start;gap:8px"><b>Pasta inteira do kit</b><small>index.html + feed/, carrossel/, reels/, stories/</small><input type="file" id="kDir" webkitdirectory multiple></label>
      <label class="tg" style="flex-direction:column;align-items:flex-start;gap:8px"><b>Só o arquivo HTML</b><small>Os arquivos ficam num endereço publicado</small><input type="file" id="kHtml" accept=".html,text/html"></label></div>
    <label class="f" for="kBase">Endereço da pasta publicada (se enviar só o HTML)<input id="kBase" placeholder="https://seusite.web.app/portal/kits/nome-do-kit/"></label>
    <div class="g3"><label class="f" for="kNome">Nome do kit<input id="kNome" placeholder="Kit Instagram · outubro"></label><label class="f" for="kShift">Mover datas (dias)<input id="kShift" type="number" value="0"></label>
      ${target.alvo === "cliente" ? `<label class="f" for="kSt">Os posts entram como<select id="kSt"><option value="pendente">Aguardando aprovação</option><option value="rascunho">Rascunho (cliente não vê)</option><option value="aprovado">Já aprovados</option></select></label>` : `<label class="f" for="kPil">Pilar<select id="kPil"><option value="">Automático (pelo nome do kit)</option>${PILARES.map(p => `<option>${p}</option>`).join("")}</select></label>`}</div>
    <p class="muted small">Peças que já existem ${target.alvo === "cliente" ? "neste cliente" : "no cronograma"} (mesmo arquivo ou mesmo título) são <b>atualizadas</b> com os arquivos novos, sem duplicar e sem mudar a data.</p>
    <div id="kPrev"></div>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="kGo" disabled>Importar</button>`, true);
  const prev = () => {
    if (!html) return; const doc = new DOMParser().parseFromString(html, "text/html"); parsed = parseKit(doc);
    if (!$("#kNome").value) $("#kNome").value = parsed.titulo || "Kit de conteúdo";
    const sh = +$("#kShift").value || 0, has = p => files.size ? files.has(normP(p)) : true;
    const its = parsed.itens.filter(i => target.alvo !== "cliente" || i.formato !== "youtube"); const miss = its.reduce((s, i) => s + i.midias.filter(m => !has(m)).length, 0);
    const pilP = target.alvo === "cliente" ? "" : ($("#kPil").value || pilarDoKit($("#kNome").value) || pilarDoKit(parsed.titulo) || "Marca");
    const lista = target.alvo === "cliente" ? (target.doc.posts || []) : state.cache.crono, upd = its.filter(i => acharIgual(lista, i, x => target.alvo === "cliente" || x.pilar === pilP || x.canal === "youtube")).length;
    $("#kPrev").innerHTML = its.length ? `<div class="row small"><b>${its.length} peças</b><span class="pill ok">${its.length - upd} novas</span><span class="pill info">${upd} já existem (serão atualizadas)</span>${["feed", "carrossel", "reels", "story", "youtube"].map(f => { const n = its.filter(i => i.formato === f).length; return n ? `<span class="pill">${n} ${FMT_LBL[f]}</span>` : ""; }).join("")}${miss ? `<span class="pill bad">${miss} arquivo(s) não encontrados na pasta</span>` : files.size ? '<span class="pill ok">Todos os arquivos encontrados</span>' : ""}</div>
      <div class="card pad0 tbl" style="max-height:300px;overflow:auto"><table><thead><tr><th>Data</th><th>Formato</th><th>Peça</th><th>Arquivos</th></tr></thead><tbody>${its.map(i => `<tr><td class="num small">${i.data ? fdate(addDays(i.data, sh)) : "sem data"}</td><td>${esc(FMT_LBL[i.formato] || i.formato)}</td><td class="small">${esc(i.titulo)}</td><td class="num small">${i.midias.length}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Não encontrei peças neste HTML.</div>`;
    $("#kGo").disabled = !its.length;
  };
  const normP = p => String(p || "").replace(/^\.\//, "").split("?")[0];
  $("#kDir").onchange = async e => { files = new Map(); let idx = null;
    for (const f of e.target.files) { const rel = f.webkitRelativePath.split("/").slice(1).join("/"); files.set(rel, f); if (/(^|\/)index\.html$|kit[^/]*\.html$/i.test(rel) && (!idx || rel.split("/").length < idx.split("/").length)) idx = rel; }
    if (!idx) idx = [...files.keys()].find(k => /\.html$/i.test(k)); if (!idx) return toast("Não encontrei o HTML do kit na pasta");
    const dir = idx.includes("/") ? idx.slice(0, idx.lastIndexOf("/") + 1) : ""; if (dir) { const m2 = new Map(); files.forEach((v, k) => { if (k.startsWith(dir)) m2.set(k.slice(dir.length), v); }); files = m2; }
    html = await files.get(idx.slice(dir.length)).text(); prev(); };
  $("#kHtml").onchange = async e => { const f = e.target.files[0]; if (!f) return; files = new Map(); html = await f.text(); prev(); };
  $("#kShift").oninput = prev;
  $("#kGo").onclick = async () => {
    const base = $("#kBase").value.trim(), sh = +$("#kShift").value || 0, nome = $("#kNome").value.trim() || "Kit de conteúdo", kitId = uid(8);
    const btn = $("#kGo"); btn.disabled = true; let done = 0; const total = parsed.itens.filter(i => target.alvo !== "cliente" || i.formato !== "youtube").reduce((s, i) => s + i.midias.length + (i.capa ? 1 : 0), 0);
    const up = async p => { if (!p) return ""; if (/^(https?:|data:|blob:)/.test(p)) return p; const f = files.get(normP(p));
      if (f) { const u = await S.upload(f, target.alvo === "cliente" ? `clientes/${target.id}/kits/${kitId}` : `cronograma/${kitId}`); done++; btn.textContent = `Enviando ${done}/${total}…`; if (u) return u; }
      return base ? resolveUrl(p, base.endsWith("/") ? base : base + "/") : p; };
    if (S.mode === "firebase" && files.size && !S.st) { toast("Ative o Firebase Storage para enviar os arquivos"); btn.disabled = false; return; }
    const out = [];
    for (const i of parsed.itens.filter(i => target.alvo !== "cliente" || i.formato !== "youtube")) out.push({ ...i, orig: i, data: i.data ? addDays(i.data, sh) : "", midias: await Promise.all(i.midias.map(up)), capa: await up(i.capa) });
    const merge = (old, novo) => novo.map((u, k) => solid(u) ? u : (old || [])[k] || u);
    let novos = 0, atual = 0;
    if (target.alvo === "cliente") {
      const d = target.doc, st = $("#kSt").value, now = Date.now(); d.posts = d.posts || [];
      for (const i of out) {
        const ex = acharIgual(d.posts, i.orig);
        if (ex) { ex.midias = merge(ex.midias, i.midias); if (solid(i.capa)) ex.capa = i.capa; if (!ex.legenda) ex.legenda = i.legenda; ex.kitId = ex.kitId || kitId; atual++; }
        else { d.posts.push({ id: uid(8), kitId, data: i.data, hora: { reels: "19:00", story: "10:00" }[i.formato] || "12:00", tipo: FMT_TIPO[i.formato] || "imagem", titulo: i.titulo, midias: i.midias, capa: i.capa, legenda: i.legenda, versao: 1, status: st, statusEm: now }); novos++; }
      }
      d.kits = [...(d.kits || []), { id: kitId, nome, importadoEm: now, total: out.length }];
      dlg.close(); await target.save(`${novos} posts novos · ${atual} atualizados`);
    } else {
      const pil = $("#kPil").value || pilarDoKit(nome) || pilarDoKit(parsed.titulo) || "Marca", crono = state.cache.crono;
      for (const i of out) {
        const exs = acharTodos(crono, i.orig, x => x.pilar === pil || x.origem === nome || x.canal === "youtube");
        if (exs.length) { for (const ex of exs) { ex.midias = merge(ex.midias, i.midias); if (solid(i.capa)) ex.capa = i.capa; if (!ex.legenda) ex.legenda = i.legenda;
          if (ex.canal !== "youtube" && ex.pilar === "Branding" && pil !== "Branding") ex.pilar = pil; await S.set(`cronograma/${ex.id}`, ex); } atual++; continue; }
        const id = "kit-" + kitId + "-" + uid(5);
        const it = { id, data: i.data, hora: { reels: "19:00", story: "10:00", youtube: "18:00" }[i.formato] || "12:00", canal: i.formato === "youtube" || i.formato === "shorts" ? "youtube" : "instagram", formato: i.formato, pilar: i.formato === "youtube" ? "YouTube" : pil, titulo: i.titulo, legenda: i.legenda, roteiro: i.roteiro || "", midias: i.midias, capa: i.capa, status: "planejado", origem: nome };
        await S.set(`cronograma/${id}`, it); crono.push(it); novos++;
      }
      if ((parsed.extras || []).length) { const kit = pil === "Branding" ? "Branding Upe" : pil, lista = (state.cache.extras || []).filter(e => e.kit !== kit); await salvarExtras([...lista, ...parsed.extras.map(e => ({ kit, ...e }))]); }
      dlg.close(); toast(`${novos} itens novos · ${atual} atualizados`); reAdmin();
    }
  };
}

/* ---------- entregas (prazos) no projeto ---------- */
function entregasHTML(doc) {
  return `<section class="card grid"><div class="spread"><h3>Prazos de entrega</h3><button class="btn sec sm" id="enAdd">Adicionar prazo</button></div>
    <p class="muted small">Aparecem na agenda do cliente e no seu calendário, com aviso no sininho 3 dias antes.</p>
    <div class="grid" style="gap:8px">${(doc.entregas || []).map((e, k) => `<div class="row" style="flex-wrap:nowrap"><input data-ent="${k}" value="${esc(e.titulo)}" aria-label="Entrega" placeholder="Ex.: Manual da marca"><input data-end="${k}" type="date" value="${esc(e.data)}" aria-label="Prazo" style="max-width:160px"><label class="row small" style="gap:6px;white-space:nowrap"><input type="checkbox" data-enf="${k}" ${e.status === "entregue" ? "checked" : ""}>Entregue</label><button class="btn sec sm" data-endel="${k}" aria-label="Remover">×</button></div>`).join("") || '<p class="muted small">Nenhum prazo cadastrado.</p>'}</div></section>`;
}
function entregasCollect(ct, doc) {
  doc.entregas = [...ct.querySelectorAll("[data-ent]")].map((i, k) => ({ id: (doc.entregas[k] || {}).id || uid(8), titulo: i.value.trim(), data: ct.querySelector(`[data-end="${k}"]`).value || todayIso(), status: ct.querySelector(`[data-enf="${k}"]`).checked ? "entregue" : "pendente", descricao: (doc.entregas[k] || {}).descricao || "" })).filter(e => e.titulo);
}

/* ---------- timeline sugerida por app (Upe e clientes, a partir do dossiê) ---------- */
const APPS = {
  instagram: { nome: "Instagram", re: /insta/i, freq: "4 a 5 posts por semana + stories todos os dias", hora: "12h e 19h (reels às 19h)", formatos: ["Reels", "Carrossel", "Feed", "Stories"],
    fases: ["Apresentar a marca: quem é, o que entrega e bastidores", "Prova social: depoimentos, antes e depois, avaliações", "Conversão: oferta clara e CTA para o WhatsApp ou a loja", "Comunidade: enquetes, repost de clientes e colaborações"] },
  youtube: { nome: "YouTube", re: /you ?tube/i, freq: "1 vídeo longo por semana + 2 Shorts", hora: "Ter e qui às 18h · Shorts no sábado às 10h", formatos: ["Vídeo história (8 atos)", "Tutorial", "Shorts"],
    fases: ["Vídeo âncora: a história da marca em 8 atos (história, contexto, narrativa, clímax, pergunta, solução, fundamentação, CTA)", "Tutoriais e respostas às perguntas mais comuns", "Casos reais: problema, solução e resultado", "Séries fixas e Shorts recortados dos vídeos longos"] },
  tiktok: { nome: "TikTok", re: /tik ?tok/i, freq: "3 a 5 vídeos curtos por semana", hora: "18h às 21h", formatos: ["Vídeo curto", "Tendência com áudio", "Bastidores"],
    fases: ["Ganchos de 3 segundos com o problema do público", "Bastidores e processo", "Antes e depois / transformação", "Respostas a comentários em vídeo"] },
  linkedin: { nome: "LinkedIn", re: /linked ?in/i, freq: "2 a 3 posts por semana", hora: "Ter a qui, 8h ou 12h", formatos: ["Texto com imagem", "Carrossel PDF", "Artigo"],
    fases: ["Posicionamento: por que a marca existe", "Cases e números", "Opinião sobre o mercado", "Convite para conversa ou reunião"] },
  facebook: { nome: "Facebook", re: /face/i, freq: "3 posts por semana (reaproveitando o Instagram)", hora: "12h e 20h", formatos: ["Feed", "Reels", "Eventos"],
    fases: ["Espelhar os posts principais do Instagram", "Grupos e comunidade local", "Eventos e ofertas", "Avaliações e recomendações"] },
  whatsapp: { nome: "WhatsApp", re: /whats|zap/i, freq: "Status diário + 1 lista de transmissão por semana", hora: "Status às 9h · lista na terça às 10h", formatos: ["Status", "Lista de transmissão", "Catálogo"],
    fases: ["Catálogo e mensagem de boas-vindas", "Status com novidades e bastidores", "Oferta da semana para a lista", "Pós-venda: pedir avaliação e indicação"] },
  google: { nome: "Google (Perfil da Empresa)", re: /google|maps/i, freq: "1 atualização por semana", hora: "Segunda pela manhã", formatos: ["Post de novidade", "Fotos", "Respostas a avaliações"],
    fases: ["Perfil completo: horários, fotos e serviços", "Pedir avaliações aos clientes", "Posts semanais de novidade ou oferta", "Responder todas as avaliações"] },
  pinterest: { nome: "Pinterest", re: /pinterest/i, freq: "5 pins por semana", hora: "Noite e fim de semana", formatos: ["Pin", "Pasta temática"],
    fases: ["Pastas por tema e produto", "Pins com link para a loja", "Inspirações e usos do produto", "Coleções sazonais"] },
  loja: { nome: "Site / loja online", re: /site|loja|e-?commerce|ifood|marketplace/i, freq: "1 novidade ou vitrine por semana", hora: "Antes do pico de vendas", formatos: ["Vitrine", "Banner", "Blog / FAQ"],
    fases: ["Vitrine com os mais vendidos", "Banner da campanha do mês", "Página de perguntas frequentes", "Datas sazonais e kits"] },
  email: { nome: "E-mail / newsletter", re: /e-?mail|newsletter/i, freq: "1 envio a cada 15 dias", hora: "Terça ou quinta às 10h", formatos: ["Newsletter", "Oferta", "Convite"],
    fases: ["Boas-vindas e apresentação", "Conteúdo útil + novidade", "Oferta exclusiva para a lista", "Convite para recompra"] }
};
const PERFIL_UPE = { nome: "Upe Criativo", canais: ["instagram", "youtube", "linkedin", "tiktok", "whatsapp", "google"], negocio: "Branding e redesign, Upe ERP (loja, PDV e pedidos) e Upe TV (mídia em telas)",
  publicos: ["Donos de pequenos negócios", "Lojistas e e-commerce", "Estabelecimentos parceiros e anunciantes"], atributos: ["Branding", "Upe ERP", "Upe TV"],
  jornada: [{ etapa: "Descobrir", texto: "Reels e Shorts com antes e depois de marcas" }, { etapa: "Confiar", texto: "Cases, manual de marca e bastidores" }, { etapa: "Escolher", texto: "Tutoriais do Upe ERP e do Upe TV" }, { etapa: "Comprar", texto: "Conversa no WhatsApp e reunião" }] };
const semPh = v => (typeof v === "string" && /^\s*\[.*\]\s*$/.test(v)) ? "" : (v || "");
function perfilDoDossie(D, doc = {}) {
  const fi = Object.fromEntries((D.diagnostico?.ficha || []).map(([k, v]) => [String(k).toLowerCase(), semPh(v)]));
  const txt = [fi.canais, fi["negócio"], fi.negocio].join(" ");
  let canais = Object.entries(APPS).filter(([, a]) => a.re.test(txt)).map(([k]) => k);
  if (!canais.length) canais = ["instagram", "whatsapp", "google"];
  if (doc.plano?.midias && !canais.includes("instagram")) canais.unshift("instagram");
  return { nome: semPh(D.projeto?.marca) || doc.marca || "", canais, negocio: fi["negócio"] || fi.negocio || "", regiao: fi["região"] || fi.regiao || "",
    publicos: (D.estrategia?.publicos || []).map(p => semPh(p.titulo)).filter(Boolean), atributos: [...(D.estrategia?.atributos || []), ...(D.diagnostico?.atributos || [])].map(semPh).filter(Boolean).slice(0, 5),
    jornada: (D.estrategia?.jornada || []).map(j => ({ etapa: j.etapa, texto: semPh(j.texto) })).filter(j => j.texto), em: Date.now() };
}
function timelineApps(perfil, itens = []) {
  const P = perfil || {}, at = P.atributos || [], jr = P.jornada || [], semana = ["Semanas 1 e 2", "Semanas 3 e 4", "Mês 2", "Mês 3 em diante"];
  return (P.canais || []).filter(k => APPS[k]).map(k => {
    const a = APPS[k], noCron = itens.filter(x => x.data && (k === "youtube" ? x.canal === "youtube" : k === "instagram" ? x.canal !== "youtube" : false));
    let ritmo = "";
    if (noCron.length) { const ds = noCron.map(x => x.data).sort(), sem = Math.max(1, Math.round((new Date(ds[ds.length - 1]) - new Date(ds[0])) / 6048e5)); ritmo = `No cronograma: ${noCron.length} peças · cerca de ${Math.round(noCron.length / sem * 10) / 10} por semana`; }
    return { app: k, nome: a.nome, freq: a.freq, hora: a.hora, formatos: a.formatos, ritmo,
      fases: a.fases.map((f, i) => ({ quando: semana[i], titulo: jr[i] ? jr[i].etapa : ["Apresentar", "Confiar", "Converter", "Fidelizar"][i], texto: f + (jr[i] ? `. Na marca: ${jr[i].texto}` : at[i] ? `. Foco: ${at[i]}` : "") })) };
  });
}
function timelineHTML(apps, sub) {
  if (!apps.length) return `<div class="empty">Sem canais definidos. Importe o dossiê com a ficha “Canais” preenchida.</div>`;
  return `<p class="muted small">${esc(sub || "")}</p><div class="tlgrid">${apps.map(a => `<article class="card grid tlc"><div class="spread"><h3>${esc(a.nome)}</h3><span class="pill info">${esc(a.formatos[0])}</span></div>
    <div class="grid" style="gap:2px"><span class="small"><b>Ritmo:</b> ${esc(a.freq)}</span><span class="small"><b>Horários:</b> ${esc(a.hora)}</span><span class="small"><b>Formatos:</b> ${esc(a.formatos.join(" · "))}</span>${a.ritmo ? `<span class="small muted">${esc(a.ritmo)}</span>` : ""}</div>
    <ol class="tl">${a.fases.map(f => `<li><span class="eb">${esc(f.quando)} · ${esc(f.titulo)}</span><span class="small">${esc(f.texto)}</span></li>`).join("")}</ol></article>`).join("")}</div>`;
}
// posts que vêm no dossiê (DADOS.postagens ou o feed da aba 05) entram no calendário de aprovação
function postsDoDossie(D, base, doc) {
  const hoje = new Date(), R = u => resolveUrl(u, base), arr = [];
  const iso = d => { d = semPh(d); if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; const m = String(d).match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/); if (!m) return "";
    let y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : hoje.getFullYear(); const dt = new Date(y, m[2] - 1, m[1]); if (!m[3] && dt - hoje < -60 * 864e5) y++; return `${y}-${pad(+m[2])}-${pad(+m[1])}`; };
  (D.postagens || []).forEach(p => { const midias = (p.midias || (p.img ? [p.img] : [])).filter(Boolean); if (!midias.length && !semPh(p.legenda)) return;
    arr.push({ data: iso(p.data), hora: p.hora || "", tipo: p.tipo || (midias.length > 1 ? "carrossel" : midias.some(u => kind(u) === "video") ? "reels" : "imagem"), titulo: semPh(p.titulo) || "Post do dossiê", legenda: semPh(p.legenda), midias: midias.map(R), capa: p.capa ? R(p.capa) : "", semana: p.semana }); });
  (D.apresentacao?.instagram || []).filter(p => p.img).forEach(p => arr.push({ data: iso(p.data), tipo: "imagem", titulo: semPh(p.titulo) || "Post do dossiê", legenda: semPh(p.legenda), midias: [R(p.img)], capa: "", semana: p.semana }));
  const ex = doc.posts || [], visto = new Set(ex.flatMap(p => (p.midias || []).map(fkey))), out = [];
  arr.forEach((p, i) => {
    const ks = p.midias.map(fkey); if (ks.length && ks.every(k => visto.has(k))) return; if (!ks.length && ex.some(e => e.titulo === p.titulo)) return; ks.forEach(k => visto.add(k));
    out.push({ id: uid(8), kitId: "dossie", data: p.data || addDays(todayIso(), 2 + ((+p.semana || 1) - 1) * 7 + out.length * 2), hora: p.hora || (p.tipo === "reels" ? "19:00" : "12:00"), tipo: p.tipo, titulo: p.titulo, midias: p.midias, capa: p.capa, legenda: p.legenda, versao: 1, status: "pendente", statusEm: Date.now(), origem: "Dossiê" });
  });
  return out;
}

/* pacote do post: imagens/vídeo, capa, legenda e dados num .zip, pronto para publicar no Instagram ou no YouTube */
async function pacotePost(v, bt) {
  bt.disabled = true; const t0 = bt.textContent; bt.textContent = "Montando…";
  try {
    if (!window.JSZip) await new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; sc.onload = ok; sc.onerror = no; document.head.append(sc); });
    const z = new window.JSZip(), nome = `${v.data || "sem-data"}-${String(v.titulo || "post").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
    const arqs = [...(v.midias || []), v.capa].filter(Boolean); let i = 0, falhas = 0;
    for (const u of arqs) { const url = resolveMedia(u); if (!url) continue; try { const r = await fetch(url); if (!r.ok) throw 0; i++; z.file(`${String(i).padStart(2, "0")}-${fileName(u)}`, await r.blob()); } catch { falhas++; } }
    const tags = (String(v.legenda || "").match(/#[\p{L}\d_]+/gu) || []).join(" ");
    z.file("legenda.txt", String(v.legenda || ""));
    if (tags) z.file("hashtags.txt", tags);
    z.file("post.txt", [`Título: ${v.titulo || ""}`, `Canal: ${v.canal || ""} · Formato: ${FMT_LBL[v.formato] || v.formato || ""} · Pilar: ${v.pilar || ""}`, `Data: ${v.data || ""} ${v.hora || ""}`, v.roteiro ? `\nRoteiro:\n${v.roteiro}` : ""].join("\n"));
    const blob = await z.generateAsync({ type: "blob" }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome + ".zip"; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(falhas ? `Pacote baixado (${falhas} arquivo(s) não puderam ser incluídos).` : "Pacote baixado.");
  } catch (e) { toast("Não foi possível montar o pacote agora."); }
  bt.disabled = false; bt.textContent = t0;
}

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
  landing: { nome: "Upe Landing pages", desc: "Páginas de venda com a marca do cliente, editor, domínio próprio e painel de visitas, cliques e leads.", painel: "https://upe-criativo-servicos.web.app", site: "https://upe-criativo-lp.web.app", teste: 0,
    planos: [{ k: "hospedagem", nome: "Hospedagem", preco: 29.9 }, { k: "ajustes", nome: "Hospedagem + ajustes", preco: 79.9 }],
    extras: [{ k: "essencial", nome: "Criação: landing page essencial", desc: "Até 5 seções, formulário e WhatsApp (pagamento único).", preco: 497 }, { k: "completa", nome: "Criação: landing page completa", desc: "Até 10 seções, copy, SEO e Pixel (pagamento único).", preco: 997 }] },
  sistemas: { nome: "Upe Sistemas", desc: "Agenda online para o cliente marcar horário e dashboards com os números do negócio.", painel: "https://upe-criativo-servicos.web.app", site: "https://upe-criativo-sistemas.web.app", teste: 0,
    planos: [{ k: "agenda", nome: "Agenda no ar", preco: 49.9 }, { k: "dash", nome: "Dashboard no ar", preco: 59.9 }],
    extras: [{ k: "agcriacao", nome: "Criação: agenda online", desc: "Serviços, horários e página (pagamento único).", preco: 697 }, { k: "dashcriacao", nome: "Criação: dashboard sob medida", desc: "Até 8 indicadores e 3 gráficos (pagamento único).", preco: 1200 }] }
};
const APP_IDS = ["erp", "tv", "landing", "sistemas"];
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
  landing: [["Painel Upe Serviços", "Clientes, planos, cobranças, páginas e domínios (Gestão Upe)", "https://upe-criativo-servicos.web.app/#/adm/clientes", true], ["Páginas de todos os clientes", "Editar, publicar ou suspender", "https://upe-criativo-servicos.web.app/#/adm/paginas", true], ["Página de vendas", "Upe Landing pages", "https://upe-criativo-lp.web.app/"], ["Página de exemplo", "upe-criativo-lp.web.app/exemplo", "https://upe-criativo-lp.web.app/exemplo"]],
  sistemas: [["Painel Upe Serviços", "Clientes, planos e cobranças (Gestão Upe)", "https://upe-criativo-servicos.web.app/#/adm/clientes", true], ["Cobranças", "Mensalidades e atrasos", "https://upe-criativo-servicos.web.app/#/adm/cobrancas", true], ["Página de vendas", "Agenda online e dashboards", "https://upe-criativo-sistemas.web.app/"], ["Agenda de exemplo", "Como o cliente final agenda", "https://upe-criativo-sistemas.web.app/exemplo?demo=1"]]
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
    <div class="g4">${APP_IDS.map(k => { const c = cat[k], a = doc.apps[k] || {};
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
    <div class="g4">${APP_IDS.map(k => { const ap = cat[k], a = meus[k], tem = a && a.status && a.status !== "cancelado";
      return `<article class="card grid"><div class="spread"><h3>${esc(ap.nome)}</h3>${tem ? astPill(a.status) : ap.breve ? '<span class="pill">em breve</span>' : ""}</div><p class="muted small">${esc(ap.desc)}</p>
        ${tem ? `<div class="grid" style="gap:2px"><span class="small"><b>Plano:</b> ${esc((ap.planos.find(p => p.k === a.plano) || {}).nome || "—")}</span>${(a.extras || []).length ? `<span class="small"><b>Extras:</b> ${esc(a.extras.map(x => (ap.extras.find(e => e.k === x) || {}).nome || x).join(", "))}</span>` : ""}<span class="small"><b>Mensal:</b> ${brl(valorAdesao(cat, k, a))}${a.status === "teste" && a.fimTeste ? ` · teste grátis até ${fdate(a.fimTeste)}` : a.status === "ativo" ? ` · renova em ${fdate(proxVenc(a))}` : ""}</span>${a.obs ? `<span class="small muted">${esc(a.obs)}</span>` : ""}</div>${ap.painel ? `<a class="btn sec sm" href="${esc(ap.painel)}" target="_blank" rel="noopener" style="justify-self:start">Abrir o ${esc(ap.nome)}</a>` : ""}`
        : ap.breve ? `<button class="btn sec sm" data-quero="${k}" ${pediu(k) ? "disabled" : ""}>${pediu(k) ? "Interesse enviado" : "Quero saber quando lançar"}</button>`
        : `<div class="grid" style="gap:2px">${ap.planos.slice(0, 3).map(p => `<span class="small">${esc(p.nome)} · <b>${+p.preco ? brl(p.preco) + "/mês" : "sob consulta"}</b></span>`).join("")}${ap.teste ? `<span class="small muted">${ap.teste} dias de teste grátis</span>` : ""}</div><button class="btn sm" data-quero="${k}" ${pediu(k) ? "disabled" : ""} style="justify-self:start">${pediu(k) ? "Pedido enviado" : "Quero contratar"}</button>`}
        ${tem && ap.extras.length ? `<details><summary class="small"><b>Pacotes extras</b></summary><div class="grid" style="gap:8px;margin-top:8px">${ap.extras.map(e => { const ja = (a.extras || []).includes(e.k); return `<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span style="flex:1" class="small"><b>${esc(e.nome)}</b> · ${+e.preco ? brl(e.preco) + "/mês" : "sob consulta"}<br><span class="muted">${esc(e.desc || "")}</span></span>${ja ? '<span class="pill ok">Contratado</span>' : `<button class="btn sec sm" data-quero="${k}:${esc(e.k)}" ${pediu(k, e.k) ? "disabled" : ""}>${pediu(k, e.k) ? "Pedido enviado" : "Adicionar"}</button>`}</div>`; }).join("")}</div></details>` : ""}
      </article>`; }).join("")}</div>`;
  $$("[data-quero]", m).forEach(b => b.onclick = async () => { const [app, ex] = b.dataset.quero.split(":"); b.disabled = true;
    await Api.act(c.id, { tipo: "pedido", alvo: `app:${app}${ex ? ":" + ex : ""}`, modo: "app", quantidade: 1, texto: "" }); toast("Pedido enviado. A Upe entra em contato para ativar."); refreshClient(); });
}

/* ===== Modelos editáveis (estilo Canva): Upe ERP, Upe TV, Loja Upe, Upe Landing pages e Upe Sistemas =====
   Usa window.UpeModelos (portal/modelos.js). Cada post guarda os slides em x.modelo para poder ser editado de novo. */
const MBASE = () => (CFG.siteUrl != null ? CFG.siteUrl : "../");
const FRENTE_PILAR = { erp: "Upe ERP", tv: "Upe TV", loja: "Loja Upe", landing: "Landing pages", sistemas: "Upe Sistemas" };
const PILAR_FRENTE = { "Upe ERP": "erp", "Upe TV": "tv", "Loja Upe": "loja" };
async function renderModelo(cv, m) { await UpeModelos.render(cv, m, { base: MBASE() }); return cv; }
// imagem final de um slide: arquivo no Storage (ou no navegador, no modo demonstração) ou JPEG embutido
/* grava os slides animados (entrada dos elementos, 3 s por slide) num vídeo, no próprio navegador */
async function gravarReel(slides, progresso) {
  const tipos = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"], tipo = window.MediaRecorder && tipos.find(t => MediaRecorder.isTypeSupported(t));
  if (!tipo) throw new Error("sem MediaRecorder");
  const cv = document.createElement("canvas"); await UpeModelos.render(cv, slides[0], { base: MBASE(), t: 0 });
  const fps = 30, rec = new MediaRecorder(cv.captureStream(fps), { mimeType: tipo, videoBitsPerSecond: 8e6 }), partes = [];
  rec.ondataavailable = e => e.data.size && partes.push(e.data); const fim = new Promise(ok => rec.onstop = ok); rec.start(250);
  for (const [k, m] of slides.entries()) { progresso(k + 1); const t0 = performance.now();
    for (;;) { const dt = (performance.now() - t0) / 1000; if (dt >= 3) break; await UpeModelos.render(cv, m, { base: MBASE(), t: Math.min(1, dt / 1.65) }); await new Promise(r => requestAnimationFrame(r)); } }
  rec.stop(); await fim;
  const blob = new Blob(partes, { type: tipo.split(";")[0] }), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `upe-${slides[0].frente}-reel.${tipo.includes("mp4") ? "mp4" : "webm"}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  if (!tipo.includes("mp4")) toast("Vídeo salvo em .webm. Para o Instagram, converta para .mp4 (ex.: CapCut) ou use o Safari/Chrome mais novo.");
}
async function exportarSlide(m, nome) {
  const cv = document.createElement("canvas"); await renderModelo(cv, m);
  if (S.mode !== "firebase" || S.st) {
    const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", .9));
    const u = await S.upload(new File([blob], nome + ".jpg", { type: "image/jpeg" }), "cronograma/modelos").catch(() => null); if (u) return u;
  }
  for (const q of [.82, .72, .6]) { const d = cv.toDataURL("image/jpeg", q); if (d.length < 280000 || q === .6) return d; }
}
function aModelos(body, x0 = null) {
  const FR = UpeModelos.FRENTES, LY = UpeModelos.LAYOUTS, FM = UpeModelos.FORMATOS;
  let ed = { slides: x0?.modelo?.length ? clone(x0.modelo) : [UpeModelos.padrao(PILAR_FRENTE[x0?.pilar] || "erp", "capa", x0?.formato === "story" ? "story" : "feed")], i: 0 };
  const cur = () => ed.slides[ed.i];
  body.innerHTML = `${x0 ? `<div class="card" style="background:var(--info-bg)">Editando o post <b>${esc(x0.titulo)}</b>${x0.data ? ` · ${fdate(x0.data)}` : ""}. Ao salvar, as imagens do post são refeitas.</div>` : `<section class="grid" style="gap:10px"><div class="spread"><h3>Comece por um modelo</h3><span class="muted small">Toque em um modelo, edite os textos e a imagem e adicione ao cronograma.</span></div>
      <div class="mgal">${Object.entries(FR).map(([k, f]) => `<div class="mgrp"><div class="row" style="justify-content:space-between"><b>${esc(f.nome)}</b>${f.breve ? '<span class="pill">em breve</span>' : ""}</div><div class="mrow">${f.breve ? `<div class="mbreve">Os modelos das landing pages chegam junto com o app.</div>` : Object.keys(LY).map(l => `<button class="mthumb" data-mt="${k}:${l}" title="${esc(LY[l])}"><canvas data-th="${k}:${l}"></canvas><span>${esc(LY[l])}</span></button>`).join("")}</div></div>`).join("")}</div></section>`}
    <section class="meditor">
      <div class="grid mform" style="gap:10px">
        <div class="g3"><label class="f">Frente<select id="mFr">${Object.entries(FR).map(([k, f]) => `<option value="${k}" ${f.breve ? "disabled" : ""}>${esc(f.nome)}${f.breve ? " (em breve)" : ""}</option>`).join("")}</select></label>
          <label class="f">Formato<select id="mFm">${Object.entries(FM).map(([k, f]) => `<option value="${k}">${esc(f.nome)}</option>`).join("")}</select></label>
          <label class="f">Modelo<select id="mLy">${Object.entries(LY).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select></label></div>
        <div class="g3"><label class="f">Tema<select id="mTe"><option value="escuro">Escuro</option><option value="claro">Claro</option></select></label><label class="f">Rótulo<input id="mEy"></label><label class="f">Marcador (ex.: 2/7)<input id="mSl"></label></div>
        <label class="f">Título<textarea id="mTi" rows="2"></textarea></label>
        <label class="f">Texto<textarea id="mTx" rows="3"></textarea></label>
        <label class="f" id="wIt">Itens da lista (um por linha)<textarea id="mIt" rows="4"></textarea></label>
        <div class="g2"><label class="f">Botão<input id="mCt"></label><label class="f">Assinatura<input id="mHa"></label></div>
        <div class="grid" style="gap:6px" id="wIm"><span class="eb">Imagem</span><div class="row" id="mIms"></div><label class="btn sec sm" style="justify-self:start">Enviar imagem<input type="file" id="mUp" accept="image/*" hidden></label></div>
      </div>
      <div class="grid" style="gap:10px;align-content:start">
        <div class="mprev"><canvas id="mCv"></canvas></div>
        <div class="row" id="mSlides"></div>
        <div class="row"><button class="btn sec sm" id="mAdd">+ Slide</button><button class="btn sec sm" id="mDup">Duplicar slide</button><button class="btn sec sm" id="mDel">Remover slide</button></div>
        <div class="row"><button class="btn sec" id="mDl">Baixar ${ed.slides.length > 1 ? "imagens" : "imagem"}</button><button class="btn sec" id="mVid" title="Grava os slides animados (3 s cada) em vídeo, sem trilha: escolha a música no próprio Instagram">Baixar vídeo (reel)</button>${x0 ? `<button class="btn" id="mSave">Salvar no post</button>` : `<button class="btn" id="mCron">Adicionar ao cronograma</button>`}</div>
      </div>
    </section>`;
  const fill = () => { const m = cur(); $("#mFr").value = m.frente; $("#mFm").value = m.formato; $("#mLy").value = m.layout; $("#mTe").value = m.tema; $("#mEy").value = m.eyebrow || ""; $("#mSl").value = m.slide || ""; $("#mTi").value = m.titulo || ""; $("#mTx").value = m.texto || ""; $("#mIt").value = (m.itens || []).join("\n"); $("#mCt").value = m.cta || ""; $("#mHa").value = m.handle || "";
    $("#wIt").style.display = m.layout === "lista" ? "" : "none"; $("#wIm").style.display = m.layout === "foto" || m.layout === "tela" ? "" : "none";
    const ims = [...new Set([...(FR[m.frente]?.imagens || []), ...(m.imagem ? [m.imagem] : [])])];
    $("#mIms").innerHTML = ims.map(u => `<button class="mimg ${u === m.imagem ? "on" : ""}" data-im="${esc(u)}" aria-label="Usar imagem"><img src="${esc(/^(data:|blob:|https?:)/.test(u) ? u : MBASE() + u)}" alt=""></button>`).join("");
    $$("[data-im]", body).forEach(b => b.onclick = () => { cur().imagem = b.dataset.im; fill(); draw(); });
    $("#mSlides").innerHTML = ed.slides.length > 1 ? ed.slides.map((s, k) => `<button class="chip" data-si="${k}" aria-pressed="${k === ed.i}">${k + 1}</button>`).join("") : "";
    $$("[data-si]", body).forEach(b => b.onclick = () => { ed.i = +b.dataset.si; fill(); draw(); });
    $("#mDl").textContent = ed.slides.length > 1 ? `Baixar ${ed.slides.length} imagens` : "Baixar imagem"; };
  let tdraw = 0; const draw = () => { clearTimeout(tdraw); tdraw = setTimeout(() => renderModelo($("#mCv"), cur()), 60); };
  const read = () => { const m = cur(); Object.assign(m, { frente: $("#mFr").value, formato: $("#mFm").value, layout: $("#mLy").value, tema: $("#mTe").value, eyebrow: $("#mEy").value, slide: $("#mSl").value, titulo: $("#mTi").value, texto: $("#mTx").value, itens: $("#mIt").value.split("\n").map(s => s.trim()).filter(Boolean), cta: $("#mCt").value, handle: $("#mHa").value }); };
  ["#mTe", "#mEy", "#mSl", "#mTi", "#mTx", "#mIt", "#mCt", "#mHa"].forEach(s => $(s).oninput = () => { read(); draw(); });
  $("#mLy").onchange = () => { read(); fill(); draw(); };
  $("#mFm").onchange = () => { const f = $("#mFm").value; ed.slides.forEach(s => s.formato = f); read(); draw(); };
  $("#mFr").onchange = () => { const fr = $("#mFr").value, F = FR[fr]; ed.slides.forEach(s => { if (s.eyebrow === FR[s.frente]?.nome) s.eyebrow = F.nome; if (s.cta === FR[s.frente]?.cta) s.cta = F.cta; if ((FR[s.frente]?.imagens || []).includes(s.imagem)) s.imagem = F.imagens[0] || ""; s.frente = fr; }); fill(); draw(); };
  $("#mUp").onchange = async e => { const f = e.target.files[0]; if (!f) return; const d = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); }); cur().imagem = d; fill(); draw(); };
  $("#mAdd").onclick = () => { read(); const m = cur(); ed.slides.splice(ed.i + 1, 0, { ...UpeModelos.padrao(m.frente, "capa", m.formato), tema: m.tema }); ed.i++; fill(); draw(); };
  $("#mDup").onclick = () => { read(); ed.slides.splice(ed.i + 1, 0, clone(cur())); ed.i++; fill(); draw(); };
  $("#mDel").onclick = () => { if (ed.slides.length < 2) return toast("O post precisa de pelo menos um slide"); ed.slides.splice(ed.i, 1); ed.i = Math.max(0, ed.i - 1); fill(); draw(); };
  $("#mDl").onclick = async () => { read(); for (const [k, m] of ed.slides.entries()) { const cv = document.createElement("canvas"); await renderModelo(cv, m); const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = `upe-${m.frente}-${String(k + 1).padStart(2, "0")}.png`; document.body.append(a); a.click(); a.remove(); } };
  $("#mVid").onclick = async () => { read(); const b = $("#mVid"), t0 = b.textContent; b.disabled = true; try { await gravarReel(ed.slides, k => b.textContent = `Gravando ${k}/${ed.slides.length}…`); } catch (e) { toast("Este navegador não grava vídeo. Use o Chrome ou o Safari atualizados."); } b.disabled = false; b.textContent = t0; };
  const gerar = async (btn, id) => { btn.disabled = true; const out = []; for (const [k, m] of ed.slides.entries()) { btn.textContent = `Gerando ${k + 1}/${ed.slides.length}…`; out.push(await exportarSlide(m, `${id}-${k + 1}`)); } return out; };
  if ($("#mSave")) $("#mSave").onclick = async () => { read(); const midias = await gerar($("#mSave"), x0.id); const x = state.cache.crono.find(y => y.id === x0.id) || x0;
    Object.assign(x, { modelo: clone(ed.slides), midias: x.formato === "reels" ? x.midias : midias, capa: x.formato === "reels" ? midias[0] : x.capa }); await S.set(`cronograma/${x.id}`, x); toast("Post atualizado"); reAdmin(); };
  if ($("#mCron")) $("#mCron").onclick = () => { read(); const m = ed.slides[0];
    modal("Adicionar ao cronograma", `<div class="g3"><label class="f">Data<input id="acD" type="date" value="${addDays(todayIso(), 1)}"></label><label class="f">Hora<input id="acH" type="time" value="12:00"></label><label class="f">Formato<select id="acF">${["feed", "carrossel", "story"].map(f => `<option value="${f}" ${(m.formato === "story" ? "story" : ed.slides.length > 1 ? "carrossel" : "feed") === f ? "selected" : ""}>${FMT_LBL[f]}</option>`).join("")}</select></label></div>
      <label class="f">Título<input id="acT" value="${esc(String(m.titulo || "").split("\n")[0].slice(0, 90))}"></label><label class="f">Legenda<textarea id="acL" rows="5">${esc([m.titulo, m.texto].filter(Boolean).join("\n\n"))}</textarea></label>`,
      `<button class="btn sec" data-close>Cancelar</button><button class="btn" id="acOk">Adicionar</button>`);
    $("#acOk").onclick = async () => { const id = "upe-" + uid(8), midias = await gerar($("#acOk"), id);
      const it = { id, data: $("#acD").value, hora: $("#acH").value, canal: "instagram", formato: $("#acF").value, pilar: FRENTE_PILAR[m.frente] || "Upe ERP", titulo: $("#acT").value.trim() || "Post", legenda: $("#acL").value, roteiro: "", midias, capa: "", status: "pronto", origem: "Modelo editável", modelo: clone(ed.slides) };
      await S.set(`cronograma/${id}`, it); dlg.close(); toast("Post adicionado ao cronograma"); go("#/admin/cronograma/instagram"); }; };
  $$("[data-mt]", body).forEach(b => b.onclick = () => { const [fr, l] = b.dataset.mt.split(":"); ed = { slides: [UpeModelos.padrao(fr, l, $("#mFm").value || "feed")], i: 0 }; fill(); draw(); $(".meditor").scrollIntoView({ behavior: "smooth", block: "start" }); });
  // miniaturas da galeria (desenhadas aos poucos)
  (async () => { for (const c of $$("[data-th]", body)) { const [fr, l] = c.dataset.th.split(":"); await renderModelo(c, { ...UpeModelos.padrao(fr, l, "feed"), titulo: { capa: "Título forte", foto: "Imagem e texto", tela: "Tela do app", lista: "Lista", cta: "Chamada final" }[l] }); } })();
  fill(); draw();
}

/* ---------------- início ---------------- */
(async () => {
  try { await S.init(); }
  catch (e) { app.innerHTML = `<div class="gate"><div class="box"><div class="logo">${WM}</div><h1>Não foi possível conectar</h1><p>${esc(e.message)}</p></div></div>`; return; }
  route();
})();
})();
