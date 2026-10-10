/* Seções prontas para inserir nas landing pages. Usam variáveis CSS (--upe-cor etc.) para herdar o visual da página
   e os atributos data-upe-* do Kit Upe para puxar produtos, serviços e agenda do cliente. */
const E = `style="padding:64px 20px"`, IN = `style="max-width:1100px;margin:0 auto"`;
export const BLOCOS = [
  { id: "produtos", nome: "Produtos da loja (Upe ERP)", grupo: "Loja", html: `<section id="produtos" ${E}><div ${IN}>
  <h2>Nossos produtos</h2>
  <p>Escolha, adicione ao carrinho e finalize em poucos cliques.</p>
  <div data-upe-produtos data-limite="8"></div>
  <p style="margin-top:20px"><a data-upe-link="loja">Ver todos os produtos</a></p>
</div></section>` },
  { id: "produtos-modelo", nome: "Produtos com o visual da página (modelo próprio)", grupo: "Loja", html: `<section id="produtos" ${E}><div ${IN}>
  <h2>Mais vendidos</h2>
  <div data-upe-produtos data-limite="6" data-classe="upe-grade">
    <template>
      <article class="produto">
        <img data-campo="imagem" alt="" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px">
        <h3 data-campo="nome"></h3>
        <p><s data-campo="preco-de"></s> <strong data-campo="preco"></strong></p>
        <button type="button" data-upe-acao="carrinho">Adicionar ao carrinho</button>
      </article>
    </template>
  </div>
</div></section>` },
  { id: "destaques", nome: "Ofertas em destaque (produtos em promoção)", grupo: "Loja", html: `<section id="ofertas" ${E}><div ${IN}>
  <h2>Ofertas da semana</h2>
  <div data-upe-produtos data-destaque data-limite="4"></div>
</div></section>` },
  { id: "carrinho", nome: "Botão de carrinho flutuante", grupo: "Loja", html: `<div data-upe-carrinho data-flutuante></div>` },
  { id: "servicos", nome: "Serviços com botão Agendar (agenda online)", grupo: "Agenda", html: `<section id="servicos" ${E}><div ${IN}>
  <h2>Serviços</h2>
  <p>Escolha o serviço e agende o seu horário online.</p>
  <div data-upe-servicos></div>
</div></section>` },
  { id: "agenda", nome: "Agendamento embutido na página", grupo: "Agenda", html: `<section id="agendar" ${E}><div ${IN}>
  <h2>Agende o seu horário</h2>
  <div data-upe-agenda></div>
</div></section>` },
  { id: "whatsapp", nome: "Chamada para o WhatsApp", grupo: "Contato", html: `<section ${E}><div ${IN};text-align:center">
  <h2>Ficou com alguma dúvida?</h2>
  <p>Fale com a gente agora pelo WhatsApp.</p>
  <p><a data-upe-link="whatsapp" data-mensagem="Olá! Vim pelo site e quero saber mais." style="display:inline-block;padding:14px 24px;border-radius:12px;background:var(--upe-cor,#25d366);color:#fff;font-weight:700;text-decoration:none">Chamar no WhatsApp</a></p>
</div></section>` },
  { id: "formulario", nome: "Formulário de contato (vira lead no painel)", grupo: "Contato", html: `<section id="contato" ${E}><div ${IN}>
  <h2>Fale com a gente</h2>
  <form data-mensagem="Recebemos os seus dados. Em breve entraremos em contato." style="display:grid;gap:12px;max-width:520px">
    <label>Nome <input name="nome" required autocomplete="name"></label>
    <label>WhatsApp <input name="whatsapp" required inputmode="tel" autocomplete="tel"></label>
    <label>Mensagem <textarea name="mensagem" rows="3"></textarea></label>
    <button type="submit">Enviar</button>
  </form>
</div></section>` },
  { id: "depoimentos", nome: "Depoimentos", grupo: "Conteúdo", html: `<section id="depoimentos" ${E}><div ${IN}>
  <h2>Quem compra, recomenda</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px">
    <blockquote style="margin:0;padding:20px;border:1px solid rgba(0,0,0,.1);border-radius:16px">“Escreva aqui o depoimento de um cliente.”<br><b>Nome do cliente</b></blockquote>
    <blockquote style="margin:0;padding:20px;border:1px solid rgba(0,0,0,.1);border-radius:16px">“Outro depoimento curto e verdadeiro.”<br><b>Nome do cliente</b></blockquote>
    <blockquote style="margin:0;padding:20px;border:1px solid rgba(0,0,0,.1);border-radius:16px">“Mais um depoimento.”<br><b>Nome do cliente</b></blockquote>
  </div>
</div></section>` },
  { id: "faq", nome: "Perguntas frequentes", grupo: "Conteúdo", html: `<section id="duvidas" ${E}><div ${IN}>
  <h2>Perguntas frequentes</h2>
  <details><summary>Pergunta 1?</summary><p>Resposta curta e direta.</p></details>
  <details><summary>Pergunta 2?</summary><p>Resposta curta e direta.</p></details>
  <details><summary>Pergunta 3?</summary><p>Resposta curta e direta.</p></details>
</div></section>` },
  { id: "precos", nome: "Tabela de preços", grupo: "Conteúdo", html: `<section id="precos" ${E}><div ${IN}>
  <h2>Planos</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px">
    <div style="padding:24px;border:1px solid rgba(0,0,0,.1);border-radius:16px"><h3>Básico</h3><p style="font-size:32px;font-weight:900">R$ 0</p><ul><li>Item incluso</li><li>Item incluso</li></ul><a data-upe-link="whatsapp" data-mensagem="Quero o plano Básico">Quero este</a></div>
    <div style="padding:24px;border:2px solid var(--upe-cor,#1a73d9);border-radius:16px"><h3>Completo</h3><p style="font-size:32px;font-weight:900">R$ 0</p><ul><li>Item incluso</li><li>Item incluso</li></ul><a data-upe-link="whatsapp" data-mensagem="Quero o plano Completo">Quero este</a></div>
  </div>
</div></section>` },
];
/* insere antes do rodapé (ou do fim do conteúdo) */
export function inserirBloco(html, bloco) {
  const h = String(html || ""), b = "\n" + bloco.html + "\n";
  if (/<footer[\s>]/i.test(h)) return h.replace(/<footer[\s>]/i, m => b + m);
  if (/<\/main>/i.test(h)) return h.replace(/<\/main>/i, b + "</main>");
  if (/<\/body>/i.test(h)) return h.replace(/<\/body>(?![\s\S]*<\/body>)/i, b + "</body>");
  return h + b;
}
