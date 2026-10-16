(() => {
  'use strict';
  if (document.getElementById('jigg-messenger')) return;
  const style = document.createElement('style');
  style.textContent = `
    #jigg-messenger { position:fixed; right:max(20px,env(safe-area-inset-right)); bottom:max(20px,env(safe-area-inset-bottom)); z-index:9990; display:flex; align-items:center; gap:11px; padding:8px 18px 8px 8px; border:1px solid #ffffffb0; border-radius:999px; background:#fff; color:#1c1c1c; box-shadow:0 6px 28px #0866ff40,0 3px 12px #0002; font:600 14px/1.25 Arial,sans-serif; text-decoration:none; isolation:isolate; transform-origin:85% 85%; animation:jiggMessengerLaunch 1.1s cubic-bezier(.16,1,.3,1) both; }
    #jigg-messenger::before,#jigg-messenger::after { content:""; position:absolute; inset:-5px; border:2px solid #5199ff; border-radius:inherit; pointer-events:none; z-index:-1; animation:jiggMessengerRipple 4.8s ease-out 1.2s infinite; }
    #jigg-messenger::after { border-color:#b56cff; animation-delay:1.8s; }
    #jigg-messenger:focus-visible { outline:3px solid #ffb900; outline-offset:8px; }
    #jigg-messenger .jigg-messenger-icon { display:grid; place-items:center; position:relative; width:44px; height:44px; flex-shrink:0; border-radius:50%; background:linear-gradient(140deg,#0866ff 20%,#7457ff 75%,#c74cdb); box-shadow:0 4px 12px #0866ff45; animation:jiggMessengerFloat 4s ease-in-out 1.1s infinite; }
    #jigg-messenger svg { display:block; width:28px; height:28px; fill:#fff; animation:jiggMessengerWiggle 7s ease-in-out 2s infinite; }
    #jigg-messenger .jigg-messenger-label { position:relative; }
    #jigg-messenger .jigg-messenger-sparks { position:absolute; inset:0; pointer-events:none; border-radius:inherit; }
    #jigg-messenger .jigg-messenger-sparks i { position:absolute; left:20%; top:50%; width:6px; height:6px; border-radius:2px; background:var(--spark-color); opacity:0; transform:translate(-50%,-50%); }
    #jigg-messenger:hover .jigg-messenger-icon,#jigg-messenger:focus-visible .jigg-messenger-icon { animation:jiggMessengerFlip .85s cubic-bezier(.2,.7,.3,1) both; }
    #jigg-messenger:hover .jigg-messenger-sparks i,#jigg-messenger:focus-visible .jigg-messenger-sparks i,#jigg-messenger.is-party .jigg-messenger-sparks i { animation:jiggMessengerConfetti .9s ease-out var(--spark-delay) both; }
    #jigg-messenger:hover::before,#jigg-messenger:focus-visible::before { border-color:#ffb900; }
    #jigg-messenger:active { scale:.94; }
    body:has(#codexChatBubbleModal.is-open) #jigg-messenger { visibility:hidden; }
    @keyframes jiggMessengerLaunch { 0% { opacity:0; transform:perspective(500px) translateY(90px) rotateZ(-24deg) rotateY(70deg) scale(.3); } 55% { opacity:1; transform:perspective(500px) translateY(-14px) rotateZ(7deg) rotateY(-18deg) scale(1.08); } 78% { transform:translateY(5px) rotateZ(-3deg) scale(.97); } 100% { opacity:1; transform:translateY(0) rotateZ(0) scale(1); } }
    @keyframes jiggMessengerFloat { 0%,100% { transform:translateY(0) rotate(-5deg); } 50% { transform:translateY(-4px) rotate(6deg); } }
    @keyframes jiggMessengerWiggle { 0%,70%,100% { transform:rotate(0) scale(1); } 75% { transform:rotate(-16deg) scale(1.12); } 80% { transform:rotate(16deg) scale(1.12); } 85% { transform:rotate(-9deg); } 90% { transform:rotate(7deg); } }
    @keyframes jiggMessengerRipple { 0% { opacity:0; transform:scale(.96); } 12% { opacity:.5; } 50%,100% { opacity:0; transform:scale(1.28,1.6); } }
    @keyframes jiggMessengerFlip { 0% { transform:perspective(220px) rotateY(0) scale(1); } 45% { transform:perspective(220px) rotateY(190deg) translateY(-8px) scale(1.15); } 100% { transform:perspective(220px) rotateY(360deg) scale(1.08); } }
    @keyframes jiggMessengerConfetti { 0% { opacity:0; transform:translate(-50%,-50%) scale(0); } 12% { opacity:1; } 100% { opacity:0; transform:translate(var(--spark-x),var(--spark-y)) rotate(240deg) scale(.4); } }
    @media(max-width:767px) {
      #jigg-messenger { right:max(16px,env(safe-area-inset-right)); bottom:max(16px,env(safe-area-inset-bottom)); padding:0; border:2px solid #fff; }
      #jigg-messenger .jigg-messenger-icon { width:52px; height:52px; }
      #jigg-messenger .jigg-messenger-label { display:none; }
      #jigg-messenger .jigg-messenger-sparks i { left:50%; }
    }
    @media(prefers-reduced-motion:reduce) { #jigg-messenger,#jigg-messenger *,#jigg-messenger::before,#jigg-messenger::after { animation:none !important; transition:none !important; transform:none !important; } #jigg-messenger::before,#jigg-messenger::after,#jigg-messenger .jigg-messenger-sparks { display:none; } #jigg-messenger:active { scale:1; } }
  `;
  document.head.appendChild(style);
  const link = document.createElement('a');
  link.id = 'jigg-messenger';
  link.href = 'https://m.me/Bagigz';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'Chat with Jigg on Messenger (opens in a new tab)');
  link.title = 'Chat with Jigg on Messenger';
  link.innerHTML = '<span class="jigg-messenger-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3C8.82 3 3 8.38 3 15c0 3.77 1.89 7.13 4.83 9.33V29l4.44-2.44c1.19.31 2.44.47 3.73.47 7.18 0 13-5.38 13-12S23.18 3 16 3Zm1.29 16.16-3.31-3.53-6.46 3.53 7.1-7.54 3.39 3.54 6.38-3.54-7.1 7.54Z"/></svg></span><span class="jigg-messenger-label">Chat on Messenger</span>';
  const sparks = document.createElement('span');
  sparks.className = 'jigg-messenger-sparks';
  sparks.setAttribute('aria-hidden', 'true');
  const particles = [[-45,-65,'#ffb900'],[10,-85,'#0866ff'],[65,-65,'#b56cff'],[-60,-15,'#b56cff'],[75,-15,'#ffb900'],[-30,35,'#0866ff'],[45,35,'#b56cff']];
  particles.forEach(([x,y,color], index) => {
    const spark = document.createElement('i');
    spark.style.cssText = '--spark-x:'+x+'px;--spark-y:'+y+'px;--spark-color:'+color+';--spark-delay:'+(index*24)+'ms';
    sparks.appendChild(spark);
  });
  link.appendChild(sparks);
  link.addEventListener('pointerdown', () => {
    link.classList.add('is-party');
    window.setTimeout(() => link.classList.remove('is-party'), 1200);
  });
  document.body.appendChild(link);
})();
