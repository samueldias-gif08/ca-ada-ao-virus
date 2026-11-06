# BOITATÁ — A Serpente Digital

**Versão atual completa:** [boitata/index.html](boitata/index.html). O arquivo index.html desta pasta encaminha para ela. Consulte [boitata/README.md](boitata/README.md) para a arquitetura modular, chefe final, áudio, salvamento e resultados dos testes. Os arquivos originais desta pasta foram preservados como referência da primeira implementação; o texto abaixo descreve essa versão anterior.

Abra `index.html` em um navegador moderno. Não é preciso instalar dependências ou iniciar um servidor. Todos os recursos são locais; o jogo também funciona sem Internet.

## Jogar

- Use →, ↑ e ↓. Boitatá começa avançando para a direita. Esquerda e inversões verticais imediatas são bloqueadas.
- Espaço ou Escape: pausar/continuar. Há controles por toque abaixo da arena.
- Nas bordas verticais a serpente vira para a direita. O cenário continua à direita caso pacotes fiquem para trás.
- Azul: pacote comum; dourado: especial; rosa: recuperação; lilás: pontuação. Comum e especial aumentam o corpo e contam para a meta.
- Três vidas por tentativa; dano concede 1,5 segundo de invulnerabilidade e reposiciona em uma área desobstruída.
- Fases 1–5: leia o resumo, colete e sobreviva. Fases 6–30: depois da coleta, responda verdadeiro ou falso.
- Resposta errada dobra os vírus e mantém o setor bloqueado. Derrota não duplica. O contador de erros é persistente e zera ao concluir o setor.

## Organização

`index.html`: estrutura. `style.css`: interface responsiva. `game.js`: estados, controles, câmera, renderização, áudio e inimigos. `levels.js`: 30 setores com temas, resumos e parâmetros próprios. `questions.js`: 50 perguntas, duas por tema avaliado, alternadas após erro.

O mapa é determinístico por setor, com dez famílias de obstáculos, três variantes e parâmetros exclusivos. Faixas próximas à rota de coleta ficam desobstruídas. Trechos antigos são descartados conforme a câmera avança. Os inimigos possuem cinco padrões: comum, perseguidor, rápido, bloqueador e mutante. São processados até 18 simultaneamente; o total e a fila usam BigInt para preservar a duplicação acumulada sem arredondamento. Inimigos encerram seu ciclo após 75 passos ou ao ficarem atrás da câmera, permitindo a entrada de novas ondas. A meta continua sendo coleta e sobrevivência, sem exigir eliminar a fila inteira.

O LocalStorage `boitata-save-v1` salva desbloqueios, recorde, último setor e erros. Não salva a posição no meio da tentativa. O armazenamento é isolado por navegador/origem e pode ser limitado em navegação privada ou em arquivos locais conforme as configurações do navegador. O menu indica o recorde de uma tentativa, não uma pontuação acumulada de campanha.

## Verificação manual

1. Abrir o menu, instruções, seleção de fases e iniciar a fase 1.
2. Conferir movimento automático, bloqueio da esquerda, pausas, resumo e retomada sem salto.
3. Coletar a meta, conferir vitória, desbloqueio e persistência após recarregar.
4. Em uma fase a partir da 6, errar duas respostas: o total deve passar de N para 2N e 4N. Conferir alternância da pergunta.
5. Perder três vidas e tentar novamente: erros e total devem permanecer iguais.
6. Acertar: conferir explicação, bônus de 500, próximo setor e erros zerados.
7. Testar a tela estreita, controles por toque, áudio opcional e pausa ao trocar de aba.

Não foram adicionadas dependências externas, fontes remotas ou imagens de terceiros.
