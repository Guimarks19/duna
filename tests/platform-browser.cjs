// Optional browser integration suite. No browser dependency is shipped with DUNA.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
const url=process.env.TEST_URL||'http://localhost:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),errors=[];
 const shot=(page,name)=>page.screenshot({path:path.join(output,'v4-'+name+'.png'),animations:'disabled'});
 const watch=page=>page.evaluate(()=>{for(const [kind,name] of [['Engine','qaEngine'],['Race','qaRace']]){const original=Duna[kind].prototype.update;Duna[kind].prototype.update=function(dt){window[name]=this;return original.call(this,dt);};}});
 const home=async page=>{await page.keyboard.press('Escape');await page.getByRole('button',{name:'Menu principal',exact:true}).click();};
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await shot(page,'device');
  assert.equal(await page.locator('#device-screen').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#device-screen').isVisible(),true);
  await page.locator('[data-action="device-pc"]').click();await watch(page);await shot(page,'home');
  assert.equal(await page.locator('.creator-credit').filter({visible:true}).count(),1);
  await page.locator('[data-action="play"]').click();assert.equal(await page.locator('#multiplayer-option').isVisible(),true);await shot(page,'modes');
  await page.locator('#modes-screen [data-action="stages"]').click();await page.locator('[data-stage="0"]').click();
  assert.equal(await page.locator('#tutorial-screen').isVisible(),true);assert.match(await page.locator('#tutorial-controls').innerText(),/ESPAÇO/);await shot(page,'pc-controls');
  await page.locator('[data-action="tutorial-start"]').click();await page.waitForFunction(()=>Duna.inspect().state==='running');
  assert.equal(await page.locator('.touch-controls').isVisible(),false);
  await page.locator('#game-canvas').click({position:{x:700,y:200}});await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>qaEngine.player.grounded),true);
  await page.keyboard.press('Space');await page.waitForTimeout(80);assert.ok(await page.evaluate(()=>qaEngine.player.y<Duna.GROUND-30));
  await home(page);await page.reload();assert.equal(await page.locator('#home-screen').isVisible(),true);await watch(page);
  await page.locator('[data-action="play"]').click();await page.locator('#multiplayer-option').click();await shot(page,'race-lobby');
  await page.locator('#multiplayer-screen [data-action="start-race"]').click();await page.waitForFunction(()=>window.qaRace);assert.equal(await page.evaluate(()=>qaRace.state),'countdown');
  await page.keyboard.press('Escape');const count=await page.evaluate(()=>qaRace.countdown);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>qaRace.countdown),count);await page.keyboard.press('Escape');
  await page.waitForFunction(()=>Duna.inspect().state==='running');assert.equal(await page.locator('#race-countdown').innerText(),'JÁ!');
  await page.keyboard.down('KeyS');await page.keyboard.down('ArrowDown');await page.waitForTimeout(80);assert.deepEqual(await page.evaluate(()=>qaRace.players.map(p=>p.player.duck)),[true,true]);
  await page.keyboard.up('KeyS');await page.waitForTimeout(50);assert.deepEqual(await page.evaluate(()=>qaRace.players.map(p=>p.player.duck)),[false,true]);await page.keyboard.up('ArrowDown');
  await page.keyboard.press('KeyW');await page.waitForTimeout(90);assert.ok(await page.evaluate(()=>qaRace.players[0].player.y<Duna.GROUND));assert.equal(await page.evaluate(()=>qaRace.players[1].player.grounded),true);
  await page.keyboard.press('ArrowUp');await page.waitForTimeout(90);assert.ok(await page.evaluate(()=>qaRace.players[1].player.y<Duna.GROUND));await page.waitForTimeout(900);
  await page.keyboard.press('Space');await page.waitForTimeout(50);assert.deepEqual(await page.evaluate(()=>qaRace.players.map(p=>p.player.grounded)),[true,true]);
  await page.keyboard.press('Escape');const time=await page.evaluate(()=>qaRace.time);await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.locator('#sfx-setting').uncheck();await page.locator('#settings-screen .back-link').click();
  assert.equal(await page.evaluate(()=>qaRace.time),time);assert.equal(await page.evaluate(()=>qaRace.state),'paused');await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.evaluate(()=>{qaRace.players.forEach((p,i)=>{p.obstacles=[];p.lastPlan=null;p.pendingObstacle=null;p.time=40;p.distance=40000+i*1800;p.speed=Duna.difficulty(p.stage,p.time).speed;p.nextObstacle=100;p.spawnObstacle(i?'motorcycle':'car');p.obstacles[0].x=1150;p.player.invulnerable=0;});});
  await shot(page,'split-screen');
  for(const size of [{width:1920,height:1080},{width:1024,height:768},{width:1366,height:768}]){await page.setViewportSize(size);await shot(page,'race-'+size.width);assert.ok(await page.evaluate(()=>{const c=document.getElementById('game-canvas');return c.width*c.height<2410000;}));assert.equal(await page.locator('#lane-hud-1').evaluate(el=>el.getBoundingClientRect().top>innerHeight*.5),true);}
  const frameRate=await page.evaluate(()=>new Promise(resolve=>{let start=performance.now(),frames=0;function frame(t){frames++;if(t-start>1000)resolve(Math.round(frames*1000/(t-start)));else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));console.log('Split-screen observed RAF FPS:',frameRate);
  await page.evaluate(()=>{qaRace.players.forEach((p,i)=>{p.obstacles=[];p.nextObstacle=100;p.distance=qaRace.target-(i===1?1:100);});});
  await page.getByRole('dialog',{name:'Resultado da corrida'}).waitFor();assert.match(await page.locator('.race-overlay h2').innerText(),/JOGADOR 2 VENCEU/);assert.equal(await page.locator('.rival-result').count(),2);await shot(page,'race-result');
  for(let n=0;n<3;n++){await page.getByRole('button',{name:'Jogar novamente',exact:true}).click();await page.evaluate(()=>{qaRace.countdown=0;});await page.waitForFunction(()=>qaRace.state==='running');await page.evaluate(()=>{qaRace.players[0].distance=qaRace.target-1;qaRace.players[1].distance=qaRace.target-100;});await page.getByRole('dialog',{name:'Resultado da corrida'}).waitFor();}
  await page.getByRole('button',{name:'Jogar novamente',exact:true}).click();await page.evaluate(()=>{qaRace.countdown=0;window.jumpCalls=[0,0];qaRace.players.forEach((p,i)=>{const jump=p.jump;p.jump=function(){jumpCalls[i]++;jump.call(this);};});});await page.waitForFunction(()=>qaRace.state==='running');await page.keyboard.press('KeyW');await page.keyboard.press('ArrowUp');assert.deepEqual(await page.evaluate(()=>jumpCalls),[1,1]);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>qaRace.state),'paused');await page.getByRole('button',{name:'Menu principal',exact:true}).click();
  // Existing campaign progression, purchases and v1 checkpoint after racing.
  await page.locator('[data-action="play"]').click();await page.locator('#modes-screen [data-action="stages"]').click();await page.locator('[data-stage="0"]').click();await page.waitForFunction(()=>Duna.inspect().state==='running');
  await page.evaluate(()=>{qaEngine.time=40;qaEngine.update(1/120);qaEngine.save.earn(500);});await home(page);await page.locator('[data-action="characters"]').click();for(const item of ['robot','ocean','spark'])await page.locator('[data-item="'+item+'"]').click();await page.reload();await watch(page);await page.locator('[data-action="play"]').click();await page.locator('#continue-journey').click();await page.waitForFunction(()=>window.qaEngine&&qaEngine.mode==='stages');assert.equal(await page.evaluate(()=>qaEngine.time),40);
  for(let stage=0;stage<5;stage++){await page.waitForFunction(()=>Duna.inspect().state==='running');await page.evaluate(()=>{qaEngine.time=qaEngine.stage.duration-1/240;qaEngine.obstacles=[];qaEngine.update(1/120);});await page.getByRole('dialog',{name:stage===4?'Vitória':'Fase concluída',exact:true}).waitFor();if(stage<4)await page.getByRole('button',{name:'Próxima fase'}).click();}
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('duna.save.v1')));assert.equal(saved.unlocked,5);assert.equal(saved.selected,'robot');assert.equal(saved.skin,'ocean');assert.equal(saved.trail,true);
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:3});const phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url);await shot(phone,'phone-device');await phone.locator('[data-action="device-mobile"]').tap();await watch(phone);await shot(phone,'phone-home');
  await phone.locator('[data-action="play"]').tap();assert.equal(await phone.locator('#multiplayer-option').isVisible(),false);await phone.locator('#modes-screen [data-action="stages"]').tap();await phone.locator('[data-stage="0"]').tap();assert.doesNotMatch(await phone.locator('#tutorial-controls').innerText(),/ESPAÇO|ESC|teclado/i);await shot(phone,'phone-controls');await phone.locator('[data-action="tutorial-start"]').tap();await phone.waitForFunction(()=>Duna.inspect().state==='running');assert.equal(await phone.locator('.touch-controls').isVisible(),true);
  await phone.keyboard.press('Space');await phone.waitForTimeout(50);assert.equal(await phone.evaluate(()=>qaEngine.player.grounded),true);
  const cdp=await context.newCDPSession(phone),duck=await phone.locator('#touch-duck').boundingBox(),jump=await phone.locator('#touch-jump').boundingBox();const point=(b,id)=>({x:b.x+b.width/2,y:b.y+b.height/2,id});assert.ok(jump.y>390*.73);assert.ok(jump.width>=70);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(duck,1)]});await phone.waitForTimeout(60);assert.equal(await phone.evaluate(()=>qaEngine.player.duck),true);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(duck,1),point(jump,2)]});await phone.waitForTimeout(90);assert.ok(await phone.evaluate(()=>qaEngine.player.y<Duna.GROUND-20));await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await phone.evaluate(()=>qaEngine.down),false);await shot(phone,'phone-playing');
  await phone.setViewportSize({width:390,height:844});await phone.getByRole('dialog',{name:'Jogo pausado'}).waitFor();await shot(phone,'phone-pause');await phone.getByRole('button',{name:'Menu principal',exact:true}).tap();
  for(const size of [{width:390,height:844},{width:320,height:568},{width:667,height:375}]){await phone.setViewportSize(size);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot(phone,'phone-home-'+size.width);}
  await phone.locator('#home-screen [data-action="settings"]').tap();assert.doesNotMatch(await phone.locator('.controls-panel').innerText(),/ESPAÇO|ESC|teclado/i);await phone.getByRole('button',{name:'Trocar dispositivo'}).tap();await phone.locator('[data-action="device-pc"]').tap();assert.equal(await phone.evaluate(()=>Duna.inspect().device),'pc');await phone.locator('[data-action="play"]').tap();assert.equal(await phone.locator('#multiplayer-option').isVisible(),true);
  await context.close();
  await page.goto('file:///'+path.resolve(__dirname,'../index.html').replaceAll('\\','/'));if(await page.locator('#device-screen').isVisible())await page.locator('[data-action="device-pc"]').click();assert.equal(await page.locator('#home-screen').isVisible(),true);
  assert.deepEqual(errors,[]);console.log('PASS: device/session, tutorials, keyboard-only PC, mobile multitouch, orientation, split screen, independent controls, countdown, whole-match pause, race results/replay, campaign, equipment and checkpoints.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
