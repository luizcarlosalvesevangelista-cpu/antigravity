/* Plano Tecidos — biblioteca da marca (símbolo "L-rolo" + logotipo).
   Mesma geometria do manual (brand/plano-tecidos/index.html): altura de versal = 100, haste x = 28. */
(function(g){
  const C={verde:'#4E8C34',claro:'#86BC5F',flap:'#6FAA48',sombra:'#3C7429',musgo:'#24402A',linho:'#F1EADF',areia:'#D6CAB4',grafite:'#2B2B29'};
  let uid=0;
  function symbol(o={}){
    const id='pt'+(uid++);
    const mono=o.mode==='mono';
    const c=o.color||C.verde, bg=o.bg||'#fff';
    const stem=mono?c:C.verde, top=mono?c:C.claro, foot=mono?c:C.sombra, flap=mono?c:C.flap, core=mono?bg:C.musgo;
    const body='M0,0 A14,5.5 0 0 0 28,0 L28,100 L0,100Z';
    const tex=(o.texture!==false&&!mono)?`<path d="${body}" fill="url(#${id})"/>`:'';
    const seps=mono?`<g stroke="${bg}" stroke-width="2.6" fill="none"><path d="M0,0 A14,5.5 0 0 0 28,0"/><line x1="28" y1="75" x2="28" y2="100"/><line x1="50" y1="75" x2="50" y2="100"/></g>`:'';
    return `<svg viewBox="-1 -6.5 72 107.5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><pattern id="${id}" width="4" height="3.2" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#fff" opacity=".10"/><rect width="1" height="3.2" fill="#000" opacity=".05"/></pattern></defs>
<path class="s-flap" d="M50,75 L70,55 L70,80 L50,100Z" fill="${flap}"/>
${mono?'':'<path class="s-flap" d="M50,75 L70,55 L70,61 L50,81Z" fill="#000" opacity=".08"/>'}
<path class="s-foot" d="M28,75 L50,75 L50,100 L28,100Z" fill="${foot}"/>
<g class="s-stem"><path d="${body}" fill="${stem}"/>${tex}
${mono?'':'<path d="M21,0 A14,5.5 0 0 0 28,0 L28,100 L21,100Z" fill="#000" opacity=".10"/>'}
<ellipse cx="14" cy="0" rx="14" ry="5.5" fill="${top}"/>
<path d="M14,-2.8 a6,2.6 0 1 1 -0.2,0 M14,-1.3 a2.6,1.2 0 1 0 0.2,0" fill="none" stroke="${core}" stroke-width="1.1" opacity="${mono?1:.75}"/>
<ellipse cx="14" cy="0" rx="1.7" ry=".85" fill="${core}"/></g>${seps}</svg>`;
  }
  const CSS=`.pt-logo{display:inline-flex;flex-direction:column;align-items:center;line-height:1}
.pt-logo .w{font-family:'Montserrat',sans-serif;font-weight:800;display:flex;align-items:baseline;letter-spacing:.02em;white-space:nowrap}
.pt-logo .l{display:inline-block;position:relative;width:calc(.7em * 72 / 100);height:.7em;margin:0 .05em 0 .01em}
.pt-logo .l svg{position:absolute;left:0;bottom:-.007em;width:100%;height:calc(.7em * 107.5 / 100);overflow:visible}
.pt-logo .t{font-family:'Montserrat',sans-serif;font-weight:700;white-space:nowrap;margin-top:.32em}
.pt-logo.h{flex-direction:row;align-items:center}
.pt-logo.h .sep{width:2px;align-self:stretch;background:currentColor;opacity:.35;margin:0 .45em}
.pt-logo.h .t{margin-top:0;font-weight:600}
.pt-sym{display:inline-block}.pt-sym svg{width:100%;height:100%;display:block;overflow:visible}`;
  /* logo(el) lê data-size, data-logo (main|h), data-mode (color|rev|mono), data-color, data-bg, data-sym */
  function logo(el){
    const s=+el.dataset.size||60, mode=el.dataset.mode||'color', type=el.dataset.logo||'main';
    const rev=mode==='rev';
    const ink=el.dataset.color||(rev?C.linho:C.grafite);
    const symMono=mode==='mono'||el.dataset.sym==='mono';
    const sym=symbol({mode:symMono?'mono':'color',color:symMono?(el.dataset.symColor||ink):undefined,bg:el.dataset.bg});
    const w=`<div class="w" style="font-size:${s}px;color:${ink}">P<span class="l">${sym}</span>ANO</div>`;
    el.innerHTML=type==='h'
      ?`<div class="pt-logo h" style="color:${ink}">${w}<span class="sep" style="font-size:${s}px"></span><div class="t" style="font-size:${s*.34}px;letter-spacing:.32em;line-height:1.25">TECIDOS</div></div>`
      :`<div class="pt-logo" style="color:${ink}">${w}<div class="t" style="font-size:${s*.36}px;color:${ink}">TECIDOS</div></div>`;
  }
  function fit(root=document){
    root.querySelectorAll('.pt-logo:not(.h)').forEach(l=>{
      const w=l.querySelector('.w'),t=l.querySelector('.t');
      t.style.letterSpacing='0px';t.style.marginRight='0px';
      const ls=(w.getBoundingClientRect().width*.8-t.getBoundingClientRect().width)/t.textContent.length;
      t.style.letterSpacing=ls+'px';t.style.marginRight=(-ls)+'px';
    });
  }
  function renderAll(root=document){
    root.querySelectorAll('[data-logo]').forEach(logo);
    root.querySelectorAll('[data-sym-only]').forEach(el=>{el.classList.add('pt-sym');el.innerHTML=symbol({mode:el.dataset.mode,color:el.dataset.color,bg:el.dataset.bg})});
    return (document.fonts?document.fonts.ready:Promise.resolve()).then(()=>fit(root));
  }
  const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  g.Plano={C,symbol,logo,fit,renderAll};
})(window);
