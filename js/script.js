const $=id=>document.getElementById(id);
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---- Spam arrival alert demo ---- */
let spamCount=0;
const samples=[["Prize Desk","You have WON $5,000!!! Claim now"],["Bank Alert","Your account is locked – verify password"],["Offers Team","Limited time: 90% off, act now"]];
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),4500)}
$('sim').onclick=()=>{
  const [from,subj]=samples[spamCount%samples.length];spamCount++;
  const d=document.createElement('div');d.className='mail spam';
  d.innerHTML='<b>'+esc(from)+'</b> <small>Moved to Spam: '+esc(subj)+'</small>';
  $('spamlist').prepend(d);
  const b=$('badge');b.textContent=spamCount;b.classList.remove('zero');
  toast('New message in Spam from '+from+': "'+subj+'"');
  document.title='('+spamCount+') InboxPilot';
  try{if('Notification' in window){if(Notification.permission==='granted')new Notification('Message in Spam',{body:from+': '+subj});else if(Notification.permission==='default')Notification.requestPermission()}}catch(e){}
};

/* ---- Spam checker ---- */
const rules=[
 [/\b(urgent|immediately|act now|final notice|last chance|expires? (today|soon)|within 24 hours)\b/i,20,'Creates false urgency'],
 [/\b(won|winner|lottery|prize|jackpot|free gift|congratulations)\b/i,20,'Promises prizes or free rewards'],
 [/\b(password|otp|pin|cvv|social security|bank details|verify your account|account (is )?(locked|suspended))\b/i,30,'Asks for sensitive information or threatens your account'],
 [/(bit\.ly|tinyurl|goo\.gl|t\.co\/|\.xyz|\.top|\.click|\.ru\b)/i,20,'Contains a shortened or suspicious link'],
 [/\b(wire transfer|bitcoin|crypto|gift card|western union|inheritance|million dollars?)\b/i,25,'Mentions risky payment methods or large sums'],
 [/\b(viagra|cialis|weight loss|miracle|guaranteed (income|returns?)|make money fast|work from home)\b/i,20,'Uses classic spam sales phrases'],
 [/\b(dear (customer|user|friend|sir\/madam)|valued member)\b/i,10,'Uses a generic greeting instead of your name'],
 [/\b(click (here|below)|unsubscribe now|claim (now|your))\b/i,10,'Pushes you to click immediately']
];
function spamCheck(t){
 let s=0,why=[];
 rules.forEach(([r,p,m])=>{if(r.test(t)){s+=p;why.push(m)}});
 const letters=t.replace(/[^A-Za-z]/g,'');
 if(letters.length>20&&(t.replace(/[^A-Z]/g,'').length/letters.length)>.4){s+=15;why.push('Too much ALL CAPS')}
 if((t.match(/!/g)||[]).length>=3){s+=10;why.push('Excessive exclamation marks')}
 if((t.match(/https?:\/\//g)||[]).length>=3){s+=10;why.push('Many links in one message')}
 if(/\$\s?\d{3,}|\d{3,}\s?(usd|dollars)/i.test(t)){s+=10;why.push('Highlights large money amounts')}
 return {score:Math.min(100,s),why};
}
$('spamGo').onclick=()=>{
 const t=$('spamIn').value.trim(),o=$('spamRes');
 if(!t){o.innerHTML='<div class="verdict v-mid">Paste a message first, then select Check message.</div>';return}
 const {score,why}=spamCheck(t);
 const k=score>=50?['v-bad','Likely spam – do not click links or reply']:score>=25?['v-mid','Suspicious – verify the sender before acting']:['v-ok','Looks safe – no major spam signs found'];
 o.innerHTML='<div class="verdict '+k[0]+'">'+k[1]+' (risk '+score+'/100)<div class="meter"><i style="width:'+score+'%"></i></div></div>'+
  (why.length?'<p><b>Warning signs found:</b></p><ul>'+why.map(w=>'<li>'+w+'</li>').join('')+'</ul>':'<p>No warning signs matched. Still check the sender address.</p>');
};
$('spamEx').onclick=()=>{$('spamIn').value='CONGRATULATIONS winner!!! You have won $50000. Click here immediately: http://bit.ly/claim-now and verify your password within 24 hours. Dear customer, act now!!!'};

/* ---- Writing coach ---- */
const phrase=[
 [/\bkindly do the needful\b/gi,'please let me know what you need from me','Sounds unusual outside India. Be specific.'],
 [/\brevert back\b/gi,'reply','"Revert back" is unclear to many readers.'],
 [/\bprepone\b/gi,'move earlier','"Prepone" is rarely understood outside India.'],
 [/\bpls\b/gi,'please','Spell it out in client emails.'],
 [/\bgonna\b/gi,'going to','Too casual for business writing.'],
 [/\bwanna\b/gi,'want to','Too casual for business writing.'],
 [/\bASAP\b/g,'by [date]','Give a clear date instead of ASAP.'],
 [/\bas per my last mail\b/gi,'as I mentioned earlier','Can sound impatient.'],
 [/\bI am having a doubt\b/gi,'I have a question','More natural phrasing.'],
 [/\bdo the needful\b/gi,'take the next step','Be specific about the action.'],
 [/\bhope you are doing good\b/gi,'I hope you are doing well','"Well" is the correct form.'],
 [/\bmail me back\b/gi,'send me a reply','Clearer wording.'],
 [/\bat the earliest\b/gi,'as soon as you can','More natural phrasing.']
];
const uk2us=[['colour','color'],['organise','organize'],['organisation','organization'],['favourite','favorite'],['centre','center'],['programme','program'],['apologise','apologize'],['recognise','recognize'],['behaviour','behavior'],['analyse','analyze']];
function coach(t,region,tone){
 const out=[];
 phrase.forEach(([r,f,m])=>{const x=t.match(r);if(x)out.push({find:x[0],fix:f,why:m})});
 if(region==='us'){uk2us.forEach(([u,a])=>{const m=t.match(new RegExp('\\b'+u+'\\b','i'));if(m)out.push({find:m[0],fix:a,why:'US spelling for a US client'})})}
 else{uk2us.forEach(([u,a])=>{const m=t.match(new RegExp('\\b'+a+'\\b','i'));if(m)out.push({find:m[0],fix:u,why:'UK-style spelling for this client'})})}
 let m;
 if(m=t.match(/\b(\w+)\s+\1\b/i))out.push({find:m[0],fix:m[1],why:'Repeated word'});
 if(m=t.match(/\bi\b(?=\s)/))out.push({find:'i',fix:'I',why:'Capitalize "I"'});
 if(/ {2,}/.test(t))out.push({find:'  ',fix:' ',why:'Extra spaces between words'});
 if(m=t.match(/\b(your|their|its)\s+(going|welcome|not)\b/i))out.push({find:m[0],fix:m[1].replace(/your/i,'you\'re').replace(/their/i,'they\'re').replace(/its/i,'it\'s')+' '+m[2],why:'Check your/you\'re, their/they\'re, its/it\'s'});
 if(tone==='formal'&&(m=t.match(/^(hey|hi there|yo)\b/im)))out.push({find:m[0],fix:'Hello',why:'More formal greeting'});
 if(tone==='formal'&&(m=t.match(/\b(thanks|cheers)\s*[.!]?\s*$/i)))out.push({find:m[0],fix:'Kind regards',why:'More formal closing'});
 if(tone==='friendly'&&(m=t.match(/\bDear Sir\/?Madam\b/i)))out.push({find:m[0],fix:'Hello [Name]',why:'Use the client\'s name for a warmer tone'});
 const tips=[];
 t.split(/(?<=[.!?])\s+/).forEach(s=>{if(s.split(/\s+/).length>28)tips.push('Split this long sentence: "'+esc(s.slice(0,60))+'…"')});
 if(!/^(hi|hello|dear|hey|good (morning|afternoon|evening))/i.test(t.trim()))tips.push('Start with a greeting such as "Hello [Name],".');
 if(!/(regards|thanks|thank you|sincerely|best|cheers)[^\n]*$/i.test(t.trim()))tips.push('End with a closing such as "Kind regards," and your name.');
 if(!/\?|please|could you|can you|would you/i.test(t))tips.push('State clearly what you need from the client, such as a reply or a date.');
 if(region==='uk'||region==='au')tips.push('Use "I would be grateful if…" or "Could you please…" for a polite request.');
 if(region==='us')tips.push('US readers prefer direct, short sentences with a clear next step.');
 return {out,tips};
}
$('mailGo').onclick=()=>{
 const t=$('mailIn').value,o=$('mailRes');
 if(!t.trim()){o.innerHTML='<div class="verdict v-mid">Write your email first, then select Get suggestions.</div>';return}
 const {out,tips}=coach(t,$('region').value,$('tone').value);
 window._fixes=out;
 let h='';
 if(out.length){h+='<p><b>Fixes ('+out.length+')</b></p>'+out.map((s,i)=>'<div class="sug"><div><b>'+esc(s.find)+'</b> → '+esc(s.fix)+'<em>'+esc(s.why)+'</em></div><button class="btn ghost" data-i="'+i+'">Apply</button></div>').join('')}
 else h+='<div class="verdict v-ok">No grammar or wording problems found.</div>';
 if(tips.length)h+='<p><b>Ways to make it better</b></p><ul>'+tips.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
 o.innerHTML=h;
};
$('mailRes').addEventListener('click',e=>{
 const i=e.target.dataset&&e.target.dataset.i;if(i===undefined)return;
 const s=window._fixes[+i],ta=$('mailIn');
 ta.value=s.find==='i'?ta.value.replace(/\bi\b(?=\s)/g,'I'):ta.value.replace(s.find,s.fix);
 e.target.closest('.sug').remove();
});
$('mailEx').onclick=()=>{$('mailIn').value='hey Mr. John,\n\ni am having a doubt about the colour  of the logo. Pls revert back asap, we are gonna finish the the design soon.\n\nthanks'};

/* motion helpers */
$('sim').addEventListener('click',()=>{const b=$('badge');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')});
document.querySelectorAll('section').forEach(e=>e.classList.add('rv'));
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.15});
document.querySelectorAll('.rv').forEach(e=>io.observe(e));
setTimeout(()=>{if(!spamCount)$('sim').click()},2200);

/* starfield */
(()=>{const c=$('sky'),x=c.getContext('2d');let W,H,st=[],sh=null;
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
function size(){W=c.width=innerWidth;H=c.height=innerHeight;st=Array.from({length:Math.min(220,W*H/6500|0)},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.3,p:Math.random()*6.28,s:Math.random()*.02+.005,d:Math.random()*.15+.03}))}
function draw(){x.clearRect(0,0,W,H);
 st.forEach(a=>{a.p+=a.s;if(!calm)a.y=(a.y+a.d*.3)%H;const o=.4+.6*Math.abs(Math.sin(a.p));x.globalAlpha=o;x.fillStyle=a.r>1.2?'#ffe9b0':'#fff';x.beginPath();x.arc(a.x,a.y,a.r,0,6.28);x.fill()});
 if(!calm){if(!sh&&Math.random()<.004)sh={x:Math.random()*W*.8+W*.2,y:Math.random()*H*.4,l:0};
  if(sh){sh.x-=9;sh.y+=4.5;sh.l++;const g=x.createLinearGradient(sh.x,sh.y,sh.x+70,sh.y-35);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');x.globalAlpha=1;x.strokeStyle=g;x.lineWidth=2;x.beginPath();x.moveTo(sh.x,sh.y);x.lineTo(sh.x+70,sh.y-35);x.stroke();if(sh.l>60)sh=null}
  requestAnimationFrame(draw)}}
size();addEventListener('resize',size);draw()})();