# Fundo tecnológico externo às arenas

## Origem e composição

As áreas claras eram preenchidas pelo fundo opaco da cena Three.js dentro do canvas. Os cenários possuem pisos finitos, mas o renderer preenche todo o viewport com uma cor de céu. Por isso, alterar somente o `body` não resolveria.

`js/arenaBackdrop.js` implementa uma composição reutilizável:

1. Limpa o framebuffer com a mesma cor que a cena original usava.
2. Desenha uma imagem tecnológica numa cena independente, somente fora da projeção do piso da arena. A máscara usa a câmera existente; não a move nem altera sua projeção.
3. Desenha a cena original por cima, com profundidade, luzes, materiais, transparências, névoa, objetos e posições originais.
4. Restaura `scene.background`, `renderer.autoClear`, cor e alfa de limpeza ao terminar, inclusive em caso de exceção.

A imagem nunca é desenhada sobre o mapa. Objetos que se elevam acima do piso, como árvores, casas, personagens e luzes, continuam sendo desenhados à frente normalmente. A fase aquática protege também seu volume transparente, para não mostrar circuitos através da água. Os espaços entre plataformas do Colapso da Rede conservam a região e o fundo originais.

O passe usa uma textura, um material, uma geometria plana e uma câmera própria. Não adiciona objetos à cena do jogo. Um contorno fino, sombra e halo discreto são calculados apenas no lado externo da máscara: não há paredes, barreiras ou colisões novas. O pulso de brilho é leve, acompanha o tempo da fase e fica estático com a preferência de movimento reduzido.

O recorte da imagem equivale a `background-size: cover`, preservando sua proporção. CSS cobre eventuais margens externas do canvas e o fallback Canvas 2D utiliza a mesma imagem e a projeção original. O menu e a História não ativam o passe.

## Arquivos

- `assets/backgrounds/circuit-board.png`: imagem local de placa-mãe, circuitos esmeralda e componentes prateados, criada com a ferramenta integrada `image_gen` conforme a skill `imagegen`.
- `assets/backgrounds/source.txt`: especificação e prompt completos da imagem.
- `js/arenaBackdrop.js`: carregamento compartilhado, composição WebGL, máscara, cover e fallback 2D.
- `js/forest3d.js`: inicialização e chamadas para o passe ao renderizar. A implementação da câmera e os mapas não foram alterados.
- `js/renderer.js`: chamada ao fundo exterior no fallback Canvas 2D.
- `css/game.css`: imagem atrás da área do jogo, apenas durante a missão.
- `index.html` e `boitata/index.html`: carregamento do novo módulo.

## Verificação

`tests/arenaBackdrop.html` e `tests/arenaBackdrop.js` comparam a composição ativada e desativada no mesmo instante dos setores 1, 2, 3, 4, 5, 8, 9 e 10, que são os mapas atualmente disponíveis. Os índices 6 e 7 continuam removidos da campanha, como antes.

- Comparação dos pixels da região interna protegida, com tolerância de um nível por canal para a rasterização.
- Confirmação de mudança nos pixels externos.
- Matrizes de câmera, projeção, dimensões lógicas, simulação, referências de névoa/fundo e objetos da cena preservados.
- Testes de proporção e enquadramento em 1366×768, 1920×1080, 2560×1440, 3840×2160, 900×1200 e 2400×900.
- Verificação dos espaços da restauração final, proteção do centro no Canvas 2D, pausa, continuação, menu e ausência de erros WebGL/JavaScript.
- Textura e geometria reutilizadas, sem upload ou criação de imagem a cada frame.

O marcador original do labirinto incrementa a rotação por chamada de desenho. Para comparar a mesma pose, o teste compensa esse incremento entre os frames de referência e revisado. A implementação do marcador não foi alterada.

`.browser-check/arena-backdrop-browser.ps1` executa também as suítes de perguntas, fase final e controles, e captura os oito mapas, uma referência sem o passe, ultrawide e celular. O relatório bruto fica em `.browser-check/arena-backdrop-results.json`.

As medições de tempo são de Chrome headless com SwiftShader e leitura do framebuffer, não um benchmark de GPU física. O passe acrescenta um desenho de tela com uma textura compartilhada; não há partículas extras nem animações físicas. O desempenho em GPU e celular reais deve ser conferido nesses aparelhos, sem inferir 60 FPS a partir da emulação.

## Resultado da execução

Em 12/11/2026, as quatro suítes concluíram com **194 verificações aprovadas e nenhuma falha**: 62 do fundo externo, 59 de perguntas educativas, 32 da fase final e 41 de controles. Nenhum erro JavaScript ou WebGL foi registrado nos testes.

As capturas dos oito mapas foram revisadas visualmente, incluindo floresta, água, vila, cidade, duelo, labirinto e arenas tecnológicas. Também foram revisadas as capturas ultrawide e de celular: o fundo preenche as margens disponíveis, mantém a proporção e permanece atrás dos cenários e da interface. As imagens estão em `.browser-check/arena-backdrop-*.png`.
