// Snake Game Logic
'use strict';
var COLS=20,ROWS=20,CELL=25;
var canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
canvas.width=COLS*CELL;canvas.height=ROWS*CELL;
var scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),lbBestEl=document.getElementById('lbBest'),scorePanel=document.getElementById('scorePanel');
var startMenu=document.getElementById('startMenu'),gameOverEl=document.getElementById('gameOver'),pauseOverlay=document.getElementById('pauseOverlay');
var finalScoreEl=document.getElementById('finalScore'),newBestEl=document.getElementById('newBest');
var pauseBtn=document.getElementById('pauseBtn'),wrapToggle=document.getElementById('wrapToggle');
var diffLabel=document.getElementById('diffLabel'),themeLabel=document.getElementById('themeLabel');
var leaderboardEl=document.getElementById('leaderboard'),lbPanel=document.getElementById('lbPanel');
var finalDiffEl=document.getElementById('finalDiff'),finalLenEl=document.getElementById('finalLen');
var desktopHint=document.getElementById('desktopHint'),mobileHint=document.getElementById('mobileHint');

var themes={
  green:{id:'green',name:'翠绿',accent:'#22c55e',accent2:'#15803d',accent3:'#166534',bg:'#06080d',canvasBg:'#0b0e16',border:'#16422a',gridDot:'#0e111a',glow:'34,197,94',snakeH:[22,197,94],snakeT:[37,74,89],particleH:22,deathP:'#4ade80',popup:'#4ade80',text:'#d4dae3',label:'#465064'},
  blue:{id:'blue',name:'海蓝',accent:'#3b82f6',accent2:'#1d4ed8',accent3:'#1e3a5f',bg:'#050914',canvasBg:'#0a0f1c',border:'#182a4a',gridDot:'#0c1120',glow:'59,130,246',snakeH:[37,130,246],snakeT:[25,50,100],particleH:210,deathP:'#60a5fa',popup:'#60a5fa',text:'#d4dae3',label:'#465064'},
  purple:{id:'purple',name:'紫霞',accent:'#a855f7',accent2:'#7c3aed',accent3:'#4c1d95',bg:'#08050e',canvasBg:'#0e0b18',border:'#291a44',gridDot:'#100c1c',glow:'168,85,247',snakeH:[140,70,220],snakeT:[50,20,100],particleH:270,deathP:'#c084fc',popup:'#c084fc',text:'#d4dae3',label:'#465064'},
  gold:{id:'gold',name:'金芒',accent:'#f59e0b',accent2:'#b45309',accent3:'#78350f',bg:'#0c0802',canvasBg:'#120e08',border:'#3d2407',gridDot:'#14100a',glow:'245,158,11',snakeH:[245,180,20],snakeT:[100,60,10],particleH:35,deathP:'#fbbf24',popup:'#fbbf24',text:'#d4dae3',label:'#465064'},
  light:{id:'light',name:'亮白',accent:'#16a34a',accent2:'#15803d',accent3:'#166534',bg:'#e8ecf2',canvasBg:'#f8fafc',border:'#c0c8d8',gridDot:'#d4dae3',glow:'22,163,74',snakeH:[15,140,60],snakeT:[30,60,40],particleH:130,deathP:'#22c55e',popup:'#16a34a',text:'#1f2937',label:'#6b7280'}
};
var curTheme=themes.green;

var difficulties={
  easy:{id:'easy',name:'简单',baseSpeed:200,minSpeed:130,accel:2,specialEvery:5},
  normal:{id:'normal',name:'普通',baseSpeed:160,minSpeed:80,accel:3,specialEvery:6},
  hard:{id:'hard',name:'困难',baseSpeed:120,minSpeed:50,accel:4,specialEvery:8}
};
var curDiff=difficulties.normal;

var savedTheme=localStorage.getItem('snake-theme')||'green';
var savedDiff=localStorage.getItem('snake-diff')||'normal';
var wrapMode=localStorage.getItem('snake-wrap')==='on';
curTheme=themes[savedTheme]||themes.green;
curDiff=difficulties[savedDiff]||difficulties.normal;

var snake,food,dir,nextDir,score,best,speed,minSpeed,accel,timer,paused,gameOver,boosting=false,lastStepTime=0;
var specialEvery,specialFood=null,foodEaten=0,foodHidden=false;
var boostKeyHeld=false,boostStart=0,BOOST_DELAY=250;
var particles=[],eatGlow=0,eatGlowX=0,eatGlowY=0,shakeFrames=0;
var scorePopups=[],foodRipple=0,foodPop=0,foodPopX=0,foodPopY=0,started=false;
var isMobile=/Mobi|Android|iPhone/i.test(navigator.userAgent);

function loadLB(){try{return JSON.parse(localStorage.getItem('snake-lb')||'[]')}catch(e){return[]}}
function saveLB(lb){localStorage.setItem('snake-lb',JSON.stringify(lb))}
function addLB(s,diff,theme){var lb=loadLB();lb.push({score:s,diff:diff,theme:theme,date:new Date().toLocaleDateString('zh-CN')});lb.sort(function(a,b){return b.score-a.score});if(lb.length>5)lb.length=5;saveLB(lb);renderLB()}
function updateBestDisplay(v){bestEl.textContent=v;if(lbBestEl)lbBestEl.textContent=v}
function renderLB(){
  if(!leaderboardEl)return;var lb=loadLB();
  if(!lb.length){leaderboardEl.innerHTML='<div class="lb-empty">暂无记录</div>';return}
  var medals=['gold','silver','bronze','',''];var h='<table>';
  lb.forEach(function(r,i){h+='<tr><td class="lb-rank'+(medals[i]?' '+medals[i]:'')+'">'+(i+1)+'</td><td class="lb-score-val">'+r.score+'</td><td class="lb-diff-val">'+(r.diff||'')+'</td></tr>'});
  h+='</table>';leaderboardEl.innerHTML=h;
}
function updateLabels(){if(diffLabel)diffLabel.textContent=curDiff.name;if(themeLabel)themeLabel.textContent=curTheme.name}

function applyTheme(){
  var t=curTheme;document.body.style.background=t.bg;canvas.style.background=t.canvasBg;canvas.style.borderColor=t.border;
  canvas.style.boxShadow='0 0 50px rgba('+t.glow+',.03),inset 0 0 80px rgba(0,0,0,.35)';
  var r=document.querySelector(':root');r.style.setProperty('--accent',t.accent);r.style.setProperty('--accent2',t.accent2);r.style.setProperty('--accent3',t.accent3);r.style.setProperty('--accent-50',t.accent+'80');r.style.setProperty('--accent-30',t.accent+'4d');
  var before=document.querySelector('style#theme-grad');if(!before){before=document.createElement('style');before.id='theme-grad';document.head.appendChild(before)}
  before.textContent='body::before{background:radial-gradient(ellipse at 50% 50%,rgba('+t.glow+',.025) 0%,transparent 65%)!important}';
  var s1=document.querySelector('.snake-icon .s1'),s2=document.querySelector('.snake-icon .s2'),s3=document.querySelector('.snake-icon .s3');
  if(s1)s1.style.background=t.accent;if(s2)s2.style.background=t.accent2;if(s3)s3.style.background=t.accent3;
  renderLB();
}

function snakeColor(ti,isBoost){
  var f=1/(1+Math.exp((ti-0.2)*8));
  if(isBoost)f=Math.min(1,f+.35);
  var h=curTheme.snakeH,tl=curTheme.snakeT;
  return'rgb('+(tl[0]+f*(h[0]-tl[0])|0)+','+(tl[1]+f*(h[1]-tl[1])|0)+','+(tl[2]+f*(h[2]-tl[2])|0)+')';
}

function init(){
  speed=curDiff.baseSpeed;minSpeed=curDiff.minSpeed;accel=curDiff.accel;specialEvery=curDiff.specialEvery;
  snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir={x:1,y:0};nextDir={x:1,y:0};
  score=0;foodEaten=0;specialFood=null;foodHidden=false;paused=gameOver=false;boosting=false;lastStepTime=0;
  particles=[];scorePopups=[];eatGlow=shakeFrames=foodRipple=foodPop=0;boostKeyHeld=false;boostStart=0;
  best=parseInt(localStorage.getItem('snake-best')||'0');updateBestDisplay(best);scoreEl.textContent='0';
  gameOverEl.classList.add('hidden');pauseOverlay.classList.add('hidden');
  newBestEl.classList.add('hidden');pauseBtn.classList.remove('active');
  applyTheme();updateLabels();if(wrapToggle)wrapToggle.classList.toggle('active',wrapMode);spawnFood();draw();
}

function spawnFood(){var o=new Set(snake.map(function(s){return s.x+','+s.y})),f=[];for(var x=0;x<COLS;x++)for(var y=0;y<ROWS;y++)if(!o.has(x+','+y))f.push({x:x,y:y});food=f[Math.random()*f.length|0];foodRipple=0;foodPop=0;foodHidden=false;specialFood=null}

function trySpawnSpecial(){
  if(foodEaten>0&&foodEaten%specialEvery===0&&!specialFood){var o=new Set(snake.map(function(s){return s.x+','+s.y}));o.add(food.x+','+food.y);var f=[];for(var x=0;x<COLS;x++)for(var y=0;y<ROWS;y++)if(!o.has(x+','+y))f.push({x:x,y:y});if(f.length>0){specialFood={x:f[Math.random()*f.length|0].x,y:f[Math.random()*f.length|0].y,life:180};foodHidden=true}}
}

function draw(){
var t=curTheme,bst=boosting;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=t.gridDot;
for(var x=0;x<=COLS;x++)for(var y=0;y<=ROWS;y++)ctx.fillRect(x*CELL-.5,y*CELL-.5,1,1);
if(eatGlow>0){var a=eatGlow/18*.07,g=ctx.createRadialGradient(eatGlowX,eatGlowY,CELL*.5,eatGlowX,eatGlowY,CELL*5);g.addColorStop(0,'rgba('+t.glow+','+a+')');g.addColorStop(1,'rgba('+t.glow+',0)');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);eatGlow--}
particles=particles.filter(function(p){return p.life>0});particles.forEach(function(p){ctx.globalAlpha=p.life/15;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();p.x+=p.vx;p.y+=p.vy;p.life--;p.size*=.94});
scorePopups=scorePopups.filter(function(p){return p.life>0});scorePopups.forEach(function(p){ctx.globalAlpha=p.life/20;ctx.fillStyle=t.popup;ctx.font='600 14px system-ui';ctx.textAlign='center';ctx.fillText(p.text,p.x,p.y);p.y-=1.2;p.life--});
ctx.globalAlpha=1;
if(!foodHidden){var pulse=1+Math.sin(Date.now()/200)*.15,fx=food.x*CELL+CELL/2,fy=food.y*CELL+CELL/2,fr=(CELL/2-3)*pulse;if(foodPop>0){var ps=1+foodPop/8*.5;foodPop--;fr*=ps;fx=foodPopX;fy=foodPopY}foodRipple+=.08;var ra=.12*(1-foodRipple%1);ctx.beginPath();ctx.arc(fx,fy,CELL*(1+foodRipple%1),0,Math.PI*2);ctx.strokeStyle='rgba(239,68,68,'+ra+')';ctx.lineWidth=1;ctx.stroke();ctx.shadowColor='#ef4444';ctx.shadowBlur=14*pulse;ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(fx,fy,fr,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fca5a5';ctx.shadowBlur=0;ctx.beginPath();ctx.arc(fx-fr*.25,fy-fr*.25,fr*.35,0,Math.PI*2);ctx.fill()}
if(specialFood&&specialFood.life>0){specialFood.life--;var sp=1+Math.sin(Date.now()/150)*.2,sfx=specialFood.x*CELL+CELL/2,sfy=specialFood.y*CELL+CELL/2,sfr=(CELL/2-2)*sp;ctx.shadowColor='#fbbf24';ctx.shadowBlur=18*sp;ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(sfx,sfy,sfr,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fef08a';ctx.shadowBlur=0;ctx.beginPath();ctx.arc(sfx-sfr*.25,sfy-sfr*.25,sfr*.3,0,Math.PI*2);ctx.fill();if(specialFood.life<=0){specialFood=null;foodHidden=false}}
snake.forEach(function(s,i){var cx=s.x*CELL+CELL/2,cy=s.y*CELL+CELL/2,sz=CELL/2-(i===0?1.5:2+i/snake.length*1.5);
if(bst){ctx.shadowColor=curTheme.accent;ctx.shadowBlur=6}
if(i<snake.length-1){var nx=snake[i+1].x*CELL+CELL/2,ny=snake[i+1].y*CELL+CELL/2;ctx.strokeStyle=snakeColor((i+.5)/snake.length,bst).replace('rgb','rgba').replace(')',',.3)');ctx.lineWidth=sz*.8;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(nx,ny);ctx.stroke()}
ctx.beginPath();ctx.arc(cx+.5,cy+.5,sz,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fill();
ctx.fillStyle=snakeColor(i/snake.length,bst);ctx.beginPath();ctx.arc(cx,cy,sz,0,Math.PI*2);ctx.fill();
if(i===0){var dx=dir.x,dy=dir.y,ex=cx+dx*6,ey=cy+dy*6;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex-dy*3,ey-dx*3,3.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+dy*3,ey+dx*3,3.2,0,Math.PI*2);ctx.fill();ctx.fillStyle=t.bg;ctx.beginPath();ctx.arc(ex-dy*3+dx*1.5,ey-dx*3+dy*1.5,1.6,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+dy*3+dx*1.5,ey+dx*3+dy*1.5,1.6,0,Math.PI*2);ctx.fill()}});
ctx.shadowBlur=0;
if(!started){ctx.fillStyle='rgba(11,14,22,.7)';ctx.fillRect(0,0,canvas.width,canvas.height)}
}

function resolveFoodCollision(head){
  if(!foodHidden&&head.x===food.x&&head.y===food.y){foodEaten++;score++;scoreEl.textContent=score;eatGlow=18;eatGlowX=food.x*CELL+CELL/2;eatGlowY=food.y*CELL+CELL/2;spawnParticles(food.x*CELL+CELL/2,food.y*CELL+CELL/2);scorePopups.push({x:food.x*CELL+CELL/2,y:food.y*CELL-2,text:'+1',life:20});scorePanel.classList.add('scored');setTimeout(function(){scorePanel.classList.remove('scored')},220);foodPop=8;foodPopX=food.x*CELL+CELL/2;foodPopY=food.y*CELL+CELL/2;window.Sfx.eat();spawnFood();trySpawnSpecial();if(speed>minSpeed)speed-=accel;return true}
  if(specialFood&&head.x===specialFood.x&&head.y===specialFood.y){score+=3;scoreEl.textContent=score;eatGlow=20;eatGlowX=specialFood.x*CELL+CELL/2;eatGlowY=specialFood.y*CELL+CELL/2;spawnParticles(specialFood.x*CELL+CELL/2,specialFood.y*CELL+CELL/2);spawnParticles(specialFood.x*CELL+CELL/2,specialFood.y*CELL+CELL/2);scorePopups.push({x:specialFood.x*CELL+CELL/2,y:specialFood.y*CELL-2,text:'+3',life:25});scorePanel.classList.add('scored');setTimeout(function(){scorePanel.classList.remove('scored')},220);specialFood=null;foodHidden=false;spawnFood();window.Sfx.record();if(speed<curDiff.baseSpeed+40)speed+=10;return true}
  return false;
}

function step(){
  if(paused||gameOver||!started)return;
  var now=Date.now(),minGap=(boosting?Math.max(speed-40,40):speed)-5;
  if(now-lastStepTime<minGap){timer=setTimeout(step,minGap-(now-lastStepTime)+1);return}
  lastStepTime=now;
  dir={x:nextDir.x,y:nextDir.y};var head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(wrapMode){
    if(head.x<0)head.x=COLS-1;else if(head.x>=COLS)head.x=0;
    if(head.y<0)head.y=ROWS-1;else if(head.y>=ROWS)head.y=0;
  }
  if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||snake.some(function(s){return s.x===head.x&&s.y===head.y})){shakeFrames=10;draw();window.Sfx.death();return endGame()}
  snake.unshift(head);
  if(!resolveFoodCollision(head))snake.pop();
  if(shakeFrames>0){var sx=(Math.random()-.5)*shakeFrames*1.4,sy=(Math.random()-.5)*shakeFrames*1.4;canvas.style.transform='translate('+sx+'px,'+sy+'px)';shakeFrames--;if(shakeFrames===0)canvas.style.transform=''}
  draw();
  timer=setTimeout(step,boosting?Math.max(speed-40,40):speed);
}

function spawnParticles(x,y){var t=curTheme;for(var i=0;i<14;i++){var a=Math.random()*Math.PI*2,s=2+Math.random()*3;particles.push({x:x,y:y,size:s,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:8+Math.random()*8,color:'hsl('+(t.particleH+Math.random()*25)+',90%,'+(55+Math.random()*22)+'%)'})}}

function endGame(){gameOver=true;started=false;clearTimeout(timer);finalScoreEl.textContent=score;if(finalLenEl)finalLenEl.textContent='蛇身长度: '+snake.length+' 段';spawnDeathParticles();pauseBtn.classList.add('hidden');boosting=false;boostKeyHeld=false;if(finalDiffEl)finalDiffEl.textContent='难度: '+curDiff.name;addLB(score,curDiff.name,curTheme.name);if(score>best){best=score;localStorage.setItem('snake-best',best);updateBestDisplay(best);newBestEl.classList.remove('hidden');window.Sfx.record()}else{newBestEl.classList.add('hidden');window.Sfx.death()}gameOverEl.classList.remove('hidden')}
function spawnDeathParticles(){var t=curTheme;snake.forEach(function(s){var x=s.x*CELL+CELL/2,y=s.y*CELL+CELL/2;for(var i=0;i<5;i++){var a=Math.random()*Math.PI*2,v=1+Math.random()*3.5;particles.push({x:x,y:y,size:2+Math.random()*3,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:12+Math.random()*12,color:t.deathP})}})}

function startGame(){window.Sfx.init();started=true;startMenu.classList.add('hidden');pauseBtn.classList.remove('hidden');if(lbPanel)lbPanel.classList.add('collapsed');init();window.Sfx.start();timer=setTimeout(step,speed)}
function backToMenu(){clearTimeout(timer);init();started=false;gameOverEl.classList.add('hidden');pauseOverlay.classList.add('hidden');pauseBtn.classList.add('hidden');if(lbPanel)lbPanel.classList.remove('collapsed');startMenu.classList.remove('hidden');renderLB();draw()}
function togglePause(){if(!started||gameOver)return;paused=!paused;if(paused){pauseOverlay.classList.remove('hidden');pauseBtn.classList.add('active');window.Sfx.pause()}else{pauseOverlay.classList.add('hidden');pauseBtn.classList.remove('active');window.Sfx.resume();timer=setTimeout(step,speed)}}

function updateBoost(){if(boostKeyHeld&&started&&!paused&&!gameOver&&Date.now()-boostStart>=BOOST_DELAY)boosting=true;else boosting=false}
function setBoost(on){if(on&&started&&!paused&&!gameOver){if(!boostKeyHeld){boostStart=Date.now();boostKeyHeld=true}}else{boostKeyHeld=false;boosting=false}updateBoost()}

// Mobile hint
if(isMobile&&desktopHint&&mobileHint){desktopHint.style.display='none';mobileHint.classList.add('show')}

init();draw();renderLB();updateLabels();
setInterval(function(){if(boostKeyHeld)updateBoost()},100);

// Wrap toggle
if(wrapToggle){if(wrapMode)wrapToggle.classList.add('active');wrapToggle.addEventListener('click',function(){wrapMode=!wrapMode;wrapToggle.classList.toggle('active',wrapMode);localStorage.setItem('snake-wrap',wrapMode?'on':'off')})}

var diffBtns=document.querySelectorAll('#diffRow .diff-btn');var adb=document.querySelector('#diffRow [data-diff="'+savedDiff+'"]');
if(adb){diffBtns.forEach(function(b){b.classList.remove('active')});adb.classList.add('active')}
diffBtns.forEach(function(b){b.addEventListener('click',function(){diffBtns.forEach(function(x){x.classList.remove('active')});b.classList.add('active');var d=b.getAttribute('data-diff');curDiff=difficulties[d];localStorage.setItem('snake-diff',d);init();draw();updateLabels()})});

var themeBtns=document.querySelectorAll('#themeRow .theme-dot');var atb=document.querySelector('#themeRow [data-theme="'+savedTheme+'"]');
if(atb){themeBtns.forEach(function(b){b.classList.remove('active')});atb.classList.add('active')}
themeBtns.forEach(function(b){b.addEventListener('click',function(){themeBtns.forEach(function(x){x.classList.remove('active')});b.classList.add('active');var th=b.getAttribute('data-theme');curTheme=themes[th];localStorage.setItem('snake-theme',th);applyTheme();draw();updateLabels()})});

pauseBtn.addEventListener('click',function(){togglePause()});
var soundToggle=document.getElementById('soundToggle');
soundToggle.addEventListener('click',function(){window.Sfx.init();var on=toggleSound();soundToggle.textContent=on?'sound':'quiet';soundToggle.classList.toggle('muted',!on)});

document.addEventListener('keydown',function(e){
if(!started){if(e.key==='Enter'||e.key===' '||e.code==='Space'){e.preventDefault();startGame()}return}
if(gameOver){if(e.key==='Enter'||e.key===' '||e.code==='Space'){e.preventDefault();startGame()}return}
if(e.key==='Escape'||e.key==='p'||e.key==='P'){e.preventDefault();togglePause();return}
if(e.key===' '||e.code==='Space'){e.preventDefault();togglePause();return}
var map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right',W:'up',A:'left',S:'down',D:'right'};
var d=map[e.key];if(!d)return;e.preventDefault();
var moves={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
var nd=moves[d];if(nd.x!==-dir.x||nd.y!==-dir.y)nextDir=nd;
if(paused&&d){paused=false;pauseOverlay.classList.add('hidden');pauseBtn.classList.remove('active');window.Sfx.resume();timer=setTimeout(step,speed)}
var dirKeys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'];
if(dirKeys.indexOf(e.key)>=0&&!e.repeat)setBoost(true);
});

document.addEventListener('keyup',function(e){var dk=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'];if(dk.indexOf(e.key)>=0)setBoost(false)});

document.getElementById('startBtn').addEventListener('click',startGame);
document.getElementById('restartBtn').addEventListener('click',startGame);
document.getElementById('menuBtn').addEventListener('click',function(){window.Sfx.start();backToMenu()});
document.getElementById('resumeBtn').addEventListener('click',function(){paused=false;pauseOverlay.classList.add('hidden');pauseBtn.classList.remove('active');window.Sfx.resume();timer=setTimeout(step,speed)});
document.getElementById('quitBtn').addEventListener('click',function(){window.Sfx.start();backToMenu()});

var touchStartX=0,touchStartY=0;
canvas.addEventListener('touchstart',function(e){e.preventDefault();var t=e.touches[0];touchStartX=t.clientX;touchStartY=t.clientY});
canvas.addEventListener('touchend',function(e){e.preventDefault();if(!started||gameOver){startGame();return}var t=e.changedTouches[0],dx=t.clientX-touchStartX,dy=t.clientY-touchStartY;if(Math.abs(dx)<10&&Math.abs(dy)<10)return;if(paused){paused=false;pauseOverlay.classList.add('hidden');pauseBtn.classList.remove('active');window.Sfx.resume();timer=setTimeout(step,speed);return}var nd=Math.abs(dx)>Math.abs(dy)?(dx>0?{x:1,y:0}:{x:-1,y:0}):(dy>0?{x:0,y:1}:{x:0,y:-1});if(nd.x!==-dir.x||nd.y!==-dir.y)nextDir=nd});

function resizeCanvas(){var w=window.innerWidth,h=window.innerHeight;var s=Math.min((w-20)/COLS,(h-160)/ROWS,CELL);canvas.style.width=(COLS*s)+'px';canvas.style.height=(ROWS*s)+'px'}
window.addEventListener('resize',resizeCanvas);resizeCanvas();
