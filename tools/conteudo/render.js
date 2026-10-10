const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
// Gera as artes (JPG) e os reels (MP4 com trilha) do Upe ERP e do Upe TV a partir de apps_spec.json, usando portal/modelos.js
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');const {spawn,execFileSync}=require('child_process');
const S=process.argv[2], OUT=__R+'/site/portal/kits', AUDIO=__R+'/motion/studio/audio.py';
const SP=process.argv[3]||'apps_spec';const spec=JSON.parse(fs.readFileSync(S+'/'+SP+'.json','utf8'));const so=process.argv[4]||'';const KD=f=>f==='loja'?'loja-upe':'upe-'+f;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();await require('./srv.js')(ctx,S);const p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://gen.test/gen/page.html');
const shot=async(m,t)=>{const d=await p.evaluate(async([m,t])=>{const c=document.getElementById('c');await UpeModelos.render(c,m,{base:'/',t});return c.toDataURL('image/jpeg',.9)},[m,t]);return Buffer.from(d.split(',')[1],'base64');};
for(const it of spec){ if(so && !it.id.startsWith(so)) continue;
  const dir=`${OUT}/${KD(it.frente)}/gerado`;fs.mkdirSync(dir,{recursive:true});it.midias=[];
  for(const [k,m] of it.slides.entries()){const f=`${it.id}-${String(k+1).padStart(2,'0')}.jpg`;fs.writeFileSync(`${dir}/${f}`,await shot(m));it.midias.push(`kits/${KD(it.frente)}/gerado/${f}`);}
  if(it.reel && fs.existsSync(`${OUT}/${KD(it.frente)}/gerado/${it.id}.mp4`) && !process.env.FORCE){it.capa=it.midias[0];it.midias=[`kits/${KD(it.frente)}/gerado/${it.id}.mp4`];}
  else if(it.reel){const cenas=it.reel.cenas, dur=it.reel.dur||3, fps=30, N=cenas.length*dur*fps, mp4=`${dir}/${it.id}.mp4`, tmp=`${S}/${it.id}.video.mp4`;
    const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p',tmp],{stdio:['pipe','inherit','inherit']});
    for(let f=0;f<N;f++){const c=Math.floor(f/(dur*fps)), tt=(f%(dur*fps))/(fps*1.65);const buf=await shot(cenas[c],Math.min(1,tt));if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
    ff.stdin.end();await new Promise(r=>ff.on('close',r));
    const D=cenas.length*dur, cues=[{t:.05,k:'swell'}];cenas.forEach((_,c)=>{cues.push({t:c*dur+.05,k:c?'whoosh':'impact'});cues.push({t:c*dur+.9,k:'pop'});});cues.push({t:D-1.6,k:'final'},{t:D-1.5,k:'chime'});
    fs.writeFileSync(`${S}/${it.id}.cues.json`,JSON.stringify({duration:D,cues}));execFileSync('python3',[AUDIO,`${S}/${it.id}.cues.json`,`${S}/${it.id}.wav`]);
    execFileSync('ffmpeg',['-loglevel','error','-y','-i',tmp,'-i',`${S}/${it.id}.wav`,'-map','0:v','-map','1:a','-c:v','copy','-af','loudnorm=I=-14:TP=-1.5','-ar','48000','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',mp4]);
    it.capa=it.midias[0]; it.midias=[`kits/${KD(it.frente)}/gerado/${it.id}.mp4`];}
  console.log('ok',it.id,it.formato,it.midias.length);}
fs.writeFileSync(S+'/'+SP+'.out.json',JSON.stringify(spec,null,1));await b.close()})();
