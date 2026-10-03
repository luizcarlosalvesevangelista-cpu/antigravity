const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
(async()=>{const [piece,fmt]=process.argv.slice(2);const v=fmt==='v';const FPS=30;const tag=`${piece}-${fmt}`;
const b=await chromium.launch();const p=await b.newPage({viewport:{width:v?1080:1920,height:v?1920:1080}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(`file://${__dirname}/studio.html?piece=${piece}&fmt=${fmt}`);await p.evaluate(()=>document.fonts.ready);
const {duration,cues}=await p.evaluate(()=>({duration:window.__duration,cues:window.__cues}));
fs.writeFileSync(`out/${tag}.cues.json`,JSON.stringify({duration,cues}));
const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','png','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',`out/${tag}.video.mp4`],{stdio:['pipe','inherit','inherit']});
const N=Math.round(duration*FPS);
for(let i=0;i<N;i++){await p.evaluate(t=>window.__render(t),i/FPS);const buf=await p.screenshot({type:'png'});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',tag,N);})();
