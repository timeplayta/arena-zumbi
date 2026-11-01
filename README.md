# Arena Zumbi

FPS 3D de zumbis que roda no navegador (uma página só, Three.js r128).

- `index.html` — o jogo pronto, é o que vai para o ar.
- `src/` — os arquivos-fonte. Depois de editar, rode `sh build.sh` para gerar o `index.html` de novo.

## Publicar no Render (site estático)
New > Static Site > escolha este repositório > Build Command vazio > Publish Directory `.`

## Versão para Windows (sem navegador)

Baixe `windows/Arena-Zumbi-Windows.zip`, descompacte e abra `Arena Zumbi.exe`.
Funciona sem internet. F11 alterna tela cheia; Ctrl+Q fecha.

## Dois endereços no Cloudflare

| Projeto | O que faz | Pasta raiz | Endereço |
|---|---|---|---|
| `arena-zumbi` | Servidor online (salas co-op; depois contas e placares) + também serve o jogo | `/` | arena-zumbi.playes.workers.dev |
| `arena-zumbi-play` | O jogo (site estático) | `game` | arena-zumbi-play.playes.workers.dev |

Em cada projeto: Workers & Pages > Create > Import a repository > este repositório.
No `arena-zumbi-play`, em Root directory, escreva `game` (opcional: sem isso ele usa a config da raiz, que também serve o jogo). Deploy command: `npx wrangler deploy`. Sem build command.

O endereço do servidor online fica em `DEFAULT_SERVER` (`src/znet.js`).

## Co-op online

Modos: Co-op (até 4) e Infecção (até 8). O anfitrião roda a partida; o Cloudflare só repassa mensagens (Worker + Durable Object).
Aba "Co-op online" > nome da sala (e senha, se quiser) > Criar sala. Os outros escrevem o mesmo nome e senha > Entrar na sala. O anfitrião clica em Jogar.

Teste local: `node online/dev-server.js` e abra http://localhost:8787

## Android (APK)

Baixe `apk/Arena-Zumbi.apk` e instale no celular (permita "fontes desconhecidas").
O GitHub Actions compila sozinho a cada mudança em `android/` (o jogo fica em `android/app/src/main/assets/index.html`).

## Ferramentas

`tools/mdl2json.py PASTA saida.json`: converte um modelo Source (`h.mdl`, `h.vvd`, `h.vtx` na PASTA) em malha + ossos + animações para o jogo.

## Atualização automática

`sh build.sh` gera `game/public/version.json` (versão = data/hora) e `game/public/index-offline.html`.
O `.exe` (`windows/app/main.js`) e o APK (`MainActivity.java`) comparam com a versão embutida ao abrir e baixam o jogo novo do Cloudflare.
O jogo mostra as novidades (primeira seção do CHANGELOG) uma vez depois de atualizar.
