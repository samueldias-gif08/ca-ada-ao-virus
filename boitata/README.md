> **Objetivo atual: capturar o Vírus Fugitivo.** Consulte [CHASE.md](CHASE.md) para teletransporte, Predador, temporizadores e progressão por captura. Pacotes continuam oferecendo crescimento e pontos; as descrições de metas por coleta abaixo registram a versão anterior.

> **Atualização gráfica WebGL:** consulte [GRAPHICS.md](GRAPHICS.md) para a floresta isométrica, perfis HD–4K, otimizações e testes. A arena principal agora usa Three.js local; as descrições de Canvas abaixo documentam a base e as prévias preservadas.

# BOITATÁ — A Serpente Digital

Abra **index.html** nesta pasta em um navegador moderno. Funciona diretamente como arquivo local, sem instalação, frameworks, fontes externas ou servidor. O index.html da pasta superior também abre esta versão.

## Controles e objetivos

- Movimento automático com direções fixas na grade do mundo: **E frente / sair da parede, W virar para trás, A esquerda, S direita**. Combine duas teclas para diagonais normalizadas. O movimento automático continua na última direção escolhida ao soltar. O guardião vira na direção escolhida e a trilha acompanha a curva. Inversões imediatas contra o próprio corpo são bloqueadas. Nas bordas, escolha uma direção livre. Espaço ou Escape pausa. Há quatro botões de toque.
- Corpo segue o percurso da cabeça em uma grade, com interpolação visual. Ao atingir limites verticais, a serpente segue para a direita.
- A câmera ortográfica isométrica permanece fixa e mostra toda a arena de 24 × 18 unidades, sem expansão ou rolagem. Veja [ARENAS.md](ARENAS.md).
- Pacotes azuis e dourados aumentam o corpo e contam para a meta. Rosa recupera vida; lilás oferece pontos extras.
- Vírus, obstáculos e o próprio corpo causam dano. Cada tentativa começa com três vidas. Dano concede 1,5 segundo de invulnerabilidade e reposiciona em área desobstruída.
- Fases 1–5 exibem resumos de 100–150 palavras, consultáveis na pausa, e são concluídas por coleta e sobrevivência.
- Fases 6–30 exigem uma resposta correta após a coleta. Erro troca a pergunta e dobra o total de vírus acumulativamente. Derrota mantém o total. Acerto concede 500 pontos, salva e libera a próxima fase.
- Em Configurações, controle música e efeitos separadamente ou apague o progresso mediante confirmação.

## Progressão e mapas

Exatamente 30 setores, 30 cores predominantes, 30 geometrias determinísticas e motivos específicos de cada tema. Os seis grupos são Iniciante, Fácil, Intermediário, Avançado, Difícil e Especialista. Velocidade, duração, número de ameaças e variedade de inimigos aumentam por grupo.

Os mapas são arenas finitas com bordas sólidas de vegetação, rochas e lagos. Corredores largos e conectados preservam rotas acessíveis. Perigos e ataques do chefe surgem somente dentro dos limites, com aviso de pelo menos 1,1 segundo.

Os cinco padrões de inimigos são comum, perseguidor, rápido, bloqueador e mutante. Spawn ocorre dentro da arena visível, distante da cabeça, sem sobreposição com corpo, itens, obstáculos ou outros inimigos. O corpo bloqueia a entrada de inimigos; ataques à cabeça causam dano. Total e fila usam BigInt. Até 18 inimigos ficam ativos simultaneamente. O contador mostra **total / ativos**; seu texto de ajuda informa ameaças que entraram, aguardam e encerraram seu ciclo. A meta é coletar e sobreviver, não esgotar todas as ondas. Os ciclos terminam após 100 passos ; nenhuma duplicação é truncada para caber na arena.

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
    movement.js    direção e fila de comandos com limites físicos
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
    renderer.js    projeção isométrica fixa e partículas
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

## Guardiões jogáveis (sistema 21)

O menu **Jogar** abre **ESCOLHA SEU GUARDIÃO**, com modelos 3D procedurais animados, descrições e prévias de crescimento. **Trocar personagem** preserva desbloqueios, fases concluídas, configurações e recordes. A escolha fica salva para as próximas fases e sessões.

- **Boitatá:** corpo segmentado de fogo digital, olhos luminosos e partículas incandescentes.
- **Iara:** tronco humano, cauda de peixe de tamanho fixo, cabelo tubular contínuo e partículas aquáticas. Só o cabelo cresce. A ondulação é vertical para respeitar a trilha física no plano do mapa.
- Ambos usam o mesmo histórico de células, interpolações, controles, colisões, velocidade, vidas, metas, perguntas e chefe. Pacotes comuns e especiais crescem um segmento; os bônus de vida e pontuação mantêm o comportamento anterior. Dano recompõe a trilha com cinco posições, como na versão anterior.

`characters.js` registra os guardiões e centraliza seleção, histórico interpolado e recordes. `boitata.js` e `iara.js` descrevem as malhas e animações. `characterSelection.js` apresenta a escolha. `mesh.js` projeta e ilumina vértices e faces tridimensionais no Canvas; `renderer.js` desenha a arena na mesma perspectiva. São modelos geométricos estilizados locais, sem arquivos GLTF, texturas externas ou dependência de WebGL. A janela visível limita a geração de faces para trilhas longas.

Para adicionar outro guardião, registre `{id, name, title, color, description, growth, model(mesh, path, time, direction)}` com `Boitata.Characters.register` e carregue o módulo antes de `main.js`. `path[0]` é o avatar; as demais posições representam seu crescimento visual e físico. A simulação principal permanece compartilhada.

O salvamento mantém a chave `boitata-save-v1` e acrescenta `character` e `characterBest`. Saves antigos recebem Boitatá como padrão, mantendo o progresso geral. O recorde individual é atualizado durante a coleta e ao concluir uma fase.

**Validação atual:** 221/221 verificações aprovadas, incluindo os 143 testes anteriores, percursos completos dos dois personagens nas 30 fases, crescimento, colisão, interpolação, migração, seleção persistida e dimensões fixas do corpo da Iara. Executadas também no Chrome headless; tela de seleção capturada sem erro JavaScript. A suíte continua isolada do progresso real em `tests/index.html`. A avaliação humana da qualidade visual, fluidez e áudio continua recomendada.
