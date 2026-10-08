/* Mostra a landing page publicada de um cliente (upe-criativo-lp.web.app/<endereço> ou o domínio próprio dele).
   Lê lp_paginas/<endereço> pela API REST do Firestore (leve, sem SDK) e grava visitas, cliques, rolagem e leads
   em lp_paginas/<endereço>/eventos e /leads. As regras só liberam a leitura de página publicada e não suspensa. */
const P = "upecriativo-cc472", KEY = "AIzaSyDJqqSMLWZLKSt9K1jPzvvQgyikZy4q9vw";
const API = `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents/`;
export const HOSTS_UPE = /(^|\.)(web\.app|firebaseapp\.com)$|^localhost$|^127\.|\.test$/;

const dec = v => v == null ? null : "stringValue" in v ? v.stringValue : "integerValue" in v ? +v.integerValue : "doubleValue" in v ? v.doubleValue : "booleanValue" in v ? v.booleanValue
  : "mapValue" in v ? Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)])) : "arrayValue" in v ? (v.arrayValue.values || []).map(dec) : "timestampValue" in v ? v.timestampValue : null;
async function ler(caminho) {
  const r = await fetch(API + caminho + "?key=" + KEY);
  if (!r.ok) return null;
  const j = await r.json(); return Object.fromEntries(Object.entries(j.fields || {}).map(([k, x]) => [k, dec(x)]));
}
async function endereco() {
  const h = location.hostname.toLowerCase();
  if (!HOSTS_UPE.test(h)) {
    for (const host of [h, h.replace(/^www\./, ""), "www." + h]) { const d = await ler("lp_dominios/" + host); if (d && d.slug) return d.slug; }
    return null;
  }
  return (location.pathname.split("/").filter(Boolean)[0] || "").toLowerCase();
}
const escA = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* script injetado na página do cliente: mede visitas, cliques, rolagem e captura formulários */
function rastreador(slug) {
  return `<script>(function(){var A=${JSON.stringify(API + "lp_paginas/" + slug + "/")},K=${JSON.stringify(KEY)};
function e(v){if(typeof v==="number")return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};if(v&&typeof v==="object"){var f={};for(var k in v)f[k]=e(v[k]);return{mapValue:{fields:f}}}return{stringValue:String(v==null?"":v).slice(0,1000)}}
function grava(col,o){var f={};for(var k in o)f[k]=e(o[k]);try{fetch(A+col+"?key="+K,{method:"POST",keepalive:true,headers:{"Content-Type":"application/json"},body:JSON.stringify({fields:f})})}catch(_){}}
var vid;try{vid=localStorage.getItem("upe-lp-vid");if(!vid){vid=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("upe-lp-vid",vid)}}catch(_){vid="anon"}
var q=new URLSearchParams(location.search),utm=["utm_source","utm_medium","utm_campaign"].map(function(k){return q.get(k)||""}).join("|").replace(/^\\|+$/,"");
var ref="";try{ref=document.referrer?new URL(document.referrer).hostname:""}catch(_){}if(ref===location.hostname)ref="";
var w=Math.min(screen.width,innerWidth),disp=w<700?"celular":w<1100?"tablet":"computador";
function ev(t,x){var o={tipo:t,t:Date.now(),vid:vid};if(x)for(var k in x)o[k]=x[k];grava("eventos",o)}
ev("visita",{ref:ref,utm:utm,disp:disp});
document.addEventListener("click",function(z){var a=z.target.closest&&z.target.closest("a,button,[role=button]");if(!a||a.type==="submit")return;var h=a.getAttribute("href")||"",t=(a.textContent||"").replace(/\\s+/g," ").trim().slice(0,60);
ev(/wa\\.me|whatsapp\\.com/.test(h)?"whatsapp":"clique",{alvo:(t||h).slice(0,200)})},true);
var m=0;addEventListener("scroll",function(){var d=document.documentElement,p=Math.round((scrollY+innerHeight)/Math.max(1,d.scrollHeight)*100);[25,50,75,100].forEach(function(n){if(p>=n-2&&m<n){m=n;ev("rolagem",{prof:n})}})},{passive:true});
document.addEventListener("submit",function(z){var f=z.target;if(!f||f.matches("[data-upe-ignorar]"))return;var c={},n=0;new FormData(f).forEach(function(v,k){if(typeof v==="string"&&n<20&&!/senha|password|cart|card|cvv/i.test(k)){c[k.slice(0,40)]=v.slice(0,500);n++}});
grava("leads",{campos:c,t:Date.now(),vid:vid,utm:utm,status:"novo"});ev("lead");
var act=f.getAttribute("action")||"";if(!act||act==="#"){z.preventDefault();var ok=f.getAttribute("data-obrigado");if(ok){location.href=ok;return}
var d=document.createElement("div");d.setAttribute("role","status");d.style.cssText="padding:18px;border-radius:12px;background:#e3f3ea;color:#1d5c3a;font:600 16px/1.4 system-ui,sans-serif;text-align:center";d.textContent=f.getAttribute("data-mensagem")||"Recebemos os seus dados. Em breve entraremos em contato.";f.replaceWith(d)}},true);
})();<\/script>`;
}
function extras(p) {
  let head = "", body = "";
  const seo = p.seo || {};
  if (seo.descricao) head += `<meta name="description" content="${escA(seo.descricao)}"><meta property="og:description" content="${escA(seo.descricao)}">`;
  if (seo.titulo) head += `<meta property="og:title" content="${escA(seo.titulo)}">`;
  if (seo.imagem) head += `<meta property="og:image" content="${escA(seo.imagem)}">`;
  const px = p.pixel || {};
  if (/^\d{6,20}$/.test(px.meta || "")) head += `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px.meta}');fbq('track','PageView');<\/script>`;
  if (/^G-[A-Z0-9]{4,20}$/.test(px.ga4 || "")) head += `<script async src="https://www.googletagmanager.com/gtag/js?id=${px.ga4}"><\/script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${px.ga4}');<\/script>`;
  const wa = p.whatsapp || {};
  if (wa.ativo && /^\d{10,15}$/.test(wa.numero || "")) {
    const href = `https://wa.me/${wa.numero}${wa.mensagem ? "?text=" + encodeURIComponent(wa.mensagem) : ""}`;
    body += `<a href="${escA(href)}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp" style="position:fixed;right:18px;bottom:18px;z-index:2147483000;width:58px;height:58px;border-radius:50%;background:#25d366;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.25)"><svg viewBox="0 0 32 32" width="30" height="30" fill="#fff" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.8 5.1 2.2.9 3 1 4.1.8.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.5-.3z"/></svg></a>`;
  }
  return { head, body };
}
export function montar(html, p, slug) {
  const x = extras(p);
  let h = String(html || "");
  if (!/<html[\s>]/i.test(h)) h = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${h}</body></html>`;
  if (p.seo?.titulo) h = /<title>[\s\S]*?<\/title>/i.test(h) ? h.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escA(p.seo.titulo)}</title>`) : h.replace(/<head[^>]*>/i, m => m + `<title>${escA(p.seo.titulo)}</title>`);
  h = /<\/head>/i.test(h) ? h.replace(/<\/head>/i, x.head + "</head>") : x.head + h;
  const fim = x.body + (slug ? rastreador(slug) : "");
  h = /<\/body>/i.test(h) ? h.replace(/<\/body>(?![\s\S]*<\/body>)/i, fim + "</body>") : h + fim;
  return h;
}
function indisponivel(t, m) {
  document.title = t;
  document.body.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;padding:24px;font:16px/1.5 system-ui,sans-serif;background:#f4f1ea;color:#0d1b33;text-align:center"><div><h1 style="font-size:28px;margin:0 0 8px">${escA(t)}</h1><p style="margin:0;color:#5a6a82">${escA(m)}</p></div></main>`;
}
export async function mostrar() {
  const slug = await endereco();
  if (!slug) return indisponivel("Página não encontrada", "Confira o endereço digitado.");
  const p = await ler("lp_paginas/" + encodeURIComponent(slug));
  if (!p || !p.html) return indisponivel("Página indisponível", "Esta página não está no ar agora. Volte em breve.");
  const doc = montar(p.html, p, slug);
  document.open(); document.write(doc); document.close();
}
