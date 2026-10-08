/* Agenda online: reservas, serviços, horários e página pública de agendamento (upe-criativo-sistemas.web.app/<endereço>). */
import { db, S, $, $$, toast, dialogo, botoesDlg, pill, vazio, topo, fmtData, agendaDoCliente, ctx } from "./nucleo.js";
import { SITES, esc, brl, hoje, slugify, uid } from "./srv.js";

export const views = {};
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const min = h => { const [a, b] = String(h).split(":").map(Number); return a * 60 + (b || 0); }, hhmm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
export const AG_PADRAO = { ativo: true, cor: "#1f6f5c", boasVindas: "Escolha o serviço, o dia e o horário. Você recebe a confirmação pelo WhatsApp.", endereco: "", intervalo: 30, antecedenciaH: 2, diasFrente: 30,
  servicos: [{ id: "s1", nome: "Avaliação", dur: 30, preco: 0 }], horarios: { 0: [], 1: [["09:00", "18:00"]], 2: [["09:00", "18:00"]], 3: [["09:00", "18:00"]], 4: [["09:00", "18:00"]], 5: [["09:00", "18:00"]], 6: [["09:00", "13:00"]] }, folgas: [] };
/* ids dos espaços que um atendimento ocupa (um a cada "intervalo" minutos) */
export const slotsDe = (data, hora, dur, intervalo) => { const out = []; for (let m = min(hora); m < min(hora) + Math.max(dur, intervalo); m += intervalo) out.push(data + "_" + hhmm(m).replace(":", "")); return out; };
const ST = { nova: pill("warn", "A confirmar"), confirmada: pill("ok", "Confirmada"), cancelada: pill("", "Cancelada"), concluida: pill("info", "Atendida"), faltou: pill("crit", "Não veio") };

views.agenda = async (M, aba = "reservas") => {
  let ag = await agendaDoCliente();
  if (!ag) {
    M.innerHTML = topo("Agenda online") + `<section class="card"><h3>Criar a sua agenda</h3><p class="muted">Em um minuto a sua página de agendamento fica pronta. Depois é só ajustar serviços e horários.</p>
      <form class="form" id="fNova" style="max-width:480px"><label class="f">Nome que aparece na página<input name="nome" required value="${esc(S.cliente?.nome || "")}"></label>
      <label class="f">Endereço da página<input name="slug" required pattern="[a-z0-9][a-z0-9-]{1,47}" value="${esc(slugify(S.cliente?.nome || ""))}"></label>
      <label class="f">WhatsApp para confirmações (com 55 e DDD)<input name="whatsapp" inputmode="numeric" value="${esc((S.cliente?.whatsapp || "").replace(/\D/g, ""))}"></label><button class="btn azul">Criar agenda</button></form></section>`;
    $("#fNova").onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target), slug = slugify(f.get("slug"));
      if (await db.get("agenda_paginas/" + slug)) return toast("Esse endereço já está em uso.");
      await db.set("agenda_paginas/" + slug, { ...AG_PADRAO, cid: S.cid, nome: String(f.get("nome")).trim(), whatsapp: String(f.get("whatsapp")).replace(/\D/g, ""), criadoEm: Date.now() }); toast("Agenda criada."); ctx.rota(); };
    return;
  }
  const url = `${SITES.sistemas}/${ag.id}`;
  M.innerHTML = topo("Agenda online", `${ag.ativo ? pill("ok", "Recebendo agendamentos") : pill("warn", "Pausada")}<a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener">Abrir página ↗</a>`) +
    `<div class="abas" role="tablist">${[["reservas", "Agendamentos"], ["servicos", "Serviços"], ["horarios", "Horários"], ["pagina", "Página e link"]].map(([k, t]) => `<button role="tab" type="button" aria-selected="${k === aba}" data-ir="#/agenda/${k}">${t}</button>`).join("")}</div><div id="corpo"></div>`;
  const C = $("#corpo"), salvar = async (parcial, msg = "Salvo.") => { Object.assign(ag, parcial); const { id, ...d } = ag; await db.set("agenda_paginas/" + ag.id, d); toast(msg); };

  if (aba === "reservas") {
    const desde = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const rs = (await db.list(`agenda_paginas/${ag.id}/reservas`, { where: [["data", ">=", desde]] })).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    const prox = rs.filter(r => r.data >= hoje()), pass = rs.filter(r => r.data < hoje()).reverse();
    const linha = r => { const n = String(r.telefone || "").replace(/\D/g, ""), wa = n.length >= 10 ? (n.length <= 11 ? "55" + n : n) : "";
      const msg = encodeURIComponent(`Olá, ${String(r.nome || "").split(" ")[0]}! Seu horário de ${r.servico} está confirmado para ${fmtData(r.data)} às ${r.hora}. ${ag.nome}`);
      return `<tr><td class="num"><b>${esc(r.hora)}</b></td><td><b>${esc(r.nome)}</b><br><span class="muted">${esc(r.servico)} · ${esc(r.dur)} min</span>${r.obs ? `<br><span class="muted">“${esc(r.obs)}”</span>` : ""}</td><td>${ST[r.status] || esc(r.status)}</td>
        <td><div class="linha">${r.status === "nova" ? `<button class="btn sm azul" type="button" data-acao="confirmada" data-id="${esc(r.id)}">Confirmar</button>` : ""}${wa ? `<a class="btn sm" href="https://wa.me/${wa}?text=${msg}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
        ${r.status !== "cancelada" && r.data >= hoje() ? `<button class="btn sm perigo" type="button" data-acao="cancelada" data-id="${esc(r.id)}">Cancelar</button>` : ""}
        ${r.data <= hoje() && ["nova", "confirmada"].includes(r.status) ? `<button class="btn sm" type="button" data-acao="concluida" data-id="${esc(r.id)}">Atendida</button><button class="btn sm" type="button" data-acao="faltou" data-id="${esc(r.id)}">Não veio</button>` : ""}</div></td></tr>`; };
    const grupo = lista => { const por = {}; lista.forEach(r => (por[r.data] = por[r.data] || []).push(r)); return Object.entries(por).map(([d, l]) => `<h4 style="margin:14px 0 4px">${d === hoje() ? "Hoje" : DIAS[new Date(d + "T12:00").getDay()]}, ${fmtData(d)} <span class="muted">· ${l.filter(r => r.status !== "cancelada").length} agendamentos</span></h4><div class="rolar"><table class="tabela"><tbody>${l.map(linha).join("")}</tbody></table></div>`).join(""); };
    C.innerHTML = `<section class="card"><div class="card-h"><h3>Próximos agendamentos</h3><button class="btn sm azul" type="button" id="novoAg">+ Agendar manualmente</button></div>${prox.length ? grupo(prox) : vazio("Nenhum agendamento à frente. Divulgue o link da página na bio e no WhatsApp.")}</section>
      ${pass.length ? `<section class="card"><h3>Últimos 7 dias</h3>${grupo(pass)}</section>` : ""}`;
    $$("[data-acao]").forEach(b => b.onclick = async () => {
      const r = rs.find(x => x.id === b.dataset.id), st = b.dataset.acao;
      if (st === "cancelada" && !confirm(`Cancelar o horário de ${r.nome}? O horário volta a ficar livre na página.`)) return;
      await db.set(`agenda_paginas/${ag.id}/reservas/${r.id}`, { status: st, atualizadoEm: Date.now() }, { merge: true });
      if (st === "cancelada") for (const s of r.slots || [r.id]) await db.del(`agenda_paginas/${ag.id}/slots/${s}`);
      toast("Atualizado."); ctx.rota();
    });
    $("#novoAg").onclick = () => dialogo(`<h3>Agendar manualmente</h3>
      <label class="f">Serviço<select name="servico">${ag.servicos.map(s => `<option value="${esc(s.id)}">${esc(s.nome)} · ${s.dur} min</option>`).join("")}</select></label>
      <div class="grid2"><label class="f">Dia<input type="date" name="data" required value="${hoje()}"></label><label class="f">Horário<input type="time" name="hora" required step="${ag.intervalo * 60}"></label></div>
      <label class="f">Nome<input name="nome" required></label><label class="f">Telefone<input name="telefone" inputmode="tel"></label>${botoesDlg("Agendar")}`, async fd => {
      const sv = ag.servicos.find(s => s.id === fd.get("servico")), data = fd.get("data"), hora = fd.get("hora"), sl = slotsDe(data, hora, sv.dur, ag.intervalo);
      try { await db.batch([...sl.map(s => ({ create: [`agenda_paginas/${ag.id}/slots/${s}`, { data, hora: s.slice(11), r: sl[0] }] })), { set: [`agenda_paginas/${ag.id}/reservas/${sl[0]}`, { servico: sv.nome, data, hora, dur: sv.dur, nome: String(fd.get("nome")).trim(), telefone: String(fd.get("telefone")), email: "", obs: "Agendado pelo painel", status: "nova", t: Date.now(), slots: sl }] }]); }
      catch { toast("Esse horário já está ocupado."); return false; }
      await db.set(`agenda_paginas/${ag.id}/reservas/${sl[0]}`, { status: "confirmada" }, { merge: true }); toast("Agendado."); ctx.rota();
    });
  }
  if (aba === "servicos") {
    const pinta = () => { C.innerHTML = `<section class="card"><div class="card-h"><h3>Serviços</h3><button class="btn sm azul" type="button" id="addSv">+ Serviço</button></div>
      <div class="rolar"><table class="tabela"><thead><tr><th>Serviço</th><th>Duração (min)</th><th>Preço (R$)</th><th></th></tr></thead><tbody>${ag.servicos.map((s, i) => `<tr>
        <td><input class="in-txt" data-i="${i}" data-k="nome" value="${esc(s.nome)}" maxlength="60"></td><td><input class="in-txt" type="number" min="5" step="5" data-i="${i}" data-k="dur" value="${s.dur}" style="width:100px"></td>
        <td><input class="in-txt" type="number" min="0" step="0.01" data-i="${i}" data-k="preco" value="${s.preco}" style="width:120px"></td><td><button class="btn sm perigo" type="button" data-rm="${i}" ${ag.servicos.length < 2 ? "disabled" : ""}>Remover</button></td></tr>`).join("")}</tbody></table></div>
      <div class="linha"><button class="btn azul" type="button" id="svSalvar">Salvar serviços</button><span class="muted">Preço 0 aparece como “a combinar”.</span></div></section>`;
      $$("[data-k]", C).forEach(i => i.oninput = () => { const s = ag.servicos[i.dataset.i]; s[i.dataset.k] = i.type === "number" ? +i.value : i.value; });
      $$("[data-rm]", C).forEach(b => b.onclick = () => { ag.servicos.splice(+b.dataset.rm, 1); pinta(); });
      $("#addSv").onclick = () => { ag.servicos.push({ id: uid(6), nome: "Novo serviço", dur: ag.intervalo, preco: 0 }); pinta(); };
      $("#svSalvar").onclick = () => salvar({ servicos: ag.servicos.filter(s => s.nome.trim()) }, "Serviços salvos."); };
    pinta();
  }
  if (aba === "horarios") {
    C.innerHTML = `<section class="card form"><h3>Horários de atendimento</h3>
      <div class="rolar"><table class="tabela"><tbody>${DIAS.map((d, i) => { const h = (ag.horarios[i] || [])[0]; return `<tr><td><label class="chk"><input type="checkbox" data-dia="${i}" ${h ? "checked" : ""}> ${d}</label></td>
        <td><div class="linha"><input class="in-txt" type="time" data-ini="${i}" value="${h ? h[0] : "09:00"}" style="width:130px"> até <input class="in-txt" type="time" data-fim="${i}" value="${h ? h[1] : "18:00"}" style="width:130px"></div></td></tr>`; }).join("")}</tbody></table></div>
      <div class="grid3"><label class="f">Agendar de quanto em quanto tempo<select id="hInt">${[15, 20, 30, 45, 60].map(m => `<option value="${m}" ${ag.intervalo === m ? "selected" : ""}>${m} minutos</option>`).join("")}</select></label>
        <label class="f">Antecedência mínima (horas)<input class="in-txt" type="number" min="0" id="hAnt" value="${ag.antecedenciaH}"></label>
        <label class="f">Mostrar quantos dias à frente<input class="in-txt" type="number" min="1" max="120" id="hDias" value="${ag.diasFrente}"></label></div>
      <label class="f">Folgas e feriados (um dia por linha, AAAA-MM-DD)<textarea class="in-txt" id="hFolgas" rows="3">${esc((ag.folgas || []).join("\n"))}</textarea></label>
      <button class="btn azul" type="button" id="hSalvar" style="justify-self:start">Salvar horários</button></section>`;
    $("#hSalvar").onclick = () => { const hs = {}; DIAS.forEach((_, i) => { hs[i] = $(`[data-dia="${i}"]`).checked ? [[$(`[data-ini="${i}"]`).value, $(`[data-fim="${i}"]`).value]] : []; });
      if (Object.values(hs).some(l => l[0] && min(l[0][1]) <= min(l[0][0]))) return toast("O fim do expediente precisa ser depois do início.");
      salvar({ horarios: hs, intervalo: +$("#hInt").value, antecedenciaH: +$("#hAnt").value, diasFrente: +$("#hDias").value, folgas: $("#hFolgas").value.split(/\s+/).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) }, "Horários salvos."); };
  }
  if (aba === "pagina") {
    C.innerHTML = `<div class="grid2"><section class="card form"><h3>Página de agendamento</h3>
      <label class="chk"><input type="checkbox" id="pAtivo" ${ag.ativo ? "checked" : ""}> Recebendo agendamentos</label>
      <label class="f">Nome<input class="in-txt" id="pNome" value="${esc(ag.nome)}"></label>
      <label class="f">Texto de boas-vindas<textarea class="in-txt" id="pBv" rows="3" maxlength="300">${esc(ag.boasVindas || "")}</textarea></label>
      <label class="f">Endereço do local (opcional)<input class="in-txt" id="pEnd" value="${esc(ag.endereco || "")}"></label>
      <label class="f">WhatsApp para confirmações<input class="in-txt" id="pWa" value="${esc(ag.whatsapp || "")}" inputmode="numeric"></label>
      <label class="f">Cor da página<input type="color" id="pCor" value="${esc(ag.cor || "#1f6f5c")}"></label>
      <button class="btn azul" type="button" id="pSalvar" style="justify-self:start">Salvar</button></section>
      <section class="card"><h3>Link para divulgar</h3><code class="end" style="font-size:15px">${esc(url)}</code>
        <div class="linha"><button class="btn sm" type="button" id="pCopiar">Copiar link</button><a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener">Abrir ↗</a></div>
        <p class="muted">Coloque na bio do Instagram, no Google Meu Negócio e na mensagem automática do WhatsApp.</p><div id="qr" style="background:#fff;padding:10px;border-radius:10px;justify-self:start"></div></section></div>`;
    $("#pSalvar").onclick = () => salvar({ ativo: $("#pAtivo").checked, nome: $("#pNome").value.trim(), boasVindas: $("#pBv").value.trim(), endereco: $("#pEnd").value.trim(), whatsapp: $("#pWa").value.replace(/\D/g, ""), cor: $("#pCor").value });
    $("#pCopiar").onclick = () => navigator.clipboard.writeText(url).then(() => toast("Link copiado."));
    const qr = () => new window.QRCode($("#qr"), { text: url, width: 160, height: 160 });
    if (window.QRCode) qr(); else { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; sc.onload = qr; sc.onerror = () => $("#qr")?.remove(); document.head.append(sc); }
  }
};
