(function (D) {
  'use strict';
  // Two existing engines, one clock and one animation loop. Race rewards are local.
  class Race {
    constructor(save,audio,onEvent=()=>{}) {
      this.save=save;this.audio=audio;this.onEvent=onEvent;this.state='idle';this.players=[];this.round=0;
    }
    start(characters=[this.save.data.selected,this.save.data.selected]) {
      this.round++;this.state='countdown';this.countdown=3;this.time=0;this.goTime=0;this.winner=null;
      const seed=7193+this.round*977;
      this.players=[0,1].map(index=>{
        const local={data:{...this.save.data,selected:this.save.data.owned.includes(characters[index])?characters[index]:this.save.data.selected},earn:()=>{}};
        const e=new D.Engine(local,this.audio,type=>{
          if(type==='damage')e.notice='IMPACTO · −75 m';
          if(type==='race-rescue')e.notice='RESGATE · −150 m';
          if(['damage','race-rescue'].includes(type))e.noticeUntil=this.time+2;
        });
        e.start(2,false,{map:2,speed:'fast',difficulty:'hard',density:'many'});
        e.mode='race';e.stage={...D.STAGES[2],duration:90,speed:850,maxSpeed:2450,startInterval:2.1,endInterval:.44,challenge:.7,checkpoints:[]};
        e.speed=e.stage.speed;e.random=D.seeded(seed+index);e.patternRandom=D.seeded(seed);
        e.state='running';e.finishTime=null;e.notice='';return e;
      });
      this.target=D.travel(this.players[0].stage,0,90);this.characters=characters.slice();this.onEvent('start');
    }
    jump(index) {if(this.state==='running')this.players[index]?.jump();}
    crouch(index,down) {this.players[index]?.crouch(this.state==='running'&&down);}
    release() {for(const p of this.players){p.crouch(false);p.jumpBuffer=0;}}
    pause() {if(['running','countdown'].includes(this.state)){this.beforePause=this.state;this.state='paused';this.release();this.onEvent('pause');}}
    resume() {if(this.state==='paused'){this.state=this.beforePause;this.release();this.onEvent('resume');}}
    stop() {this.state='idle';this.release();for(const p of this.players)p.stop();}
    update(dt) {
      if(this.state==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.state='running';this.goTime=.8;this.onEvent('go');}return;}
      if(this.state!=='running')return;
      this.time+=dt;this.goTime=Math.max(0,this.goTime-dt);
      // Evaluate both finish crossings before deciding, independent of lane order.
      for(const p of this.players){
        const before=p.distance;p.update(dt);
        if(p.distance>=this.target){p.finishTime=this.time-dt+dt*(this.target-before)/(p.distance-before);p.distance=this.target;}
      }
      const crossed=this.players.map((p,i)=>({time:p.finishTime,index:i})).filter(p=>p.time!==null).sort((a,b)=>a.time-b.time);
      if(crossed.length){
        this.winner=crossed.length===2&&Math.abs(crossed[0].time-crossed[1].time)<.001?'tie':crossed[0].index;
        this.state='complete';this.release();for(const p of this.players)p.state='complete';
        this.audio.sfx('complete');this.onEvent('complete');
      }
    }
  }
  D.Race=Race;
})(globalThis.Duna);
