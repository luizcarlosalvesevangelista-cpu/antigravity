const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
// Prepara o Upe Serviços no projeto: catálogo de planos, cliente interno da Upe e a página de exemplo (upe-criativo-lp.web.app/exemplo)
const admin=require('firebase-admin');const fs=require('fs');
const db=admin.initializeApp({credential:admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))}).firestore();
(async()=>{
 const src=fs.readFileSync(__R+'/site/apps/servicos/srv.js','utf8');const arr=src.slice(src.indexOf('export const PLANOS_PADRAO = [')+29,src.indexOf('];',src.indexOf('export const PLANOS_PADRAO'))+1);
 const PL=eval(arr);const tem=(await db.collection('srv_planos').limit(1).get()).size;
 if(!tem){const b=db.batch();PL.forEach(p=>b.set(db.doc('srv_planos/'+p.id),p));await b.commit();console.log('planos',PL.length)}else console.log('planos já existiam');
 const cfg=await db.doc('srv_config/publico').get();if(!cfg.exists)await db.doc('srv_config/publico').set({pixChave:'',pixNome:'Upe Criativo',pixCidade:'Sao Paulo',whatsapp:'5511934393249'});
 await db.doc('srv_clientes/upe-criativo').set({nome:'Upe Criativo (páginas próprias)',emails:['upecriativo@gmail.com'],whatsapp:'5511934393249',doc:'',frentes:['lp','agenda','dash'],obs:'Cliente interno: páginas de exemplo e campanhas da própria Upe.',plano:{criacao:null,mensal:null},paginasSuspensas:false,criadoEm:Date.now(),atualizadoEm:Date.now()},{merge:true});
 let html=fs.readFileSync(__R+'/site/apps/servicos/modelos/servico.html','utf8');
 html=html.replace('<body>','<body>\n<div style="background:#0b1d3a;color:#f2f0e2;text-align:center;padding:10px 16px;font:700 14px/1.4 system-ui,sans-serif">Página de exemplo (marca fictícia) criada com Upe Landing pages · <a href="https://upe-criativo-lp.web.app" style="color:#ff7a59">Quero uma assim</a></div>');
 const agora=Date.now();
 await db.doc('lp_paginas/exemplo').set({cid:'upe-criativo',titulo:'Exemplo: Studio Bem Estar',html,publicada:true,suspensa:false,seo:{titulo:'Exemplo de landing page · Upe Criativo',descricao:'Página de exemplo criada com Upe Landing pages: editor fácil, domínio próprio e painel de resultados.'},whatsapp:{ativo:true,numero:'5511934393249',mensagem:'Olá! Vi a página de exemplo e quero uma landing page.'},pixel:{},criadoEm:agora,atualizadoEm:agora,publicadoEm:agora});
 await db.doc('lp_paginas/exemplo/privado/rascunho').set({html,em:agora});
 await db.collection('lp_paginas/exemplo/versoes').add({html,em:agora,autor:'upecriativo@gmail.com',titulo:'Exemplo: Studio Bem Estar'});
 // página técnica que recebe a medição do site principal (aparece em Análise do cliente Upe Criativo)
 const site=await db.doc('lp_paginas/upe-site').get();
 if(!site.exists)await db.doc('lp_paginas/upe-site').set({cid:'upe-criativo',titulo:'Site Upe Criativo (home)',html:'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Medição do site</title></head><body><p>Página técnica: recebe a medição de upe-criativo.web.app. Não publique.</p></body></html>',publicada:false,suspensa:false,seo:{},whatsapp:{},pixel:{},criadoEm:agora,atualizadoEm:agora});
 const rec=await db.doc('srv_config/recursos').get();if(!rec.exists)await db.doc('srv_config/recursos').set({storage:false,functions:false,emails:false,gateway:false,suspensaoAutomatica:false});
 console.log('ok');process.exit(0)})();
