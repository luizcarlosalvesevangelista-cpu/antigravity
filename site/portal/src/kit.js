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
