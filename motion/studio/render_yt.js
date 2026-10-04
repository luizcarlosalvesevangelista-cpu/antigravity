const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
(async()=>{const ns=process.argv.slice(2).map(Number);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
for(const n of ns){const tag=`yt${n}`;await p.goto(`file://${__dirname}/studio.html?piece=yt&n=${n}&fmt=h`);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
const {duration,cues}=await p.evaluate(()=>({duration:window.__duration,cues:window.__cues}));fs.writeFileSync(`out/${tag}.cues.json`,JSON.stringify({duration,cues}));
const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate','30','-c:v','png','-i','-','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p',`out/${tag}.video.mp4`],{stdio:['pipe','inherit','inherit']});
const N=Math.round(duration*30);for(let i=0;i<N;i++){await p.evaluate(t=>window.__render(t),i/30);const buf=await p.screenshot({type:'png'});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
ff.stdin.end();await new Promise(r=>ff.on('close',r));console.log('done',tag);}
await b.close()})();
