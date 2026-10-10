const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');const R=__R+'/site/';const O=process.argv[2];
(async()=>{const b=await chromium.launch();
for(const [n,vp] of [['d',{width:1440,height:900}],['m',{width:390,height:820}]]){const ctx=await b.newContext({viewport:vp});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.route(/^https?:\/\/(?!site\.test)/,r=>r.abort());
await ctx.route(/^http:\/\/site\.test\//,r=>{let u=decodeURIComponent(new URL(r.request().url()).pathname);let f=path.join(R,u);if(u.endsWith('/'))f+='index.html';if(!fs.existsSync(f))return r.fulfill({status:404,body:''});const ct={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'}[path.extname(f)]||'application/octet-stream';r.fulfill({path:f,contentType:ct})});
await p.goto('http://site.test/');await p.waitForTimeout(1500);
for(const id of ['frentes','lp','sistemas']){await p.evaluate(id=>{document.getElementById(id).scrollIntoView();document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in','vis','shown','on'))},id);await p.waitForTimeout(1200);await p.screenshot({path:`${O}/h-${n}-${id}.png`});}
console.log(n,'overflow',await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth),errs);await ctx.close();}
await b.close()})();
