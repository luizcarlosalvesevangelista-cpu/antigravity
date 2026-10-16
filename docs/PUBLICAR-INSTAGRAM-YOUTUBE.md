# Publicar o cronograma da Upe no Instagram e no YouTube

O cronograma da Upe fica no painel central, em **Cronograma Upe**, e vai de 19/10/2026 a 16/01/2027. São 91 posts de Instagram e 23 vídeos de YouTube, cada um com data, hora, legenda, hashtags e arquivos.

## Caminho 1: ferramentas oficiais (recomendado para começar)

Não precisa de nenhuma conta extra nem de chave.

### Instagram: Meta Business Suite

1. O perfil @upecriativo precisa ser **conta profissional** e estar ligado a uma **Página do Facebook**:
   - no app do Instagram, abra Configurações › Tipo de conta e ferramentas › Mudar para conta profissional;
   - depois, em Central de contas, ligue a Página.
2. Abra **business.facebook.com** › Planejador (ou Conteúdo) › **Criar publicação** ou **Criar reel**.
3. Para cada post do cronograma:
   - no painel central, abra o post e clique em **Pacote do post**: baixa um .zip com as imagens ou o vídeo, a legenda e as hashtags;
   - no Business Suite, envie as imagens, cole a legenda, marque só o Instagram, escolha **Programar** e coloque a data e a hora do cronograma.
4. Stories também podem ser programados no Business Suite (Criar story › Programar).

Dá para programar até 75 dias à frente. Programe por semana: toda segunda, os posts da semana seguinte.

### YouTube: YouTube Studio

1. Abra **studio.youtube.com** › Criar › **Enviar vídeos**.
2. Envie o MP4 do cronograma e cole o título, a descrição e as tags do pacote do post.
3. Na etapa **Visibilidade**, escolha **Programar** e coloque a data e a hora do cronograma.
4. Shorts: vídeo vertical de até 3 minutos; o próprio YouTube marca como Short.

## Caminho 2: agendador conectado ao Claude

Com um agendador conectado, o Claude pode ler o cronograma e deixar os posts programados para você revisar. O catálogo tem o **Posty: Social Media Scheduler**:

- publica e programa no Instagram, no YouTube e em outras redes;
- o login é pelo navegador, sem chave.

É um plugin de terceiros (selo "community"). Antes de ligar, confira quem é o autor e o que ele acessa.

Depois de instalado:

1. Peça ao Claude: “programe a semana de 19/10 do cronograma da Upe”.
2. O Claude monta cada post com a legenda, as hashtags, a data e a hora e mostra a lista para você aprovar antes de programar.

## Caminho 3: publicação automática pelo servidor da Upe (mais trabalho)

O servidor da Upe (Cloud Functions) pode publicar sozinho na hora marcada, pelas APIs oficiais:

| Rede | O que precisa |
|---|---|
| Instagram | API do Instagram (Graph API) com um app da Meta, conta profissional ligada a uma Página e revisão do app pela Meta (leva dias) |
| YouTube | API de dados do YouTube com OAuth da conta do canal; os vídeos enviados por app novo ficam privados até o Google verificar o app |

Só vale a pena se o volume crescer (vários clientes). Para o cronograma da Upe, os caminhos 1 e 2 resolvem.
