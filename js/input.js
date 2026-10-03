(function (D) {
  'use strict';
  // One controller per application lifetime. Restarts never register new listeners.
  class Input {
    constructor(engine, ui, audio) {
      this.engine=engine;this.ui=ui;this.audio=audio;
      this.keys=new Set();this.duckPointers=new Set();
      this.landscape=innerWidth>innerHeight;
      document.addEventListener('keydown',event=>this.keydown(event));
      document.addEventListener('keyup',event=>{this.keys.delete(event.code);this.syncDuck();});
      document.addEventListener('duna:release-input',()=>this.release());
      document.addEventListener('pointerover',event=>{
        const button=event.target.closest('button');
        if(button&&!button.disabled&&!button.contains(event.relatedTarget))this.audio.sfx('hover');
      });
      document.querySelectorAll('[data-touch]').forEach(button=>{
        button.addEventListener('pointerdown',event=>{
          event.preventDefault();
          if(!this.touch||this.ui.multiplayer||this.engine.state!=='running')return;
          this.audio.unlock();button.setPointerCapture(event.pointerId);button.classList.add('pressed');
          if(button.dataset.touch==='jump')this.engine.jump();
          else {this.duckPointers.add(event.pointerId);this.syncDuck();}
        });
        const release=event=>{this.duckPointers.delete(event.pointerId);button.classList.remove('pressed');this.syncDuck();};
        for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
        button.addEventListener('contextmenu',event=>event.preventDefault());
      });
      window.addEventListener('blur',()=>{this.release();this.ui.active.pause();});
      document.addEventListener('visibilitychange',()=>{if(document.hidden){this.release();this.ui.active.pause();}});
      window.addEventListener('resize',()=>{
        const landscape=innerWidth>innerHeight;
        if(this.touch&&landscape!==this.landscape){this.release();this.ui.active.pause();}
        this.landscape=landscape;
      });
    }
    get touch() {return this.ui.device==='mobile';}
    syncDuck() {
      if(this.ui.multiplayer){this.ui.race.crouch(0,this.keys.has('KeyS'));this.ui.race.crouch(1,this.keys.has('ArrowDown'));}
      else this.engine.crouch(this.touch?this.duckPointers.size>0:this.keys.has('ArrowDown'));
    }
    release() {
      this.keys.clear();this.duckPointers.clear();this.engine.crouch(false);this.engine.jumpBuffer=0;
      this.ui.race?.release();
      document.querySelectorAll('.touch-button.pressed').forEach(button=>button.classList.remove('pressed'));
    }
    menuElements() {
      const overlay=document.getElementById('game-overlay');
      const root=this.ui.screen==='game'&&!overlay.hidden?overlay:document.getElementById(this.ui.screen+'-screen');
      return [...root.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(el=>el.getClientRects().length);
    }
    navigate(code) {
      const elements=this.menuElements();if(!elements.length)return;
      const current=document.activeElement,index=elements.indexOf(current);
      let next;
      if(index<0)next=elements.find(el=>el.classList.contains('play-button'))||elements[0];
      else {
        const a=current.getBoundingClientRect(),ax=a.x+a.width/2,ay=a.y+a.height/2;
        const vertical=code==='ArrowUp'||code==='ArrowDown',sign=['ArrowUp','ArrowLeft'].includes(code)?-1:1;
        let best=Infinity;
        for(const el of elements){if(el===current)continue;const b=el.getBoundingClientRect(),dx=b.x+b.width/2-ax,dy=b.y+b.height/2-ay;
          const primary=vertical?dy:dx,secondary=vertical?dx:dy;
          if(primary*sign>5){const score=Math.abs(primary)+Math.abs(secondary)*3;if(score<best){best=score;next=el;}}
        }
        if(!next)next=elements[(index+sign+elements.length)%elements.length];
      }
      next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest'});this.audio.sfx('hover');
    }
    keydown(event) {
      const active=this.ui.active,playing=this.ui.screen==='game'&&['running','countdown'].includes(active.state);
      if(event.code==='Escape') {
        event.preventDefault();if(event.repeat)return;this.release();
        if(this.ui.screen==='game'){if(active.state==='paused')active.resume();else active.pause();}
        else if(this.ui.screen!=='home')this.ui.action('back');
        return;
      }
      if(!playing){
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();this.audio.unlock();this.navigate(event.code);return;}
        if(event.code==='Enter'&&(document.activeElement===document.body||document.activeElement?.id==='game-canvas')){event.preventDefault();const first=this.menuElements()[0];if(first)first.click();return;}
        if(event.code==='Tab'&&this.ui.screen==='game'){
          const elements=this.menuElements(),first=elements[0],last=elements.at(-1);
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
        }
        return;
      }
      if(this.touch)return;
      if(this.ui.multiplayer){
        if(['KeyW','KeyS','Space','ArrowUp','ArrowDown'].includes(event.code))event.preventDefault();
        if(!event.repeat){if(event.code==='KeyW')active.jump(0);if(event.code==='ArrowUp')active.jump(1);}
        if(['KeyS','ArrowDown'].includes(event.code)){this.keys.add(event.code);this.syncDuck();}return;
      }
      if(['Space','ArrowUp','ArrowDown'].includes(event.code))event.preventDefault();
      if(['Space','ArrowUp'].includes(event.code)&&!event.repeat){this.audio.unlock();this.engine.jump();}
      if(event.code==='ArrowDown'){this.keys.add(event.code);this.syncDuck();}
    }
  }
  D.Input=Input;
})(globalThis.Duna = globalThis.Duna || {});
