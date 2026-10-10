const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
// Autoriza os novos endereços no login do Firebase (Authentication › Domínios autorizados)
const {GoogleAuth}=require('google-auth-library');const P='upecriativo-cc472';
(async()=>{const c=await new GoogleAuth({keyFile:process.env.GOOGLE_APPLICATION_CREDENTIALS,scopes:['https://www.googleapis.com/auth/cloud-platform']}).getClient();
const u=`https://identitytoolkit.googleapis.com/admin/v2/projects/${P}/config`;const cfg=(await c.request({url:u})).data;
const novos=process.argv.slice(2).length?process.argv.slice(2):['upe-criativo-servicos.web.app','upe-criativo-servicos.firebaseapp.com','upe-criativo-lp.web.app','upe-criativo-sistemas.web.app'];
const lista=[...new Set([...(cfg.authorizedDomains||[]),...novos])];
const r=await c.request({url:u+'?updateMask=authorizedDomains',method:'PATCH',data:{authorizedDomains:lista}}).catch(e=>e.response);console.log(r.status,(r.data.authorizedDomains||[]).join(', ')||JSON.stringify(r.data).slice(0,300))})();
