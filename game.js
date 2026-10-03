(function (D) {
  'use strict';
  let storage;
  try { storage=localStorage; } catch { storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}}; }
  const save=new D.Save(storage),audio=new D.AudioSystem(save),ui=new D.UI(save,audio);
  const engine=new D.Engine(save,audio,type=>ui.event(type));ui.connect(engine);
  const race=new D.Race(save,audio,type=>ui.raceEvent(type));ui.race=race;
  const gameRenderer=new D.Renderer(document.getElementById('game-canvas'));
  const menuCanvas=document.getElementById('menu-canvas'),menuRenderer=new D.Renderer(menuCanvas);
  let elapsed=0,last=performance.now(),accumulator=0,hudClock=0,menuClock=0;
  const STEP=1/120;
  function resize() {
    menuRenderer.resize();gameRenderer.resize();
    ui.paintWorlds('stage-worlds');ui.paintCharacters();ui.paintFree();
  }
  document.addEventListener('duna:screen',resize);
  const input=new D.Input(engine,ui,audio);
  ui.show(ui.device?'home':'device');resize();
  if(!save.available)ui.toast('O navegador bloqueou o salvamento. Permita armazenamento para guardar seu progresso.');
  document.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button&&!button.disabled)ui.action(button.dataset.action,button);});
  for(const [id,key] of [['music-setting','music'],['sfx-setting','sfx'],['motion-setting','reducedMotion']])document.getElementById(id).addEventListener('change',event=>{audio.unlock();save.setting(key,event.target.checked);ui.refresh();});
  window.addEventListener('resize',resize);
  document.addEventListener('fullscreenchange',resize);
  document.addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;});
  window.addEventListener('pagehide',()=>save.write());
  // Fixed 120 Hz simulation gives identical jumps at 60/120/144 Hz displays.
  function frame(now) {
    const delta=Math.min((now-last)/1000,.1);last=now;
    if(!document.hidden){
      if(ui.screen==='game'){
        const active=ui.active;
        if(['countdown','running'].includes(active.state)){accumulator+=delta;while(accumulator>=STEP){active.update(STEP);accumulator-=STEP;}elapsed+=delta;}else accumulator=0;
        if(ui.multiplayer)gameRenderer.race(race,elapsed);else gameRenderer.game(engine,save.data,elapsed);
        hudClock+=delta;if(hudClock>=.05){ui.hud();hudClock=0;}
      } else {
        if(!save.data.settings.reducedMotion)elapsed+=delta;
        menuClock+=delta;
        if(menuClock>=1/30){menuRenderer.menu(save.data.settings.reducedMotion?1:elapsed,save.data);menuClock=0;}
      }
      audio.update((ui.screen!=='game'&&!ui.returnToGame)||ui.active.state==='running',ui.multiplayer?2:engine.stage?.id||0,ui.screen==='game'?ui.active:null);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // A small explicit read-only diagnostic surface is useful when checking saved progress.
  D.inspect=()=>({screen:ui.screen,device:ui.device,state:ui.active.state,mode:ui.multiplayer?'race':engine.mode,period:engine.period,stage:engine.stage?.id,time:ui.active.time,lives:engine.lives,coins:engine.collected,unlocked:save.data.unlocked,saveAvailable:save.available,speed:engine.speed,obstacles:engine.obstacles.length,particles:engine.particles.length,touch:input.touch,race:ui.multiplayer?{winner:race.winner,countdown:race.countdown,target:race.target,players:race.players.map(p=>({time:p.time,lives:p.lives,score:p.score,distance:p.distance,cleared:p.cleared,speed:p.speed,duck:p.player.duck,y:p.player.y,crashes:p.crashes}))}:null});
})(globalThis.Duna);
