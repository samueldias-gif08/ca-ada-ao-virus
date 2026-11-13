# Arenas finitas

As 30 fases usam terreno de 24 × 18 unidades, incluindo uma faixa de borda sólida. As células jogáveis vão de (1,1) a (22,16). A geração acontece uma vez por tentativa; `Maps.extend()` é idempotente. Sementes mantêm as distribuições distintas e reproduzíveis. A busca de conectividade fecha bolsões isolados e posiciona os pacotes na região acessível.

A câmera Three.js conserva o volume ortográfico original: esquerda/direita ±28 e topo/base ±15,75, zoom 1. Seu alvo é (12,0,9), com deslocamento (40,40,40): azimute 45° e elevação 35,264°. Posição e projeção independem do jogador, da fase e da resolução. O terreno foi reduzido para esse volume; a câmera não foi afastada. Os três trechos finitos são construídos antes do primeiro desenho.

O buffer mantém proporção 16:9 e cabe na largura e altura disponíveis, com margens em outras proporções. Perfis HD, Full HD, QHD e 4K controlam resolução, sombras e detalhe, preservando o mesmo mundo. Durante a partida a interface ocupa a altura útil da janela sem rolagem da página.

`Maps.blocked()` trata posições externas como sólidas. Movimento, ondas de inimigos, perigos, retorno após dano, A* e teletransporte compartilham esses limites. O predador usa colisão circular com raio 0,92. As faixas largas e cruzadas preservam espaço para crescimento e perseguição. A dificuldade original de velocidade, ondas, vidas, perguntas e limite de três teletransportes permanece; a distribuição espacial foi adaptada à arena finita.

Abra `tests/index.html` para os testes da simulação e `tests/graphics.html` para a suíte completa com WebGL. `tests/arena.js` verifica a projeção real e o enquadramento HD–4K quando executado com a interface WebGL carregada. A inspeção de projeção inclui terreno, espessura da base, copas e margens de vegetação. `tests/viewport.html` redimensiona uma janela incorporada e verifica a ausência de rolagem e cortes em seis formatos, de HD a 4K, incluindo telas verticais e largas.

Validação no Chrome com Three.js e SwiftShader: 937/937 verificações funcionais e WebGL e 24/24 verificações de layout aprovadas. A renderização também foi inspecionada por captura de tela; testes com SwiftShader não representam desempenho de uma GPU física.
