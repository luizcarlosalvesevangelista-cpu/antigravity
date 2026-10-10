const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.route(/fonts\.|\.(jpg|png|mp4)$/,r=>r.abort());const out={};
for(const k of process.argv.slice(3)){await p.goto('file://'+__R+'/site/portal/kits/'+k+'/index.html');await p.addScriptTag({path:__R+'/site/portal/src/kit.js'});
 out[k]=await p.evaluate(()=>parseKit(document,new Date(2026,9,4)));}
fs.writeFileSync(process.argv[2],JSON.stringify(out,null,1));
for(const k in out){const it=out[k].itens;const by={};it.forEach(i=>{by[i.formato]=(by[i.formato]||0)+1});console.log(k,out[k].titulo,JSON.stringify(by),'sem data:',it.filter(i=>!i.data).map(i=>i.ref).join(' '));}
await b.close()})();
