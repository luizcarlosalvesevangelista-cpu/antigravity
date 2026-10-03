/* Gera as artes (posts/*.jpg) e os motions (motion/*.mp4) a partir de calendario.js + studio.html.
   Uso: node render.js [posts|motion|all] [filtro-de-id]
   Requer Playwright (Chromium) e ffmpeg. */
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');const path=require('path');const vm=require('vm');
const D=__dirname;const what=process.argv[2]||'all';const only=process.argv[3]||'';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(D,'calendario.js'),'utf8'),ctx);
const POSTS=ctx.window.POSTS;
(async()=>{
 const b=await chromium.launch();
 const open=async(qs,w,h)=>{const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>console.log('ERR',qs,e.message));
  await p.goto(`file://${D}/studio.html?${qs}`);await p.waitForSelector('body[data-ready="1"]');return p};
 if(what!=='motion'){
  fs.mkdirSync(path.join(D,'posts'),{recursive:true});
  for(const it of POSTS){
   if(only&&!it.id.includes(only))continue;
   const list=it.slides?it.slides.map((s,i)=>[`id=${it.id}&slide=${i}`,`${it.id}-${i+1}`,s]):it.art?[[`id=${it.id}`,it.id,it.art]]:[];
   for(const [qs,name,a] of list){const tall=['capa','story'].includes(a.tpl);
    const p=await open(qs,1080,tall?1920:1350);await (await p.$('.art')).screenshot({path:path.join(D,'posts',name+'.jpg'),type:'jpeg',quality:88});await p.close();console.log('post',name);}
  }
 }
 if(what!=='posts'){
  fs.mkdirSync(path.join(D,'motion'),{recursive:true});
  const ms=[...new Set(POSTS.filter(x=>x.motion).map(x=>x.motion))].filter(m=>!only||m.includes(only));
  const SB={'m5-historia':[3.2,6.5,10.2,13.5,17.6,19.4,24.2,30,36,40.9,47.5,53]};
  for(const m of ms){
   const p=await open(`motion=${m}`,1080,1920);const dur=await p.evaluate(()=>window.__duration);const FPS=30,N=Math.round(dur*FPS);
   const out=path.join(D,'motion',m+'.mp4');
   const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
   for(let i=0;i<N;i++){await p.evaluate(t=>window.__render(t),i/FPS);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
   ff.stdin.end();await new Promise(r=>ff.on('close',r));
   const cues=await p.evaluate(()=>window.__cues||[]);const cj=path.join(D,'motion',m+'.cues.json'),wav=path.join(D,'motion',m+'.wav'),tmp=out.replace('.mp4','.v.mp4');
   fs.writeFileSync(cj,JSON.stringify({duration:dur,cues}));
   const run=(c,a)=>new Promise((res,rej)=>{const x=spawn(c,a,{stdio:'inherit'});x.on('close',k=>k?rej(new Error(c+' '+k)):res())});
   fs.renameSync(out,tmp);await run('python3',[path.join(D,'audio.py'),cj,wav]);
   await run('ffmpeg',['-loglevel','error','-y','-i',tmp,'-i',wav,'-map','0:v','-map','1:a','-c:v','copy','-af','loudnorm=I=-14:TP=-1.5:LRA=9','-ar','48000','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',out]);
   fs.unlinkSync(tmp);fs.unlinkSync(wav);fs.unlinkSync(cj);
   const pt=await p.evaluate(()=>window.__poster);await p.evaluate(t=>window.__render(t),pt||dur*0.8);await p.screenshot({path:path.join(D,'motion',m+'.jpg'),type:'jpeg',quality:84});
   if(SB[m]){fs.mkdirSync(path.join(D,'motion','storyboard'),{recursive:true});for(const [k,tt] of SB[m].entries()){await p.evaluate(t=>window.__render(t),tt);await p.screenshot({path:path.join(D,'motion','storyboard',`${m}-${String(k+1).padStart(2,'0')}.jpg`),type:'jpeg',quality:80});}}
   await p.close();console.log('motion',m,N,'frames');
  }
 }
 await b.close();
})();
