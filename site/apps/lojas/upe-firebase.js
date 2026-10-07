/* Conexão com o Firebase do projeto único da Upe Criativo (upecriativo-cc472: portal, Upe ERP e Upe TV), usada pelos sites (gestao, vendas e, nas próximas etapas, painel e lojas).
   dbShim(prefixo) imita a API do banco dos artifacts (doc/collection com get, set, delete e onSnapshot),
   para o mesmo código rodar no artifact e aqui. A chave web abaixo é pública por natureza: quem protege os dados são as regras (firestore.rules). */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { initializeFirestore, doc, collection, setDoc, getDoc, getDocs, deleteDoc, updateDoc, onSnapshot, query, where, collectionGroup } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const CONFIG = {
  apiKey: "AIzaSyDJqqSMLWZLKSt9K1jPzvvQgyikZy4q9vw",
  authDomain: "upecriativo-cc472.firebaseapp.com",
  projectId: "upecriativo-cc472",
  storageBucket: "upecriativo-cc472.firebasestorage.app",
  messagingSenderId: "574926941318",
  appId: "1:574926941318:web:effa37317480bde29fb507",
};
/* endereços (.web.app) do projeto único. Quando lojaupe.com.br for registrado, trocar só aqui. */
export const SITES = { vendas: "https://upe-criativo-erp.web.app", gestao: "https://upe-criativo-gestao.web.app", painel: "https://upe-criativo-painel.web.app", lojas: "https://upe-criativo-lojas.web.app" };
export const ADMIN_EMAIL = "upecriativo@gmail.com";

export const app = initializeApp(CONFIG);
export const auth = getAuth(app);
export const fs = initializeFirestore(app, { ignoreUndefinedProperties: true });
export { onAuthStateChanged, signOut, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, collectionGroup };

export const entrarComGoogle = () => { const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); return signInWithPopup(auth, p); };

const snapDoc = s => ({ exists: s.exists(), id: s.id, data: () => s.data() });
export function dbShim(prefixo = "") {
  const p = s => (prefixo ? prefixo + "/" : "") + s;
  return {
    doc: caminho => {
      const r = doc(fs, p(caminho));
      return { set: d => setDoc(r, d), get: async () => snapDoc(await getDoc(r)), delete: () => deleteDoc(r), onSnapshot: (f, e) => onSnapshot(r, s => f(snapDoc(s)), e) };
    },
    collection: caminho => {
      const r = collection(fs, p(caminho)), emb = s => ({ docs: s.docs.map(snapDoc), size: s.size, empty: s.empty });
      return { get: async () => emb(await getDocs(r)), onSnapshot: (f, e) => onSnapshot(r, s => f(emb(s)), e) };
    },
  };
}
/* downloads: salva pelo navegador (no artifact quem faz é o claude.ai) */
export const downloadsShim = {
  save: async ({ filename, data }) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data])); a.download = filename; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return { status: "saved" };
  },
};
const MSG = {
  "auth/popup-closed-by-user": "A janela do Google foi fechada antes de terminar.",
  "auth/cancelled-popup-request": "Já existe uma janela de login aberta.",
  "auth/popup-blocked": "O navegador bloqueou a janela do Google. Libere pop-ups para este site.",
  "auth/unauthorized-domain": "Este endereço ainda não está autorizado no login do Firebase (Authentication › Configurações › Domínios autorizados).",
  "auth/operation-not-allowed": "Esse tipo de login não está ativado no Firebase (Authentication › Método de login).",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
  "auth/network-request-failed": "Sem conexão com a internet.",
  "auth/email-already-in-use": "Esse e-mail já tem conta. Use “Entrar” ou “Esqueci a senha”.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/missing-password": "Digite a senha.",
};
/* administrador: a conta da Upe ou quem é administrador do painel principal (admins/{uid}) */
export async function ehAdminUpe(u) {
  if (!u || !u.emailVerified) return false;
  if ((u.email || "").toLowerCase() === ADMIN_EMAIL) return true;
  try { return (await getDoc(doc(fs, "admins/" + u.uid))).exists(); } catch { return false; }
}
export const msgErro = e => MSG[e?.code] || "Não foi possível entrar agora. Tente de novo.";
