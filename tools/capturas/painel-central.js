// Painel central (modo demonstração): admin (Serviços e preços, ficha › Serviços) e cliente (login por e-mail, serviços embutidos, painel personalizado, pagamentos por frente).
// Uso: node tools/capturas/painel-central.js [pasta-das-capturas]
const __R = require('path').resolve(__dirname, '../..'), __T = process.env.UPE_TRABALHO || __R + '/tools/.trabalho';
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const O = process.argv[2] || __T; fs.mkdirSync(O, { recursive: true });
const SITE = __R + '/site';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/^https?:\/\/(?!srv\.test)/, r => r.abort());
  await ctx.route(/^http:\/\/srv\.test\//, r => {
    let u = decodeURIComponent(new URL(r.request().url()).pathname);
    if (u === '/portal/config.js') return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(SITE + '/portal/config.js', 'utf8') + '\nwindow.PORTAL_CONFIG.firebase = null;' });
    let f = path.join(SITE, u); if (u.endsWith('/')) f += 'index.html';
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const ct = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' }[path.extname(f)] || 'text/plain';
    r.fulfill({ path: f, contentType: ct });
  });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('PAGE ' + e.message)); p.on('dialog', d => d.accept());
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('CONS ' + m.text().slice(0, 200)); });
  const ok = (c, msg) => { if (!c) errs.push('FALHOU ' + msg); else console.log('✓', msg); };
  const LS = async () => p.evaluate(() => JSON.parse(localStorage.getItem('upe-portal-demo-v6')).cols);
  const vai = async (h, t = 1200) => { await p.evaluate(h => location.hash = h, h); await p.waitForTimeout(t); };

  // ---------- administrador ----------
  await p.goto('http://srv.test/portal/#/admin'); await p.waitForSelector('#aEmail');
  await p.fill('#aEmail', 'admin@upe.demo'); await p.fill('#aPass', 'upe-demo'); await p.click('#fAdm button[type=submit]');
  await p.waitForSelector('tr[data-id]'); await p.screenshot({ path: `${O}/pc-a-clientes.png` });
  for (const f of ['branding', 'erp', 'landing', 'sistemas']) {
    await vai('#/admin/apps/' + f, 1500); const t = await p.textContent('#w');
    ok(/Preços ·/.test(t), `Serviços e preços › ${f} mostra o editor de preços`); await p.screenshot({ path: `${O}/pc-a-precos-${f}.png`, fullPage: true });
  }
  // muda o preço da landing page (fonte: srv_planos)
  await vai('#/admin/apps/landing', 1500);
  const nLin = await p.$$eval('#precos tr[data-i]', l => l.length); ok(nLin >= 4, 'linhas de preço da landing (planos e criação): ' + nLin);
  await p.click('#prAdd'); await p.fill('#precos tr[data-i]:last-child [data-f=nome]', 'Hospedagem teste'); await p.fill('#precos tr[data-i]:last-child [data-f=preco]', '33.3');
  await p.click('#prSv'); await p.waitForTimeout(1500);
  let cols = await LS(); ok(Object.values(cols['srv_planos'] || {}).some(x => x.nome === 'Hospedagem teste' && x.valor === 33.3 && x.frente === 'lp'), 'preço salvo direto em srv_planos (catálogo das páginas de vendas)');
  // ERP: preço vai para o gerenciador e para o plano público
  await vai('#/admin/apps/erp', 1500); await p.fill('#precos tr[data-i="0"] [data-f=preco]', '59.9'); await p.click('#prSv'); await p.waitForTimeout(1500);
  cols = await LS(); ok((cols['upe/gestao/config'] || {}).geral?.mensal === 59.9 && (cols['publico'] || {}).plano?.mensal === 59.9, 'preço do ERP gravado em upe/gestao/config/geral e publico/plano');
  // branding
  await vai('#/admin/apps/branding', 1500); await p.fill('#precos tr[data-i="1"] [data-f=preco]', '990'); await p.click('#prSv'); await p.waitForTimeout(1500);
  cols = await LS(); ok(((cols['config'] || {}).publico?.precos?.branding || []).some(x => x.k === 'midias' && x.preco === 990), 'preço de branding gravado em config/publico');

  // ficha do cliente › Serviços: libera os acessos
  await vai('#/admin/clientes', 1200); await p.click('tr[data-id]:has-text("Café Aurora")'); await p.waitForTimeout(1200);
  const cid = await p.evaluate(() => location.hash.split('/')[3]);
  await vai(`#/admin/cliente/${cid}/apps`, 1800); await p.screenshot({ path: `${O}/pc-a-ficha-servicos.png`, fullPage: true });
  await p.fill('#svEmail', 'cliente@upe.demo'); await p.selectOption('[data-app="erp"] [data-k=status]', 'ativo');
  await p.click('#caSv'); await p.waitForTimeout(2500);
  cols = await LS();
  ok((cols['portal_convites'] || {})['cliente@upe.demo']?.cliente === cid, 'convite do painel central (portal_convites)');
  const emp = (cols['clientes'][cid].apps.erp || {}).empresa;
  ok(emp && (cols['empresas'] || {})[emp] && (cols['convites'] || {})['cliente@upe.demo']?.empresa === emp, 'ERP liberado: empresa ' + emp + ' + convite');
  ok(Object.values(cols['upe/gestao/clientes'] || {}).some(x => x.portalId === cid), 'cliente aparece no Gerenciador do ERP (upe/gestao/clientes)');
  ok((cols['srv_clientes'] || {})[cid]?.frentes?.join(',') === 'lp,agenda,dash' && (cols['srv_convites'] || {})['cliente@upe.demo']?.cid === cid, 'Landing pages e Sistemas liberados com o mesmo id');
  await p.screenshot({ path: `${O}/pc-a-ficha-salva.png`, fullPage: true });
  // ficha adaptável: aba Páginas e sistemas (serviços de páginas ligados) e envio da pasta inteira
  const abas = await p.$$eval('.subtabs a', l => l.map(a => a.getAttribute('href').split('/').pop()));
  ok(abas.includes('paginas') && abas.includes('apresentacao'), 'abas da ficha conforme os serviços: ' + abas.join(' '));
  ok(!(await p.textContent('#w')).includes('Upe TV'), 'ficha sem o Upe TV');
  await vai(`#/admin/cliente/${cid}/paginas`, 1500);
  await p.click('#pgNova'); await p.waitForSelector('#epPasta');
  await p.selectOption('#epTipo', 'sistema'); await p.fill('#epNome', 'Sistema de pedidos'); await p.fill('#epSlug', 'cafe-aurora-pedidos');
  await p.setInputFiles('#epPasta', __dirname + '/fixtures/pagina-exemplo'); await p.waitForTimeout(800);
  ok(/7 arquivo/.test(await p.textContent('#epInfo')), 'pasta lida: ' + (await p.textContent('#epInfo')));
  await p.click('#epOk'); await p.waitForTimeout(4000);
  cols = await LS(); const pg = (cols['lp_paginas'] || {})['cafe-aurora-pedidos'] || {};
  ok(pg.cid === cid && pg.publicada && pg.tipo === 'sistema' && pg.painelCliente && pg.arquivos === 6, 'página/sistema publicado com ' + pg.arquivos + ' arquivo(s) no Storage');
  ok(pg.html && !/href="css\/estilo\.css"|src="img\/logo\.svg"|\.\/js\/app\.js/.test(pg.html) && (pg.html.match(/idb:/g) || []).length >= 3, 'caminhos do HTML trocados pelos arquivos enviados');
  const cssOk = await p.evaluate(() => { const u = new Map([['fonts/exemplo.woff2', 'URL-FONTE'], ['img/fundo.svg', 'URL-FUNDO']]); const t = window.__upeTrocarRefs('src: url("../fonts/exemplo.woff2"); background: url(../img/fundo.svg)', 'css/', u); return t.includes('url("URL-FONTE")') && t.includes('url(URL-FUNDO)'); });
  ok(cssOk, 'caminhos dentro do CSS (fontes e imagens) também são trocados');
  await p.screenshot({ path: `${O}/pc-a-paginas.png`, fullPage: true });
  // sair do admin
  await vai('#/admin/clientes', 800); await p.click('#logout'); await p.waitForTimeout(800);

  // ---------- cliente: login por e-mail ----------
  await p.goto('http://srv.test/portal/#/'); await p.waitForSelector('#kEmail'); await p.screenshot({ path: `${O}/pc-c-login.png` });
  await p.fill('#kEmail', 'cliente@upe.demo'); await p.fill('#kPass', 'upe-demo'); await p.click('#fConta button[value=entrar]');
  await p.waitForSelector('.cside .nav a'); await p.waitForTimeout(800);
  const nav = await p.$$eval('.cside .nav a', l => l.map(a => a.getAttribute('href')));
  ok(nav.includes('#/c/servicos') && nav.includes('#/c/mensagens') && nav.includes('#/c/pagamentos') && !nav.some(h => /s-|tv/.test(h)), 'menu simplificado do cliente: ' + nav.join(' '));
  await p.waitForTimeout(800); await p.screenshot({ path: `${O}/pc-c-inicio.png`, fullPage: true });
  await vai('#/c/servicos', 1800); await p.screenshot({ path: `${O}/pc-c-servicos.png`, fullPage: true });
  const botoes = await p.$$eval('.meus a', l => l.map(a => a.textContent.trim()));
  ok(botoes.some(t => /^Painel – Loja/.test(t)) && botoes.some(t => /^Painel – Páginas/.test(t)) && botoes.some(t => /^Painel – Agenda/.test(t)) && botoes.some(t => t === 'Painel – Sistema de pedidos'), 'Meus serviços com os botões de painel: ' + botoes.join(' | '));
  await p.click('.meus a:has-text("Painel – Sistema de pedidos")'); await p.waitForTimeout(1200);
  ok((await p.evaluate(() => location.hash)) === '#/c/app/cafe-aurora-pedidos' && !!(await p.$('iframe.svc-frame')), 'botão abre o sistema do cliente dentro do painel');
  // painel personalizado (ERP): HTML isolado que abre os pagamentos
  await vai('#/c/s-erp', 2000); await p.screenshot({ path: `${O}/pc-c-erp-personalizado.png` });
  const fr = p.frames().find(f => f !== p.mainFrame() && f.url() === 'about:srcdoc');
  ok(!!fr, 'painel personalizado aberto em iframe isolado');
  if (fr) { ok(/Painel da Café Aurora/.test(await fr.textContent('#t')), 'painel personalizado recebeu os dados do cliente'); await fr.click('#pg'); await p.waitForTimeout(1200); ok((await p.evaluate(() => location.hash)) === '#/c/s-erp/pagamentos', 'botão do painel personalizado abriu os pagamentos do serviço'); }
  await p.screenshot({ path: `${O}/pc-c-erp-pagamentos.png` });
  // landing pages: painel do Upe Serviços embutido
  await vai('#/c/s-landing', 4000);
  const fl = p.frames().find(f => /apps\/servicos\//.test(f.url()));
  ok(!!fl, 'Landing pages abre o Painel Upe Serviços embutido');
  if (fl) { await fl.waitForSelector('#nav button', { timeout: 15000 }).catch(() => {}); const bts = await fl.$$eval('#nav button', l => l.map(x => x.dataset.ir)); ok(bts.includes('#/paginas') && !bts.includes('#/conta') && !bts.some(x => x.startsWith('#/adm')), 'embutido mostra só as seções da frente: ' + bts.join(' ')); }
  await p.screenshot({ path: `${O}/pc-c-landing.png` });
  await vai('#/c/s-sistemas', 4000);
  const fs2 = p.frames().find(f => /frente=sistemas/.test(f.url()));
  if (fs2) { await fs2.waitForSelector('#nav button', { timeout: 15000 }).catch(() => {}); const bts = await fs2.$$eval('#nav button', l => l.map(x => x.dataset.ir)); ok(bts.includes('#/agenda') && bts.includes('#/dash') && !bts.includes('#/paginas'), 'Sistemas embutido: ' + bts.join(' ')); } else ok(false, 'Sistemas embutido');
  await p.screenshot({ path: `${O}/pc-c-sistemas.png` });
  // pagamentos unificados, com filtro por serviço
  await vai('#/c/pagamentos', 1500); await p.screenshot({ path: `${O}/pc-c-pagamentos.png`, fullPage: true });
  const filtros = await p.$$eval('[aria-label="Filtrar por serviço"] a', l => l.map(a => a.textContent));
  ok(filtros.length >= 2, 'filtro por serviço nos pagamentos: ' + filtros.join(', '));
  await vai('#/c/mensagens', 1200); await p.screenshot({ path: `${O}/pc-c-mensagens.png`, fullPage: true });
  // celular
  await p.setViewportSize({ width: 390, height: 844 }); await vai('#/c/s-landing', 3000);
  const largura = await p.evaluate(() => document.documentElement.scrollWidth); ok(largura <= 392, 'sem rolagem lateral no celular (' + largura + 'px)');
  await p.screenshot({ path: `${O}/pc-c-landing-celular.png` });
  console.log('ERROS', JSON.stringify(errs, null, 1)); await b.close(); process.exit(errs.length ? 1 : 0);
})();
