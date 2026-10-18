# Via Magistral · nova marca (versão 2)

Projeto da Upe Criativo. O símbolo oficial é o do **Logofolio v2**; cores, padrão de ramos, cartão de visita e Poppins seguem o **Manual da Marca** aprovado. O símbolo e os ícones da primeira proposta foram retirados.

| Entregável | Onde |
|---|---|
| Dossiê (5 abas; só a aba 05 vai para a cliente) | `dossie/index.html` |
| Apresentação (15 telas) e PDF | `dossie/apresentacao/slides/`, `dossie/apresentacao/Via_Magistral_Apresentacao.pdf` |
| Filme da marca, logo reveal e reels (MP4 com trilha, 30 fps, −14 LUFS) | `dossie/conteudo/motion/` e `criacao/` |
| Posts e carrosséis (JPG 1080×1350), 26/10 a 09/11/2026 | `dossie/conteudo/posts/` e `criacao/posts/` |
| Landing page (pronta para o Painel Upe Serviços) | `paginas/landing/` |
| Recortes do manual com o novo símbolo | `dossie/assets/manual/` |
| Briefing | `briefing.md` |

Vídeos e PDFs ficam só no HD e no Storage (não vão para o GitHub).

## Como regerar (`_trabalho/`, ignorada pelo painel)

```sh
cd _trabalho
node render.js            # motions com som (studio.html + audio.py); node render.js --quadros só as capas
python3 montar_pecas.py   # monta pecas.html (slides, posts e recortes do manual)
node render_pecas.js      # exporta posts, recortes, slides e o PDF
node capturas.js          # capturas da landing (servir paginas/landing em localhost:8765)
python3 montar_dossie.py  # dossie/index.html = Modelo_Dossie_Upe + dados.js
```

Requer Playwright (Chromium), ffmpeg e python3 com numpy e scipy. Os vetores do logotipo e a máscara do padrão estão em `_trabalho/vm-brand.js`.

## Pendências antes de publicar

1. Corrigir "FARMÁCIA" (acento) e os valores CMYK/RGB das cores no arquivo-mestre e no manual.
2. Confirmar os WhatsApp das unidades e o @ do Instagram.
3. Revisão de todos os textos pela farmacêutica responsável.
4. Trocar artes ilustrativas por fotos reais das unidades e da equipe.
