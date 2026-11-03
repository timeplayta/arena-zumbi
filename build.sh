#!/bin/sh
# Junta src/ em:
#   index.html                     (jogo, three.js pela CDN)
#   game/public/index.html         (o mesmo, publicado no Cloudflare)
#   game/public/index-offline.html (three.js embutido: usado pelo .exe e pelo APK, e baixado por eles nas atualizações)
#   game/public/version.json       (número da versão + novidades: o app compara e se atualiza sozinho)
cd "$(dirname "$0")"
V=${GAME_VERSION:-$(date -u +%Y%m%d%H%M)}
NOTES=$(python3 -c "
import json,re,os
def top(fn):
    if not os.path.exists(fn): return None
    t=open(fn,encoding='utf8').read()
    secs=re.split(r'\n## ',t)
    s=secs[1] if len(secs)>1 else ''
    lines=s.strip().splitlines()
    return {'t':lines[0] if lines else '','b':[l[2:] for l in lines[1:] if l.startswith('- ')][:6]}
n=top('CHANGELOG.md')
for l in ('en','es'):
    x=top('CHANGELOG.'+l+'.md')
    if x: n[l]=x
print(json.dumps(n,ensure_ascii=False))")
{
  cat src/head.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script>'
  echo "const GAME_VERSION = $V, GAME_NOTES = $NOTES;"
  (cd src && cat i18n.js mapit.js logic.js app1.js app1b.js zhand.js app2.js zhead.js zhair.js zbody.js zanat.js app2b.js italiaview.js zview.js zelite.js app3.js app4.js app4b.js zarmsdata.js znet.js potdata.js knifedata.js zpots.js app5.js)
  echo '</script>'
} > index.html
mkdir -p game/public && cp index.html game/public/index.html
python3 - "$V" <<'PY'
import json,sys
h=open('index.html',encoding='utf8').read()
t=open('vendor/three.min.js',encoding='utf8').read()
tag='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
open('game/public/index-offline.html','w',encoding='utf8').write(h.replace(tag,'<script>'+t.replace('</script','<\\/script')+'</script>'))
notes=json.loads(h.split('GAME_NOTES = ',1)[1].split(';\n',1)[0])
json.dump({'v':int(sys.argv[1]),'notes':notes},open('game/public/version.json','w',encoding='utf8'),ensure_ascii=False)
PY
cp src/admin.html game/public/admin.html                          # painel do administrador (enviar moedas)
cat > game/public/_headers <<'H'
/version.json
  Access-Control-Allow-Origin: *
  Cache-Control: no-cache
/index-offline.html
  Access-Control-Allow-Origin: *
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/admin.html
  Cache-Control: no-store
  X-Robots-Tag: noindex
H
echo "versão $V"
