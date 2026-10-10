// Testa o Kit Upe (site/apps/lp/kit/upe-kit.js) numa página com todos os data-upe-*, com loja e agenda simuladas (sem banco).
const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
const {chromium}=require('playwright');const fs=require('fs');
const S=v=>typeof v==='number'?(Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v}):Array.isArray(v)?{arrayValue:{values:v.map(S)}}:typeof v==='object'?{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,S(x)]))}}:{stringValue:String(v)};
const doc=(n,d)=>({name:'projects/x/databases/(default)/documents/'+n,fields:Object.fromEntries(Object.entries(d).map(([k,v])=>[k,S(v)]))});
const PRODS=[['bolo',{nome:'Bolo de cenoura',preco:58,promo:49.9,classe:'Bolos',estoque:8,imagem:''}],['brig',{nome:'Caixa de brigadeiros',preco:42,classe:'Doces',estoque:30,imagem:''}],['cookie',{nome:'Cookies (6 un.)',preco:24,classe:'Doces',estoque:0,imagem:''}]];
const PAGE=`<!doctype html><html lang="pt-BR" data-upe-loja="doce-encanto" data-upe-agenda="studio" data-upe-whatsapp="5511999990001"><head><meta charset="utf-8"><title>Teste kit</title><style>:root{--upe-cor:#8b3a62}</style></head><body>
<nav><a data-upe-link="inicio">Início</a> <a data-upe-link="loja">Loja</a> <a data-upe-link="agenda">Agendar</a> <a data-upe-link="produto:bolo">Bolo</a> <a data-upe-link="whatsapp" data-mensagem="Oi">WhatsApp</a></nav>
<h2>Todos</h2><div id="todos" data-upe-produtos></div>
<h2>Doces com modelo</h2><div id="doces" data-upe-produtos data-categoria="Doces"><template><div class="p"><b data-campo="nome"></b> <span data-campo="preco"></span> <button data-upe-acao="carrinho">Pôr</button></div></template></div>
<h2>Ofertas</h2><div id="ofertas" data-upe-produtos data-destaque></div>
<p>Preço do bolo: <span id="pb" data-upe-preco="bolo">—</span></p>
<div data-upe-carrinho data-flutuante></div>
<h2>Serviços</h2><div id="servs" data-upe-servicos></div>
<button data-upe-whatsapp data-mensagem="Quero saber mais" id="wbt">Fale conosco</button>
<script src="/kit/upe-kit.js"></script></body></html>`;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1200,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('popup',()=>{});
await ctx.route(/firestore\.googleapis\.com/,r=>{const u=decodeURIComponent(r.request().url());let body={};
 if(/lojas\/doce-encanto\/produtos/.test(u))body={documents:PRODS.map(([id,d])=>doc('lojas/doce-encanto/produtos/'+id,d))};
 else if(/lojas\/doce-encanto\/publico\/config/.test(u))body=doc('lojas/doce-encanto/publico/config',{nome:'Doce Encanto'});
 else if(/agenda_paginas\/studio/.test(u))body=doc('agenda_paginas/studio',{nome:'Studio',servicos:[{id:'s1',nome:'Avaliação',dur:30,preco:0},{id:'s2',nome:'Pilates',dur:60,preco:120}]});
 r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(body)})});
await ctx.route(/^http:\/\/kit\.test\//,r=>{const u=new URL(r.request().url()).pathname;if(u==='/kit/upe-kit.js')return r.fulfill({path:__R+'/site/apps/lp/kit/upe-kit.js',contentType:'application/javascript'});r.fulfill({body:PAGE,contentType:'text/html'})});
await p.goto('http://kit.test/');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>({links:[...document.querySelectorAll('nav a')].map(a=>a.getAttribute('href')),todos:document.querySelectorAll('#todos .upe-card').length,doces:document.querySelectorAll('#doces .p').length,ofertas:document.querySelectorAll('#ofertas .upe-card').length,esgotado:[...document.querySelectorAll('#todos button')].map(b=>b.textContent),preco:document.querySelector('#pb').textContent,servs:[...document.querySelectorAll('#servs a')].map(a=>a.getAttribute('href'))}));
console.log(JSON.stringify(r,null,1));
await p.click('#todos [data-pid="bolo"]');await p.click('#doces [data-pid="brig"]');await p.click('#doces [data-pid="brig"]');
console.log('contador:',await p.textContent('[data-upe-carrinho] .upe-qtd'));
await p.click('[data-upe-carrinho] button');await p.waitForTimeout(300);await p.screenshot({path:__T+'/kit-carrinho.png'});
const nav=p.waitForRequest(q=>q.url().includes('upe-criativo-lojas'));await p.click('[data-fim="loja"]').catch(()=>{});const q=await nav.catch(()=>null);console.log('finalizar →',q&&decodeURIComponent(q.url()));
console.log('erros',errs);await b.close();process.exit(errs.length?1:0)})();
