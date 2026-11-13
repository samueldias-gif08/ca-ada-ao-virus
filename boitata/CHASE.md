# Captura e perseguição

O objetivo das 30 fases é capturar o Vírus Fugitivo. Envelopes amarelos ocupam as posições e preservam os tipos dos antigos pacotes: comuns e especiais aumentam o corpo de Boitatá ou o cabelo de Iara; selos rosas recuperam vida e lilases dão pontos. Pontuação, crescimento, geração e coleta continuam nos módulos existentes.

## Vírus digitais

O Fugitivo tem corpo de processador, circuitos, olhos digitais e fragmentos quadrados animados. A cor principal permanece `#7ee848`, com detalhes `#b8ff67`. O Predador usa a mesma identidade com blindagem, mais circuitos e fragmentos; mantém `#7f243d` e `#ff426d`, aproximadamente 2,65 vezes o tamanho do alvo.

O Fugitivo anda a cada 2,4 passos do jogador e escolhe fugas locais por caminhos livres. Seus estados são PATRULHANDO, FUGINDO, ENCURRALADO e CAPTURADO. O teletransporte foi removido, incluindo módulo, cargas, estados, efeitos, som e contador. Nenhum movimento da IA salta células.

## Captura por corpo e cabelo

A captura considera a cabeça, cada segmento e cada ligação visível da trilha. A distância é medida por círculos e cápsulas em coordenadas do mundo, com espessuras próprias para corpo e cabelo. Curvas não criam retângulos de captura sobre espaços vazios. As posições interpoladas são compartilhadas com os modelos; uma varredura entre amostras detecta cruzamentos durante o movimento, com tolerância máxima de 0,01 unidade. O histórico é descartado ao receber dano ou reiniciar a fase.

A captura ocorre uma única vez, acrescenta 750 pontos e congela os inimigos. Após 0,9 segundo:

- Fases 1–5: vitória, salvamento e desbloqueio direto.
- Fases 6–30: pergunta de verdadeiro ou falso; a resposta correta conclui e desbloqueia.
- Resposta errada: mantém o setor e dobra a fila existente de vírus.
- Perda de vida ou derrota: não duplica os vírus.

Capturar o alvo na fase 30 neutraliza o núcleo e abre a pergunta final.

## Predador

| Fases | Tempo inicial |
|---|---|
| 1–5 | 45 segundos |
| 6–15 | 35 segundos |
| 16–25 | 25 segundos |
| 26–30 | 20 segundos |

O aviso aparece nos cinco segundos finais. O Predador entra em 1,1 segundo, recalcula A* e mantém as colisões, velocidade e dano anteriores. Seu raio físico continua 0,92. O ataque pode tirar uma vida e concede 1,5 segundo de invulnerabilidade ao guardião. O Predador desaparece por meio segundo e seu temporizador reinicia. Pausa, menus e perguntas congelam a IA.

## Renderização e validação

`virusVisuals.js` desenha os dois vírus nos adaptadores WebGL e Canvas. `renderer.js` compartilha o modelo de envelope entre os dois renderizadores. Malhas e materiais são reutilizados; pools de instâncias crescem quando necessário para não ocultar cabelos ou corpos longos. Câmera, zoom, controles, mapas e limites físicos foram preservados.

`tests/chase.js` e `tests/arena.js` verificam fuga contínua nas 30 fases, caminhos, prazos, ataques e progressão. `tests/redesign.js` coleta todos os itens gerados nas 30 fases com ambos os personagens e verifica crescimento, efeitos dos tipos, captura por cabeça, meio e ponta de trilhas longas, progressão, curvas vazias e cruzamentos entre frames. `tests/graphics.html` executa essas suítes e as verificações WebGL; `tests/viewport.html` verifica layout e proporções em diferentes resoluções. Os testes usam armazenamento isolado e Chrome com SwiftShader, sem representar um benchmark da GPU física.