// Apaga o que os testes de regras gravaram no banco real (eventos, leads, interessados e erros de teste).
const admin=require('firebase-admin');const db=admin.initializeApp({credential:admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))}).firestore();
(async()=>{let n=0;const del=async q=>{for(const d of (await q.get()).docs){await d.ref.delete();n++}};
for(const p of ['exemplo','upe-site']){await del(db.collection(`lp_paginas/${p}/eventos`).where('vid','==','teste-regras'));await del(db.collection(`lp_paginas/${p}/leads`).where('vid','==','teste-regras'));}
await del(db.collection('srv_interessados').where('nome','==','Teste regras'));await del(db.collection('erros').where('app','==','teste'));
console.log('apagados',n);process.exit(0)})();
