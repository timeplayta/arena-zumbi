# Novidades — Arena Zumbi

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
