// Optional QA: Chrome + Playwright. No browser automation dependency is shipped to players.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
const url=process.env.TEST_URL||'http://localhost:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shot=async(name,target=page)=>target.screenshot({path:path.join(output,name+'.png'),animations:'disabled'});
  const watch=async target=>target.evaluate(()=>{const original=Duna.Engine.prototype.update;Duna.Engine.prototype.update=function(dt){window.qaEngine=this;return original.call(this,dt);};});
  const ready=async target=>target.waitForFunction(()=>Duna.inspect().state==='running');
  const menu=async(action,target=page)=>{
   await target.locator('#home-screen [data-action="'+action+'"]').click();
   if(action==='play'){
    await target.locator('#modes-screen').waitFor({state:'visible'});
    if(await target.locator('#continue-journey').isVisible())await target.locator('#continue-journey').click();
    else {await target.locator('#modes-screen [data-action="stages"]').click();await target.locator('#stage-worlds button:not(:disabled)').last().click();}
   }
  };
  const back=async target=>{await target.locator('.screen:not([hidden]) .back-link').click();if(await target.locator('#modes-screen').isVisible())await target.locator('#modes-screen .back-link').click();};
  await page.goto(url);await page.locator('.play-button').waitFor();
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(80);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const buttonsFit=await page.locator('.main-menu').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});
   assert.equal(buttonsFit,true,'Desktop main menu clipped');await shot('v2-home-'+width);
  }
  await page.setViewportSize({width:1440,height:900});
  await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'play');
  await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'stages');
  await page.keyboard.press('Enter');assert.equal(await page.locator('#stage-worlds button:disabled').count(),4);await shot('v2-stages');
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');await menu('characters');await shot('v2-characters');
  await page.locator('[data-item="robot"]').click();assert.match(await page.locator('#toast').innerText(),/Faltam moedas/);
  await back(page);await menu('settings');await page.locator('#music-setting').uncheck();await shot('v2-settings');
  await page.reload();await menu('settings');assert.equal(await page.locator('#music-setting').isChecked(),false);
  await back(page);await watch(page);await menu('play');await ready(page);
  await page.keyboard.press('Space');await page.waitForTimeout(90);assert.ok(await page.evaluate(()=>qaEngine.player.y<Duna.GROUND-20));
  await page.waitForTimeout(750);await page.keyboard.down('ArrowDown');await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>qaEngine.player.duck),true);await page.keyboard.up('ArrowDown');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>Duna.inspect().state),'paused');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'home');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'resume');
  const before=await page.evaluate(()=>qaEngine.time);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>qaEngine.time),before);
  await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.locator('#sfx-setting').uncheck();await back(page);
  assert.equal(await page.evaluate(()=>qaEngine.state),'paused');assert.equal(await page.evaluate(()=>qaEngine.time),before);
  for(const [width,height] of [[1920,1080],[1366,768],[1024,768]]){
   await page.setViewportSize({width,height});await shot('v2-pause-'+width);
   assert.equal(await page.locator('.overlay-card').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),true);
  }
  await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.evaluate(()=>{qaEngine.obstacles=[];qaEngine.coins=[{x:qaEngine.player.x+40,y:Duna.GROUND-45}];qaEngine.nextObstacle=100;});await page.waitForTimeout(90);
  assert.ok(await page.evaluate(()=>Duna.inspect().coins>=1));
  assert.equal(await page.locator('#wallet-count').innerText(),await page.locator('#hud-coins').innerText());await shot('v2-game-desert');
  await page.evaluate(()=>{qaEngine.time=45;qaEngine.update(1/120);for(let i=0;i<3;i++){qaEngine.player.invulnerable=0;qaEngine.damage();}});
  await page.getByRole('dialog',{name:'Game Over'}).waitFor();await shot('v2-game-over');
  await page.reload();assert.equal(await page.locator('#play-label').innerText(),'JOGAR');await watch(page);await menu('play');
  await page.waitForFunction(()=>window.qaEngine);assert.equal(await page.evaluate(()=>qaEngine.time),40);assert.equal(await page.evaluate(()=>qaEngine.lives),3);await ready(page);
  for(let stage=0;stage<5;stage++){
   assert.equal(await page.evaluate(()=>qaEngine.stage.id),stage);
   await page.evaluate(()=>{qaEngine.time=qaEngine.stage.duration-1/240;qaEngine.obstacles=[];qaEngine.update(1/120);});
   await page.getByRole('dialog',{name:stage===4?'Vitória':'Fase concluída',exact:true}).waitFor();await shot(stage===4?'v2-victory':'v2-complete-'+stage);
   if(stage<4){await page.getByRole('button',{name:'Próxima fase'}).click();await ready(page);await shot('v2-world-'+(stage+2));}
  }
  await page.getByRole('button',{name:'Menu principal',exact:true}).click();await menu('stages');assert.equal(await page.locator('#stage-worlds button:disabled').count(),0);await back(page);
  await menu('play');await ready(page);await page.evaluate(()=>qaEngine.save.earn(400));await page.keyboard.press('Escape');await page.getByRole('button',{name:'Menu principal',exact:true}).click();
  await menu('characters');for(const item of ['robot','ocean','spark'])await page.locator('[data-item="'+item+'"]').click();
  await page.reload();const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('duna.save.v1')));
  assert.equal(persisted.selected,'robot');assert.equal(persisted.skin,'ocean');assert.equal(persisted.trail,true);assert.equal(persisted.unlocked,5);
  assert.equal(persisted.version,1);assert.equal(persisted.settings.music,false);assert.equal(persisted.settings.sfx,false);
  console.log('Desktop flows passed. Testing touch and orientation.');
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url);
  for(const [width,height] of [[390,844],[360,640],[320,568],[844,390],[667,375]]){
   await phone.setViewportSize({width,height});await shot('v2-mobile-menu-'+width,phone);
   assert.equal(await phone.locator('.main-menu').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;}),true,`mobile menu ${width}`);
   assert.equal(await phone.locator('.hero h1').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),true,`logo clipped at ${width}`);
   assert.equal(await phone.locator('.header-tools').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),true,`toolbar clipped at ${width}`);
  }
  await phone.setViewportSize({width:390,height:844});
  for(const screen of ['stages','characters','settings']){await menu(screen,phone);await shot('v2-mobile-'+screen,phone);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await back(phone);}
  await phone.setViewportSize({width:844,height:390});await watch(phone);await menu('play',phone);await ready(phone);
  assert.equal(await phone.locator('.touch-controls').isVisible(),true);
  await phone.locator('#touch-jump').tap();await phone.waitForTimeout(100);assert.ok(await phone.evaluate(()=>qaEngine.player.y<Duna.GROUND-20));await phone.waitForTimeout(800);
  const cdp=await phone.context().newCDPSession(phone);
  const duck=await phone.locator('#touch-duck').boundingBox();const jump=await phone.locator('#touch-jump').boundingBox();
  const point=(r,id)=>({x:r.x+r.width/2,y:r.y+r.height/2,id});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(duck,1)]});await phone.waitForTimeout(90);assert.equal(await phone.evaluate(()=>qaEngine.player.duck),true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(duck,1),point(jump,2)]});await phone.waitForTimeout(100);assert.ok(await phone.evaluate(()=>qaEngine.player.y<Duna.GROUND-20));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await phone.waitForTimeout(850);assert.equal(await phone.evaluate(()=>qaEngine.down),false);assert.equal(await phone.locator('.touch-button.pressed').count(),0);
  await shot('v2-mobile-playing-landscape',phone);
  await phone.setViewportSize({width:390,height:844});await phone.getByRole('dialog',{name:'Jogo pausado'}).waitFor();await shot('v2-mobile-pause-portrait',phone);
  await phone.getByRole('button',{name:'Continuar',exact:true}).tap();await shot('v2-mobile-playing-portrait',phone);
  assert.ok(await phone.evaluate(()=>document.getElementById('game-canvas').width*document.getElementById('game-canvas').height<2410000));
  for(let i=0;i<4;i++){await phone.getByRole('button',{name:'Pausar',exact:true}).tap();await phone.getByRole('button',{name:'Recomeçar fase'}).tap();await ready(phone);}
  await phone.evaluate(()=>{window.jumpCalls=0;const original=qaEngine.jump;qaEngine.jump=function(){window.jumpCalls++;original.call(this);};});
  await phone.locator('#touch-jump').tap();assert.equal(await phone.evaluate(()=>window.jumpCalls),1,'duplicate restart listeners');
  await phone.getByRole('button',{name:'Pausar',exact:true}).tap();await phone.getByRole('button',{name:'Menu principal',exact:true}).tap();
  await menu('settings',phone);await phone.setViewportSize({width:844,height:390});await shot('v2-mobile-settings-landscape',phone);
  await mobile.close();
  await page.goto('file:///'+path.resolve(__dirname,'../index.html').replaceAll('\\','/'));await menu('play');await ready(page);
  assert.deepEqual(errors,[]);console.log('PASS: fullscreen desktop/mobile layouts, keyboard menus, touch + multitouch/cancel, orientation pause, restarts, coins, five worlds, victory, purchases, settings, v1 saves, checkpoints and file:// launch.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
