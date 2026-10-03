/* Motion principal "Do sonho ao vestido" (9:16, ~53 s).
   Uma cliente não encontra o vestido que quer, encontra a tricoline listrada na Plano Tecidos (Shopee),
   recebe rápido, leva a um ateliê, veste, se sente confortável e avalia a loja com 5 estrelas.
   Registra-se em window.M_EXTRA e é renderizado por studio.html / render.js. Cues alimentam audio.py. */
(function(){
const {C,symbol}=Plano;
const IMG='../assets/fotos/tricoline-rosa-listrada.jpg';
const SK='#E7AE88',HAIR='#3B2A20';
const cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const E=x=>{x=cl(x);return 1-Math.pow(1-x,3)};
const EIO=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const EB=x=>{x=cl(x);const c=1.6;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const seg=(t,a,b)=>cl((t-a)/(b-a));
const vis=(t,a,b,f=.45)=>Math.min(seg(t,a,a+f),1-seg(t,b-f,b));

/* ---------- personagem ---------- */
function avatar(id,o={}){
  const fill=o.dress?`url(#${id}-fab)`:C.areia;
  return `<svg id="${id}" viewBox="0 0 400 820" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <defs><pattern id="${id}-fab" patternUnits="userSpaceOnUse" width="420" height="760" x="-10" y="250"><image href="${IMG}" x="0" y="-260" width="420" height="1020" preserveAspectRatio="xMidYMid slice"/></pattern>
  <clipPath id="${id}-reveal"><rect id="${id}-rv" x="0" y="0" width="400" height="820"/></clipPath></defs>
  <ellipse cx="200" cy="790" rx="120" ry="16" fill="#000" opacity=".08"/>
  <path d="M200 92 C112 92 108 190 118 300 L282 300 C292 190 288 92 200 92Z" fill="${HAIR}"/>
  <g fill="${SK}"><rect x="166" y="560" width="28" height="215" rx="14"/><rect x="206" y="560" width="28" height="215" rx="14"/></g>
  <g fill="${C.grafite}"><ellipse cx="176" cy="778" rx="26" ry="12"/><ellipse cx="224" cy="778" rx="26" ry="12"/></g>
  ${o.dress?`<g id="${id}-dress"><g id="${id}-skirt" style="transform-origin:200px 430px"><path d="M146 425 Q200 440 254 425 Q300 590 330 705 Q200 742 70 705 Q100 590 146 425Z" fill="${fill}" stroke="#d58fa3" stroke-width="3"/></g>
     <path d="M150 272 Q200 252 250 272 L256 432 Q200 446 144 432Z" fill="${fill}" stroke="#d58fa3" stroke-width="3"/>
     <path d="M146 428 Q200 444 254 428" stroke="${C.verde}" stroke-width="10" fill="none" stroke-linecap="round"/></g>`
   :`<g><path d="M138 465 L262 465 L254 770 L210 770 L200 540 L190 770 L146 770Z" fill="${C.musgo}"/>
     <path d="M142 276 Q200 250 258 276 L266 472 L134 472Z" fill="${fill}"/></g>`}
  <g id="${id}-armL" style="transform-origin:156px 290px"><path d="M156 290 L128 452" stroke="${SK}" stroke-width="26" stroke-linecap="round"/>${o.dress?'':`<path d="M156 288 L146 350" stroke="${C.areia}" stroke-width="34" stroke-linecap="round"/>`}</g>
  <g id="${id}-armR" style="transform-origin:244px 290px"><path d="M244 290 L272 452" stroke="${SK}" stroke-width="26" stroke-linecap="round"/>${o.dress?'':`<path d="M244 288 L254 350" stroke="${C.areia}" stroke-width="34" stroke-linecap="round"/>`}</g>
  <rect x="185" y="210" width="30" height="58" rx="12" fill="${SK}"/>
  <g id="${id}-head" style="transform-origin:200px 230px">
   <circle cx="200" cy="160" r="70" fill="${SK}"/>
   <path d="M128 160 Q132 84 200 84 Q270 84 272 160 Q246 116 196 118 Q160 122 128 160Z" fill="${HAIR}"/>
   <g fill="#2b2b29"><ellipse class="eye" cx="176" cy="166" rx="6.5" ry="8.5" style="transform-origin:176px 166px"/><ellipse class="eye" cx="224" cy="166" rx="6.5" ry="8.5" style="transform-origin:224px 166px"/></g>
   <path class="brow" d="M164 146 Q176 140 188 146 M212 146 Q224 140 236 146" stroke="${HAIR}" stroke-width="4" fill="none" stroke-linecap="round"/>
   <g fill="#F08A8A" opacity=".45"><circle cx="160" cy="190" r="11"/><circle cx="240" cy="190" r="11"/></g>
   <path class="m-sad" d="M184 204 Q200 194 216 204" stroke="#8a3d3d" stroke-width="4.5" fill="none" stroke-linecap="round"/>
   <path class="m-ok" d="M184 198 Q200 206 216 198" stroke="#8a3d3d" stroke-width="4.5" fill="none" stroke-linecap="round" opacity="0"/>
   <path class="m-joy" d="M180 194 Q200 222 220 194Z" fill="#9b3b3b" opacity="0"/>
  </g></svg>`;
}
function face(root,t,mood){ // mood: sad|ok|joy ; piscar a cada ~3 s
  const q=s=>root.querySelector(s);
  q('.m-sad').setAttribute('opacity',mood==='sad'?1:0);q('.m-ok').setAttribute('opacity',mood==='ok'?1:0);q('.m-joy').setAttribute('opacity',mood==='joy'?1:0);
  const b=(t%3.1)<.14?.1:1;root.querySelectorAll('.eye').forEach(e=>e.style.transform=`scaleY(${mood==='joy'&&b===1?.55:b})`);
}
function seamstress(){return `<svg viewBox="0 0 420 520" style="overflow:visible">
  <path d="M120 520 Q120 330 210 320 Q300 330 300 520Z" fill="${C.musgo}"/>
  <path d="M168 360 L252 360 L262 520 L158 520Z" fill="${C.linho}" opacity=".9"/>
  <rect x="195" y="270" width="30" height="60" rx="12" fill="#C98E6A"/>
  <circle cx="210" cy="215" r="64" fill="#C98E6A"/>
  <circle cx="210" cy="132" r="34" fill="#6B4A3A"/><path d="M146 210 Q150 150 210 148 Q270 150 274 210 Q250 175 210 176 Q170 176 146 210Z" fill="#6B4A3A"/>
  <g fill="none" stroke="${C.grafite}" stroke-width="4"><circle cx="186" cy="220" r="15"/><circle cx="234" cy="220" r="15"/><path d="M201 220h18"/></g>
  <path d="M192 252 Q210 262 228 252" stroke="#7a3a2e" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M120 420 Q90 470 140 500" stroke="#C98E6A" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M300 420 Q330 470 280 500" stroke="#C98E6A" stroke-width="24" fill="none" stroke-linecap="round"/>
 </svg>`}
function machine(){return `<svg viewBox="0 0 520 360" style="overflow:visible">
  <rect x="20" y="290" width="480" height="50" rx="14" fill="${C.grafite}"/>
  <path d="M60 290 V120 Q60 70 110 70 H420 Q460 70 460 110 V170 H400 V130 H130 V290Z" fill="${C.linho}" stroke="${C.grafite}" stroke-width="8"/>
  <rect x="380" y="170" width="60" height="40" rx="8" fill="${C.verde}"/>
  <g id="needle"><rect x="404" y="210" width="10" height="60" fill="#888"/><rect x="400" y="200" width="18" height="18" rx="4" fill="${C.grafite}"/></g>
  <circle cx="470" cy="150" r="34" fill="${C.areia}" stroke="${C.grafite}" stroke-width="8"/>
  <text x="150" y="112" font-family="Montserrat" font-weight="800" font-size="30" fill="${C.verde}">PLANO</text>
 </svg>`}
const dressSketch=`<svg viewBox="0 0 300 360"><path id="sk" d="M110 40 Q150 25 190 40 L196 140 Q240 260 262 330 Q150 360 38 330 Q60 260 104 140Z M104 140 Q150 152 196 140" fill="none" stroke="${C.grafite}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1400" stroke-dashoffset="1400"/></svg>`;
const star=(id,s=90)=>`<svg id="${id}" viewBox="0 0 48 48" width="${s}" height="${s}" style="overflow:visible"><path d="m24 4 5.9 12.5 13.6 1.6-10 9.4 2.7 13.5L24 34.4 11.8 41l2.7-13.5-10-9.4 13.6-1.6Z" fill="#E6E0D4" stroke="#C9BFA8" stroke-width="2" stroke-linejoin="round"/></svg>`;
const cap=(id,html,top=150,bg=C.linho,fg=C.grafite)=>`<div id="${id}" style="position:absolute;left:80px;right:80px;top:${top}px;text-align:center;font:800 66px/1.12 Montserrat;color:${fg};opacity:0">${html}</div>`;
const REVIEW='Tecido lindo e de ótima qualidade! Chegou rapidinho e o vestido ficou perfeito. Super confortável. Recomendo demais! 💚';

const html=()=>`<div class="art tall" style="background:${C.linho}" id="hist">
 <!-- S1 closet -->
 <div class="sc" id="s1" style="position:absolute;inset:0" >
  <div class="linen" style="position:absolute;inset:0"></div>
  <div style="position:absolute;left:0;right:0;top:1500px;bottom:0;background:${C.areia}"></div>
  <div style="position:absolute;left:60px;right:60px;top:560px;height:12px;background:${C.grafite};border-radius:6px"></div>
  <div id="rack" style="position:absolute;left:0;top:560px;height:700px;width:3000px">
   ${[['#E07A5F','Curto demais'],['#7B8CC2','Cor errada'],['#F2CC8F','Não é o meu estilo'],['#9C89B8','Apertado']].map(([c,t],i)=>`<div class="hang" style="position:absolute;left:${40+i*250}px;top:0;width:260px;transform:scale(.82);transform-origin:50% 0">
     <svg viewBox="0 0 260 560" width="260" height="560"><path d="M130 0 V30 M90 60 Q130 20 170 60" stroke="${C.grafite}" stroke-width="7" fill="none"/><path d="M95 60 Q130 48 165 60 L172 190 Q${i%2?230:200} 400 ${i===0?210:236} ${i===0?360:520} Q130 ${i===0?380:545} ${i===0?50:24} ${i===0?360:520} Q${i%2?30:60} 400 88 190Z" fill="${c}"/></svg>
     <div class="nope" style="position:absolute;left:10px;top:200px;width:240px;text-align:center;opacity:0"><div style="font:800 140px/1 Montserrat;color:#C0392B">✕</div><div style="font:700 30px Montserrat;color:${C.grafite};background:${C.linho};border-radius:12px;padding:6px 10px;margin-top:6px">${t}</div></div></div>`).join('')}
  </div>
  <div id="a1" style="position:absolute;left:330px;top:1010px;width:400px">${avatar('av1')}</div>
  ${cap('c1','Ela precisava de um vestido<br>para um dia especial.')}
  ${cap('c1b','Nenhum era <span style="color:#C0392B">o vestido dela</span>.')}
 </div>
 <!-- S2 ideia -->
 <div class="sc" id="s2" style="position:absolute;inset:0;opacity:0">
  <div class="linen" style="position:absolute;inset:0"></div>
  <div id="a2" style="position:absolute;left:120px;top:900px;width:480px">${avatar('av2')}</div>
  <div id="bub" style="position:absolute;left:440px;top:440px;width:560px;height:560px;border-radius:50%;background:#fff;box-shadow:0 30px 60px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center;transform:scale(0)">
   <div style="width:330px">${dressSketch}</div>
   <div id="bulb" style="position:absolute;right:40px;top:30px;font-size:90px;opacity:0">💡</div></div>
  <div style="position:absolute;left:420px;top:990px;width:50px;height:50px;border-radius:50%;background:#fff" class="dot"></div>
  <div style="position:absolute;left:390px;top:1060px;width:28px;height:28px;border-radius:50%;background:#fff" class="dot"></div>
  ${cap('c2','E se ela criasse<br><span style="color:'+C.verde+'">o próprio vestido</span>?')}
 </div>
 <!-- S3 busca no celular -->
 <div class="sc" id="s3" style="position:absolute;inset:0;opacity:0;background:${C.musgo}">
  ${cap('c3','Ela foi atrás<br>do tecido perfeito.',120,C.musgo,C.linho)}
  <div id="ph" style="position:absolute;left:165px;top:400px;width:750px;height:1400px;background:#111;border-radius:80px;padding:22px;box-shadow:0 40px 80px rgba(0,0,0,.4)">
   <div style="position:relative;width:100%;height:100%;background:#fff;border-radius:60px;overflow:hidden;font-family:'DM Sans'">
    <div id="p-search" style="position:absolute;inset:0;padding:90px 44px">
     <div style="background:#F1F1F1;border-radius:24px;padding:26px 30px;font:500 36px 'DM Sans';color:#333;display:flex;gap:16px;align-items:center">🔍 <span id="q"></span><span id="caret" style="width:3px;height:40px;background:#333"></span></div>
     <div id="res" style="opacity:0;margin-top:40px;display:flex;gap:24px;align-items:center;border:2px solid #eee;border-radius:28px;padding:24px">
      <div style="width:110px;height:110px;border-radius:50%;background:${C.linho};display:flex;align-items:center;justify-content:center"><div style="width:44px;height:66px">${symbol({})}</div></div>
      <div><div style="font:800 38px Montserrat;color:#111">Plano Tecidos</div><div style="font-size:28px;color:#666">Loja na Shopee · ★ 5,0</div></div></div>
    </div>
    <div id="p-grid" style="position:absolute;inset:0;padding:80px 0 0;opacity:0">
     <div style="display:flex;gap:22px;align-items:center;padding:0 36px 26px"><div style="width:96px;height:96px;border-radius:50%;background:${C.linho};display:flex;align-items:center;justify-content:center"><div style="width:38px;height:57px">${symbol({})}</div></div><div><div style="font:800 34px Montserrat">Plano Tecidos</div><div style="font-size:26px;color:#666">Tecidos por metro</div></div></div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      ${['tricoline-rosa-listrada','cristal-furtacor','tricoline-azul-listrada','cetim-azul','linho-rosa','sarja-azul'].map((f,i)=>`<div class="tile" data-i="${i}" style="aspect-ratio:1;background:url(../assets/fotos/${f}.jpg) center/cover;position:relative"></div>`).join('')}
     </div>
     <div id="tap" style="position:absolute;left:160px;top:330px;width:120px;height:120px;border-radius:50%;background:rgba(78,140,52,.35);border:6px solid ${C.verde};opacity:0"></div>
    </div>
    <div id="p-prod" style="position:absolute;inset:0;opacity:0;background:#fff">
     <div style="height:640px;background:url(${IMG}) center/cover"></div>
     <div style="padding:34px 40px;display:grid;gap:18px">
      <div style="font:600 26px Montserrat;color:${C.verde};letter-spacing:.14em">PLANO TECIDOS · SHOPEE</div>
      <div style="font:800 46px/1.1 Montserrat;color:#111">Tricoline listrada rosa · por metro</div>
      <div style="font-size:30px;color:#666">★★★★★ <span style="color:#111;font-weight:700">5,0</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px"><span style="font:600 32px 'DM Sans'">Metragem</span>
       <div style="display:flex;align-items:center;gap:20px;border:2px solid #ddd;border-radius:18px;padding:10px 22px;font:800 38px Montserrat"><span>−</span><span id="mt">1,0 m</span><span>+</span></div></div>
      <div id="buy" style="margin-top:20px;background:${C.verde};color:#fff;border-radius:22px;padding:30px;text-align:center;font:800 38px Montserrat">Comprar agora</div>
     </div>
     <div id="ok" style="position:absolute;inset:0;background:rgba(36,64,42,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;opacity:0;color:${C.linho}">
      <div id="okc" style="width:200px;height:200px;border-radius:50%;background:${C.claro};display:flex;align-items:center;justify-content:center;font:800 120px Montserrat;color:${C.musgo}">✓</div>
      <div style="font:800 54px Montserrat">Pedido confirmado</div><div style="font-size:34px;opacity:.85">2,5 m de tricoline listrada</div></div>
    </div>
   </div></div>
 </div>
 <!-- S4 entrega -->
 <div class="sc" id="s4" style="position:absolute;inset:0;opacity:0">
  <div class="linen" style="position:absolute;inset:0"></div>
  <div style="position:absolute;left:0;right:0;top:1480px;bottom:0;background:${C.areia}"></div>
  ${cap('c4','Chegou rapidinho,<br>dobrado com cuidado.')}
  <div id="truck" style="position:absolute;top:620px;left:-500px;width:440px;color:${C.verde}"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h24v20H4ZM28 18h9l6 7v7H28"/><circle cx="12" cy="35" r="4"/><circle cx="35" cy="35" r="4"/></svg></div>
  <div id="box" style="position:absolute;left:290px;top:980px;width:500px;height:400px;opacity:0">
   <div id="fabric" style="position:absolute;left:30px;right:30px;top:0;height:330px;border-radius:16px;background:url(${IMG}) center/cover;box-shadow:0 10px 30px rgba(0,0,0,.15)"></div>
   <div style="position:absolute;left:0;right:0;bottom:0;height:300px;background:#C9A77C;border-radius:12px;box-shadow:0 30px 50px rgba(0,0,0,.18)"></div>
   <div id="lid" style="position:absolute;left:-10px;right:-10px;bottom:270px;height:60px;background:#B8956A;border-radius:10px;transform-origin:0 100%"></div>
   <div style="position:absolute;left:170px;bottom:90px;width:160px;height:160px;border-radius:50%;background:${C.linho};display:flex;align-items:center;justify-content:center"><div style="width:52px;height:78px">${symbol({})}</div></div>
  </div>
  <div id="badge" style="position:absolute;left:640px;top:880px;background:${C.verde};color:${C.linho};font:800 34px Montserrat;padding:18px 28px;border-radius:999px;opacity:0;transform:rotate(-6deg)">Entrega rápida ✓</div>
 </div>
 <!-- S5 ateliê -->
 <div class="sc" id="s5" style="position:absolute;inset:0;opacity:0;background:${C.areia}">
  ${cap('c5','No ateliê,<br>a ideia ganhou forma.',120,C.areia,C.grafite)}
  <div style="position:absolute;left:0;right:0;top:1180px;height:60px;background:#A88B67"></div>
  <div style="position:absolute;left:60px;top:620px;width:420px">${seamstress()}</div>
  <div style="position:absolute;left:330px;top:900px;width:520px">${machine()}</div>
  <div id="strip" style="position:absolute;left:420px;top:1150px;width:0;height:46px;background:url(${IMG}) center/cover;border-radius:6px"></div>
  <div style="position:absolute;left:640px;top:330px;width:380px;height:560px;background:#fff;border-radius:30px;box-shadow:0 20px 40px rgba(0,0,0,.1);display:flex;align-items:center;justify-content:center">
   <svg viewBox="0 0 300 380" width="300" height="380"><defs><pattern id="fab5" patternUnits="userSpaceOnUse" width="300" height="380"><image href="${IMG}" x="-40" y="-200" width="380" height="700" preserveAspectRatio="xMidYMid slice"/></pattern><clipPath id="cl5"><rect id="rv5" x="0" y="380" width="300" height="380"/></clipPath></defs>
    <path d="M110 40 Q150 25 190 40 L196 140 Q240 260 262 330 Q150 360 38 330 Q60 260 104 140Z" fill="none" stroke="${C.grafite}" stroke-width="6" stroke-dasharray="14 10"/>
    <path d="M110 40 Q150 25 190 40 L196 140 Q240 260 262 330 Q150 360 38 330 Q60 260 104 140Z" fill="url(#fab5)" clip-path="url(#cl5)"/>
   </svg></div>
  <div id="pct" style="position:absolute;left:640px;top:910px;width:380px;text-align:center;font:800 40px Montserrat;color:${C.musgo}">0%</div>
 </div>
 <!-- S6 vestindo -->
 <div class="sc" id="s6" style="position:absolute;inset:0;opacity:0;background:radial-gradient(circle at 50% 50%,${C.claro} 0,${C.verde} 60%)">
  <div id="spark" style="position:absolute;inset:0"></div>
  <div id="a6" style="position:absolute;left:280px;top:620px;width:520px">${avatar('av6',{dress:true})}</div>
  ${cap('c6','Do jeito que ela imaginou.<br><span style="color:'+C.musgo+'">E muito confortável.</span>',150,'',C.linho)}
 </div>
 <!-- S7 percepção -->
 <div class="sc" id="s7" style="position:absolute;inset:0;opacity:0;background:${C.musgo}">
  <div style="position:absolute;left:90px;right:90px;top:430px;display:grid;gap:70px">
   <div style="font:800 76px/1.1 Montserrat;color:${C.linho}">Por trás de cada projeto, alguém que entrega</div>
   ${['Tecido certo','Entrega rápida','Qualidade do rolo ao vestido'].map((t,i)=>`<div class="chk" style="display:flex;gap:34px;align-items:center;opacity:0"><div style="width:100px;height:100px;border-radius:50%;background:${C.claro};display:flex;align-items:center;justify-content:center;font:800 60px Montserrat;color:${C.musgo};flex:none">✓</div><div style="font:800 60px Montserrat;color:${C.linho}">${t}</div></div>`).join('')}
  </div>
 </div>
 <!-- S8 avaliação -->
 <div class="sc" id="s8" style="position:absolute;inset:0;opacity:0">
  <div class="linen" style="position:absolute;inset:0"></div>
  ${cap('c8','E ela fez questão<br>de avaliar a loja.')}
  <div style="position:absolute;left:165px;top:420px;width:750px;height:1380px;background:#111;border-radius:80px;padding:22px;box-shadow:0 40px 80px rgba(0,0,0,.25)">
   <div style="position:relative;width:100%;height:100%;background:#fff;border-radius:60px;overflow:hidden;padding:90px 44px;font-family:'DM Sans'">
    <div style="font:800 44px Montserrat;color:#111">Avaliar produto</div>
    <div style="display:flex;gap:22px;align-items:center;margin-top:34px"><div style="width:130px;height:130px;border-radius:18px;background:url(${IMG}) center/cover"></div><div><div style="font:700 32px 'DM Sans'">Tricoline listrada rosa</div><div style="font-size:26px;color:#666">Plano Tecidos · 2,5 m</div></div></div>
    <div style="display:flex;gap:18px;justify-content:center;margin-top:60px">${[0,1,2,3,4].map(i=>star('st'+i,104)).join('')}</div>
    <div id="lbl" style="text-align:center;font:800 36px Montserrat;color:${C.verde};margin-top:20px;opacity:0">Excelente!</div>
    <div style="margin-top:40px;border:2px solid #e5e5e5;border-radius:24px;padding:30px;min-height:330px;font:500 36px/1.45 'DM Sans';color:#222"><span id="rv"></span><span id="caret2" style="display:inline-block;width:3px;height:40px;background:#333;vertical-align:middle"></span></div>
    <div id="send" style="margin-top:36px;background:${C.verde};color:#fff;border-radius:22px;padding:30px;text-align:center;font:800 38px Montserrat">Enviar avaliação</div>
    <div id="thx" style="position:absolute;inset:0;background:rgba(255,255,255,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;opacity:0">
     <div style="font-size:120px;color:#F2B01E;letter-spacing:6px">★★★★★</div><div style="font:800 50px Montserrat;color:#111">Avaliação enviada</div><div style="font-size:32px;color:#666">Obrigada, Plano Tecidos! 💚</div></div>
   </div></div>
 </div>
 <!-- S9 final -->
 <div class="sc" id="s9" style="position:absolute;inset:0;opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:70px" class="linen">
  <div class="linen" style="position:absolute;inset:0;z-index:-1"></div>
  <div id="lg9" data-logo="main" data-size="170"></div>
  <div id="tg9" style="font:800 64px/1.2 Montserrat;color:${C.grafite};text-align:center">O nosso plano é dar vida<br>ao seu <span style="color:${C.verde}">projeto</span>.</div>
  <div id="sh9" style="display:flex;align-items:center;gap:18px;font:700 44px Montserrat;color:${C.musgo};background:#fff;border-radius:999px;padding:22px 40px;box-shadow:0 14px 30px rgba(0,0,0,.08)">🛍️ shopee.com.br/planotecidos</div>
  <div style="font:700 34px Montserrat;color:${C.grafite};opacity:.7">@planotecidos</div>
 </div>
</div>`;

const T={s1:[0,7.4],s2:[7.4,11.4],s3:[11.4,20.6],s4:[20.6,25.6],s5:[25.6,32.8],s6:[32.8,38.6],s7:[38.6,42.6],s8:[42.6,50.6],s9:[50.6,56]};
const QUERY='tecido tricoline listrada';
const cues=[
 ...Object.values(T).slice(1).map(([a])=>({t:a-.15,s:'whoosh'})),
 {t:1.6,s:'slide'},{t:2.6,s:'nope'},{t:3.6,s:'nope'},{t:4.6,s:'nope'},{t:5.6,s:'nope'},{t:6.1,s:'sigh'},
 {t:8.0,s:'pop'},{t:8.6,s:'draw'},{t:9.6,s:'idea'},
 ...[...QUERY].map((_,i)=>({t:12.2+i*.07,s:'type'})),{t:14.4,s:'pop'},{t:15.3,s:'tap'},{t:16.6,s:'tap'},{t:17.1,s:'tick'},{t:17.5,s:'tick'},{t:17.9,s:'tick'},{t:18.6,s:'tap'},{t:18.9,s:'success'},
 {t:21.4,s:'truck'},{t:22.3,s:'thud'},{t:23.1,s:'unwrap'},{t:23.8,s:'ding'},
 {t:26.6,s:'sew',d:5.2},{t:31.8,s:'ding'},
 {t:33.4,s:'sparkle'},{t:35.2,s:'twirl'},{t:36.6,s:'sparkle'},
 {t:39.4,s:'check'},{t:40.1,s:'check'},{t:40.8,s:'check'},
 ...[0,1,2,3,4].map(i=>({t:43.8+i*.28,s:'star',i})),
 ...[...REVIEW].filter((_,i)=>i%2===0).map((_,k)=>({t:45.4+k*.07,s:'type'})),{t:49.6,s:'tap'},{t:49.8,s:'success'},
 {t:51.0,s:'logo'}
];

function render(t){
 const g=s=>document.querySelector(s);
 for(const [k,[a,b]] of Object.entries(T)){const v=k==='s1'?Math.min(1,1-seg(t,b-.45,b)):k==='s9'?seg(t,a,a+.45):vis(t,a,b);g('#'+k).style.opacity=v;g('#'+k).style.visibility=v>0?'visible':'hidden'}
 const capv=(id,a,b)=>{const e=g(id);e.style.opacity=vis(t,a,b,.4);e.style.transform=`translateY(${(1-E(seg(t,a,a+.5)))*30}px)`};
 /* S1 */
 capv('#c1',.2,3.6);capv('#c1b',3.8,7.4);
 g('#rack').style.transform=`translateX(${(1-E(seg(t,.8,2.2)))*1200}px)`;
 document.querySelectorAll('#s1 .nope').forEach((n,i)=>{const a=2.5+i;const p=EB(seg(t,a,a+.35));n.style.opacity=cl(seg(t,a,a+.15));n.style.transform=`scale(${.5+.5*p}) rotate(-8deg)`});
 const a1=g('#av1');face(a1,t,t<2.4?'ok':'sad');
 a1.querySelector('#av1-head').style.transform=`rotate(${t>2.4?Math.sin(t*2.2)*6:0}deg)`;
 a1.querySelector('#av1-armR').style.transform=`rotate(${t>6?-10:0}deg)`;
 g('#a1').style.transform=`translateX(${t>2.4?-40:0}px)`;
 /* S2 */
 capv('#c2',7.6,11.4);
 const a2=g('#av2');face(a2,t,t<9.4?'ok':'joy');
 a2.querySelector('#av2-head').style.transform=`rotate(${-8*E(seg(t,7.6,8.2))}deg)`;
 a2.querySelector('#av2-armR').style.transform=`rotate(${-150*E(seg(t,7.8,8.4))}deg)`;
 g('#bub').style.transform=`scale(${EB(seg(t,7.9,8.5))})`;
 document.querySelectorAll('#s2 .dot').forEach((d,i)=>d.style.opacity=seg(t,7.8+i*.1,8+i*.1));
 const sk=g('#sk');sk.style.strokeDashoffset=1400*(1-EIO(seg(t,8.5,10)));
 g('#bulb').style.opacity=seg(t,9.5,9.7);g('#bulb').style.transform=`scale(${EB(seg(t,9.5,9.9))})`;
 /* S3 */
 capv('#c3',11.6,20.6);
 g('#ph').style.transform=`translateY(${(1-E(seg(t,11.4,12.1)))*500}px)`;
 const n=Math.round(cl((t-12.2)/.07,0,QUERY.length));g('#q').textContent=QUERY.slice(0,n);g('#caret').style.opacity=(t*2%1)<.5?1:0;
 g('#res').style.opacity=E(seg(t,14.3,14.7));
 g('#p-search').style.opacity=1-seg(t,15.3,15.6);
 g('#p-grid').style.opacity=seg(t,15.3,15.6)*(1-seg(t,16.7,17));
 g('#tap').style.opacity=vis(t,16.3,16.9,.15);g('#tap').style.transform=`scale(${.6+.6*E(seg(t,16.4,16.8))})`;
 g('.tile[data-i="0"]').style.outline=t>16.5?`10px solid ${C.verde}`:'none';g('.tile[data-i="0"]').style.outlineOffset='-10px';
 g('#p-prod').style.opacity=seg(t,16.7,17);
 g('#mt').textContent=t<17.1?'1,0 m':t<17.5?'1,5 m':t<17.9?'2,0 m':'2,5 m';
 g('#buy').style.transform=`scale(${t>18.5&&t<18.75?.95:1})`;
 g('#ok').style.opacity=seg(t,18.8,19.1);g('#okc').style.transform=`scale(${EB(seg(t,18.9,19.4))})`;
 /* S4 */
 capv('#c4',20.8,25.6);
 g('#truck').style.transform=`translateX(${EIO(seg(t,20.8,22.6))*2200}px)`;
 g('#box').style.opacity=seg(t,22,22.3);g('#box').style.transform=`translateY(${(1-EB(seg(t,22,22.5)))*-300}px)`;
 g('#lid').style.transform=`translate(${-60*E(seg(t,23,23.6))}px,${-240*E(seg(t,23,23.6))}px) rotate(${-18*E(seg(t,23,23.6))}deg)`;g('#lid').style.opacity=1-seg(t,23.3,23.7);
 g('#fabric').style.transform=`translateY(${-260*E(seg(t,23.2,24))}px) rotate(${-4*E(seg(t,23.2,24))}deg)`;
 g('#badge').style.opacity=seg(t,23.7,24);g('#badge').style.transform=`rotate(-6deg) scale(${EB(seg(t,23.7,24.1))})`;
 /* S5 */
 capv('#c5',25.8,32.8);
 const sew=seg(t,26.6,31.8);
 g('#needle').style.transform=`translateY(${t>26.6&&t<31.8?Math.abs(Math.sin(t*28))*22:0}px)`;
 g('#strip').style.width=(sew*560)+'px';
 g('#rv5').setAttribute('y',380-380*sew);
 g('#pct').textContent=Math.round(sew*100)+'%';
 /* S6 */
 capv('#c6',33,38.6);
 const a6=g('#av6');face(a6,t,'joy');
 const tw=seg(t,35,36.4);a6.querySelector('#av6-skirt').style.transform=`scaleX(${1+.16*Math.sin(tw*Math.PI*3)*(1-tw)+.04})`;
 g('#a6').style.transform=`translateY(${-Math.abs(Math.sin(seg(t,35,36.4)*Math.PI))*30}px) scale(${.92+.08*E(seg(t,32.8,33.6))})`;
 a6.querySelector('#av6-armL').style.transform=`rotate(${40*E(seg(t,33.4,34))}deg)`;
 a6.querySelector('#av6-armR').style.transform=`rotate(${-40*E(seg(t,33.4,34))}deg)`;
 g('#spark').innerHTML=Array.from({length:16},(_,i)=>{const a=i*137.5,ph=((t*0.6+i*.13)%1),x=540+Math.cos(a)*(260+ph*220),y=1150+Math.sin(a)*(360+ph*260);return `<div style="position:absolute;left:${x}px;top:${y}px;font-size:${30+(i%3)*14}px;opacity:${Math.sin(ph*Math.PI)*seg(t,33.2,33.8)};color:${i%2?C.linho:'#F2B8C6'}">${i%3?'✦':'♥'}</div>`}).join('');
 /* S7 */
 document.querySelectorAll('#s7 .chk').forEach((c,i)=>{const a=39.3+i*.7;c.style.opacity=seg(t,a,a+.3);c.style.transform=`translateX(${(1-E(seg(t,a,a+.5)))*80}px)`});
 /* S8 */
 capv('#c8',42.8,50.6);
 for(let i=0;i<5;i++){const a=43.8+i*.28,p=seg(t,a,a+.01),s=g('#st'+i);s.querySelector('path').setAttribute('fill',p?'#F2B01E':'#E6E0D4');s.querySelector('path').setAttribute('stroke',p?'#E09A00':'#C9BFA8');s.style.transform=`scale(${p?EB(seg(t,a,a+.3))*1:1})`}
 g('#lbl').style.opacity=seg(t,45.1,45.3);
 const rn=Math.round(cl((t-45.4)/.035,0,REVIEW.length));g('#rv').textContent=[...REVIEW].slice(0,rn).join('');g('#caret2').style.opacity=(t*2%1)<.5&&t<49.5?1:0;
 g('#send').style.transform=`scale(${t>49.5&&t<49.75?.95:1})`;
 g('#thx').style.opacity=seg(t,49.8,50.1);
 /* S9 */
 g('#lg9').style.transform=`scale(${.85+.15*EB(seg(t,50.8,51.5))})`;
 g('#tg9').style.opacity=seg(t,51.6,52.1);g('#sh9').style.opacity=seg(t,52.2,52.7);g('#sh9').style.transform=`translateY(${(1-E(seg(t,52.2,52.8)))*30}px)`;
}
window.M_EXTRA=Object.assign(window.M_EXTRA||{},{'m5-historia':{dur:56,poster:36,html,render,cues,storyboard:[3.2,6.5,10.2,13.5,17.6,19.4,24.2,30,36,40.9,47.5,53]}});
})();
