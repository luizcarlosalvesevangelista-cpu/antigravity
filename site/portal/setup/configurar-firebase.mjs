// Configura o projeto Firebase do Portal Upe de uma vez:
//  1) cria (ou reaproveita) o usuário administrador no Authentication
//  2) libera esse usuário no painel (documento admins/{uid})
//  3) grava as configurações públicas (PIX, WhatsApp) se ainda não existirem
//  4) carrega o cronograma padrão da Upe (cronograma/upe-cronograma.json) se o cronograma estiver vazio
//
// Uso (na pasta site/portal/setup):
//   npm install
//   export GOOGLE_APPLICATION_CREDENTIALS=/caminho/da/chave-da-conta-de-servico.json
//   node configurar-firebase.mjs --projeto SEU-PROJETO --email voce@exemplo.com
// Sem --senha, o script cria uma senha aleatória e mostra um link para você definir a sua.
// O e-mail do administrador não é gravado em nenhum arquivo do site.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const arg = k => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : ""; };
const projectId = arg("projeto") || process.env.GCLOUD_PROJECT || "";
const email = arg("email"), senha = arg("senha");
if (!projectId || !email) { console.error("Informe --projeto <id do projeto Firebase> e --email <e-mail do administrador>."); process.exit(1); }

initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId } : { credential: applicationDefault(), projectId });
const auth = getAuth(), db = getFirestore();

// 1) usuário administrador
let user; try { user = await auth.getUserByEmail(email); console.log("✓ Usuário já existia:", user.uid); }
catch (e) { if (e.code !== "auth/user-not-found") throw e;
  user = await auth.createUser({ email, password: senha || randomBytes(18).toString("base64url"), emailVerified: true });
  console.log("✓ Usuário administrador criado:", user.uid); }
// 2) libera no painel
await db.doc(`admins/${user.uid}`).set({ ativo: true, criadoEm: Date.now() }, { merge: true });
console.log("✓ Liberado no painel (admins/" + user.uid + ")");
if (!senha) { try { console.log("→ Defina a sua senha por este link:\n  " + await auth.generatePasswordResetLink(email)); } catch (e) { console.log("→ Use “Esqueci a senha” no Firebase Console para definir a senha."); } }

// 3) configurações públicas
const cfg = db.doc("config/publico");
if (!(await cfg.get()).exists) { await cfg.set({ pixChave: "upecriativo@gmail.com", pixNome: "Upe Criativo", pixCidade: "Sao Paulo", linkCartao: "", whatsapp: "5511934393249" }); console.log("✓ Configurações de pagamento criadas (ajuste no painel → Configurações)"); }
else console.log("✓ Configurações de pagamento mantidas");

// 4) cronograma padrão
const crono = await db.collection("cronograma").limit(1).get();
if (crono.empty) {
  const arq = JSON.parse(readFileSync(fileURLToPath(new URL("../cronograma/upe-cronograma.json", import.meta.url)), "utf8"));
  let batch = db.batch(), n = 0;
  for (const it of arq.itens) { batch.set(db.doc(`cronograma/${it.id}`), it); if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); } }
  batch.set(db.doc("cronograma/_extras"), { id: "_extras", tipo: "extras", lista: arq.extras || [] });
  await batch.commit(); console.log(`✓ Cronograma da Upe carregado: ${arq.itens.length} itens`);
} else console.log("✓ Cronograma mantido (já tinha itens)");
console.log("\nPronto. Entre em /portal/#/admin com o e-mail do administrador.");
process.exit(0);
