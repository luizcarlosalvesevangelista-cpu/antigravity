#!/usr/bin/env bash
# Copia para as funções os arquivos que a página montada no servidor usa (rodado antes de cada deploy das funções).
set -e
cd "$(dirname "$0")"
cp ../apps/lp/lp-render.js lp-render.mjs
cp ../apps/lp/index.html vendas-lp.html
