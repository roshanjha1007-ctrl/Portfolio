/* ASCII portrait: hover to trigger a random reveal effect, click for another. */
(function(){
var art=document.getElementById('art'),cv=document.getElementById('cv'),hint=document.getElementById('hint');
var ctx=cv.getContext('2d'),img=new Image(),RAMP=' .,:;-=+*#%@',KANJI='一中間霧光夢火水風雷龍';
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var COLS=64,W,H,cw,ch,rows,lum=[],delay=[],dpr=Math.min(devicePixelRatio||1,2);
var px=0,py=0,inside=false,t0=0,mt=0,trail=[],cur=-1,R=100;
function fail(){art.classList.add('fallback');hint.style.display='none'}
function hash(a,b){var h=Math.sin(a*127.1+b*311.7)*43758.5453;return h-Math.floor(h)}
function dist(x,y){return Math.hypot((x-px)*cw,(y-py)*ch)}
var modes=[
{n:'Spotlight',f:function(x,y){return dist(x,y)<R?1:0}},
{n:'Ripple',f:function(x,y,t){var d=dist(x,y),p=t*240-d;return p>=0&&d<R*2.4&&p%80<26?1:0}},
{n:'Scanner',f:function(x,y){var d=Math.abs(y-py)*ch;return d<22?1:d<36?'=':0}},
{n:'Code rain',f:function(x,y,t){if(Math.abs(x-px)*cw>R)return 0;var h=(t*(8+hash(x,1)*14)+hash(x,2)*rows)%(rows+16),d=h-y;return d>=0&&d<14?(hash(x,y+Math.floor(t*10))<.5?'0':'1'):0}},
{n:'Mosaic',f:function(x,y,t){var bx=Math.floor(x/5),by=Math.floor(y/3);return Math.hypot((bx*5+2.5-px)*cw,(by*3+1.5-py)*ch)<R*1.1&&hash(bx,by+Math.floor(t*6))>.25?1:0}},
{n:'Glitch',f:function(x,y,t){if(dist(x,y)>R*1.15)return 0;var s=Math.floor(t*14),r=hash(y,s);return r<.45?1:r<.75?'#%@&$'[(x+y+s)%5]:0}},
{n:'Kanji',f:function(x,y,t,i){return dist(x,y)<R*1.2&&lum[i]>.12?KANJI[(x*7+y*3+Math.floor(t*8))%KANJI.length]:0}},
{n:'Binary',f:function(x,y,t,i){return dist(x,y)<R*1.3&&lum[i]>.12?(hash(x,y+Math.floor(t*8))<.5?'0':'1'):0}},
{n:'Brush',f:function(x,y,t,i,now){for(var k=0;k<trail.length;k++){var a=(now-trail[k].t)/1400;if(a<1&&Math.hypot((x-trail[k].x)*cw,(y-trail[k].y)*ch)<R*.5*(1-a)+8)return 1}return 0}}
];
function pick(now){var n;do{n=Math.floor(Math.random()*modes.length)}while(n===cur);cur=n;mt=now;trail=[];hint.textContent=modes[n].n+' effect. Click for another.'}
function size(){
  var r=art.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;
  cw=W/COLS;ch=cw*1.75;rows=Math.ceil(H/ch);R=Math.min(W,H)*.2;
  var o=document.createElement('canvas');o.width=COLS;o.height=rows;
  var oc=o.getContext('2d');oc.drawImage(img,0,0,COLS,rows);
  var d=oc.getImageData(0,0,COLS,rows).data;lum=[];delay=[];
  for(var i=0;i<COLS*rows;i++){
    var l=(0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2])/255;
    lum.push(Math.min(1,Math.max(0,(1-l)*1.25)));delay.push(Math.random()*900);
  }
}
function draw(now){
  var el=reduce?9999:now-t0,t=reduce?.5:(now-mt)/1000,m=inside&&cur>=0?modes[cur]:null,pc=[];
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#FF9FC8';ctx.fillRect(0,0,W,H);
  ctx.font=(ch*.9)+'px "Courier New",monospace';ctx.textBaseline='top';
  for(var y=0;y<rows;y++)for(var x=0;x<COLS;x++){
    var i=y*COLS+x,l=lum[i],st=m?m.f(x,y,t,i,now):0,c,k;
    if(st===1){pc.push(x*cw,y*ch);continue}
    if(typeof st==='string'){c=st;ctx.fillStyle='#6D28D9'}
    else{
      if(el<delay[i]+400)k=Math.floor(Math.random()*RAMP.length);
      else{k=Math.round(l*(RAMP.length-1));if(!reduce&&Math.random()<.04)k=Math.max(0,Math.min(RAMP.length-1,k+(Math.random()<.5?-1:1)))}
      c=RAMP[k];if(c===' ')continue;
      ctx.fillStyle=l>.62?'#3B0764':'#6D28D9';
    }
    ctx.fillText(c,x*cw,y*ch);
  }
  if(pc.length){ctx.save();ctx.beginPath();for(var j=0;j<pc.length;j+=2)ctx.rect(pc[j],pc[j+1],cw+.5,ch+.5);ctx.clip();ctx.drawImage(img,0,0,W,H);ctx.restore()}
  if(!reduce)requestAnimationFrame(draw);
}
function at(e){var r=art.getBoundingClientRect();px=(e.clientX-r.left)/cw;py=(e.clientY-r.top)/ch}
img.onload=function(){
  try{size();ctx.getImageData(0,0,1,1)}catch(e){return fail()}
  hint.textContent='Hover over the portrait. Every time, a new effect.';
  t0=performance.now();
  art.addEventListener('pointerenter',function(e){inside=true;at(e);pick(performance.now());if(reduce)draw(performance.now())});
  art.addEventListener('pointermove',function(e){at(e);trail.push({x:px,y:py,t:performance.now()});if(trail.length>40)trail.shift();if(reduce)draw(performance.now())});
  art.addEventListener('pointerleave',function(){inside=false;if(reduce)draw(performance.now())});
  art.addEventListener('pointerdown',function(e){at(e);inside=true;pick(performance.now())});
  addEventListener('resize',function(){size();if(reduce)draw(performance.now())});
  requestAnimationFrame(draw);
};
img.onerror=fail;img.src='photo.jpg';
})();
