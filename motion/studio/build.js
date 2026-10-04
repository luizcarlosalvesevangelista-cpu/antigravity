// Gera studio.html: embute as fontes Lato (npm @fontsource/lato) e os vetores do logotipo.
// Uso: npm pack @fontsource/lato && tar xzf fontsource-lato-*.tgz && node build.js
const fs = require('fs'), path = require('path');
const F = process.env.LATO_DIR || path.join(__dirname, 'package/files');
let h = fs.readFileSync(path.join(__dirname, 'studio.tpl.html'), 'utf8');
const g = JSON.parse(fs.readFileSync(path.join(__dirname, 'glyphs.json')));
for (const w of [400, 700, 900]) h = h.replace('__LATO' + w + '__', fs.readFileSync(path.join(F, `lato-latin-${w}-normal.woff2`)).toString('base64'));
// histórias do YouTube (yt_stories.json, gerado por yt_stories.py)
h = h.replace('__YT__', fs.readFileSync(path.join(__dirname, 'yt_stories.json'), 'utf8'));
h = h.replace('__GLYPHS__', JSON.stringify(g)).replaceAll('__U__', g.U).replaceAll('__N__', g.N);
fs.writeFileSync(path.join(__dirname, 'studio.html'), h);
