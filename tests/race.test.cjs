const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../js/config.js');require('../js/save.js');require('../js/engine.js');require('../js/race.js');
const D=globalThis.Duna,dt=1/120;
function setup(){const save=new D.Save({getItem:()=>null,setItem:()=>{}}),events=[];const race=new D.Race(save,{sfx:()=>{}},type=>events.push(type));race.start();return {race,save,events};}
function drive(p){p.crouch(p.obstacles.some(o=>o.plan.action==='duck'&&p.time>=o.plan.start&&p.time<=o.plan.end));for(const o of p.obstacles)if(o.plan.action==='jump'&&p.time>=o.plan.start+.012&&!o.jumped){p.jump();o.jumped=true;}}
test('countdown, shared pause and restart freeze and reset both independent tracks',()=>{
 const {race:r}=setup();r.update(1);assert.equal(r.countdown,2);assert.equal(r.players[0].time,0);r.pause();r.update(1);assert.equal(r.countdown,2);r.resume();r.update(2);assert.equal(r.state,'running');
 r.jump(0);r.crouch(1,true);r.update(dt);assert.ok(r.players[0].player.y<D.GROUND);assert.equal(r.players[1].player.y,D.GROUND);assert.equal(r.players[1].player.duck,true);assert.equal(r.players[0].down,false);
 r.pause();const time=r.time;r.update(10);assert.equal(r.time,time);assert.equal(r.players[1].down,false);r.resume();r.start();assert.equal(r.state,'countdown');assert.equal(r.time,0);for(const p of r.players){assert.equal(p.distance,0);assert.equal(p.lives,3);assert.equal(p.obstacles.length,0);assert.equal(p.jumpBuffer,0);}
});
test('same course remains fair after independent impacts; race leaves campaign and wallet intact',()=>{
 const {race:r,save}=setup();save.checkpoint({stage:0,time:40,coins:2,score:530,distance:20000});save.earn(200);save.buy('robot');const before=JSON.stringify(save.data);
 r.state='running';for(let n=0;n<30*120;n++){for(const p of r.players)drive(p);r.update(dt);}const [a,b]=r.players;
 assert.equal(a.distance,b.distance);assert.deepEqual(a.obstacles.map(o=>[o.type,o.motion,o.plan]),b.obstacles.map(o=>[o.type,o.motion,o.plan]));
 const distance=a.distance;a.damage();assert.equal(a.distance,distance-1800);assert.equal(b.distance,distance);assert.equal(a.lives,2);assert.equal(b.lives,3);
 for(let i=0;i<2;i++){a.player.invulnerable=0;a.damage();}assert.equal(a.lives,3);assert.equal(a.rescues,1);assert.equal(a.distance,distance-7200);assert.equal(a.state,'running');
 r.update(dt);assert.equal(a.speed,b.speed);assert.equal(a.time,b.time);assert.equal(JSON.stringify(save.data),before);
});
test('complete playable race gives equal hazards, counts cleared obstacles and resolves ties once',()=>{
 const {race:r,events}=setup();r.state='running';
 for(let n=0;n<100*120&&r.state==='running';n++){for(const p of r.players)drive(p);r.update(dt);for(const p of r.players){assert.ok(p.obstacles.length<10);assert.ok(p.coins.length<80);assert.ok(p.particles.length<=120);}}
 assert.equal(r.state,'complete');assert.equal(r.winner,'tie');assert.ok(r.players[0].cleared>70);assert.equal(r.players[0].crashes,0);assert.equal(r.players[1].crashes,0);assert.equal(r.players[0].score,r.players[1].score);assert.ok(r.players[0].finishTime>=89.98&&r.players[0].finishTime<90.02);
 r.update(1);assert.equal(events.filter(v=>v==='complete').length,1);
});
test('one finish or simultaneous finish uses distance crossing, never lane iteration order',()=>{
 for(const winner of [0,1])for(const simultaneous of [false,true]){
  const {race:r}=setup();r.state='running';for(const [i,p] of r.players.entries()){p.distance=r.target-(i===winner?1:simultaneous?4:100);p.nextObstacle=100;p.nextCoins=100;}
  r.update(dt);assert.equal(r.winner,winner);assert.equal(r.state,'complete');assert.equal(r.players[winner].distance,r.target);
 }
});
test('travel integrates the acceleration ramp, including the final surge and endless cap',()=>{
 for(const s of D.STAGES){let distance=0;for(let t=0;t<s.duration+30;t+=dt)distance+=D.difficulty(s,t+dt/2).speed*dt;assert.ok(Math.abs(distance-D.travel(s,0,s.duration+30))<30);assert.ok(s.maxSpeed/s.speed>=2.4);const middle=D.difficulty(s,s.duration*.7);assert.ok(s.maxSpeed-middle.speed>(middle.speed-s.speed)*.85);}
 const fast=D.freeStage({speed:'fast'}),extreme=D.freeStage({speed:'extreme'});assert.ok(extreme.speed>fast.speed*1.7);assert.ok(extreme.maxSpeed>2400);
});
test('discarded render objects still reserve jump recovery at extreme speed',()=>{
 const {race:r}=setup(),p=r.players[0];p.time=90;p.speed=p.stage.maxSpeed;assert.equal(p.spawnObstacle('car'),true);const previous=p.obstacles[0].plan;p.obstacles=[];
 p.time+=.4;for(let i=0;i<250&&!p.spawnObstacle('motorcycle');i++)p.time+=dt;
 assert.ok(p.obstacles.length);assert.ok(p.obstacles[0].plan.start>=previous.end+p.obstacles[0].plan.recovery-1e-6);
});
