# Verificação de entrega

## Revisão 1.3 — 03/10/2026

- `npm test`: **33/33 testes aprovados**, incluindo as 320 configurações livres, campanhas com várias sementes e corrida local completa sem dano com comandos planejados.
- `tests/platform-browser.cjs`: aprovado no Chrome, sem erros de JavaScript. Escolha de dispositivo, memória da sessão, tutoriais, ausência de salto por clique no PC, teclado independente (W/S e ↑/↓), contagem, pausa conjunta, configurações durante pausa, vitória dos dois lados, reinícios sem listeners duplicados e retorno à campanha.
- `tests/free-browser.cjs`: aprovado. Dez prévias de mapa/período, opções persistidas, áudio de veículos e pausa, Modo Livre além da duração original, recorde separado e checkpoint preservado.
- Campanha verificada até as cinco vitórias; compras de personagem, skin e rastro mantidas após recarga. Sem alteração na chave de salvamento v1.
- Layout de corrida revisado em 1440×900, 1920×1080, 1366×768 e 1024×768. Um único Canvas e um único requestAnimationFrame atendem as duas pistas; limite de 2,4 milhões de pixels preservado. A amostra de renderização local ficou acima de 100 quadros/s; isso não garante o mesmo desempenho em outros computadores.
- Celular emulado em paisagem e retrato, incluindo 844×390, 667×375, 390×844 e 320×568. Multitoque, cancelamento e pausa por rotação aprovados. Tutorial cabe em 667×375; seleção e partida funcionam mesmo com SessionStorage bloqueado. Sem teste em celular físico.
- A geração conserva a reserva de pouso após descartar o obstáculo da tela. Teste de regressão cobre esse caso nas velocidades extremas. Integrador de distância e decisão de chegada simultânea também verificados.
- Amostra determinística de encontros em cada trecho de 20%: Deserto **9/12/17/21/32**, Floresta **12/14/19/27/38**, Cidade **15/19/26/32/40**, Neve **18/23/29/36/37**, Vulcão **23/33/36/42/42**. Todas concluídas com 3 vidas por entradas de salto/agachamento no motor. A frequência se limita à recuperação física entre ações; as velocidades finais chegam a 1.550/1.950/2.300/2.660/3.000.
- Capturas atuais em `test-results/v4-*.png`. Os registros abaixo documentam a versão anterior.

Verificado no Chrome, em 30/09/2026.

- 27 testes automatizados do motor aprovados com `npm test`.
- Partida completa simulada nas cinco fases, com obstáculos gerados normalmente: conclusão sem dano em todos os mundos.
- Obstáculos terrestres testados nas velocidades inicial e máxima, além de deslize sob pássaros, galhos e placas.
- Pulos, descida, plataformas, gelo, colisões, 3 vidas, invulnerabilidade de 2 segundos e Game Over verificados.
- Teclas Espaço, ↓ e Esc testadas no navegador, incluindo pausa e retomada.
- Interface conferida em 1920×1080, 1366×768, 1024×768 e 800×700; telas de pausa verificadas nas três resoluções de PC.
- Transição real entre as telas das cinco fases, resultados e desbloqueio progressivo verificados.
- Moedas, compras, personagem, skin, rastro e preferências preservados após recarga.
- Checkpoint preservado após recarga, retomando tempo, moedas da corrida e 3 vidas.
- Inicialização HTTP e abertura direta de `index.html` via `file://` verificadas.
- Nenhum erro de JavaScript detectado no roteiro do navegador.

## Modos, dificuldade e obstáculos (1.2)

- As 320 configurações do Modo Livre (5 mapas × 4 velocidades × 4 dificuldades × 4 quantidades) foram simuladas por 210 segundos cada, sem dano ao executar os movimentos planejados, inclusive com 15 ms de atraso. A geração continuou ativa e os limites de objetos/partículas foram respeitados.
- Uma corrida livre de 370 segundos ultrapassou duas vezes a duração do mapa e manteve o checkpoint e os desbloqueios da campanha. Recorde livre, preferências, Game Over e reinício foram verificados.
- 60 campanhas com sementes diferentes e outras 30 campanhas com combinações próximas foram concluídas sem dano. Os trechos finais geraram mais encontros que os iniciais, e cada plano respeitou reação, passagem e recuperação do encontro anterior.
- Cada tipo de obstáculo foi testado nas velocidades inicial e máxima das fases e nas combinações de mapa/velocidade/dificuldade do Modo Livre. O teste executa entradas reais de pulo/deslize no motor e verifica colisões, sem remover obstáculos ou ativar invulnerabilidade.
- Checkpoints 3/2/1/0/0, retorno ao início nas fases finais e migração dos salvamentos v1 foram verificados. Dados inválidos do Modo Livre não apagam carteira ou equipamento.
- `tests/browser-check.cjs`: regressão de campanha, controles, loja, salvamento e layout anterior.
- `tests/free-browser.cjs`: navegação por teclado entre modos, cinco mapas com dia/noite, preferências persistidas, tempo infinito, HUD, recorde separado, preservação/retomada da campanha, motor sintetizado e silêncio ao pausar.
- Novo fluxo verificado em celular emulado a 844×390, 667×375, 390×844 e 320×568; salto por toque e pausa na rotação. Não houve teste em aparelho físico.
- Capturas em `test-results/v3-*.png` revisadas visualmente: menu de modos, configuração, cidade noturna, Game Over, mapa noturno, HUD e toque em paisagem. Corrigidos contraste do HUD à noite e escala da prévia.
- Cópia do código anterior em `backups/DUNA-antes-modo-livre.zip`.

A simulação de partidas valida a possibilidade de vencer, mas não substitui uma avaliação humana de preferência de dificuldade. As fases podem ser ajustadas em `js/config.js`.
