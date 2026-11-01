// "treino" dos bots humanos: busca aleatória + refinamento dos parâmetros da IA em partidas simuladas
const fs=require('fs');
eval(fs.readFileSync(''+__dirname+'/../src/mapit.js','utf8')+fs.readFileSync(''+__dirname+'/../src/logic.js','utf8')+';globalThis.Logic=Logic;');
const L=Logic; L.setMap('italia');
const BASE=Object.assign({},L.BOT_AI);
const SP={flee:[4,12],sprint:[3,11],stand:[0,26],away:[0,10],wz:[0,2],wh:[0,1.5],wHigh:[0,3],roamR:[15,55],roamT:[2,10],camp:[false,true],group:[1,3],gap:[2,5]};
let seed=+(process.env.SEED||7); const R=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
function sample(c,scale){const o=Object.assign({},c);for(const k in SP){const r=SP[k];if(typeof r[0]==='boolean'){if(R()<0.3*scale)o[k]=!o[k];continue}
 if(R()<0.6){let v=o[k]+(R()*2-1)*(r[1]-r[0])*0.35*scale; v=Math.max(r[0],Math.min(r[1],v)); o[k]=k==='group'?Math.round(v):+v.toFixed(2);}}return o}
function one(){
  const g=new L.Game({loadout:[{id:'ax4',a:{}},{id:'p45',a:{}}],diff:'normal'});
  g.enableCoop('host','p1'); g.infectStart();
  const base=L.Game.prototype.infPlayers; g.infPlayers=function(){return base.call(this).filter(q=>!q.me)};
  g.hp=1e9;g.maxHp=1e9;
  for(let i=1;i<=11;i++) g.addBot('b'+i,'Bot '+i);
  let t=0;const dt=0.05;
  while(t<200&&g.inf.ph!=='end'){g.px=200;g.py=200;g.update(dt,{});g.popEvents();g.popOut();t+=dt;}
  return {t:t-10, k:g.others.reduce((a,o)=>a+(o.kills||0),0), win:g.inf.win==='h'};
}
function evalc(c,n){Object.assign(L.BOT_AI,BASE,c);let s=0,k=0,w=0;for(let i=0;i<n;i++){const r=one();s+=r.t;k+=r.k;w+=r.win}return {fit:(s+3*k)/n+60*w/n, t:s/n, k:k/n, w:w/n}}
const out=process.env.OUT||'tune.log'; const log=(m)=>fs.appendFileSync(out,m+'\n');
let best={camp:false,flee:6.5,sprint:4.5,stand:22,away:6,wz:1,wh:0.6,wHigh:0.5,roamR:35,roamT:5,group:2,gap:3};
let bf=evalc(best,16); log('base '+JSON.stringify(best)+' '+JSON.stringify(bf));
const iters=+(process.env.IT||40);
for(let it=0;it<iters;it++){
  const c=sample(best,it<iters/2?1:0.5); const f=evalc(c,8);
  if(f.fit>bf.fit*0.97){ const f2=evalc(c,16); const fm={fit:(f.fit+2*f2.fit)/3,t:(f.t+2*f2.t)/3,k:(f.k+2*f2.k)/3,w:(f.w+2*f2.w)/3};
    if(fm.fit>bf.fit){best=c;bf=fm;log('NOVO '+it+' '+JSON.stringify(c)+' '+JSON.stringify(fm));continue} }
  log('it '+it+' '+f.fit.toFixed(1));
}
log('FIM '+JSON.stringify(best)+' '+JSON.stringify(bf));
