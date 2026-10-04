/* =====================================================================
   Portal Upe · configuração
   ---------------------------------------------------------------------
   Sem "firebase" preenchido, o portal roda em MODO DEMONSTRAÇÃO:
   os dados ficam só no navegador de quem está testando.
   Para usar de verdade, crie um projeto no Firebase (o mesmo do site
   pode servir), cole aqui o objeto de configuração do app da Web e
   siga o passo a passo do README.md desta pasta.
   ===================================================================== */
window.PORTAL_CONFIG = {
  firebase: {
    apiKey: "AIzaSyDJqqSMLWZLKSt9K1jPzvvQgyikZy4q9vw",
    authDomain: "upecriativo-cc472.firebaseapp.com",
    projectId: "upecriativo-cc472",
    // storageBucket: "upecriativo-cc472.firebasestorage.app",   // descomente depois de ativar o Storage (plano Blaze) para enviar arquivos pelo painel
    messagingSenderId: "574926941318",
    appId: "1:574926941318:web:effa37317480bde29fb507"
  },
  /* exemplo:
  firebase: {
    apiKey: "AIza...",
    authDomain: "upe-criativo.firebaseapp.com",
    projectId: "upe-criativo",
    storageBucket: "upe-criativo.appspot.com",
    appId: "1:000000000000:web:0000000000000000"
  },
  */
  // emulador: true,   // só para testes locais com "firebase emulators:start"
  whatsappUpe: "5511934393249",
  siteUrl: "../",
  assetsDemo: "../assets/"
};
