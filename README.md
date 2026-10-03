# DUNA

Uma pequena grande aventura. Runner original em HTML, CSS e JavaScript, com cinco fases, personagens desbloqueáveis e cenários vetoriais desenhados em Canvas. Sem bibliotecas, fontes, imagens ou serviços externos obrigatórios.

## Jogar

Abra **index.html** no Chrome, Edge ou Firefox no PC. O mesmo projeto funciona como jogo web no navegador do celular, sem aplicativo nativo obrigatório. Não é preciso instalar bibliotecas. O áudio começa depois da primeira interação.

Opcionalmente, com Node.js 18 ou superior:

```sh
npm start
```

Acesse **http://localhost:4173**. O servidor escuta apenas no computador local. Use sempre o mesmo endereço e navegador para acessar o mesmo salvamento. Os navegadores separam os dados de arquivos locais e de cada origem HTTP; o servidor local é a opção recomendada para um endereço estável.

Para testar no celular conectado ao mesmo Wi-Fi, encerre o servidor anterior e execute `npm run start:lan`. O terminal mostrará o endereço da rede para abrir no celular. O PC deve permanecer ligado e permitir a conexão na rede local. Para uso pela internet, os arquivos do jogo podem ser servidos por qualquer hospedagem estática; não há backend obrigatório. Esta entrega não publica o jogo em um serviço externo.

## Atualização 1.3 — Ritmo, plataformas e disputa local

O projeto foi atualizado sobre o motor existente. As cinco fases, personagens, loja, skins, vidas, controles e a chave de salvamento `duna.save.v1` foram mantidos.

- Menu em tela cheia com cenário animado, botões de jogo e navegação por setas/Enter/Esc.
- Seleção de mundos e equipamentos, configurações, HUD, pausa, Game Over e vitória com a mesma identidade visual.
- **JOGAR → MODO FASES / MODO LIVRE / 2 JOGADORES (PC)**. O checkpoint da campanha pode ser retomado pelo botão Continuar na seleção de modos.
- Modo Livre com todos os mapas disponíveis, dia/noite, quatro velocidades iniciais, quatro dificuldades e quatro quantidades de obstáculos. A partida continua além da duração original do mapa, até perder as três vidas. O ritmo cresce por três minutos e permanece no limite da configuração. As velocidades iniciais são 420 (Lenta), 700 (Normal), 1.100 (Rápida) e 1.900 (Extrema); Extrema com dificuldade extrema chega a 3.190 unidades por segundo. As opções e o recorde livre ficam salvos separadamente da campanha.
- Noite com céu escuro, lua, estrelas, cores próprias, postes e janelas iluminados na cidade, faróis e vaga-lumes na floresta. A prévia mostra o mapa e o período selecionados.
- Velocidade real e frequência seguem uma curva suave calculada pela porcentagem da fase. Os limites inicial/final são 470→1550, 640→1950, 820→2300, 1020→2660 e 1200→3000 unidades por segundo. Uma segunda curva de aceleração entra nos últimos 30% da fase. A frequência usa a velocidade real, há mais obstáculos móveis e sequências de até três ações com intervalos variáveis. Distância, parallax, passos, partículas, linhas de velocidade, vento e ritmo musical acompanham essa aceleração.
- Pássaros batem asas, avançam com velocidade própria e variam altura; animais correm, gelo desliza e bolas de neve rolam. Carros e motos possuem velocidades diferentes, rodas girando, motor e buzinas ocasionais antes de chegar. As motos aparecem mais depressa que os carros.
- Combinações como chão+pássaro, carro+moto, árvore+gelo e plataforma+pedra em queda entram progressivamente. Antes de aceitar cada obstáculo, o motor calcula sua trajetória acelerada e reserva uma janela de salto ou deslize compatível com o encontro anterior. Inclui tempo de reação na câmera mais estreita, recuperação após pousar, saída do gelo e prevenção de ultrapassagens entre obstáculos. A reserva de pouso continua valendo depois que o obstáculo sai da tela; a câmera amplia a visão nas velocidades extremas. Na velocidade lenta, obstáculos altos/largos são dimensionados para o salto continuar possível.
- Toque com captura de ponteiros, multitoque, soltura/cancelamento seguros e pausa ao girar o celular. Botões ficam abaixo do caminho do personagem.
- Câmera adaptável em vez de esticar a física. Renderização limitada a 2,4 milhões de pixels, menu a 30 FPS, partículas limitadas e descarte contínuo de objetos fora da tela.

## Dispositivo e multiplayer local

Na primeira abertura da sessão, escolha **CELULAR** ou **COMPUTADOR**. A seleção fica no SessionStorage e pode ser alterada em Configurações → Trocar dispositivo. O tutorial aparece antes da primeira partida em cada dispositivo. Se o armazenamento estiver indisponível, a escolha ainda funciona durante a página aberta.

No computador, a corrida usa apenas teclado e não mostra botões de toque. No celular, as instruções são de touchscreen e o multiplayer fica oculto. Os créditos “Desenvolvido por Guilherme Marques” aparecem na apresentação e no menu.

**JOGAR → 2 JOGADORES** abre uma corrida local na Cidade com tela dividida horizontalmente, dentro do mesmo Canvas. Cada participante escolhe entre os personagens já desbloqueados e tem física, vidas, obstáculos, moedas da disputa, pontuação e distância independentes. A largada mostra **3, 2, 1, JÁ!**.

| Jogador | Pular | Abaixar |
| --- | --- | --- |
| 1 — pista superior | W | S |
| 2 — pista inferior | ↑ | ↓ |

Esc pausa ou retoma a partida inteira, inclusive durante a contagem. Perder o foco também pausa tudo. A velocidade compartilhada cresce de 850 a 2.450 unidades/s por 90 segundos; as duas pistas recebem a mesma sequência e as mesmas velocidades de obstáculos, independentemente dos impactos. Uma nova disputa muda a semente dos dois igualmente.

Vence quem cruzar a chegada primeiro. Cada impacto tira uma vida e 75 m do progresso; perder a terceira vida aciona um resgate, custa mais 75 m e restaura as três vidas. Isso cria vantagem para quem desvia melhor e permite que ambos continuem disputando. Sem impactos, a chegada leva aproximadamente 90 segundos. Chegadas simultâneas podem empatar. O resultado mostra pontos, distância, obstáculos superados e tempo dos dois, com opções para jogar novamente ou voltar ao menu. Moedas e pontos da disputa são locais e não alteram carteira, recordes ou checkpoint da campanha.

## Controles da partida individual

| Tecla | Ação |
| --- | --- |
| Espaço / ↑ | Pular |
| ↓ (segurar) | Abaixar / deslizar; acelerar a descida no ar |
| Esc | Pausar / continuar |
| Botão ↑ na tela | Pular (toque) |
| Botão ↓ na tela (segurar) | Deslizar (toque) |
| Setas / Enter / Esc nos menus | Navegar / selecionar / voltar |

O jogo pausa automaticamente ao trocar de aba ou janela e ao girar o celular. O botão de expandir solicita tela cheia quando o navegador permite. A simulação mantém as coordenadas originais; uma câmera ajusta o desenho ao PC e ao celular. A orientação horizontal oferece uma visão mais ampla, e os menus também funcionam na vertical. Configurações acessadas pela pausa preservam a corrida em andamento.

## A jornada

| Fase | Duração | Obstáculos / particularidades |
| --- | --- | --- |
| Deserto | 2:10 | Cactos, pedras, pássaros, buracos |
| Floresta | 2:25 | Troncos, pedras, galhos, animais |
| Cidade | 2:35 | Cones, barreiras, carros, motos, placas, buracos |
| Neve | 2:45 | Gelo em movimento, pedras, pinheiros, bolas de neve, trechos escorregadios |
| Vulcão | 3:00 | Rochas em queda com aviso, fendas, plataformas e lava |

A velocidade aumenta gradualmente. Cada fase começa com 3 vidas; um impacto dá 2 segundos de invulnerabilidade com animação piscante. Uma queda custa uma vida e devolve o personagem ao caminho. Deserto tem checkpoints em 0:40, 1:20 e 1:50; Floresta em 0:50 e 1:40; Cidade em 1:20. **Neve e Vulcão não possuem checkpoints**: depois de perder todas as vidas, a tentativa seguinte começa no início. A barra de progresso marca os checkpoints disponíveis.

Continuar um checkpoint restaura 3 vidas e oferece um trecho inicial sem obstáculos. Recomeçar ou escolher uma fase inicia uma corrida nova e substitui o checkpoint anterior. O Modo Livre preserva o checkpoint da campanha, não desbloqueia fases e usa um recorde próprio; as moedas coletadas continuam entrando na carteira. Checkpoints antigos de Deserto, Floresta e Cidade continuam aceitos; checkpoints antigos de Neve/Vulcão são descartados para aplicar a nova regra, preservando moedas, recordes e equipamentos.

Moedas entram na carteira assim que são coletadas, inclusive em corridas interrompidas. Elas compram Bip (robô), Lia (aventureira), duas skins e um rastro de estrelas. Todos os personagens usam a mesma física. A pontuação é de 12 pontos por segundo mais 25 por moeda coletada na corrida. Fases, carteira, personagens, cosméticos, recordes, checkpoint e preferências ficam no LocalStorage, na chave `duna.save.v1`. Ao desativar armazenamento ou usar uma sessão privada, a persistência depende das permissões do navegador; a interface avisa caso o armazenamento não esteja disponível.

## Organização

- `index.html`: telas, controles e ícones vetoriais.
- `style.css`: interface adaptável e transições.
- `game-ui.css`: camada visual de jogo em tela cheia, incluindo PC, celular e áreas seguras da tela.
- `game.js`: inicialização, controles e loop com passos fixos de 120 Hz.
- `js/config.js`: fases, personagens, itens e parâmetros da física.
- `js/engine.js`: movimento, colisões, geração de encontros, checkpoints e progressão.
- `js/race.js`: coordenação das duas instâncias do motor, relógio compartilhado, penalidades e chegada.
- `js/renderer.js`: cenários com parallax, personagens animados, obstáculos e partículas.
- `js/ui.js`: navegação, HUD, resultados e loja.
- `js/input.js`: teclado, navegação, toque, multitoque e liberação de controles, registrados apenas uma vez.
- `js/save.js`: validação e persistência dos dados.
- `js/audio.js`: música e efeitos originais sintetizados com Web Audio.
- `tests/engine.test.cjs` e `tests/race.test.cjs`: física, dificuldade, persistência e regras da disputa.

Para adicionar personagens, cadastre uma entrada em `Duna.CHARACTERS` e sua ilustração em `drawCharacter`. Fases e custos são configurados em `js/config.js`.

## Verificar

```sh
npm test
```

Os 33 testes do motor e da corrida não precisam de navegador nem de dependências. Incluem 60 campanhas por mapa/semente no total, mais 30 campanhas com sequências próximas, as 320 configurações livres simuladas por 210 segundos cada, uma corrida livre de 370 segundos e cada obstáculo nas velocidades inicial e máxima. Conferem ausência de dano com movimentos executáveis, reação, frequência crescente, ausência de travamentos na geração, limites de memória, checkpoints, carteira e salvamentos antigos.

Os roteiros opcionais usam Playwright com Chrome instalado. Com o servidor rodando, `npm run test:browser` (ou `node tests/browser-check.cjs`) verifica escolha de dispositivo, sessão, tutoriais, teclado, toque simultâneo e cancelamento, pausa, tela dividida, resultados, reinícios, cinco fases, loja e retomada de checkpoint. `node tests/free-browser.cjs` verifica as dez combinações de mapa/período, opções persistidas, corrida infinita, áudio dos veículos, recorde livre e quatro tamanhos de celular. Indique o caminho de Playwright em `PLAYWRIGHT_MODULE` se ele não estiver instalado localmente. As capturas ficam em `test-results/`. Playwright é uma ferramenta de desenvolvimento opcional; não faz parte do jogo.

A jogabilidade foi validada por simulações que executam pulos e agachamentos, incluindo pequenos atrasos de entrada, sem desativar colisões. O celular foi conferido por emulação; não houve teste em aparelho físico. A sensação de dificuldade ainda depende da habilidade do jogador.
