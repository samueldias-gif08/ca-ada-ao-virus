# HISTÓRIA — apresentação anime 2D

A opção existente HISTÓRIA agora usa exclusivamente **Canvas 2D, ilustrações PNG, sprites por partes e fundos pintados**. A ordem das dez cenas e a duração de **168 segundos** foram preservadas. O menu não recebeu uma segunda história. O gameplay e seus modelos continuam em Three.js 3D.

## O que foi implementado

- Seis fundos originais: floresta noturna, interior do templo, lagoa, caminho até o templo, floresta verde-clara e instalação tecnológica.
- Sete atlas transparentes com 84 células: partes, expressões e poses de Iara, Boitatá, Cuca, Loira, vírus e folhagem.
- Braços da Iara com IK de dois segmentos, partes desenhadas independentes e mão/pente coordenados. A outra mão organiza o cabelo.
- Cabelo em mechas independentes, deformado continuamente por faixas afins; cauda com três desenhos de pose e deformação adicional. A natação aérea usa também um atlas de 12 poses completas desenhadas, reproduzido a 12 poses/s.
- Corpo desenhado do Boitatá com ondulação por deformação de textura; poses enrolada e em perseguição; cabeças de sono, fraqueza, surpresa e determinação.
- Fogo com quatro desenhos alternados a 12 poses por segundo, vírus com antecipação, fuga e smear, portal e sombra pintados.
- Expressões desenhadas da Iara: tranquila, assustada, preocupada e determinada.
- Cuca e Loira com corpo sentado, cabelo separado, respiração e três poses de cabeça para o despertar; retratos próprios para o close dos olhos azuis.
- Panorâmica, zoom, travelling 2D, folhagens em parallax, água, luz, partículas, speed lines, impact frame no grito, glitch e fades.
- Mensagem final original em Cinzel Decorative, com prata e brilho esmeralda.
- Áudio procedural anterior preservado e sincronizado nos mesmos tempos. Respeita as preferências existentes de música e efeitos.
- Pausar/continuar, espaço, ESC, pular, voltar, repetição, cancelamento durante carregamento e liberação de imagens e buffers.

Os personagens são rasterizações de desenhos 2D separados por parte. **Não há instanciação de cena/câmera/modelos WebGL dentro da história**, nem filtro sobre modelos do jogo. As primitivas de Canvas são usadas somente para efeitos, recortes e iluminação; não representam personagens.

## Sequência preservada

| Intervalo | Cena |
|---|---|
| 0–18s | Floresta noturna, templo e Boitatá dormindo com fogo |
| 18–32s | Sombra, enfraquecimento das chamas e escuridão |
| 32–50s | Iara penteia o cabelo na lagoa |
| 50–60s | Grito, interrupção do gesto, surpresa e olhar para o templo |
| 60–82s | Mão erguida, pente solto, elevação e natação aérea |
| 82–99s | Chegada ao templo e Boitatá enfraquecido sem fogo |
| 99–112s | Materialização do vírus e fuga |
| 112–135s | Perseguição, floresta clara, olhares determinados e fade |
| 135–146s | “Que o sistema seja salvo” sobre preto |
| 146–168s | Cuca e Loira nas cadeiras, despertar, olhos azuis e preto |

## Limites artísticos — acabamento ainda pendente

Esta é uma **versão 2D articulada funcional**, não uma abertura tradicional inteiramente redesenhada quadro a quadro com acabamento de estúdio. Os recortes gerados são recursos reais integrados, mas os desenhos intermediários disponíveis ainda são limitados. A versão não deve ser apresentada como o nível final de fluidez solicitado.

Para concluir esse acabamento, precisam ser produzidos ou revisados:

1. **Iara:** o ciclo de 12 poses de natação já existe. Ainda faltam turnarounds coerentes de frente, perfil e costas, transições de decolagem e parada mais refinadas, intermediários da mão/pente em contato com as mechas e desenhos do giro de cabeça. A IK atual anima o gesto, mas não substitui esses desenhos anatômicos.
2. **Boitatá:** 8–12 desenhos intermediários entre enrolado e estendido, poses de curva e perspectiva, além de poses de cabeça em mais ângulos. Atualmente há uma troca de pose em corte cinematográfico, com cabeça ancorada e corpo ondulante.
3. **Cuca e Loira:** intermediários adicionais entre cabeça baixa, despertar e olhar controlado; revisão de encaixes de pescoço, braços, cabelos e contenções. Atualmente o despertar combina poses desenhadas, interpolação, inclinação e fades.
4. **Close-ups:** retratos maiores, idealmente com cerca de 1024px por rosto, e limpeza manual dos contornos. As células atuais têm resolução limitada e são ampliadas em alguns closes.
5. **Ação:** smears e impact drawings específicos dos protagonistas. Já existem smear do vírus, linhas de velocidade e um impact frame luminoso, mas não um conjunto completo de desenhos de impacto corporal.
6. **Composição:** retoque manual final dos atlas e separação adicional dos fundos em planos próprios, para parallax mais rico que as folhagens independentes atuais.

Nenhum desses itens foi substituído por personagens geométricos ou anunciado como animação tradicional pronta.

## Arquivos

- `js/story.js`: controlador da história existente, dez cenas, carregamento, pausa, eventos e limpeza.
- `js/storyRenderer2d.js`: renderização de sprites, articulação, deformações e composição 2D.
- `js/storyAssets2d.js`: manifesto, carregamento validado, cancelamento e liberação das artes.
- `js/storyAtlasBounds.js`: recortes técnicos dos PNG originais.
- `js/storySound.js`: áudio procedural preservado da versão anterior.
- `css/story.css`: controles, loading, letterbox e mensagem final.
- `assets/story2d/`: seis fundos e sete atlas; proveniência e prompts em `ART-PROMPTS.md`.
- `index.html` e `../index.html`: carregam os módulos 2D no lugar dos módulos 3D da história.
- `tests/story.html`, `tests/story.js` e `tests/storyPreview.html`: testes e inspeção.
- `tests/scanStoryAtlases.ps1`: lê o alfa das artes para gerar os recortes. Não altera os PNG. Após substituir um atlas, executar novamente esse utilitário.

Os arquivos antigos `storyActors.js` e `storyWorld.js` permanecem como referência não carregada. O áudio foi extraído para um módulo independente; a história atual não executa esses arquivos.

## Testes e desempenho

A suíte `tests/story.html` avalia os 337 instantes da timeline, carregamento das 13 imagens, recortes, articulação do pente, deformações, expressões, cenas, mensagem, azul dos olhos, pausa, ESC, cancelamento, repetição, liberação de recursos, proporções de tela e retorno ao gameplay 3D. Ela bloqueia explicitamente a criação de um novo WebGLRenderer durante a história.

A resolução lógica é 1600×900, com escala uniforme e letterbox em outras proporções. Os recortes são reutilizados. As artes originais ocupam aproximadamente 32MB e são liberadas ao sair, sem acumular novas imagens a cada reprodução.

As verificações automatizadas e capturas usam Chrome headless. Não equivalem a medição de 60 FPS em hardware físico, validação auditiva nem revisão humana quadro a quadro de todos os 168 segundos.

Resultados da versão 2D: **39/39** verificações da história, **40/40** de controles/duelo e **12/12** de inicialização e recursos anteriores. Total: **91/91**. Os 12 quadros desenhados da natação da Iara foram inspecionados, e a suíte confirma a reprodução dos 12 índices de pose. Os cenários e as montagens das dez cenas foram conferidos em capturas.
