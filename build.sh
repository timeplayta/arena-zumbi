#!/bin/sh
# Junta os arquivos de src/ em index.html (jogo inteiro numa página só).
cd "$(dirname "$0")/src"
{
  cat head.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script>'
  cat logic.js app1.js app1b.js zhand.js app2.js zhead.js zhair.js zbody.js zanat.js app2b.js zview.js zelite.js app3.js app4.js app4b.js app5.js
  echo '</script>'
} > ../index.html
