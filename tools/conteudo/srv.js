const __R=require('path').resolve(__dirname,'../..'), __T=process.env.UPE_TRABALHO||__R+'/tools/.trabalho';
// rota local: /fonts → fontes Lato (npm @fontsource/lato), /gen → página do gerador (esta pasta), resto → site/
const path=require('path'),fs=require('fs');
module.exports=async(ctx,S)=>{await ctx.route(/^http:\/\/gen\.test\//,r=>{let u=decodeURIComponent(new URL(r.request().url()).pathname);let f;
 if(u.startsWith('/fonts/'))f=path.join(__dirname,'node_modules/@fontsource/lato/files',u.slice(7));else if(u.startsWith('/gen/'))f=path.join(__dirname,u.slice(5));else f=path.join(__R+'/site',u);
 if(!fs.existsSync(f))return r.fulfill({status:404,body:''});const ct={'.html':'text/html','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'}[path.extname(f)]||'application/octet-stream';r.fulfill({path:f,contentType:ct})});};
