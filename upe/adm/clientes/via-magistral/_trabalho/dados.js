const DADOS = {
  config: {
    mostrarGuia: false,
    agencia: 'Upe Criativo',
    documento: 'Documento interno'
  },

  projeto: {
    marca: 'Via Magistral',
    cliente: 'Via Magistral Farmácia de Manipulação · CNPJ 02.821.638/0001-72',
    data: '18/10/2026',
    fontes: 'Logofolio v2 (símbolo oficial), Manual da Marca (cores, padrão e Poppins), primeira proposta (HTML de identidade visual), cartão e rótulos das três unidades'
  },

  marca: {
    cores: [
      { nome: 'Royal Blue', hex: '#112250', papel: 'Primária' },
      { nome: 'Soft Gold', hex: '#C6A75E', papel: 'Primária' },
      { nome: 'Saphire', hex: '#3C5070', papel: 'Secundária' },
      { nome: 'Shellstone', hex: '#D9C8C2', papel: 'Secundária' },
      { nome: 'Swan Wing', hex: '#F5F0E9', papel: 'Destaque' }
    ],
    fonteTitulos: 'Poppins Bold / SemiBold (lettering do nome: Bildeberg adaptada)',
    fonteTextos: 'Poppins Regular e Medium',
    logoNovoImagem: 'assets/manual/logo-negativo.svg',
    logoNovoFundo: '#112250'
  },

  /* ---------------- ABA 01 · DIAGNÓSTICO ---------------- */
  diagnostico: {
    lede: 'Farmácia de manipulação com três unidades em Brasília, atendimento farmacêutico próximo e uma identidade que ainda não traduzia esse cuidado. A primeira proposta acertou o padrão, as cores e o cartão; o símbolo e os ícones não foram aprovados.',
    ficha: [
      ['Negócio', 'Manipulação de medicamentos, homeopatia, fitoterápicos, cosméticos e fórmulas personalizadas, a partir de receita'],
      ['Canais', 'Balcão nas três unidades · WhatsApp de cada unidade · e-mail · site viamagistral.com.br · Instagram @viamagistral (a confirmar)'],
      ['Unidades', 'Asa Sul (CLS 309, bl. C, loja 33) · St Sudoeste (CLSW 104, bl. B, loja 34/36) · Gama (St. Hoteleiro, lt 04, lj. 02, ao lado do HRG)'],
      ['Responsável técnica', 'M. Amélia A. C. Ferreira · CRF-DF 1.150'],
      ['Linhas declaradas', 'Homeopatia · Cosméticos · Fitoterápicos · Manipulação de fórmula'],
      ['Números (data)', '[posts · seguidores · seguindo, a coletar no perfil]'],
      ['Prova social', '[avaliações do Google das três unidades, a coletar]'],
      ['Região', 'Distrito Federal: Plano Piloto e Gama']
    ],
    atributos: ['Medicamentos manipulados', 'Dermocosméticos', 'Fitoterápicos', 'Homeopatia', 'Suplementos e vitaminas'],
    falas: [
      { fonte: 'Cartão de visita atual', texto: 'Homeopatia · Cosméticos · Fitoterápicos · Manipulação de Fórmula', leitura: 'Vira a lista de linhas do site e o rodapé de todas as peças.' },
      { fonte: 'Primeira proposta · citação', texto: 'Cuidar de pessoas é transformar conhecimento em bem-estar.', leitura: 'Mantida como manifesto interno; nas redes, a assinatura curta é "Sua fórmula, do seu jeito."' },
      { fonte: 'Primeira proposta · atributos', texto: 'Confiança, proximidade, precisão, personalização e excelência.', leitura: 'Os quatro primeiros guiam o tom de voz. "Excelência" fica implícita no acabamento.' }
    ],
    logo: {
      imagem: 'assets/atual/logo-v1-negativo.png',
      cards: [
        { tipo: 'ok', rotulo: 'Fica', texto: 'O lettering "Via Magistral" (Bildeberg adaptada), as cores Royal Blue e Soft Gold e o padrão de ramos.' },
        { tipo: 'risk', rotulo: 'Legibilidade', texto: 'O símbolo da primeira proposta, com folhagem e arabescos, perde leitura abaixo de 48 px: avatar, favicon e carimbo.' },
        { tipo: 'warn', rotulo: 'Reprodução', texto: 'O excesso de detalhe dificulta hot stamping, gravação no vidro e impressão em uma cor nos rótulos.' },
        { tipo: 'warn', rotulo: 'Sistema', texto: 'Nove ícones próprios competiam com o símbolo e com o padrão. Foram retirados a pedido da cliente.' }
      ]
    },
    prints: [],
    manter: ['Royal Blue e Soft Gold como dupla principal', 'Padrão de ramos (aprovado)', 'Modelo do cartão de visita com faixas de padrão (aprovado)', 'Poppins como fonte de apoio', 'Lettering do nome'],
    resolver: ['Um símbolo que funcione de 16 px a fachada', 'Um único sistema para as três unidades', 'Redes sociais sem promessa de cura nem preço, dentro das regras do setor', 'Um caminho simples para o cliente enviar a receita (WhatsApp e site)'],
    vozes: [
      { rotulo: 'Primeira proposta', titulo: 'Símbolo com folhagem', texto: 'Bonito em tamanho grande, mas com muitos detalhes para rótulo, avatar e carimbo.', imagem: 'assets/atual/logo-v1-quadrado.jpg' },
      { rotulo: 'Primeira proposta', titulo: 'Ícones próprios', texto: 'Gota, caduceu, DNA, cápsula, coração… criavam uma segunda linguagem ao lado do padrão.', imagem: 'assets/atual/icones-v1.jpg' },
      { rotulo: 'Primeira proposta', titulo: 'Cartão aprovado', texto: 'O modelo com faixas de padrão foi aprovado e seguiu na nova marca, só com o símbolo trocado.', imagem: 'assets/atual/cartao-v1-frente.jpg' }
    ],
    leitura: 'A cliente aprovou o território (cores, padrão, Poppins e o cartão) e recusou a forma do símbolo. A versão 2 mantém tudo o que foi aprovado e troca só o símbolo e os ícones por um almofariz de traço limpo, que carrega a "via" no próprio desenho.'
  },

  /* ---------------- ABA 02 · PESQUISA E ESTRATÉGIA ---------------- */
  estrategia: {
    lede: 'Públicos e posicionamento da primeira proposta, revistos para a nova marca. As referências do segmento (redes de manipulação com landing de envio de receita e feed educativo) orientaram o conteúdo.',
    publicos: [
      { titulo: 'A preventiva', texto: 'Vê a saúde como investimento contínuo. Busca vitaminas e suplementos na dose certa e uma farmácia em quem confia.', fala: 'Quero manipular a vitamina D que a minha médica passou.' },
      { titulo: 'A consciente e exigente', texto: 'Pesquisa, compara e quer entender a fórmula. Valoriza atendimento técnico e acabamento.', fala: 'O que exatamente vai nessa cápsula?' },
      { titulo: 'A recomendada', texto: 'Chega por indicação do médico, da dermatologista ou da família. Decide pela reputação e pela facilidade.', fala: 'Minha dermatologista indicou vocês.' },
      { titulo: 'O parceiro clínico', texto: 'Prescritores que precisam de uma farmácia que execute fórmulas com precisão e retorne rápido.', fala: '' }
    ],
    emComum: 'Todos chegam com uma receita e uma dúvida. A marca resolve as duas: recebe a receita sem atrito (WhatsApp e site) e responde com uma farmacêutica.',
    posicionamento: [
      ['Para', 'Quem precisa de uma fórmula feita para si, em Brasília'],
      ['A marca é', 'A farmácia de manipulação de atendimento próximo, com três unidades'],
      ['Porque', 'Cada receita é avaliada por farmacêutica e manipulada segundo as Boas Práticas da Anvisa'],
      ['Diferente de', 'Drogarias de prateleira e de redes que tratam a receita como pedido'],
      ['Assinatura', 'Sua fórmula, do seu jeito.']
    ],
    atributos: ['Confiança', 'Proximidade', 'Precisão', 'Personalização'],
    tom: [
      { principio: 'Próxima', e: 'Fala como a farmacêutica do balcão', naoE: 'Formal ou distante', exemplo: 'Mande a foto da sua receita que a gente avalia.' },
      { principio: 'Precisa', e: 'Explica o que é e como funciona', naoE: 'Promete cura ou resultado', exemplo: 'A dose pode ser ajustada à sua prescrição.' },
      { principio: 'Tranquila', e: 'Frases curtas e calmas', naoE: 'Promoção, urgência ou preço de medicamento', exemplo: 'O prazo de preparo vem junto com o orçamento.' }
    ],
    territorios: [
      { nome: 'Drogaria de preço', cores: ['#d83a3a', '#ffd400', '#ffffff'], texto: 'Cruz, vermelho e amarelo, ofertas. Fala de preço.', nosso: false },
      { nome: 'Manipulação verde-natural', cores: ['#2e7d4f', '#a7c957', '#f2f2f2'], texto: 'Folha e verde. Comum e pouco memorável.', nosso: false },
      { nome: 'Clínico frio', cores: ['#1f6fae', '#ffffff', '#d9e3ec'], texto: 'Azul-hospital e branco. Técnico, mas sem calor.', nosso: false },
      { nome: 'Via Magistral: botica premium', cores: ['#112250', '#C6A75E', '#F5F0E9'], texto: 'Azul profundo, dourado e linho. Tradição de botica com acabamento atual.', nosso: true }
    ],
    jornada: [
      { etapa: 'Descobrir', texto: 'Reels educativos ("Você sabia?") e indicação do prescritor.' },
      { etapa: 'Confiar', texto: 'Bastidores, Boas Práticas, farmacêutica responsável visível.' },
      { etapa: 'Enviar a receita', texto: 'WhatsApp da unidade, direto do post, do reel ou da landing.' },
      { etapa: 'Receber', texto: 'Orçamento com prazo, retirada na unidade ou entrega combinada.' }
    ],
    riscos: [
      { ponto: 'Cores do manual', risco: 'Os valores CMYK/RGB de Soft Gold, Saphire e Shellstone não batem com o HEX (Shellstone aparece como C0 M95 Y99 K15 / RGB 217,11,2, que é vermelho).', encaminhamento: 'Usar o HEX como referência e corrigir CMYK/RGB no manual. Confirmar com a cliente e a gráfica.' },
      { ponto: 'Acento em FARMÁCIA', risco: 'O logofolio v2 traz "FARMACIA" sem acento.', encaminhamento: 'Corrigido nos materiais. Corrigir no arquivo-mestre antes de gerar AI/EPS e a versão do INPI.' },
      { ponto: 'Textos do manual', risco: '"LOGOTIPO SEGUNDÁRIO" (correto: secundário); o secundário é descrito como "variação vertical", mas é o horizontal; "uso em em perfis".', encaminhamento: 'Revisar o manual junto com a troca do símbolo e dos ícones.' },
      { ponto: 'Ícones', risco: 'O manual ainda mostra os nove ícones reprovados.', encaminhamento: 'Retirar do manual. Se precisar de ícones, desenhar um conjunto de linha a partir do novo símbolo.' },
      { ponto: 'WhatsApp e Instagram', risco: 'Não confirmamos quais celulares das unidades são WhatsApp nem o @ oficial.', encaminhamento: 'Confirmar com a cliente antes de publicar a landing e o cronograma.' },
      { ponto: 'Publicidade farmacêutica', risco: 'Peças com promessa de resultado ou preço de medicamento ferem as regras da Anvisa e do CFF. A TV da primeira proposta tinha "Entrega grátis a partir de R$ 150".', encaminhamento: 'Revisão da farmacêutica responsável em todos os textos antes de publicar.' }
    ]
  },

  /* ---------------- ABA 03 · REDESIGN ---------------- */
  redesign: {
    titulo: 'A via de cada fórmula',
    lede: 'O almofariz desenhado com poucas linhas: o pilão em movimento, as faixas da dosagem, a curva que atravessa a tigela (a "via" de cada paciente) e a base firme. O resto do sistema aprovado continua igual.',
    antesImagem: 'assets/atual/logo-v1-negativo.png',
    tabela: [
      ['Símbolo', 'Almofariz com folhagem e arabescos', 'Almofariz de traço limpo, com a "via" desenhada na tigela'],
      ['Versões', 'Principal e secundária com detalhes finos', 'Vertical, horizontal e símbolo, sempre em uma cor'],
      ['Cor', 'Royal Blue e Soft Gold', 'Mantidas (paleta do manual)'],
      ['Tipografia', 'Lettering Bildeberg + Poppins', 'Mantidas; "FARMÁCIA" com acento'],
      ['Ativos', 'Padrão de ramos + 9 ícones', 'Padrão de ramos; ícones retirados']
    ],
    imagens: [
      { img: 'assets/manual/construcao.jpg', titulo: 'Construção do símbolo' },
      { img: 'assets/manual/versoes.jpg', titulo: 'Versões do logotipo' },
      { img: 'assets/manual/paleta.jpg', titulo: 'Paleta de cores' },
      { img: 'assets/manual/padrao.jpg', titulo: 'Padrão de ramos com o novo símbolo' },
      { img: 'assets/manual/aplicacoes.jpg', titulo: 'Cartão de visita e rótulo' }
    ],
    filme: {
      titulo: 'A fórmula da Helena',
      texto: 'Helena recebe uma receita feita para ela, manda uma foto pelo WhatsApp, a farmacêutica confere dose, forma e compatibilidade, a fórmula é manipulada e fica pronta com o nome dela no rótulo. Fecha com a assinatura e as três unidades.',
      video: 'conteudo/motion/filme-v.mp4', poster: 'conteudo/motion/filme-v.jpg',
      duracao: '38 s',
      storyboard: [
        { img: 'conteudo/motion/storyboard/filme-01.jpg', legenda: 'Cada pessoa é única' },
        { img: 'conteudo/motion/storyboard/filme-02.jpg', legenda: 'A receita da Helena' },
        { img: 'conteudo/motion/storyboard/filme-03.jpg', legenda: 'Foto pelo WhatsApp' },
        { img: 'conteudo/motion/storyboard/filme-04.jpg', legenda: 'Avaliação farmacêutica' },
        { img: 'conteudo/motion/storyboard/filme-05.jpg', legenda: 'Manipulada com precisão' },
        { img: 'conteudo/motion/storyboard/filme-06.jpg', legenda: 'O frasco da Helena' },
        { img: 'conteudo/motion/storyboard/filme-07.jpg', legenda: 'Assinatura' }
      ],
      cenas: [
        ['Abertura', '0–5 s', 'Padrão de ramos em movimento e "Cada pessoa é única."', 'Trilha entra; rise'],
        ['A receita', '5–10,5 s', 'A receita entra e as linhas se escrevem sozinhas', 'Whoosh, desenho, assinatura'],
        ['WhatsApp', '10,5–16 s', 'A foto chega à conversa da Via Magistral, com resposta', 'Pop, ding'],
        ['Avaliação', '16–21,5 s', 'Dose, forma e compatibilidade conferidas', 'Três checks'],
        ['Manipulação', '21,5–28 s', 'O almofariz se monta e o pilão mói', 'Taps nas faixas, thud do pilão'],
        ['Pronta', '28–32 s', 'Frasco âmbar com o nome da Helena', 'Success'],
        ['Assinatura', '32–38 s', 'Logo reveal, "Sua fórmula, do seu jeito." e as unidades', 'Acorde do logo, sparkle']
      ]
    },
    motions: [
      { video: 'conteudo/motion/logo-v.mp4', poster: 'conteudo/motion/logo-v.jpg', titulo: 'Logo reveal', duracao: '10 s · 9:16 (também em 16:9)' },
      { video: 'conteudo/motion/reel-01-como-funciona.mp4', poster: 'conteudo/motion/reel-01-como-funciona.jpg', titulo: 'Como funciona', duracao: '12 s' },
      { video: 'conteudo/motion/reel-02-voce-sabia.mp4', poster: 'conteudo/motion/reel-02-voce-sabia.jpg', titulo: 'Você sabia?', duracao: '11 s' },
      { video: 'conteudo/motion/reel-03-unidades.mp4', poster: 'conteudo/motion/reel-03-unidades.jpg', titulo: 'Três unidades', duracao: '10 s' }
    ]
  },

  /* ---------------- ABA 04 · ENTREGÁVEIS ---------------- */
  entregaveis: {
    cards: [
      { rotulo: 'Manual da marca', texto: 'Atualizar o manual atual: novo símbolo, retirada dos ícones, correção das cores e do acento. Recortes prontos em assets/manual/.', arquivo: 'marca/manual/ (a atualizar)' },
      { rotulo: 'Apresentação de redesign', texto: '15 telas 16:9, com o filme, os motions e o feed para ampliar.', arquivo: 'Aba 05' },
      { rotulo: 'Landing page', texto: 'Envio de receita pelo WhatsApp, orçamento (lead no painel), linhas, três unidades e dúvidas. Validada com tools/validar-html.js.', arquivo: 'paginas/landing/index.html' },
      { rotulo: 'Cronograma de conteúdo', texto: '26/10 a 08/11/2026: 13 publicações (9 artes, 2 carrosséis, 4 reels) e o filme da marca.', arquivo: 'criacao/ e aba 05' }
    ],
    landing: {
      dominio: 'viamagistral.com.br',
      desktop: 'assets/site/lp-desktop.jpg', tablet: 'assets/site/lp-tablet.jpg', celular: 'assets/site/lp-celular.jpg',
      telas: [
        { img: 'assets/site/lp-tela-01.jpg', legenda: 'Topo com envio de receita' },
        { img: 'assets/site/lp-tela-02.jpg', legenda: 'Por que manipular' },
        { img: 'assets/site/lp-tela-03.jpg', legenda: 'Como funciona' },
        { img: 'assets/site/lp-tela-04.jpg', legenda: 'Três unidades' }
      ],
      tabela: [
        ['Menu', 'Logo + 3 links + "Enviar receita"', 'Igual ao desktop', 'Logo + "Enviar receita"'],
        ['Topo', 'Texto e arte lado a lado', 'Texto e arte lado a lado', 'Arte abaixo do texto'],
        ['Unidades', 'Três colunas com WhatsApp de cada', 'Uma coluna', 'Uma coluna'],
        ['Orçamento', 'Formulário ao lado das orientações', 'Abaixo das orientações', 'Abaixo das orientações']
      ]
    },
    checklist: [
      'Corrigir "FARMÁCIA" e os valores CMYK/RGB no arquivo-mestre e no manual',
      'Confirmar os WhatsApp das três unidades e o @ do Instagram',
      'Revisão dos textos pela farmacêutica responsável (CRF-DF 1.150)',
      'Trocar as artes ilustrativas por fotos reais das unidades e da equipe',
      'Subir a landing no Painel Upe Serviços e ligar o WhatsApp em Ligações',
      'Gerar AI, EPS, SVG, PNG e PDF do logotipo e a versão para o INPI'
    ]
  },

  /* ---------------- ABA 05 · APRESENTAÇÃO ---------------- */
  apresentacao: {
    lede: 'A nova marca da Via Magistral: o que mudou desde a primeira proposta, o símbolo, as aplicações, o filme, os motions com som e o feed para ampliar.',
    pdf: 'apresentacao/Via_Magistral_Apresentacao.pdf',
    pdfTamanho: '__PDF_MB__',
    slides: [
      { nome: 'Capa', img: 'apresentacao/slides/slide-01.jpg' },
      { nome: 'De onde partimos', img: 'apresentacao/slides/slide-02.jpg' },
      { nome: 'O conceito', img: 'apresentacao/slides/slide-03.jpg' },
      { nome: 'O símbolo', img: 'apresentacao/slides/slide-04.jpg' },
      { nome: 'Versões do logotipo', img: 'apresentacao/slides/slide-05.jpg' },
      { nome: 'Cores e tipografia', img: 'apresentacao/slides/slide-06.jpg' },
      { nome: 'Padrão de ramos', img: 'apresentacao/slides/slide-07.jpg' },
      { nome: 'Cartão de visita', img: 'apresentacao/slides/slide-08.jpg' },
      { nome: 'Rótulos e embalagem', img: 'apresentacao/slides/slide-09.jpg' },
      { nome: 'Sacolas', img: 'apresentacao/slides/slide-10.jpg' },
      { nome: 'Instagram', tipo: 'instagram', img: 'apresentacao/slides/slide-11.jpg' },
      { nome: 'Filme da marca', tipo: 'filme', img: 'apresentacao/slides/slide-12.jpg' },
      { nome: 'Motions', tipo: 'motions', img: 'apresentacao/slides/slide-13.jpg' },
      { nome: 'Landing page', img: 'apresentacao/slides/slide-14.jpg' },
      { nome: 'Próximos passos', img: 'apresentacao/slides/slide-15.jpg' }
    ],
    semanas: ['Semana 1 · lançamento da marca', 'Semana 2 · educação e serviço'],
    instagram: [
      { img: 'conteudo/posts/s1-01.jpg', titulo: 'Nova identidade', data: '26/10', semana: 1, legenda: 'Uma nova via para o seu cuidado. A Via Magistral está de cara nova, com o mesmo atendimento de sempre nas três unidades.\n#ViaMagistral #FarmaciaDeManipulacao #Brasilia' },
      { img: 'conteudo/posts/s1-02.jpg', titulo: 'Reels · logo reveal', data: '27/10', semana: 1, legenda: 'Sua fórmula, do seu jeito. 🎧 Com som.' },
      { img: 'conteudo/posts/s1-03-1.jpg', titulo: 'Carrossel · da receita à fórmula', data: '28/10', semana: 1, legenda: 'Como funciona a manipulação, em quatro passos. Arraste para o lado e salve para quando precisar.' },
      { img: 'conteudo/posts/s1-04.jpg', titulo: 'O que é manipulação?', data: '29/10', semana: 1, legenda: 'É a farmácia que prepara o medicamento a partir da sua receita, na dose e na forma certas para você.' },
      { img: 'conteudo/posts/s1-05.jpg', titulo: 'Reels · três unidades', data: '30/10', semana: 1, legenda: 'Asa Sul, Setor Sudoeste e Gama. Envie sua receita pelo WhatsApp da unidade mais perto.' },
      { img: 'conteudo/posts/s1-06.jpg', titulo: 'Sua fórmula. Sua dose. Seu jeito.', data: '31/10', semana: 1, legenda: 'Manipulação sob medida, do jeito que o seu médico prescreveu.' },
      { img: 'conteudo/posts/s2-01.jpg', titulo: 'Mito ou verdade', data: '02/11', semana: 2, legenda: 'Verdade: farmácias de manipulação seguem as Boas Práticas de Manipulação da Anvisa (RDC 67/2007).' },
      { img: 'conteudo/posts/s2-02.jpg', titulo: 'Reels · como funciona', data: '03/11', semana: 2, legenda: 'Da foto da receita à fórmula pronta.' },
      { img: 'conteudo/posts/s2-03-1.jpg', titulo: 'Carrossel · cuidados com cápsulas', data: '04/11', semana: 2, legenda: 'Três cuidados para a sua fórmula durar até o fim do tratamento.' },
      { img: 'conteudo/posts/s2-04.jpg', titulo: 'Bastidores', data: '05/11', semana: 2, legenda: 'Preparado à mão. Conferido pela farmacêutica.' },
      { img: 'conteudo/posts/s2-05.jpg', titulo: 'Reels · você sabia?', data: '06/11', semana: 2, legenda: 'Três coisas que a manipulação faz por você. Consulte sempre um profissional de saúde.' },
      { img: 'conteudo/posts/s2-06.jpg', titulo: 'Envie sua receita', data: '07/11', semana: 2, legenda: 'Mande a foto da sua receita pelo WhatsApp e receba o orçamento.' },
      { img: 'conteudo/posts/s2-07.jpg', titulo: 'Cada pessoa é única', data: '08/11', semana: 2, legenda: 'Cada pessoa é única. Cada fórmula também.' }
    ]
  },

  /* ---------------- POSTAGENS PARA APROVAÇÃO ---------------- */
  postagens: [
    { data: '2026-10-26', hora: '12:00', tipo: 'imagem', titulo: 'Nova identidade', legenda: 'Uma nova via para o seu cuidado. A Via Magistral está de cara nova, com o mesmo atendimento de sempre nas três unidades.', midias: ['conteudo/posts/s1-01.jpg'], capa: '' },
    { data: '2026-10-27', hora: '18:00', tipo: 'reels', titulo: 'Logo reveal', legenda: 'Sua fórmula, do seu jeito.', midias: ['conteudo/motion/logo-v.mp4'], capa: 'conteudo/motion/logo-v.jpg' },
    { data: '2026-10-28', hora: '12:00', tipo: 'carrossel', titulo: 'Da receita à sua fórmula', legenda: 'Como funciona a manipulação, em quatro passos.', midias: ['conteudo/posts/s1-03-1.jpg', 'conteudo/posts/s1-03-2.jpg', 'conteudo/posts/s1-03-3.jpg', 'conteudo/posts/s1-03-4.jpg', 'conteudo/posts/s1-03-5.jpg'], capa: '' },
    { data: '2026-10-29', hora: '12:00', tipo: 'imagem', titulo: 'O que é manipulação?', legenda: 'É a farmácia que prepara o medicamento a partir da sua receita, na dose e na forma certas para você.', midias: ['conteudo/posts/s1-04.jpg'], capa: '' },
    { data: '2026-10-30', hora: '18:00', tipo: 'reels', titulo: 'Três unidades', legenda: 'Asa Sul, Setor Sudoeste e Gama.', midias: ['conteudo/motion/reel-03-unidades.mp4'], capa: 'conteudo/motion/reel-03-unidades.jpg' },
    { data: '2026-10-31', hora: '12:00', tipo: 'imagem', titulo: 'Sua fórmula. Sua dose. Seu jeito.', legenda: 'Manipulação sob medida, do jeito que o seu médico prescreveu.', midias: ['conteudo/posts/s1-06.jpg'], capa: '' },
    { data: '2026-11-02', hora: '12:00', tipo: 'imagem', titulo: 'Mito ou verdade', legenda: 'Verdade: seguimos as Boas Práticas de Manipulação da Anvisa (RDC 67/2007).', midias: ['conteudo/posts/s2-01.jpg'], capa: '' },
    { data: '2026-11-03', hora: '18:00', tipo: 'reels', titulo: 'Como funciona', legenda: 'Da foto da receita à fórmula pronta.', midias: ['conteudo/motion/reel-01-como-funciona.mp4'], capa: 'conteudo/motion/reel-01-como-funciona.jpg' },
    { data: '2026-11-04', hora: '12:00', tipo: 'carrossel', titulo: 'Cuidados com cápsulas', legenda: 'Três cuidados para a sua fórmula durar até o fim do tratamento.', midias: ['conteudo/posts/s2-03-1.jpg', 'conteudo/posts/s2-03-2.jpg', 'conteudo/posts/s2-03-3.jpg', 'conteudo/posts/s2-03-4.jpg'], capa: '' },
    { data: '2026-11-05', hora: '12:00', tipo: 'imagem', titulo: 'Bastidores', legenda: 'Preparado à mão. Conferido pela farmacêutica.', midias: ['conteudo/posts/s2-04.jpg'], capa: '' },
    { data: '2026-11-06', hora: '18:00', tipo: 'reels', titulo: 'Você sabia?', legenda: 'Três coisas que a manipulação faz por você.', midias: ['conteudo/motion/reel-02-voce-sabia.mp4'], capa: 'conteudo/motion/reel-02-voce-sabia.jpg' },
    { data: '2026-11-07', hora: '12:00', tipo: 'imagem', titulo: 'Envie sua receita', legenda: 'Mande a foto da sua receita pelo WhatsApp e receba o orçamento.', midias: ['conteudo/posts/s2-06.jpg'], capa: '' },
    { data: '2026-11-08', hora: '12:00', tipo: 'imagem', titulo: 'Cada pessoa é única', legenda: 'Cada pessoa é única. Cada fórmula também.', midias: ['conteudo/posts/s2-07.jpg'], capa: '' },
    { data: '2026-11-09', hora: '18:00', tipo: 'video', titulo: 'Filme da marca · A fórmula da Helena', legenda: 'Da receita à fórmula pronta.', midias: ['conteudo/motion/filme-v.mp4'], capa: 'conteudo/motion/filme-v.jpg' }
  ]
};
