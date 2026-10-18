"""Gera dossie/index.html: Modelo_Dossie_Upe (v2, com postagens) + DADOS de _trabalho/dados.js."""
import os,re
D=os.path.dirname(os.path.abspath(__file__))
m=open(os.path.join(D,'Modelo_Dossie_Upe.html')).read()
dados=open(os.path.join(D,'dados.js')).read()
pdf=os.path.join(D,'..','dossie','apresentacao','Via_Magistral_Apresentacao.pdf')
dados=dados.replace('__PDF_MB__',f'{os.path.getsize(pdf)/1e6:.1f} MB'.replace('.',','))
a=m.index('const DADOS = {'); b=m.index('</script>',a)
out=m[:a]+dados.strip()+'\n'+m[b:]
out=out.replace('<title>Dossiê de marca · Modelo Upe</title>','<title>Dossiê Via Magistral · Upe Criativo</title>')
open(os.path.join(D,'..','dossie','index.html'),'w').write(out); print('ok',len(out))
