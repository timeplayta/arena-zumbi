# Novidades — Arena Zumbi

## Botão de tiro automático no celular (01/11/2026)
- Novo botão AUTO no topo do HUD de toque: liga/desliga o tiro automático. Riscado = desligado. Só aparece no celular.

## Infecção com 12 jogadores e bots (01/11/2026)
- Salas de Infecção com até 12 jogadores.
- Bots completam a sala até 12 (opção no lobby). Quando alguém entra, um bot sai.
- Bots humanos andam pelo mapa, atiram nos infectados e fogem quando eles chegam perto (cansam ao correr).
- Bots infectados perseguem o humano mais perto e atacam com as garras.
- 1 infectado inicial a cada 6 jogadores (12 jogadores = 2).
- Novo botão "Infecção offline (bots)": joga sem internet, você + 11 bots.

## Mapa da Infecção: vila italiana (01/11/2026)
- A Infecção agora acontece numa vila italiana de 120 x 120 m. Co-op e solo continuam na arena.
- Praça com chafariz, 18 lojas com fachada (pizzarias, gelateria, trattoria, caffè...), 7 casas com interior e móveis.
- Dois morros com escadas: terraços com oliveiras e casa no alto; morro da capela com torre do sino.
- Carroças, barracas, caixas, barris e feno como cobertura. Janelas: dá para atirar, não para passar.
- 12 boosters para humanos e infectados: raio = velocidade +40% por 8 s; cruz = vida (+50 humano, +400 infectado). Voltam em 25 s.
- Sempre de tarde, com céu dourado.

## Celular: menus e controles (01/11/2026)
- Menu na horizontal: abas numa coluna lateral, todas visíveis. Sem barras de rolagem.
- HUD 20% menor no celular. Novo ajuste "Tamanho do HUD" (50% a 120%).
- Ajustes > "Posicionar botões na tela": arraste cada botão de toque para onde quiser. "Restaurar" volta ao padrão.

## Modo Infecção (01/11/2026)
- Zumbi em primeira pessoa: braços com garras do modelo `v_zombie_hands` (Source), com animação de espera e dois golpes alternados. Ajustados para o campo de visão do jogo: o corte dos braços não aparece mais no golpe.
- Zumbis-jogadores com pele vermelha, diferentes dos zumbis comuns.
- Menu "Co-op online" virou "Online", com dois modos: Co-op e Infecção.
- Infecção: até 8 jogadores. Após 10 s, um jogador aleatório vira zumbi. Garras infectam os humanos (3 golpes).
- Infectado: 1000 de vida, mesma velocidade dos humanos e corrida infinita. Não usa armas e volta 5 s depois de abatido, com contagem na tela ("VOCÊ VOLTA EM 5").
- Infectado abatido solta 2 kits médicos e 2 caixas de munição por jogador da sala (2 jogadores: 4+4; 3: 6+6). Só humanos pegam.
- Todo humano começa com colete (50). O infectado não tem colete. Com colete, são 4 golpes para infectar.
- Ataque do infectado: 1 a cada 1,5 s (antes 0,7 s). Testado contra 2 s: com 2 s quase todo humano vencia sozinho.
- Humanos vencem se durarem 3 minutos. Zumbis vencem se infectarem todos.

## App Android (01/11/2026)
- `apk/Arena-Zumbi.apk`. Roda offline, em tela cheia e na horizontal. Co-op online funciona com internet.
- O GitHub gera o APK sozinho quando a pasta `android/` muda.

## Celular mais nítido (01/11/2026)
- A imagem no celular era desenhada em resolução baixa e ficava borrada. Agora usa até 1,75x a densidade da tela.

## Personagens do co-op (01/11/2026)
- Aliados remodelados: capacete, rosto, colete tático, mochila, botas e fuzil detalhado.
- Camisa em 4 cores (vermelha, azul, verde, amarela), sorteadas a cada sala. A cor aparece também na lista do time.

## Dois endereços (01/11/2026)
- Servidor online: arena-zumbi.playes.workers.dev. Jogo: play.arena-zumbi.play.
- O jogo e o servidor online agora ficam em projetos separados do Cloudflare. Veja o README.

## Ajustes (31/10/2026)
- Acentos corrigidos (o texto aparecia como "VocÃª", "MISSÃ£O").
- HUD do celular reorganizado: munição, aviso de onda, dica e botão MODO.
- Co-op: sala por nome e senha opcional. Sem código e sem endereço de servidor na tela.
- Dica de teclas não cobre mais a munição.

## Co-op online (31/10/2026)
- Correção: o mundo do anfitrião não congela mais com a aba em segundo plano.
- Até 4 jogadores por sala, com código de 5 letras.
- Anfitrião roda a partida. Cloudflare Worker repassa as mensagens.
- Aliados aparecem no jogo, no radar e na lista do time.
- Quem cai renasce na próxima onda. Entrada no meio da partida liberada.
- Nova aba "Co-op online" no menu.
- Teste local: `node online/dev-server.js`.

## Versão Windows (31/10/2026)
- `windows/Arena-Zumbi-Windows.zip`. Roda sem navegador e sem internet.
- F11 tela cheia. Ctrl+Q fecha.

## Segunda chance e Mochila dupla (24/10/2026)
- Segunda chance: volta com vida cheia, 4 s invencível, empurra zumbis num raio de 14 m.
- Mochila dupla: dobra também o limite de munição.
- Avisos na tela ao ativar. Itens não usados voltam ao estoque ao reiniciar.

## Mãos e armas
- Mãos remodeladas e animadas: recarga, tiro, faca.

## Chefes
- Vida dos chefes corrigida. Chefe sempre mais forte que zumbi comum.
- Extremo, onda 1: Mestre da Katana 2513, Colosso 4640.

## Loja e níveis
- Loja com melhorias, consumíveis, armas, facas e skins.
- Níveis Extremo e Apocalipse.
- Novos zumbis: Colosso Blindado, Mestre da Katana, Espectro.
- Código secreto `moedas50k`.
