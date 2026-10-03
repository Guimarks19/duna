(function (D) {
  'use strict';
  const TAU=Math.PI*2;
  const mod=(a,b)=>((a%b)+b)%b;
  function path(c,points,color) { c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fill(); }
  function ellipse(c,x,y,rx,ry,color) {c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
  function rect(c,x,y,w,h,r,color) {c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function line(c,points,color,width=3) {c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke();}
  function cactus(c,x,y,s,color='#768a58') {
    c.save();c.translate(x,y);c.scale(s,s);
    rect(c,-12,-105,24,110,11,color);
    line(c,[[-9,-42],[-36,-42],[-36,-77]],color,17);
    line(c,[[10,-58],[32,-58],[32,-91]],color,15);
    line(c,[[-2,-92],[-2,-9]],'#ffffff20',2);
    c.restore();
  }
  function pine(c,x,y,s,color,snow=false) {
    c.save();c.translate(x,y);c.scale(s,s);rect(c,-5,-75,10,78,2,'#6d7762');
    for(let j=0;j<3;j++) {const b=-23-j*40;path(c,[[-53+j*11,b],[0,b-93],[53-j*11,b]],color);if(snow)path(c,[[-24+j*4,b-50],[0,b-93],[24-j*4,b-50],[0,b-57]],'#f3f5e9');}
    c.restore();
  }
  function cloud(c,x,y,s,alpha=.4) {c.save();c.globalAlpha=alpha;c.fillStyle='#fffdf0';c.beginPath();c.ellipse(x,y,68*s,14*s,0,0,TAU);c.ellipse(x-22*s,y-11*s,24*s,22*s,0,0,TAU);c.ellipse(x+16*s,y-17*s,32*s,25*s,0,0,TAU);c.fill();c.restore();}
  // Every environment is drawn from original vector shapes, in layered world coordinates.
  function backdrop(c,w,h,stageId,offset=0,t=0,options={}) {
    const s=D.STAGES[stageId], floor=options.floor??h*.78,night=options.period==='night';
    c.fillStyle=night?(stageId===4?'#201e35':'#142a43'):s.sky;c.fillRect(0,0,w,h);
    if(options.cinematic){const sky=c.createLinearGradient(0,0,0,floor);sky.addColorStop(0,'#547f79');sky.addColorStop(.5,'#c5c997');sky.addColorStop(1,'#edca87');c.fillStyle=sky;c.fillRect(0,0,w,h);}
    const grad=c.createLinearGradient(0,0,0,floor);grad.addColorStop(0,'#ffffff12');grad.addColorStop(1,stageId===4?'#dc99772b':'#e7d8a51a');c.fillStyle=grad;c.fillRect(0,0,w,floor);
    const sx=w*.77,sy=floor*.33,sr=Math.min(h*.15,120);
    if(night){
      for(let i=0;i<42;i++)ellipse(c,mod(i*193+37-offset*.008,w),25+mod(i*59,floor*.53),i%5===0?2:1,i%5===0?2:1,'#d9ecff99');
      ellipse(c,sx,sy,sr*.7,sr*.7,'#9bbde018');ellipse(c,sx,sy,sr*.44,sr*.44,'#e1e9dd');
      ellipse(c,sx+sr*.13,sy-sr*.10,sr*.39,sr*.39,stageId===4?'#201e35':'#142a43');
    }else{
      ellipse(c,sx,sy,sr*1.38,sr*1.38,stageId===4?'#c9917011':'#f9db9b16');
      ellipse(c,sx,sy,sr,sr,stageId===4?'#c780622b':'#e8c57e66');
    }
    for(let i=0;i<6;i++) cloud(c,mod(i*423+180-offset*.045-t*5,w+260)-130,55+(i*47)%Math.max(110,floor*.28),.64+(i%3)*.21,night?.08:.36);
    // Environment palettes keep silhouettes readable in both lighting conditions.
    c.save();
    if(stageId===0) {
      // Sandstone mesas behind rolling dunes.
      for(let i=0;i<5;i++) {const x=mod(i*580+760-offset*.13,w+900)-250;const base=floor*.8;const height=95+(i%3)*47;
        path(c,[[x-190,base],[x-90,base-height*.55],[x-66,base-height],[x+35,base-height],[x+63,base-height*.63],[x+105,base-height*.6],[x+220,base]],night?'#35485f':options.cinematic?'#afad7d':'#d4c7a7');
        path(c,[[x-66,base-height],[x+35,base-height],[x+63,base-height*.63],[x-23,base-height*.63]],night?'#435770':options.cinematic?'#c8be86':'#e0d3b2');
        line(c,[[x-55,base-height+20],[x+27,base-height+20]],'#c5b99955',2);
      }
      dunes(c,w,h,floor,offset*.19,night?'#395367':options.cinematic?'#b6bd88':'#d9d1af',26,80);
      dunes(c,w,h,floor+24,offset*.32,night?'#304b60':options.cinematic?'#8b9f6c':'#c8c5a0',17,132);
      for(let i=0;i<7;i++){const x=mod(i*347+210-offset*.43,w+300)-100;cactus(c,x,floor-20-(i%3)*13,.37+(i%3)*.2,night?'#456269':'#9aab7c');}
      dunes(c,w,h,floor+25,offset*.5,night?'#2b4558':options.cinematic?'#6d8b59':'#adb58b',10,65);
    } else if(stageId===1) {
      dunes(c,w,h,floor-60,offset*.15,night?'#304a58':'#b5c7a5',25,145);
      for(let layer=0;layer<2;layer++)for(let i=0;i<10;i++){const x=mod(i*263+layer*127-offset*(.2+layer*.2),w+380)-140;const y=floor+10-layer*5;const size=.8+(i%4)*.22;pine(c,x,y,size,night?(layer?'#264c4e':'#36575f'):layer?'#8fa57b':'#b0c19b');}
      dunes(c,w,h,floor+12,offset*.45,night?'#294a4d':'#8aa274',12,76);
      for(let i=0;i<7;i++) {const x=mod(i*351-offset*.5,w+250)-100;ellipse(c,x,floor-7,70,43,night?'#2e5553':'#7f996b');ellipse(c,x+60,floor+7,55,35,night?'#3c6460':'#91a579');}
    } else if(stageId===2) {
      for(let l=0;l<2;l++)for(let i=0;i<12;i++) {const x=mod(i*195+l*72-offset*(.15+l*.19),w+300)-150;const bh=100+(i*73%210),bw=90+i%3*23,y=floor-42;
        rect(c,x,y-bh,bw,bh,3,night?(l?'#304957':'#263d50'):l?'#9cafa8':'#bac9be');
        for(let row=0;row<Math.floor(bh/35)-1;row++)for(let col=0;col<3;col++)rect(c,x+13+col*28,y-bh+19+row*32,12,17,1,night?((row+col+i)%4?'#edc97fe6':'#45616a'):l?'#dce2cba8':'#dce3d277');
        if(i%3===0)line(c,[[x+bw/2,y-bh],[x+bw/2,y-bh-24]],'#a8b9ae',3);
      }
      c.fillStyle=night?'#506768':'#b0bb9c';c.fillRect(0,floor-32,w,40);
      for(let i=0;i<5;i++) {const x=mod(i*465-offset*.48,w+220)-60;line(c,[[x,floor],[x,floor-164],[x+35,floor-164]],'#81998d',5);ellipse(c,x+35,floor-163,13,5,'#f4e6b6');}
    } else if(stageId===3) {
      for(let i=0;i<6;i++){const x=mod(i*460+140-offset*.12,w+680)-300;const peak=floor*.36+(i%2)*65;
        path(c,[[x-300,floor],[x,peak],[x+310,floor]],night?'#506d83':'#b6cccc');path(c,[[x-115,peak+170],[x,peak],[x+118,peak+165],[x+54,peak+139],[x+11,peak+159],[x-33,peak+127]],night?'#a6c3d2':'#f3f3e7');}
      dunes(c,w,h,floor+7,offset*.23,night?'#789aa9':'#d7e3d8',14,95);
      for(let i=0;i<8;i++)pine(c,mod(i*294+60-offset*.42,w+330)-100,floor+8,.8+(i%3)*.2,night?'#446c7a':'#8eafa4',true);
      dunes(c,w,h,floor+28,offset*.5,night?'#668998':'#c0d5cc',14,58);
    } else {
      for(let i=0;i<4;i++) {const x=mod(i*700+610-offset*.12,w+1000)-240;const peak=floor*.29+(i%2)*100;
        path(c,[[x-330,floor],[x-65,peak],[x+55,peak],[x+370,floor]],night?'#4d4356':'#b49c8c');
        path(c,[[x-65,peak],[x+55,peak],[x+91,peak+61],[x+32,peak+40],[x+3,peak+106],[x-18,peak+42],[x-93,peak+62]],night?'#c98569':'#d6a17e');
        for(let p=0;p<4;p++)ellipse(c,x+p*23-25,peak-30-p*29,33+p*9,22+p*7,'#a99d9124');
      }
      dunes(c,w,h,floor+8,offset*.26,night?'#4e4658':'#b09c81',20,120);
      for(let i=0;i<10;i++){const x=mod(i*228-offset*.4,w+300)-120;path(c,[[x-56,floor],[x-31,floor-85-(i%3)*19],[x+12,floor-110],[x+64,floor]],night?'#3d3d4c':'#928e74');}
      dunes(c,w,h,floor+28,offset*.47,night?'#484754':'#959176',15,65);
    }
    c.restore();
    // Grass lip, darker soil and fine moving ground marks establish speed.
    c.fillStyle=night?(stageId===3?'#567781':stageId===4?'#403740':'#334b4d'):options.cinematic?'#557342':s.ground;c.fillRect(0,floor,w,h-floor);
    c.fillStyle=night?(stageId===3?'#b5d4dd':'#718c8c'):stageId===3?'#dfede0':'#b1bd8b';c.fillRect(0,floor,w,5);
    c.fillStyle=stageId===4?'#54473d20':'#4c613420';c.fillRect(0,floor+33,w,h-floor-33);
    for(let i=0;i<42;i++){const x=mod(i*83.2-offset*.85,w+150)-60;const yy=floor+18+(i*37)%Math.max(20,h-floor-45);line(c,[[x,yy],[x+5+(i%4)*6,yy]],'#263f2619',2);}
    if(stageId!==2&&stageId!==3)for(let i=0;i<22;i++){const x=mod(i*124+41-offset*.65,w+100)-50;line(c,[[x,floor],[x-4,floor-7],[x+2,floor-2],[x+5,floor-11]],'#667b4a55',2);}
    if(night&&stageId===2)for(let i=0;i<5;i++){
      const x=mod(i*465-offset*.48,w+220)-60;
      path(c,[[x+28,floor-158],[x+42,floor-158],[x+98,floor],[x-38,floor]],'#ffd98b13');
      ellipse(c,x+35,floor-163,22,12,'#ffda7729');ellipse(c,x+35,floor-163,12,5,'#ffe2a0');
    }
    if(night&&stageId===1&&!options.reduced)for(let i=0;i<14;i++)ellipse(c,mod(i*137-offset*.45,w),floor-40-mod(i*41+Math.sin(t+i)*12,170),2,2,'#d5ef9eaa');
    if(!options.reduced && (stageId===3 || stageId===4))for(let i=0;i<50;i++){const x=mod(i*79-offset*.28+t*(stageId===3?13:22),w);const y=mod(i*61+t*(stageId===3?31:-28),floor);ellipse(c,x,y,stageId===3?2.5:2,stageId===3?2.5:2,stageId===3?'#fffdf0b0':'#edb07199');}
  }
  function dunes(c,w,h,y,offset,color,frequency,amplitude) {
    c.fillStyle=color;c.beginPath();c.moveTo(0,h);
    for(let x=0;x<=w+30;x+=30){const yy=y-amplitude+Math.sin((x+offset)/(frequency*19))*amplitude*.45+Math.cos((x+offset)/307)*amplitude*.22;c.lineTo(x,yy);}
    c.lineTo(w,h);c.closePath();c.fill();
  }
  function drawCharacter(c,id,x,y,scale=1,pose='run',time=0,skin='original',hurt=false) {
    c.save();c.translate(x,y);c.scale(scale,scale);
    const character=D.CHARACTERS.find(ch=>ch.id===id)||D.CHARACTERS[0];
    const base=skin==='sunset'?'#c37b59':skin==='ocean'?'#709ca8':character.color;
    const dark=skin==='sunset'?'#a85f48':skin==='ocean'?'#537d88':id==='dino'?'#566f45':id==='robot'?'#506e70':'#7e5841';
    const running=pose==='run',duck=pose==='duck';
    const stride=running?Math.sin(time*17)*13:pose==='jump'?9:0;
    const bob=running?Math.abs(Math.sin(time*17))*2:0;
    c.translate(0,-bob);
    if(hurt){c.shadowColor='#fff6cc';c.shadowBlur=15;}
    if(id==='dino') {
      if(duck){
        path(c,[[-12,-24],[-41,-54],[-29,-12],[30,-5],[56,-30],[55,-46],[14,-51]],base);
        rect(c,41,-56,51,34,8,base);rect(c,60,-38,33,8,2,'#e3d4a3');
        rect(c,12,-12,15,13,3,dark);rect(c,44,-12,22,10,3,dark);ellipse(c,76,-47,3,4,'#283c30');
        path(c,[[0,-45],[4,-60],[16,-48],[21,-61],[29,-47]],dark);
      } else {
        // Rounded silhouette, leaf-shaped back spikes and a warm cream belly.
        path(c,[[10,-43],[-17,-47],[-39,-71],[-29,-37],[-6,-19],[25,-17]],base);
        path(c,[[8,-61],[2,-73],[17,-72],[14,-89],[29,-84],[26,-99],[40,-94]],dark);
        ellipse(c,27,-46,29,34,base);rect(c,29,-95,23,63,9,base);rect(c,27,-113,58,44,10,base);
        path(c,[[48,-72],[72,-72],[71,-60],[53,-60],[49,-28],[29,-18],[23,-22],[43,-39]],'#dce0ae');
        rect(c,57,-82,31,9,3,'#dce0ae');ellipse(c,68,-98,4,5,'#263b2e');ellipse(c,69,-100,1.2,1.5,'#fff8e4');
        line(c,[[52,-51],[68,-51],[70,-44]],dark,6);
        line(c,[[20,-23],[17-stride*.5,-9],[21-stride,-3],[33-stride,-3]],dark,10);
        line(c,[[39,-22],[40+stride*.45,-11],[39+stride,-3],[51+stride,-3]],base,11);
        ellipse(c,79,-87,1.6,1.6,dark);
      }
    } else if(id==='robot') {
      if(duck){rect(c,1,-39,64,30,8,base);rect(c,54,-50,43,29,7,base);rect(c,62,-43,27,11,3,'#3d5a55');ellipse(c,75,-38,3,3,'#e5e6ae');line(c,[[8,-9],[54,-9]],dark,14);}
      else {line(c,[[24,-25],[20-stride,-8]],dark,9);line(c,[[47,-25],[46+stride,-8]],dark,9);rect(c,8-stride,-8,23,9,3,dark);rect(c,37+stride,-8,23,9,3,dark);rect(c,7,-72,54,48,10,base);rect(c,4,-113,62,39,9,base);rect(c,12,-104,46,23,6,'#3d5a55');ellipse(c,27,-93,4,5,'#dcebb4');ellipse(c,47,-93,4,5,'#dcebb4');line(c,[[34,-113],[34,-127]],dark,3);ellipse(c,34,-129,4,4,'#d4b566');line(c,[[6,-64],[-4,-44]],dark,8);line(c,[[59,-64],[69,-46]],dark,8);rect(c,21,-62,27,17,4,'#d4cf9f');ellipse(c,34,-53,3,3,base);}
    } else {
      if(duck){rect(c,0,-42,56,31,8,base);rect(c,-5,-46,24,27,6,dark);ellipse(c,67,-36,17,17,'#dcae81');rect(c,50,-56,38,11,4,dark);line(c,[[12,-10],[51,-10]],'#465f4b',13);}
      else{line(c,[[20,-28],[16-stride,-7]],'#4f654f',12);line(c,[[39,-28],[43+stride,-7]],'#4f654f',12);rect(c,5-stride,-8,25,9,3,dark);rect(c,33+stride,-8,25,9,3,dark);rect(c,-1,-77,24,44,7,dark);rect(c,14,-79,35,54,10,base);line(c,[[39,-67],[52,-48],[63,-53]],'#dcae81',8);ellipse(c,37,-98,20,21,'#dcae81');path(c,[[17,-106],[20,-121],[46,-121],[55,-107]],dark);rect(c,11,-108,55,8,3,dark);ellipse(c,46,-98,2.4,3,'#3b4332');rect(c,15,-82,36,9,3,'#ddac65');}
    }
    c.restore();
  }
  function wheel(c,x,y,r,angle) {
    ellipse(c,x,y,r,r,'#304348');ellipse(c,x,y,r*.62,r*.62,'#adbeb5');
    for(let i=0;i<3;i++){const a=angle+i*Math.PI/3;line(c,[[x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5],[x-Math.cos(a)*r*.5,y-Math.sin(a)*r*.5]],'#45636a',2);}
    ellipse(c,x,y,3,3,'#e0d3a6');
  }
  function drawObstacle(c,o,t,night=false) {
    let {x,y,w,h,type}=o;
    c.save();
    if(type==='car'||type==='motorcycle'){const width=type==='car'?170:111,height=type==='car'?78:83;c.translate(x,y);c.scale(w/width,h/height);x=0;y=0;w=width;h=height;}
    if(type==='cactus')cactus(c,x+w*.5,y+h,h/110,'#617c46');
    else if(['rock','ice','falling'].includes(type)) {
      if(type==='falling' && o.warning) {c.globalAlpha=.7;line(c,[[x+w/2,80],[x+w/2,D.GROUND-12]],'#b9866455',3);path(c,[[x+w/2-10,105],[x+w/2+10,105],[x+w/2,122]],'#c88250');c.globalAlpha=1;}
      path(c,[[x,y+h],[x-3,y+h*.5],[x+w*.21,y+h*.1],[x+w*.68,y],[x+w,y+h*.47],[x+w*.93,y+h]],type==='ice'?'#a5d1d1':'#8c8a73');
      path(c,[[x+w*.21,y+h*.1],[x+w*.68,y],[x+w*.54,y+h*.66],[x,y+h*.5]],type==='ice'?'#dcece0':'#b5af8e');
      if(type==='ice')line(c,[[x+w*.48,y+12],[x+w*.7,y+h*.44],[x+w*.48,y+h*.7]],'#ecf8ea',3);
    } else if(type==='bird') {
      const wing=Math.sin(t*16+o.phase)*22;ellipse(c,x+w/2,y+h*.5,w*.34,h*.26,'#737d63');path(c,[[x+w*.35,y+h*.5],[x+w*.6,y+wing],[x+w*.8,y+h*.4]],'#a8b389');path(c,[[x+w*.17,y+h*.42],[x-8,y+h*.6],[x+w*.2,y+h*.68]],'#d9b77d');ellipse(c,x+w*.24,y+h*.43,3,3,'#233b36');
    } else if(type==='log') {rect(c,x,y,w,h,12,'#887556');ellipse(c,x+w-5,y+h/2,12,h/2,'#c6ad77');ellipse(c,x+w-4,y+h/2,7,h*.31,'#978058');line(c,[[x+10,y+15],[x+w-25,y+15]],'#ac976b',4);line(c,[[x+10,y+h-13],[x+w-28,y+h-13]],'#685e43',3);}
    else if(type==='branch') {line(c,[[x-8,y+h*.56],[x+w,y+h*.5]],'#786b4a',23);line(c,[[x+w*.3,y+h*.5],[x+w*.1,y]],'#786b4a',11);ellipse(c,x+w*.2,y+5,24,9,'#6e8857');ellipse(c,x+w*.8,y+h*.4,19,8,'#7a945e');}
    else if(type==='animal') {ellipse(c,x+w*.45,y+h*.5,w*.4,h*.34,'#a7845b');ellipse(c,x+w*.82,y+h*.29,18,17,'#a7845b');path(c,[[x+w*.76,y+5],[x+w*.78,y-15],[x+w*.88,y+7]],'#97784e');path(c,[[x+9,y+h*.5],[x-20,y+5],[x-16,y+h*.65]],'#97784e');for(let i=0;i<2;i++)line(c,[[x+22+i*37,y+h*.6],[x+20+i*40+Math.sin(t*18+i*3)*6,y+h]],'#775f41',7);ellipse(c,x+w*.9,y+h*.25,2.5,3,'#293c2c');}
    else if(type==='cone') {path(c,[[x,y+h],[x+w*.42,y],[x+w*.64,y],[x+w,y+h]],'#d68d5e');path(c,[[x+w*.24,y+h*.5],[x+w*.78,y+h*.5],[x+w*.86,y+h*.7],[x+w*.17,y+h*.7]],'#f1e8cb');rect(c,x-6,y+h-8,w+12,11,3,'#8e8268');}
    else if(type==='barrier') {rect(c,x+8,y+20,8,h-20,2,'#777d65');rect(c,x+w-16,y+20,8,h-20,2,'#777d65');rect(c,x,y,w,35,4,'#d49f65');for(let i=0;i<3;i++)path(c,[[x+i*38,y],[x+i*38+20,y],[x+i*38+4,y+35],[x+i*38-12,y+35]],'#eee1bd');}
    else if(type==='car') {
      if(night)path(c,[[x+5,y+42],[x-135,y+15],[x-135,y+h+12],[x+5,y+54]],'#ffe9a329');
      rect(c,x,y+27,w,h-32,9,'#bb8b6f');path(c,[[x+25,y+32],[x+40,y],[x+w-48,y],[x+w-22,y+32]],'#bb8b6f');path(c,[[x+44,y+7],[x+w-51,y+7],[x+w-36,y+29],[x+31,y+29]],night?'#446975':'#c6d8ce');line(c,[[x+w*.53,y+4],[x+w*.53,y+30]],'#9c7964',5);
      wheel(c,x+29,y+h-10,17,o.roll);wheel(c,x+w-30,y+h-10,17,o.roll);rect(c,x-2,y+43,14,9,3,'#ffe9b2');rect(c,x+w-8,y+43,8,9,2,'#e7785a');
    }
    else if(type==='motorcycle') {
      if(night)path(c,[[x+8,y+36],[x-115,y+11],[x-115,y+h+4],[x+8,y+43]],'#ffe9a329');
      wheel(c,x+19,y+h-13,18,o.roll);wheel(c,x+w-18,y+h-13,18,o.roll);
      line(c,[[x+19,y+h-13],[x+37,y+38],[x+67,y+h-14],[x+w-18,y+h-13],[x+71,y+40],[x+37,y+38]],'#e7bc6e',7);
      line(c,[[x+19,y+h-13],[x+16,y+28],[x+32,y+28]],'#bcd1ce',5);
      rect(c,x+40,y+32,39,12,5,'#415d56');line(c,[[x+65,y+34],[x+54,y+12],[x+34,y+22],[x+20,y+28]],'#577481',10);
      ellipse(c,x+49,y+7,13,14,'#ecbb79');rect(c,x+36,y+4,16,6,2,'#293f46');line(c,[[x+64,y+36],[x+55,y+51],[x+70,y+57]],'#304c50',8);rect(c,x+6,y+31,10,8,3,'#ffedb4');
    }
    else if(type==='snowball') {
      ellipse(c,x+w/2,y+h/2,w/2,h/2,'#e2f0e9');c.translate(x+w/2,y+h/2);c.rotate(o.roll*.4);
      line(c,[[-w*.3,0],[-w*.12,-h*.24],[w*.18,-h*.12],[w*.31,h*.12]],'#accbd0',6);ellipse(c,-w*.12,h*.21,7,5,'#c0dade');
    }
    else if(type==='sign') {rect(c,x,y,w,h,5,'#7c9987');rect(c,x+5,y+5,w-10,h-10,3,'#e5dec1');line(c,[[x+20,y+h/2],[x+w-20,y+h/2],[x+w-30,y+h/2-10]],'#81947b',5);line(c,[[x+10,y-42],[x+10,y],[x+w-10,y],[x+w-10,y-42]],'#8b9b89',3);}
    else if(type==='tree') pine(c,x+w/2,y+h,h/175,'#678f80',true);
    else if(type==='icepatch') {rect(c,x,D.GROUND+2,w,18,8,'#c6e5dc');for(let i=0;i<4;i++)line(c,[[x+12+i*55,D.GROUND+8],[x+40+i*55,D.GROUND+8]],'#eff8e9',2);}
    else if(['pit','fissure','lava','platform'].includes(type)) {
      const lava=type==='lava'||type==='platform';
      path(c,[[x,D.GROUND],[x+w,D.GROUND],[x+w-14,D.GROUND+33],[x+w-6,D.GROUND+55],[x+18,D.GROUND+55],[x+8,D.GROUND+22]],lava?'#c6744c':'#46543a');
      if(lava){rect(c,x+9,D.GROUND+13,w-18,25,6,'#e6a452');for(let i=0;i<4;i++)ellipse(c,x+25+i*(w-50)/4,D.GROUND+23+Math.sin(t*4+i)*4,12,3,'#f4d283');}
      if(type==='platform') {rect(c,x+16,y,w-32,22,4,'#9e9878');line(c,[[x+20,y+4],[x+w-20,y+4]],'#c4b989',5);path(c,[[x+29,y+22],[x+w-29,y+22],[x+w*.65,D.GROUND+30],[x+w*.35,D.GROUND+30]],'#83745c');}
    }
    c.restore();
  }
  function drawCoin(c,x,y,t=0) {c.save();c.translate(x,y);const sw=.76+Math.abs(Math.sin(t*3))*.24;c.scale(sw,1);ellipse(c,0,0,15,17,'#c59a46');ellipse(c,0,-1,11.5,13.5,'#eaca78');path(c,[[0,-9],[5,-1],[0,7],[-5,-1]],'#b49044');line(c,[[-7,-9],[-4,-11]],'#fff1b8',2);c.restore();}
  class Renderer {
    constructor(canvas) {this.canvas=canvas;this.c=canvas.getContext('2d');}
    resize() {
      const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;
      this.cssWidth=r.width;this.cssHeight=r.height;
      // Cap backing-store cost, especially on 3x mobile displays.
      const dpr=Math.min(globalThis.devicePixelRatio||1,1.5,Math.sqrt(2400000/(r.width*r.height)));
      const width=Math.round(r.width*dpr),height=Math.round(r.height*dpr);
      if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
    }
    game(engine,save,time,viewport=null) {
      const c=this.c,aspect=(this.cssWidth||1920)/((this.cssHeight||1080)*(viewport?.height||1));
      const w=Math.max(D.minView(engine.speed),Math.min(D.WIDTH,aspect*D.HEIGHT)),h=w/aspect;
      const floor=h*(aspect<1?.66:(this.cssHeight||1080)<540?.73:.78);
      const cameraX=Math.max(0,D.PHYSICS.playerX-w*.18);
      const height=this.canvas.height*(viewport?.height||1),top=this.canvas.height*(viewport?.top||0);
      c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,top,this.canvas.width,height);c.clip();
      c.setTransform(this.canvas.width/w,0,0,height/h,0,top);
      c.clearRect(0,0,w,h);
      backdrop(c,w,h,engine.stage.id,engine.distance,time,{floor,reduced:save.settings.reducedMotion,period:engine.period});
      if(!save.settings.reducedMotion&&engine.speed>850){
        const intensity=Math.min(1,(engine.speed-850)/750);
        for(let i=0;i<Math.floor(14*intensity);i++){const x=mod(i*173-engine.distance*1.25,w+200),y=floor*.32+(i*71)%(floor*.6);line(c,[[x,y],[x+22+intensity*55,y]],engine.period==='night'?'#cee6ec28':'#fcf4d740',1.5);}
      }
      c.save();c.translate(-cameraX,floor-D.GROUND);
      const p=engine.player;
      if((engine.mode==='stages'&&engine.stage.duration-engine.time<8)||(engine.mode==='race'&&engine.raceTarget-engine.distance<w)){
        const remaining=engine.mode==='race'?engine.raceTarget-engine.distance:D.travel(engine.stage,engine.time,engine.stage.duration-engine.time);
        const x=p.x+remaining;
        line(c,[[x,D.GROUND],[x,D.GROUND-235]],'#efe0b0',8);
        rect(c,x,D.GROUND-235,105,65,3,'#e9cb78');
        for(let row=0;row<3;row++)for(let col=0;col<5;col++)if((row+col)%2===0)rect(c,x+col*21,D.GROUND-235+row*21,21,21,0,'#51613b');
      }
      for(const o of engine.obstacles)drawObstacle(c,o,o.age,engine.period==='night');
      for(const coin of engine.coins)if(!coin.collected)drawCoin(c,coin.x,coin.y,time+coin.x*.01);
      ellipse(c,p.x+32,D.GROUND+5,Math.max(18,48-(D.GROUND-p.y)*.07),8,'#364d2d22');
      for(const a of engine.particles){c.globalAlpha=Math.max(0,a.life/a.max);if(a.star){c.save();c.translate(a.x,a.y);c.rotate(a.life*3);path(c,[[0,-6],[2,-2],[6,0],[2,2],[0,6],[-2,2],[-6,0],[-2,-2]],a.color);c.restore();}else ellipse(c,a.x,a.y,a.size,a.size,a.color);}
      c.globalAlpha=1;
      if(p.invulnerable<=0||Math.floor(p.invulnerable*10)%2===0)drawCharacter(c,save.selected,p.x,p.y,1,p.duck?'duck':p.grounded?'run':'jump',engine.motionTime,save.skin,p.invulnerable>1.7);
      c.restore();
      if(engine.flash>0){c.fillStyle=`rgba(186,87,60,${engine.flash*.3})`;c.fillRect(0,0,w,h);}
      c.restore();
    }
    race(race,time) {
      for(let i=0;i<2;i++){const p=race.players[i];p.raceTarget=race.target;this.game(p,p.save.data,time,{top:i*.5,height:.5});}
    }
    menu(time,save) {
      const c=this.c,w=this.canvas.width,h=this.canvas.height,portrait=h>w,floor=h*(portrait?.86:.79);
      c.setTransform(1,0,0,1,0,0);
      backdrop(c,w,h,0,time*52,time,{floor,reduced:save.settings.reducedMotion,cinematic:true});
      const x=w*(portrait?.64:.7),scale=Math.max(.9,Math.min(w/490,h/(portrait?660:335)));
      ellipse(c,x+22*scale,floor+6,65*scale,10*scale,'#203d2c33');
      // Sparse foreground landmarks frame the runner without competing with the title.
      cactus(c,w*.925,floor+5,scale*.68,'#4d7442');cactus(c,w*.89,floor+5,scale*.36,'#60834c');
      drawCharacter(c,save.selected,x,floor,scale,'run',time,save.skin);
      for(let i=0;i<3;i++){const px=x-42*scale-i*26-mod(time*30,26);ellipse(c,px,floor-2-i*3,3+i,2+i,'#788b5140');}
      for(let i=0;i<3;i++)drawCoin(c,x+93*scale+i*23*scale,floor-63*scale-Math.sin(i*.9)*17*scale,time+i);
      if(!save.settings.reducedMotion)for(let i=0;i<22;i++){
        const px=mod(i*131-time*9,w),py=floor*.4+mod(i*73-time*(5+i%3),floor*.6);
        c.globalAlpha=.2+Math.sin(time+i)*.15;ellipse(c,px,py,1.5+i%2,1.5+i%2,'#fff1b1');
      }
      c.globalAlpha=1;
      // Dark foreground plants frame the playable world like a game title screen.
      for(let side=0;side<2;side++){
        c.save();c.translate(side?w:0,h);c.scale(side?-1:1,1);
        path(c,[[0,0],[0,-h*.23],[w*.06,-h*.08],[w*.018,-h*.2],[w*.11,-h*.03],[w*.12,0]],'#234735');
        path(c,[[0,0],[w*.08,-h*.15],[w*.055,-h*.01],[w*.16,-h*.07],[w*.12,0]],'#2c5238');c.restore();
      }
    }
  }
  D.Art={backdrop,drawCharacter,drawCoin,drawObstacle,ellipse};
  D.Renderer=Renderer;
})(globalThis.Duna = globalThis.Duna || {});
