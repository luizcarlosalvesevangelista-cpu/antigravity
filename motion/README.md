# Motion Upe Criativo

Vídeos com a identidade da Upe Criativo, todos em 16:9 (1920×1080) e 9:16 (1080×1920), 30 fps, com trilha e efeitos sonoros.

| Peça | Arquivos | Duração |
|---|---|---|
| Filme institucional (Branding e Redesign + Upe ERP + Upe TV) | `videos/filme-h.mp4`, `videos/filme-v.mp4` | 1:42 |
| Lançamento Upe ERP | `videos/erp-h.mp4`, `videos/erp-v.mp4` | 0:38 |
| Lançamento Upe TV | `videos/tv-h.mp4`, `videos/tv-v.mp4` | 0:40 |
| Logo reveal | `videos/logo-h.mp4`, `videos/logo-v.mp4` | 0:10 |

`upe-criativo/` guarda a primeira versão do logo reveal (sem som, com player interativo).

## Como regerar (`studio/`)

- `studio.tpl.html`: motor de animação. Cada cena é declarada em `SCENES`, e as peças em `PIECES`. Ao abrir `studio.html?piece=film&fmt=v&play`, a peça roda no navegador.
- `build.js`: embute as fontes Lato e os vetores do logotipo (`glyphs.json`, extraídos do manual da marca).
- `render.js`: captura os quadros com Playwright e codifica com ffmpeg. Também exporta os cues de som.
- `audio.py`: sintetiza a trilha (120 BPM, as trocas de cena caem no tempo forte) e os efeitos sincronizados aos cues (numpy + scipy).
- `mux.sh`: junta vídeo e áudio, normaliza para −14 LUFS e gera os pôsteres.

As telas do ERP e do Upe TV usam os dados de exemplo fictícios dos guias.
