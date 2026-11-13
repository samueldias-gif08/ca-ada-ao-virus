# Perguntas educativas de múltipla escolha

## Alterações

- `js/questions.js`: banco único com 60 perguntas em português, distribuídas em 30 temas. Cada objeto contém `id`, `theme`, `pergunta`, `alternativas` e `correta: 0`. As quatro alternativas mantêm a ordem A/B/C/D; banco, objetos e alternativas são imutáveis.
- `js/education.js`: seleção por tema e alternância entre tentativas; somente o índice 0 é aceito como acerto. A resposta fica bloqueada antes de efeitos, pontuação ou salvamento. O número da tentativa impede que um botão antigo responda a uma nova pergunta.
- `js/interface.js`: painel compartilhado com quatro botões, letras, nomes acessíveis e texto seguro; remoção das explicações educativas dos resultados.
- `js/networkCollapse.js`: a interface específica da fase final reutiliza o mesmo painel e mantém suas mensagens e seu botão de reinício. Removida a explicação após erro.
- `js/captureSystem.js` e `js/pvpMode.js`: as perguntas começam no setor 4, após o objetivo. No setor 5, a vitória no duelo abre a questão antes de concluir e desbloquear a próxima etapa; o acerto retoma a tela original do duelo.
- `css/game.css`: estilos restritos ao painel de perguntas, com fundo esmeralda escuro, bordas prateadas, Marcellus, foco visível, alvos de toque e rolagem interna em telas baixas.

As perguntas são exigidas a partir do setor 4. Os setores 1–3 terminam na captura; o setor 4 pergunta após a captura e o setor 5 após vencer o duelo. Derrotas e empates no duelo não abrem questões. Nos objetivos do labirinto, da Cuca e da fase final, os gatilhos existentes continuam sendo utilizados. O Colapso da Rede continua usando o tema DNS após a restauração.

## Mecanismo preservado

Acertar soma os mesmos 500 pontos, toca o mesmo efeito e chama `Game.win()`, que continua responsável pela conclusão, próxima fase, recordes e salvamento. No duelo, uma conclusão específica registrada por `Education.choose(theme, onCorrect)` retoma `PvP.finish()` e mantém sua tela e seu desbloqueio originais. Essa conclusão só pode ser executada uma vez e é descartada ao errar. O texto educativo da questão não é passado à vitória.

Errar B/C/D chama o mesmo `Store.wrong()`, muda para `wrong`, toca o mesmo efeito, mostra a revisão e atualiza o HUD. A duplicação da infecção e a repetição seguem o mecanismo anterior. A resposta errada não desconta vidas; o reinício mantém o reset original. `game.js`, `save.js`, controles, colisões, personagens, História e menu não foram editados para esta alteração.

## Verificação

`tests/education.html` e `tests/education.js` exercitam o jogo carregado pelas entradas atuais, com salvamento isolado para não gravar progresso do usuário:

- 60 enunciados únicos, quatro alternativas distintas, A sempre correta, nenhum campo de verdadeiro/falso ou explicação.
- Revisão das 240 combinações: 60 acertos em A e 180 erros em B/C/D, com os efeitos de pontos, vidas, infecção e progressão originais.
- Bloqueio de cliques repetidos, índices inválidos e callbacks de tentativas anteriores.
- Captura dos setores 1–3 sem perguntas; setor 4 exige a resposta antes de concluir.
- Duelo exige pergunta após vitória, preserva derrota e empate e permite repetir após erro sem liberar progresso antecipadamente.
- Perguntas somente após a captura nos objetivos 8/9, com ambos os personagens e seus temas originais.
- Fase final: ativação do núcleo, espera pela restauração, quatro alternativas, erro, reinício, nova pergunta e conclusão com A.
- Nenhuma explicação educativa após respostas e nenhuma exceção de JavaScript.

`tests/networkCollapse.js` confirma a regressão da fase final; `tests/mouseControls.html` confirma os controles existentes. Os testes antigos em `suite.js`, `chase.js`, `redesign.js` e `networkCollapse.js` foram adaptados para enviar índices de alternativas, em lugar dos antigos booleanos.

`.browser-check/education-browser.ps1` executa as suítes e usa cliques/toques reais pelo Chrome DevTools Protocol. As capturas `quiz-desktop.png`, `quiz-mobile.png`, `quiz-landscape.png` e `quiz-final.png` verificam 1440 × 900, 430 × 932, 844 × 390 e o painel específico da fase final. Em telas baixas, a alternativa D permanece alcançável pela rolagem interna do painel.

Os resultados completos ficam em `.browser-check/education-browser-results.json`. A emulação móvel verifica layout e toque, mas não substitui avaliação de desempenho em um aparelho físico.

Execução final: **142 verificações aprovadas, nenhuma falha** — 59 do sistema educativo (incluindo as 240 combinações de respostas), 32 da fase final, 41 dos controles e 10 interações/layouts no navegador. A inspeção visual confirmou o título prateado legível, os quatro botões e a alternativa D alcançável em orientação horizontal. Não houve erro de JavaScript capturado na suíte educativa.

## Conferência técnica do conteúdo

Foram distinguidos quadros Ethernet de pacotes IP, switch de camada 2 de roteador, DHCPv4 de DNS, transporte TCP de UDP e endereçamento IPv4 de IPv6. A pergunta sobre MAC especifica EUI-48; a do conector de par trançado usa 8P8C e a denominação comum RJ45. As alternativas incorretas se referem a funções, equipamentos ou protocolos relacionados, sem depender de trocadilhos.

Referências primárias utilizadas na conferência:

- [IPv4 — RFC 791](https://www.rfc-editor.org/rfc/rfc791.html) e [IPv6 — RFC 8200](https://www.rfc-editor.org/info/rfc8200/).
- [TCP — RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html) e [UDP — RFC 768](https://www.rfc-editor.org/rfc/rfc768.html).
- [DNS — RFC 1034](https://www.rfc-editor.org/info/rfc1034/) e [DHCP — RFC 2131](https://www.rfc-editor.org/info/rfc2131/).
- [Faixas privadas IPv4 — RFC 1918](https://www.rfc-editor.org/rfc/rfc1918.html) e [BGP — RFC 4271](https://www.rfc-editor.org/rfc/rfc4271.html).
- [Comutação Ethernet — documentação Cisco](https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/12006-chapter22.html).
