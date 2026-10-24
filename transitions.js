/* Random section transitions + theme shift + hero shrink. */
(function(){
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var secs=[].slice.call(document.querySelectorAll('section')),CH='.:+*#%@01';
var tints=['#F6F7F5','#FFE3EF','#EFE4FF','#E7ECFF'],last='',fx=['ascii','curtain','iris','slide'];
secs.forEach(function(s){s.classList.add('tr-pre')});
function scramble(root){
  [].slice.call(root.querySelectorAll('h2,h3,p,dt,dd,small,li a,a.go,a.more,a.big')).filter(function(e){return !e.children.length&&e.textContent.trim()}).forEach(function(e){
    var txt=e.textContent,n=txt.length,t0=performance.now(),dur=700+Math.random()*500;
    (function f(now){
      var p=Math.min(1,(now-t0)/dur),k=Math.floor(p*n),o=txt.slice(0,k);
      for(var i=k;i<n;i++)o+=txt[i]===' '?' ':CH[Math.floor(Math.random()*CH.length)];
      e.textContent=o;if(p<1)requestAnimationFrame(f);else e.textContent=txt;
    })(t0);
  });
}
var io=new IntersectionObserver(function(es){es.forEach(function(en){
  if(!en.isIntersecting)return;
  var s=en.target,f=fx[Math.floor(Math.random()*fx.length)];io.unobserve(s);s.classList.remove('tr-pre');
  if(f==='ascii')scramble(s);
  else if(f==='curtain'){s.classList.add('tr-curtain');var c=document.createElement('div');c.className='curtain';s.appendChild(c);setTimeout(function(){c.remove();s.classList.remove('tr-curtain')},1300)}
  else if(f==='iris'){s.style.setProperty('--cx',Math.floor(Math.random()*100)+'%');s.classList.add('tr-iris')}
  else{s.style.setProperty('--dx',(Math.random()<.5?-1:1)*70+'px');s.classList.add('tr-slide')}
})},{threshold:.15});
secs.forEach(function(s){io.observe(s)});
var hero=document.querySelector('.hero'),io2=new IntersectionObserver(function(es){es.forEach(function(en){
  if(!en.isIntersecting)return;var c=tints[0];
  if(!en.target.classList.contains('hero'))do{c=tints[Math.floor(Math.random()*tints.length)]}while(c===last);
  last=c;document.body.style.backgroundColor=c;
})},{threshold:.5});
secs.concat(hero?[hero]:[]).forEach(function(s){io2.observe(s)});
var txt=hero&&hero.firstElementChild,art=document.getElementById('art'),tick=false;
function onS(){tick=false;var p=Math.min(1,Math.max(0,scrollY/(innerHeight*.7)));
  if(txt){txt.style.transform='translateY('+(-p*50)+'px)';txt.style.opacity=1-p*.8}
  if(art){art.style.transform='translateY('+(p*40)+'px) scale('+(1-p*.3)+')';art.style.opacity=1-p*.6}}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(onS)}},{passive:true});
})();
