# Revisão visual da Iara

Abra `iara.html` por um servidor local ou pelo Live Server do VS Code. A página
mostra cinco combinações de pose/expressão e registra verificações de silhueta,
dedos, crescimento do cabelo, buffers, integridade das malhas e erros WebGL.
O carregamento direto por arquivo exige que o navegador permita acesso ao iframe local.

No jogo, selecione Iara e verifique a leitura na câmera das fases, colete pacotes
para alongar o cabelo, faça curvas e reinicie a fase. Controles e colisões não
foram modificados nesta revisão.

O modelo procedural está em `js/organicCharacters.js`. O rig de inspeção em
`js/storyActors.js` preserva as posições originais dos ombros, cotovelos e pulsos;
o lábio inferior acompanha a expressão de surpresa.

Limites: a História em produção usa os atlas 2D de `assets/story2d`, não esse rig.
Essas ilustrações e o retrato do menu não foram redesenhados. A prévia 3D não
significa que a História passou a usar o modelo novo. O fallback antigo em
`js/iara.js` também permanece separado do modelo orgânico WebGL.

Verificação no Chrome com SwiftShader: os nove testes específicos passaram.
A suíte da História terminou com 37/38 aprovações; a falha foi a expectativa
da posição do botão HISTÓRIA depois de CRÉDITOS. A suíte orgânica geral não
produziu relatório no tempo da execução, portanto não é considerada aprovada.
Buffers estáveis foram verificados por 60 quadros; isso não constitui uma
comparação de FPS em GPU real nem validação manual de todas as fases.
