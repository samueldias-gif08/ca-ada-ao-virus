# Revisão: personagens desenhados por inteiro

A revisão anterior alinhava recortes independentes. Isso mantinha proporções incompatíveis e contornos de encaixe visíveis. Essa solução foi substituída: Iara, Boitatá, Cuca e Loira agora são desenhados por inteiro em cada quadro, como no ciclo aprovado de voo.

## Arte e implementação

- Iara penteando: 12 desenhos completos, ciclo de 2 segundos. Pente, dedos, braços, ombros, cabeça, tronco e cauda já fazem parte do mesmo desenho.
- Iara reagindo: 16 desenhos completos para susto, mão à boca, levantar o braço e chegar ao templo. Proporções adultas e contínuas, sem cabeça, tronco ou membros redimensionados separadamente.
- Boitatá: 12 desenhos completos para sono, enfraquecimento, reação e perseguição. O corpo não é mais uma fita geométrica texturizada nem uma cabeça encaixada no corpo.
- Cuca e Loira: 8 desenhos completos de despertar. Cabelo, pescoço, braços, vestido e cauda da Cuca pertencem ao desenho inteiro. Os closes são recortes de câmera desses mesmos desenhos.
- O ciclo original de voo continua usando o atlas original e a mesma sequência, escala e âncora. A preparação do voo usa os novos desenhos inteiros, substituindo o antigo boneco articulado.
- Somente deslocamento, escala uniforme e deformação discreta do desenho inteiro são aplicados. Não existem transformações independentes de cabeça, cintura, cauda, braços ou cabelo.
- Registro das imagens pela testa e unidades de desenho constantes: não são aparados e redimensionados membros individualmente. Preparação dos quadros antes da reprodução, mantendo cache estável.
- Os desenhos vizinhos de uma folha são isolados por componente alfa conectado para não vazarem nas regiões sobrepostas. Os pixels do personagem são preservados.

## Por take

| Take | Resultado desta revisão |
| --- | --- |
| 1 — Sono | Boitatá inteiro, cabeça e espiral desenhadas juntas; ciclo respiratório e fogo preservado. |
| 2 — Sombra | Desenho inteiro de enfraquecimento; nenhuma troca de cabeça separada. |
| 3 — Penteado | Ciclo novo de 12 desenhos completos, incluindo mão, pente e contato com o cabelo. |
| 4 — Grito | Sequência completa de quatro poses de reação; rosto e corpo mudam no mesmo desenho. |
| 5 — Voo | Ciclo aprovado preservado; preparação com desenhos completos. |
| 6 — Sem fogo | Desenhos inteiros de chegada e de mão à boca, com proporções uniformes. |
| 7 — Vírus | Reações completas da Iara e do Boitatá; materialização e animação própria do vírus mantidas. |
| 8 — Perseguição | Boitatá com ciclo serpentino desenhado por inteiro; Iara com o ciclo original de voo. Retratos usam recorte dos desenhos completos. |
| 9 — Frase | Sem alteração de texto, fonte, cor ou efeitos. |
| 10 — Prisioneiras | Corpos completos em todas as poses; câmera aproxima o mesmo desenho para mostrar os olhos azuis. |

## Testes

Execução final: **44 verificações, nenhuma falha e nenhum erro de JavaScript capturado**.

A suíte `story.html` verifica 4.033 quadros da timeline a intervalos de 1/24 s, além de controles, cache, cancelamento, repetição, retorno ao menu e preservação do estado do gameplay. Agora verifica explicitamente que os personagens usam apenas um desenho corporal e que nenhum take monta cabeça, tronco ou membros separados. Também compara os doze quadros do voo pixel a pixel com o atlas, escala e registro originais.

Inspeção visual realizada na folha geral dos dez takes e em 33 instantes da folha de movimento (`storyMotionPreview.html`). Foram conferidos ombros, cintura, mãos, pescoços, caudas e proporções da Iara nos desenhos novos.

Limite: a inspeção visual usa capturas e a varredura automatizada usa relógio virtual. Ainda é necessário assistir à reprodução contínua no dispositivo real para avaliar timing artístico e medir FPS, especialmente em celular. Nenhum resultado de FPS é inferido do relógio virtual.

## Arquivos gerados e prompts

Ferramenta: `image_gen` integrada, conforme skill `imagegen`. Arquivos finais copiados para `boitata/assets/story2d/`, preservando os atlas anteriores:

- `iara-comb-atlas.png`
- `iara-act-atlas.png`
- `boitata-whole-atlas.png`
- `captives-whole-atlas.png`

Especificações dos prompts usados:

1. **Iara penteando:** referência `iara-swim-atlas.png`; mesma Iara adulta, pele morena, franja e cabelo preto, marcas vermelhas nas bochechas, corpo e cauda turquesa, nadadeira verde-clara; folha transparente 4 × 3, doze personagens INTEIROS, ciclo sequencial do pente na têmpora até o cabelo junto ao peito e retorno, mão esquerda segurando mecha, proporções e registro constantes, sem peças destacadas, sem linha de encaixe na cintura.
2. **Iara reagindo:** mesma referência e identidade; folha transparente 4 × 4 com quatro poses sequenciais em cada ação: tranquilidade para susto com pente; preocupação para mão à boca; determinação para braço erguido; chegada da natação para repouso. Cabeça, ombros, mãos, cintura, cauda e nadadeira resolvidos no próprio desenho de cada quadro, sem montagem por peças.
3. **Boitatá:** referência `boitata-atlas.png`; folha transparente 4 × 3, cada célula um animal INTEIRO desenhado em anime; quatro poses de sono respirando, quatro reações de enfraquecimento até determinação, quatro poses serpentinas de perseguição. Escamas laranja, ventre dourado, olhos verdes e corpo contínuo, sem cabeça destacada nem fita geométrica.
4. **Prisioneiras:** referências `cuca-atlas.png` e `loira-atlas.png`; folha transparente 4 × 2, quatro desenhos INTEIROS de cada personagem sentada, levantando a cabeça até olhos azuis. Cuca verde de cabelo loiro, vestido vinho e cauda; Loira pálida de cabelo platinado e vestido gótico escuro com detalhes ciano. Sem cadeiras, cenário, peças avulsas ou membros destacáveis.
## Ajuste posterior: cabeça do Boitatá

O atlas ativo passou a ser `boitata/assets/story2d/boitata-whole-head-small-atlas.png`, mantendo o anterior disponível. Edição pela ferramenta integrada `image_gen`, com referência no atlas de corpo inteiro. Objetivo do prompt: diminuir a cabeça aproximadamente 15% nos doze quadros, redesenhando somente a transição imediata do pescoço para manter um desenho orgânico único; preservar dimensões 1536 × 1024, células, corpo, cauda, poses, expressões, cores e transparência. O carregador usa a nova imagem para o mesmo identificador lógico, sem alterar timing, animação ou gameplay. Conferência visual na folha dos takes após integração.