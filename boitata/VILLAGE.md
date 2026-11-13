# Fase 3 — Vila da Folha

`js/village3d.js` ativa a vila somente no setor 3. O módulo é carregado depois do ambiente aquático e antes da inicialização. As fases 1 e 2 mantêm suas próprias construções, colisões, iluminação e câmera.

A arena continua com 24 × 18 células: seis casas de dimensões diferentes ocupam footprints sólidos exatos; todo o restante do interior possui conexão com a praça central. As ruas largas permitem a navegação do predador de raio 0,92. Telhados e paredes tornam-se transparentes na frente do guardião. A loja de ramen usa uma pequena textura local gerada em canvas, sem downloads. O relevo dos Hokages, árvores, cercas e bandeiras ficam nas bordas físicas.

Naruto, Sasuke e Sakura usam partes tridimensionais instanciadas e materiais compartilhados. A animação e o deslocamento usam o relógio da simulação, param na pausa e respeitam as construções. Naruto alterna caminhada e corrida; Sasuke faz pequenas rondas e poses; Sakura caminha e faz pausas. Todos cedem passagem perto do corpo/cabelo e dos vírus; a colisão controlada usa a consulta compartilhada `Maps.blocked`.

As setas são aliases exclusivos da fase 3: direita = frente (E), esquerda = trás (W), cima = lado esquerdo (A), baixo = lado direito (S). O comportamento existente de frente/trás e o histórico do corpo/cabelo permanecem no módulo de movimento original. O fugitivo recebe até três teletransportes por tentativa, com intervalo e seleção de destino pelo sistema existente. Captura, vidas, progresso e tempo de chegada do predador permanecem compartilhados.

Abra `tests/village.html` para executar os testes isolados, com save próprio. Foram aprovadas 35/35 verificações no Chrome/WebGL por software: casas e conectividade, três NPCs e passagem, spawn e navegação dos vírus, consumo de carga de teletransporte, colisão de captura, ambos os guardiões, setas, câmera fixa, enquadramento e buffers de 1920 × 1080 e 3840 × 2160, além do retorno às fases 1 e 2. O desempenho a 60 FPS em 4K depende de medição em GPU real. A vila requer WebGL; o fallback Canvas existente continua disponível sem os novos modelos.
