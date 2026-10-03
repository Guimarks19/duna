(function (D) {
  'use strict';
  D.WIDTH = 1920;
  D.HEIGHT = 1080;
  D.GROUND = 842;
  D.PHYSICS = { gravity: 2500, jump: -930, playerX: 340, width: 68, height: 110, duckHeight: 48 };
  D.STAGES = [
    { id: 0, name: 'Deserto', subtitle: 'Onde tudo começa', duration: 130, speed: 500, maxSpeed: 710, color: '#d4b877', sky: '#eee8ce', ground: '#8d9d68', ink: '#3c573a', obstacles: ['cactus','rock','bird','pit'], tip: 'Espaço ou ↑ para pular. Um passo de cada vez.' },
    { id: 1, name: 'Floresta', subtitle: 'Siga o verde', duration: 145, speed: 530, maxSpeed: 750, color: '#829875', sky: '#dee8d4', ground: '#648461', ink: '#2d5442', obstacles: ['log','rock','branch','animal'], tip: 'Abaixe com ↓ para passar por baixo dos galhos.' },
    { id: 2, name: 'Cidade', subtitle: 'Encontre seu ritmo', duration: 155, speed: 560, maxSpeed: 790, color: '#9eaeb2', sky: '#e1e8e5', ground: '#6d8380', ink: '#344f52', obstacles: ['cone','barrier','car','sign','pit'], tip: 'Pule carros e barreiras. Deslize sob as placas.' },
    { id: 3, name: 'Neve', subtitle: 'Um novo fôlego', duration: 165, speed: 570, maxSpeed: 815, color: '#a7c1c8', sky: '#e5eeee', ground: '#86aaae', ink: '#42636b', obstacles: ['ice','rock','tree','icepatch'], tip: 'No gelo, o deslize continua por um breve instante.' },
    { id: 4, name: 'Vulcão', subtitle: 'Além do horizonte', duration: 180, speed: 590, maxSpeed: 850, color: '#b98676', sky: '#e4d7cd', ground: '#705a53', ink: '#513c36', obstacles: ['falling','fissure','platform','lava'], tip: 'Fique de olho no céu. Use as plataformas para cruzar a lava.' }
  ];
  // One smooth curve drives real world motion, encounter frequency and variety.
  const pacing = [
    [470, 1550, 2.8, .64], [640, 1950, 2.4, .55],
    [820, 2300, 2.05, .48], [1020, 2660, 1.8, .42],
    [1200, 3000, 1.55, .36]
  ];
  D.STAGES.forEach((stage, i) => {
    [stage.speed, stage.maxSpeed, stage.startInterval, stage.endInterval] = pacing[i];
    stage.checkpoints = [[40,80,110],[50,100],[80],[],[]][i];
    stage.challenge = i / 4;
  });
  D.STAGES[1].obstacles.push('bird');
  D.STAGES[2].obstacles = ['cone','barrier','car','motorcycle','sign','pit'];
  D.STAGES[3].obstacles.push('snowball');
  D.FREE_DEFAULTS = {map:0, period:'day', speed:'normal', difficulty:'normal', density:'normal'};
  D.freeOptions = function (raw={}) {
    if(!raw||typeof raw!=='object')raw={};
    const value={...D.FREE_DEFAULTS};
    if(Number.isInteger(raw.map)&&D.STAGES[raw.map])value.map=raw.map;
    for(const [key,choices] of Object.entries({period:['day','night'],speed:['slow','normal','fast','extreme'],difficulty:['easy','normal','hard','extreme'],density:['few','normal','many','intense']}))if(choices.includes(raw[key]))value[key]=raw[key];
    return value;
  };
  D.freeStage = function (options) {
    const f=D.freeOptions(options),level=['easy','normal','hard','extreme'].indexOf(f.difficulty);
    const speed={slow:420,normal:700,fast:1100,extreme:1900}[f.speed];
    const density={few:1.45,normal:1,many:.8,intense:.62}[f.density];
    return {...D.STAGES[f.map],duration:180,speed,maxSpeed:Math.min(3200,speed+600+level*230),
      startInterval:(3-level*.5)*(f.speed==='extreme'?.65:1)*density,endInterval:(1.1-level*.22)*density,challenge:level/3,checkpoints:[],free:true};
  };
  D.difficulty = function (stage, seconds) {
    const progress = Math.max(0, Math.min(1, seconds / stage.duration));
    const tail=Math.max(0,(progress-.7)/.3);
    const curve = .65*progress*progress*(3-2*progress)+.35*tail*tail*(3-2*tail);
    const speed = stage.speed + (stage.maxSpeed - stage.speed) * curve;
    const intensity=Math.min(1,stage.challenge*.3+curve*.85+(speed/3200)*.12);
    const interval=(stage.startInterval+(stage.endInterval-stage.startInterval)*curve)/(1+Math.max(0,speed-1500)/7000);
    return {progress,curve,speed,intensity,interval,gap:interval*speed,reaction:.38-.18*intensity,recovery:.19-.14*intensity,
      precision:.15-.08*intensity,comboChance:progress<.2?0:Math.min(.94,curve*.82+stage.challenge*.22)};
  };
  // Integral of both smoothstep ramps, also valid beyond the endless speed cap.
  D.travel = function(stage,from,seconds) {
    const integral=t=>{const p=Math.min(1,Math.max(0,t/stage.duration)),q=Math.max(0,(p-.7)/.3);return stage.speed*t+(stage.maxSpeed-stage.speed)*(stage.duration*(.65*(p**3-.5*p**4)+.35*.3*(q**3-.5*q**4))+Math.max(0,t-stage.duration));};
    return integral(from+seconds)-integral(from);
  };
  D.arrival = function(stage,time,distance) {
    if(distance<=0)return 0;
    let low=0,high=distance/stage.speed+1;
    for(let i=0;i<24;i++){const mid=(low+high)/2;if(D.travel(stage,time,mid)<distance)low=mid;else high=mid;}
    return (low+high)/2;
  };
  // Shared minimum camera width: reaction checks must hold on phones too.
  D.MIN_VIEW = 1280;
  // Widen the camera at extreme speeds so even phones retain a readable approach.
  D.minView = speed => Math.max(D.MIN_VIEW,300+speed*1.34*.56);
  D.spawnX = stage => Math.max(D.WIDTH,D.minView(stage.maxSpeed))+80;
  D.CHARACTERS = [
    { id: 'dino', name: 'Dino', tag: 'O PRIMEIRO EXPLORADOR', description: 'Pequenos braços. Uma vontade enorme de conhecer o mundo.', price: 0, color: '#738959' },
    { id: 'robot', name: 'Bip', tag: 'CURIOSIDADE PROGRAMADA', description: 'Feito de metal, movido a descobertas. E algumas moedinhas.', price: 120, color: '#7f9da0' },
    { id: 'adventurer', name: 'Lia', tag: 'SEMPRE EM FRENTE', description: 'Mochila leve, passos firmes e um mapa cheio de possibilidades.', price: 220, color: '#bc7b50' }
  ];
  D.COSMETICS = [
    { id: 'original', kind: 'skin', name: 'Cores originais', price: 0, color: '#83996b' },
    { id: 'sunset', kind: 'skin', name: 'Pôr do sol', price: 70, color: '#cc8062' },
    { id: 'ocean', kind: 'skin', name: 'Azul horizonte', price: 70, color: '#679aab' },
    { id: 'spark', kind: 'trail', name: 'Rastro de estrelas', price: 100, color: '#daba65' }
  ];
  D.time = function (seconds) { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,'0')}`; };
  D.icon = function (name, cls = '') { return `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`; };
})(globalThis.Duna = globalThis.Duna || {});
