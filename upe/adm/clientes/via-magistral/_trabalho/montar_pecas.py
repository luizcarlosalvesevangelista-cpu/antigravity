"""Monta pecas.html a partir de pecas.tpl.html + vm.css + vm.js + parts.html (componentes da apresentação v2)."""
import re
D='.'
js=open('vm.js').read().split('\n')
js[4]='  /* VM vem de vm-brand.js */'
js[61-1]='  // frasco e pote'; js[62-1]='  function vmFrasco(){'; js[92-1]='  }'
js[95-1]='  function vmBagDraw(){'; js[108-1]='  }'
js='\n'.join(js)
css=open('vm.css').read().replace('url(__PATTERN__)','none')
parts=dict(re.findall(r'<!--@(\w+)-->\n(.*?)(?=<!--@|\Z)',open('parts.html').read(),re.S))
rot=re.findall(r'<div class="vm-rotulo">.*?</p></div></div>',parts['rotulos'],re.S)
assert len(rot)==3,len(rot)
kraft='''<div style="position:relative;height:100%;background:linear-gradient(180deg,#efece3,#e6e0cf);display:grid;place-items:end center;padding-bottom:50px">
 <div style="position:relative;width:300px;height:380px;border-radius:4px 4px 12px 12px;background:linear-gradient(100deg,#a67c48,#c39a63 22%,#c9a06a 50%,#b98c54 78%,#9d7444);box-shadow:0 26px 40px rgba(50,32,8,.3);overflow:hidden;display:grid;place-items:center">
  <div style="position:absolute;top:0;left:0;right:0;height:22px;background:rgba(0,0,0,.15)"></div>
  <div class="vm-pat" style="position:absolute;left:0;right:0;bottom:0;height:70px;background:#112250;opacity:.5;--pat-size:200px"></div>
  <div style="width:62%;color:#F7F3EA;margin-top:-30px" data-logo="v" data-color="#F7F3EA"></div></div>
 <span style="position:absolute;top:calc(50% - 250px);left:calc(50% - 90px);width:34px;height:70px;border:8px solid #8a6435;border-bottom:0;border-radius:30px 30px 0 0"></span>
 <span style="position:absolute;top:calc(50% - 250px);left:calc(50% + 56px);width:34px;height:70px;border:8px solid #8a6435;border-bottom:0;border-radius:30px 30px 0 0"></span></div>'''
P={'cardfront':parts['cardfront'],'cardback':parts['cardback'],'rotulo':rot[0],'rotulo2':rot[2],'kraft':kraft}
ph=''.join(f'<template id="part-{k}">{v}</template>' for k,v in P.items())
t=open('pecas.tpl.html').read().replace('/*VM_CSS*/',css).replace('/*VM_JS*/',js).replace('<!--VM_PARTS-->',ph)
open('pecas.html','w').write(t); print('ok',len(t))
