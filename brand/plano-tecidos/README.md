# Plano Tecidos: rebranding

Projeto da Upe Criativo para a Plano Tecidos (@planotecidos). Todas as páginas abrem direto no navegador e usam as fontes locais da pasta `fonts/`.

| Entregável | Arquivo |
|---|---|
| Manual da marca | `index.html`, `Plano_Tecidos_Brand_Book.pdf`, `Plano_Tecidos_Brand_Book.png` |
| Dossiê (diagnóstico, estratégia, redesign, entregáveis) | `dossie/index.html` |
| Apresentação de redesign (17 slides, setas do teclado) | `apresentacao/index.html`, `apresentacao/Plano_Tecidos_Redesign.pdf` |
| Landing page institucional | `site/index.html` |
| Cronograma de conteúdo (12/10 a 22/11/2026) | `conteudo/index.html` |
| Artes do Instagram (JPG 1080×1350 e 1080×1920) | `conteudo/posts/` |
| Motions para reels (MP4 1080×1920, 30 fps, sem trilha) | `conteudo/motion/` |

## Como regerar artes e motions

O conteúdo do cronograma fica em `conteudo/calendario.js`. As artes são desenhadas em `conteudo/studio.html` (abra `studio.html?id=s1-03` ou `studio.html?motion=m1-logo&play` para ver uma peça) e exportadas com Playwright + ffmpeg:

```sh
cd conteudo
node render.js posts        # todas as artes
node render.js motion m2    # só os motions que contêm "m2" no nome
```

`assets/plano.js` tem o símbolo L-rolo e o logotipo em código, com a mesma geometria do manual.

## Antes de publicar

- As fotos de produto em `assets/fotos/` são recortes dos prints do Instagram da marca (baixa resolução). Troque por fotos novas seguindo o guia do cronograma.
- Os nomes dos tecidos foram inferidos pelas fotos. A Plano deve revisar.
- Pantone do manual são aproximações: conferir na escala antes de imprimir.
