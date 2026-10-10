const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
const {chromium}=require('playwright');const {rotas}=require('./rotas.js');const O=process.argv[2]||__T;
(async()=>{const b=await chromium.launch();let falhou=0;
for(const app of ['lp','sistemas'])for(const [n,vp] of [['d',{width:1440,height:900}],['m',{width:390,height:800}]]){
 const ctx=await b.newContext({viewport:vp});await rotas(ctx,app);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://srv.test/');await p.waitForTimeout(2000);
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 await p.screenshot({path:`${O}/v-${app}-${n}.png`,fullPage:true});console.log(app,n,'overflow',ov,'erros',errs);if(ov>0||errs.length)falhou=1;await ctx.close();}
await b.close();process.exit(falhou)})();
