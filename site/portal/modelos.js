/* Modelos editáveis de post (estilo Canva) das frentes da Upe: Upe ERP, Upe TV, Loja Upe (e Landing pages, em breve).
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
      imagens: ["assets/img/ui/erp-pedidos.jpg", "assets/img/ui/erp-painel.jpg", "assets/img/ui/erp-pdv.jpg"] },
    landing: { nome: "Upe Landing pages", chip: "LANDING PAGES", breve: true, base: "#3a2f6b", escuro: "#1d1738", destaque: "#c9b8ff", creme: "#f3f0fa", tinta: "#1d1738", cta: "Em breve", rodape: "Páginas de venda com a sua marca", imagens: [] }
  };
  const FORMATOS = { feed: { nome: "Feed 4:5", w: 1080, h: 1350 }, story: { nome: "Story / Reels 9:16", w: 1080, h: 1920 }, quadrado: { nome: "Quadrado 1:1", w: 1080, h: 1080 } };
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
    const M = 88, story = H > 1500;
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
      const fy = y + slideUp(a3) * 2, fw = W - M * 2 + 40, fx = M - 20, fh = Math.min(H - fy - (story ? 300 : 190), img ? fw * img.height / img.width + 46 : fw * .62);
      ctx.save(); ctx.globalAlpha = a3; ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20; rr(ctx, fx, fy, fw, fh, 26); ctx.fillStyle = "#e9edf3"; ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = a3; rr(ctx, fx, fy, fw, fh, 26); ctx.clip(); ctx.fillStyle = "#dfe4ec"; ctx.fillRect(fx, fy, fw, 46); ["#ff6159", "#ffbd2e", "#28c941"].forEach((c, i) => { ctx.beginPath(); ctx.arc(fx + 30 + i * 26, fy + 23, 8, 0, 7); ctx.fillStyle = c; ctx.fill(); });
      capaImg(ctx, img, fx, fy + 46, fw, fh - 46, 1 + (t == null ? 0 : (1 - t) * .05)); ctx.restore();
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
      let y = H * (story ? .3 : .24); y += ey(y);
      y += texto(ctx, m.titulo, M, y, W - M * 2, { size: story ? 120 : 104, min: 50, cor: fg, maxL: 4, alpha: a2, dy: slideUp(a2) }).h + 30;
      if (m.texto) y += texto(ctx, m.texto, M, y, W - M * 2, { size: 42, min: 30, peso: 400, cor: sub, maxL: 3, lh: 1.3, alpha: a3 }).h + 50;
      if (m.cta) botao(ctx, m.cta, M, y, F, escuro, a4);
      rodape(); return canvas;
    }
    // capa (padrão)
    let y = topoY + (story ? 260 : 170); y += ey(y);
    const tt = texto(ctx, m.titulo, M, y, W - M * 2, { size: story ? 132 : 112, min: 54, cor: fg, maxL: story ? 5 : 4, alpha: a2, dy: slideUp(a2) }); y += tt.h + 34;
    ctx.save(); ctx.globalAlpha = a3; rr(ctx, M, y, 150 * a3, 12, 6); ctx.fillStyle = escuro ? F.destaque : F.base; ctx.fill(); ctx.restore(); y += 58;
    if (m.texto) texto(ctx, m.texto, M, y, W - M * 2, { size: 44, min: 30, peso: 400, cor: sub, maxL: story ? 6 : 4, lh: 1.32, alpha: a4 });
    if (m.cta) botao(ctx, m.cta, M, H - (story ? 340 : 240), F, escuro, a5);
    rodape(); return canvas;
  }
  window.UpeModelos = { FRENTES, FORMATOS, LAYOUTS, padrao, render, loadImg };
})();
