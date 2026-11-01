# Arena Zumbi

FPS 3D de zumbis que roda no navegador (uma página só, Three.js r128).

- `index.html` — o jogo pronto, é o que vai para o ar.
- `src/` — os arquivos-fonte. Depois de editar, rode `sh build.sh` para gerar o `index.html` de novo.

## Publicar no Render (site estático)
New > Static Site > escolha este repositório > Build Command vazio > Publish Directory `.`

## Versão para Windows (sem navegador)

Baixe `windows/Arena-Zumbi-Windows.zip`, descompacte e abra `Arena Zumbi.exe`.
Funciona sem internet. F11 alterna tela cheia; Ctrl+Q fecha.

## Co-op online (Cloudflare)

Até 4 jogadores. O anfitrião roda a partida; o Cloudflare só repassa mensagens (Worker + Durable Object).

**Publicar:** Cloudflare > Workers & Pages > Create > Import a repository > este repositório.
Deploy command: `npx wrangler deploy`. Sem build command. O jogo e o co-op ficam no mesmo endereço `*.workers.dev`.

**Jogar:** aba "Co-op online" > Criar sala > passe o código. Os outros digitam o código > Entrar. O anfitrião clica em Jogar.
No `.exe` ou fora do endereço do Worker, preencha o campo "Servidor online" com `seu-app.seu-usuario.workers.dev`.

**Testar local:** `node online/dev-server.js` e abra http://localhost:8787
