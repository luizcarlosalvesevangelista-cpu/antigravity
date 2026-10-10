const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
// Atualiza no painel (upecriativo-cc472) os itens do YouTube e da Loja Upe a partir do upe-cronograma.json
const admin=require('firebase-admin');const fs=require('fs');
const db=admin.initializeApp({credential:admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))}).firestore();
(async()=>{const arq=JSON.parse(fs.readFileSync(__R+'/site/portal/cronograma/upe-cronograma.json','utf8'));
const alvo=x=>x.canal==='youtube'||['Loja Upe','Landing pages','Upe Sistemas'].includes(x.pilar);const ids=new Set(arq.itens.filter(alvo).map(x=>x.id));
const atual=(await db.collection('cronograma').get()).docs;let rem=0,set=0;const b=db.batch();
for(const d of atual){const x=d.data();if(d.id!=='_extras'&&alvo(x)&&!ids.has(d.id)&&!String(x.origem||'').startsWith('Modelo')){b.delete(d.ref);rem++;}}
for(const it of arq.itens){if(!alvo(it))continue;b.set(db.doc('cronograma/'+it.id),it);set++;}
await b.commit();console.log('removidos',rem,'gravados',set);process.exit(0)})();
