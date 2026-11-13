# Floresta isométrica WebGL

Abra `index.html` e escolha **Jogar**. Os botões **Gráficos** e **Tela cheia** ficam abaixo da arena. A campanha, os dois guardiões, os controles, as perguntas e o salvamento continuam compartilhando os módulos existentes.

## Renderização

Three.js 0.160.1 está incluído em `vendor/`, com licença MIT. A versão fixa em formato clássico permite abrir o jogo por `file://`, sem servidor, instalação ou rede. A arena usa WebGL; as prévias da seleção mantêm seu renderizador Canvas. Se WebGL estiver indisponível, a arena usa o renderizador anterior.

`js/forest3d.js` adapta as chamadas dos modelos existentes para instâncias tridimensionais. A câmera é ortográfica, com azimute de 45° e elevação de 35,264°. A câmera permanece fixa e mostra toda a arena finita de 24 × 18 unidades. Consulte ARENAS.md. Controles por `KeyboardEvent.code`: S frente (−X), A trás (+X), W esquerda (−Z), Z direita (+Z). Teclado e toque usam o mesmo mapeamento. A projeção permanece 16:9; telas estreitas recebem espaço lateral/vertical para preservar a área visível.

Terreno com textura pixelada procedural, manchas de tonalidade, flores, folhas e gramíneas; árvores compostas com três perfis de copa, galhos, troncos texturizados e raízes (altura reduzida em 42% e largura em 28% para melhorar a visibilidade); arbustos, rochas com musgo, troncos caídos e lagos com margens em degraus, pedras, taboas, plantas aquáticas e reflexos animados. Sol direcional e iluminação hemisférica produzem a atmosfera diurna. As copas usam vento e transparência localizada onde podem encobrir o guardião. Partículas e folhas animadas têm quantidade limitada.

Capivaras, sapos, tatus, pássaros, borboletas e lagartos são decorativos: não causam dano. Possuem movimentos cíclicos; animais terrestres recuam para as margens quando o guardião se aproxima. Os perigos móveis continuam sendo os avisos e barreiras do jogo original.

## Qualidade e resolução

| Perfil | Limite de renderização | Mapa de sombras | Densidade |
|---|---|---|---|
| Baixo | 1280 × 720 | Sem sombras projetadas | 1 |
| Médio | 1920 × 1080 | 1024², PCF suave | 2 |
| Alto | 2560 × 1440 | 2048², PCF suave | 3 |
| Ultra | 3840 × 2160 | 4096², PCF suave | 4 |

São limites, não resoluções forçadas. O buffer considera a largura real da arena e o `devicePixelRatio`; em telas menores renderiza menos pixels. A interface permanece em HTML/CSS nítido. Use Ultra e tela cheia em um monitor 4K para aproveitar 3840 × 2160. O perfil fica em `boitata-graphics-v1`, separado do progresso.

Geometrias e materiais são reutilizados. Vegetação e terreno usam `InstancedMesh` em trechos de oito colunas, com frustum culling. Os três trechos finitos são preparados integralmente antes do primeiro desenho e permanecem durante a fase. Personagens e entidades usam pools de instâncias dinâmicas. O contador de FPS usa tempo real do navegador, sem depender do limite temporal da simulação. A meta é 60 FPS; o resultado depende da GPU, do perfil e da resolução. A execução automatizada com SwiftShader valida WebGL, mas não serve como benchmark de GPU física.

## Geração e colisão

`maps.js` mantém sementes reproduzíveis, os itens e o corredor de coleta. As células e os itens já visitados são conservados durante a tentativa para permitir o retorno; os buffers WebGL distantes continuam sendo descartados e reconstruídos. O posicionamento agora combina densidade por região, variação por célula e manchas elípticas irregulares de água. Os caminhos reservados, as clareiras iniciais e as conexões verticais continuam livres, inclusive para os perigos móveis.

`Maps.kind()` determina a representação de cada célula sólida. Troncos e raízes de árvores, arbustos grandes, rochas, troncos caídos e água ocupam células físicas do mapa; copas não ampliam a colisão. Arbustos decorativos são rasteiros, sem tronco e sem colisão. Ambos os guardiões continuam usando exatamente a mesma regra de ocupação da grade. A atualização não introduz física contínua ou rampas jogáveis; as variações de altura são visuais.

`Maps.validate()` continua verificando a rota progressiva com direita, cima e baixo e impede inversão vertical imediata. Essa rota é um subconjunto dos quatro comandos agora disponíveis. A suíte de percurso anterior complementa essa busca ao simular o controlador e o crescimento real dos dois guardiões nas 30 fases. Isso verifica rotas possíveis; não garante ausência de dano em qualquer decisão do jogador.

## Verificação

- `tests/index.html`: suíte funcional, de quatro direções e procedural, com armazenamento isolado. Inclui os percursos dos dois guardiões nas 30 fases, crescimento, coleta, danos, perguntas, duplicação, chefe, sementes, corredores e busca dirigida.
- `tests/graphics.html`: verificação WebGL, buffers HD/Full HD/QHD/4K, câmera, instâncias, água, transparência e renderização dos dois modelos. A página deixa uma prévia da fase 1 aberta e lista os resultados abaixo. Acrescente `?character=iara` para visualizar Iara.

A suíte foi ampliada com testes de comandos, filas, bordas, retorno, bloqueio em perguntas e colisões nos quatro sentidos. **Resultado após a correção dos controles: 422/422 verificações aprovadas no Chrome/WebGL**, incluindo eventos reais de teclado e os percursos dos dois guardiões nas 30 fases. Capturas com Boitatá e Iara foram inspecionadas no Chrome headless. Nenhum erro de GPU ou de compilação de shader foi identificado.

Os testes gráficos não concluem fases no save real. Fluidez e qualidade no monitor de destino devem ser avaliadas com a GPU local.
