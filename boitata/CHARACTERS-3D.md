# Personagens orgânicos

`js/organicCharacters.js` substitui somente a apresentação WebGL dos quatro personagens. O módulo é carregado depois dos sistemas das arenas e antes de `main.js`. O renderizador Canvas continua disponível com seus modelos anteriores.

A seleção de guardião apresenta ilustrações dedicadas de Boitatá e Iara em `assets/characters/`, acima dos respectivos nomes. No duelo, os dois participantes usam malhas independentes, inclusive quando escolhem o mesmo guardião. Cuca e Loira continuam aparecendo nas fases e condições originais; não são personagens selecionáveis. Iara tem volume ampliado na coroa e nas mechas, distribuídas ao longo da trilha sem modificar as colisões ou o crescimento físico.

## Modelagem

- Boitatá: superfície tubular contínua acompanhando a trilha física, cauda afunilada, ventre separado, crânio e mandíbula modelados por perfis, narinas, relevos supraoculares e olhos esmeralda com pupilas e reflexos.
- Iara: tronco com cintura e ombros, rosto com queixo, nariz, lábios e olhos, braços curvos, dedos, cauda afunilada e nadadeiras. Sete mechas contínuas percorrem toda a trilha crescente; mechas adicionais compõem o volume junto à cabeça.
- Cuca: focinho e mandíbula crocodilianos, dentes cônicos, pescoço alongado, braços e garras, vestido vermelho com pregas radiais, peruca loira e cauda contínua. A mandíbula acompanha o aviso original de fogo.
- Loira: anatomia esguia, rosto pálido, cabelo loiro em mechas curvas, traje escuro com circuitos e acabamento metálico, oscilação e partículas de transparência moderada. As pernas acompanham o `stride` original da perseguição.

As superfícies usam `BufferGeometry` com perfis elípticos amostrados sobre curvas Catmull-Rom centrípetas. Materiais PBR e texturas procedurais locais de escamas e fios diferenciam rugosidade e relevo. Não há downloads, assets ausentes ou dependências novas. A iluminação existente é preservada; a prévia de ateliê tem iluminação própria apenas para inspeção.

## Isolamento e recursos

Nenhum método de movimento, IA, colisão, dano, temporização, câmera ou geração dos mapas é substituído. Os pontos recebidos são copiados para buffers visuais. Os modelos antigos são usados quando o adaptador não é WebGL. O piscar de invulnerabilidade continua controlado pelo renderizador original.

Buffers crescem por capacidade e são reutilizados durante o movimento. Curvas, vetores auxiliares, materiais e texturas são reutilizados. A substituição de buffers libera a geometria antiga. Modelos não usados ficam invisíveis a cada frame; a reserva máxima do cabelo fica retida para reutilização, sem crescimento a cada reinício. `Boitata.OrganicCharacters.dispose()` libera os recursos do módulo quando necessário. Não há skinning, modelos GLTF, LOD ou normal maps externos; o relevo usa bump maps procedurais.

## Verificação

- `tests/organic.html`: isolamento da simulação, crescimento dos dois guardiões, colisão da trilha, buffers finitos, reutilização de geometrias, reinício, fogo da Cuca, aparição da Loira, troca de setor, menu e erros de GPU.
- `tests/organicPreview.html`: prévia dos quatro personagens, sem alterar a câmera do jogo.
- `tests/networkCollapse.html`: perseguição, navegação em placas estáveis, contato, perda de vida, condições de aparição e encerramento da fase. A asserção da aparência aceita as novas superfícies e a implementação anterior.
- `tests/mouseControls.html` e `tests/mazeTraps.html`: controles e colisões existentes.

Execução em Chrome headless com SwiftShader: suíte nova 26/26; colapso 32/32; controles 36/36; armadilhas 17/17. A suíte legada `tests/index.html`, que não carrega o módulo novo, teve 276/284: contém expectativas antigas de 30 fases incompatíveis com a campanha atual e falha de captura no setor 6. Essas expectativas não foram alteradas para mascarar falhas.

A verificação de memória cobre estabilidade da contagem de geometrias após aquecimento, não um perfil completo do heap. Não foi medido FPS em GPU física nem realizada uma campanha manual completa.
