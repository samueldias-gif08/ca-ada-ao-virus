# Fase 2 — Reino aquático

Apenas a fase de id 2 ativa `js/aquatic3d.js`. A floresta mantém os modelos, iluminação e enquadramento anteriores. Não há dependências externas novas.

A água ocupa um volume de 24 × 18 × 4,8 unidades com faces transparentes sem gravação de profundidade, névoa azul, superfície superior, raios e partículas limitadas pelo perfil gráfico. Algas e fundo usam geometria e materiais compartilhados e InstancedMesh. Peixes dourados são sólidos; os pequenos cardumes são decorativos. Peixes sólidos percorrem segmentos lentos e param perto de personagens, vírus e itens. A consulta Maps.blocked é compartilhada com movimentação e pathfinding.

Os controles e a velocidade existentes foram preservados. O código atual usa E/W/A/S; não foi remapeado para setas para evitar alterar a primeira fase. O fugitivo recebe até três fugas por teletransporte exclusivamente nesta fase, quando encurralado, com intervalo mínimo e destino validado pelo sistema existente.

Abra `tests/aquatic.html` para as verificações de volume, visibilidade, instâncias, colisões, personagens, vírus e enquadramento Full HD/4K. `tests/graphics.html` continua contendo a suíte geral. A fase 2 usa o mesmo zoom e enquadramento da fase 1. As verificações comparam as câmeras nas proporções Full HD/4K; desempenho real a 60 FPS exige medição em GPU compatível. A renderização Canvas de contingência permanece a existente, sem os efeitos volumétricos WebGL.
