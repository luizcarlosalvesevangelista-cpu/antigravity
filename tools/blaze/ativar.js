// Liga o que depende do plano Blaze no projeto upecriativo-cc472, só com Node (sem gcloud).
// Mesmo que ativar.sh: APIs → Storage → backup do banco → regras → segredos → e-mails → funções e rotas → domínios → recursos no painel.
// Pode rodar de novo: cada etapa confere o que já está feito.
//
//   export GOOGLE_APPLICATION_CREDENTIALS=~/chaves/upecriativo-cc472.json   (a conta precisa do papel Proprietário enquanto roda)
//   export SMTP_URI='smtps://upecriativo@gmail.com:SENHA-DE-APP@smtp.gmail.com:465'   (opcional: e-mails automáticos)
//   export MP_ACCESS_TOKEN='APP_USR-…'  WHATSAPP_WEBHOOK='https://…'                  (opcionais)
//   node tools/blaze/ativar.js [--so-checar]
const path = require('path'), fs = require('fs'), { execSync } = require('child_process');
const RAIZ = path.resolve(__dirname, '../..'), SITE = RAIZ + '/site', NM = RAIZ + '/tools/firebase/node_modules/';
const { GoogleAuth } = require(NM + 'google-auth-library');
const P = 'upecriativo-cc472', NUM = '574926941318', REG = 'southamerica-east1', CHECAR = process.argv.includes('--so-checar');
const ok = m => console.log('\x1b[32m✓\x1b[0m ' + m), info = m => console.log('\x1b[36m→\x1b[0m ' + m), aviso = m => console.log('\x1b[33m⚠\x1b[0m ' + m);
let C; const api = async (url, method = 'GET', data) => { const r = await C.request({ url, method, data }).catch(e => e.response || { status: 0, data: String(e) }); return r; };
const espera = ms => new Promise(r => setTimeout(r, ms));
async function operacao(r, base) { let op = r.data; for (let i = 0; op && op.name && !op.done && i < 60; i++) { await espera(3000); op = (await api(base + op.name)).data; } return op; }
const sh = (cmd, cwd = SITE) => execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
const FB = 'npx -y firebase-tools@13';

(async () => {
  C = await new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getClient();
  const sa = (await C.getCredentials()).client_email;
  info('Permissões da conta ' + sa);
  const perm = await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${P}:testIamPermissions`, 'POST', { permissions: ['serviceusage.services.enable', 'resourcemanager.projects.setIamPolicy', 'iam.serviceAccounts.actAs', 'datastore.databases.update', 'secretmanager.secrets.create', 'firebaseextensions.instances.create', 'cloudfunctions.functions.create'] });
  const tem = new Set(perm.data.permissions || []), falta = ['serviceusage.services.enable', 'resourcemanager.projects.setIamPolicy', 'iam.serviceAccounts.actAs', 'datastore.databases.update'].filter(p => !tem.has(p));
  if (falta.length) { aviso(`A conta não tem: ${falta.join(', ')}. No Google Cloud › IAM, dê o papel “Proprietário” a ${sa} enquanto o script roda (depois pode tirar).`); if (!CHECAR) process.exit(2); }
  else ok('Permissões suficientes');
  if (CHECAR) process.exit(0);

  info('1/9 APIs do Google Cloud');
  const APIS = ['cloudfunctions', 'cloudbuild', 'artifactregistry', 'run', 'eventarc', 'pubsub', 'cloudscheduler', 'secretmanager', 'firebaseextensions', 'firebasestorage', 'storage', 'sheets', 'firebasehosting', 'firebaseappcheck', 'cloudbilling', 'iam', 'cloudresourcemanager', 'firestore', 'compute'].map(a => a + '.googleapis.com');
  const en = await api(`https://serviceusage.googleapis.com/v1/projects/${P}/services:batchEnable`, 'POST', { serviceIds: APIS.slice(0, 20) });
  if (en.status >= 300) { aviso('Falha ao ligar APIs: ' + JSON.stringify(en.data).slice(0, 300)); process.exit(1); }
  await operacao(en, 'https://serviceusage.googleapis.com/v1/'); ok('APIs ligadas');
  const bill = await api(`https://cloudbilling.googleapis.com/v1/projects/${P}/billingInfo`);
  if (bill.data && bill.data.billingEnabled) ok('Faturamento (Blaze) ativo'); else aviso('Não consegui confirmar o faturamento: ' + JSON.stringify(bill.data).slice(0, 200));

  info('2/9 Storage (vídeos da TV, imagens das landing pages, fotos)');
  const BUCKET = P + '.firebasestorage.app';
  let b = await api(`https://storage.googleapis.com/storage/v1/b/${BUCKET}`);
  if (b.status !== 200) { const r = await api(`https://firebasestorage.googleapis.com/v1alpha/projects/${P}/defaultBucket`, 'POST', { location: REG }); if (r.status < 300) ok('Bucket criado em ' + REG); else aviso('Crie o Storage no console (Storage › Começar, região southamerica-east1): ' + JSON.stringify(r.data).slice(0, 200)); }
  else ok('Bucket ' + BUCKET + ' já existe');
  await api(`https://storage.googleapis.com/storage/v1/b/${BUCKET}?fields=cors`, 'PATCH', { cors: [{ origin: ['*'], method: ['GET', 'HEAD'], maxAgeSeconds: 3600 }] });

  info('3/9 Backup e proteção do banco');
  const db = await api(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)?updateMask=pointInTimeRecoveryEnablement,deleteProtectionState`, 'PATCH', { pointInTimeRecoveryEnablement: 'POINT_IN_TIME_RECOVERY_ENABLED', deleteProtectionState: 'DELETE_PROTECTION_ENABLED' });
  db.status < 300 ? ok('Recuperação de 7 dias (PITR) e proteção contra exclusão') : aviso('PITR/proteção: ' + JSON.stringify(db.data).slice(0, 200));
  const sch = await api(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/backupSchedules`);
  if ((sch.data.backupSchedules || []).length) ok('Backup semanal já agendado');
  else { const r = await api(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/backupSchedules`, 'POST', { retention: `${8 * 7 * 86400}s`, weeklyRecurrence: { day: 'SUNDAY' } }); r.status < 300 ? ok('Backup semanal (domingo, guarda 8 semanas)') : aviso('Backup: ' + JSON.stringify(r.data).slice(0, 200)); }
  const dia = await api(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/backupSchedules`);
  if (!(dia.data.backupSchedules || []).some(s => s.dailyRecurrence)) { const r = await api(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/backupSchedules`, 'POST', { retention: `${7 * 86400}s`, dailyRecurrence: {} }); r.status < 300 ? ok('Backup diário (guarda 7 dias)') : aviso('Backup diário: ' + JSON.stringify(r.data).slice(0, 200)); }

  info('4/9 Regras do Firestore e do Storage');
  sh('node publicar_regras.js', RAIZ + '/tools/firebase');
  try { sh(`${FB} deploy --only storage --project ${P} --non-interactive`); ok('Regras do Storage'); } catch (e) { aviso('Regras do Storage não publicadas'); }

  info('5/9 Segredos das funções');
  fs.writeFileSync(SITE + `/functions/.env.${P}`, `WHATSAPP_WEBHOOK=${process.env.WHATSAPP_WEBHOOK || ''}\n`);
  try { execSync(`${FB} functions:secrets:set MP_ACCESS_TOKEN --project ${P} --data-file=- --non-interactive --force`, { cwd: SITE, input: process.env.MP_ACCESS_TOKEN || 'desligado', stdio: ['pipe', 'inherit', 'inherit'] }); ok('Segredo MP_ACCESS_TOKEN (' + (process.env.MP_ACCESS_TOKEN ? 'configurado' : 'desligado') + ')'); } catch (e) { aviso('Segredo MP_ACCESS_TOKEN não gravado'); }

  info('6/9 E-mails automáticos (extensão Trigger Email)');
  const ext = await api(`https://firebaseextensions.googleapis.com/v1beta/projects/${P}/instances`);
  if ((ext.data.instances || []).some(i => /firestore-send-email/.test(JSON.stringify(i)))) ok('Extensão já instalada');
  else if (process.env.SMTP_URI) {
    const env = RAIZ + '/tools/.trabalho/email.env'; fs.mkdirSync(path.dirname(env), { recursive: true });
    fs.writeFileSync(env, [`LOCATION=${REG}`, 'DATABASE=(default)', `DATABASE_REGION=${REG}`, 'MAIL_COLLECTION=mail', `DEFAULT_FROM=${process.env.EMAIL_REMETENTE || 'Upe Criativo <upecriativo@gmail.com>'}`, 'DEFAULT_REPLY_TO=upecriativo@gmail.com', 'TTL_EXPIRE_TYPE=week', 'TTL_EXPIRE_VALUE=4', `SMTP_CONNECTION_URI=${process.env.SMTP_URI}`].join('\n'));
    try { sh(`${FB} ext:install firebase/firestore-send-email --project ${P} --params=${env} --non-interactive --force`); ok('Extensão instalada'); } catch (e) { aviso('Instale pelo console: Extensions › Trigger Email'); } finally { fs.rmSync(env, { force: true }); }
  } else aviso('SMTP_URI não definido: os e-mails ficam para depois (defina e rode de novo).');

  info('7/9 Funções e rotas do servidor');
  sh('python3 tools/blaze/firebase_blaze.py', RAIZ);
  sh('npm install --silent --no-audit --no-fund', SITE + '/functions');
  sh(`${FB} deploy --only functions,hosting:upe-criativo-lp --project ${P} --non-interactive --force`);
  ok('Funções publicadas e landing pages montadas no servidor');

  info('8/9 Permissão de domínios para as funções (conexão automática de domínios de clientes)');
  const pol = await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${P}:getIamPolicy`, 'POST', {});
  const sf = `serviceAccount:${NUM}-compute@developer.gserviceaccount.com`, papel = 'roles/firebasehosting.admin', bindings = pol.data.bindings || [];
  let bd = bindings.find(x => x.role === papel); if (!bd) bindings.push(bd = { role: papel, members: [] });
  if (!bd.members.includes(sf)) { bd.members.push(sf); const r = await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${P}:setIamPolicy`, 'POST', { policy: { ...pol.data, bindings } }); r.status < 300 ? ok('Domínios: ' + sf) : aviso('Permissão de domínios: ' + JSON.stringify(r.data).slice(0, 200)); }
  else ok('Funções já administram os domínios');

  info('9/9 Recursos no painel');
  sh(`node recursos.js storage=1 functions=1 emails=${process.env.SMTP_URI ? 1 : 0} gateway=${process.env.MP_ACCESS_TOKEN ? 1 : 0}`, RAIZ + '/tools/firebase');
  ok('Pronto. Falta só (uma vez, no console): App Check com reCAPTCHA (docs/ATIVACAO-BLAZE.md, passo 6).');
})().catch(e => { console.error(e); process.exit(1); });
