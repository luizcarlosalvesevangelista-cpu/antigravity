/* ===== Modelos editáveis (estilo Canva): Upe ERP, Upe TV, Loja Upe e Landing pages (em breve) =====
   Usa window.UpeModelos (portal/modelos.js). Cada post guarda os slides em x.modelo para poder ser editado de novo. */
const MBASE = () => (CFG.siteUrl != null ? CFG.siteUrl : "../");
const FRENTE_PILAR = { erp: "Upe ERP", tv: "Upe TV", loja: "Loja Upe", landing: "Landing pages" };
const PILAR_FRENTE = { "Upe ERP": "erp", "Upe TV": "tv", "Loja Upe": "loja" };
async function renderModelo(cv, m) { await UpeModelos.render(cv, m, { base: MBASE() }); return cv; }
// imagem final de um slide: arquivo no Storage (ou no navegador, no modo demonstração) ou JPEG embutido
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
        <div class="row"><button class="btn sec" id="mDl">Baixar ${ed.slides.length > 1 ? "imagens" : "imagem"}</button>${x0 ? `<button class="btn" id="mSave">Salvar no post</button>` : `<button class="btn" id="mCron">Adicionar ao cronograma</button>`}</div>
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
