/* Conta do cliente: plano de criação, mensalidade, cobranças (PIX copia e cola + “já paguei”) e pedidos de ajuste à Upe. */
import { db, S, $, $$, toast, dialogo, botoesDlg, pill, vazio, topo, fmtData, fmtDH, mesNome, pixCode, statusMensal, paginasDoCliente, tem, ctx } from "./nucleo.js";
import { WHATS, FRENTES, esc, brl, hoje, API, tokenUsuario } from "./srv.js";

export const views = {};
export const stCob = c => c.status === "paga" ? pill("ok", "Paga") : c.status === "informada" ? pill("info", "Pagamento informado") : c.status === "cancelada" ? pill("", "Cancelada") : c.venc < hoje() ? pill("crit", "Vencida") : pill("warn", "Em aberto");
export const stCham = s => ({ aberto: pill("warn", "Aguardando a Upe"), respondido: pill("info", "Respondido"), resolvido: pill("ok", "Resolvido") })[s] || pill("", s);

views.conta = async M => {
  const c = S.cliente, cobs = (await db.list(`srv_clientes/${S.cid}/cobrancas`)).sort((a, b) => (b.venc || "").localeCompare(a.venc || ""));
  const cr = c.plano?.criacao || {}, m = c.plano?.mensal || {}, pix = S.cfg?.pixChave;
  M.innerHTML = topo("Plano e cobranças") + `<div class="grid2">
    <section class="card"><h3>Criação</h3>${cr.nome ? `<p><b style="font-size:17px">${esc(cr.nome)}</b></p><p>${brl(cr.valor)}${cr.parcelas > 1 ? ` em ${cr.parcelas}x` : ""} · ${cr.status === "pago" ? pill("ok", "Pago") : pill("warn", "Pagamento pendente")}</p>${cr.prazo ? `<p class="muted">Entrega prevista: ${fmtData(cr.prazo)}</p>` : ""}` : `<p class="muted">Sem plano de criação.</p>`}</section>
    <section class="card"><h3>Mensalidade</h3>${m.nome ? `<p><b style="font-size:17px">${esc(m.nome)}</b> ${statusMensal(m.status)}</p><p>${brl(m.valor)} por mês · vence todo dia ${esc(m.dia || 10)}</p>${m.status === "teste" && m.fimTeste ? `<p class="muted">Teste grátis até ${fmtData(m.fimTeste)}.</p>` : ""}` : `<p class="muted">Sem mensalidade.</p>`}
      <p class="muted" style="font-size:12.5px">Serviços: ${(c.frentes || []).map(f => FRENTES[f] || f).join(", ") || "—"}. Para mudar de plano, fale com a Upe.</p></section></div>
    <section class="card"><h3>Cobranças</h3>${cobs.length ? `<div class="rolar"><table class="tabela"><thead><tr><th>Referente a</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th></th></tr></thead><tbody>
      ${cobs.map(x => `<tr><td>${esc(x.descricao || (x.tipo === "mensalidade" ? "Mensalidade " + mesNome(x.ref) : "Criação"))}</td><td class="num">${fmtData(x.venc)}</td><td class="num">${brl(x.valor)}</td><td>${stCob(x)}</td>
      <td>${["aberta"].includes(x.status) ? `<div class="linha">${pix || S.recursos?.gateway ? `<button class="btn sm azul" type="button" data-pix="${esc(x.id)}">Pagar com PIX</button>` : `<a class="btn sm azul" target="_blank" rel="noopener" href="https://wa.me/${WHATS}?text=${encodeURIComponent(`Olá! Quero pagar: ${x.descricao || "cobrança"} (${brl(x.valor)}).`)}">Pagar pelo WhatsApp</a>`}<button class="btn sm" type="button" data-ja="${esc(x.id)}">Já paguei</button></div>` : ""}</td></tr>`).join("")}</tbody></table></div>` : vazio("Nenhuma cobrança por enquanto.")}</section>`;
  $$("[data-pix]").forEach(b => b.onclick = async () => { const x = cobs.find(y => y.id === b.dataset.pix);
    if (S.recursos?.gateway) {   // PIX dinâmico pelo Mercado Pago: confirma o pagamento sozinho (plano Blaze)
      b.disabled = true; try { const r = await fetch(API + "/pix", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + await tokenUsuario() }, body: JSON.stringify({ cid: S.cid, cobranca: x.id }) }), j = await r.json(); b.disabled = false;
        if (r.ok && j.copiaCola) return dialogo(`<h3>Pagar com PIX</h3><p><b>${esc(x.descricao || "Cobrança")}</b> · ${brl(x.valor)}</p>${j.qr ? `<img src="data:image/png;base64,${j.qr}" alt="QR Code PIX" style="width:200px;height:200px;justify-self:center">` : ""}<label class="f">PIX copia e cola<textarea class="in-txt" rows="4" readonly>${esc(j.copiaCola)}</textarea></label><p class="muted">O pagamento é confirmado sozinho em poucos minutos.</p><div class="linha" style="justify-content:flex-end"><button class="btn" type="button" id="cpPix2">Copiar código</button><button class="btn azul" value="cancelar">Fechar</button></div>`, async () => {}, () => { $("#cpPix2").onclick = () => navigator.clipboard.writeText(j.copiaCola).then(() => toast("Código copiado.")); });
      } catch (e) { b.disabled = false; } toast("PIX automático indisponível agora; use o PIX abaixo."); }
    if (!S.cfg?.pixChave) return open(`https://wa.me/${WHATS}?text=${encodeURIComponent(`Olá! Quero pagar: ${x.descricao || "cobrança"} (${brl(x.valor)}).`)}`, "_blank", "noopener");
    const cod = pixCode(S.cfg, x.valor, "UPE" + x.id.replace(/[^A-Za-z0-9]/g, "").slice(-20));
    dialogo(`<h3>Pagar com PIX</h3><p><b>${esc(x.descricao || "Cobrança")}</b> · ${brl(x.valor)}</p><div id="qrPix" style="background:#fff;padding:10px;border-radius:10px;justify-self:center"></div>
      <label class="f">PIX copia e cola<textarea class="in-txt" rows="4" readonly>${esc(cod)}</textarea></label><p class="muted">Para ${esc(S.cfg.pixNome || "Upe Criativo")}. Depois de pagar, toque em “Já paguei”.</p>
      <div class="linha" style="justify-content:flex-end"><button class="btn" type="button" id="cpPix">Copiar código</button><button class="btn azul" value="cancelar">Fechar</button></div>`, async () => {}, () => {
      $("#cpPix").onclick = () => navigator.clipboard.writeText(cod).then(() => toast("Código copiado."));
      const q = () => new window.QRCode($("#qrPix"), { text: cod, width: 180, height: 180 });
      if (window.QRCode) q(); else { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; s.onload = q; s.onerror = () => $("#qrPix")?.remove(); document.head.append(s); } }); });
  $$("[data-ja]").forEach(b => b.onclick = () => dialogo(`<h3>Informar pagamento</h3><p class="muted">A Upe confere e marca como paga em até 1 dia útil.</p><label class="f">Observação (opcional)<input name="obs" maxlength="300" placeholder="Ex.: paguei pelo PIX da conta da empresa"></label>${botoesDlg("Informar")}`, async fd => {
    await db.set(`srv_clientes/${S.cid}/cobrancas/${b.dataset.ja}`, { status: "informada", informadoEm: Date.now(), obsCliente: String(fd.get("obs") || "") }, { merge: true }); toast("Obrigado! A Upe vai conferir."); ctx.rota(); }));
};

views.chamados = async (M, id) => {
  const ls = (await db.list(`srv_clientes/${S.cid}/chamados`)).sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
  M.innerHTML = topo("Pedidos de ajuste", `<button class="btn azul" type="button" id="novoCh">+ Novo pedido</button>`) +
    `<section class="card">${ls.length ? ls.map(ch => thread(ch, false)).join("") : vazio("Peça aqui mudanças nas suas páginas, na agenda ou no dashboard. A Upe responde por aqui.")}</section>`;
  ligarThreads(M, ls, `srv_clientes/${S.cid}/chamados`, "cliente");
  const pg = tem("lp") ? await paginasDoCliente() : [];
  $("#novoCh").onclick = () => dialogo(`<h3>Novo pedido de ajuste</h3><label class="f">Assunto<input name="assunto" required maxlength="100" placeholder="Ex.: Trocar fotos da seção de depoimentos"></label>
    ${pg.length ? `<label class="f">Página (opcional)<select name="pagina"><option value="">—</option>${pg.map(p => `<option value="${esc(p.id)}">${esc(p.titulo || p.id)}</option>`).join("")}</select></label>` : ""}
    <label class="f">Descreva o que precisa<textarea name="texto" required rows="5" maxlength="2000"></textarea></label><p class="muted" style="font-size:12.5px">Para enviar fotos, cole links (Google Drive, WeTransfer) no texto.</p>${botoesDlg("Enviar pedido")}`, async fd => {
    const agora = Date.now(); await db.add(`srv_clientes/${S.cid}/chamados`, { cid: S.cid, cliente: S.cliente?.nome || "", assunto: String(fd.get("assunto")).trim(), pagina: fd.get("pagina") || "", status: "aberto", criadoEm: agora, atualizadoEm: agora, msgs: [{ de: "cliente", txt: String(fd.get("texto")).trim(), em: agora, autor: S.user?.email || "" }] });
    toast("Pedido enviado à Upe."); ctx.rota(); });
};
export function thread(ch, admin) {
  return `<details class="card" style="box-shadow:none" ${ch.status !== "resolvido" ? "open" : ""}><summary class="card-h" style="cursor:pointer"><b>${esc(ch.assunto)}</b><span class="linha">${admin ? `<span class="muted">${esc(ch.cliente || "")}</span>` : ""}${stCham(ch.status)}<span class="muted num">${fmtDH(ch.atualizadoEm)}</span></span></summary>
    <div style="display:grid;gap:8px">${(ch.msgs || []).map(m => `<div style="padding:10px 12px;border-radius:10px;background:${m.de === "upe" ? "var(--info-bg)" : "var(--bg)"}"><span class="eyebrow">${m.de === "upe" ? "Upe Criativo" : "Cliente"} · ${fmtDH(m.em)}</span><p style="white-space:pre-wrap">${esc(m.txt)}</p></div>`).join("")}
    <form class="linha" data-resp="${esc(ch.id)}" data-path="${esc(ch._path || "")}"><input class="in-txt" name="txt" required maxlength="2000" placeholder="Escreva uma resposta" style="flex:1;min-width:200px"><button class="btn sm azul">Enviar</button>${ch.status !== "resolvido" ? `<button class="btn sm" type="button" data-resolver="${esc(ch.id)}">Marcar como resolvido</button>` : ""}</form></div></details>`;
}
export function ligarThreads(M, ls, base, de) {
  $$("[data-resp]", M).forEach(f => f.onsubmit = async e => { e.preventDefault(); const ch = ls.find(x => x.id === f.dataset.resp), txt = f.txt.value.trim(); if (!txt) return; const agora = Date.now(), caminho = f.dataset.path || `${base}/${ch.id}`;
    await db.set(caminho, { msgs: [...(ch.msgs || []), { de, txt, em: agora, autor: S.user?.email || "" }], status: de === "upe" ? "respondido" : "aberto", atualizadoEm: agora }, { merge: true }); toast("Resposta enviada."); ctx.rota(); });
  $$("[data-resolver]", M).forEach(b => b.onclick = async () => { const ch = ls.find(x => x.id === b.dataset.resolver); await db.set(ch._path || `${base}/${ch.id}`, { status: "resolvido", atualizadoEm: Date.now() }, { merge: true }); toast("Marcado como resolvido."); ctx.rota(); });
}
