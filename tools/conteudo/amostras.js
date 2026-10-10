const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
const {chromium}=require('playwright');const fs=require('fs');const S=process.argv[2];
const T=[{frente:'landing',layout:'tela',formato:'feed',titulo:'Mudou a oferta? Muda a página em um minuto.',texto:'Clique no texto e escreva. Publique quando quiser.',imagem:'assets/img/ui/lp-editor.jpg'},
{frente:'landing',layout:'capa',formato:'feed',titulo:'A página que vende, com o painel que mostra o que funciona.',texto:'Landing pages com a sua marca e domínio próprio.'},
{frente:'sistemas',layout:'tela',formato:'story',titulo:'Seu cliente marca o horário sozinho.',imagem:'assets/img/ui/ag-celular.jpg',cta:''},
{frente:'sistemas',layout:'tela',formato:'feed',tema:'claro',titulo:'Os números do negócio num painel só.',texto:'Dashboards sob medida.',imagem:'assets/img/ui/dash-painel.jpg'},
{frente:'landing',layout:'tela',formato:'video',titulo:'Saiba de onde vêm os clientes',texto:'Visitas, cliques e leads no painel.',imagem:'assets/img/ui/lp-analise.jpg'},
{frente:'sistemas',layout:'lista',formato:'feed',titulo:'Agenda online: o que vem',itens:['Serviços com duração e preço','Horários por dia da semana','Sem dois clientes no mesmo horário','Confirmação pelo WhatsApp']}];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();await require('./srv.js')(ctx,S);const p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://gen.test/gen/page.html');
for(const [i,m] of T.entries()){const d=await p.evaluate(async m=>{const c=document.getElementById('c');await UpeModelos.render(c,m,{base:'/'});return c.toDataURL('image/jpeg',.85)},m);fs.writeFileSync(`${S}/tn-${i}.jpg`,Buffer.from(d.split(',')[1],'base64'));}
await b.close()})();
