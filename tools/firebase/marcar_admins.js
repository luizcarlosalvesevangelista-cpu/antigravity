// Marca no login (custom claim upe:true) as contas que já são administradoras (admins/{uid}).
// As regras do Storage usam essa marca para não depender de consultar o banco.
const admin = require('firebase-admin'); admin.initializeApp({ projectId: 'upecriativo-cc472' });
(async () => {
  const docs = (await admin.firestore().collection('admins').get()).docs;
  for (const d of docs) {
    const u = await admin.auth().getUser(d.id).catch(() => null); if (!u) continue;
    await admin.auth().setCustomUserClaims(u.uid, { ...(u.customClaims || {}), upe: true });
    console.log('marcado', u.uid.slice(0, 6) + '…', u.email.replace(/^(.).*@/, '$1***@'));
  }
  process.exit(0);
})();
