/* Funções do projeto upecriativo-cc472. Ligam com o plano Blaze: tools/blaze/ativar.sh faz tudo (APIs, segredos, deploy).
   E-mails saem pela extensão "Trigger Email" (coleção mail). WhatsApp automático é opcional (WHATSAPP_WEBHOOK, ex.: Z-API ou Evolution API).
   Mapa:
     avisoLead          lead novo numa landing page        → e-mail para o cliente da Upe
     avisoReserva       agendamento novo                   → e-mail para o estabelecimento (+ WhatsApp opcional)
     lembretes          todo dia 18h                       → agenda de amanhã para o estabelecimento e lembrete ao cliente final
     resumoDiario       todo dia 3h                        → resumo das landing pages (lp_paginas/{página}/resumos) e limpeza de eventos com mais de 13 meses
     cobrancas          todo dia 8h                        → gera mensalidades, lembra vencimentos, marca atraso e (se ligado) suspende páginas
     api                /api/checkout, /api/mp, /api/pix   → pagamento direto do Kit Upe (Mercado Pago), aviso de pagamento e PIX das cobranças
     lpRender           todas as páginas de upe-criativo-lp → página montada no servidor (prévia certa no WhatsApp, Facebook e LinkedIn),
                        arquivos da pasta da página no caminho real (lp/{endereço}/…) e dossiês (/_d/{chave}/… → dossies/{chave}/…)
     dominioConectar    lp_dominios status "conectar"      → cria o domínio no Hosting e grava os registros de DNS
     dominiosVerificar  de hora em hora                    → marca o domínio como ativo quando o Firebase conecta
     planilha           chamada do painel                  → lê planilha do Google privada (compartilhada com a conta de serviço) */
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
const fs = require("fs"), path = require("path"), crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region: "southamerica-east1", maxInstances: 10, memory: "256MiB" });

const MP_ACCESS_TOKEN = defineSecret("MP_ACCESS_TOKEN");        // conta Mercado Pago da Upe (cobranças); "desligado" enquanto não houver
const WHATSAPP_WEBHOOK = defineString("WHATSAPP_WEBHOOK", { default: "" }); // URL que recebe {phone, message} (opcional)
const PAINEL = "https://servicos.upecriativo.com.br", LP = "https://lp.upecriativo.com.br", AGENDAS = "https://agenda.upecriativo.com.br", LOJAS = "https://loja.upecriativo.com.br";
const TZ = "America/Sao_Paulo", DIA = 864e5;

/* ---------- utilidades ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = v => (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hojeSP = (d = 0) => new Date(Date.now() + d * DIA).toLocaleDateString("sv-SE", { timeZone: TZ });
const fmtData = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "";
const ligado = s => { try { const v = s.value(); return v && v !== "desligado" ? v : ""; } catch { return ""; } };
const caixa = (titulo, corpo, botao, link) => `<div style="font:15px/1.55 Arial,sans-serif;color:#14171c;max-width:560px"><h2 style="font-size:20px;margin:0 0 12px">${esc(titulo)}</h2>${corpo}${link ? `<p style="margin:22px 0"><a href="${esc(link)}" style="background:#1a73d9;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">${esc(botao)}</a></p>` : ""}<p style="color:#5a6a82;font-size:12px">Upe Criativo · ${PAINEL}</p></div>`;
async function emailsDoCliente(cid) { const c = cid ? (await db.doc("srv_clientes/" + cid).get()).data() : null; return { cliente: c, emails: (c?.emails || []).filter(Boolean) }; }
async function mail(to, subject, html) { if (!to || (Array.isArray(to) && !to.length)) return; await db.collection("mail").add({ to, message: { subject, html } }); }
async function whats(numero, texto) {
  const url = WHATSAPP_WEBHOOK.value(), n = String(numero || "").replace(/\D/g, ""); if (!url || n.length < 10) return;
  try { await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: n.length <= 11 ? "55" + n : n, message: texto }) }); } catch (e) { logger.warn("whatsapp", e.message); }
}

/* ---------- avisos ---------- */
exports.avisoLead = onDocumentCreated("lp_paginas/{slug}/leads/{id}", async ev => {
  const lead = ev.data?.data(); if (!lead) return;
  const pg = (await db.doc("lp_paginas/" + ev.params.slug).get()).data() || {}, { emails } = await emailsDoCliente(pg.cid);
  const linhas = Object.entries(lead.campos || {}).map(([k, v]) => `<tr><td style="padding:4px 10px 4px 0;color:#5a6a82">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join("");
  await mail(emails, `Novo lead na página ${pg.titulo || ev.params.slug}`, caixa("Chegou um lead novo", `<p>Página <b>${esc(pg.titulo || ev.params.slug)}</b>${lead.utm ? ` · origem ${esc(String(lead.utm).split("|")[0])}` : ""}</p><table>${linhas}</table>`, "Ver leads no painel", `${PAINEL}/#/leads/${ev.params.slug}`));
});
exports.avisoReserva = onDocumentCreated("agenda_paginas/{slug}/reservas/{id}", async ev => {
  const r = ev.data?.data(); if (!r || r.obs === "Agendado pelo painel") return;
  const ag = (await db.doc("agenda_paginas/" + ev.params.slug).get()).data() || {}, { emails } = await emailsDoCliente(ag.cid);
  const quando = `${fmtData(r.data)} às ${r.hora}`, canc = r.token ? `${AGENDAS}/${ev.params.slug}?cancelar=${encodeURIComponent(ev.params.id)}&t=${r.token}&s=${encodeURIComponent((r.slots || [ev.params.id]).join(","))}` : "";
  await mail(emails, `Novo agendamento: ${r.servico} · ${quando}`, caixa("Novo agendamento", `<p><b>${esc(r.nome)}</b> · ${esc(r.telefone || "")}</p><p>${esc(r.servico)}${r.profNome ? " com " + esc(r.profNome) : ""} · ${esc(quando)}</p>${r.obs ? `<p>“${esc(r.obs)}”</p>` : ""}`, "Confirmar no painel", `${PAINEL}/#/agenda`));
  await whats(ag.whatsapp, `Novo agendamento: ${r.nome}, ${r.servico}${r.profNome ? " com " + r.profNome : ""}, ${quando}. Confirme no painel: ${PAINEL}/#/agenda`);
  if (r.email) await mail(r.email, `Agendamento recebido · ${ag.nome}`, caixa("Recebemos o seu agendamento", `<p>${esc(r.servico)}${r.profNome ? " com " + esc(r.profNome) : ""}<br><b>${esc(quando)}</b></p><p>${esc(ag.endereco || "")}</p>`, canc ? "Cancelar este horário" : "", canc));
});
exports.lembretes = onSchedule({ schedule: "0 18 * * *", timeZone: TZ }, async () => {
  const amanha = hojeSP(1);
  for (const ag of (await db.collection("agenda_paginas").get()).docs) {
    const a = ag.data(); if (a.ativo === false) continue;
    const rs = (await ag.ref.collection("reservas").where("data", "==", amanha).get()).docs.map(d => ({ id: d.id, ...d.data() })).filter(r => ["nova", "confirmada"].includes(r.status)).sort((x, y) => x.hora.localeCompare(y.hora));
    if (!rs.length) continue;
    const { emails } = await emailsDoCliente(a.cid);
    await mail(emails, `Agenda de amanhã (${fmtData(amanha)}): ${rs.length} atendimento(s)`, caixa(`Amanhã, ${fmtData(amanha)}`, `<ul>${rs.map(r => `<li><b>${esc(r.hora)}</b> · ${esc(r.nome)} · ${esc(r.servico)}${r.profNome ? " · " + esc(r.profNome) : ""}${r.status === "nova" ? " <i>(a confirmar)</i>" : ""}</li>`).join("")}</ul>`, "Abrir a agenda", `${PAINEL}/#/agenda`));
    for (const r of rs) {
      const canc = r.token ? `${AGENDAS}/${ag.id}?cancelar=${encodeURIComponent(r.id)}&t=${r.token}&s=${encodeURIComponent((r.slots || [r.id]).join(","))}` : "";
      await whats(r.telefone, `Olá, ${String(r.nome).split(" ")[0]}! Lembrete: ${r.servico} amanhã às ${r.hora} em ${a.nome}.${canc ? " Não vai poder ir? Cancele aqui: " + canc : ""}`);
      if (r.email) await mail(r.email, `Lembrete: ${r.servico} amanhã às ${r.hora}`, caixa("Até amanhã!", `<p>${esc(r.servico)} · <b>${esc(fmtData(amanha))} às ${esc(r.hora)}</b><br>${esc(a.nome)} · ${esc(a.endereco || "")}</p>`, canc ? "Cancelar" : "", canc));
    }
  }
});

/* ---------- resumo diário das landing pages ---------- */
exports.resumoDiario = onSchedule({ schedule: "10 3 * * *", timeZone: TZ, timeoutSeconds: 540, memory: "512MiB" }, async () => {
  const ontem = hojeSP(-1), ini = new Date(ontem + "T00:00:00-03:00").getTime(), fim = ini + DIA, limite = Date.now() - 395 * DIA;
  for (const pg of (await db.collection("lp_paginas").get()).docs) {
    const evs = (await pg.ref.collection("eventos").where("t", ">=", ini).where("t", "<", fim).get()).docs.map(d => d.data());
    if (evs.length) {
      const R = { dia: ontem, visitas: 0, unicos: 0, leads: 0, cliques: 0, whatsapp: 0, origens: {}, disp: {}, alvos: {}, rolagem: { 25: 0, 50: 0, 75: 0, 100: 0 } }, vids = new Set(), rol = { 25: new Set(), 50: new Set(), 75: new Set(), 100: new Set() };
      const soma = (m, k) => { k = String(k || "").slice(0, 80).replace(/[./#$\[\]]/g, "_") || "(vazio)"; m[k] = (m[k] || 0) + 1; };
      for (const e of evs) {
        if (e.tipo === "visita") { R.visitas++; vids.add(e.vid); soma(R.origens, String(e.utm || "").split("|")[0] || e.ref || "Direto"); soma(R.disp, e.disp || "desconhecido"); }
        else if (e.tipo === "lead") R.leads++;
        else if (e.tipo === "clique") { R.cliques++; soma(R.alvos, e.alvo); }
        else if (e.tipo === "whatsapp") { R.whatsapp++; soma(R.alvos, "WhatsApp: " + (e.alvo || "")); }
        else if (e.tipo === "rolagem") [25, 50, 75, 100].forEach(n => { if (e.prof >= n) rol[n].add(e.vid); });
      }
      R.unicos = vids.size; [25, 50, 75, 100].forEach(n => R.rolagem[n] = rol[n].size);
      await pg.ref.collection("resumos").doc(ontem).set(R);
    }
    // retenção da política de privacidade: eventos com mais de 13 meses saem
    const velhos = await pg.ref.collection("eventos").where("t", "<", limite).limit(400).get();
    if (!velhos.empty) { const b = db.batch(); velhos.docs.forEach(d => b.delete(d.ref)); await b.commit(); }
  }
});

/* ---------- cobranças automáticas ---------- */
exports.cobrancas = onSchedule({ schedule: "0 8 * * *", timeZone: TZ, timeoutSeconds: 300 }, async () => {
  const rec = (await db.doc("srv_config/recursos").get()).data() || {}, hoje = hojeSP();
  for (const c of (await db.collection("srv_clientes").get()).docs) {
    const d = c.data(), m = d.plano?.mensal; if (!m || !(+m.valor > 0) || !["ativo", "atrasado"].includes(m.status)) continue;
    // gera a mensalidade 5 dias antes do vencimento
    const alvo = hojeSP(5), dia = String(Math.min(28, +m.dia || 10)).padStart(2, "0");
    if (alvo.slice(8) === dia) {
      const ref = alvo.slice(0, 7), p = c.ref.collection("cobrancas").doc("m-" + ref);
      if (!(await p.get()).exists) {
        await p.set({ tipo: "mensalidade", ref, descricao: `${m.nome} · ${new Date(ref + "-15T12:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`, valor: +m.valor, venc: `${ref}-${dia}`, status: "aberta", criadoEm: Date.now(), auto: true });
        await mail(d.emails, `Mensalidade ${m.nome}: vence em ${fmtData(`${ref}-${dia}`)}`, caixa("Sua mensalidade está disponível", `<p>${esc(m.nome)} · <b>${brl(m.valor)}</b> · vence em ${fmtData(`${ref}-${dia}`)}</p>`, "Pagar no painel", `${PAINEL}/#/conta`));
      }
    }
    // atrasos
    const abertas = (await c.ref.collection("cobrancas").where("status", "==", "aberta").get()).docs.map(x => ({ id: x.id, ...x.data() }));
    const vencidas = abertas.filter(x => x.venc < hoje);
    for (const x of abertas) if (x.venc === hojeSP(-3)) await mail(d.emails, `Cobrança em atraso: ${x.descricao}`, caixa("Lembrete de pagamento", `<p>${esc(x.descricao)} · <b>${brl(x.valor)}</b> venceu em ${fmtData(x.venc)}.</p>`, "Pagar no painel", `${PAINEL}/#/conta`));
    if (vencidas.length && m.status === "ativo") await c.ref.set({ plano: { ...d.plano, mensal: { ...m, status: "atrasado" } } }, { merge: true });
    const muito = vencidas.some(x => x.venc < hojeSP(-10));
    if (muito && rec.suspensaoAutomatica && !d.paginasSuspensas) {
      for (const p of (await db.collection("lp_paginas").where("cid", "==", c.id).get()).docs) await p.ref.set({ suspensa: true }, { merge: true });
      await c.ref.set({ paginasSuspensas: true, plano: { ...d.plano, mensal: { ...m, status: "suspenso" } } }, { merge: true });
      await mail(d.emails, "Páginas suspensas por atraso", caixa("Suas páginas saíram do ar", `<p>Há cobrança vencida há mais de 10 dias. Assim que o pagamento for confirmado, tudo volta ao ar.</p>`, "Ver cobranças", `${PAINEL}/#/conta`));
    }
  }
});

/* ---------- pagamentos (Mercado Pago) e API pública ---------- */
const mp = async (token, caminho, metodo = "GET", corpo) => { const r = await fetch("https://api.mercadopago.com" + caminho, { method: metodo, headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", ...(metodo === "POST" ? { "X-Idempotency-Key": crypto.randomUUID() } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined }); const j = await r.json(); if (!r.ok) throw new Error("Mercado Pago: " + (j.message || r.status)); return j; };
const cors = res => { res.set("Access-Control-Allow-Origin", "*"); res.set("Access-Control-Allow-Headers", "Content-Type, Authorization"); res.set("Access-Control-Allow-Methods", "POST, OPTIONS"); };
async function usuario(req) { const t = (req.get("Authorization") || "").replace(/^Bearer /, ""); if (!t) return null; try { return await admin.auth().verifyIdToken(t); } catch { return null; } }
async function membro(u, cid) {
  if (!u || !u.email_verified) return false;
  if (u.email === "upecriativo@gmail.com" || (await db.doc("admins/" + u.uid).get()).exists) return true;
  const a = (await db.doc("srv_acessos/" + u.uid).get()).data(); return a?.cid === cid;
}
exports.api = onRequest({ secrets: [MP_ACCESS_TOKEN], cors: false, invoker: "public" }, async (req, res) => {
  cors(res); if (req.method === "OPTIONS") return res.status(204).send("");
  const rota = req.path.replace(/^\/api/, "");
  try {
    if (rota === "/checkout" && req.method === "POST") {   // carrinho do Kit Upe → pedido na loja + pagamento Mercado Pago do lojista
      const { loja, itens, volta } = req.body || {}; if (!/^[a-z0-9-]{2,48}$/.test(loja || "") || !Array.isArray(itens) || !itens.length || itens.length > 60) return res.status(400).json({ erro: "pedido inválido" });
      const g = (await db.doc(`lojas/${loja}/privado/gateway`).get()).data(); if (!g?.mpToken) return res.status(409).json({ erro: "pagamento online não configurado nesta loja" });
      const cfg = (await db.doc(`lojas/${loja}/publico/config`).get()).data() || {}, linhas = [];
      for (const it of itens) { const [id] = String(it.pid).split("~"), p = (await db.doc(`lojas/${loja}/produtos/${id}`).get()).data(); const q = Math.min(99, Math.max(1, parseInt(it.qtd) || 1)); if (!p) continue;
        if (p.estoque != null && +p.estoque < q) return res.status(409).json({ erro: `Estoque insuficiente: ${p.nome}` });
        const unit = +p.promo > 0 && +p.promo < +p.preco ? +p.promo : +p.preco; linhas.push({ pid: it.pid, nome: p.nome, qtd: q, unit }); }
      if (!linhas.length) return res.status(400).json({ erro: "sem itens" });
      const total = +linhas.reduce((s, x) => s + x.unit * x.qtd, 0).toFixed(2), ref = db.collection(`lojas/${loja}/pedidos`).doc();
      await ref.set({ nome: "", email: "", telefone: "", itens: linhas, sub: total, frete: 0, desconto: 0, cupom: "", total, pagamento: "Pagamento online", parcelas: 1, obs: "Pedido pelo site (Kit Upe)", status: "novo", importado: false, criadoEm: new Date().toISOString(), entrega: "a combinar", pagStatus: "aguardando" });
      const pref = await mp(g.mpToken, "/checkout/preferences", "POST", { items: linhas.map(x => ({ title: x.nome.slice(0, 250), quantity: x.qtd, unit_price: x.unit, currency_id: "BRL" })), external_reference: `loja:${loja}:${ref.id}`, statement_descriptor: String(cfg.nome || "Loja").slice(0, 22),
        back_urls: { success: `${LOJAS}/${loja}/pedido/${ref.id}`, failure: volta || `${LOJAS}/${loja}`, pending: `${LOJAS}/${loja}/pedido/${ref.id}` }, auto_return: "approved", notification_url: `${LP}/api/mp?loja=${encodeURIComponent(loja)}` });
      return res.json({ url: pref.init_point, pedido: ref.id });
    }
    if (rota === "/mp") {                                  // aviso do Mercado Pago (pagamento aprovado)
      const id = req.query["data.id"] || req.body?.data?.id || req.query.id; if (!id) return res.status(200).send("ok");
      const loja = String(req.query.loja || ""), token = loja ? (await db.doc(`lojas/${loja}/privado/gateway`).get()).data()?.mpToken : ligado(MP_ACCESS_TOKEN); if (!token) return res.status(200).send("sem token");
      const p = await mp(token, "/v1/payments/" + encodeURIComponent(id)), [tipo, a, b] = String(p.external_reference || "").split(":");
      if (p.status === "approved") {
        if (tipo === "loja" && a === loja) await db.doc(`lojas/${a}/pedidos/${b}`).set({ pagStatus: "pago", status: "aprovado", nome: [p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" ") || "Comprador", email: p.payer?.email || "", mpId: String(p.id) }, { merge: true });
        if (tipo === "cob") { await db.doc(`srv_clientes/${a}/cobrancas/${b}`).set({ status: "paga", pagoEm: Date.now(), mpId: String(p.id) }, { merge: true });
          const c = (await db.doc("srv_clientes/" + a).get()).data(); if (c?.plano?.mensal?.status === "atrasado") await db.doc("srv_clientes/" + a).set({ plano: { ...c.plano, mensal: { ...c.plano.mensal, status: "ativo" } } }, { merge: true }); }
      }
      return res.status(200).send("ok");
    }
    if (rota === "/pix" && req.method === "POST") {         // PIX dinâmico de uma cobrança do Painel Upe Serviços (confirma sozinho)
      const token = ligado(MP_ACCESS_TOKEN); if (!token) return res.status(409).json({ erro: "PIX automático desligado" });
      const u = await usuario(req), { cid, cobranca } = req.body || {}; if (!(await membro(u, cid))) return res.status(403).json({ erro: "sem permissão" });
      const ref = db.doc(`srv_clientes/${cid}/cobrancas/${cobranca}`), c = (await ref.get()).data(); if (!c || c.status === "paga") return res.status(404).json({ erro: "cobrança não encontrada" });
      if (c.pix?.expira > Date.now() + 60e3) return res.json(c.pix);
      const pg = await mp(token, "/v1/payments", "POST", { transaction_amount: +c.valor, description: c.descricao || "Upe Criativo", payment_method_id: "pix", payer: { email: u.email }, external_reference: `cob:${cid}:${cobranca}`, notification_url: `${LP}/api/mp`, date_of_expiration: new Date(Date.now() + 2 * DIA).toISOString() });
      const pix = { copiaCola: pg.point_of_interaction?.transaction_data?.qr_code || "", qr: pg.point_of_interaction?.transaction_data?.qr_code_base64 || "", mpId: String(pg.id), expira: Date.now() + 2 * DIA - 3600e3 };
      await ref.set({ pix }, { merge: true }); return res.json(pix);
    }
    res.status(404).json({ erro: "rota desconhecida" });
  } catch (e) { logger.error(rota, e); res.status(500).json({ erro: "falha no servidor" }); }
});

/* ---------- landing pages montadas no servidor (prévia certa ao compartilhar) ---------- */
// Páginas e sistemas enviados com a pasta (raiz: true) ficam no Storage em lp/{endereço}/{caminho original} e abrem no caminho de verdade:
// lp.upecriativo.com.br/{endereço}/css/estilo.css, /fonts/…, /js/…, /dados/… (então caminhos relativos, módulos, fetch e fontes funcionam como no computador).
// Dossiês: lp.upecriativo.com.br/_d/{chave}/… → Storage dossies/{chave}/… (chave aleatória, só quem tem o link abre).
const BUCKET = () => admin.storage().bucket((process.env.GCLOUD_PROJECT || "upecriativo-cc472") + ".firebasestorage.app");
const TIPO_TXT = { html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8", map: "application/json; charset=utf-8", webmanifest: "application/manifest+json", svg: "image/svg+xml", txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8", csv: "text/csv; charset=utf-8", xml: "application/xml; charset=utf-8" };
// texto sai direto daqui; imagens, fontes, vídeos e PDFs vão para o endereço do Storage (sem limite de tamanho, com suporte a vídeo)
async function servirArquivo(res, caminho, extra = {}) {
  const f = BUCKET().file(caminho), [md] = await f.getMetadata().catch(() => [null]);
  if (!md) return false;
  const ext = caminho.split(".").pop().toLowerCase();
  res.set({ "Access-Control-Allow-Origin": "*", ...extra });
  if (TIPO_TXT[ext] && +md.size < 8 * 1048576) { const [buf] = await f.download(); res.set("Content-Type", TIPO_TXT[ext]).set("Cache-Control", "public, max-age=60, s-maxage=120").send(buf); return true; }
  let tok = String(md.metadata?.firebaseStorageDownloadTokens || "").split(",")[0];
  if (!tok) { tok = crypto.randomUUID(); await f.setMetadata({ metadata: { firebaseStorageDownloadTokens: tok } }); }
  res.set("Cache-Control", "public, max-age=600, s-maxage=3600").redirect(302, `https://firebasestorage.googleapis.com/v0/b/${f.bucket.name}/o/${encodeURIComponent(caminho)}?alt=media&token=${tok}`);
  return true;
}
const caminhoSeguro = partes => { try { const p = partes.map(decodeURIComponent); return p.some(x => !x || x === "." || x === ".." || x.includes("\\")) ? null : p.join("/"); } catch { return null; } };
let MONTAR = null, VENDAS = null;
exports.lpRender = onRequest({ memory: "256MiB", invoker: "public" }, async (req, res) => {
  MONTAR = MONTAR || (await import("./lp-render.mjs")).montar;
  const host = String(req.get("x-forwarded-host") || req.hostname || "").toLowerCase().split(":")[0], deUpe = /(^|\.)(web\.app|firebaseapp\.com|lp\.upecriativo\.com\.br)$/.test(host);
  const fora = (t, m, s = 404) => res.status(s).set("Cache-Control", "public, max-age=60").send(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t)}</title><meta name="robots" content="noindex"></head><body style="font:16px/1.5 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f1ea;color:#0d1b33;text-align:center"><main><h1>${esc(t)}</h1><p>${esc(m)}</p></main></body></html>`);
  const partes = req.path.split("/").filter(Boolean), barra = req.path.endsWith("/"), qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  // dossiê completo (pasta enviada pela Upe)
  if (deUpe && partes[0] === "_d") {
    const chave = partes[1] || "", resto = caminhoSeguro(partes.slice(2));
    if (!/^[A-Za-z0-9]{16,64}$/.test(chave) || resto === null) return fora("Arquivo não encontrado", "Confira o link.");
    if (!resto && !barra) return res.redirect(301, `/_d/${chave}/${qs}`);
    const alvo = !resto || barra ? (resto ? resto + "/" : "") + "index.html" : resto;
    if (await servirArquivo(res, `dossies/${chave}/${alvo}`, { "X-Robots-Tag": "noindex" })) return;
    return fora("Arquivo não encontrado", "Confira o link.");
  }
  let slug = "";
  if (deUpe) { slug = (partes[0] || "").toLowerCase(); if (!slug) { VENDAS = VENDAS || fs.readFileSync(path.join(__dirname, "vendas-lp.html"), "utf8"); res.set("Cache-Control", "public, max-age=300, s-maxage=600"); return res.send(VENDAS); } }
  else for (const h of [host, host.replace(/^www\./, ""), "www." + host]) { const d = (await db.doc("lp_dominios/" + h).get()).data(); if (d?.status === "ativo") { slug = d.slug; break; } }
  if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(slug)) return fora("Página não encontrada", "Confira o endereço digitado.");
  const p = (await db.doc("lp_paginas/" + slug).get()).data();
  if (!p || p.suspensa) return fora("Página indisponível", "Esta página não está no ar agora. Volte em breve.");
  const base = deUpe ? `/${slug}/` : "/";
  if (p.raiz) {
    const prin = p.principal || "index.html", resto = caminhoSeguro(deUpe ? partes.slice(1) : partes);
    if (resto === null) return fora("Arquivo não encontrado", "Confira o endereço digitado.");
    // /endereço → /endereço/ (os caminhos relativos da página dependem da barra no fim)
    if (!resto && (deUpe && !barra || prin !== "index.html")) return res.redirect(301, base + (prin === "index.html" ? "" : prin) + qs);
    const alvo = !resto ? "index.html" : barra ? resto + "/index.html" : resto;
    if (alvo !== prin) { if (await servirArquivo(res, `lp/${slug}/${alvo}`)) return; return fora("Arquivo não encontrado", "Confira o endereço digitado."); }
  }
  const previa = p.previa && req.query.previa === p.previa;
  if ((!p.publicada && !previa) || !p.html) return fora("Página indisponível", "Esta página não está no ar agora. Volte em breve.");
  let html = MONTAR(p.html, p, slug);
  const og = []; if (!/property=["']og:title/i.test(html)) og.push(`<meta property="og:title" content="${esc(p.seo?.titulo || p.titulo || slug)}">`); og.push(`<meta property="og:url" content="https://${esc(host)}${esc(req.path)}">`, `<meta property="og:type" content="website">`, `<link rel="canonical" href="https://${esc(host)}${deUpe ? "/" + slug + (p.raiz ? "/" : "") : "/"}">`);
  html = html.replace(/<\/head>/i, og.join("") + "</head>");
  res.set("Cache-Control", previa && !p.publicada ? "private, no-store" : "public, max-age=60, s-maxage=120").send(html);
});

/* ---------- domínios próprios automáticos (Firebase Hosting API) ---------- */
const hostingApi = async (caminho, metodo = "GET", corpo) => { const c = await new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] }).getClient(); const r = await c.request({ url: "https://firebasehosting.googleapis.com/v1beta1/" + caminho, method: metodo, data: corpo }).catch(e => e.response); return r; };
// raiz do domínio (ex.: marca.com.br, marca.com): o Registro.br e outros pedem só o "Nome" relativo (www, loja, @)
const SLD = /^(com|net|org|art|blog|eco|edu|gov|ind|inf|med|adv|arq|eng|nom|tur|tv|app|dev|log|srv|tec|esp|far|fot|imb|jor|mus|psi|rec|seg|vet|wiki|co|ac|or|ne|go)$/;
const raizDe = h => { const p = h.split("."); return p.length > 2 && p[p.length - 1].length === 2 && SLD.test(p[p.length - 2]) ? p.slice(-3).join(".") : p.slice(-2).join("."); };
const nomeRel = (dom, raiz) => dom === raiz ? "@" : dom.slice(0, -(raiz.length + 1));
const dnsTexto = d => { const linhas = []; for (const u of d?.requiredDnsUpdates?.desired || []) { const raiz = raizDe(u.domainName); for (const r of u.records || []) if (r.requiredAction !== "NONE") linhas.push(`Tipo ${r.type} · Nome ${nomeRel(u.domainName, raiz)} · Valor ${r.rdata}`); } return linhas.join("\n"); };
// landing pages abrem no site upe-criativo-lp; lojas no upe-criativo-lojas
const SITE_DOM = { lp_dominios: "upe-criativo-lp", lojas_dominios: "upe-criativo-lojas" };
async function conectarDominio(col, host, ref) {
  const proj = process.env.GCLOUD_PROJECT, site = SITE_DOM[col], raiz = raizDe(host);
  let r = await hostingApi(`projects/${proj}/sites/${site}/customDomains?customDomainId=${encodeURIComponent(host)}`, "POST", {});
  if (r.status >= 400 && r.status !== 409) { await ref.set({ status: "pendente", erro: JSON.stringify(r.data).slice(0, 300) }, { merge: true }); return; }
  // www.marca.com.br: a raiz (marca.com.br) também abre e redireciona para o www
  if (host === "www." + raiz) await hostingApi(`projects/${proj}/sites/${site}/customDomains?customDomainId=${encodeURIComponent(raiz)}`, "POST", { redirectTarget: host });
  await new Promise(ok => setTimeout(ok, 8000));
  const linhas = [];
  for (const h of host === "www." + raiz ? [host, raiz] : [host]) { const x = await hostingApi(`projects/${proj}/sites/${site}/customDomains/${encodeURIComponent(h)}`); if (x.status === 200) linhas.push(dnsTexto(x.data)); }
  const padrao = host === raiz ? `Tipo A · Nome @ · Valor 199.36.158.100\nTipo TXT · Nome @ · Valor hosting-site=${site}` : `Tipo CNAME · Nome ${nomeRel(host, raiz)} · Valor ${site}.web.app`;
  await ref.set({ status: "dns", dns: linhas.filter(Boolean).join("\n") || padrao, conectadoEm: Date.now() }, { merge: true });
}
const aoPedirConexao = col => onDocumentWritten(`${col}/{host}`, async ev => {
  const antes = ev.data.before.exists ? ev.data.before.data() : null, d = ev.data.after.exists ? ev.data.after.data() : null;
  if (!d || d.status !== "conectar" || (antes && antes.status === "conectar")) return;
  await conectarDominio(col, ev.params.host, ev.data.after.ref);
});
exports.dominioConectar = aoPedirConexao("lp_dominios");
exports.dominioLojaConectar = aoPedirConexao("lojas_dominios");
exports.dominiosVerificar = onSchedule({ schedule: "every 60 minutes", timeZone: TZ }, async () => {
  const proj = process.env.GCLOUD_PROJECT;
  for (const col of Object.keys(SITE_DOM)) for (const d of (await db.collection(col).where("status", "==", "dns").get()).docs) {
    const r = await hostingApi(`projects/${proj}/sites/${SITE_DOM[col]}/customDomains/${encodeURIComponent(d.id)}`); if (r.status !== 200) continue;
    const ok = r.data.hostState === "HOST_ACTIVE" && r.data.ownershipState === "OWNERSHIP_ACTIVE";
    await d.ref.set(ok ? { status: "ativo", ativoEm: Date.now() } : { dns: dnsTexto(r.data) || d.data().dns, verificadoEm: Date.now() }, { merge: true });
    if (!ok) continue;
    const emails = col === "lp_dominios" ? (await emailsDoCliente(d.data().cid)).emails : (d.data().email ? [d.data().email] : []);
    await mail(emails, `Domínio ${d.id} conectado`, caixa("Seu domínio está no ar", `<p><b>${esc(d.id)}</b> já abre a sua ${col === "lp_dominios" ? "página" : "loja"}, com cadeado (HTTPS).</p>`, "Abrir", "https://" + d.id));
  }
});

/* ---------- planilha privada para os dashboards ---------- */
exports.planilha = onCall({ invoker: "public" }, async req => {
  const u = req.auth?.token, { dash } = req.data || {}; if (!u) throw new HttpsError("unauthenticated", "Entre no painel.");
  const d = (await db.doc("dash_paineis/" + String(dash || "")).get()).data(); if (!d) throw new HttpsError("not-found", "Dashboard não encontrado.");
  if (!(await membro({ ...u, uid: req.auth.uid }, d.cid))) throw new HttpsError("permission-denied", "Sem permissão.");
  if (!d.sheetId) throw new HttpsError("failed-precondition", "Dashboard sem planilha.");
  const c = await new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] }).getClient();
  const r = await c.request({ url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(d.sheetId)}/values/${encodeURIComponent(d.aba || "A1:Z5000")}` }).catch(e => e.response);
  if (r.status !== 200) throw new HttpsError("permission-denied", "Compartilhe a planilha (leitor) com a conta de serviço: " + (await c.getCredentials()).client_email);
  const [cab = [], ...linhas] = r.data.values || [];
  return { linhas: linhas.slice(0, 5000).map(l => Object.fromEntries(cab.map((k, i) => [String(k).trim(), l[i] ?? ""]))) };
});
