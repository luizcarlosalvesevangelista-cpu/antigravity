# Upe ADM: a pasta central de clientes

Esta pasta é o modelo da pasta central da Upe no HD. O formato é o mesmo do site (painel central) e do Storage, então o que está no HD sobe para o painel sem mudar nada.

| Onde | Caminho |
|---|---|
| HD (pasta central) | `Upe/adm/clientes/<marca>/…` |
| GitHub (este repositório) | `upe/adm/` (só modelos, páginas e textos; sem arquivos pesados nem dados pessoais) |
| Storage (Firebase) | `clientes/<marca>/…` |
| Painel central | ficha do cliente; a pasta aparece com o nome da marca |

## Pastas de cada cliente

Copie `cliente-modelo/` e renomeie com o nome da marca em minúsculas e com hífen (ex.: `hash`, `cafe-aurora`). O painel cria o mesmo nome no Storage na primeira vez que algo do cliente sobe, e esse nome não muda depois (os links continuam valendo se a marca mudar).

| Pasta | O que vai nela | Onde sobe no painel | No Storage |
|---|---|---|---|
| `dossie/` | o dossiê inteiro: `index.html` e as pastas `apresentacao/`, `conteudo/`, `assets/`… | Apresentação e dossiê › Importar pasta (ou .zip) do dossiê | `clientes/<marca>/dossie/` (só a Upe abre, pelo link do dossiê) |
| `criacao/` | artes, reels, motions e capas dos posts | Conteúdo › Pasta de criação › Enviar pasta (ou .zip) | `clientes/<marca>/criacao/` |
| `paginas/<endereço>/` | landing page, site ou sistema: `index.html` + `css/`, `js/`, `img/`, `fonts/`, `dados/` | Páginas e sistemas › Adicionar página ou sistema (pasta ou .zip) | `clientes/<marca>/paginas/<endereço>/` |
| `marca/manual/` | manual da marca em PDF | Projeto e acessos › Manual da marca | `clientes/<marca>/marca/` |
| `marca/manual-editavel/` | manual editável (AI, InDesign, PDF editável ou .zip) | Projeto e acessos › Manual editável | `clientes/<marca>/marca/` |
| `marca/certificado/` | certificado de anterioridade (PDF da iT'sMine) | Projeto e acessos › Certificado de anterioridade | `clientes/<marca>/marca/` |
| `graficos/` | artes de papelaria para aprovar e recompra | Gráficos e recompra | `clientes/<marca>/graficos/` |
| `posts/` | arquivos avulsos de posts enviados um a um | Conteúdo › Editar post | `clientes/<marca>/posts/` |

## Como os vínculos funcionam

- **Caminhos relativos:** dentro de cada pasta, os arquivos se chamam pelo caminho relativo (`img/logo.svg`, `../assets/hash.css`). Como a pasta sobe inteira com os mesmos caminhos, nada precisa ser trocado.
- **Posts:** os posts do dossiê e da pasta de criação são ligados aos arquivos pelo caminho e, se não achar, pelo nome do arquivo. Mantenha os nomes iguais entre o dossiê e a criação (ex.: `s1-01-1.jpg`).
- **Páginas:** abrem em `lp.upecriativo.com.br/<endereço>/`, ou no domínio do cliente.
- **Dossiê:** abre por um link com chave (`lp.upecriativo.com.br/_d/<chave>/`), que só a Upe tem.

## O que não vai para o GitHub

Arquivos pesados (vídeos, PDFs, fotos originais), contratos, CPF, senhas e chaves. Esses ficam só no HD e no Storage. O GitHub guarda os modelos, as páginas (HTML, CSS, JS) e os textos.

`clientes/` tem as páginas em produção de cada cliente (veja `clientes/README.md`).
