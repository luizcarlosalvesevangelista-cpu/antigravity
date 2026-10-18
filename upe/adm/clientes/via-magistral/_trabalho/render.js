/* Gera os motions da Via Magistral a partir de studio.html (padrão Upe: 30 fps, trilha e efeitos por cues, −14 LUFS).
   Uso: node render.js [filtro]        ex.: node render.js filme
        node render.js --quadros       só as capas, para conferir rápido
   Saída: ../dossie/conteudo/motion/<nome>.mp4 + .jpg (e storyboard/ do filme). Requer Playwright, ffmpeg, python3 + numpy/scipy. */
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');const path=require('path');
const D=__dirname,OUT=path.join(D,'..','dossie','conteudo','motion');
const JOBS=[['logo','h','logo-h'],['logo','v','logo-v'],['r1-receita','v','reel-01-como-funciona'],['r2-voce-sabia','v','reel-02-voce-sabia'],['r3-unidades','v','reel-03-unidades'],['filme','v','filme-v'],['filme','h','filme-h']];
const only=process.argv.slice(2).find(a=>!a.startsWith('--'))||'',quick=process.argv.includes('--quadros');
const run=(c,a)=>new Promise((res,rej)=>{const x=spawn(c,a,{stdio:'inherit'});x.on('close',k=>k?rej(new Error(c+' '+k)):res())});
(async()=>{
 fs.mkdirSync(path.join(OUT,'storyboard'),{recursive:true});
 const b=await chromium.launch();
 for(const [id,fmt,name] of JOBS){
  if(only&&!name.includes(only))continue;
  const [w,h]=fmt==='h'?[1920,1080]:[1080,1920];
  const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>console.log('ERR',name,e.message));
  await p.goto(`file://${D}/studio.html?motion=${id}&fmt=${fmt}`);await p.waitForSelector('body[data-ready="1"]');
  const dur=await p.evaluate(()=>window.__duration),pt=await p.evaluate(()=>window.__poster);
  if(!quick){
   const FPS=30,N=Math.round(dur*FPS),mp4=path.join(OUT,name+'.mp4'),tmp=path.join(OUT,name+'.v.mp4');
   const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',tmp],{stdio:['pipe','inherit','inherit']});
   for(let i=0;i<N;i++){await p.evaluate(t=>window.__render(t),i/FPS);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
   ff.stdin.end();await new Promise(r=>ff.on('close',r));
   const cues=await p.evaluate(()=>window.__cues||[]),cj=path.join(OUT,name+'.cues.json'),wav=path.join(OUT,name+'.wav');
   fs.writeFileSync(cj,JSON.stringify({duration:dur,cues,bpm:96}));
   await run('python3',[path.join(D,'audio.py'),cj,wav]);
   await run('ffmpeg',['-loglevel','error','-y','-i',tmp,'-i',wav,'-map','0:v','-map','1:a','-c:v','copy','-af','loudnorm=I=-14:TP=-1.5:LRA=9','-ar','48000','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',mp4]);
   fs.unlinkSync(tmp);fs.unlinkSync(wav);fs.unlinkSync(cj);
  }
  await p.evaluate(t=>window.__render(t),pt||dur*.8);await p.screenshot({path:path.join(OUT,name+'.jpg'),type:'jpeg',quality:86});
  const sb=await p.evaluate(()=>window.__storyboard||null);
  if(sb&&fmt==='v')for(const [k,t] of sb.entries()){await p.evaluate(x=>window.__render(x),t);await p.screenshot({path:path.join(OUT,'storyboard',`filme-${String(k+1).padStart(2,'0')}.jpg`),type:'jpeg',quality:80});}
  await p.close();console.log('ok',name,dur+'s');
 }
 await b.close();
})();
