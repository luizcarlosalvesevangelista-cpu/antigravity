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
  firebase: null,
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
