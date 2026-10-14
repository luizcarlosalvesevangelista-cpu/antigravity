const __R=require('path').resolve(__dirname,'../..');
// Publica portal/storage.rules no bucket padrão (cria o ruleset e aponta a release firebase.storage/<bucket> para ele)
const {GoogleAuth}=require('google-auth-library');const fs=require('fs');const P='upecriativo-cc472',B=P+'.firebasestorage.app';
(async()=>{const c=await new GoogleAuth({keyFile:process.env.GOOGLE_APPLICATION_CREDENTIALS,scopes:['https://www.googleapis.com/auth/cloud-platform']}).getClient();
const rs=await c.request({url:`https://firebaserules.googleapis.com/v1/projects/${P}/rulesets`,method:'POST',data:{source:{files:[{name:'storage.rules',content:fs.readFileSync(__R+'/site/portal/storage.rules','utf8')}]}}}).catch(e=>e.response);
if(rs.status!==200){console.log('ERRO',rs.status,JSON.stringify(rs.data).slice(0,1500));process.exit(1)}
const name=`projects/${P}/releases/firebase.storage/${B}`;
let r=await c.request({url:'https://firebaserules.googleapis.com/v1/'+name,method:'PATCH',data:{release:{name,rulesetName:rs.data.name}}}).catch(e=>e.response);
if(r.status===404)r=await c.request({url:`https://firebaserules.googleapis.com/v1/projects/${P}/releases`,method:'POST',data:{name,rulesetName:rs.data.name}}).catch(e=>e.response);
console.log(r.status,r.data.rulesetName||JSON.stringify(r.data).slice(0,300))})();
