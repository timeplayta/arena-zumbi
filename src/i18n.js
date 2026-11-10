  // ===================== IDIOMAS (inglês, espanhol, português) =====================
  // O jogo é escrito em português. Este tradutor troca, na tela, todo texto que aparece (menus, HUD, avisos, mensagens do servidor).
  // REGRA: todo texto novo do jogo precisa de uma entrada aqui (D = frase exata, P = frase com números/nomes). Veja I18N.md.
  const I18N = (() => {
    // "texto em português": ["inglês", "espanhol"]
    const D = {
      // ---------- menu principal e abas ----------
      "Tiro em primeira pessoa · 3D": ["First-person shooter · 3D", "Disparos en primera persona · 3D"],
      "Missão": ["Mission", "Misión"], "Arsenal": ["Arsenal", "Arsenal"], "Loja": ["Store", "Tienda"], "Personalizar": ["Customize", "Personalizar"],
      "Ajustes": ["Settings", "Ajustes"], "Recordes": ["High scores", "Récords"], "Online": ["Online", "En línea"], "Controles": ["Controls", "Controles"],
      "Sobrevivente": ["Survivor", "Superviviente"], "Nome no placar de recordes (o da sua conta)": ["Name on the high score board (your account name)", "Nombre en la tabla de récords (el de tu cuenta)"],
      "Dificuldade": ["Difficulty", "Dificultad"], "Ambiente": ["Environment", "Ambiente"], "Briefing": ["Briefing", "Informe"],
      "Você está preso numa arena fechada. As ondas de zumbis só aumentam: corredores a partir da onda 3, brutos blindados a partir da onda 5 e, nas dificuldades Veterano e Pesadelo, gigantes de mais de 3 metros com muita vida. Mire na cabeça, use as caixas como cobertura e escolha com cuidado o que leva no Arsenal.":
        ["You are trapped in a closed arena. The zombie waves only grow: runners from wave 3, armored brutes from wave 5 and, on Veteran and Nightmare, giants over 3 meters tall with lots of health. Aim for the head, use the crates as cover and choose your Arsenal carefully.",
         "Estás atrapado en una arena cerrada. Las oleadas de zombis no paran de crecer: corredores desde la oleada 3, brutos blindados desde la oleada 5 y, en Veterano y Pesadilla, gigantes de más de 3 metros con mucha vida. Apunta a la cabeza, usa las cajas como cobertura y elige bien lo que llevas en el Arsenal."],
      "Níveis extremos.": ["Extreme levels.", "Niveles extremos."], "No": ["In", "En"], "e no": ["and", "y en"],
      "entram três zumbis lendários: o": ["three legendary zombies appear: the", "aparecen tres zombis legendarios: el"],
      "Colosso Blindado": ["Armored Colossus", "Coloso Blindado"],
      "(gigante de armadura de guerra com escudo de choque; o escudo para os tiros de frente, então flanqueie ou espere ele se cansar depois da investida), o":
        ["(a giant in war armor with a riot shield; the shield stops shots from the front, so flank him or wait for him to tire after his charge), the",
         "(gigante con armadura de guerra y escudo antidisturbios; el escudo para los disparos de frente, así que flanquéalo o espera a que se canse tras la embestida), el"],
      "Mestre da Katana": ["Katana Master", "Maestro de la Katana"],
      "(velho ágil que saca, esquiva de tiros e golpeia em combo) e, só no Apocalipse, o": ["(an agile old man who draws, dodges bullets and strikes in combos) and, only in Apocalypse, the", "(un anciano ágil que desenvaina, esquiva balas y golpea en combo) y, solo en Apocalipsis, el"],
      "Espectro": ["Specter", "Espectro"],
      ": invisível e imune até se materializar para erguer uma espada gigante e rachar o chão. As rachaduras queimam e te atrasam por 10 segundos. Ganhe moedas e gaste na Loja.":
        [": invisible and immune until he materializes to raise a giant sword and split the ground. The cracks burn and slow you for 10 seconds. Earn coins and spend them in the Store.",
         ": invisible e inmune hasta que se materializa para alzar una espada gigante y partir el suelo. Las grietas queman y te frenan durante 10 segundos. Gana monedas y gástalas en la Tienda."],
      "Jogar": ["Play", "Jugar"], "Jogar de novo": ["Play again", "Jugar de nuevo"],
      // ---------- dificuldades e ambientes ----------
      "Recruta": ["Recruit", "Recluta"], "Zumbis mais fracos e lentos, munição de sobra.": ["Weaker, slower zombies and plenty of ammo.", "Zombis más débiles y lentos, munición de sobra."],
      "Soldado": ["Soldier", "Soldado"], "A experiência padrão da arena.": ["The standard arena experience.", "La experiencia estándar de la arena."],
      "Veterano": ["Veteran", "Veterano"], "Zumbis com 60% mais vida, rápidos, e um gigante a cada 3 ondas a partir da 6.": ["Zombies with 60% more health, fast, and a giant every 3 waves from wave 6.", "Zombis con 60% más vida, rápidos, y un gigante cada 3 oleadas desde la 6."],
      "Pesadelo": ["Nightmare", "Pesadilla"], "Zumbis com 140% mais vida, hordas enormes e gigantes a cada 2 ondas a partir da 4.": ["Zombies with 140% more health, huge hordes and giants every 2 waves from wave 4.", "Zombis con 140% más vida, hordas enormes y gigantes cada 2 oleadas desde la 4."],
      "Extremo": ["Extreme", "Extremo"], "Três vezes mais vida, hordas gigantescas, Colosso Blindado e o Mestre da Katana. Quase impossível.": ["Three times the health, gigantic hordes, the Armored Colossus and the Katana Master. Nearly impossible.", "El triple de vida, hordas gigantescas, el Coloso Blindado y el Maestro de la Katana. Casi imposible."],
      "Apocalipse": ["Apocalypse", "Apocalipsis"], "O fim. Tudo do Extremo, em dobro, e o Espectro da Espada que ninguém consegue ver.": ["The end. Everything from Extreme, doubled, plus the Sword Specter nobody can see.", "El fin. Todo lo del Extremo, al doble, y el Espectro de la Espada que nadie puede ver."],
      "Tarde italiana": ["Italian afternoon", "Tarde italiana"], "Sol baixo e céu dourado.": ["Low sun and a golden sky.", "Sol bajo y cielo dorado."],
      "Noite": ["Night", "Noche"], "Escuridão e lâmpadas âmbar.": ["Darkness and amber lamps.", "Oscuridad y lámparas ámbar."],
      "Crepúsculo": ["Dusk", "Crepúsculo"], "Céu alaranjado, visão mais longa.": ["Orange sky, longer view.", "Cielo anaranjado, visión más larga."],
      "Névoa densa": ["Thick fog", "Niebla densa"], "Os zumbis surgem do nada.": ["Zombies appear out of nowhere.", "Los zombis aparecen de la nada."],
      "Tempestade": ["Storm", "Tormenta"], "Chuva, trovões e relâmpagos.": ["Rain, thunder and lightning.", "Lluvia, truenos y relámpagos."],
      // ---------- armas ----------
      "Pistola": ["Pistol", "Pistola"], "Pistola .45 confiável. Rápida de sacar, boa de reserva.": ["Reliable .45 pistol. Quick to draw, a good backup.", "Pistola .45 confiable. Rápida de desenfundar, buena de reserva."],
      "Submetralhadora": ["Submachine gun", "Subfusil"], "Cadência altíssima e mobilidade. Perde força à distância.": ["Very high fire rate and mobility. Loses power at range.", "Cadencia altísima y movilidad. Pierde fuerza a distancia."],
      "Empunhadura vertical": ["Vertical grip", "Empuñadura vertical"], "Fuzil AX-4": ["AX-4 Rifle", "Fusil AX-4"], "Fuzil de assalto": ["Assault rifle", "Fusil de asalto"],
      "Equilibrado em tudo. Boa escolha para quem está começando.": ["Balanced in everything. A good choice for beginners.", "Equilibrado en todo. Buena opción para empezar."],
      "Escopeta": ["Shotgun", "Escopeta"], "Nove projéteis por tiro. Devastadora de perto, recarga cartucho a cartucho.": ["Nine pellets per shot. Devastating up close, reloads shell by shell.", "Nueve perdigones por disparo. Devastadora de cerca, recarga cartucho a cartucho."],
      "Choke (agrupa os tiros)": ["Choke (tighter spread)", "Choke (agrupa los disparos)"], "Falcão .308": ["Falcon .308", "Halcón .308"], "Rifle de precisão": ["Sniper rifle", "Rifle de precisión"],
      "Um tiro, uma baixa. Perfura até três alvos. Segure Shift para prender a respiração.": ["One shot, one kill. Pierces up to three targets. Hold Shift to hold your breath.", "Un disparo, una baja. Atraviesa hasta tres objetivos. Mantén Shift para contener la respiración."],
      "Apoio ajustável": ["Adjustable rest", "Apoyo ajustable"], "Revólver Trovão .50": ["Thunder .50 Revolver", "Revólver Trueno .50"], "Revólver": ["Revolver", "Revólver"],
      "Seis tiros de pura força. Uma bala na cabeça derruba qualquer zumbi comum; o coice é brutal.": ["Six shots of pure power. One bullet to the head drops any common zombie; the kick is brutal.", "Seis tiros de pura potencia. Una bala en la cabeza derriba a cualquier zombi común; el retroceso es brutal."],
      "Titã M-60": ["Titan M-60", "Titán M-60"], "Metralhadora leve": ["Light machine gun", "Ametralladora ligera"],
      "Cinto de 100 balas e fogo de supressão. Pesada e lenta para recarregar, mas ninguém passa.": ["100-round belt and suppressive fire. Heavy and slow to reload, but nobody gets through.", "Cinta de 100 balas y fuego de supresión. Pesada y lenta de recargar, pero nadie pasa."],
      "Bipé rebatível": ["Folding bipod", "Bípode plegable"],
      "Silenciador": ["Suppressor", "Silenciador"], "Sem clarão e som abafado. Dano -10%, menos recuo.": ["No muzzle flash and muffled sound. Damage -10%, less recoil.", "Sin fogonazo y sonido amortiguado. Daño -10%, menos retroceso."],
      "Carregador estendido": ["Extended magazine", "Cargador extendido"], "Mira óptica": ["Optical sight", "Mira óptica"], "Mais zoom e mais precisão ao mirar.": ["More zoom and more accuracy when aiming.", "Más zoom y más precisión al apuntar."],
      "Projéteis 35% mais agrupados.": ["Pellets 35% tighter.", "Perdigones 35% más agrupados."], "Menos tremor e menos recuo.": ["Less sway and less recoil.", "Menos temblor y menos retroceso."], "Recuo 25% menor.": ["25% less recoil.", "25% menos retroceso."],
      "Alcance e dano por distância": ["Range and damage by distance", "Alcance y daño por distancia"], "Recuo": ["Recoil", "Retroceso"], "Acessórios": ["Attachments", "Accesorios"],
      "Tiro no corpo": ["Body shot", "Disparo al cuerpo"], "Dano total até": ["Full damage up to", "Daño total hasta"], "Dano mínimo em": ["Minimum damage at", "Daño mínimo a"], "Alcance máximo": ["Maximum range", "Alcance máximo"], "A 30 m faz": ["At 30 m it does", "A 30 m hace"],
      "% do dano": ["% of the damage", "% del daño"], "Distância": ["Distance", "Distancia"], "Tiros p/ abater (corpo)": ["Shots to kill (body)", "Disparos para abatir (cuerpo)"], "Tiros p/ abater (cabeça)": ["Shots to kill (head)", "Disparos para abatir (cabeza)"], "Dano por tiro": ["Damage per shot", "Daño por disparo"],
      "Zumbi comum = 100 de vida (sobe a cada onda e nas dificuldades altas). Pernas recebem 65% do dano.": ["Common zombie = 100 health (rises each wave and on higher difficulties). Legs take 65% damage.", "Zombi común = 100 de vida (sube en cada oleada y en las dificultades altas). Las piernas reciben el 65% del daño."],
      "Dano por distância": ["Damage by distance", "Daño por distancia"], "100 = um zumbi comum": ["100 = a common zombie", "100 = un zombi común"], "Padrão de recuo": ["Recoil pattern", "Patrón de retroceso"],
      "1º tiro": ["1st shot", "1.er disparo"], "Muito rápida": ["Very fast", "Muy rápida"], "Rápida": ["Fast", "Rápida"], "Lenta": ["Slow", "Lenta"], "Normal": ["Normal", "Normal"],
      "Sobe por tiro": ["Climb per shot", "Sube por disparo"], "Desvio lateral": ["Side drift", "Desvío lateral"], "Acumula em rajada": ["Builds up in bursts", "Se acumula en ráfaga"], "Recuperação": ["Recovery", "Recuperación"],
      "Parte do coice sobe a mira e fica lá: puxe o mouse para baixo em rajadas longas. Mirar, agachar e usar empunhadura reduzem o recuo.": ["Part of the kick raises your aim and stays there: pull the mouse down on long bursts. Aiming, crouching and using a grip reduce recoil.", "Parte del retroceso sube la mira y se queda ahí: tira del ratón hacia abajo en ráfagas largas. Apuntar, agacharse y usar empuñadura reducen el retroceso."],
      "Parte do coice sobe a mira e fica lá: puxe o mouse para baixo em rajadas longas. Mirar, agachar reduzem o recuo.": ["Part of the kick raises your aim and stays there: pull the mouse down on long bursts. Aiming and crouching reduce recoil.", "Parte del retroceso sube la mira y se queda ahí: tira del ratón hacia abajo en ráfagas largas. Apuntar y agacharse reducen el retroceso."],
      "Secundária (tecla 2)": ["Secondary (key 2)", "Secundaria (tecla 2)"], "Primária (tecla 1)": ["Primary (key 1)", "Primaria (tecla 1)"], "Secundária": ["Secondary", "Secundaria"], "Primária": ["Primary", "Primaria"],
      "Na loja · ver": ["In the store · view", "En la tienda · ver"], "Cadência": ["Fire rate", "Cadencia"], "Alcance útil": ["Effective range", "Alcance útil"], "Controle": ["Control", "Control"], "Precisão": ["Accuracy", "Precisión"], "Mobilidade": ["Mobility", "Movilidad"],
      // ---------- loja ----------
      "Suas moedas": ["Your coins", "Tus monedas"], "Comprar moedas": ["Buy coins", "Comprar monedas"],
      "Novo trailer": ["New trailer", "Nuevo tráiler"], "Estreia do trailer": ["Trailer premiere", "Estreno del tráiler"], "Arena Zumbi — Trailer oficial": ["Arena Zumbi — Official trailer", "Arena Zumbi — Tráiler oficial"],
      "Você ganha moedas em toda partida: abates, ondas vencidas, headshots e zumbis especiais. Dificuldades mais altas pagam mais. Tudo que você compra fica salvo na sua conta.": ["You earn coins every match: kills, waves cleared, headshots and special zombies. Higher difficulties pay more. Everything you buy is saved to your account.", "Ganas monedas en cada partida: bajas, oleadas superadas, headshots y zombis especiales. Las dificultades más altas pagan más. Todo lo que compras se guarda en tu cuenta."],
      "Melhorias permanentes": ["Permanent upgrades", "Mejoras permanentes"], "Itens de uma partida": ["One-match items", "Objetos de una partida"], "Armas de fogo": ["Firearms", "Armas de fuego"],
      "Armas brancas (tecla 3 pega a faca)": ["Melee weapons (key 3 draws the knife)", "Armas blancas (la tecla 3 saca el cuchillo)"], "Acabamentos de arma": ["Weapon finishes", "Acabados de arma"],
      "Vida máxima": ["Max health", "Vida máxima"], "+10 de vida máxima por nível.": ["+10 max health per level.", "+10 de vida máxima por nivel."],
      "Armadura base": ["Base armor", "Armadura base"], "+25 de armadura por nível. A armadura absorve 60% do dano que você leva.": ["+25 armor per level. Armor absorbs 60% of the damage you take.", "+25 de armadura por nivel. La armadura absorbe el 60% del daño que recibes."],
      "Munição reforçada": ["Reinforced ammo", "Munición reforzada"], "+5% de dano em todas as armas de fogo, por nível.": ["+5% damage with all firearms, per level.", "+5% de daño en todas las armas de fuego, por nivel."],
      "Recarga rápida": ["Fast reload", "Recarga rápida"], "Recarrega 7% mais rápido, por nível.": ["Reloads 7% faster, per level.", "Recarga un 7% más rápido, por nivel."],
      "Mochila de munição": ["Ammo backpack", "Mochila de munición"], "+10% de munição de reserva no começo, por nível.": ["+10% reserve ammo at the start, per level.", "+10% de munición de reserva al empezar, por nivel."],
      "Ímã de itens": ["Item magnet", "Imán de objetos"], "+25% de alcance para puxar vida e munição, por nível.": ["+25% range to pull in health and ammo, per level.", "+25% de alcance para atraer vida y munición, por nivel."],
      "Fôlego": ["Stamina", "Aliento"], "O fôlego gasta 10% mais devagar, por nível.": ["Stamina drains 10% slower, per level.", "El aliento se gasta un 10% más despacio, por nivel."],
      "Bolsa de poções": ["Potion bag", "Bolsa de pociones"], "Modo Infecção: toda partida começa com 2 molotovs e 2 poções de cura. Cada nível dá +1 de cada (até 5).": ["Infection mode: every match starts with 2 molotovs and 2 healing potions. Each level gives +1 of each (up to 5).", "Modo Infección: cada partida empieza con 2 molotovs y 2 pociones de curación. Cada nivel da +1 de cada (hasta 5)."],
      "Colete de kevlar": ["Kevlar vest", "Chaleco de kevlar"], "Começa a próxima partida com +50 de armadura.": ["Start the next match with +50 armor.", "Empieza la próxima partida con +50 de armadura."],
      "Mochila dupla": ["Double backpack", "Mochila doble"], "Dobra a munição de reserva (e o limite) durante a partida.": ["Doubles reserve ammo (and the cap) during the match.", "Duplica la munición de reserva (y el límite) durante la partida."],
      "Segunda chance": ["Second chance", "Segunda oportunidad"], "Se você morrer, volta com a vida CHEIA, 4 s invencível e joga os zumbis longe. Só gasta se você realmente morrer.": ["If you die, you come back with FULL health, 4 s invincible and knock zombies away. Only used if you actually die.", "Si mueres, vuelves con la vida LLENA, 4 s invencible y lanzas lejos a los zombis. Solo se gasta si realmente mueres."],
      "Faca de combate": ["Combat knife", "Cuchillo de combate"], "A de sempre. Rápida e discreta.": ["The usual one. Fast and discreet.", "El de siempre. Rápido y discreto."],
      "Facão": ["Machete", "Machete"], "Mais dano e golpe rápido.": ["More damage and fast swings.", "Más daño y golpe rápido."], "Katana": ["Katana", "Katana"], "Alcance maior, corte veloz e muito afiada.": ["Longer reach, fast cuts and very sharp.", "Mayor alcance, corte veloz y muy afilada."],
      "Machado de bombeiro": ["Fire axe", "Hacha de bombero"], "Lento, mas parte qualquer zumbi comum ao meio.": ["Slow, but splits any common zombie in half.", "Lento, pero parte a cualquier zombi común por la mitad."],
      "Comprar": ["Buy", "Comprar"], "Equipar": ["Equip", "Equipar"], "EQUIPADA": ["EQUIPPED", "EQUIPADA"], "EM USO": ["IN USE", "EN USO"], "COMPRADA": ["OWNED", "COMPRADA"], "Ver no Arsenal": ["View in Arsenal", "Ver en el Arsenal"],
      "NÍVEL MÁXIMO": ["MAX LEVEL", "NIVEL MÁXIMO"], "Usar: sim": ["Use: yes", "Usar: sí"], "Usar: não": ["Use: no", "Usar: no"], "+ comprar": ["+ buy", "+ comprar"], "MOEDAS NA SUA CONTA": ["COINS IN YOUR ACCOUNT", "MONEDAS EN TU CUENTA"],
      // ---------- personalizar ----------
      "Acabamento das armas": ["Weapon finish", "Acabado de las armas"], "Mira": ["Crosshair", "Mira"], "Tamanho da mira": ["Crosshair size", "Tamaño de la mira"],
      "Preto tático": ["Tactical black", "Negro táctico"], "Deserto": ["Desert", "Desierto"], "Floresta": ["Forest", "Bosque"], "Urbano": ["Urban", "Urbano"], "Carmesim": ["Crimson", "Carmesí"], "Ártico": ["Arctic", "Ártico"],
      "Ouro 24k": ["24k Gold", "Oro 24k"], "Cromado": ["Chrome", "Cromado"], "Neon ciano": ["Cyan neon", "Neón cian"], "Sangue seco": ["Dried blood", "Sangre seca"], "Espectral": ["Spectral", "Espectral"],
      "Branco": ["White", "Blanco"], "Âmbar": ["Amber", "Ámbar"], "Verde": ["Green", "Verde"], "Ciano": ["Cyan", "Cian"], "Vermelho": ["Red", "Rojo"], "Rosa": ["Pink", "Rosa"],
      "Cruz": ["Cross", "Cruz"], "Cruz em T": ["T cross", "Cruz en T"], "Ponto": ["Dot", "Punto"], "Círculo": ["Circle", "Círculo"],
      // ---------- ajustes ----------
      "Gráficos": ["Graphics", "Gráficos"], "Qualidade (predefinição)": ["Quality (preset)", "Calidad (predefinida)"], "Sombras": ["Shadows", "Sombras"], "Resolução": ["Resolution", "Resolución"],
      "Partículas (sangue, fumaça, faíscas)": ["Particles (blood, smoke, sparks)", "Partículas (sangre, humo, chispas)"], "Limite de quadros por segundo": ["Frame rate limit", "Límite de fotogramas por segundo"],
      "Campo de visão": ["Field of view", "Campo de visión"], "Sangue e efeitos de impacto": ["Blood and impact effects", "Sangre y efectos de impacto"], "Chuva visível (ambiente Tempestade)": ["Visible rain (Storm environment)", "Lluvia visible (ambiente Tormenta)"],
      "Balanço da câmera ao andar": ["Camera bob when walking", "Balanceo de cámara al caminar"], "Mostrar FPS na tela": ["Show FPS on screen", "Mostrar FPS en pantalla"],
      "Som": ["Sound", "Sonido"], "Volume geral": ["Master volume", "Volumen general"], "Tiros e efeitos": ["Shots and effects", "Disparos y efectos"], "Gemidos dos zumbis": ["Zombie groans", "Gemidos de los zombis"], "Ambiente (vento, chuva, trovões)": ["Ambience (wind, rain, thunder)", "Ambiente (viento, lluvia, truenos)"],
      "Celular e toque": ["Mobile and touch", "Móvil y táctil"], "Controles de toque na tela": ["On-screen touch controls", "Controles táctiles en pantalla"], "Sensibilidade do toque": ["Touch sensitivity", "Sensibilidad táctil"],
      "Tamanho dos botões": ["Button size", "Tamaño de los botones"], "Opacidade dos botões": ["Button opacity", "Opacidad de los botones"], "Tamanho do HUD": ["HUD size", "Tamaño del HUD"], "Posicionar botões na tela": ["Position on-screen buttons", "Colocar botones en pantalla"],
      "Tiro automático quando a mira passa num zumbi": ["Auto-fire when the crosshair passes over a zombie", "Disparo automático cuando la mira pasa por un zombi"], "Vibrar ao levar dano": ["Vibrate when taking damage", "Vibrar al recibir daño"], "Tela cheia ao começar": ["Fullscreen on start", "Pantalla completa al empezar"],
      "Mouse e teclado": ["Mouse and keyboard", "Ratón y teclado"], "Sensibilidade do mouse": ["Mouse sensitivity", "Sensibilidad del ratón"], "Sensibilidade ao mirar": ["Aiming sensitivity", "Sensibilidad al apuntar"], "Inverter eixo vertical": ["Invert vertical axis", "Invertir eje vertical"],
      "Interface": ["Interface", "Interfaz"], "Mostrar radar": ["Show radar", "Mostrar radar"], "Mostrar dicas de controle no início": ["Show control tips at the start", "Mostrar consejos de control al inicio"], "Restaurar padrões": ["Restore defaults", "Restaurar valores"], "Idioma": ["Language", "Idioma"],
      "Baixa": ["Low", "Baja"], "Celulares e PCs modestos.": ["Phones and modest PCs.", "Móviles y PCs modestos."], "Média": ["Medium", "Media"], "Equilíbrio entre beleza e desempenho.": ["Balance between looks and performance.", "Equilibrio entre belleza y rendimiento."],
      "Alta": ["High", "Alta"], "Sombras da lua e da lanterna, tudo no máximo.": ["Moon and flashlight shadows, everything maxed.", "Sombras de la luna y la linterna, todo al máximo."],
      "Desligadas": ["Off", "Desactivadas"], "Mais rápido.": ["Faster.", "Más rápido."], "Lanterna": ["Flashlight", "Linterna"], "Só a lanterna projeta sombra.": ["Only the flashlight casts shadows.", "Solo la linterna proyecta sombra."],
      "Completas": ["Full", "Completas"], "Lua e lanterna. Mais pesado.": ["Moon and flashlight. Heavier.", "Luna y linterna. Más pesado."],
      "Poucas": ["Few", "Pocas"], "Menos sangue, fumaça e faíscas.": ["Less blood, smoke and sparks.", "Menos sangre, humo y chispas."], "Muitas": ["Many", "Muchas"], "Mais partículas.": ["More particles.", "Más partículas."],
      "Economiza bateria.": ["Saves battery.", "Ahorra batería."], "Sem limite": ["No limit", "Sin límite"], "O máximo da tela.": ["As fast as the screen allows.", "Lo máximo de la pantalla."],
      "Automático": ["Automatic", "Automático"], "Liga em telas de toque.": ["On for touch screens.", "Se activa en pantallas táctiles."], "Sempre": ["Always", "Siempre"], "Nunca": ["Never", "Nunca"], "Só teclado e mouse.": ["Keyboard and mouse only.", "Solo teclado y ratón."],
      "LIGADO": ["ON", "ACTIVADO"], "DESLIGADO": ["OFF", "DESACTIVADO"],
      // ---------- recordes ----------
      "Nome": ["Name", "Nombre"], "Pontos": ["Score", "Puntos"], "Onda": ["Wave", "Oleada"], "Abates": ["Kills", "Bajas"],
      "Nenhuma partida registrada ainda. Sobreviva às ondas para entrar no placar.": ["No matches recorded yet. Survive the waves to get on the board.", "Aún no hay partidas registradas. Sobrevive a las oleadas para entrar en la tabla."],
      // ---------- online ----------
      "Modo": ["Mode", "Modo"], "Co-op": ["Co-op", "Cooperativo"], "Até 4 jogadores contra as ondas de zumbis, juntos. Quem cair renasce na próxima onda.": ["Up to 4 players against the zombie waves, together. Whoever falls respawns next wave.", "Hasta 4 jugadores contra las oleadas de zombis, juntos. Quien caiga reaparece en la siguiente oleada."],
      "Infecção": ["Infection", "Infección"], "Até 12 jogadores na vila italiana (casas, morros, boosters), com bots opcionais. Um a cada 6 começa zumbi e infecta os outros. Humanos vencem se durarem 3 minutos.":
        ["Up to 12 players in the Italian village (houses, hills, boosters), with optional bots. One in every 6 starts as a zombie and infects the others. Humans win if they last 3 minutes.",
         "Hasta 12 jugadores en el pueblo italiano (casas, colinas, potenciadores), con bots opcionales. Uno de cada 6 empieza como zombi e infecta a los demás. Los humanos ganan si aguantan 3 minutos."],
      "Quem cria a sala escolhe o modo. Quem entra segue o modo da sala.": ["Whoever creates the room picks the mode. Whoever joins follows the room's mode.", "Quien crea la sala elige el modo. Quien entra sigue el modo de la sala."],
      "Nome da sala": ["Room name", "Nombre de la sala"], "Senha (opcional)": ["Password (optional)", "Contraseña (opcional)"], "Criar sala": ["Create room", "Crear sala"], "Entrar na sala": ["Join room", "Entrar a la sala"],
      "Infecção offline (bots)": ["Offline infection (bots)", "Infección sin conexión (bots)"], "Sala": ["Room", "Sala"], "Sair da sala": ["Leave room", "Salir de la sala"],
      "ex.: Turma do Zé": ["e.g.: Joe's crew", "ej.: Los de Pepe"], "deixe vazio para sala aberta": ["leave empty for an open room", "déjalo vacío para una sala abierta"],
      "Aliado": ["Ally", "Aliado"], "Anfitrião": ["Host", "Anfitrión"], "anfitrião": ["host", "anfitrión"], "você": ["you", "tú"],
      "Infecção offline · você + 11 bots": ["Offline infection · you + 11 bots", "Infección sin conexión · tú + 11 bots"], "Infecção · até 12 jogadores": ["Infection · up to 12 players", "Infección · hasta 12 jugadores"], "bots completam a sala": ["bots fill the room", "bots completan la sala"], "Co-op · até 4 jogadores": ["Co-op · up to 4 players", "Cooperativo · hasta 4 jugadores"],
      "Partida em andamento. Quem entrar agora cai direto no jogo.": ["Match in progress. Anyone joining now drops straight into the game.", "Partida en curso. Quien entre ahora cae directo en el juego."],
      "Quando todos entrarem, clique em Jogar (embaixo) para começar.": ["When everyone has joined, click Play (below) to start.", "Cuando todos hayan entrado, haz clic en Jugar (abajo) para empezar."],
      "Partida em andamento.": ["Match in progress.", "Partida en curso."], "Aguardando o anfitrião iniciar a partida.": ["Waiting for the host to start the match.", "Esperando a que el anfitrión inicie la partida."],
      "Aguardando anfitrião": ["Waiting for host", "Esperando al anfitrión"], "Iniciar infecção": ["Start infection", "Iniciar infección"], "Jogar em co-op": ["Play co-op", "Jugar en cooperativo"],
      "O nome da sala precisa de pelo menos 3 letras ou números.": ["The room name needs at least 3 letters or numbers.", "El nombre de la sala necesita al menos 3 letras o números."],
      "Conectando...": ["Connecting...", "Conectando..."], "Não consegui conectar ao servidor.": ["Couldn't connect to the server.", "No pude conectar con el servidor."], "Conexão encerrada.": ["Connection closed.", "Conexión cerrada."],
      "Sala criada. Passe o nome (e a senha) aos amigos.": ["Room created. Share the name (and password) with your friends.", "Sala creada. Pasa el nombre (y la contraseña) a tus amigos."], "Você entrou na sala.": ["You joined the room.", "Entraste a la sala."],
      "Erro.": ["Error.", "Error."], "O anfitrião saiu da sala.": ["The host left the room.", "El anfitrión salió de la sala."], "Offline": ["Offline", "Sin conexión"], "Sala offline com bots.": ["Offline room with bots.", "Sala sin conexión con bots."],
      "Só o anfitrião inicia a partida.": ["Only the host can start the match.", "Solo el anfitrión inicia la partida."],
      "Essa sala já existe. Escolha outro nome.": ["That room already exists. Pick another name.", "Esa sala ya existe. Elige otro nombre."], "Sala não encontrada. Confira o nome.": ["Room not found. Check the name.", "Sala no encontrada. Revisa el nombre."],
      // ---------- controles ----------
      "Celular": ["Mobile", "Móvil"], "Lado esquerdo": ["Left side", "Lado izquierdo"], "Arraste para andar. Empurre até o fim para correr": ["Drag to walk. Push all the way to run", "Arrastra para caminar. Empuja hasta el final para correr"],
      "Lado direito": ["Right side", "Lado derecho"], "Arraste para olhar em volta": ["Drag to look around", "Arrastra para mirar alrededor"], "Atirar (segure e arraste para mirar junto)": ["Shoot (hold and drag to aim at the same time)", "Disparar (mantén y arrastra para apuntar a la vez)"],
      "Mirar com zoom (toque liga/desliga)": ["Zoom aim (tap toggles)", "Apuntar con zoom (toque activa/desactiva)"], "Recarregar": ["Reload", "Recargar"], "trocar arma": ["switch weapon", "cambiar arma"], "faca": ["knife", "cuchillo"],
      "Agachar": ["Crouch", "Agacharse"], "pausar": ["pause", "pausar"], "lanterna": ["flashlight", "linterna"],
      "Teclado (clique para trocar a tecla)": ["Keyboard (click to change the key)", "Teclado (haz clic para cambiar la tecla)"],
      "Clique numa tecla e aperte a nova. Se ela já estiver em uso, as duas trocam de lugar. Esc cancela.": ["Click a key and press the new one. If it's already in use, the two swap places. Esc cancels.", "Haz clic en una tecla y pulsa la nueva. Si ya está en uso, las dos se intercambian. Esc cancela."],
      "Restaurar teclas padrão": ["Restore default keys", "Restaurar teclas predeterminadas"], "Mouse": ["Mouse", "Ratón"], "Mirar (ou setas do teclado)": ["Look (or keyboard arrows)", "Mirar (o flechas del teclado)"],
      "Clique": ["Click", "Clic"], "Atirar": ["Shoot", "Disparar"], "Botão direito": ["Right button", "Botón derecho"], "Mirar com zoom": ["Zoom aim", "Apuntar con zoom"], "Roda": ["Wheel", "Rueda"], "Trocar de arma": ["Switch weapon", "Cambiar de arma"],
      "Esc": ["Esc", "Esc"], "Pausar": ["Pause", "Pausar"], "Dicas": ["Tips", "Consejos"],
      "Tiro na cabeça multiplica o dano. Tiros nas pernas diminuem o dano, mas deixam o zumbi lento. A escopeta perde força rápido com a distância, e o Falcão atravessa vários zumbis em linha. Os zumbis largam vida (verde) e munição (amarelo). Se o mouse não travar na tela, use as setas do teclado para olhar.":
        ["Headshots multiply damage. Leg shots deal less damage but slow the zombie down. The shotgun loses power quickly with distance, and the Falcon pierces several zombies in a line. Zombies drop health (green) and ammo (yellow). If the mouse doesn't lock to the screen, use the keyboard arrows to look.",
         "Los disparos a la cabeza multiplican el daño. Los disparos a las piernas hacen menos daño pero ralentizan al zombi. La escopeta pierde fuerza rápido con la distancia, y el Halcón atraviesa varios zombis en línea. Los zombis sueltan vida (verde) y munición (amarillo). Si el ratón no se bloquea en la pantalla, usa las flechas del teclado para mirar."],
      "Andar para frente": ["Move forward", "Avanzar"], "Andar para trás": ["Move back", "Retroceder"], "Andar para a esquerda": ["Move left", "Moverse a la izquierda"], "Andar para a direita": ["Move right", "Moverse a la derecha"],
      "Correr / prender a respiração": ["Sprint / hold breath", "Correr / contener la respiración"], "Arma 1": ["Weapon 1", "Arma 1"], "Arma 2": ["Weapon 2", "Arma 2"], "Pegar / guardar a faca": ["Draw / holster the knife", "Sacar / guardar el cuchillo"],
      "Modo de tiro (auto / semi / rajada)": ["Fire mode (auto / semi / burst)", "Modo de disparo (auto / semi / ráfaga)"], "Som liga/desliga": ["Sound on/off", "Sonido sí/no"], "Pausar (Esc sempre pausa)": ["Pause (Esc always pauses)", "Pausar (Esc siempre pausa)"],
      "Poção de fogo (Infecção)": ["Fire potion (Infection)", "Poción de fuego (Infección)"], "Poção de cura (Infecção)": ["Healing potion (Infection)", "Poción de curación (Infección)"], "Alternar poções (Infecção)": ["Cycle potions (Infection)", "Alternar pociones (Infección)"],
      "Aperte uma tecla…": ["Press a key…", "Pulsa una tecla…"], "Shift dir.": ["Right Shift", "Shift der."], "Ctrl dir.": ["Right Ctrl", "Ctrl der."], "Espaço": ["Space", "Espacio"],
      "Esquerda: arraste para andar (empurre até o fim para correr) · Direita: arraste para olhar · ● atirar · ◎ mirar": ["Left: drag to walk (push all the way to run) · Right: drag to look · ● shoot · ◎ aim", "Izquierda: arrastra para caminar (empuja hasta el final para correr) · Derecha: arrastra para mirar · ● disparar · ◎ apuntar"],
      "WASD mover · Mouse mirar · Clique atirar · Botão direito mirar · R recarregar · 1/2 ou roda trocar arma · C agachar · 3 pegar faca · B modo de tiro · Shift correr · F lanterna · Esc pausar": ["WASD move · Mouse look · Click shoot · Right button aim · R reload · 1/2 or wheel switch weapon · C crouch · 3 draw knife · B fire mode · Shift sprint · F flashlight · Esc pause", "WASD moverse · Ratón mirar · Clic disparar · Botón derecho apuntar · R recargar · 1/2 o rueda cambiar arma · C agacharse · 3 sacar cuchillo · B modo de disparo · Shift correr · F linterna · Esc pausar"],
      "Mouse mirar": ["Mouse look", "Ratón mirar"], "Clique atirar": ["Click shoot", "Clic disparar"], "Botão direito mirar": ["Right button aim", "Botón derecho apuntar"], "Esc pausar": ["Esc pause", "Esc pausar"],
      // ---------- toque (botões na tela) ----------
      "ANDAR": ["MOVE", "MOVER"], "MODO": ["MODE", "MODO"], "FOGO": ["FIRE", "FUEGO"], "CURA": ["HEAL", "CURA"], "Gire o celular para jogar na horizontal": ["Rotate your phone to play in landscape", "Gira el móvil para jugar en horizontal"],
      "Arraste os botões para onde quiser": ["Drag the buttons wherever you want", "Arrastra los botones adonde quieras"], "Restaurar": ["Reset", "Restaurar"], "Pronto": ["Done", "Listo"],
      "Armadura": ["Armor", "Armadura"], "Mirar": ["Aim", "Apuntar"], "Trocar arma": ["Switch weapon", "Cambiar arma"], "Faca": ["Knife", "Cuchillo"], "Modo de tiro": ["Fire mode", "Modo de disparo"],
      "Poção de fogo": ["Fire potion", "Poción de fuego"], "Poção de cura": ["Healing potion", "Poción de curación"], "Tiro automático": ["Auto-fire", "Disparo automático"],
      // ---------- conta e entrada ----------
      "Bem-vindo": ["Welcome", "Bienvenido"], "Entre com seu nome e senha, ou crie uma conta nova. Suas moedas e compras ficam salvas na conta.": ["Sign in with your name and password, or create a new account. Your coins and purchases are saved to the account.", "Entra con tu nombre y contraseña, o crea una cuenta nueva. Tus monedas y compras se guardan en la cuenta."],
      "Senha": ["Password", "Contraseña"], "Este jogo tem violência, sangue e criaturas assustadoras. Jogue com atenção ao seu bem-estar e faça pausas.": ["This game has violence, blood and scary creatures. Play with care for your well-being and take breaks.", "Este juego tiene violencia, sangre y criaturas aterradoras. Juega cuidando tu bienestar y haz pausas."],
      "Entrar": ["Sign in", "Entrar"], "Criar conta": ["Create account", "Crear cuenta"], "Jogar sem internet": ["Play offline", "Jugar sin conexión"], "Sair da conta": ["Sign out", "Cerrar sesión"], "Entrar numa conta": ["Sign in to an account", "Entrar en una cuenta"], "Sair": ["Exit", "Salir"],
      "SEM INTERNET · SEU PROGRESSO SERÁ SALVO DEPOIS": ["NO INTERNET · YOUR PROGRESS WILL BE SAVED LATER", "SIN INTERNET · TU PROGRESO SE GUARDARÁ DESPUÉS"], "SEM CONTA · PROGRESSO SÓ NESTE APARELHO": ["NO ACCOUNT · PROGRESS ONLY ON THIS DEVICE", "SIN CUENTA · PROGRESO SOLO EN ESTE DISPOSITIVO"],
      "Sua sessão expirou. Entre de novo.": ["Your session expired. Sign in again.", "Tu sesión expiró. Entra de nuevo."], "Digite seu nome (pelo menos 2 letras).": ["Enter your name (at least 2 letters).", "Escribe tu nombre (al menos 2 letras)."],
      "A senha precisa ter pelo menos 4 caracteres.": ["The password needs at least 4 characters.", "La contraseña necesita al menos 4 caracteres."], "Criando conta...": ["Creating account...", "Creando cuenta..."], "Entrando...": ["Signing in...", "Entrando..."],
      "Sem conexão com o servidor. Tente de novo ou jogue sem internet (o progresso fica só neste aparelho).": ["No connection to the server. Try again or play offline (progress stays only on this device).", "Sin conexión con el servidor. Inténtalo de nuevo o juega sin conexión (el progreso queda solo en este dispositivo)."],
      // mensagens do servidor
      "Conta não encontrada. Confira o nome ou toque em Criar conta.": ["Account not found. Check the name or tap Create account.", "Cuenta no encontrada. Revisa el nombre o toca Crear cuenta."],
      "Esse nome já tem conta. Use Entrar ou escolha outro nome.": ["That name already has an account. Use Sign in or pick another name.", "Ese nombre ya tiene cuenta. Usa Entrar o elige otro nombre."],
      "Senha incorreta.": ["Wrong password.", "Contraseña incorrecta."], "Muitas tentativas. Espere 1 minuto.": ["Too many attempts. Wait 1 minute.", "Demasiados intentos. Espera 1 minuto."],
      "Nome: de 2 a 14 letras ou números.": ["Name: 2 to 14 letters or numbers.", "Nombre: de 2 a 14 letras o números."], "Senha: de 4 a 40 caracteres.": ["Password: 4 to 40 characters.", "Contraseña: de 4 a 40 caracteres."],
      "Sessão expirada. Entre de novo.": ["Session expired. Sign in again.", "Sesión expirada. Entra de nuevo."], "Contas indisponíveis.": ["Accounts unavailable.", "Cuentas no disponibles."], "Dados grandes demais.": ["Data too large.", "Datos demasiado grandes."],
      "Dados inválidos.": ["Invalid data.", "Datos inválidos."], "Pedido inválido.": ["Invalid request.", "Solicitud inválida."], "Não encontrado.": ["Not found.", "No encontrado."],
      "Não foi possível carregar a biblioteca 3D (Three.js). Verifique sua conexão e recarregue a página.": ["Couldn't load the 3D library (Three.js). Check your connection and reload the page.", "No se pudo cargar la biblioteca 3D (Three.js). Revisa tu conexión y recarga la página."],
      // ---------- atualização, pausa, fim de jogo ----------
      "Jogo atualizado!": ["Game updated!", "¡Juego actualizado!"], "Nova versão disponível": ["New version available", "Nueva versión disponible"], "Atualizar agora": ["Update now", "Actualizar ahora"], "OK": ["OK", "OK"],
      "Jogo pausado": ["Game paused", "Juego en pausa"], "Pausa": ["Paused", "Pausa"], "Clique para voltar à arena.": ["Click to return to the arena.", "Haz clic para volver a la arena."], "Continuar": ["Continue", "Continuar"], "Menu principal": ["Main menu", "Menú principal"],
      "Fim de jogo": ["Game over", "Fin del juego"], "Carregando…": ["Loading…", "Cargando…"], "Preparando as armas…": ["Preparing the guns…", "Preparando las armas…"], "Preparando a faca e as poções…": ["Preparing the knife and potions…", "Preparando el cuchillo y las pociones…"], "Montando a vila italiana…": ["Building the Italian village…", "Montando el pueblo italiano…"], "Compilando os gráficos…": ["Compiling the graphics…", "Compilando los gráficos…"], "Pronto!": ["Ready!", "¡Listo!"], "Fim da Infecção": ["Infection over", "Fin de la Infección"], "PARTIDA ENCERRADA": ["MATCH OVER", "PARTIDA TERMINADA"], "Você morreu": ["You died", "Has muerto"], "ONDA": ["WAVE", "OLEADA"], "PONTOS": ["SCORE", "PUNTOS"], "ABATES": ["KILLS", "BAJAS"], "HEADSHOTS": ["HEADSHOTS", "HEADSHOTS"],
      "PRECISÃO": ["ACCURACY", "PRECISIÓN"], "TEMPO": ["TIME", "TIEMPO"], "MOEDAS GANHAS": ["COINS EARNED", "MONEDAS GANADAS"], "Novo recorde!": ["New high score!", "¡Nuevo récord!"], "ou": ["or", "o"], "para recomeçar.": ["to restart.", "para reiniciar."],
      // ---------- HUD ----------
      "Zumbis": ["Zombies", "Zombis"], "Moedas": ["Coins", "Monedas"], "VIDA": ["HEALTH", "VIDA"], "AUTO": ["AUTO", "AUTO"], "GIGANTE": ["GIANT", "GIGANTE"],
      "RECARREGANDO...": ["RELOADING...", "RECARGANDO..."], "SEM MUNIÇÃO": ["NO AMMO", "SIN MUNICIÓN"], "SEM FÔLEGO": ["OUT OF BREATH", "SIN ALIENTO"],
      "AUTOMÁTICA": ["AUTOMATIC", "AUTOMÁTICA"], "SEMIAUTOMÁTICA": ["SEMI-AUTO", "SEMIAUTOMÁTICA"], "AÇÃO DE BOMBA": ["PUMP ACTION", "ACCIÓN DE BOMBEO"], "FERROLHO": ["BOLT ACTION", "CERROJO"], "RAJADA 3": ["3-ROUND BURST", "RÁFAGA 3"], "SILENC.": ["SUPPR.", "SILENC."],
      "AUTOMÁTICO": ["AUTOMATIC", "AUTOMÁTICO"], "SEMIAUTOMÁTICO": ["SEMI-AUTO", "SEMIAUTOMÁTICO"], "RAJADA DE 3": ["3-ROUND BURST", "RÁFAGA DE 3"],
      "PREPARE-SE": ["GET READY", "PREPÁRATE"], "VOCÊ CAIU": ["YOU'RE DOWN", "HAS CAÍDO"], "Renasce na próxima onda": ["You respawn next wave", "Reapareces en la próxima oleada"], "Você renasceu": ["You respawned", "Has reaparecido"],
      "UM GIGANTE!": ["A GIANT!", "¡UN GIGANTE!"], "Mire na cabeça · aguente firme": ["Aim for the head · hold on", "Apunta a la cabeza · aguanta firme"], "EXPLORE O MAPA": ["EXPLORE THE MAP", "EXPLORA EL MAPA"], "DE VOLTA!": ["BACK!", "¡DE VUELTA!"],
      "SEGUNDA CHANCE": ["SECOND CHANCE", "SEGUNDA OPORTUNIDAD"], "Vida cheia e 4 s invencível!": ["Full health and 4 s invincible!", "¡Vida llena y 4 s invencible!"],
      "COLOSSO BLINDADO": ["ARMORED COLOSSUS", "COLOSO BLINDADO"], "O escudo bloqueia tiros de frente · ataque pelos lados e costas": ["The shield blocks shots from the front · attack from the sides and back", "El escudo bloquea los disparos de frente · ataca por los lados y la espalda"],
      "MESTRE DA KATANA": ["KATANA MASTER", "MAESTRO DE LA KATANA"], "Rápido, esquiva tiros · cuidado com a investida": ["Fast, dodges bullets · watch out for the lunge", "Rápido, esquiva balas · cuidado con la embestida"],
      "O ESPECTRO": ["THE SPECTER", "EL ESPECTRO"], "Invisível e imune · só pode ser ferido quando ataca": ["Invisible and immune · can only be hurt while attacking", "Invisible e inmune · solo puede ser herido cuando ataca"],
      "HUMANOS VENCERAM": ["HUMANS WIN", "GANAN LOS HUMANOS"], "ZUMBIS VENCERAM": ["ZOMBIES WIN", "GANAN LOS ZOMBIS"], "Sobreviveram até o fim": ["They survived to the end", "Sobrevivieron hasta el final"], "Ninguém escapou": ["Nobody escaped", "Nadie escapó"],
      "Corra e se espalhe!": ["Run and spread out!", "¡Corre y dispérsate!"], "A INFECÇÃO COMEÇOU": ["THE INFECTION HAS STARTED", "LA INFECCIÓN COMENZÓ"], "Fuja dos zumbis por 3 minutos": ["Escape the zombies for 3 minutes", "Huye de los zombis durante 3 minutos"],
      "Crie uma sala na aba Online para jogar Infecção": ["Create a room in the Online tab to play Infection", "Crea una sala en la pestaña En línea para jugar Infección"],
      "JOGADOR SAIU": ["PLAYER LEFT", "JUGADOR SALIÓ"], "VOCÊ É ZUMBI": ["YOU ARE A ZOMBIE", "ERES ZOMBI"], "VOCÊ VOLTA EM": ["BACK IN", "VUELVES EN"], "VOCÊ VOLTA": ["YOU RESPAWN", "VUELVES"], "NA PRÓXIMA ONDA": ["NEXT WAVE", "EN LA PRÓXIMA OLEADA"], "Jogador": ["Player", "Jugador"],
      "ARMADURA DESTRUÍDA": ["ARMOR DESTROYED", "ARMADURA DESTRUIDA"], "VIDA CHEIA": ["FULL HEALTH", "VIDA LLENA"], "VOCÊ CAIU - RENASCE NA PRÓXIMA ONDA": ["YOU'RE DOWN - RESPAWN NEXT WAVE", "HAS CAÍDO - REAPARECES EN LA PRÓXIMA OLEADA"], "VOCÊ VOLTOU": ["YOU'RE BACK", "HAS VUELTO"],
      "SEM POÇÕES NESTA PARTIDA": ["NO POTIONS THIS MATCH", "SIN POCIONES EN ESTA PARTIDA"], "TIRO AUTOMÁTICO LIGADO": ["AUTO-FIRE ON", "DISPARO AUTOMÁTICO ACTIVADO"], "TIRO AUTOMÁTICO DESLIGADO": ["AUTO-FIRE OFF", "DISPARO AUTOMÁTICO DESACTIVADO"],
      "VELOCIDADE +40% POR 8 s": ["SPEED +40% FOR 8 s", "VELOCIDAD +40% DURANTE 8 s"], "VIDA RECUPERADA": ["HEALTH RESTORED", "VIDA RECUPERADA"],
      "MOLOTOV NA MÃO · CLIQUE PARA ACENDER E ARREMESSAR": ["MOLOTOV IN HAND · CLICK TO LIGHT AND THROW", "MOLOTOV EN MANO · HAZ CLIC PARA ENCENDER Y LANZAR"], "CURA NA MÃO · CLIQUE PARA ARREMESSAR": ["HEALING IN HAND · CLICK TO THROW", "CURACIÓN EN MANO · HAZ CLIC PARA LANZAR"],
      "SEGUNDA CHANCE ATIVA": ["SECOND CHANCE ACTIVE", "SEGUNDA OPORTUNIDAD ACTIVA"], "MOCHILA DUPLA ATIVA": ["DOUBLE BACKPACK ACTIVE", "MOCHILA DOBLE ACTIVA"], "COLETE EXTRA ATIVO": ["EXTRA VEST ACTIVE", "CHALECO EXTRA ACTIVO"],
      "aperta e solta": ["press and release", "pulsa y suelta"], "ALGUÉM": ["SOMEONE", "ALGUIEN"], "VOCÊ": ["YOU", "TÚ"],
      // placas do mapa
      "SEM SAÍDA": ["NO EXIT", "SIN SALIDA"], "NÃO ENTRE": ["DO NOT ENTER", "NO ENTRES"], "ELES VÊM À NOITE": ["THEY COME AT NIGHT", "VIENEN DE NOCHE"], "CORRA": ["RUN", "CORRE"], "FIM DOS TEMPOS": ["END OF DAYS", "FIN DE LOS TIEMPOS"],
      "QUARENTENA": ["QUARANTINE", "CUARENTENA"], "NÃO ABRA": ["DO NOT OPEN", "NO ABRIR"], "ACABOU": ["IT'S OVER", "SE ACABÓ"], "FRÁGIL": ["FRAGILE", "FRÁGIL"],
    };
    // frases com números/nomes: [regex, inglês, espanhol] — "$1" volta o pedaço capturado; função recebe (m, t) para traduzir pedaços
    const P = [
      [/^ONDA (\d+)$/, "WAVE $1", "OLEADA $1"],
      [/^ONDA (\d+) COMPLETA$/, "WAVE $1 COMPLETE", "OLEADA $1 COMPLETADA"],
      [/^\+(\d+) vida · munição$/, "+$1 health · ammo", "+$1 vida · munición"],
      [/^próxima onda em (\d+)$/, "next wave in $1", "próxima oleada en $1"],
      [/^INFECÇÃO EM (\d+)$/, "INFECTION IN $1", "INFECCIÓN EN $1"],
      [/^VOCÊ VOLTA EM (\d+)$/, "BACK IN $1", "VUELVES EN $1"],
      [/^HUMANOS (\d+)$/, "HUMANS $1", "HUMANOS $1"], [/^ZUMBIS (\d+)$/, "ZOMBIES $1", "ZOMBIS $1"], [/^VELOCIDADE (\d+) s$/, "SPEED $1 s", "VELOCIDAD $1 s"],
      [/^VOCÊ É ZUMBI · (.+)$/, (m, t) => "YOU ARE A ZOMBIE · " + t(m[1]), (m, t) => "ERES ZOMBI · " + t(m[1])],
      [/^(.+) É O PRIMEIRO ZUMBI(!?)$/, (m, t) => t(m[1]) + " IS THE FIRST ZOMBIE" + m[2], (m, t) => (m[1] === "VOCÊ" ? "ERES EL PRIMER ZOMBI" : t(m[1]) + " ES EL PRIMER ZOMBI") + m[2]],
      [/^(.+) VIROU ZUMBI(!?)$/, (m, t) => (m[1] === "VOCÊ" ? "YOU TURNED INTO A ZOMBIE" : t(m[1]) + " TURNED INTO A ZOMBIE") + m[2], (m, t) => (m[1] === "VOCÊ" ? "TE CONVERTISTE EN ZOMBI" : t(m[1]) + " SE CONVIRTIÓ EN ZOMBI") + m[2]],
      [/^(.+) CAIU$/, "$1 IS DOWN", "$1 HA CAÍDO"],
      [/^\+(\d+) VIDA$/, "+$1 HEALTH", "+$1 VIDA"], [/^\+(\d+) MUNIÇÃO$/, "+$1 AMMO", "+$1 MUNICIÓN"],
      [/^(HEADSHOT )?(COLOSSO |MESTRE |ESPECTRO |GIGANTE |BRUTO )?ABATIDO \+(\d+)$/,
        (m) => (m[1] || "") + ({ "COLOSSO ": "COLOSSUS ", "MESTRE ": "MASTER ", "ESPECTRO ": "SPECTER ", "GIGANTE ": "GIANT ", "BRUTO ": "BRUTE " }[m[2]] || "") + "KILL +" + m[3],
        (m) => (m[1] || "") + "BAJA" + ({ "COLOSSO ": " DE COLOSO", "MESTRE ": " DE MAESTRO", "ESPECTRO ": " DE ESPECTRO", "GIGANTE ": " DE GIGANTE", "BRUTO ": " DE BRUTO" }[m[2]] || "") + " +" + m[3]],
      [/^MODO: (.+)$/, (m, t) => "MODE: " + t(m[1]), (m, t) => "MODO: " + t(m[1])],
      [/^CORRE MAIS RÁPIDO · (.+) GUARDA$/, "RUN FASTER · $1 PUTS AWAY", "CORRES MÁS RÁPIDO · $1 GUARDA"],
      [/^SEM POÇÃO DE (FOGO|CURA) · ACABOU NESTA PARTIDA$/, (m) => "NO " + (m[1] === "FOGO" ? "FIRE" : "HEALING") + " POTION · USED UP THIS MATCH", (m) => "SIN POCIÓN DE " + (m[1] === "FOGO" ? "FUEGO" : "CURACIÓN") + " · SE ACABÓ EN ESTA PARTIDA"],
      [/^(\S+) ALTERNA$/, "$1 CYCLE", "$1 ALTERNA"], [/^(\S+) FOGO ×(\d+)$/, "$1 FIRE ×$2", "$1 FUEGO ×$2"], [/^(\S+) CURA ×(\d+)$/, "$1 HEAL ×$2", "$1 CURA ×$2"],
      [/^Completar com bots: (ativado|desativado)$/, (m) => "Fill with bots: " + (m[1] === "ativado" ? "on" : "off"), (m) => "Completar con bots: " + (m[1] === "ativado" ? "activado" : "desactivado")],
      [/^Você ganhou (\d+) moedas\. Na carteira: (\d+)\. Gaste na Loja do menu\.$/, "You earned $1 coins. In your wallet: $2. Spend them in the menu Store.", "Ganaste $1 monedas. En la cartera: $2. Gástalas en la Tienda del menú."],
      [/^Entrando como (.+)\.\.\.$/, "Signing in as $1...", "Entrando como $1..."],
      [/^Nível (\d+)$/, "Level $1", "Nivel $1"], [/^EM ESTOQUE: (\d+)$/, "IN STOCK: $1", "EN STOCK: $1"],
      [/^(\d+) → (\d+) balas\. Recarga 15% mais lenta\.$/, "$1 → $2 rounds. Reload 15% slower.", "$1 → $2 balas. Recarga 15% más lenta."],
      [/^(.*?) ?Dano (\d+) · alcance ([\d.]+) m · ([\d.]+) golpes\/s\.$/, (m, t) => (m[1] ? t(m[1]) + " " : "") + "Damage " + m[2] + " · reach " + m[3] + " m · " + m[4] + " hits/s.", (m, t) => (m[1] ? t(m[1]) + " " : "") + "Daño " + m[2] + " · alcance " + m[3] + " m · " + m[4] + " golpes/s."],
      [/^dano total até (\d+) m$/, "full damage up to $1 m", "daño total hasta $1 m"], [/^alcance máx\. (\d+) m$/, "max range $1 m", "alcance máx. $1 m"],
      [/^Tiro na cabeça \(x([\d.]+)\)$/, "Headshot (x$1)", "Disparo a la cabeza (x$1)"], [/^(\d+) tiros seguidos \(ângulo em graus\)$/, "$1 shots in a row (angle in degrees)", "$1 disparos seguidos (ángulo en grados)"],
      [/^Escopeta: valores contam os (\d+) projéteis acertando; de longe muitos se perdem\.$/, "Shotgun: values count all $1 pellets hitting; at range many miss.", "Escopeta: los valores cuentan los $1 perdigones impactando; de lejos muchos se pierden."],
      [/^Atravessa até (\d+) alvos extras, com 30% menos dano a cada um\.$/, "Pierces up to $1 extra targets, with 30% less damage each.", "Atraviesa hasta $1 objetivos extra, con un 30% menos de daño en cada uno."],
      [/^Erro (\d+)$/, "Error $1", "Error $1"], [/^Num (\d)$/, "Num $1", "Num $1"],
      [/^Conta "(.+)" não encontrada\.$/, 'Account "$1" not found.', 'Cuenta "$1" no encontrada.'],
      [/^([^·+]+) \+ ([^·+]+)$/, (m, t) => t(m[1]) + " + " + t(m[2]), (m, t) => t(m[1]) + " + " + t(m[2])],
      [/^(\d+) FPS$/, "$1 FPS", "$1 FPS"],
      [/^(.+) \[(\S+)\]$/, (m, t) => t(m[1]) + " [" + m[2] + "]", (m, t) => t(m[1]) + " [" + m[2] + "]"],       // "AUTOMÁTICA [B]"
      [/^([12]) (.+)$/, (m, t) => m[1] + " " + t(m[2]), (m, t) => m[1] + " " + t(m[2])],                        // "1 Fuzil AX-4"
      [/^([^·]+) (mover|recarregar|agachar|pegar faca|modo de tiro|correr|lanterna|pausar)$/, (m) => m[1] + " " + { mover: "move", recarregar: "reload", agachar: "crouch", "pegar faca": "draw knife", "modo de tiro": "fire mode", correr: "sprint", lanterna: "flashlight", pausar: "pause" }[m[2]], (m) => m[1] + " " + { mover: "moverse", recarregar: "recargar", agachar: "agacharse", "pegar faca": "sacar cuchillo", "modo de tiro": "modo de disparo", correr: "correr", lanterna: "linterna", pausar: "pausar" }[m[2]]],
      [/^([^·]+) ou roda trocar arma$/, "$1 or wheel switch weapon", "$1 o rueda cambiar arma"],
    ];
    let UD = null;
    const SUPPORTED = ["en", "es", "pt"];
    function detect() {
      try { const o = JSON.parse(localStorage.getItem("arena-zumbi-v2") || "{}"); if (SUPPORTED.includes(o.lang)) return o.lang; } catch (e) {}
      const n = String((navigator.languages && navigator.languages[0]) || navigator.language || "en").toLowerCase();
      return n.startsWith("pt") ? "pt" : n.startsWith("es") ? "es" : "en";   // inglês é o idioma principal
    }
    let lang = detect();
    function core(s, deep) {
      deep = deep !== false;
      const i = lang === "en" ? 0 : 1;
      const d = D[s]; if (d) return d[i];
      if (/[A-ZÀ-Ú]/.test(s) && s === s.toUpperCase()) {                  // HUD em maiúsculas ("FUZIL AX-4", "FACA DE COMBATE")
        if (!UD) { UD = {}; for (const k in D) { const u = k.toUpperCase(); if (!(u in D) && !(u in UD)) UD[u] = [D[k][0].toUpperCase(), D[k][1].toUpperCase()]; } }
        if (UD[s]) return UD[s][i];
      }
      for (const p of P) { const m = p[0].exec(s); if (m) { const tp = p[1 + i]; return typeof tp === "function" ? tp(m, core) : tp.replace(/\$(\d)/g, (_, k) => m[k] || ""); } }
      let m = /^([·•\-–:\s]+)(.+)$/.exec(s); if (m) { const r = core(m[2], deep); if (r !== m[2]) return m[1] + r; }                     // "· Abates"
      m = /^(.+?)([\s·:]+)$/.exec(s); if (m) { const r = core(m[1], deep); if (r !== m[1]) return r + m[2]; }                           // "Recarregar ·"
      if (!deep) return s;
      if (s.includes(" · ")) { const a = s.split(" · "), b = a.map(core); if (b.some((x, k) => x !== a[k])) return b.join(" · "); }
      m = !/[.!?]\s/.test(s) && /^(.+?)([.!?…]+)$/.exec(s); if (m) { const r = core(m[1]); if (r !== m[1]) return r + m[2]; }                         // "Revólver."
      // várias frases: junta o maior trecho seguido que existir no dicionário
      const sent = s.split(/(?<=[.!?])\s+/);
      if (sent.length > 1) {
        const out = []; let any = false;
        for (let a = 0; a < sent.length;) {
          let done = false;
          for (let b = sent.length; b > a; b--) { const c = sent.slice(a, b).join(" "), r = b - a === sent.length ? c : core(c, b - a === 1); if (r !== c) { out.push(r); a = b; any = done = true; break; } }
          if (!done) { out.push(sent[a]); a++; }
        }
        if (any) return out.join(" ");
      }
      return s;
    }
    function t(s) {
      if (lang === "pt" || typeof s !== "string" || !/[A-Za-zÀ-ú]/.test(s)) return s;
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), inner = m[2].replace(/\s+/g, " "), r = core(inner);
      return r === inner ? s : m[1] + r + m[3];
    }
    // ---- tradução da tela: guarda o texto original de cada nó e troca o que aparece ----
    const SRC = new WeakMap(), ATTRS = ["placeholder", "title", "aria-label"];
    const skip = (el) => !el || /^(SCRIPT|STYLE|TEXTAREA)$/.test(el.nodeName) || (el.closest && el.closest("[translate=no]"));
    function textNode(n) {
      const v = n.nodeValue, rec = SRC.get(n), src = rec && v === rec[1] ? rec[0] : v, out = t(src);
      SRC.set(n, [src, out]); if (out !== v) n.nodeValue = out;
    }
    function attrs(el) {
      for (const a of ATTRS) {
        const v = el.getAttribute(a); if (v == null) continue;
        const k = "i18n" + a.replace(/-/g, ""), d = el.dataset;
        const src = d[k] !== undefined && v === d[k + "Out"] ? d[k] : v, out = t(src);
        d[k] = src; d[k + "Out"] = out; if (out !== v) el.setAttribute(a, out);
      }
    }
    function walk(root) {
      if (!root) return;
      if (root.nodeType === 3) { if (!skip(root.parentNode)) textNode(root); return; }
      if (root.nodeType !== 1 || skip(root)) return;
      attrs(root);
      const w = document.createTreeWalker(root, 5, { acceptNode: (n) => (n.nodeType === 1 ? (skip(n) ? 2 : 1) : 1) });
      let n; while ((n = w.nextNode())) { if (n.nodeType === 3) textNode(n); else attrs(n); }
    }
    let obs = null;
    function start() {
      document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
      walk(document.body);
      obs = new MutationObserver((ms) => {
        for (const m of ms) {
          if (m.type === "characterData") { const rec = SRC.get(m.target); if (!(rec && m.target.nodeValue === rec[1]) && !skip(m.target.parentNode)) textNode(m.target); }
          else if (m.type === "attributes") { const el = m.target, d = el.dataset, k = "i18n" + m.attributeName.replace(/-/g, ""); if (el.getAttribute(m.attributeName) !== d[k + "Out"] && !skip(el)) attrs(el); }
          else for (const n of m.addedNodes) walk(n);
        }
      });
      obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
    function set(l) {
      if (!SUPPORTED.includes(l) || l === lang) return;
      lang = l; document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
      walk(document.body);                                                // volta cada texto ao original e traduz de novo
      document.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.getAttribute("data-lang") === lang));
    }
    return { t, set, get: () => lang, D, P };
  })();
  window.I18N = I18N;
