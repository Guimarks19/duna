// Optional integration QA. Uses the same external Playwright runtime as browser-game.cjs.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
const url=process.env.TEST_URL||'http://localhost:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),errors=[];
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
  const shot=async(name,p=page)=>p.screenshot({path:path.join(output,name+'.png'),animations:'disabled'});
  const option=async(key,value,p=page)=>p.locator(`[data-option="${key}"][data-value="${value}"]`).click();
  const watch=async p=>p.evaluate(()=>{const original=Duna.Engine.prototype.update;Duna.Engine.prototype.update=function(dt){window.qaEngine=this;return original.call(this,dt);};});
  await page.goto(url);
  await page.locator('[data-action="device-pc"]').click();
  await page.locator('[data-action="play"]').click();assert.equal(await page.evaluate(()=>Duna.inspect().screen),'modes');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'stages');await shot('v3-modes');
  await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'free');await page.keyboard.press('Enter');
  await page.locator('#free-screen').waitFor({state:'visible'});assert.equal(await page.locator('[data-option="map"]').count(),5);
  for(let map=0;map<5;map++){
   await option('map',map);await option('period','day');await page.waitForTimeout(60);
   const day=await page.locator('#free-preview').evaluate(c=>Array.from(c.getContext('2d').getImageData(10,10,1,1).data));
   await option('period','night');await page.waitForTimeout(60);
   const night=await page.locator('#free-preview').evaluate(c=>Array.from(c.getContext('2d').getImageData(10,10,1,1).data));
   assert.ok(night[0]+night[1]+night[2]<(day[0]+day[1]+day[2])*.55,`night sky ${map}`);await shot('v3-free-map-'+map);
  }
  await option('map',2);await option('speed','fast');await option('difficulty','hard');await option('density','many');await shot('v3-free-config');
  await watch(page);await page.locator('[data-action="start-free"]').click();await page.locator('[data-action="tutorial-start"]').click();await page.waitForFunction(()=>window.qaEngine);
  await page.evaluate(()=>qaEngine.save.checkpoint({stage:0,time:40,score:480,coins:0,distance:20000}));
  await page.reload();await watch(page);await page.locator('[data-action="play"]').click();assert.equal(await page.locator('#continue-journey').isVisible(),true);
  await page.locator('#modes-screen [data-action="free"]').click();
  for(const [key,value] of Object.entries({map:2,period:'night',speed:'fast',difficulty:'hard',density:'many'}))assert.equal(await page.locator(`[data-option="${key}"][data-value="${value}"]`).getAttribute('aria-pressed'),'true');
  await page.locator('[data-action="start-free"]').click();await page.waitForFunction(()=>Duna.inspect().state==='running');
  assert.equal(await page.evaluate(()=>qaEngine.mode),'free');assert.equal(await page.evaluate(()=>qaEngine.period),'night');assert.equal(await page.locator('.progress-track').isVisible(),false);
  assert.match(await page.locator('#hud-time').innerText(),/∞/);assert.match(await page.locator('#hud-stage').innerText(),/LIVRE.*CIDADE/);
  await page.evaluate(()=>{qaEngine.time=240;qaEngine.nextObstacle=100;qaEngine.obstacles=[];qaEngine.speed=Duna.difficulty(qaEngine.stage,qaEngine.time).speed;const car=qaEngine.makeObstacle('car',Duna.difficulty(qaEngine.stage,qaEngine.time));car.x=1050;car.willHonk=true;qaEngine.obstacles.push(car);});
  await page.waitForTimeout(160);assert.equal(await page.evaluate(()=>qaEngine.state),'running');
  assert.ok(await page.evaluate(()=>qaEngine.audio.engineGain.gain.value>0));await shot('v3-city-night');
  await page.keyboard.press('Escape');await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>qaEngine.audio.engineGain.gain.value<.001));
  const paused=await page.evaluate(()=>qaEngine.time);await page.getByRole('button',{name:'Configurações',exact:true}).click();await page.locator('#sfx-setting').uncheck();await page.locator('#settings-screen .back-link').click();
  assert.equal(await page.evaluate(()=>qaEngine.time),paused);await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.evaluate(()=>{for(let i=0;i<3;i++){qaEngine.player.invulnerable=0;qaEngine.damage();}});
  await page.getByRole('dialog',{name:'Game Over',exact:true}).waitFor();assert.equal(await page.locator('[data-action="checkpoint"]').count(),0);await shot('v3-free-over');
  const score=await page.evaluate(()=>qaEngine.score);assert.equal(await page.evaluate(()=>qaEngine.save.data.freeBest),score);
  assert.equal(await page.evaluate(()=>qaEngine.save.data.checkpoint.time),40);assert.equal(await page.evaluate(()=>qaEngine.save.data.unlocked),1);
  await page.getByRole('button',{name:'Jogar novamente'}).click();await page.waitForFunction(()=>Duna.inspect().state==='running');
  assert.ok(await page.evaluate(()=>qaEngine.time<1));assert.equal(await page.evaluate(()=>qaEngine.period),'night');assert.equal(await page.evaluate(()=>qaEngine.lives),3);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Menu principal',exact:true}).click();await page.locator('[data-action="play"]').click();await page.locator('#continue-journey').click();
  assert.equal(await page.evaluate(()=>Duna.inspect().mode),'stages');assert.equal(await page.evaluate(()=>Duna.inspect().time),40);assert.equal(await page.locator('.progress-track').isVisible(),true);
  const phoneContext=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const phone=await phoneContext.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url);await watch(phone);
  await phone.locator('[data-action="device-mobile"]').click();
  for(const [width,height] of [[844,390],[667,375],[390,844],[320,568]]){
   await phone.setViewportSize({width,height});await phone.locator('[data-action="play"]').click();await phone.locator('#modes-screen [data-action="free"]').click();
   await option('period','night',phone);await shot('v3-free-mobile-'+width,phone);
   assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await phone.locator('#free-controls').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
   await phone.locator('#free-screen .back-link').click();await phone.locator('#modes-screen .back-link').click();
  }
  await phone.setViewportSize({width:844,height:390});await phone.locator('[data-action="play"]').click();await phone.locator('#modes-screen [data-action="free"]').click();
  await option('map',4,phone);await option('speed','extreme',phone);await option('difficulty','extreme',phone);await option('density','intense',phone);
  await phone.locator('[data-action="start-free"]').click();await phone.locator('[data-action="tutorial-start"]').click();await phone.waitForFunction(()=>Duna.inspect().state==='running');await phone.locator('#touch-jump').tap();await phone.waitForTimeout(100);
  assert.ok(await phone.evaluate(()=>qaEngine.player.y<Duna.GROUND-20));await shot('v3-free-mobile-playing',phone);
  const floor=await phone.evaluate(()=>innerHeight*.73),touch=await phone.locator('#touch-jump').boundingBox();assert.ok(touch.y>floor,'touch control covers path');
  await phone.setViewportSize({width:390,height:844});await phone.getByRole('dialog',{name:'Jogo pausado'}).waitFor();assert.equal(await phone.evaluate(()=>qaEngine.period),'night');await shot('v3-free-mobile-pause',phone);
  await phoneContext.close();assert.deepEqual(errors,[]);
  console.log('PASS: mode menu and keyboard, five day/night previews, persisted free preferences, endless run, vehicle audio/pause, separate records and campaign checkpoint, replay, four mobile sizes, touch and rotation.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
