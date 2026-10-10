const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
const {chromium}=require('playwright');const {rotas}=require('./rotas.js');const A=__R+'/site/apps/',U=__R+'/site/assets/img/ui/';
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1600,height:1000},colorScheme:'light'});await rotas(ctx,'servicos');const p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('http://srv.test/?demo=1');await p.click('[data-demo="cliente"]');await p.waitForSelector('#nav button');await p.waitForTimeout(1500);
 await p.addStyleTag({content:'.banner{display:none!important}'});
 const shot=async(h,outs,extra)=>{await p.evaluate(h=>location.hash=h,h);await p.waitForTimeout(1800);await p.addStyleTag({content:'.banner{display:none!important}.barra-salvar{display:none!important}'});if(extra)await extra();for(const o of outs)await p.screenshot({path:o,type:'jpeg',quality:84});console.log('ok',h)};
 await ctx.close();
 // página pública de exemplo (modelo) e agenda no celular
 const c2=await b.newContext({viewport:{width:1440,height:900}});await rotas(c2,'servicos');const q=await c2.newPage();await q.goto('http://srv.test/modelos/servico.html');await q.waitForTimeout(1200);await q.screenshot({path:U+'lp-pagina.jpg',type:'jpeg',quality:84});
 const c3=await b.newContext({viewport:{width:390,height:740},deviceScaleFactor:2});await rotas(c3,'sistemas');const m=await c3.newPage();m.on('pageerror',e=>console.log('ERR',e.message));
 await m.goto('http://srv.test/exemplo?demo=1');await m.waitForSelector('[data-sv]');await m.click('[data-sv="s3"]');await m.waitForTimeout(300);await m.click('.dia:not([disabled]) >> nth=1');await m.waitForTimeout(400);await m.click('.hora >> nth=3');await m.waitForTimeout(300);
 await m.evaluate(()=>scrollTo(0,0));await m.screenshot({path:A+'sistemas/img/agenda-celular.jpg',type:'jpeg',quality:84});await m.screenshot({path:U+'ag-celular.jpg',type:'jpeg',quality:84});
 await m.evaluate(()=>scrollTo(0,9999));await m.waitForTimeout(300);await m.screenshot({path:U+'ag-celular-2.jpg',type:'jpeg',quality:84});
 await b.close()})();
