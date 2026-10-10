#!/usr/bin/env bash
# Liga tudo o que depende do plano Blaze no projeto upecriativo-cc472. Rode UMA vez depois de ativar o faturamento.
# Pode rodar de novo sem problema (cada etapa confere se já foi feita).
#
#   export GOOGLE_APPLICATION_CREDENTIALS=~/chaves/upecriativo-cc472.json   # chave de serviço (fora do repositório)
#   export SMTP_URI='smtps://upecriativo@gmail.com:SENHA-DE-APP@smtp.gmail.com:465'   # e-mails (Gmail com senha de app, Brevo, Resend…)
#   export EMAIL_REMETENTE='Upe Criativo <upecriativo@gmail.com>'
#   export MP_ACCESS_TOKEN='APP_USR-…'      # opcional: PIX automático das cobranças (conta Mercado Pago da Upe)
#   export WHATSAPP_WEBHOOK='https://…'     # opcional: URL que envia WhatsApp (Z-API, Evolution API…), recebe {phone, message}
#   bash tools/blaze/ativar.sh
#
# Etapas: APIs → Storage → backup do banco → segredos → extensão de e-mail → regras → funções e rotas → recursos no painel.
set -euo pipefail
P=upecriativo-cc472; REG=southamerica-east1
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"; SITE="$RAIZ/site"
FB="npx -y firebase-tools@13"; mkdir -p "$RAIZ/tools/.trabalho"
ok() { printf '\033[32m✓\033[0m %s\n' "$*"; }; info() { printf '\033[36m→\033[0m %s\n' "$*"; }; aviso() { printf '\033[33m⚠\033[0m %s\n' "$*"; }
[ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ] || { echo "Defina GOOGLE_APPLICATION_CREDENTIALS com o caminho da chave de serviço."; exit 1; }
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS" --quiet >/dev/null 2>&1 || true
gcloud config set project "$P" --quiet >/dev/null 2>&1

info "1/8 Faturamento (plano Blaze)"
if gcloud billing projects describe "$P" --format='value(billingEnabled)' 2>/dev/null | grep -qi true; then ok "Blaze ativo"; else
  aviso "Não consegui confirmar o faturamento (ou ele ainda não está ativo). Ative em https://console.firebase.google.com/project/$P/usage/details e rode de novo."; read -r -p "Continuar mesmo assim? [s/N] " r; [ "${r,,}" = s ] || exit 1; fi

info "2/8 APIs do Google Cloud"
gcloud services enable cloudfunctions.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com run.googleapis.com eventarc.googleapis.com \
  pubsub.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com firebaseextensions.googleapis.com firebasestorage.googleapis.com \
  storage.googleapis.com sheets.googleapis.com firebasehosting.googleapis.com firebaseappcheck.googleapis.com cloudbilling.googleapis.com --quiet
ok "APIs ligadas"

info "3/8 Storage (arquivos: vídeos da TV, imagens das landing pages, fotos)"
BUCKET="$P.firebasestorage.app"
if gcloud storage buckets describe "gs://$BUCKET" >/dev/null 2>&1; then ok "Bucket $BUCKET já existe"; else
  TOKEN=$(gcloud auth print-access-token)
  curl -sf -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    "https://firebasestorage.googleapis.com/v1alpha/projects/$P/defaultBucket" -d "{\"location\":\"$REG\"}" >/dev/null \
    && ok "Bucket criado em $REG" || aviso "Crie o Storage no console (Storage › Começar, região southamerica-east1) e rode de novo."
fi
gcloud storage buckets update "gs://$BUCKET" --cors-file=<(echo '[{"origin":["*"],"method":["GET","HEAD"],"maxAgeSeconds":3600}]') --quiet >/dev/null 2>&1 || true

info "4/8 Backup e proteção do banco de dados"
gcloud firestore databases update --database='(default)' --enable-pitr --delete-protection --quiet >/dev/null && ok "Recuperação de 7 dias (PITR) e proteção contra exclusão ligadas" || aviso "Não consegui ligar PITR/proteção (confira permissão Datastore Owner)."
if gcloud firestore backups schedules list --database='(default)' --format='value(name)' 2>/dev/null | grep -q .; then ok "Backup semanal já agendado"; else
  gcloud firestore backups schedules create --database='(default)' --recurrence=weekly --day-of-week=SUN --retention=8w --quiet >/dev/null && ok "Backup semanal (domingo, guarda 8 semanas)"; fi

info "5/8 Segredos das funções"
segredo() { local nome=$1 valor=${2:-desligado}; printf '%s' "$valor" | $FB functions:secrets:set "$nome" --project "$P" --data-file=- --non-interactive >/dev/null 2>&1 && ok "Segredo $nome ($( [ "$valor" = desligado ] && echo desligado || echo configurado ))"; }
segredo MP_ACCESS_TOKEN "${MP_ACCESS_TOKEN:-desligado}"
printf 'WHATSAPP_WEBHOOK=%s\n' "${WHATSAPP_WEBHOOK:-}" > "$SITE/functions/.env.$P"

info "6/8 E-mails automáticos (extensão Trigger Email)"
if $FB ext:list --project "$P" 2>/dev/null | grep -q firestore-send-email; then ok "Extensão já instalada"; elif [ -n "${SMTP_URI:-}" ]; then
  cat > "$RAIZ/tools/.trabalho/email.env" <<EOT
LOCATION=$REG
DATABASE=(default)
DATABASE_REGION=$REG
MAIL_COLLECTION=mail
DEFAULT_FROM=${EMAIL_REMETENTE:-Upe Criativo <upecriativo@gmail.com>}
DEFAULT_REPLY_TO=upecriativo@gmail.com
TTL_EXPIRE_TYPE=week
TTL_EXPIRE_VALUE=4
SMTP_CONNECTION_URI=$SMTP_URI
EOT
  (cd "$SITE" && $FB ext:install firebase/firestore-send-email --project "$P" --params="$RAIZ/tools/.trabalho/email.env" --non-interactive --force) && ok "Extensão instalada" || aviso "Instale pelo console: Extensions › Trigger Email."
  rm -f "$RAIZ/tools/.trabalho/email.env"
else aviso "SMTP_URI não definido: os e-mails ficam para depois (defina e rode de novo)."; fi

info "7/8 Regras, funções e rotas"
(cd "$RAIZ/tools/firebase" && npm install --silent --no-audit --no-fund && node publicar_regras.js >/dev/null) && ok "Regras do Firestore"
(cd "$SITE" && $FB deploy --only storage --project "$P" --non-interactive >/dev/null) && ok "Regras do Storage" || aviso "Regras do Storage não publicadas (o bucket existe?)."
python3 "$RAIZ/tools/blaze/firebase_blaze.py"
(cd "$SITE/functions" && npm install --silent --no-audit --no-fund)
(cd "$SITE" && $FB deploy --only functions,hosting:upe-criativo-lp --project "$P" --non-interactive) && ok "Funções publicadas e landing pages montadas no servidor"
# a conta de serviço das funções precisa administrar domínios do Hosting (domínio automático)
SA_FN=$(gcloud iam service-accounts list --format='value(email)' --filter='email~compute@developer.gserviceaccount.com' | head -1)
[ -n "$SA_FN" ] && gcloud projects add-iam-policy-binding "$P" --member="serviceAccount:$SA_FN" --role=roles/firebasehosting.admin --quiet >/dev/null && ok "Permissão de domínios para $SA_FN"

info "8/8 Recursos no painel"
(cd "$RAIZ/tools/firebase" && node recursos.js storage=1 functions=1 emails=$([ -n "${SMTP_URI:-}" ] && echo 1 || echo 0) gateway=$([ -n "${MP_ACCESS_TOKEN:-}" ] && echo 1 || echo 0)) && ok "Painel atualizado"
echo
ok "Pronto. Confira em Gestão Upe › PIX e contato › Recursos do plano Blaze."
echo "   Falta (no console, uma vez): App Check com reCAPTCHA (docs/ATIVACAO-BLAZE.md, passo 6) e, quando houver, o domínio próprio (tools/trocar-dominio.py)."
