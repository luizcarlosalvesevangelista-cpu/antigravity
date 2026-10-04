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
    const n = document.createElement("div"); n.className = "vnote"; n.innerHTML = `Se o vídeo não tocar aqui, <a href="${esc(t.getAttribute("src") || "")}" target="_blank" rel="noopener" download>abra ou baixe o arquivo</a>.`; t.after(n); return; }
  const d = document.createElement("div"); d.className = "miss"; d.textContent = "Arquivo não encontrado · " + nome;
  t.replaceWith(d);
}, true);
const dlBtn = (url, label = "Baixar") => resolveMedia(url) ? `<a class="btn sec sm" href="${esc(resolveMedia(url))}" download="${esc(fileName(url))}" target="_blank" rel="noopener">${label}</a>` : "";
const imgTag = u => `<img src="${esc(resolveMedia(u))}" alt="" loading="lazy">`;
const capaDe = x => x.capa || ((x.midias || []).find(u => kind(u) === "img") || "");
const fileName = u => decodeURIComponent(String(u || "").split("?")[0].split("/").pop() || "arquivo");

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
  const fresh = items.filter(n => n.lembrete ? !dia : n.em > seen);
  host.innerHTML = `<div class="bellw"><button class="bellb" id="bellBtn" aria-label="Notificações${fresh.length ? `: ${fresh.length} novas` : ""}" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>${fresh.length ? `<span class="bellc">${fresh.length > 99 ? "99+" : fresh.length}</span>` : ""}</button>
    <div class="bellp hide" id="bellP" role="dialog" aria-label="Notificações"><div class="spread" style="padding:12px 14px;border-bottom:1px solid var(--line)"><b>Notificações</b><button class="lnk small" id="bellAll">Marcar como lidas</button></div>
    <div class="belll">${items.length ? items.map(n => `<a class="belli ${(n.lembrete ? !dia : n.em > seen) ? "new" : ""}" href="${esc(n.href || "#")}"><span class="bico ${n.cls || ""}"></span><span style="min-width:0"><b>${esc(n.titulo)}</b>${n.sub ? `<br><span class="muted small">${esc(n.sub)}</span>` : ""}</span><span class="muted small num" style="white-space:nowrap">${n.lembrete ? "lembrete" : fdt(n.em)}</span></a>`).join("") : `<div class="empty" style="margin:14px">Tudo em dia.</div>`}</div></div></div>`;
  const btn = host.querySelector("#bellBtn"), p = host.querySelector("#bellP");
  const mark = () => { ls.set(`upe-bell-${key}`, String(Date.now())); ls.set(`upe-bell-dia-${key}`, todayIso()); };
  btn.onclick = e => { e.stopPropagation(); const open = p.classList.toggle("hide") === false; btn.setAttribute("aria-expanded", open); if (open) { mark(); btn.querySelector(".bellc")?.remove(); } };
  host.querySelector("#bellAll").onclick = () => { mark(); p.querySelectorAll(".new").forEach(x => x.classList.remove("new")); };
  p.querySelectorAll("a").forEach(a => a.onclick = () => p.classList.add("hide"));
  document.addEventListener("click", e => { if (!host.contains(e.target)) p.classList.add("hide"); });
}
function notifsCliente(doc, acoes) {
  const out = [], vis = it => it.status !== "rascunho" && it.status !== "orcamento", t = todayIso();
  const pend = (doc.posts || []).filter(vis).filter(p => statusOf(p, acoes).status === "pendente");
  if (pend.length === 1) out.push({ em: pend[0].statusEm || 0, titulo: `Post para aprovar: ${pend[0].titulo}`, sub: `${FMT_LBL[pend[0].tipo] || pend[0].tipo} · ${fdate(pend[0].data)}`, href: "#/c/conteudo", cls: "warn" });
  else if (pend.length) out.push({ em: Math.max(...pend.map(p => p.statusEm || 0)), titulo: `${pend.length} posts aguardando a sua aprovação`, sub: `O próximo é de ${fdate(pend.map(p => p.data).filter(Boolean).sort()[0])}`, href: "#/c/conteudo", cls: "warn" });
  (doc.graficos || []).filter(vis).forEach(g => { if (statusOf(g, acoes).status === "pendente") out.push({ em: g.statusEm || 0, titulo: `Arte para aprovar: ${g.produto}`, href: "#/c/graficos", cls: "warn" }); });
  (doc.cobrancas || []).filter(c => c.liberada && cobStatus(c, acoes) === "aberta").forEach(c => { const n = daysTo(c.vencimento);
    out.push({ em: c.liberadaEm || 0, titulo: `Cobrança: ${c.descricao}`, sub: `${brl(c.valor)} · vence ${fdate(c.vencimento)}`, href: "#/c/pagamentos", cls: n < 0 ? "bad" : "info" });
    if (n <= 3) out.push({ lembrete: true, em: 0, titulo: n < 0 ? `Cobrança vencida: ${c.descricao}` : `Vencimento ${quando(c.vencimento)}: ${c.descricao}`, href: "#/c/pagamentos", cls: n < 0 ? "bad" : "warn" }); });
  thread(doc, acoes).filter(m => m.autor === "upe").slice(-5).forEach(m => out.push({ em: m.em, titulo: "Mensagem da Upe", sub: m.texto.slice(0, 80), href: "#/c/mensagens", cls: "info" }));
  (doc.reunioes || []).filter(r => r.data >= t && daysTo(r.data) <= 2).forEach(r => out.push({ lembrete: true, em: 0, titulo: `Reunião ${quando(r.data)} às ${r.hora}`, sub: r.titulo, href: "#/c/agenda", cls: "info" }));
  (doc.entregas || []).filter(e => e.status !== "entregue" && daysTo(e.data) <= 3).forEach(e => out.push({ lembrete: true, em: 0, titulo: `Entrega ${quando(e.data)}: ${e.titulo}`, href: "#/c/agenda", cls: daysTo(e.data) < 0 ? "bad" : "warn" }));
  return out.sort((a, b) => (b.lembrete - a.lembrete) || b.em - a.em);
}
function notifsAdmin({ clients, contatos, reunioes, crono }) {
  const out = [], t = todayIso(), nm = c => c.doc.marca || c.doc.nome;
  contatos.filter(c => (c.status || "novo") === "novo").forEach(c => out.push({ em: c.em || 0, titulo: `Novo contato: ${c.nome}`, sub: `${c.assunto || ""} · ${c.contato || ""}`, href: "#/admin/contatos", cls: "warn" }));
  clients.forEach(c => c.acoes.slice(-30).forEach(a => {
    const alvo = [...(c.doc.posts || []), ...(c.doc.graficos || [])].find(x => x.id === a.alvo);
    const map = { aprovar: ["aprovou", "ok", alvo?.produto ? "graficos" : "conteudo"], ajuste: ["pediu ajuste em", "bad", alvo?.produto ? "graficos" : "conteudo"], mensagem: ["enviou uma mensagem", "info", "mensagens"], pedido: ["pediu recompra", "warn", "graficos"], pagamento: ["informou um pagamento", "info", "pagamentos"] }[a.tipo];
    if (map) out.push({ em: a.em, titulo: `${nm(c)} ${map[0]}${alvo ? " " + (alvo.titulo || alvo.produto) : ""}`, sub: a.texto ? a.texto.slice(0, 80) : "", href: `#/admin/cliente/${c.id}/${map[2]}`, cls: map[1] });
  }));
  reunioes.filter(r => r.data >= t && daysTo(r.data) <= 1 && r.status !== "cancelada").forEach(r => out.push({ lembrete: true, em: 0, titulo: `Reunião ${quando(r.data)} às ${r.hora}: ${r.titulo}`, sub: r.nome || "", href: "#/admin/calendario", cls: "info" }));
  const hoje = crono.filter(x => x.data === t && x.status !== "publicado");
  if (hoje.length) out.push({ lembrete: true, em: 0, titulo: `Publicar hoje: ${hoje.length} item(ns) do cronograma Upe`, sub: hoje.map(x => `${x.hora} ${FMT_LBL[x.formato] || x.formato}`).join(" · "), href: "#/admin/cronograma", cls: "warn" });
  clients.forEach(c => {
    (c.doc.cobrancas || []).filter(x => x.liberada && cobStatus(x, c.acoes) === "aberta" && daysTo(x.vencimento) <= 3).forEach(x => out.push({ lembrete: true, em: 0, titulo: `${daysTo(x.vencimento) < 0 ? "Vencida" : "Vence " + quando(x.vencimento)}: ${nm(c)}`, sub: `${x.descricao} · ${brl(x.valor)}`, href: `#/admin/cliente/${c.id}/pagamentos`, cls: daysTo(x.vencimento) < 0 ? "bad" : "warn" }));
    (c.doc.entregas || []).filter(e => e.status !== "entregue" && daysTo(e.data) <= 3).forEach(e => out.push({ lembrete: true, em: 0, titulo: `Entrega ${quando(e.data)}: ${e.titulo}`, sub: nm(c), href: `#/admin/cliente/${c.id}/projeto`, cls: daysTo(e.data) < 0 ? "bad" : "warn" }));
    (c.doc.posts || []).filter(p => p.status !== "rascunho" && daysTo(p.data) >= 0 && daysTo(p.data) <= 1 && statusOf(p, c.acoes).status === "pendente").forEach(p => out.push({ lembrete: true, em: 0, titulo: `Post de ${quando(p.data)} sem aprovação: ${nm(c)}`, sub: p.titulo, href: `#/admin/cliente/${c.id}/conteudo`, cls: "warn" }));
  });
  return out.sort((a, b) => (b.lembrete - a.lembrete) || b.em - a.em).slice(0, 60);
}

/* ---------- eventos do cliente (agenda) ---------- */
function eventosCliente(doc, acoes) {
  const ev = [];
  (doc.posts || []).filter(p => p.status !== "rascunho" && p.data).forEach(p => { const s = statusOf(p, acoes).status; ev.push({ id: "p:" + p.id, data: p.data, hora: p.hora || "", titulo: p.titulo, tag: FMT_LBL[p.tipo] || "Post", sub: "Postagem agendada", cls: evCls(s), pill: pill(s), k: "post", ref: p }); });
  (doc.entregas || []).forEach(e => ev.push({ id: "e:" + e.id, data: e.data, titulo: e.titulo, tag: "Entrega", sub: e.descricao || "Prazo de entrega", cls: e.status === "entregue" ? "ok" : daysTo(e.data) < 0 ? "bad" : "info", pill: pill(e.status === "entregue" ? "entregue" : "pendente").replace("Aguardando aprovação", "Em andamento"), k: "entrega", ref: e }));
  (doc.cobrancas || []).filter(c => c.liberada).forEach(c => { const s = cobStatus(c, acoes); ev.push({ id: "c:" + c.id, data: c.vencimento, titulo: `${c.descricao} · ${brl(c.valor)}`, tag: "Vencimento", sub: "Pagamento", cls: s === "paga" ? "ok" : daysTo(c.vencimento) < 0 ? "bad" : "warn", pill: pill(s), k: "cob", ref: c }); });
  (doc.reunioes || []).filter(r => r.status !== "cancelada").forEach(r => ev.push({ id: "r:" + r.id, data: r.data, hora: r.hora, titulo: r.titulo, tag: "Reunião", sub: r.link ? "Online" : r.local || "Reunião", cls: "info", pill: '<span class="pill info">Reunião</span>', k: "reuniao", ref: r }));
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
    if (e.k === "post") { const p = { ...e.ref, ef: statusOf(e.ref, c.acoes) }; postModal(p, c); }
    else if (e.k === "cob") go("#/c/pagamentos");
    else if (e.k === "reuniao") reuniaoView(e.ref, false);
    else modal(esc(e.ref.titulo), `<div class="row">${e.pill}<span class="muted">Prazo: ${fdate(e.ref.data)} (${quando(e.ref.data)})</span></div>${e.ref.descricao ? `<p>${esc(e.ref.descricao)}</p>` : ""}`);
  }, { legend: `<div class="row small"><span class="pill warn">Aguardando</span><span class="pill ok">Aprovado / pago</span><span class="pill info">Reunião / entrega</span><span class="pill bad">Atrasado</span></div>` });
}
function proximos(doc, acoes) { return eventosCliente(doc, acoes).filter(e => e.data >= todayIso() && e.cls !== "ok").sort((a, b) => (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || ""))).slice(0, 5); }
function cKit(m, c, kitId) {
  const k = (c.doc.kits || []).find(x => x.id === kitId), posts = (c.doc.posts || []).filter(p => p.kitId === kitId && p.status !== "rascunho").sort((a, b) => (a.data || "z").localeCompare(b.data || "z"));
  if (!k) { m.innerHTML = `<div class="empty">Kit não encontrado.</div>`; return; }
  m.innerHTML = `<div class="grid" style="gap:6px"><a class="small" href="#/c/conteudo">← Conteúdo</a><span class="eb">Kit de conteúdo</span><h1>${esc(k.nome)}</h1><p class="muted small">${posts.length} peças. Baixe os arquivos e copie as legendas.</p></div>
    <div class="g3">${posts.map(p => `<article class="card grid"><div class="thumb" style="aspect-ratio:${p.tipo === "reels" || p.tipo === "story" ? "9/16" : "4/5"}">${mediaHTML(p.capa && p.tipo === "reels" ? p.midias[0] : (p.midias || [])[0], p.tipo)}</div>
      <div class="spread"><b>${esc(p.titulo)}</b><span class="pill">${esc(FMT_LBL[p.tipo] || p.tipo)}</span></div><span class="muted small">${p.data ? fdate(p.data) : "Sem data"}${(p.midias || []).length > 1 ? ` · ${p.midias.length} arquivos` : ""}</span>
      ${p.legenda ? `<div class="legenda small" style="max-height:140px;overflow:auto">${esc(p.legenda)}</div>` : ""}
      <div class="row">${p.legenda ? `<button class="btn sm" data-cp="${p.id}">Copiar legenda</button>` : ""}${(p.midias || []).map((u, i) => dlBtn(u, p.midias.length > 1 ? `Baixar ${i + 1}` : "Baixar arquivo")).join("")}${p.capa ? dlBtn(p.capa, "Baixar capa") : ""}</div></article>`).join("")}</div>`;
  m.querySelectorAll("[data-cp]").forEach(b => b.onclick = () => copy(posts.find(p => p.id === b.dataset.cp).legenda, "Legenda copiada"));
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
const CAT = { posts: "Posts de clientes", entregas: "Entregas", venc: "Vencimentos", reunioes: "Reuniões", insta: "Cronograma Upe · Instagram", yt: "Cronograma Upe · YouTube" };
function aCalendario(w) {
  const { clients, reunioes, crono } = state.cache;
  let on; try { on = JSON.parse(ls.get("upe-calf") || "null"); } catch (e) {} on = on || Object.fromEntries(Object.keys(CAT).map(k => [k, true]));
  const ev = [];
  clients.forEach(c => { const nm = c.doc.marca || c.doc.nome;
    if (on.posts) (c.doc.posts || []).filter(p => p.data).forEach(p => { const s = statusOf(p, c.acoes).status; ev.push({ id: `p:${c.id}:${p.id}`, data: p.data, hora: p.hora || "", titulo: p.titulo, tag: nm, sub: `${nm} · ${FMT_LBL[p.tipo] || p.tipo}`, cls: evCls(s), pill: pill(s), go: `#/admin/cliente/${c.id}/conteudo` }); });
    if (on.entregas) (c.doc.entregas || []).forEach(e => ev.push({ id: `e:${c.id}:${e.id}`, data: e.data, titulo: e.titulo, tag: "Entrega", sub: nm, cls: e.status === "entregue" ? "ok" : daysTo(e.data) < 0 ? "bad" : "info", pill: e.status === "entregue" ? pill("entregue") : '<span class="pill warn">Prazo</span>', go: `#/admin/cliente/${c.id}/projeto` }));
    if (on.venc) (c.doc.cobrancas || []).filter(x => x.status !== "cancelado").forEach(x => { const s = cobStatus(x, c.acoes); ev.push({ id: `c:${c.id}:${x.id}`, data: x.vencimento, titulo: `${nm} · ${brl(x.valor)}`, tag: "Vence", sub: x.descricao + (x.liberada ? "" : " (oculta)"), cls: s === "paga" ? "ok" : daysTo(x.vencimento) < 0 ? "bad" : "warn", pill: pill(s), go: `#/admin/cliente/${c.id}/pagamentos` }); });
  });
  if (on.reunioes) reunioes.filter(r => r.status !== "cancelada").forEach(r => ev.push({ id: "r:" + r.id, data: r.data, hora: r.hora, titulo: r.titulo, tag: "Reunião", sub: `${r.com === "lead" ? "Lead" : r.com === "cliente" ? "Cliente" : ""}${r.nome ? " · " + r.nome : ""}`, cls: "info", pill: '<span class="pill info">Reunião</span>', r }));
  crono.filter(x => x.data && ((x.canal === "youtube" && on.yt) || (x.canal !== "youtube" && on.insta))).forEach(x => ev.push({ id: "u:" + x.id, data: x.data, hora: x.hora, titulo: x.titulo, tag: x.canal === "youtube" ? (x.formato === "shorts" ? "Shorts" : "YouTube") : FMT_LBL[x.formato] || x.formato, sub: `Upe · ${x.pilar}`, cls: x.status === "publicado" ? "ok" : x.canal === "youtube" ? "bad" : "", pill: pill(x.status === "publicado" ? "publicado" : x.status === "pronto" ? "aprovado" : "rascunho").replace("Aprovado", "Pronto").replace("Rascunho", x.status === "roteiro" ? "Roteiro" : "Planejado"), u: x }));
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">Painel Upe</span><h1>Calendário</h1></div><div class="row"><button class="btn sec" id="nCr">Novo item no cronograma</button><button class="btn" id="nR">Agendar reunião</button></div></div>
    <div class="row" role="group" aria-label="Mostrar">${Object.entries(CAT).map(([k, l]) => `<button class="chip" data-cat="${k}" aria-pressed="${!!on[k]}">${l}</button>`).join("")}</div><div id="calAd" class="grid"></div>`;
  w.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { on[b.dataset.cat] = !on[b.dataset.cat]; ls.set("upe-calf", JSON.stringify(on)); aCalendario(w); });
  $("#nR").onclick = () => reuniaoModal(); $("#nCr").onclick = () => cronoModal(null);
  calendar($("#calAd"), "adm", ev, e => { if (e.r) reuniaoView(e.r, true); else if (e.u) cronoModal(e.u); else go(e.go); });
}

/* ---------- cronograma da Upe ---------- */
const PILARES = ["Branding", "Rebranding", "Marca", "Publicidade e marketing", "E-commerce", "Upe TV", "Upe ERP", "YouTube"];
const CST = { planejado: "Planejado", roteiro: "Roteiro", pronto: "Pronto", publicado: "Publicado" };
async function cronogramaPadrao() {
  if (window.UPE_CRONOGRAMA) return window.UPE_CRONOGRAMA.itens;
  try { const r = await fetch("cronograma/upe-cronograma.json"); if (r.ok) return (await r.json()).itens; } catch (e) {}
  throw new Error("Não encontrei cronograma/upe-cronograma.json.");
}
async function carregarCronogramaPadrao() { const itens = await cronogramaPadrao(); for (const it of itens) await S.set(`cronograma/${it.id}`, it); return itens.length; }
function aCronograma(w, aba = "instagram") {
  const crono = state.cache.crono;
  const pf = ss.get("upe-pf") || "", rows = crono.filter(x => aba === "semdata" ? !x.data : x.data && (aba === "youtube" ? x.canal === "youtube" : x.canal !== "youtube")).filter(x => !pf || x.pilar === pf).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const cnt = k => crono.filter(x => k === "semdata" ? !x.data : x.data && (k === "youtube" ? x.canal === "youtube" : x.canal !== "youtube")).length;
  const vw = ls.get("upe-cvw") || "lista";
  const semanas = {}; rows.forEach(x => { const d = new Date((x.data || todayIso()) + "T12:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = x.data ? isoDay(d) : "sem"; (semanas[k] = semanas[k] || []).push(x); });
  w.innerHTML = `<div class="spread"><div class="grid" style="gap:4px"><span class="eb">@upecriativo · YouTube</span><h1>Cronograma Upe</h1><p class="muted small">Branding, rebranding, marca, publicidade e marketing, e-commerce, Upe TV e Upe ERP.</p></div>
      <div class="row"><button class="btn sec" id="cKit">Importar kit</button><button class="btn sec" id="cDup">Limpar duplicados</button><button class="btn sec" id="cPad">${crono.length ? "Refazer cronograma" : "Carregar cronograma padrão"}</button><button class="btn" id="cNew">Novo item</button></div></div>
    <nav class="subtabs">${[["instagram", "Instagram"], ["youtube", "YouTube"], ["semdata", "Sem data"]].map(([k, l]) => `<a class="tab" href="#/admin/cronograma/${k}" ${k === aba ? 'aria-current="page"' : ""}>${l}<span class="cnt" style="background:var(--mute-bg);color:var(--fg-2)">${cnt(k)}</span></a>`).join("")}</nav>
    <div class="row" style="align-items:flex-end"><div class="row" role="group" aria-label="Visualização" style="margin-right:8px"><button class="chip" data-vw="lista" aria-pressed="${vw === "lista"}">Lista</button><button class="chip" data-vw="grade" aria-pressed="${vw === "grade"}">Grade</button></div><label class="f" for="pf" style="max-width:240px">Pilar<select id="pf"><option value="">Todos</option>${PILARES.map(p => `<option ${pf === p ? "selected" : ""}>${p}</option>`).join("")}</select></label>
      <span class="muted small">${rows.filter(x => x.status === "publicado").length} de ${rows.length} publicados</span></div>
    ${rows.length && vw === "grade" ? gradeHTML(rows, aba === "youtube") : rows.length ? Object.entries(semanas).map(([k, its]) => `<section class="grid" style="gap:8px"><h3>${k === "sem" ? "Sem data" : `Semana de ${fdate(k)}`}</h3>
      <div class="card pad0 tbl"><table><tbody>${its.map(x => `<tr class="click" data-u="${esc(x.id)}" tabindex="0"><td style="width:92px" class="num small">${x.data ? `<b>${fdate(x.data).slice(0, 5)}</b> ${DOW[new Date(x.data + "T12:00").getDay()].toLowerCase()}<br>${esc(x.hora || "")}` : "—"}</td>
        <td style="width:64px"><div class="thumb" style="width:56px;aspect-ratio:${x.canal === "youtube" && x.formato === "youtube" ? "16/9" : "4/5"};border-radius:8px">${capaDe(x) ? imgTag(capaDe(x)) : `<span class="small">${esc(FMT_LBL[x.formato] || "")}</span>`}</div></td>
        <td><b>${esc(x.titulo)}</b><br><span class="muted small">${esc(FMT_LBL[x.formato] || x.formato)} · ${esc(x.pilar || "")} · ${esc(x.origem || "")}</span></td>
        <td style="width:150px"><select data-st="${esc(x.id)}" aria-label="Status">${Object.entries(CST).map(([s, l]) => `<option value="${s}" ${x.status === s ? "selected" : ""}>${l}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div></section>`).join("") : `<div class="empty">${crono.length ? "Nada aqui com este filtro." : "Carregue o cronograma padrão da Upe (kits do Upe TV, do Upe ERP e o kit de branding) ou importe um kit."}</div>`}`;
  $("#pf").onchange = e => { ss.set("upe-pf", e.target.value); aCronograma(w, aba); };
  w.querySelectorAll("[data-vw]").forEach(b => b.onclick = () => { ls.set("upe-cvw", b.dataset.vw); aCronograma(w, aba); });
  w.querySelectorAll("[data-g]").forEach(b => b.onclick = () => cronoModal(crono.find(x => x.id === b.dataset.g)));
  $("#cDup").onclick = async () => { const r = await limparDuplicados(); toast(r.rem || r.fix ? `${r.rem} duplicados removidos · ${r.fix} pilares corrigidos` : "Nenhum duplicado encontrado"); reAdmin(); };
  $("#cNew").onclick = () => cronoModal(null);
  $("#cKit").onclick = () => kitImport({ alvo: "cronograma" });
  $("#cPad").onclick = () => { if (!crono.length) return refazer();
    modal("Refazer o cronograma?", `<p>Apaga os ${crono.length} itens atuais (inclusive os importados) e carrega de novo o cronograma padrão da Upe: kit de branding, Upe TV, Upe ERP e YouTube, com as datas organizadas.</p><p class="muted small">Depois, importe as pastas dos kits do Upe TV e do Upe ERP: os arquivos entram nos itens que já estão no cronograma, sem duplicar.</p>`, `<button class="btn sec" data-close>Cancelar</button><button class="btn bad" id="rfOk">Refazer</button>`);
    $("#rfOk").onclick = () => { dlg.close(); refazer(); }; };
  const refazer = async () => { try { for (const x of crono) await S.del(`cronograma/${x.id}`); const n = await carregarCronogramaPadrao(); toast(`Cronograma refeito: ${n} itens`); reAdmin(); } catch (e) { toast(e.message); } };
  w.querySelectorAll("tr[data-u]").forEach(r => { r.onclick = e => { if (e.target.closest("select")) return; cronoModal(crono.find(x => x.id === r.dataset.u)); }; r.onkeydown = e => { if (e.key === "Enter") r.click(); }; });
  w.querySelectorAll("[data-st]").forEach(s => s.onchange = async () => { const x = crono.find(y => y.id === s.dataset.st); x.status = s.value; await S.set(`cronograma/${x.id}`, x); toast("Status atualizado"); });
}
function gradeHTML(rows, yt) {
  return `<div class="feedgrid ${yt ? "yt" : ""}">${rows.map(x => { const c = capaDe(x), vid = (x.midias || []).find(u => kind(u, "") === "video");
    return `<button class="gcell" data-g="${esc(x.id)}" title="${esc(x.titulo)}">${c ? imgTag(c) : vid ? `<video src="${esc(resolveMedia(vid))}#t=1" muted preload="metadata"></video>` : `<span class="gph">${esc(FMT_LBL[x.formato] || "")}<br><small>${esc(x.titulo)}</small></span>`}
      <span class="gtop">${x.data ? fdate(x.data).slice(0, 5) : "s/ data"}</span><span class="gfmt">${esc(FMT_LBL[x.formato] || x.formato)}${(x.midias || []).length > 1 ? " · " + x.midias.length : ""}</span>${x.status === "publicado" ? '<span class="gok">✓</span>' : ""}</button>`; }).join("")}</div>`;
}
function gradePosts(posts) {
  if (!posts.length) return `<div class="empty">Nenhum post aqui.</div>`;
  return `<p class="muted small">Prévia do feed, na ordem de publicação.</p><div class="feedgrid">${[...posts].sort((a, b) => (b.data || "").localeCompare(a.data || "")).map(p => { const c = p.capa || (p.midias || []).find(u => kind(u) === "img"), vid = (p.midias || []).find(u => kind(u, p.tipo) === "video");
    return `<button class="gcell" data-p="${esc(p.id)}" title="${esc(p.titulo)}">${c ? imgTag(c) : vid ? `<video src="${esc(resolveMedia(vid))}#t=1" muted preload="metadata"></video>` : `<span class="gph">${esc(FMT_LBL[p.tipo] || "")}<br><small>${esc(p.titulo)}</small></span>`}<span class="gtop">${p.data ? fdate(p.data).slice(0, 5) : "s/ data"}</span><span class="gfmt">${esc(FMT_LBL[p.tipo] || p.tipo)}</span>${p.ef.status === "aprovado" || p.ef.status === "publicado" ? '<span class="gok">✓</span>' : p.ef.status === "pendente" ? '<span class="gok" style="background:var(--warn)">!</span>' : p.ef.status === "ajustes" ? '<span class="gok" style="background:var(--bad)">↺</span>' : ""}</button>`; }).join("")}</div>`;
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
function cronoModal(x) {
  const n = !x; x = x || { id: "upe-" + uid(8), data: todayIso(), hora: "12:00", canal: "instagram", formato: "feed", pilar: "Branding", titulo: "", legenda: "", roteiro: "", midias: [], capa: "", status: "planejado", origem: "Manual" };
  const view = !n;
  modal(n ? "Novo item do cronograma" : esc(x.titulo), `
    ${view ? `<div class="row"><span class="pill info">${esc(FMT_LBL[x.formato] || x.formato)}</span><span class="pill">${esc(x.pilar)}</span><span class="muted small">${x.data ? `${DOW[new Date(x.data + "T12:00").getDay()]}, ${fdate(x.data)} · ${esc(x.hora)}` : "Sem data"} · ${esc(x.origem || "")}</span></div>
      ${(x.midias || []).length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${x.midias.map(u => `<div class="media-box" style="min-height:120px">${mediaHTML(u, x.formato === "reels" || x.formato === "shorts" || x.formato === "youtube" ? "video" : "")}</div>`).join("")}</div>` : x.capa ? `<div class="media-box">${imgTag(x.capa)}</div>` : ""}
      <div class="row">${(x.midias || []).map((u, i) => dlBtn(u, x.midias.length > 1 ? `Baixar ${i + 1}` : "Baixar arquivo")).join("")}${x.capa ? dlBtn(x.capa, x.canal === "youtube" ? "Baixar thumbnail" : "Baixar capa") : ""}${x.legenda ? `<button class="btn sm" id="xCp">Copiar ${x.canal === "youtube" ? "descrição" : "legenda"}</button>` : ""}</div>` : ""}
    <div class="g3"><label class="f" for="xD">Data<input id="xD" type="date" value="${esc(x.data)}"></label><label class="f" for="xH">Hora<input id="xH" type="time" value="${esc(x.hora)}"></label><label class="f" for="xSt">Status<select id="xSt">${Object.entries(CST).map(([s, l]) => `<option value="${s}" ${x.status === s ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <div class="g3"><label class="f" for="xC">Canal<select id="xC"><option value="instagram" ${x.canal !== "youtube" ? "selected" : ""}>Instagram</option><option value="youtube" ${x.canal === "youtube" ? "selected" : ""}>YouTube</option></select></label><label class="f" for="xF">Formato<select id="xF">${["feed", "carrossel", "reels", "story", "youtube", "shorts"].map(f => `<option value="${f}" ${x.formato === f ? "selected" : ""}>${FMT_LBL[f]}</option>`).join("")}</select></label><label class="f" for="xP">Pilar<select id="xP">${PILARES.map(p => `<option ${x.pilar === p ? "selected" : ""}>${p}</option>`).join("")}</select></label></div>
    <label class="f" for="xT">Título<input id="xT" value="${esc(x.titulo)}"></label>
    <label class="f" for="xL">${x.canal === "youtube" ? "Descrição" : "Legenda"}<textarea id="xL" rows="6">${esc(x.legenda)}</textarea></label>
    <label class="f" for="xR">Roteiro / notas<textarea id="xR" rows="3">${esc(x.roteiro || "")}</textarea></label>
    <label class="f" for="xM">Arquivos (um link por linha)<textarea id="xM" rows="2">${esc((x.midias || []).join("\n"))}</textarea></label>`,
    `${!n ? `<button class="btn bad" id="xX">Excluir</button>` : ""}<button class="btn sec" data-close>Fechar</button><button class="btn" id="xOk">Salvar</button>`, true);
  if ($("#xCp")) $("#xCp").onclick = () => copy(x.legenda, "Copiado");
  $("#xOk").onclick = async () => {
    const t = $("#xT").value.trim(); if (!t) return $("#xT").focus();
    Object.assign(x, { data: $("#xD").value, hora: $("#xH").value, status: $("#xSt").value, canal: $("#xC").value, formato: $("#xF").value, pilar: $("#xP").value, titulo: t, legenda: $("#xL").value, roteiro: $("#xR").value, midias: $("#xM").value.split("\n").map(s => s.trim()).filter(Boolean) });
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
