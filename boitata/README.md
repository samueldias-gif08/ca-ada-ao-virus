# BOITATÁ — A Serpente Digital

Abra **index.html** nesta pasta em um navegador moderno. Funciona diretamente como arquivo local, sem instalação, frameworks, fontes externas ou servidor. O index.html da pasta superior também abre esta versão.

## Controles e objetivos

- Boitatá avança automaticamente. Use **→ ↑ ↓**; esquerda e inversões verticais imediatas são bloqueadas. Espaço ou Escape pausa. Há botões de toque.
- Corpo segue o percurso da cabeça em uma grade, com interpolação visual. Ao atingir limites verticais, a serpente segue para a direita.
- A câmera mantém a cabeça a até dez células da borda esquerda e oferece aproximadamente 29 células de antecipação.
- Pacotes azuis e dourados aumentam o corpo e contam para a meta. Rosa recupera vida; lilás oferece pontos extras.
- Vírus, obstáculos e o próprio corpo causam dano. Cada tentativa começa com três vidas. Dano concede 1,5 segundo de invulnerabilidade e reposiciona em área desobstruída.
- Fases 1–5 exibem resumos de 100–150 palavras, consultáveis na pausa, e são concluídas por coleta e sobrevivência.
- Fases 6–30 exigem uma resposta correta após a coleta. Erro troca a pergunta e dobra o total de vírus acumulativamente. Derrota mantém o total. Acerto concede 500 pontos, salva e libera a próxima fase.
- Em Configurações, controle música e efeitos separadamente ou apague o progresso mediante confirmação.

## Progressão e mapas

Exatamente 30 setores, 30 cores predominantes, 30 geometrias determinísticas e motivos específicos de cada tema. Os seis grupos são Iniciante, Fácil, Intermediário, Avançado, Difícil e Especialista. Velocidade, duração, número de ameaças e variedade de inimigos aumentam por grupo.

Mapas se estendem à direita: perder um pacote não obriga a voltar à esquerda. Uma faixa conectada até a rota dos pacotes fica livre de obstáculos. Barreiras móveis, introduzidas na fase 16, e ataques do chefe preservam essa faixa. Avisos amarelos antecedem a ativação em vermelho em pelo menos 1,1 segundo. Trechos antigos são descartados para limitar memória.

Os cinco padrões de inimigos são comum, perseguidor, rápido, bloqueador e mutante. Spawn ocorre à frente da câmera, distante da cabeça, sem sobreposição com corpo, itens, obstáculos ou outros inimigos. O corpo bloqueia a entrada de inimigos; ataques à cabeça causam dano. Total e fila usam BigInt. Até 18 inimigos ficam ativos simultaneamente. O contador mostra **total / ativos**; seu texto de ajuda informa ameaças que entraram, aguardam e encerraram seu ciclo. A meta é coletar e sobreviver, não esgotar todas as ondas. Os ciclos terminam após 100 passos ou quando ficam atrás da câmera; nenhuma duplicação é truncada para caber na arena.

Na fase 30, **VÍRUS ZERO** aparece sobre o núcleo escuro, com efeitos de corrupção, circuitos vermelhos e detalhes neon. O chefe libera minions da fila de ameaças e usa barreiras temporárias. A coleta reduz sua integridade e dispara três etapas, com ataques mais frequentes e mais barreiras. Após zerar a integridade, aparece a pergunta final. Acertar exibe a mensagem final, animação, pontuação e opção de jogar novamente; errar reinicia o confronto com vírus dobrados.

## Arquivos e responsabilidades

```text
boitata/
  index.html
  css/
    style.css       interface e responsividade
    menu.css        menus, seleção e vitória
    game.css        arena e controles
  js/
    main.js        inicialização e eventos
    game.js        estados e ciclo da simulação
    player.js      crescimento, coleta, vidas e recuperação
    movement.js    direção, fila de comandos e câmera
    enemies.js     spawn, ondas e cinco comportamentos
    collisions.js  consultas de ocupação e colisão
    levels.js      trinta setores e seis dificuldades
    maps.js        geração, rotas seguras e obstáculos móveis
    questions.js   56 afirmações identificadas e explicadas
    education.js   alternância e correção de perguntas
    interface.js   telas, HUD, pausa e configurações
    audio.js       síntese de efeitos e trilha eletrônica
    save.js        validação, persistência e migração
    boss.js        três etapas e ataques do VÍRUS ZERO
    renderer.js    pixel art, câmera interpolada e partículas
  assets/
    sprites/       desenho original gerado por Canvas
    backgrounds/   cenários originais gerados por Canvas
    sounds/        áudio original sintetizado por Web Audio
  tests/
    index.html     executor visual dos testes
    suite.js       verificações determinísticas
```

Os assets são gerados durante a execução, sem arquivos de mídia externos. O áudio começa somente após interação do usuário, respeitando as regras de reprodução dos navegadores.

## Salvamento

LocalStorage `boitata-save-v1`, compatível com o progresso da versão anterior: última fase acessada, última desbloqueada, fases concluídas, recorde, erros acumulados, preferências de música/efeitos e melhor desempenho concluído por fase (pontos, tempo, vidas e erros). Não salva a posição no meio de uma tentativa. Ao empatar pontuação, o menor tempo define o melhor desempenho.

Armazenamento depende das permissões do navegador. Navegação privada e arquivos locais podem restringi-lo. Se a gravação falhar, o jogo continua na sessão e informa a limitação na vitória. Mudar de navegador ou origem não transfere os dados automaticamente.

## Verificação

Abra **tests/index.html** para executar 143 verificações isoladas, sem modificar o progresso real. A suíte cobre conteúdo e temas, bloqueio de fases, comandos, seguimento do corpo, coleta, colisão, invulnerabilidade, derrota, quatro duplicações sucessivas, alternância de perguntas, persistência, geometria única, percurso e coleta nos 30 mapas, câmera e chefe.

Os percursos determinísticos desativam os inimigos; encontros e colisões são testados separadamente. Isso verifica a existência de uma rota realizável, sem afirmar que todas as decisões do jogador evitam dano. Testes não substituem avaliação humana de dificuldade ou visual.

**Resultado executado:** 143/143 verificações aprovadas no executor JavaScript disponível, com LocalStorage em memória. Sintaxe dos 15 arquivos JavaScript validada. O navegador instalado não pôde executar no ambiente restrito (acesso negado), portanto renderização, áudio físico e interação visual permanecem para conferência no navegador do usuário.

Checklist visual: abrir a fase inicial e seu resumo; testar setas, pausa e toque; alternar áudio; confirmar salvamento ao recarregar; testar a confirmação de apagar progresso; observar avisos e obstáculos móveis; concluir o núcleo e conferir a celebração. Nenhum desbloqueio de teste foi adicionado à interface normal.
