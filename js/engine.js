(function (D) {
  'use strict';
  const P=D.PHYSICS;
  const rectsOverlap=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
  function seeded(seed) {let a=seed>>>0;return()=>{a+=0x6D2B79F5;let n=a;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;};}
  // Time-based simulation, independent of rendering. Safe to run in Node for verification.
  class Engine {
    constructor(save,audio,onEvent=()=>{}) {this.save=save;this.audio=audio;this.onEvent=onEvent;this.state='idle';this.obstacles=[];this.coins=[];this.particles=[];this.jumpBuffer=0;this.down=false;this.flash=0;}
    start(stageId,resume=false,freeOptions=null) {
      if(!Number.isInteger(stageId)||stageId<0||(!freeOptions&&stageId>=this.save.data.unlocked)||stageId>=D.STAGES.length)return false;
      this.mode=freeOptions?'free':'stages';this.options=freeOptions?D.freeOptions({...freeOptions,map:stageId}):null;
      this.period=this.options?.period||'day';this.stage=freeOptions?D.freeStage(this.options):D.STAGES[stageId];
      const cp=!freeOptions&&this.stage.checkpoints.length&&resume&&this.save.data.checkpoint?.stage===stageId?this.save.data.checkpoint:null;
      this.time=cp?.time||0;this.distance=cp?.distance||0;this.collected=cp?.coins||0;this.score=cp?.score||0;
      this.checkpointTime=cp?.time||0;
      this.lives=3;this.cleared=0;this.crashes=0;this.rescues=0;this.speed=D.difficulty(this.stage,this.time).speed;this.obstacles=[];this.coins=[];this.particles=[];
      this.player={x:P.playerX,y:D.GROUND,vy:0,grounded:true,duck:false,invulnerable:0,slide:0};
      this.down=false;this.jumpBuffer=0;this.flash=0;this.nextObstacle=3.2;this.nextCoins=.8;this.spawnCount=0;this.effectClock=0;this.countdown=2.4;
      this.random=seeded(187+stageId*971+Math.floor(this.time)*31);
      this.patternRandom=seeded(187+stageId*971+Math.floor(this.time)*31);
      this.sequence=[];this.lastType=null;this.lastPlan=null;this.sequenceSize=0;this.pendingObstacle=null;this.combo=[];this.motionTime=0;
      if(!cp&&!freeOptions)this.save.checkpoint(null);
      this.state='countdown';this.onEvent('start');return true;
    }
    jump() {if(this.state==='running')this.jumpBuffer=.14;}
    crouch(down) {this.down=down;}
    pause() {if(this.state==='running'||this.state==='countdown'){this.beforePause=this.state;this.state='paused';this.down=false;this.jumpBuffer=0;this.onEvent('pause');}}
    resume() {if(this.state==='paused'){this.state=this.beforePause||'running';this.down=false;this.jumpBuffer=0;this.onEvent('resume');}}
    stop() {this.state='idle';this.down=false;this.jumpBuffer=0;}
    burst(x,y,color,count=10,star=false) {if(this.save.data.settings.reducedMotion)return;for(let i=0;i<count&&this.particles.length<120;i++){const life=.3+this.random()*.45;this.particles.push({x,y,vx:(this.random()-.5)*190,vy:-this.random()*230,life,max:life,size:2+this.random()*4,color,star});}}
    damage(o) {
      if(this.player.invulnerable>0||this.state!=='running')return;
      this.lives--;this.crashes++;this.player.invulnerable=2;this.flash=.4;
      if(o)o.hit=true;
      this.burst(this.player.x+30,this.player.y-45,'#e7c78a',18);this.audio.sfx('damage');this.onEvent('damage');
      if(this.mode==='race'){
        // Race penalties change progress, never the shared obstacle clock.
        this.distance=Math.max(0,this.distance-1800);
        if(this.lives<=0){this.lives=3;this.rescues++;this.distance=Math.max(0,this.distance-1800);this.player.invulnerable=3;this.onEvent('race-rescue');}
      } else if(this.lives<=0){this.state='over';this.down=false;if(this.mode==='free')this.save.bestFree(this.score);else this.save.best(this.stage.id,this.score);this.audio.sfx('over');this.onEvent('over');}
    }
    // A shuffled bag expands during the level, introducing harder actions gradually.
    chooseObstacle() {
      const pool=this.stage.obstacles;
      const d=D.difficulty(this.stage,this.time);
      const count=Math.min(pool.length,2+Math.floor(d.progress*5+this.stage.challenge*2));
      if(!this.sequence.length||this.sequenceSize!==count){
        this.sequence=pool.slice(0,count);this.sequenceSize=count;
        for(let i=count-1;i>0;i--){const j=Math.floor(this.patternRandom()*(i+1));[this.sequence[i],this.sequence[j]]=[this.sequence[j],this.sequence[i]];}
        if(this.sequence.at(-1)===this.lastType)this.sequence.reverse();
      }
      const moving=pool.filter(t=>['bird','animal','car','motorcycle','ice','snowball','falling'].includes(t));
      if(moving.length&&this.patternRandom()<d.intensity*.3)return moving[Math.floor(this.patternRandom()*moving.length)];
      return this.sequence.pop();
    }
    // Reserve a playable action window against real, accelerating trajectories.
    // Faster followers cannot overtake a preceding hazard before the player.
    planObstacle(o,d) {
      const inset=o.type==='tree'?21:['pit','fissure','lava','platform'].includes(o.type)?8:5;
      const entry=this.time+D.arrival(this.stage,this.time,(o.x+inset-(P.playerX+86))/o.motion);
      const exit=this.time+D.arrival(this.stage,this.time,(o.x+o.w-inset-(P.playerX+4))/o.motion);
      // At extreme speed the obstacle may leave the screen before its jump lands.
      // Keep the action reservation even after its render object is discarded.
      const previous=this.lastPlan||this.obstacles.at(-1)?.plan;
      if(previous&&entry<previous.exit+.07)return null;
      // Conservatively use the camera at spawn; it only widens as speed rises.
      const view=D.minView(this.speed),right=view+Math.max(0,P.playerX-view*.18);
      const visible=this.time+D.arrival(this.stage,this.time,Math.max(0,o.x-right)/o.motion);
      const overhead=['bird','branch','sign'].includes(o.type),ice=o.type==='icepatch';
      const air=-2*P.jump/P.gravity;
      let earliest=entry-.03,latest=earliest,start=earliest,end=exit+.04,action=ice?'run':overhead?'duck':'jump';
      if(action==='jump') {
        const height=['pit','fissure','lava'].includes(o.type)?30:o.h+5;
        const root=Math.sqrt(P.jump*P.jump-2*P.gravity*height);
        const rise=(-P.jump-root)/P.gravity,fall=(-P.jump+root)/P.gravity;
        earliest=exit-fall+.025;latest=entry-rise-.025;
        if(latest-earliest<d.precision)return null;
        start=Math.max((earliest+latest)/2,visible+d.reaction);
        if(previous)start=Math.max(start,previous.end+d.recovery+(previous.action==='run'?.23:0));
        if(start>latest-d.precision*.25)return null;
        end=start+air+.035;
      } else if(previous&&start<previous.end+d.recovery)return null;
      // Visible lead-in on the narrowest camera, including the time to rise.
      if(start-visible+1e-6<d.reaction)return null;
      return {action,start,end,entry,exit,earliest,latest,visible,reaction:d.reaction,recovery:d.recovery};
    }
    makeObstacle(type,d) {
      const specs={cactus:[58,99],rock:[76,64],bird:[95,49],pit:[170,55],log:[100,67],branch:[130,48],animal:[94,64],cone:[56,80],barrier:[114,78],car:[170,78],motorcycle:[111,83],sign:[114,53],ice:[85,84],tree:[91,117],icepatch:[290,18],snowball:[78,78],falling:[71,72],fissure:[190,55],platform:[245,72],lava:[200,55]};
      let [w,h]=specs[type];
      const rng=this.patternRandom;
      let motion=1;
      if(type==='bird')motion=1.08+rng()*.16;
      if(type==='animal')motion=1.04+rng()*.10;
      if(type==='car')motion=1.04+rng()*.16;
      if(type==='motorcycle')motion=1.21+rng()*.13;
      if(type==='ice'||type==='snowball')motion=1.03+rng()*.12;
      const overhead=['bird','branch','sign'].includes(type);
      if(!overhead&&type!=='icepatch') {
        // At the slowest free setting even the player's own width takes time
        // to cross a tall object. Scale its silhouette before planning the jump.
        if(!['pit','fissure','lava'].includes(type)){
          const minimumAir=122/(this.speed*motion)+d.precision+.07;
          h=Math.min(h,Math.max(55,(P.jump*P.jump-(minimumAir*P.gravity/2)**2)/(2*P.gravity)-5));
        }
        const height=['pit','fissure','lava'].includes(type)?30:h+5;
        const safeAir=2*Math.sqrt(P.jump*P.jump-2*P.gravity*height)/P.gravity;
        w=Math.min(w,Math.max(40,this.speed*motion*(safeAir-d.precision-.07)-82));
      }
      const o={type,x:D.spawnX(this.stage),w,h,motion,phase:rng()*Math.PI*2,age:0,roll:0,hit:false,
        y:overhead?D.GROUND-143:D.GROUND-h,honked:false,willHonk:rng()<.62};
      if(type==='bird'){o.y=D.GROUND-[137,151,169][Math.floor(rng()*3)];o.bob=rng()<.55?6:0;}
      o.baseY=o.y;
      if(type==='falling'){o.y=D.GROUND-540;o.fallSpeed=0;o.warning=true;}
      return o;
    }
    spawnObstacle(requestedType) {
      const difficulty=D.difficulty(this.stage,this.time);
      if(requestedType&&this.pendingObstacle?.type!==requestedType)this.pendingObstacle=null;
      if(!this.pendingObstacle){
        let type=this.stage.obstacles.includes(requestedType)?requestedType:this.combo.shift();
        if(!type){
          if(this.patternRandom()<difficulty.comboChance){
            const patterns=[['cactus','bird','rock'],['bird','cactus'],['rock','rock'],['log','branch','animal'],['bird','log'],['animal','bird'],['car','motorcycle'],['car','car'],['sign','motorcycle','barrier'],['barrier','sign','car'],['tree','ice'],['snowball','rock','snowball'],['falling','fissure','falling'],['platform','falling','lava']].filter(p=>p.every(t=>this.stage.obstacles.includes(t)));
            if(patterns.length){const pattern=patterns[Math.floor(this.patternRandom()*patterns.length)];type=pattern[0];this.combo=pattern.slice(1);}
          }
          if(!type)type=this.chooseObstacle();
        }
        this.pendingObstacle=this.makeObstacle(type,difficulty);
      }
      const o=this.pendingObstacle,plan=this.planObstacle(o,difficulty);
      const previous=this.obstacles.at(-1);
      const clearance=previous?o.x-(previous.x+previous.w):Infinity;
      if(!plan||clearance<50){this.nextObstacle=.04;return false;}
      const {type,w}=o,overhead=['bird','branch','sign'].includes(type);
      o.plan=plan;this.lastPlan=plan;o.clearance=clearance;this.pendingObstacle=null;
      this.obstacles.push(o);
      this.spawnCount++;this.lastType=type;
      // Coin arcs suggest the safe jump line, while overhead hazards keep coins low.
      const start=o.x-75;
      for(let i=0;i<5;i++)this.coins.push({x:start+i*(w+150)/4,y:overhead||type==='icepatch'?D.GROUND-26:D.GROUND-88-Math.sin(i/4*Math.PI)*125,collected:false});
      const variation=.8+this.patternRandom()*.4;
      this.nextObstacle=this.combo.length?.12:difficulty.interval*variation;
      return true;
    }
    box() {const p=this.player;return{x:p.x+4,y:p.y-(p.duck?P.duckHeight:P.height)+7,w:p.duck?82:P.width-7,h:(p.duck?P.duckHeight:P.height)-13};}
    update(dt) {
      if(this.state==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.state='running';this.onEvent('go');}return;}
      if(this.state!=='running')return;
      // Use a fixed small step from the main loop to prevent collision tunneling.
      dt=Math.min(dt,1/30);
      this.time=this.mode!=='stages'?this.time+dt:Math.min(this.stage.duration,this.time+dt);
      this.speed=D.difficulty(this.stage,this.time).speed;
      this.distance+=this.speed*dt;
      this.motionTime+=dt*this.speed/600;
      // Score is reconstructed from elapsed time and run coins, including checkpoint coins.
      this.score=Math.floor(this.time*12+this.collected*25);
      this.nextObstacle-=dt;this.nextCoins-=dt;this.flash=Math.max(0,this.flash-dt);this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
      const p=this.player;p.invulnerable=Math.max(0,p.invulnerable-dt);
      const onIce=this.obstacles.some(o=>o.type==='icepatch'&&p.x+P.width>o.x&&p.x<o.x+o.w)&&p.grounded;
      if(this.down&&p.grounded)p.slide=onIce?.23:0;
      else p.slide=Math.max(0,p.slide-dt);
      p.duck=(this.down||p.slide>0)&&p.grounded;
      if(this.jumpBuffer>0&&p.grounded){p.vy=P.jump;p.grounded=false;p.duck=false;p.slide=0;this.jumpBuffer=0;this.audio.sfx('jump');this.burst(p.x+20,p.y,'#b9bd8a',6);}
      const previousY=p.y;
      if(!p.grounded){p.vy+=P.gravity*dt;if(this.down&&p.vy>0)p.vy+=P.gravity*dt*.35;p.y+=p.vy*dt;}
      for(const o of this.obstacles){
        const velocity=this.speed*o.motion;o.x-=velocity*dt;o.age+=dt;o.roll+=velocity*dt/18;
        if(o.type==='bird')o.y=o.baseY+Math.sin(o.age*3+o.phase)*o.bob;
        if(o.type==='animal')o.y=o.baseY-Math.abs(Math.sin(o.age*16))*4;
        if(['car','motorcycle'].includes(o.type)&&o.willHonk&&!o.honked&&(o.x-p.x)/velocity<.9){o.honked=true;this.audio.sfx(o.type==='car'?'horn':'bikeHorn');}
        if(o.type==='falling') {const arrival=(o.x-p.x)/velocity;if(arrival<1.15){o.fallSpeed+=1800*dt;o.y=Math.min(D.GROUND-o.h,o.y+o.fallSpeed*dt);o.warning=o.y<D.GROUND-o.h;}}
      }
      // Elevated volcanic platforms support the feet only when landing from above.
      let support=D.GROUND;
      for(const o of this.obstacles)if(o.type==='platform'&&p.x+P.width-8>o.x+16&&p.x+8<o.x+o.w-16&&previousY<=o.y+10&&p.vy>=0)support=Math.min(support,o.y);
      if(p.y>=support){p.y=support;p.vy=0;p.grounded=true;}
      else if(p.grounded&&support>p.y+2)p.grounded=false;
      p.duck=(this.down||p.slide>0)&&p.grounded;
      const box=this.box();
      for(const o of this.obstacles) {
        if(o.hit||o.type==='icepatch')continue;
        if(['pit','fissure','lava','platform'].includes(o.type)) {
          if(p.x+P.width*.63>o.x+8&&p.x+P.width*.35<o.x+o.w-8&&p.y>D.GROUND-18){this.damage(o);p.y=D.GROUND-45;p.vy=-340;p.grounded=false;this.onEvent('rescue');}
        } else {
          const inset=o.type==='tree'?21:o.type==='cactus'?5:8;
          const obstacleBox={x:o.x+inset,y:o.y+6,w:o.w-inset*2,h:o.h-9};
          if(rectsOverlap(box,obstacleBox))this.damage(o);
        }
        if(this.state!=='running')break;
      }
      if(this.state!=='running')return;
      for(const coin of this.coins){coin.x-=this.speed*dt;if(!coin.collected&&rectsOverlap(box,{x:coin.x-15,y:coin.y-17,w:30,h:34})){coin.collected=true;this.collected++;this.score=Math.floor(this.time*12+this.collected*25);this.save.earn(1);this.audio.sfx('coin');this.burst(coin.x,coin.y,'#dcb558',7,true);}}
      for(const o of this.obstacles)if(!o.passed&&o.x+o.w<P.playerX){o.passed=true;if(!o.hit&&o.type!=='icepatch')this.cleared++;}
      this.obstacles=this.obstacles.filter(o=>o.x+o.w>-150);this.coins=this.coins.filter(o=>o.x>-60&&!o.collected);
      if(this.nextObstacle<=0&&(this.mode!=='stages'||this.stage.duration-this.time>1.5))this.spawnObstacle();
      if(this.nextCoins<=0){this.nextCoins=5.5;const x=D.spawnX(this.stage)+20;if(!this.obstacles.some(o=>Math.abs(o.x-x)<380))for(let i=0;i<4;i++)this.coins.push({x:x+i*54,y:D.GROUND-50,collected:false});}
      this.effectClock+=dt;if(this.effectClock>Math.max(.035,.12-this.speed/20000)&&p.grounded){this.effectClock=0;this.burst(p.x-3,p.y-3,this.save.data.trail?'#dec277':'#b9be8b',this.save.data.trail?2:1,this.save.data.trail);}
      for(const a of this.particles){a.x+=(a.vx-this.speed*.3)*dt;a.y+=a.vy*dt;a.vy+=600*dt;a.life-=dt;}this.particles=this.particles.filter(a=>a.life>0);
      if(this.state!=='running')return;
      const checkpoint=this.stage.checkpoints.filter(t=>t<=this.time).at(-1)||0;
      if(checkpoint>this.checkpointTime&&checkpoint<this.stage.duration){this.checkpointTime=checkpoint;this.save.checkpoint({stage:this.stage.id,time:checkpoint,score:this.score,coins:this.collected,distance:this.distance});this.audio.sfx('checkpoint');this.onEvent('checkpoint');}
      if(this.mode==='stages'&&this.time>=this.stage.duration){this.state='complete';this.save.finish(this.stage.id,this.score);this.audio.sfx('complete');this.onEvent('complete');}
    }
  }
  D.Engine=Engine;D.overlap=rectsOverlap;D.seeded=seeded;
})(globalThis.Duna = globalThis.Duna || {});
