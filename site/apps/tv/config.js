// Configuração da versão hospedada do Upe Criativo TV (projeto único upecriativo-cc472, junto com o portal e o Upe ERP).
// 1. Crie um projeto em https://console.firebase.google.com (plano gratuito serve para começar).
// 2. Em Configurações do projeto > Seus apps > Web (</>), registre o app e copie o objeto firebaseConfig.
// 3. Cole os valores abaixo, no lugar de COLE_AQUI e dos campos vazios.
// Enquanto apiKey estiver como COLE_AQUI, o site funciona, mas salva tudo só no próprio aparelho.
window.UPE_CONFIG = {
  firebase: {
    apiKey: 'AIzaSyDJqqSMLWZLKSt9K1jPzvvQgyikZy4q9vw',
    authDomain: 'upecriativo-cc472.firebaseapp.com',
    projectId: 'upecriativo-cc472',
    storageBucket: 'upecriativo-cc472.firebasestorage.app',
    messagingSenderId: '574926941318',
    appId: '1:574926941318:web:effa37317480bde29fb507'
  },
  // Opcional: endereço público do site, usado dentro dos QR codes.
  // Deixe vazio para usar o endereço em que o site estiver aberto. Ex.: 'https://upe-criativo-tv.web.app/'
  baseUrl: 'https://upe-criativo-tv.web.app/'
};
