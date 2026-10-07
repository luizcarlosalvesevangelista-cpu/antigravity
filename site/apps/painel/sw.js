/* Painel como app: guarda a última versão para abrir rápido e sem internet mostrar a cópia guardada.
   Sempre tenta a rede primeiro (páginas e scripts), então uma atualização publicada aparece no próximo acesso. */
const CACHE = "painel-v1";
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/", "/upe-firebase.js", "/manifest.webmanifest", "/icone-192.png"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;   // banco, login e bibliotecas externas vão direto
  e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match("/"))));
});
