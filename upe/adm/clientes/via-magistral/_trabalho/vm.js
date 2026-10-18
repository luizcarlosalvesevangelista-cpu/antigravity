
  // =============================================================
  // VIA MAGISTRAL — logo novo (vetores do logofolio) e peças da marca
  // =============================================================
  const VM = /*BRAND_JSON*/null;
  const VC = { royal:"#112250", gold:"#C6A75E", saphire:"#3C5070", shell:"#D9C8C2", swan:"#F5F0E9" };

  // kind: symbol | v (vertical) | h (horizontal) | stack
  function vmLogo(kind, o = {}){
    const L = VM[kind];
    const sym = L.sym.map((d,i)=>`<path class="s${i}" d="${d}"/>`).join("");
    const word = L.word.map((d,i)=>`<path class="w" style="--i:${i}" d="${d}"/>`).join("");
    const tag = L.tag.map((d,i)=>`<path class="t" style="--i:${i}" d="${d}"/>`).join("");
    const color = o.color ? ` style="color:${o.color}"` : "";
    return `<svg class="vm-logo ${o.cls||""}" viewBox="${L.vb}" fill="currentColor"${color} ${o.attrs||""} role="img" aria-label="Via Magistral"><g>${sym}</g><g>${word}</g><g>${tag}</g></svg>`;
  }
  function vmPlace(kind, x, y, w, color){
    const [, , vw, vh] = VM[kind].vb.split(" ").map(Number);
    return vmLogo(kind, { color, attrs:`x="${x}" y="${y}" width="${w}" height="${(w*vh/vw).toFixed(1)}"` });
  }
  function vmPlay(el){ el.classList.remove("play"); void el.getBoundingClientRect(); el.classList.add("play"); }
  const vmReduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // logos declarados no HTML
  document.querySelectorAll("[data-logo]").forEach(el=>{ el.innerHTML = vmLogo(el.dataset.logo, { color: el.dataset.color }); });

  // ---------- motion do logo (toca quando aparece na tela) ----------
  (function(){
    const box = document.getElementById("vmMotion");
    if(!box) return;
    box.insertAdjacentHTML("afterbegin", vmLogo("v", { cls:"mo" }));
    const svg = box.querySelector("svg");
    document.getElementById("vmReplay").addEventListener("click", ()=> vmPlay(svg));
    if(vmReduce) return;
    const io = new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ vmPlay(svg); io.disconnect(); } }); }, { threshold:0.6 });
    io.observe(box);
  })();

  // ---------- anatomia ----------
  (function(){
    const el = document.getElementById("vmAnatomy");
    if(!el) return;
    const [x,y,w,h] = VM.symbol.vb.split(" ").map(Number);
    const pins = [[812,1428,1],[690,1705,2],[385,1682,3],[530,1905,4]];
    const pinSvg = pins.map(([px,py,n])=>`<g><circle cx="${px}" cy="${py}" r="22" fill="${VC.gold}" stroke="${VC.swan}" stroke-width="6"/><text x="${px}" y="${py+8}" text-anchor="middle" style="font:600 24px Poppins,sans-serif;fill:${VC.royal}">${n}</text></g>`).join("");
    el.innerHTML = `<svg viewBox="${x-30} ${y-30} ${w+60} ${h+60}" fill="currentColor" role="img" aria-label="Símbolo com as partes numeradas">${VM.symbol.sym.map(d=>`<path d="${d}"/>`).join("")}${pinSvg}</svg>`;
  })();

  // ---------- "por que funciona" ----------
  (function(){
    const s = document.getElementById("vmSizes");
    if(!s) return;
    s.innerHTML = [72,40,24,16].map(n=>`<figure><div style="width:${n}px">${vmLogo("symbol")}</div>${n}px</figure>`).join("");
    document.getElementById("vmOwn").innerHTML = vmLogo("symbol");
    document.getElementById("vmMono").innerHTML =
      `<span style="background:${VC.swan};color:${VC.royal}"><div>${vmLogo("symbol")}</div></span>
       <span style="background:${VC.gold};color:${VC.royal}"><div>${vmLogo("symbol")}</div></span>
       <span style="border:2px solid ${VC.gold};color:${VC.gold}"><div>${vmLogo("symbol")}</div></span>`;
  })();

  // ---------- frasco e pote ----------
  (function(){
    const el = document.getElementById("vmFrasco");
    if(!el) return;
    const f = "font-family:Poppins,sans-serif";
    el.innerHTML = `<svg viewBox="0 0 600 480" role="img" aria-label="Frasco âmbar de cápsulas e pote de creme com a nova marca">
      <defs><linearGradient id="vmAmb" x1="0" x2="1"><stop offset="0" stop-color="#5a2f0e"/><stop offset=".35" stop-color="#9a5a22"/><stop offset=".6" stop-color="#7a461a"/><stop offset="1" stop-color="#4a260b"/></linearGradient>
      <linearGradient id="vmJar" x1="0" x2="1"><stop offset="0" stop-color="#e9e2d8"/><stop offset=".4" stop-color="#fbf8f3"/><stop offset="1" stop-color="#d9d0c4"/></linearGradient></defs>
      <rect width="600" height="480" fill="${VC.shell}"/>
      <ellipse cx="250" cy="432" rx="120" ry="14" fill="#000" opacity=".12"/><ellipse cx="440" cy="434" rx="100" ry="12" fill="#000" opacity=".12"/>
      <rect x="160" y="70" width="180" height="62" rx="8" fill="${VC.swan}"/>
      ${Array.from({length:14},(_,i)=>`<line x1="${170+i*12}" y1="76" x2="${170+i*12}" y2="126" stroke="#d6cdc0" stroke-width="2"/>`).join("")}
      <path d="M170 132h160v18c0 6 30 14 30 40v222c0 12-10 22-22 22H162c-12 0-22-10-22-22V190c0-26 30-34 30-40z" fill="url(#vmAmb)"/>
      <rect x="140" y="206" width="220" height="176" fill="${VC.swan}"/>
      <rect x="140" y="206" width="220" height="40" fill="${VC.royal}"/>
      ${vmPlace("h", 152, 207, 92, VC.swan)}
      <text x="152" y="270" style="${f};font-size:15px;font-weight:600" fill="${VC.royal}">Vitamina D3 2.000 UI</text>
      <text x="152" y="287" style="${f};font-size:9.5px" fill="${VC.saphire}">60 cápsulas · uso oral · conforme prescrição</text>
      <line x1="152" x2="348" y1="299" y2="299" stroke="${VC.royal}" stroke-opacity=".2"/>
      <text x="152" y="316" style="${f};font-size:9px;font-weight:500" fill="${VC.royal}">Paciente ______________________</text>
      <text x="152" y="332" style="${f};font-size:9px;font-weight:500" fill="${VC.royal}">Lote 0426 · Val. 04/2027</text>
      <text x="152" y="348" style="${f};font-size:9px;font-weight:500" fill="${VC.royal}">Resp. Técnica CRF DF 1.150</text>
      <rect x="140" y="366" width="220" height="16" fill="${VC.gold}"/>
      <path d="M180 140c0 0-20 10-20 50v200" stroke="#fff" stroke-opacity=".18" stroke-width="10" fill="none" stroke-linecap="round"/>
      <rect x="345" y="300" width="190" height="44" rx="6" fill="${VC.royal}"/>
      <path d="M352 344h176v70c0 10-8 18-18 18H370c-10 0-18-8-18-18z" fill="url(#vmJar)"/>
      <rect x="352" y="360" width="176" height="58" fill="${VC.shell}" opacity=".9"/>
      ${vmPlace("symbol", 364, 368, 40, VC.royal)}
      <text x="414" y="385" style="${f};font-size:12.5px;font-weight:600" fill="${VC.royal}">Creme hidratante</text>
      <text x="414" y="401" style="${f};font-size:8.5px;font-weight:500" fill="${VC.royal}">50 g · uso tópico</text>
    </svg>`;
  })();

  // ---------- sacola Royal Blue (slide extra no carrossel de sacolas) ----------
  (function(){
    const el = document.getElementById("vmBag");
    if(!el) return;
    el.innerHTML = `<svg viewBox="0 0 600 480" style="width:100%;height:100%" role="img" aria-label="Sacola Royal Blue com a nova marca">
      <rect width="600" height="480" fill="${VC.swan}"/>
      <ellipse cx="300" cy="446" rx="170" ry="14" fill="#000" opacity=".1"/>
      <path d="M240 140c0-70 120-70 120 0" stroke="${VC.gold}" stroke-width="7" fill="none"/>
      <path d="M150 130h300l20 310H130z" fill="${VC.royal}"/>
      <path d="M150 130h300l4 50H146z" fill="#0c1a3e"/>
      <circle cx="240" cy="150" r="6" fill="${VC.gold}"/><circle cx="360" cy="150" r="6" fill="${VC.gold}"/>
      ${vmPlace("v", 205, 220, 190, VC.swan)}
      <text x="300" y="420" text-anchor="middle" style="font-family:Poppins,sans-serif;font-weight:500;font-size:11px;letter-spacing:2px" fill="${VC.gold}">ASA SUL · ST SUDOESTE · GAMA</text>
    </svg>`;
  })();

  // ---------- Instagram: posts ----------
  const vmStripes = (color, op=1) => `<svg viewBox="0 0 400 120" preserveAspectRatio="none" style="width:100%;height:auto;display:block" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="7" stroke-linecap="round"><path d="M6 20 C120 30 260 28 394 6"/><path d="M40 60 C150 70 270 64 380 46"/><path d="M80 100 C180 108 280 100 360 86"/></svg>`;
  const VM_POSTS = [
    { c:"p-navy", h:`<div class="patband vm-pat" style="top:0;background:${VC.gold};opacity:.85"></div><div class="in" style="align-items:center;text-align:center;padding-top:22cqw">
        <div style="width:58cqw;margin:auto">${vmLogo("v")}</div>
        <p class="ttl" style="font-size:6cqw;font-weight:500">Uma nova via para <em style="color:${VC.gold}">o seu cuidado.</em></p></div>` },
    { c:"p-linen", h:`<div class="in"><span class="lbl">Manipulação sob medida</span>
        <p class="ttl" style="font-size:12cqw;margin-top:9cqw">Sua fórmula.<br>Sua dose.<br><em style="color:${VC.saphire}">Seu jeito.</em></p>
        <div style="width:70%;margin-top:7cqw">${vmStripes(VC.gold)}</div>
        <div class="foot"><span>Via Magistral</span><div style="width:14cqw">${vmLogo("symbol")}</div></div></div>` },
    { c:"p-rose", h:`<div class="in"><span class="lbl">Pergunta frequente</span>
        <p class="ttl" style="font-size:8.6cqw;margin-top:8cqw">O que é uma farmácia de manipulação?</p>
        <p class="txt" style="margin-top:6cqw;max-width:90%">É a farmácia que prepara o medicamento a partir da sua receita, na dose e na forma certas para você: cápsulas, cremes, gotas ou sachês.</p>
        <div class="foot"><span>Arraste para o lado →</span><div style="width:12cqw">${vmLogo("symbol")}</div></div></div>` },
    { c:"p-gold", h:`<div class="in"><span class="lbl">Mito ou verdade?</span>
        <p class="ttl" style="font-size:8.4cqw;margin-top:8cqw">Medicamento manipulado passa por controle de qualidade.</p>
        <div style="margin:auto 0 0;display:flex;align-items:center;gap:5cqw">
          <div style="width:30cqw;flex:none;aspect-ratio:1;border-radius:50%;background:${VC.royal};color:${VC.swan};display:grid;place-items:center;font-weight:600;font-size:4.6cqw;letter-spacing:.08em;transform:rotate(-8deg)">VERDADE</div>
          <p class="txt" style="font-size:3.1cqw;flex:1">As farmácias de manipulação seguem as Boas Práticas de Manipulação da Anvisa (RDC 67/2007).</p></div></div>` },
    { c:"p-slate", h:`<div class="in"><span class="lbl" style="color:${VC.gold}">Passo a passo · 1/5</span>
        <p class="ttl" style="font-size:10cqw;margin-top:7cqw">Da receita à sua fórmula</p>
        <ol style="margin:auto 0 0;padding:0;list-style:none;display:grid;gap:3.4cqw;font-size:4cqw;font-weight:500">
          ${["Envie a receita","A farmacêutica avalia","Sua fórmula é preparada","Retire ou receba em casa"].map((t,i)=>`<li style="display:flex;gap:4cqw;align-items:center;border-top:1px solid rgba(245,240,233,.25);padding-top:3.4cqw"><span style="font-weight:600;font-size:3.2cqw;color:${VC.gold}">0${i+1}</span>${t}</li>`).join("")}</ol></div>` },
    { c:"p-navy", h:`<div class="patband vm-pat" style="top:0;height:42%;background:${VC.gold};opacity:.9"></div><div class="in">
        <p class="ttl" style="font-size:10.4cqw;margin-top:auto">Cada pessoa é única.<br><em style="color:${VC.gold}">Cada fórmula também.</em></p>
        <div class="foot" style="margin-top:7cqw"><span>Via Magistral</span><div style="width:12cqw;color:${VC.swan}">${vmLogo("symbol")}</div></div></div>` },
    { c:"p-linen", h:`<div class="in"><span class="lbl">Dica da farmacêutica</span>
        <p class="ttl" style="font-size:8.6cqw;margin-top:7cqw">Três cuidados com suas cápsulas</p>
        <ul style="margin:auto 0 0;padding:0;list-style:none;display:grid;gap:4.4cqw">
        ${["Guarde em local seco e fresco, longe do banheiro e do fogão.","Mantenha o frasco bem fechado e longe do sol.","Respeite a validade do rótulo e os horários da receita."].map(t=>`<li class="txt" style="display:grid;grid-template-columns:7cqw 1fr;gap:3cqw;align-items:start"><span style="height:1.2cqw;background:${VC.gold};border-radius:1cqw;margin-top:2.6cqw"></span>${t}</li>`).join("")}</ul></div>` },
    { c:"p-rose", h:`<div class="in"><span class="lbl">Bastidores</span>
        <div style="display:flex;gap:3cqw;margin:9cqw 0 0">${[VC.royal,VC.gold,VC.swan,VC.saphire].map((col,i)=>`<span style="width:9cqw;height:20cqw;border-radius:5cqw;background:linear-gradient(${col} 50%, ${i%2?VC.swan:VC.gold} 50%);transform:rotate(${[-12,8,-4,14][i]}deg)"></span>`).join("")}</div>
        <p class="ttl" style="font-size:9cqw;margin-top:auto">Preparado à mão.<br>Conferido pela farmacêutica.</p>
        <p class="txt" style="margin-top:4cqw">Cada fórmula é revisada antes de chegar até você.</p></div>` },
    { c:"p-slate", h:`<div class="in"><span class="lbl" style="color:${VC.gold}">Atendimento</span>
        <p class="ttl" style="font-size:9cqw;margin-top:7cqw">Mande a foto da sua receita e receba o orçamento.</p>
        <div style="margin-top:auto;display:grid;gap:2.6cqw;justify-items:start">
          <span style="background:${VC.swan};color:${VC.royal};padding:3cqw 4cqw;border-radius:4cqw 4cqw 4cqw 1cqw;font-size:3.4cqw">Olá! Segue minha receita.</span>
          <span style="background:${VC.gold};color:${VC.royal};padding:3cqw 4cqw;border-radius:4cqw 4cqw 1cqw 4cqw;font-size:3.4cqw;justify-self:end">Recebido! Nossa farmacêutica já vai avaliar.</span></div>
        <div class="foot" style="margin-top:6cqw"><span>Asa Sul · Sudoeste · Gama</span><div style="width:11cqw;color:${VC.swan}">${vmLogo("symbol")}</div></div></div>` },
  ];
  (function(){
    const feed = document.getElementById("feed");
    if(feed) feed.innerHTML = VM_POSTS.map((p,i)=>`<div class="post ${p.c}" data-post="${i+1}">${p.h}</div>`).join("");
  })();

  // ---------- Instagram: reels ----------
  (function(){
    const wrap = document.getElementById("reels");
    if(!wrap) return;
    const ui = cap => `<div class="ui"><div class="top"><span>Reels</span><span>◎</span></div>
      <div class="side"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg><svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg><svg viewBox="0 0 24 24"><path d="M21 3 3 10l7 3 3 7z"/></svg></div>
      <div class="cap"><b><i>${vmLogo("symbol")}</i>viamagistral</b>${cap}</div></div>`;
    const R1 = `<div class="reel r1 mo" style="background:${VC.royal};color:${VC.swan}">
      <div class="sc" style="align-items:center;text-align:center;gap:10cqw"><div style="width:72cqw">${vmLogo("v")}</div>
      <p class="rt after" style="font-size:6.4cqw;font-weight:500">Sua fórmula, <em style="color:${VC.gold}">do seu jeito.</em></p></div>${ui("Chegamos com cara nova.")}</div>`;
    const steps = [["Envie sua receita","Uma foto pelo WhatsApp ou direto no balcão."],["A farmacêutica avalia","Conferimos dose, forma e compatibilidade dos ativos."],["Preparamos sob medida","Sua fórmula é manipulada de acordo com a prescrição."],["Retire ou receba","Na unidade mais perto de você ou em casa."]];
    const R2 = `<div class="reel r2" style="background:${VC.saphire};color:${VC.swan}">
      <div class="bar">${steps.map((_,i)=>`<span><i style="--i:${i}"></i></span>`).join("")}</div>
      ${steps.map(([t,s],i)=>`<div class="sc scene" style="--i:${i}"><div class="stripe" style="--i:${i};width:60cqw;margin-bottom:8cqw">${vmStripes(VC.gold)}</div>
        <span style="font-weight:600;font-size:4cqw;color:${VC.gold};letter-spacing:.12em">PASSO 0${i+1}</span>
        <p class="rt" style="font-size:11cqw;margin-top:4cqw">${t}</p><p style="font-size:4.4cqw;margin-top:5cqw;opacity:.85">${s}</p></div>`).join("")}
      <div class="sc scene last" style="background:${VC.royal};align-items:center;text-align:center;gap:8cqw"><div style="width:62cqw">${vmLogo("v")}</div><p class="rt" style="font-size:6.4cqw;font-weight:500">Peça seu orçamento</p></div>
      ${ui("Como funciona a manipulação, em 4 passos.")}</div>`;
    const facts = ["A dose pode ser ajustada ao seu peso, idade e necessidade.","Mais de um ativo pode ir na mesma cápsula, quando a receita permite.","Cremes podem ser feitos sem perfume, pensando em peles sensíveis."];
    const R3 = `<div class="reel r3" style="background:${VC.shell};color:${VC.royal}">
      <div class="sc" style="justify-content:flex-start;padding-top:24cqw"><p class="rt" style="font-size:12cqw">Você<br><em>sabia?</em></p>
        <div style="width:46cqw;margin-top:6cqw">${vmStripes(VC.royal,.9)}</div></div>
      ${facts.map((f,i)=>`<div class="sc fact" style="--i:${i};justify-content:flex-end;padding-bottom:38cqw;padding-right:20cqw"><span style="font-weight:600;font-size:4cqw;letter-spacing:.1em">0${i+1} / 03</span><p class="rt" style="font-size:7.8cqw;margin-top:4cqw">${f}</p></div>`).join("")}
      <div class="sc end" style="background:${VC.royal};color:${VC.swan};align-items:center;text-align:center;gap:8cqw"><div style="width:62cqw">${vmLogo("v")}</div><p class="rt" style="font-size:6cqw;font-weight:500">Converse com nossa farmacêutica.</p><p style="font-size:3.4cqw;opacity:.7">Consulte sempre um profissional de saúde.</p></div>
      ${ui("Três coisas que a manipulação faz por você.")}</div>`;
    const REELS = [[R1,"Assinatura da marca","8 s · lançamento",8000],[R2,"Como funciona","11 s · passo a passo",11000],[R3,"Você sabia?","10 s · educativo",10000]];
    wrap.innerHTML = REELS.map(([r,t,s])=>`<figure><div class="phone">${r}</div><figcaption class="reel-note"><b>${t}</b>${s}</figcaption></figure>`).join("");
    const reels = wrap.querySelectorAll(".reel");
    if(vmReduce){ reels.forEach(el=>el.classList.add("play")); return; }
    reels.forEach((el,i)=>{ vmPlay(el); setInterval(()=>vmPlay(el), REELS[i][3]); });
  })();
