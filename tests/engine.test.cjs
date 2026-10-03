const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../js/config.js');require('../js/save.js');require('../js/engine.js');
const D=globalThis.Duna,DT=1/120;
function storage(raw=null){let value=raw;return {getItem:()=>value,setItem:(_,v)=>{value=v;}};}
function setup(stage=0){const store=storage(),save=new D.Save(store);save.data.unlocked=5;const events=[];const engine=new D.Engine(save,{sfx:()=>{}},e=>events.push(e));engine.start(stage);engine.state='running';engine.nextObstacle=1000;engine.nextCoins=1000;return {engine,save,store,events};}
function advance(engine,seconds){for(let t=0;t<seconds;t+=DT)engine.update(DT);}
function obstacle(engine,type){engine.spawnObstacle(type);engine.nextObstacle=1000;engine.coins=[];return engine.obstacles.at(-1);}

test('jump has a natural arc, lands exactly, and cannot double jump',()=>{const {engine:e}=setup();e.jump();let top=D.GROUND;for(let i=0;i<60;i++){e.update(DT);top=Math.min(top,e.player.y);if(i===25)e.jump();}assert.ok(D.GROUND-top>165&&D.GROUND-top<177);advance(e,.5);assert.equal(e.player.y,D.GROUND);assert.equal(e.player.grounded,true);});
test('duck avoids birds, branches and signs; standing takes damage',()=>{for(const [stage,type] of [[0,'bird'],[1,'branch'],[2,'sign']])for(const duck of [true,false]){const {engine:e}=setup(stage);const o=obstacle(e,type);o.x=D.PHYSICS.playerX;e.crouch(duck);e.update(DT);assert.equal(e.lives,duck?3:2,`${type}, duck=${duck}`);}});
test('ground obstacles can all be cleared at both initial and maximum speed',()=>{for(const stage of D.STAGES)for(const type of stage.obstacles.filter(t=>!['bird','branch','sign','icepatch'].includes(t)))for(const fast of [false,true]){const {engine:e}=setup(stage.id);if(fast)e.time=stage.duration-10;e.speed=D.difficulty(stage,e.time).speed;const o=obstacle(e,type);assert.ok(o,`${stage.name}/${type}: spawn`);
  drive(e,()=>{},6);assert.equal(e.lives,3,`${stage.name}/${type}/${fast?'max':'initial'}`);
}});
test('collision invulnerability lasts two seconds and zero lives produces Game Over once',()=>{const {engine:e,events}=setup();e.damage();e.damage();assert.equal(e.lives,2);advance(e,1.8);e.damage();assert.equal(e.lives,2);advance(e,.21);e.damage();assert.equal(e.lives,1);advance(e,2.01);e.damage();assert.equal(e.lives,0);assert.equal(e.state,'over');e.damage();assert.equal(events.filter(v=>v==='over').length,1);});
test('pits rescue player and cost only one life during invulnerability',()=>{const {engine:e}=setup();const o=obstacle(e,'pit');o.x=D.PHYSICS.playerX-20;e.update(DT);assert.equal(e.lives,2);assert.ok(e.player.y<D.GROUND);advance(e,.3);assert.equal(e.lives,2);});
test('platform supports a landing above lava and player falls off its edge',()=>{const {engine:e}=setup(4);const o=obstacle(e,'platform');o.x=D.PHYSICS.playerX-30;e.player.y=o.y-1;e.player.vy=300;e.player.grounded=false;e.update(DT);assert.equal(e.player.y,o.y);assert.equal(e.player.grounded,true);assert.equal(e.lives,3);advance(e,.6);assert.equal(e.lives,3);assert.ok(e.player.y>o.y);});
test('ice preserves a brief slide after releasing down',()=>{const {engine:e}=setup(3);const o=obstacle(e,'icepatch');o.x=D.PHYSICS.playerX-10;e.crouch(true);e.update(DT);e.crouch(false);advance(e,.1);assert.equal(e.player.duck,true);advance(e,.15);assert.equal(e.player.duck,false);});
test('coins are credited once and persist immediately',()=>{const {engine:e,save,store}=setup();e.coins=[{x:D.PHYSICS.playerX+35,y:D.GROUND-45,collected:false}];e.update(DT);assert.equal(e.collected,1);assert.equal(save.data.coins,1);advance(e,.5);assert.equal(save.data.coins,1);assert.equal(new D.Save(store).data.coins,1);assert.ok(e.score>=25);});
test('pause freezes time, damage, coins and controls; resume clears held down',()=>{const {engine:e}=setup();e.crouch(true);e.pause();const before=e.time;e.damage();advance(e,5);e.jump();assert.equal(e.time,before);assert.equal(e.lives,3);e.resume();e.update(DT);assert.equal(e.player.duck,false);assert.equal(e.player.grounded,true);});
test('all five stage endings unlock the next world and persist records',()=>{const {engine:e,save,store}=setup();save.data.unlocked=1;for(let i=0;i<5;i++){assert.equal(e.start(i),true);e.state='running';e.nextObstacle=1000;e.nextCoins=1000;e.time=D.STAGES[i].duration-DT/2;e.update(DT);assert.equal(e.state,'complete');assert.equal(save.data.unlocked,Math.min(5,i+2));assert.ok(save.data.best[i]>0);}const read=new D.Save(store);assert.deepEqual(read.data.completed,[0,1,2,3,4]);assert.equal(read.data.unlocked,5);});
test('locked stages cannot be launched, including invalid stage indices',()=>{const {engine:e,save}=setup();save.data.unlocked=1;for(const id of [1,4,5,-1,NaN,1.5])assert.equal(e.start(id),false);});
test('checkpoint survives reload and restores run state with three lives',()=>{const {engine:e,save,store}=setup(2);e.time=79.999;e.collected=17;e.distance=12345;e.update(DT);assert.equal(save.data.checkpoint.time,80);const loaded=new D.Save(store),next=new D.Engine(loaded,{sfx:()=>{}});next.start(2,true);assert.equal(next.time,80);assert.equal(next.collected,17);assert.equal(next.lives,3);assert.equal(next.state,'countdown');assert.ok(next.distance>=12345);assert.ok(next.nextObstacle>=3);});
test('buying and selecting characters/cosmetics is atomic and survives reload',()=>{const {save,store}=setup();assert.equal(save.buy('robot'),false);save.earn(350);assert.equal(save.buy('robot'),true);assert.equal(save.data.coins,230);save.buy('robot');assert.equal(save.data.coins,230);assert.equal(save.buy('ocean'),true);assert.equal(save.buy('spark'),true);save.setting('music',false);const read=new D.Save(store);assert.equal(read.data.selected,'robot');assert.equal(read.data.skin,'ocean');assert.equal(read.data.trail,true);assert.equal(read.data.settings.music,false);assert.equal(read.data.coins,60);});
test('corrupted save is repaired and denied storage does not stop play',()=>{const s=new D.Save(storage('{broken'));assert.equal(s.data.unlocked,1);const bad=new D.Save(storage(JSON.stringify({coins:-80,unlocked:70,selected:'unknown',owned:['oops'],completed:[0,0,10],checkpoint:{stage:99,time:45}})));assert.equal(bad.data.coins,0);assert.equal(bad.data.unlocked,5);assert.equal(bad.data.selected,'dino');assert.deepEqual(bad.data.completed,[0]);assert.equal(bad.data.checkpoint,null);const denied=new D.Save({getItem(){throw Error();},setItem(){throw Error();}});assert.equal(denied.available,false);denied.earn(1);assert.equal(denied.data.coins,1);});
test('spawn guard rejects stacked hazards and every obstacle remains available',()=>{
 for(const stage of D.STAGES){const {engine:e}=setup(stage.id);e.time=stage.duration*.8;
  e.speed=D.difficulty(stage,e.time).speed;
  for(const type of stage.obstacles){e.obstacles=[];e.lastPlan=null;assert.equal(e.spawnObstacle(type),true);assert.equal(e.obstacles[0].type,type);assert.ok(e.nextObstacle>0);assert.equal(e.spawnObstacle(type),false);assert.equal(e.obstacles.length,1);}
 }
});
test('a full deterministic playthrough clears every generated encounter in all five worlds',()=>{
 for(const stage of D.STAGES){
  const {engine:e}=setup(stage.id);e.nextObstacle=3.2;e.nextCoins=.8;
  for(let frame=0;frame<(stage.duration+1)*120&&e.state==='running';frame++){
   const ahead=e.obstacles.find(o=>o.x+o.w>D.PHYSICS.playerX+4&&o.type!=='icepatch');
   const overhead=ahead&&['bird','branch','sign'].includes(ahead.type);
   e.crouch(Boolean(overhead&&ahead.x<D.PHYSICS.playerX+400));
   if(ahead&&!overhead){const width=ahead.type==='tree'?ahead.w-42:ahead.w;const jumpAt=D.PHYSICS.playerX+35+e.speed*ahead.motion*.365-width/2;
    if(ahead.x<=jumpAt&&!ahead.jumped){e.jump();ahead.jumped=true;}
   }
   e.update(DT);
  }
  assert.equal(e.state,'complete',`${stage.name}: did not reach finish`);
  assert.equal(e.lives,3,`${stage.name}: generated encounter caused damage`);
  assert.ok(e.collected>30,`${stage.name}: coin routes are not reachable`);
 }
});

test('difficulty rises smoothly, spacing shrinks and subsequent worlds start faster',()=>{
 for(const stage of D.STAGES){
  let last=D.difficulty(stage,0);
  for(let t=.1;t<=stage.duration;t+=.1){const now=D.difficulty(stage,t);assert.ok(now.speed>=last.speed);assert.ok(now.speed-last.speed<3);assert.ok(now.interval<=last.interval+.00001);last=now;}
  const early=D.difficulty(stage,0),late=D.difficulty(stage,stage.duration);
  assert.ok(late.interval<early.interval*.5);assert.ok(late.speed>early.speed*1.5);
  if(stage.id){assert.ok(stage.speed>D.STAGES[stage.id-1].speed);assert.ok(stage.maxSpeed>D.STAGES[stage.id-1].maxSpeed);}
 }
});

function drive(e,observer=()=>{},seconds=e.stage.duration+1,jitter=0){
 for(let frame=0;frame<seconds*120&&e.state==='running';frame++){
  e.crouch(e.obstacles.some(o=>o.plan?.action==='duck'&&e.time>=o.plan.start&&e.time<=o.plan.end));
  for(const o of e.obstacles)if(o.plan?.action==='jump'&&e.time>=o.plan.start+jitter&&!o.jumped){e.jump();o.jumped=true;}
  e.update(DT);observer(e);
 }
}
test('60 varied complete runs preserve safe clearance, reaction time and bounded memory',()=>{
 for(const stage of D.STAGES)for(let seed=0;seed<12;seed++){
  const {engine:e}=setup(stage.id);e.patternRandom=D.seeded(seed*1237+stage.id);e.nextObstacle=3.2;e.nextCoins=.8;
  const seen=new Set();let lastCount=0;
  drive(e,()=>{
   assert.ok(e.obstacles.length<=8&&e.coins.length<=70&&e.particles.length<=120);
   if(e.spawnCount!==lastCount){const o=e.obstacles.at(-1);seen.add(o.type);lastCount=e.spawnCount;assert.ok(o.clearance>=50);assert.ok(o.plan.start-o.plan.visible+1e-6>=o.plan.reaction);}
  });
  assert.equal(e.state,'complete',`${stage.name} seed ${seed}: finish`);assert.equal(e.lives,3,`${stage.name} seed ${seed}: damage`);
  assert.equal(seen.size,stage.obstacles.length);
 }
});
test('reduced motion does not change encounter order or coin rewards',()=>{
 const runs=[];
 for(const reduced of [false,true]){
  const {engine:e,save}=setup(2);save.data.settings.reducedMotion=reduced;e.nextObstacle=3.2;e.nextCoins=.8;const order=[];let count=0;
  drive(e,()=>{if(e.spawnCount!==count){count=e.spawnCount;order.push(e.obstacles.at(-1).type);}});runs.push({order,coins:e.collected,score:e.score});
 }
 assert.deepEqual(runs[0],runs[1]);
});
test('restart clears hazards and held input while keeping wallet and purchases',()=>{
 const {engine:e,save}=setup(4);save.earn(150);save.buy('robot');e.spawnObstacle('platform');e.crouch(true);e.jump();e.lives=1;
 e.start(4);assert.equal(e.lives,3);assert.equal(e.obstacles.length,0);assert.equal(e.coins.length,0);assert.equal(e.particles.length,0);assert.equal(e.down,false);assert.equal(e.jumpBuffer,0);assert.equal(save.data.selected,'robot');assert.equal(save.data.coins,30);
});

test('free mode survives beyond the map duration without changing campaign progress or checkpoint',()=>{
 const {engine:e,save,store}=setup(0);save.data.unlocked=1;save.checkpoint({stage:0,time:40,score:480,coins:3,distance:19000});
 const cp={...save.data.checkpoint};save.configureFree({map:4,period:'night',speed:'extreme',difficulty:'extreme',density:'intense'});
 assert.equal(e.start(4,false,save.data.freeOptions),true);e.state='running';drive(e,()=>{},370);
 assert.equal(e.state,'running');assert.ok(e.time>e.stage.duration*2);assert.equal(e.lives,3);assert.ok(e.spawnCount>200);
 assert.equal(save.data.unlocked,1);assert.deepEqual(save.data.completed,[]);assert.deepEqual(save.data.checkpoint,cp);
 for(let i=0;i<3;i++){e.player.invulnerable=0;e.damage();}assert.equal(e.state,'over');assert.equal(save.data.freeBest,e.score);
 const loaded=new D.Save(store);assert.deepEqual(loaded.data.checkpoint,cp);assert.equal(loaded.data.freeOptions.period,'night');assert.equal(loaded.data.freeBest,e.score);assert.equal(loaded.data.best[4]||0,0);
 e.start(4,false,e.options);assert.equal(e.time,0);assert.equal(e.lives,3);assert.equal(e.period,'night');assert.deepEqual(save.data.checkpoint,cp);
});

test('every free speed/difficulty/map has executable encounters at the beginning and speed cap',()=>{
 for(const map of [0,1,2,3,4])for(const speed of ['slow','normal','fast','extreme'])for(const difficulty of ['easy','normal','hard','extreme'])for(const time of [0,180]){
  const {engine:e}=setup();e.start(map,false,{speed,difficulty,density:'intense'});e.state='running';e.time=time;e.speed=D.difficulty(e.stage,time).speed;
  for(const type of e.stage.obstacles){
   e.obstacles=[];e.lastPlan=null;e.pendingObstacle=null;e.nextObstacle=1000;e.player.y=D.GROUND;e.player.grounded=true;e.player.vy=0;e.down=false;
   const o=obstacle(e,type);assert.ok(o,`${map}/${speed}/${difficulty}/${time}/${type}: rejected individual`);
   drive(e,()=>{},6);assert.equal(e.lives,3,`${map}/${speed}/${difficulty}/${time}/${type}: damage`);
  }
 }
});

test('all 320 free configurations stay playable with bounded memory and no generator stalls',()=>{
 for(const map of [0,1,2,3,4])for(const speed of ['slow','normal','fast','extreme'])for(const difficulty of ['easy','normal','hard','extreme'])for(const density of ['few','normal','many','intense']){
  const {engine:e}=setup();e.start(map,false,{speed,difficulty,density});e.state='running';e.patternRandom=D.seeded(map*1337+speed.length+difficulty.length+density.length);
  let previousCount=0,lastSpawn=0,maxSilence=0;
  drive(e,()=>{if(e.spawnCount!==previousCount){maxSilence=Math.max(maxSilence,e.time-lastSpawn);lastSpawn=e.time;previousCount=e.spawnCount;}assert.ok(e.obstacles.length<=9&&e.coins.length<=80&&e.particles.length<=120);},210,.015);
  const context=`${map}/${speed}/${difficulty}/${density}`;
  assert.equal(e.state,'running',context);assert.equal(e.lives,3,context);assert.ok(e.spawnCount>30,context);assert.ok(maxSilence<6&&e.time-lastSpawn<6,context);
 }
});

test('late encounters are denser and combinations remain playable across varied seeds',()=>{
 for(const stage of D.STAGES)for(let seed=0;seed<6;seed++){
  const {engine:e}=setup(stage.id);e.patternRandom=D.seeded(seed*4321);e.nextObstacle=3.2;const buckets=[0,0,0,0,0];let count=0,previous=null,closest=Infinity;
  drive(e,()=>{if(e.spawnCount!==count){count=e.spawnCount;const o=e.obstacles.at(-1);buckets[Math.min(4,Math.floor(e.time/stage.duration*5))]++;
   if(previous){assert.ok(o.plan.entry>=previous.plan.exit+.069);assert.ok(o.plan.start>=previous.plan.end+o.plan.recovery-1e-5);closest=Math.min(closest,o.plan.start-previous.plan.start);}
   previous=o;
  }},stage.duration+1,.012);
  assert.equal(e.state,'complete');assert.equal(e.lives,3);assert.ok(buckets[4]>buckets[0]*1.7,`${stage.name}: intensity ${buckets}`);assert.ok(closest<1.18,`${stage.name}: no close sequences`);
 }
});

test('campaign checkpoints taper from three to zero and final levels restart at zero after Game Over',()=>{
 assert.deepEqual(D.STAGES.map(s=>s.checkpoints.length),[3,2,1,0,0]);
 for(const stage of D.STAGES){const {engine:e,save,events}=setup(stage.id);e.nextObstacle=1000;drive(e);assert.equal(events.filter(t=>t==='checkpoint').length,stage.checkpoints.length);}
 for(const stage of [3,4]){const {engine:e,save}=setup(stage);e.time=150;e.update(DT);assert.equal(save.data.checkpoint,null);for(let i=0;i<3;i++){e.player.invulnerable=0;e.damage();}e.start(stage,true);assert.equal(e.time,0);assert.equal(e.lives,3);}
 const legacy={unlocked:5,coins:222,selected:'robot',owned:['dino','robot'],best:{4:4000},checkpoint:{stage:4,time:135}};
 const loaded=new D.Save(storage(JSON.stringify(legacy)));assert.equal(loaded.data.checkpoint,null);assert.equal(loaded.data.coins,222);assert.equal(loaded.data.selected,'robot');assert.equal(loaded.data.best[4],4000);
 const old=new D.Save(storage(JSON.stringify({...legacy,checkpoint:{stage:1,time:90}})));assert.equal(old.data.checkpoint.time,90);
});

test('dynamic motion, altitude, wheel rotation and horns stop during pause',()=>{
 const {engine:e}=setup(2),sounds=[];e.audio.sfx=name=>sounds.push(name);const car=obstacle(e,'car');car.willHonk=true;
 const x=car.x;advance(e,.2);assert.ok(x-car.x>e.stage.speed*.2);assert.ok(car.roll>0);advance(e,3);assert.equal(sounds.filter(s=>s==='horn').length,1);
 const age=car.age,roll=car.roll;e.pause();advance(e,1);assert.equal(car.age,age);assert.equal(car.roll,roll);
 const {engine:birdEngine}=setup(0),heights=new Set();let bobbed=false;
 for(let i=0;i<20;i++){birdEngine.obstacles=[];birdEngine.lastPlan=null;birdEngine.pendingObstacle=null;const bird=obstacle(birdEngine,'bird');heights.add(bird.baseY);const y=bird.y;advance(birdEngine,.1);if(bird.y!==y)bobbed=true;}
 assert.equal(heights.size,3);assert.equal(bobbed,true);
 const {engine:m}=setup(2);const moto=obstacle(m,'motorcycle');assert.ok(moto.motion>car.motion);
});

test('invalid free preferences are repaired without invalidating the v1 wallet or equipment',()=>{
 const save=new D.Save(storage(JSON.stringify({coins:90,freeOptions:{map:99,period:'no',speed:'warp',difficulty:null,density:'zero'},freeBest:-1})));
 assert.deepEqual(save.data.freeOptions,D.FREE_DEFAULTS);assert.equal(save.data.coins,90);assert.equal(save.data.freeBest,0);
 for(const freeOptions of [null,false,42,'broken']){const repaired=new D.Save(storage(JSON.stringify({coins:99,freeOptions})));assert.equal(repaired.data.coins,99);assert.deepEqual(repaired.data.freeOptions,D.FREE_DEFAULTS);}
});
