/* Capturas da landing para o dossiê (aba 04): página inteira em 1440, 834 e 390 px e telas do celular.
   Uso: (servidor local em :8765 servindo paginas/landing) node capturas.js */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const OUT=path.join(__dirname,'..','dossie','assets','site'),FD=path.join(__dirname,'fonts');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();
 for(const [nome,w,h] of [['lp-desktop',1440,900],['lp-tablet',834,1112],['lp-celular',390,844]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:nome==='lp-desktop'?1:2});
  await ctx.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(FD+'/fonts.css','utf8').replace(/url\((poppins[^)]+)\)/g,'url(https://fonts.gstatic.com/l/$1)')}));
  await ctx.route('https://fonts.gstatic.com/l/**',r=>r.fulfill({contentType:'font/woff2',body:fs.readFileSync(FD+'/'+path.basename(r.request().url()))}));
  const p=await ctx.newPage();await p.goto('http://localhost:8765/');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>w)console.log('ROLAGEM LATERAL',nome,sw);
  await p.addStyleTag({content:'header{position:static!important}'});
  await p.screenshot({path:path.join(OUT,nome+'.jpg'),fullPage:true,type:'jpeg',quality:78});
  if(nome==='lp-celular'){await p.addStyleTag({content:'header{position:sticky!important}'});const ids=['','#porque','#como','#unidades'];
   for(const [i,id] of ids.entries()){await p.evaluate(x=>{if(x)document.querySelector(x).scrollIntoView();else scrollTo(0,0)},id);await p.waitForTimeout(150);await p.screenshot({path:path.join(OUT,`lp-tela-0${i+1}.jpg`),type:'jpeg',quality:80});}}
  await ctx.close();console.log('ok',nome)}
 await b.close()})();
