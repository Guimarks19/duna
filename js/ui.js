(function (D) {
  'use strict';
  const $=id=>document.getElementById(id);
  const number=n=>Math.floor(n).toLocaleString('pt-BR');
  class UI {
    constructor(save,audio) {
      this.save=save;this.audio=audio;this.screen='home';this.toastTimer=null;this.hintUntil=0;this.lastLives=-1;this.returnToGame=false;this.multiplayer=false;
      this.device=this.session('device');if(!['mobile','pc'].includes(this.device))this.device=null;
      this.raceCharacters=[save.data.selected,save.data.selected];
      const recommended=matchMedia('(any-pointer: coarse)').matches||navigator.maxTouchPoints>0?'mobile':'pc';
      this.recommended=recommended;
      $('recommend-'+recommended).textContent='RECOMENDADO PARA VOCÊ';
      this.applyDevice();
    }
    session(key,value) {try {if(value!==undefined)sessionStorage.setItem('duna.'+key,value);return sessionStorage.getItem('duna.'+key);}catch{return null;}}
    get active() {return this.multiplayer?this.race:this.engine;}
    applyDevice() {
      document.body.dataset.device=this.device||'choose';document.body.classList.toggle('touch-enabled',this.device==='mobile');
      $('multiplayer-option').hidden=this.device!=='pc';
      $('game-canvas').setAttribute('aria-label',this.device==='mobile'?'Área do jogo. Toque em ↑ para pular e segure ↓ para abaixar.':'Área do jogo. ↑ ou Espaço para pular, ↓ para abaixar e Esc para pausar.');
      document.dispatchEvent(new Event('duna:release-input'));
    }
    controls() {return this.device==='mobile'?'<div><kbd>↑</kbd><strong>PULAR</strong><span>Toque no botão ↑</span></div><div><kbd>↓</kbd><strong>ABAIXAR</strong><span>Segure o botão ↓</span></div><p>Use o botão Ⅱ para pausar. Na horizontal, você vê mais do caminho.</p>':'<div><kbd>↑ / ESPAÇO</kbd><strong>Pular</strong></div><div><kbd>↓</kbd><strong>Abaixar / deslizar</strong></div><div><kbd>ESC</kbd><strong>Pausar / continuar</strong></div>';}
    connect(engine) {this.engine=engine;}
    show(screen) {
      if(screen!=='game'&&!(screen==='settings'&&this.returnToGame)){this.engine.stop();this.race?.stop();}
      if(screen==='home')this.returnToGame=false;
      document.body.dataset.screen=screen;
      document.dispatchEvent(new Event('duna:release-input'));
      document.querySelectorAll('.screen').forEach(el=>el.hidden=el.id!==`${screen}-screen`);
      this.screen=screen;this.refresh();
      window.scrollTo({top:0,behavior:'instant'});
      if(screen==='game')$('game-canvas').focus({preventScroll:true});
      else {
        const root=$(screen+'-screen');root.scrollTop=0;
        if(screen!=='home')root.querySelector('button:not(.back-link):not(:disabled):not([hidden]),input')?.focus({preventScroll:true});
        if(screen==='device')root.querySelector(`[data-action="device-${this.device||this.recommended}"]`)?.focus({preventScroll:true});
      }
      document.dispatchEvent(new Event('duna:screen'));
    }
    refresh() {
      const data=this.save.data;
      $('wallet-count').textContent=number(data.coins);
      $('journey-count').textContent=`${data.completed.length} / 5`;
      $('play-label').textContent='JOGAR';
      $('continue-journey').hidden=!data.checkpoint;
      if(data.checkpoint)$('continue-journey').textContent=`CONTINUAR · ${D.STAGES[data.checkpoint.stage].name.toUpperCase()} · ${D.time(data.checkpoint.time)}`;
      $('journey-note').textContent=data.checkpoint?`CHECKPOINT · ${D.STAGES[data.checkpoint.stage].name.toUpperCase()} · ${D.time(data.checkpoint.time)}`:data.completed.length===5?'CINCO MUNDOS CONQUISTADOS. A AVENTURA CONTINUA.':'CINCO MUNDOS. UM GRANDE CAMINHO.';
      const muted=!data.settings.music&&!data.settings.sfx;
      $('sound-toggle').innerHTML=D.icon(muted?'muted':'sound');
      $('sound-toggle').setAttribute('aria-label',muted?'Ligar áudio':'Desligar áudio');
      document.body.classList.toggle('reduce-motion',data.settings.reducedMotion);
      if(this.screen==='stages')this.worldCards('stage-worlds');
      if(this.screen==='characters')this.characterCards();
      if(this.screen==='free')this.freeControls();
      if(this.screen==='multiplayer')this.raceLobby();
      if(this.screen==='settings') {
        $('music-setting').checked=data.settings.music;$('sfx-setting').checked=data.settings.sfx;$('motion-setting').checked=data.settings.reducedMotion;
        document.querySelector('.controls-panel').innerHTML=`<span class="section-kicker">CONTROLES · ${this.device==='mobile'?'CELULAR':'COMPUTADOR'}</span><h2>É só dar o primeiro salto.</h2>${this.returnToGame&&this.multiplayer?'<div><kbd>W / S</kbd><strong>Jogador 1 · pular / abaixar</strong></div><div><kbd>↑ / ↓</kbd><strong>Jogador 2 · pular / abaixar</strong></div><div><kbd>ESC</kbd><strong>Pausar a disputa</strong></div>':this.controls()}<p>3 vidas. Proteção temporária após um impacto. No gelo, o deslize continua por um instante.</p>${this.returnToGame?'':'<button class="button secondary" data-action="device">Trocar dispositivo</button>'}`;
      }
    }
    freeControls() {
      const f=this.save.data.freeOptions;
      const groups=[['map','MAPA',D.STAGES.map(s=>[s.id,s.name])],['period','PERÍODO',[['day','Dia'],['night','Noite']]],['speed','VELOCIDADE INICIAL',[['slow','Lenta'],['normal','Normal'],['fast','Rápida'],['extreme','Extrema']]],['difficulty','DIFICULDADE',[['easy','Fácil'],['normal','Normal'],['hard','Difícil'],['extreme','Extremo']]],['density','QUANTIDADE DE OBSTÁCULOS',[['few','Poucos'],['normal','Normal'],['many','Muitos'],['intense','Intensa']]]];
      $('free-controls').innerHTML=groups.map(([key,label,choices])=>`<fieldset><legend>${label}</legend><div class="option-row">${choices.map(([value,name])=>`<button class="option-button" data-action="free-option" data-option="${key}" data-value="${value}" aria-pressed="${f[key]===value}">${name}</button>`).join('')}</div></fieldset>`).join('');
      $('free-caption').textContent=`${D.STAGES[f.map].name} · ${f.period==='night'?'Noite':'Dia'}`;
      $('free-record').textContent=`RECORDE LIVRE · ${number(this.save.data.freeBest)}`;
      requestAnimationFrame(()=>this.paintFree());
    }
    paintFree() {
      const canvas=$('free-preview'),r=canvas.getBoundingClientRect();if(!r.width)return;
      canvas.width=Math.round(r.width*1.5);canvas.height=Math.round(r.height*1.5);
      const f=this.save.data.freeOptions,c=canvas.getContext('2d');
      const h=780,w=h*r.width/r.height;
      c.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
      D.Art.backdrop(c,w,h,f.map,0,0,{floor:h*.82,reduced:true,period:f.period});
      D.Art.drawCharacter(c,this.save.data.selected,w*.25,h*.82,1.4,'run',.3,this.save.data.skin);
    }
    worldCards(target) {
      const data=this.save.data;
      $(target).innerHTML=D.STAGES.map(s=>{
        const locked=s.id>=data.unlocked,completed=data.completed.includes(s.id),current=!locked&&!completed;
        return `<button class="world-card ${locked?'locked':''} ${current?'current':''}" data-action="stage" data-stage="${s.id}" ${locked?'disabled':''} aria-label="${s.name}. ${locked?'Bloqueada. Conclua '+D.STAGES[s.id-1].name:completed?'Concluída. Jogar novamente':'Jogar fase'}. Duração ${D.time(s.duration)}"><div class="world-preview"><canvas data-world="${s.id}" aria-hidden="true"></canvas><span class="world-number">${s.id+1}</span><span class="world-badge">${D.icon(locked?'lock':completed?'check':'play')}${locked?'BLOQUEADO':completed?'CONCLUÍDO':'EXPLORAR'}</span></div><div class="world-detail"><div><h3>${s.name}</h3><p>${s.subtitle}</p></div>${D.icon(locked?'lock':completed?'check':'arrow')}</div><div class="world-meta"><span>${D.time(s.duration)}</span><span class="difficulty-pips" aria-label="Dificuldade ${s.id+1} de 5">${Array.from({length:5},(_,i)=>`<i class="${i<=s.id?'filled':''}"></i>`).join('')}</span></div></button>`;
      }).join('');
      requestAnimationFrame(()=>this.paintWorlds(target));
    }
    paintWorlds(target) {
      $(target)?.querySelectorAll('canvas').forEach(canvas=>{const r=canvas.getBoundingClientRect();if(!r.width)return;canvas.width=Math.round(r.width*1.5);canvas.height=Math.round(r.height*1.5);D.Art.backdrop(canvas.getContext('2d'),canvas.width,canvas.height,+canvas.dataset.world,480,0,{floor:canvas.height*.85,reduced:true});});
    }
    characterCards() {
      const data=this.save.data;
      $('character-grid').innerHTML=D.CHARACTERS.map(ch=>{const owned=data.owned.includes(ch.id),selected=data.selected===ch.id;return `<article class="character-card ${selected?'selected':''}"><div class="character-art"><span class="character-tag">${ch.tag}</span><canvas data-character="${ch.id}" aria-label="Ilustração de ${ch.name}"></canvas></div><h2>${ch.name}</h2><p>${ch.description}</p><button class="button ${selected?'secondary':owned?'primary':'secondary'}" data-action="buy" data-item="${ch.id}" ${selected?'disabled':''}>${D.icon(selected?'check':owned?'arrow':'coin')}${selected?'Na sua equipe':owned?'Selecionar':`Desbloquear · ${ch.price}`}</button></article>`;}).join('');
      $('cosmetic-grid').innerHTML=D.COSMETICS.map(item=>{const owned=data.cosmetics.includes(item.id),selected=item.kind==='skin'?data.skin===item.id:data.trail;return `<article class="cosmetic-card"><span class="swatch" style="--swatch:${item.color}"></span><div><h3>${item.name}</h3><button data-action="buy" data-item="${item.id}" ${selected&&item.kind==='skin'?'disabled':''}>${D.icon(selected?'check':owned?'arrow':'coin')}${selected?(item.kind==='trail'?'Ativo · desativar':'Selecionada'):owned?'Usar':item.price+' moedas'}</button></div></article>`;}).join('');
      requestAnimationFrame(()=>this.paintCharacters());
    }
    paintCharacters() {
      $('character-grid').querySelectorAll('canvas').forEach(canvas=>{const r=canvas.getBoundingClientRect();if(!r.width)return;canvas.width=r.width*2;canvas.height=r.height*2;const c=canvas.getContext('2d'),s=canvas.height/175;D.Art.ellipse(c,canvas.width/2,canvas.height*.85,40*s,5*s,'#5b75401a');D.Art.drawCharacter(c,canvas.dataset.character,canvas.width/2-28*s,canvas.height*.85,s,'run',.3,this.save.data.skin);});
    }
    start(id,resume=false,freeOptions=null) {
      if(!this.tutorialSeen&&this.session('tutorial-'+this.device)!=='seen'){
        this.pendingStart={id,resume,freeOptions};this.tutorialReturn=this.screen;
        $('tutorial-controls').innerHTML=this.controls();this.show('tutorial');return;
      }
      this.multiplayer=false;this.race?.stop();
      this.applyDevice();
      if(!this.engine.start(id,resume,freeOptions))return;
      this.returnToGame=false;this.show('game');$('game-overlay').hidden=true;
      $('hud-stage').textContent=`${freeOptions?'LIVRE':`0${id+1}`} · ${D.STAGES[id].name.toUpperCase()}`;
      document.body.dataset.mode=this.engine.mode;
      document.body.dataset.period=this.engine.period;
      $('race-hud').hidden=true;
      const track=document.querySelector('.progress-track');
      track.querySelectorAll('span').forEach(marker=>marker.remove());
      track.hidden=Boolean(freeOptions);
      for(const seconds of this.engine.stage.checkpoints){const marker=document.createElement('span');marker.style.left=`${seconds/D.STAGES[id].duration*100}%`;marker.title=`Checkpoint · ${D.time(seconds)}`;track.append(marker);}
      this.lastLives=-1;this.hint('');this.hud();
    }
    hint(text,duration=4) { $('game-hint').textContent=text;this.hintUntil=performance.now()+duration*1000; }
    hud() {
      if(this.multiplayer){this.raceHud();return;}
      const e=this.engine;if(!e.stage)return;
      $('hud-score').textContent=String(Math.floor(e.score)).padStart(6,'0');
      $('hud-coins').textContent=e.collected;
      $('wallet-count').textContent=number(this.save.data.coins);
      $('hud-distance').textContent=`${number(e.distance/24)} m`;
      $('hud-time').textContent=e.mode==='free'?`${D.time(e.time)} / ∞`:`${D.time(e.time)} / ${D.time(e.stage.duration)}`;
      $('hud-progress').style.width=`${e.time/e.stage.duration*100}%`;
      const percent=Math.floor(e.time/e.stage.duration*100);
      $('hud-percent').textContent=e.mode==='free'?`${(e.speed/470).toFixed(1)}×`:`${percent}% · ${(e.speed/470).toFixed(1)}×`;
      document.querySelector('.progress-track').setAttribute('aria-valuenow',percent);
      document.body.dataset.playState=e.state;
      if(e.lives!==this.lastLives){$('hud-lives').innerHTML=Array.from({length:3},(_,i)=>D.icon('heart',i>=e.lives?'lost':'')).join('');$('hud-lives').setAttribute('aria-label',`${e.lives} vidas`);this.lastLives=e.lives;}
      if(e.state==='countdown')$('game-hint').textContent=`${Math.max(1,Math.ceil(e.countdown))} · PREPARE-SE`;
      else if(performance.now()>this.hintUntil)$('game-hint').textContent='';
    }
    overlay(type) {
      if(this.multiplayer){this.raceOverlay(type);return;}
      const e=this.engine,data=this.save.data,cp=e.mode!=='free'&&data.checkpoint?.stage===e.stage.id?data.checkpoint:null;
      let html='';
      if(type==='pause')html=`<div class="overlay-symbol">${D.icon('pause')}</div><span class="section-kicker">AVENTURA PAUSADA</span><h2>Um respiro.</h2><p>O horizonte pode esperar um pouquinho.</p><div class="overlay-buttons"><button class="button primary" data-action="resume">${D.icon('play')}Continuar</button><button class="button secondary" data-action="retry">${D.icon('retry')}Recomeçar fase</button><button class="button secondary" data-action="settings">${D.icon('settings')}Configurações</button><button class="text-button" data-action="home">Menu principal</button></div>`;
      else {
        const complete=type==='complete',last=e.stage.id===4;
        html=`<div class="overlay-symbol">${D.icon(complete?(last?'trophy':'flag'):'heart')}</div><span class="section-kicker">${complete?(last?'VITÓRIA · CINCO MUNDOS CONQUISTADOS':'FASE CONCLUÍDA'):'GAME OVER'}</span><h2>${complete?(last?'O horizonte é seu!':'Mais um horizonte.'):'Todo salto ensina.'}</h2><p>${complete?(last?'Dino, Bip e Lia têm uma história para contar. Obrigado por explorar!':`${D.STAGES[e.stage.id+1].name} está esperando por você.`):cp?`Seu checkpoint em ${D.time(cp.time)} está salvo.`:'Respire fundo. O caminho continua aqui.'}</p><div class="result-grid"><div><span>PONTUAÇÃO</span><strong>${number(e.score)}</strong></div><div><span>MOEDAS COLETADAS</span><strong>${number(e.collected)}</strong></div><div><span>TEMPO</span><strong>${D.time(e.time)}</strong></div><div><span>MELHOR PONTUAÇÃO</span><strong>${number(data.best[e.stage.id]||0)}</strong></div></div><div class="overlay-buttons">${complete&&!last?`<button class="button primary" data-action="next">Próxima fase ${D.icon('arrow')}</button>`:!complete&&cp?`<button class="button primary" data-action="checkpoint">${D.icon('flag')}Continuar do checkpoint</button>`:''}<button class="button ${complete||cp?'secondary':'primary'}" data-action="retry">${D.icon('retry')}Jogar novamente</button><button class="text-button" data-action="home">Menu principal</button></div>`;
      }
      const victory=type==='complete'&&e.stage.id===4;
      if(e.mode==='free'){
        html=html.replace('Recomeçar fase','Recomeçar corrida');
        if(type==='over')html=html.replace('GAME OVER','MODO LIVRE · GAME OVER').replace('Respire fundo. O caminho continua aqui.','Seu horizonte não tem fim. Tente ir ainda mais longe.').replace(number(data.best[e.stage.id]||0)+'</strong></div></div>',number(data.freeBest)+'</strong></div></div>');
        html=html.replace('<button class="text-button" data-action="home">','<button class="button secondary" data-action="free">Personalizar corrida</button><button class="text-button" data-action="home">');
      }
      $('game-overlay').dataset.result=type;
      $('game-overlay').innerHTML=`<div class="overlay-card ${victory?'victory':''}" role="dialog" aria-modal="true" aria-label="${type==='pause'?'Jogo pausado':victory?'Vitória':type==='complete'?'Fase concluída':'Game Over'}">${html}</div>`;
      $('game-overlay').hidden=false;$('game-overlay').querySelector('button').focus({preventScroll:true});
      document.dispatchEvent(new Event('duna:release-input'));
      document.body.dataset.playState=e.state;
      $('wallet-count').textContent=number(data.coins);
    }
    event(type) {
      if(['pause','over','complete'].includes(type))this.overlay(type);
      if(type==='resume'){$('game-overlay').hidden=true;document.body.dataset.playState=this.engine.state;$('game-canvas').focus({preventScroll:true});}
      if(type==='go')this.hint(this.device==='mobile'?'Toque em ↑ para pular. Segure ↓ para deslizar.':this.engine.stage.tip,5);
      if(type==='checkpoint')this.hint('✓ Checkpoint salvo. Você está indo longe!',3.5);
      if(type==='damage')this.hint('Um tropeço. Respire e continue!',2);
      if(type==='rescue'&&this.engine.state==='running')this.hint('De volta ao caminho. Pule para cruzar as fendas!',2.5);
    }
    raceLobby() {
      for(let i=0;i<2;i++)$('race-character-'+i).innerHTML=D.CHARACTERS.filter(c=>this.save.data.owned.includes(c.id)).map(c=>`<button class="option-button" data-action="race-character" data-player="${i}" data-character="${c.id}" aria-pressed="${this.raceCharacters[i]===c.id}">${c.name}</button>`).join('');
    }
    startRace() {
      if(this.device!=='pc')return;
      this.engine.stop();this.multiplayer=true;this.returnToGame=false;this.race.start(this.raceCharacters);
      document.body.dataset.mode='race';document.body.dataset.period='day';
      $('race-hud').hidden=false;$('game-overlay').hidden=true;this.hint('');
      for(let i=0;i<2;i++)$('lane-hud-'+i).innerHTML=`<div class="lane-label"><strong>JOGADOR ${i+1}</strong><span>${i?'↑ PULAR · ↓ ABAIXAR':'W PULAR · S ABAIXAR'}</span></div><div class="lane-stats"><span class="lane-lives"></span><strong class="lane-score"></strong><span class="lane-distance"></span></div><div class="lane-progress" role="progressbar" aria-label="Distância do jogador ${i+1}" aria-valuemin="0" aria-valuemax="100"><i></i></div><span class="lane-notice"></span>`;
      $('game-canvas').setAttribute('aria-label','Corrida local em tela dividida. Jogador 1: W e S. Jogador 2: setas para cima e para baixo. Esc pausa as duas pistas.');
      this.show('game');this.raceHud();
    }
    raceHud() {
      const race=this.race;document.body.dataset.playState=race.state;
      for(let i=0;i<2;i++){
        const p=race.players[i],root=$('lane-hud-'+i);if(!p||!root.firstChild)continue;
        root.querySelector('.lane-lives').textContent='♥'.repeat(p.lives)+'♡'.repeat(3-p.lives);
        root.querySelector('.lane-score').textContent=number(p.score)+' PTS';
        root.querySelector('.lane-distance').textContent=`${number(p.distance/24)} / ${number(race.target/24)} m`;
        const progress=Math.min(100,p.distance/race.target*100);
        root.querySelector('.lane-progress i').style.width=progress+'%';root.querySelector('.lane-progress').setAttribute('aria-valuenow',Math.floor(progress));
        root.querySelector('.lane-notice').textContent=p.noticeUntil>race.time?p.notice:'';
      }
      const text=race.state==='countdown'?String(Math.max(1,Math.ceil(race.countdown))):race.goTime>0?'JÁ!':'';
      if($('race-countdown').textContent!==text)$('race-countdown').textContent=text;
    }
    raceEvent(type) {
      if(['pause','complete'].includes(type))this.raceOverlay(type);
      if(type==='resume'){$('game-overlay').hidden=true;document.body.dataset.playState=this.race.state;$('game-canvas').focus({preventScroll:true});}
      if(type==='go'){this.audio.sfx('checkpoint');this.raceHud();}
    }
    raceOverlay(type) {
      const r=this.race,paused=type==='pause';
      const stats=r.players.map((p,i)=>`<div class="rival-result ${r.winner===i?'winner':''}"><h3>JOGADOR ${i+1}</h3><dl><div><dt>Pontuação</dt><dd>${number(p.score)}</dd></div><div><dt>Distância</dt><dd>${number(p.distance/24)} m</dd></div><div><dt>Obstáculos superados</dt><dd>${p.cleared}</dd></div><div><dt>Tempo${p.finishTime===null?' de disputa':''}</dt><dd>${D.time(p.finishTime??r.time)}${p.finishTime===null?' · não concluiu':''}</dd></div></dl></div>`).join('');
      $('game-overlay').dataset.result=type;
      $('game-overlay').innerHTML=`<div class="overlay-card race-overlay" role="dialog" aria-modal="true" aria-label="${paused?'Jogo pausado':'Resultado da corrida'}"><span class="section-kicker">MULTIPLAYER LOCAL · CORRIDA</span><h2>${paused?'DISPUTA PAUSADA':r.winner==='tie'?'EMPATE NA CHEGADA':`JOGADOR ${r.winner+1} VENCEU`}</h2>${paused?'<p>As duas pistas estão pausadas.</p>':`<div class="rival-results">${stats}</div>`}<div class="overlay-buttons">${paused?'<button class="button primary" data-action="resume">Continuar</button>':''}<button class="button ${paused?'secondary':'primary'}" data-action="start-race">${paused?'Recomeçar disputa':'Jogar novamente'}</button>${paused?'<button class="button secondary" data-action="settings">Configurações</button>':''}<button class="text-button" data-action="home">Menu principal</button></div></div>`;
      $('game-overlay').hidden=false;$('game-overlay').querySelector('button').focus({preventScroll:true});
      document.body.dataset.playState=r.state;document.dispatchEvent(new Event('duna:release-input'));
    }
    toast(message) {clearTimeout(this.toastTimer);$('toast').textContent=message;$('toast').hidden=false;this.toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
    async fullscreen() {
      try {if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{this.toast(this.device==='mobile'?'Este navegador não permite expandir a tela. Na horizontal, você vê mais do caminho.':'Este navegador já usa todo o espaço disponível. No PC, você também pode usar F11.');}
    }
    action(action,button) {
      this.audio.unlock();this.audio.sfx('click');
      if(action==='device-mobile'||action==='device-pc'){this.device=action==='device-mobile'?'mobile':'pc';this.tutorialSeen=false;this.session('device',this.device);this.applyDevice();this.show('home');return;}
      if(action==='device'){this.show('device');return;}
      if(action==='tutorial-start'){const pending=this.pendingStart;if(!pending)return;this.tutorialSeen=true;this.session('tutorial-'+this.device,'seen');this.start(pending.id,pending.resume,pending.freeOptions);this.pendingStart=null;return;}
      if(action==='multiplayer'){if(this.device==='pc')this.show('multiplayer');return;}
      if(action==='race-character'){this.raceCharacters[Number(button.dataset.player)]=button.dataset.character;this.raceLobby();return;}
      if(action==='start-race'){this.startRace();return;}
      if(action==='settings')this.returnToGame=this.active.state==='paused'&&this.screen==='game';
      if(action==='back'){if(this.screen==='device'&&!this.device)return;if(this.returnToGame){this.show('game');this.overlay('pause');}else this.show(this.screen==='tutorial'?this.tutorialReturn:['free','stages','multiplayer'].includes(this.screen)?'modes':'home');return;}
      if(['home','characters','settings','stages','modes','free'].includes(action)){this.returnToGame=action==='settings'&&this.returnToGame;this.show(action);return;}
      if(action==='play')this.show('modes');
      if(action==='continue') {const cp=this.save.data.checkpoint;if(cp)this.start(cp.stage,true);}
      if(action==='free-option'){
        const key=button.dataset.option,value=key==='map'?Number(button.dataset.value):button.dataset.value;
        this.save.configureFree({...this.save.data.freeOptions,[key]:value});this.freeControls();
        $('free-controls').querySelector(`[data-option="${key}"][data-value="${value}"]`).focus({preventScroll:true});
      }
      if(action==='start-free')this.start(this.save.data.freeOptions.map,false,this.save.data.freeOptions);
      if(action==='stage')this.start(Number(button.dataset.stage));
      if(action==='pause')this.active.pause();
      if(action==='resume')this.active.resume();
      if(action==='retry')this.start(this.engine.stage.id,false,this.engine.options);
      if(action==='checkpoint')this.start(this.engine.stage.id,true);
      if(action==='next')this.start(this.engine.stage.id+1);
      if(action==='fullscreen')this.fullscreen();
      if(action==='buy'){if(this.save.buy(button.dataset.item)){this.refresh();this.toast('Pronto! A próxima aventura já tem a sua cara.');}else this.toast('Faltam moedas. Você encontra mais pelo caminho!');}
      if(action==='mute'){const enable=!this.save.data.settings.music&&!this.save.data.settings.sfx;this.save.setting('music',enable);this.save.setting('sfx',enable);this.refresh();}
    }
  }
  D.UI=UI;
})(globalThis.Duna = globalThis.Duna || {});
