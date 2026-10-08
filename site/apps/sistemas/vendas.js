/* Páginas de vendas: planos do catálogo (srv_planos, editável no Painel Upe Serviços) e formulário de interesse (srv_interessados). */
import { listar, criar, esc, brl } from "./pub.js";
const PADRAO = [
  { id: "lp-envio", frente: "lp", tipo: "criacao", nome: "Envie o seu HTML", valor: 0, descricao: "Você já tem a página pronta: é só subir o arquivo e publicar.", itens: ["Publicação no endereço Upe", "Painel de análise e leads", "Conexão do seu domínio"], ordem: 1, ativo: true },
  { id: "lp-essencial", frente: "lp", tipo: "criacao", nome: "Landing page essencial", valor: 497, descricao: "Uma página de venda com a sua marca, pronta em até 7 dias úteis.", itens: ["Até 5 seções", "Formulário de contato e botão de WhatsApp", "Versão para celular", "1 rodada de ajustes"], ordem: 2, ativo: true },
  { id: "lp-completa", frente: "lp", tipo: "criacao", nome: "Landing page completa", valor: 997, descricao: "Página completa com texto de venda, SEO e marcação de anúncios.", itens: ["Até 10 seções", "Texto de venda (copy) incluso", "SEO, Meta Pixel e Google Analytics", "2 rodadas de ajustes"], ordem: 3, ativo: true },
  { id: "lp-hospedagem", frente: "lp", tipo: "mensal", nome: "Hospedagem", valor: 29.9, descricao: "Página no ar com painel de análise.", itens: ["Página no ar 24 h", "Visitas, cliques e leads no painel", "Domínio próprio conectado"], ordem: 4, ativo: true },
  { id: "lp-hospedagem-ajustes", frente: "lp", tipo: "mensal", nome: "Hospedagem + ajustes", valor: 79.9, descricao: "A Upe faz pequenas alterações todo mês.", itens: ["Tudo da Hospedagem", "Até 2 pedidos de ajuste por mês", "Relatório mensal de resultados"], ordem: 5, ativo: true },
  { id: "ag-criacao", frente: "agenda", tipo: "criacao", nome: "Agenda online", valor: 697, descricao: "Página de agendamento com os seus serviços e horários.", itens: ["Serviços com duração e preço", "Horários por dia da semana", "Confirmação pelo WhatsApp", "Link para a bio e o Google"], ordem: 6, ativo: true },
  { id: "ag-mensal", frente: "agenda", tipo: "mensal", nome: "Agenda no ar", valor: 49.9, descricao: "Agendamentos ilimitados com painel.", itens: ["Agendamentos ilimitados", "Painel com a agenda do dia", "Dashboard de atendimentos"], ordem: 7, ativo: true },
  { id: "dash-criacao", frente: "dash", tipo: "criacao", nome: "Dashboard sob medida", valor: 1200, descricao: "Indicadores do seu negócio num painel só, a partir das suas planilhas.", itens: ["Reunião para definir os indicadores", "Até 8 indicadores e 3 gráficos", "Atualização automática pela planilha"], ordem: 8, ativo: true },
  { id: "dash-mensal", frente: "dash", tipo: "mensal", nome: "Dashboard no ar", valor: 59.9, descricao: "Painel sempre atualizado, com suporte.", itens: ["Painel online 24 h", "Ajustes de indicadores", "Suporte pelo WhatsApp"], ordem: 9, ativo: true },
];
export async function planos(frentes, alvo) {
  let ps = (await listar("srv_planos").catch(() => [])).filter(p => p.ativo !== false);
  if (!ps.length) ps = PADRAO; ps = ps.filter(p => frentes.includes(p.frente)).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const nomes = { lp: "Landing pages", agenda: "Agenda online", dash: "Dashboards" };
  const card = (p, dest) => `<article class="plano ${dest ? "dest" : ""}"><span class="tipo">${p.tipo === "mensal" ? "Mensalidade" : "Criação"}</span><h3>${esc(p.nome)}</h3>
    <div class="valor">${+p.valor ? brl(p.valor).replace(",00", "") : "Grátis"}${p.tipo === "mensal" && +p.valor ? "<small>/mês</small>" : ""}</div><p>${esc(p.descricao || "")}</p>${(p.itens || []).length ? `<ul>${p.itens.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}
    <a class="btn ${dest ? "creme" : "azul"}" href="#contato" data-plano="${esc(p.nome)}" data-frente="${esc(p.frente)}">Quero este</a></article>`;
  alvo.innerHTML = frentes.map(f => { const cr = ps.filter(p => p.frente === f && p.tipo !== "mensal"), me = ps.filter(p => p.frente === f && p.tipo === "mensal");
    return `${frentes.length > 1 ? `<h3 class="grupo-t">${nomes[f]}</h3>` : ""}${cr.length ? `${frentes.length > 1 ? "" : `<h3 class="grupo-t">Criação (pagamento único)</h3>`}<div class="planos">${cr.map((p, i) => card(p, i === 1 || (cr.length === 1 && i === 0))).join("")}</div>` : ""}
      ${me.length ? `<h3 class="grupo-t">${frentes.length > 1 ? "Mensalidade" : "Mensalidade (página no ar)"}</h3><div class="planos">${me.map(p => card(p, false)).join("")}</div>` : ""}`; }).join("");
  alvo.addEventListener("click", e => { const b = e.target.closest("[data-plano]"); if (!b) return; const f = document.querySelector("#fContato"); if (f) { f.plano.value = b.dataset.plano; if (f.frente) f.frente.value = b.dataset.frente; } });
  const sel = document.querySelector("#fContato [name=plano]"); if (sel) sel.innerHTML = `<option value="">Ainda não sei</option>` + ps.map(p => `<option>${esc(p.nome)}</option>`).join("");
}
export function contato(frentePadrao, origem) {
  const f = document.querySelector("#fContato"); if (!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault(); const d = new FormData(f), b = f.querySelector("button"); b.disabled = true;
    try {
      await criar("srv_interessados", { nome: String(d.get("nome")).trim().slice(0, 120), whatsapp: String(d.get("whatsapp") || "").trim().slice(0, 40), email: String(d.get("email") || "").trim().slice(0, 120), frente: String(d.get("frente") || frentePadrao), plano: String(d.get("plano") || "").slice(0, 80), mensagem: String(d.get("mensagem") || "").trim().slice(0, 1000), origem, status: "novo", criadoEm: Date.now() });
      f.outerHTML = `<div class="okmsg" role="status">Recebemos o seu contato! A Upe responde pelo WhatsApp em até 1 dia útil. Se preferir, <a href="https://wa.me/5511934393249?text=${encodeURIComponent("Olá! Acabei de preencher o formulário em " + origem + ".")}" target="_blank" rel="noopener">chame agora</a>.</div>`;
    } catch (er) { b.disabled = false; alert(er.message); }
  });
}
