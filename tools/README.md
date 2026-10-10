# Ferramentas da Upe Criativo

Scripts que geram o conteúdo do cronograma, tiram as capturas de tela dos painéis e cuidam do projeto Firebase `upecriativo-cc472`.
Nenhuma chave fica no repositório: os scripts do Firebase leem a chave de serviço pela variável `GOOGLE_APPLICATION_CREDENTIALS`.

```bash
export GOOGLE_APPLICATION_CREDENTIALS=~/chaves/upecriativo-cc472.json   # fora do repositório
export UPE_TRABALHO=$PWD/tools/.trabalho                                 # pasta de trabalho (ignorada pelo git)
```

## conteudo/ · artes, reels e vídeos do cronograma

Usa os modelos editáveis do portal (`site/portal/modelos.js`), os mesmos da aba **Cronograma Upe › Modelos editáveis**. A trilha dos vídeos sai de `motion/studio/audio.py` (precisa de `ffmpeg`).

```bash
cd tools/conteudo && npm install
python3 spec_novos.py "$UPE_TRABALHO"            # monta as peças (textos, modelos e datas) em novos_spec.json
node render.js "$UPE_TRABALHO" novos_spec        # gera JPG, reels (9:16) e vídeos do YouTube (16:9) em site/portal/kits/<frente>/gerado
python3 merge_novos.py "$UPE_TRABALHO"           # junta no site/portal/cronograma/upe-cronograma.json
node amostras.js "$UPE_TRABALHO"                 # amostras rápidas dos modelos (tn-*.jpg)
```

| Arquivo | O que faz |
|---|---|
| `spec_apps.py` / `merge_apps.py` | Posts do Upe ERP e do Upe TV a partir dos kits (`ler_kits.js` extrai os textos dos kits para `parsed.json`) |
| `spec_loja.py` / `merge_loja.py` | Loja Upe (Instagram, vídeo e Shorts) |
| `spec_novos.py` / `merge_novos.py` | Upe Landing pages e Upe Sistemas |
| `render.js` | Desenha cada slide no navegador e grava os vídeos com ffmpeg (reels 3 s por cena, YouTube 5 s) |

Para uma nova frente: copie `spec_novos.py`, troque textos e imagens (`site/assets/img/ui/`), rode as três etapas.

## capturas/ · telas dos painéis e testes visuais

Abrem os apps em modo demonstração (sem banco) no Chromium e salvam as telas usadas nas páginas de vendas e nos posts.

```bash
cd tools/capturas && npm install
node servicos.js            # telas do Painel Upe Serviços → site/apps/lp/img, site/apps/sistemas/img e site/assets/img/ui
node loja.js                # vitrine, produto, PIX e pedido de uma loja de exemplo (Firestore simulado em loja-stub.mjs)
node rotas.js "$UPE_TRABALHO"   # percorre todas as seções do painel (cliente e Upe) e lista erros
node vendas.js "$UPE_TRABALHO"  # páginas de vendas no computador e no celular (confere rolagem lateral)
```

## firebase/ · projeto upecriativo-cc472

```bash
cd tools/firebase && npm install
node publicar_regras.js     # publica site/portal/firestore.rules
node cronograma_sync.js     # grava no painel os itens do YouTube, Loja Upe, Landing pages e Upe Sistemas do upe-cronograma.json
node servicos_setup.js      # catálogo de planos, cliente interno da Upe e a página /exemplo
node testar_regras.js       # testa as regras como visitante sem login (o que pode e o que não pode)
node testar_agenda.js       # reserva de verdade numa agenda de teste, tentativa de horário duplicado e limpeza
node dominios_login.js      # autoriza os endereços no login do Firebase
node infra.js               # mostra o que está ligado no projeto (Storage, Functions, backup…)
```

Ativação do plano Blaze e do domínio próprio: veja `docs/ATIVACAO-BLAZE.md` e `tools/blaze/`.
