/* Exporta as peças estáticas de pecas.html: posts (JPG 1080×1350), slides (JPG 1920×1080 + PDF) e recortes do manual.
   Uso: node render_pecas.js [posts|slides|manual|all] */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {execFileSync}=require('child_process');
const D=__dirname,DOS=path.join(D,'..','dossie'),what=process.argv[2]||'all';
const POSTS=['s1-01','s1-04','s1-06','s2-01','s2-04','s2-06','s2-07'],CAR={'s1-03':5,'s2-03':4},REELCAPA={'s1-02':'logo-v','s1-05':'reel-03-unidades','s2-02':'reel-01-como-funciona','s2-05':'reel-02-voce-sabia'};
(async()=>{const b=await chromium.launch();
 const shot=async(qs,w,h,out)=>{const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>console.log('ERR',qs,e.message));
  await p.goto(`file://${D}/pecas.html?${qs}`);await p.waitForSelector('body[data-ready="1"]');await p.waitForTimeout(250);
  await p.screenshot({path:out,type:'jpeg',quality:88,clip:{x:0,y:0,width:w,height:h}});await p.close();console.log(path.basename(out))};
 if(what==='all'||what==='posts'){const P=path.join(DOS,'conteudo','posts');fs.mkdirSync(P,{recursive:true});
  for(const id of POSTS)await shot(`post=${id}`,1080,1350,path.join(P,id+'.jpg'));
  for(const [id,n] of Object.entries(CAR))for(let i=0;i<n;i++)await shot(`post=${id}&i=${i}`,1080,1350,path.join(P,`${id}-${i+1}.jpg`));
  for(const [id,m] of Object.entries(REELCAPA))fs.copyFileSync(path.join(DOS,'conteudo','motion',m+'.jpg'),path.join(P,id+'.jpg'));}
 if(what==='all'||what==='manual'){const M=path.join(DOS,'assets','manual');fs.mkdirSync(M,{recursive:true});
  for(const k of ['construcao','versoes','paleta','padrao','aplicacoes'])await shot(`manual=${k}`,1600,1000,path.join(M,k+'.jpg'));}
 if(what==='all'||what==='slides'){const S=path.join(DOS,'apresentacao','slides');fs.mkdirSync(S,{recursive:true});
  const p=await b.newPage();await p.goto(`file://${D}/pecas.html?slide=1`);const N=await p.evaluate(()=>window.__count);await p.close();
  const files=[];for(let i=1;i<=N;i++){const f=path.join(S,`slide-${String(i).padStart(2,'0')}.jpg`);await shot(`slide=${i}`,1920,1080,f);files.push(f)}
  const pdf=await b.newPage();await pdf.setContent(`<style>@page{size:1920px 1080px;margin:0}body{margin:0}img{display:block;width:1920px;height:1080px;page-break-after:always}</style>`+files.map(f=>`<img src="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}">`).join(''));
  await pdf.pdf({path:path.join(DOS,'apresentacao','Via_Magistral_Apresentacao.pdf'),width:'1920px',height:'1080px',printBackground:true});console.log('pdf ok');}
 await b.close()})();
