// Firestore falso para fotografar a loja de exemplo (dados fictícios)
const svg=(bg,fg,shape)=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/>${shape(fg)}</svg>`);
const caixa=f=>`<rect x="70" y="150" width="260" height="160" rx="18" fill="${f}"/><rect x="60" y="120" width="280" height="50" rx="14" fill="#fff" opacity=".85"/>${[0,1,2,3].map(i=>`<circle cx="${120+i*55}" cy="235" r="22" fill="#4a2a1a"/><circle cx="${114+i*55}" cy="228" r="5" fill="#f5d6a0"/>`).join('')}`;
const bolo=f=>`<rect x="90" y="190" width="220" height="120" rx="14" fill="${f}"/><rect x="90" y="190" width="220" height="34" rx="14" fill="#fff"/><path d="M110 224q20 26 40 0t40 0 40 0 40 0 40 0" fill="#fff"/><rect x="194" y="130" width="12" height="60" rx="4" fill="#ffd36b"/><ellipse cx="200" cy="120" rx="10" ry="16" fill="#ff8a3d"/><rect x="70" y="306" width="260" height="14" rx="7" fill="#00000022"/>`;
const cookie=f=>[[150,170],[250,190],[190,270]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="62" fill="${f}"/>${[[-20,-15],[18,-22],[0,12],[25,20],[-25,25]].map(([a,b])=>`<circle cx="${x+a}" cy="${y+b}" r="8" fill="#4a2a1a"/>`).join('')}`).join('');
const pote=f=>`<rect x="120" y="150" width="160" height="170" rx="26" fill="${f}"/><rect x="110" y="120" width="180" height="40" rx="12" fill="#c9302c"/><rect x="140" y="200" width="120" height="70" rx="10" fill="#fff" opacity=".9"/><rect x="155" y="222" width="90" height="10" rx="5" fill="#c9302c"/><rect x="165" y="240" width="70" height="8" rx="4" fill="#999"/>`;
const pao=f=>`<ellipse cx="200" cy="240" rx="150" ry="80" fill="${f}"/>${[0,1,2].map(i=>`<path d="M${120+i*70} 200q20 30 0 70" stroke="#f5deb0" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('')}`;
const torta=f=>`<path d="M80 260 L320 260 L300 310 L100 310Z" fill="#d9a066"/><ellipse cx="200" cy="255" rx="125" ry="40" fill="${f}"/>${[0,1,2,3,4].map(i=>`<circle cx="${130+i*35}" cy="${250+(i%2)*8}" r="13" fill="#e23b4a"/>`).join('')}`;
const P={
 'brigadeiros':{nome:'Caixa com 12 brigadeiros',preco:42,classe:'Doces',estoque:30,descricao:'Brigadeiro gourmet de chocolate belga.',imagem:svg('#f6e3d3','#8b4a2b',caixa)},
 'bolo-cenoura':{nome:'Bolo de cenoura com cobertura',preco:58,promo:49.9,classe:'Bolos',estoque:8,descricao:'Bolo caseiro com calda de chocolate.',imagem:svg('#fde7c8','#ff9a3c',bolo)},
 'cookies':{nome:'Cookies de chocolate (6 un.)',preco:24,classe:'Doces',estoque:40,descricao:'Massa amanteigada com gotas de chocolate.',imagem:svg('#efe6da','#c98a4b',cookie)},
 'geleia':{nome:'Geleia artesanal de morango',preco:22,classe:'Potes',estoque:15,descricao:'Feita com fruta fresca, sem conservantes.',imagem:svg('#fbe1e3','#f6b4bd',pote)},
 'pao-mel':{nome:'Pão de fermentação natural',preco:26,classe:'Pães',estoque:12,descricao:'Casca crocante e miolo macio.',imagem:svg('#efe9dc','#c48a4a',pao)},
 'torta':{nome:'Torta de frutas vermelhas',preco:89,classe:'Bolos',estoque:5,descricao:'Creme de baunilha e frutas frescas.',imagem:svg('#f3e4ee','#f0d9a8',torta)},
};
const CFG={nome:'Doce Encanto',ativa:true,tema:{base:'#4a1f35',destaque:'#c2185b',claro:'#f7a8c8'},banners:[{titulo:'Semana do brigadeiro',texto:'Caixas com 5% de desconto no PIX.',botao:'Ver doces',acao:'classe',alvo:'Doces'}],pag:{pix:{chave:'contato@exemplo.com',nome:'Doce Encanto',cidade:'Sao Paulo',desconto:5},cartao:{link:'https://exemplo.com'}},frete:12,freteGratisAcima:150,retirada:true,aviso:'Pedidos até 16h saem no mesmo dia.'};
const PED={nome:'Ana Souza',pedidoNumero:'#1042',status:'enviado',pagamento:'PIX',pagStatus:'pago',total:139.9,rastreio:'AB123456789BR',transportadora:'Correios',itens:[{nome:'Caixa com 12 brigadeiros',qtd:2,unit:42},{nome:'Bolo de cenoura com cobertura',qtd:1,unit:49.9}],endereco:'Rua das Flores',numero:'120',bairro:'Centro',cidade:'São Paulo',uf:'SP'};
export const fs={};
export const doc=(f,p)=>({p});export const collection=(f,p)=>({p});
const val=p=>{const s=p.split('/');if(s.length===2)return{nome:'Doce Encanto',ativa:true};if(p.endsWith('publico/config'))return CFG;if(s[2]==='pedidos')return s[3].includes('pix')?{...PED,status:'novo',pagStatus:'pendente',rastreio:'',pedidoNumero:'#1043',nome:'Carlos Lima'}:PED;return null};
export const getDoc=async r=>{const v=val(r.p);return{exists:()=>!!v,data:()=>v,id:r.p.split('/').pop()}};
export const getDocs=async r=>({docs:r.p.endsWith('produtos')?Object.entries(P).map(([id,d])=>({id,data:()=>d})):[]});
export const setDoc=async()=>{};export const onSnapshot=(r,ok)=>{getDoc(r).then(ok);return()=>{}};
