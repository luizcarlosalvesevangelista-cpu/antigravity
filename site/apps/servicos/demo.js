/* Dados fictícios do modo demonstração (?demo=1): ficam só no navegador. */
import { PLANOS_PADRAO } from "./srv.js";

export function semente() {
  const M = {}, agora = Date.now(), DIA = 864e5, iso = t => new Date(t).toISOString().slice(0, 10);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(r() * a.length)];
  const put = (p, d) => { M[p] = d; }, id = () => Math.floor(r() * 1e12).toString(36);
  PLANOS_PADRAO.forEach(p => put("srv_planos/" + p.id, p));
  put("srv_config/publico", { pixChave: "pix@upecriativo.exemplo", pixNome: "Upe Criativo", pixCidade: "Sao Paulo", whatsapp: "5511934393249" });
  const ref = d => iso(d).slice(0, 7), mes = k => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + k); return d; };
  put("srv_clientes/demo-studio", { nome: "Studio Bem Estar", emails: ["cliente@exemplo.com"], whatsapp: "11 99999-0001", doc: "", frentes: ["lp", "agenda", "dash"], obs: "",
    plano: { criacao: { id: "lp-essencial", nome: "Landing page essencial", valor: 497, parcelas: 1, status: "pago", prazo: iso(agora - 40 * DIA) }, mensal: { id: "lp-hospedagem-ajustes", nome: "Hospedagem + ajustes", valor: 79.9, dia: 10, status: "ativo", fimTeste: "" } }, criadoEm: agora - 60 * DIA });
  put("srv_clientes/demo-clinica", { nome: "Clínica Sorriso Leve", emails: ["contato@sorrisoleve.exemplo"], whatsapp: "11 99999-0002", frentes: ["agenda", "dash"], obs: "Dashboard de faturamento em produção",
    plano: { criacao: { id: "ag-criacao", nome: "Agenda online", valor: 697, parcelas: 2, status: "pago" }, mensal: { id: "ag-mensal", nome: "Agenda no ar", valor: 49.9, dia: 5, status: "atrasado" } }, criadoEm: agora - 90 * DIA });
  put("srv_clientes/demo-cafe", { nome: "Café Ponto Central", emails: ["cafe@pontocentral.exemplo"], whatsapp: "11 99999-0003", frentes: ["lp"], obs: "",
    plano: { criacao: { id: "lp-envio", nome: "Envie o seu HTML", valor: 0, status: "pago" }, mensal: { id: "lp-hospedagem", nome: "Hospedagem", valor: 29.9, dia: 15, status: "teste", fimTeste: iso(agora + 10 * DIA) } }, criadoEm: agora - 4 * DIA });
  put("srv_convites/cliente@exemplo.com", { cid: "demo-studio" }); put("srv_acessos/demo-cliente", { cid: "demo-studio", email: "cliente@exemplo.com" });
  put("srv_clientes/demo-studio/cobrancas/criacao", { tipo: "criacao", descricao: "Criação: Landing page essencial", valor: 497, venc: iso(agora - 55 * DIA), status: "paga", pagoEm: agora - 54 * DIA });
  for (const k of [-2, -1, 0]) { const d = mes(k), rf = ref(d); put(`srv_clientes/demo-studio/cobrancas/m-${rf}`, { tipo: "mensalidade", ref: rf, descricao: `Hospedagem + ajustes · ${d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`, valor: 79.9, venc: rf + "-10", status: k < 0 ? "paga" : "aberta", pagoEm: k < 0 ? d.getTime() + 9 * DIA : null }); }
  for (const k of [-1, 0]) { const d = mes(k), rf = ref(d); put(`srv_clientes/demo-clinica/cobrancas/m-${rf}`, { tipo: "mensalidade", ref: rf, descricao: `Agenda no ar · ${d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`, valor: 49.9, venc: rf + "-05", status: k < 0 ? "aberta" : "informada", obsCliente: k < 0 ? "" : "Paguei pelo PIX hoje" }); }
  put("srv_clientes/demo-studio/chamados/c1", { cid: "demo-studio", cliente: "Studio Bem Estar", assunto: "Trocar os depoimentos da página", pagina: "studio-bem-estar", status: "respondido", criadoEm: agora - 3 * DIA, atualizadoEm: agora - 2 * DIA,
    msgs: [{ de: "cliente", txt: "Oi! Quero trocar os três depoimentos pelos novos que mandei no Drive: drive.google.com/…", em: agora - 3 * DIA }, { de: "upe", txt: "Feito! Já está no rascunho. Confira e toque em Publicar alterações.", em: agora - 2 * DIA }] });
  // páginas
  put("lp_paginas/studio-bem-estar", { cid: "demo-studio", titulo: "Avaliação gratuita", html: "", demoModelo: "servico", publicada: true, suspensa: false, seo: { titulo: "Studio Bem Estar · Avaliação gratuita", descricao: "Agende a sua avaliação gratuita no Studio Bem Estar. Atendimento individual e horários flexíveis." },
    whatsapp: { ativo: true, numero: "5511999990001", mensagem: "Olá! Vim pela página e quero agendar a avaliação." }, pixel: {}, criadoEm: agora - 45 * DIA, atualizadoEm: agora - 2 * DIA, dominio: "www.studiobemestar.com.br" });
  put("lp_paginas/workshop-alongamento", { cid: "demo-studio", titulo: "Workshop de alongamento", html: "", demoModelo: "lancamento", publicada: false, suspensa: false, seo: { titulo: "Workshop" }, whatsapp: { ativo: false }, pixel: {}, criadoEm: agora - 2 * DIA, atualizadoEm: agora - 1 * DIA });
  put("lp_paginas/cafe-ponto-central", { cid: "demo-cafe", titulo: "Cardápio de verão", html: "", demoModelo: "servico", publicada: true, suspensa: false, seo: {}, whatsapp: {}, pixel: {}, criadoEm: agora - 3 * DIA, atualizadoEm: agora - 3 * DIA });
  put("lp_dominios/www.studiobemestar.com.br", { cid: "demo-studio", slug: "studio-bem-estar", status: "dns", cliente: "Studio Bem Estar", criadoEm: agora - 5 * DIA });
  put("lp_dominios/cafepontocentral.com.br", { cid: "demo-cafe", slug: "cafe-ponto-central", status: "pendente", cliente: "Café Ponto Central", criadoEm: agora - DIA });
  // eventos e leads (45 dias)
  const origens = [["instagram|cpc|avaliacao", ""], ["instagram||bio", ""], ["", "google.com"], ["", ""], ["facebook|cpc|avaliacao", ""], ["", "l.instagram.com"]], nomes = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabi", "Hugo", "Íris", "João", "Lara", "Marcos", "Nina", "Otávio", "Paula", "Rafa", "Sofia", "Tiago"];
  const vids = Array.from({ length: 900 }, (_, i) => "v" + i);
  for (let d = 44; d >= 0; d--) {
    const dia = new Date(agora - d * DIA), fds = [0, 6].includes(dia.getDay()), n = Math.round((fds ? 18 : 34) + r() * 22 + (44 - d) * .5);
    for (let i = 0; i < n; i++) {
      const t = dia.setHours(8 + Math.floor(r() * 14), Math.floor(r() * 60)), vid = pick(vids), [utm, ref] = pick(origens), disp = r() < .72 ? "celular" : r() < .8 ? "tablet" : "computador";
      const e = (tipo, x = {}) => put(`lp_paginas/studio-bem-estar/eventos/${id()}`, { tipo, t: t + Math.floor(r() * 9e4), vid, ...x });
      e("visita", { ref, utm, disp });
      const prof = r(); [25, 50, 75, 100].forEach(p => { if (prof > p / 120) e("rolagem", { prof: p }); });
      if (r() < .22) e("clique", { alvo: pick(["Quero a minha avaliação", "Como funciona", "Agendar avaliação"]) });
      if (r() < .09) e("whatsapp", { alvo: "WhatsApp" });
      if (r() < .045) { e("lead"); put(`lp_paginas/studio-bem-estar/leads/${id()}`, { campos: { nome: pick(nomes) + " " + pick(["Silva", "Souza", "Lima", "Costa", "Rocha"]), whatsapp: "11 9" + Math.floor(1e7 + r() * 9e7), periodo: pick(["Manhã", "Tarde", "Noite"]) }, t, vid, utm, status: d > 7 ? pick(["contato", "cliente", "descartado", "contato"]) : "novo" }); }
    }
  }
  // agenda
  const sv = [{ id: "s1", nome: "Avaliação gratuita", dur: 30, preco: 0 }, { id: "s2", nome: "Treino funcional", dur: 60, preco: 90 }, { id: "s3", nome: "Pilates", dur: 60, preco: 120 }, { id: "s4", nome: "Fisioterapia", dur: 60, preco: 150 }];
  put("agenda_paginas/studio-bem-estar", { cid: "demo-studio", nome: "Studio Bem Estar", ativo: true, cor: "#1f6f5c", boasVindas: "Escolha o serviço, o dia e o horário. Você recebe a confirmação pelo WhatsApp.", endereco: "Rua Exemplo, 123 · São Paulo/SP", whatsapp: "5511999990001",
    intervalo: 30, antecedenciaH: 2, diasFrente: 30, servicos: sv, horarios: { 0: [], 1: [["07:00", "20:00"]], 2: [["07:00", "20:00"]], 3: [["07:00", "20:00"]], 4: [["07:00", "20:00"]], 5: [["07:00", "18:00"]], 6: [["08:00", "12:00"]] }, folgas: [], criadoEm: agora - 40 * DIA });
  for (let d = -30; d <= 7; d++) {
    const dia = new Date(agora + d * DIA); if (dia.getDay() === 0) continue; const data = iso(dia.getTime()), usados = new Set();
    const n = Math.round(4 + r() * 6) - (d > 2 ? 3 : 0);
    for (let i = 0; i < n; i++) {
      const s0 = pick(sv), h = 7 + Math.floor(r() * 11), hora = String(h).padStart(2, "0") + ":" + (r() < .5 ? "00" : "30"), hh = hora.replace(":", "");
      if (usados.has(hh) || (dia.getDay() === 6 && h >= 12)) continue;
      const sl = []; for (let m = h * 60 + +hora.slice(3); m < h * 60 + +hora.slice(3) + s0.dur; m += 30) { const k = String(Math.floor(m / 60)).padStart(2, "0") + String(m % 60).padStart(2, "0"); if (usados.has(k)) { sl.length = 0; break; } sl.push(k); }
      if (!sl.length) continue; sl.forEach(k => { usados.add(k); put(`agenda_paginas/studio-bem-estar/slots/${data}_${k}`, { data, hora: k, r: `${data}_${sl[0]}` }); });
      const st = d < 0 ? pick(["concluida", "concluida", "concluida", "cancelada", "faltou"]) : d === 0 ? pick(["confirmada", "nova"]) : pick(["confirmada", "nova", "nova"]);
      put(`agenda_paginas/studio-bem-estar/reservas/${data}_${sl[0]}`, { servico: s0.nome, data, hora, dur: s0.dur, nome: pick(nomes) + " " + pick(["Silva", "Souza", "Lima", "Costa"]), telefone: "11 9" + Math.floor(1e7 + r() * 9e7), email: "", obs: "", status: st, t: agora + (d - 2) * DIA, slots: sl.map(k => `${data}_${k}`) });
    }
  }
  put("dash_paineis/demo-ag", { cid: "demo-studio", titulo: "Atendimentos do estúdio", fonte: "agenda", ordem: 1, widgets: [
    { id: "a", tipo: "kpi", rotulo: "Agendamentos", agg: "contar" }, { id: "b", tipo: "kpi", rotulo: "Faturamento dos atendimentos", agg: "soma", col: "valor", moeda: true, filtro: "situacao=concluida" }, { id: "c", tipo: "kpi", rotulo: "Faltas", agg: "contar", filtro: "situacao=faltou" },
    { id: "d", tipo: "serie", rotulo: "Agendamentos por dia", colData: "data", agg: "contar", periodo: "dia" }, { id: "e", tipo: "ranking", rotulo: "Serviços mais agendados", colCat: "servico", agg: "contar" }, { id: "f", tipo: "ranking", rotulo: "Faturamento por serviço (R$)", colCat: "servico", col: "valor", agg: "soma", moeda: true, filtro: "situacao=concluida" }] });
  put("dash_paineis/demo-lp", { cid: "demo-studio", titulo: "Marketing da página", fonte: "lp", ordem: 2, widgets: [
    { id: "a", tipo: "kpi", rotulo: "Visitas (90 dias)", agg: "contar", filtro: "tipo=visita" }, { id: "b", tipo: "kpi", rotulo: "Leads (90 dias)", agg: "contar", filtro: "tipo=lead" }, { id: "c", tipo: "kpi", rotulo: "Cliques no WhatsApp", agg: "contar", filtro: "tipo=whatsapp" },
    { id: "d", tipo: "serie", rotulo: "Leads por dia", colData: "data", agg: "contar", filtro: "tipo=lead", periodo: "dia" }, { id: "e", tipo: "ranking", rotulo: "Origem das visitas", colCat: "origem", agg: "contar", filtro: "tipo=visita" }] });
  [["Marina Duarte", "lp", "Landing page completa", "Quero uma página para o lançamento do meu curso em dezembro."], ["Pet Shop Amigo Fiel", "agenda", "Agenda online", "Agendamento de banho e tosa pelo site."], ["Rota Auto Center", "dash", "Dashboard sob medida", "Acompanhar vendas e serviços por mecânico."]]
    .forEach(([nome, frente, plano, mensagem], i) => put(`srv_interessados/i${i}`, { nome, frente, plano, mensagem, whatsapp: "11 98888-000" + i, email: "", origem: frente === "lp" ? "upe-criativo-lp" : "upe-criativo-sistemas", status: i ? "novo" : "contato", criadoEm: agora - (i + 1) * 8e6 }));
  return M;
}
