# Reprodutor da HISTÓRIA

## Arquivos de produção

- `js/story.js`: controlador, interface, busca, arrasto, atalhos, velocidades, repetição, visibilidade e Fullscreen API.
- `js/storySound.js`: preparação da trilha procedural existente em um buffer navegável, preservando notas, timbres, ambiente e efeitos nos seus tempos de origem.
- `css/story.css`: barra esmeralda, controles em Outfit, menu de velocidade, foco, tooltip, gradiente e adaptação ao celular. As partículas do título agora recebem o tempo absoluto da história.

O renderizador `storyRenderer2d.js`, os atlas, os personagens, os takes, o gameplay e o menu principal não foram alterados para implementar o reprodutor.

## Relógio e sincronização

A duração é a soma dos dez takes: **168 segundos / 02:48**. O loop `requestAnimationFrame` existente no jogo continua chamando `Story.frame(now)`; não foi criado outro loop de reprodução nem timers de animação.

API: `currentTime`, `duration`, `isPlaying`, `playbackRate`, `play()`, `pause()`, `seekTo(seconds)`, `setPlaybackRate(rate)` e `restart()`.

`seekTo()` limita o valor ao intervalo válido e chama imediatamente o renderizador existente com o tempo absoluto. Cenário, câmera, personagens, sprites, expressões, efeitos, transparências e texto são reconstruídos a partir desse instante, sem executar eventos ou frames anteriores.

Sem áudio habilitado, o relógio avança por delta de `requestAnimationFrame` multiplicado pela velocidade. Com áudio rodando, o controlador lê a posição do único buffer de áudio e usa essa mesma posição para desenhar, evitando acumular diferença entre os relógios. O multiplicador é aplicado uma única vez em cada caminho, nunca no renderer.

A música e os efeitos procedurais são preparados com `OfflineAudioContext`, em mono a 22.050 Hz, quando algum áudio está habilitado nas configurações existentes. O buffer completo ocupa aproximadamente 14 MiB. Uma única `AudioBufferSourceNode` recebe o offset da timeline e `playbackRate` de 1, 1.4 ou 2. Isso preserva inclusive o trecho remanescente de um efeito que começou antes da posição buscada. A velocidade altera também a altura dos sons, como na reprodução acelerada simples; não foi adicionado processamento de preservação de pitch.

Pausar remove a fonte sonora e mantém o offset. Retomar inicia a fonte no mesmo instante. Alterar velocidade captura primeiro a posição no relógio antigo e depois recria a fonte. Durante o arrasto, o áudio fica silencioso: os frames são atualizados a cada movimento e uma única fonte é retomada ao soltar, somente se a história estava reproduzindo. Não existe disparo acumulado de eventos antigos.

No fim, o player mantém a tela preta final, barra em 100%, duração total e opção de repetir. Buscar um instante anterior continua disponível. Voltar ao menu fecha o contexto de áudio, libera buffer, imagens e renderer e remove os listeners da sessão.

## Interação e acessibilidade

- Espaço ou K: reproduzir/pausar; J/L: −10/+10 segundos; setas esquerda/direita: −5/+5 segundos.
- Campos de texto e modificadores Ctrl/Alt/Meta são respeitados. Os atalhos válidos impedem a rolagem e não chegam aos controles do gameplay.
- Barra nativa `input[type=range]`, nome acessível, valor em segundos e tempo textual. Mouse e toque usam captura do ponteiro para continuar o arrasto fora da barra.
- Tooltip usa a mesma função de posição/tempo do seek, permitindo acrescentar miniaturas futuramente.
- Menu de velocidade com itens de rádio, indicação da seleção, navegação por setas e Escape; foco visível e botões identificados.
- Controles aparecem ao mover/tocar e se ocultam após 2,8 segundos de inatividade. Pausa, arrasto, hover, menu aberto e foco de teclado mantêm os controles visíveis.
- Fullscreen API quando suportada; redimensionamento preserva o viewport 16:9. Falhas de permissão são apresentadas sem interromper a sessão.

## Testes e inspeção

- `tests/story.js` e `tests/storyPlayer.js`, executados por `tests/story.html`: regressão da história e integração do controlador.
- Busca determinística entre os takes, barra e tempo real, limites, atalhos, pausa/retomada, velocidades 1/1.4/2, menu, tooltip, arrasto, ocultação e repetição.
- Áudio realmente renderizado: duração, amostras não silenciosas, offset, velocidade, silenciamento e ausência de fontes durante cem buscas de arrasto.
- Varredura dos 4.033 frames e comparação pixel a pixel dos doze desenhos do voo aprovado da Iara.
- Preservação do gameplay, saída ao menu, cancelamento do carregamento e liberação de recursos.
- `.browser-check/story-player-browser.ps1`: Chrome com DevTools Protocol e relógio real; cliques e arrastos reais de mouse/toque, reprodução e áudio em 1.4x e 2x, pausa, tela cheia, repetição e retorno ao menu.
- Capturas visuais em 1440 × 900 e 430 × 932 para conferir legibilidade, menu, botões e proporção. Resultados em `.browser-check/story-player-browser-results.json`.

As verificações de áudio medem a posição do buffer em relação à timeline no mesmo frame; não substituem escuta em alto-falantes. Compatibilidade e desempenho em aparelhos físicos, especialmente permissões de áudio e tela cheia em navegadores móveis, precisam ser conferidos nesses aparelhos. A emulação móvel não comprova FPS em um telefone real.

Resultado da suíte: **89 verificações aprovadas**, incluindo 4.033 frames, doze desenhos do voo comparados pixel a pixel e nenhum erro de JavaScript capturado. O roteiro adicional do navegador aprovou **13 verificações**, com cliques e arrastos reais por mouse/toque, áudio em 1.4x e 2x, pausa, repetição, responsividade e retorno ao menu. Entrada/saída nativas de tela cheia ficaram identificadas separadamente como verificações manuais. Na última medição, a diferença entre timeline e áudio no frame amostrado foi de aproximadamente 16 ms em 1.4x e 0 ms em 2x; não é uma garantia para todo hardware ou frame.

**Validação manual pendente:** entrada e saída nativas de tela cheia. Neste ambiente o Chrome headless respondeu `not granted` tanto ao clique real quanto à chamada com ativação simulada, apesar de expor a API. O player tratou a recusa e continuou funcionando. Isso não comprova entrada/saída em um navegador com janela normal. O Chromium também possui tratamento específico de permissões no modo headless ([código de referência](https://chromium.googlesource.com/chromium/src/+/75c2c60f23d5a1d9c57a9f39005266c8a8e628d3/components/permissions/permission_request_manager.cc)); não foi alterada a política do navegador para forçar um resultado positivo.

## Executar novamente no Windows

Na raiz: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .browser-check/story-player-browser.ps1`. A liberação de scripts é restrita ao processo de teste e não altera a política do sistema. O script usa um perfil dedicado do Chrome e encerra somente a instância de teste.
