# Cliente modelo

Copie esta pasta e renomeie com o nome da marca (minúsculas, com hífen: `minha-marca`). O formato é o mesmo do Storage (`clientes/<marca>/…`) e de cada envio do painel.

```
<marca>/
  dossie/                    dossiê completo (Apresentação e dossiê › Importar pasta ou .zip)
    index.html
    apresentacao/slides/     telas da apresentação (JPG) e o PDF
    conteudo/posts/          artes dos posts usadas no dossiê
    conteudo/motion/         motions e filme (MP4 + capa JPG)
    assets/                  logos, mockups, fotos, CSS e JS do dossiê
  criacao/                   pasta de criação (Conteúdo › Pasta de criação › pasta ou .zip)
    posts/  reels/  motion/  capas/
  paginas/<endereço>/        uma pasta por página ou sistema (Páginas e sistemas › Adicionar)
    index.html  css/  js/  img/  fonts/  dados/
  marca/
    manual/                  manual da marca em PDF
    manual-editavel/         AI, InDesign, PDF editável ou .zip
    certificado/             certificado de anterioridade (PDF da iT'sMine)
  graficos/                  papelaria para aprovação e recompra
  posts/                     arquivos avulsos de posts
```

Para subir uma pasta como .zip, compacte a pasta (ex.: `criacao/` ou `paginas/landing/`). Se o .zip tiver uma pasta só no topo, o painel tira o nome dela; os caminhos lá dentro ficam iguais.

Mantenha os nomes dos arquivos iguais no dossiê e na criação: os posts são ligados aos arquivos pelo caminho e pelo nome.
