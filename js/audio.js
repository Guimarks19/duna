(function (D) {
  'use strict';
  // Original, lightweight synthesized sounds: no remote assets or autoplay dependency.
  class AudioSystem {
    constructor(save) { this.save = save; this.context = null; this.nextNote = 0; this.note = 0; }
    unlock() {
      try {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return;
        if (!this.context) {
          this.context = new Audio();this.master=this.context.createGain();this.master.gain.value=.33;this.master.connect(this.context.destination);
          this.musicGain=this.context.createGain();this.sfxGain=this.context.createGain();
          this.musicGain.connect(this.master);this.sfxGain.connect(this.master);
          this.engineTone=this.context.createOscillator();this.engineTone.type='sawtooth';
          this.engineGain=this.context.createGain();this.engineGain.gain.value=0;
          this.engineFilter=this.context.createBiquadFilter();this.engineFilter.type='lowpass';this.engineFilter.frequency.value=420;
          this.engineTone.connect(this.engineFilter);this.engineFilter.connect(this.engineGain);this.engineGain.connect(this.sfxGain);this.engineTone.start();
          const buffer=this.context.createBuffer(1,this.context.sampleRate,this.context.sampleRate),noise=buffer.getChannelData(0);
          for(let i=0;i<noise.length;i++)noise[i]=Math.random()*2-1;
          this.wind=this.context.createBufferSource();this.wind.buffer=buffer;this.wind.loop=true;
          this.windFilter=this.context.createBiquadFilter();this.windFilter.type='lowpass';this.windFilter.frequency.value=600;
          this.windGain=this.context.createGain();this.windGain.gain.value=0;
          this.wind.connect(this.windFilter);this.windFilter.connect(this.windGain);this.windGain.connect(this.sfxGain);this.wind.start();
        }
        if (this.context.state==='suspended') this.context.resume().catch(()=>{});
      } catch { /* The game remains playable if audio is unavailable. */ }
    }
    tone(freq,duration=.12,type='sine',volume=.12,delay=0,endFreq,channel='sfx') {
      const c = this.context;
      if (!c || c.state !== 'running') return;
      const start=c.currentTime+delay, o=c.createOscillator(), g=c.createGain();
      o.type=type; o.frequency.setValueAtTime(freq,start);
      if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq,start+duration);
      g.gain.setValueAtTime(0,start); g.gain.linearRampToValueAtTime(volume,start+.012); g.gain.exponentialRampToValueAtTime(.0001,start+duration);
      o.connect(g); g.connect(channel==='music'?this.musicGain:this.sfxGain); o.start(start); o.stop(start+duration+.02);
      o.onended=()=>{o.disconnect();g.disconnect();};
    }
    sfx(name) {
      if (!this.save.data.settings.sfx) return;
      if(name==='jump') this.tone(300,.2,'sine',.17,0,670);
      if(name==='coin') {this.tone(880,.12,'sine',.12);this.tone(1320,.16,'sine',.1,.065);}
      if(name==='damage') this.tone(170,.28,'sawtooth',.09,0,70);
      if(name==='checkpoint') [440,554,659].forEach((f,i)=>this.tone(f,.3,'sine',.12,i*.1));
      if(name==='complete') [523,659,784,1047].forEach((f,i)=>this.tone(f,.5,'triangle',.17,i*.14));
      if(name==='over') [392,330,262,196].forEach((f,i)=>this.tone(f,.4,'triangle',.13,i*.2));
      if(name==='click') this.tone(620,.07,'sine',.07);
      if(name==='horn'){this.tone(310,.17,'square',.055);this.tone(392,.17,'square',.04);}
      if(name==='bikeHorn')this.tone(570,.13,'square',.055,0,490);
      if(name==='hover'&&this.context&&(this.lastHover||0)<this.context.currentTime-.075){this.lastHover=this.context.currentTime;this.tone(440,.045,'sine',.035);}
    }
    update(active,stage=0,engine=null) {
      if(!this.context)return;
      const music=Boolean(active&&this.save.data.settings.music),sfx=this.save.data.settings.sfx;
      // Separate buses stop already-playing notes when either category is disabled.
      if(this.musicOn!==music){this.musicGain.gain.setTargetAtTime(music?1:0,this.context.currentTime,.02);this.musicOn=music;}
      if(this.sfxOn!==sfx){this.sfxGain.gain.setTargetAtTime(sfx?1:0,this.context.currentTime,.01);this.sfxOn=sfx;}
      const running=engine?.state==='running',lanes=engine?.players||[engine],lead=lanes[0];
      const intensity=running?Math.min(1,Math.max(0,(lead.speed-470)/2530)):0;
      let vehicle=null,proximity=0,vehicleEngine=lead;
      if(running)for(const lane of lanes)for(const o of lane.obstacles)if(['car','motorcycle'].includes(o.type)&&o.x+o.w>150){const p=Math.max(0,1-Math.abs(o.x-lane.player.x)/1500);if(p>proximity){proximity=p;vehicle=o;vehicleEngine=lane;}}
      this.engineGain.gain.setTargetAtTime(sfx?proximity*.13:0,this.context.currentTime,.04);
      if(vehicle)this.engineTone.frequency.setTargetAtTime((vehicle.type==='motorcycle'?100:52)+vehicleEngine.speed*.035+Math.sin(vehicleEngine.time*22)*6,this.context.currentTime,.05);
      this.windGain.gain.setTargetAtTime(sfx?intensity*.085:0,this.context.currentTime,.08);
      if (!music || this.context.state!=='running') return;
      const now=this.context.currentTime;
      if(now<this.nextNote) return;
      const melody=[0,7,12,7,4,7,9,7,0,4,7,4,2,7,4,-5];
      const f=220*Math.pow(2,(melody[this.note%melody.length]+stage)/12);
      this.tone(f,.7,'sine',.055,0,undefined,'music'); if(this.note%4===0) this.tone(f/2,1.5,'triangle',.035,0,undefined,'music');
      this.note++;this.nextNote=now+.43-intensity*.13;
    }
  }
  D.AudioSystem=AudioSystem;
})(globalThis.Duna = globalThis.Duna || {});
