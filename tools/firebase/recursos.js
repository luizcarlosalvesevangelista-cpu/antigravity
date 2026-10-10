// Liga ou desliga os recursos do plano Blaze no painel (srv_config/recursos). Ex.: node recursos.js storage=1 functions=1 emails=1 gateway=0
const admin=require('firebase-admin');const db=admin.initializeApp({credential:admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))}).firestore();
const v=Object.fromEntries(process.argv.slice(2).map(a=>a.split('=')).filter(([k])=>['storage','functions','emails','gateway','suspensaoAutomatica'].includes(k)).map(([k,x])=>[k,x==='1'||x==='true']));
(async()=>{await db.doc('srv_config/recursos').set({...v,atualizadoEm:Date.now()},{merge:true});console.log('recursos:',JSON.stringify((await db.doc('srv_config/recursos').get()).data()));process.exit(0)})();
