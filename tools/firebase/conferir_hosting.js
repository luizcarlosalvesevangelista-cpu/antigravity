// Confere, pela API do Hosting, se arquivos foram publicados na última versão de cada site.
const {GoogleAuth}=require('google-auth-library');const P='upecriativo-cc472';
const alvo={'upe-criativo-lp':['/kit/upe-kit.js','/kit/README.md','/lp-render.js','/robots.txt'],'upe-criativo-servicos':['/blocos.js','/v-agenda.js'],'upe-criativo':['/privacidade.html','/termos.html','/sitemap.xml','/robots.txt'],'upe-criativo-sistemas':['/agenda.html']};
(async()=>{const c=await new GoogleAuth({keyFile:process.env.GOOGLE_APPLICATION_CREDENTIALS,scopes:['https://www.googleapis.com/auth/cloud-platform']}).getClient();
for(const [site,arqs] of Object.entries(alvo)){const r=(await c.request({url:`https://firebasehosting.googleapis.com/v1beta1/sites/${site}/releases?pageSize=1`})).data.releases[0];
 let files=[],tok='';do{const f=(await c.request({url:`https://firebasehosting.googleapis.com/v1beta1/${r.version.name}/files?pageSize=1000${tok?'&pageToken='+tok:''}`})).data;files.push(...(f.files||[]).map(x=>x.path));tok=f.nextPageToken}while(tok);
 console.log(site,new Date(r.releaseTime).toLocaleString('pt-BR'),arqs.map(a=>(files.includes(a)?'✓ ':'✗ ')+a).join('  '));}})();
