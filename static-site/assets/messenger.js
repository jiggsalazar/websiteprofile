(() => {
  'use strict';
  if (document.getElementById('jigg-messenger')) return;
  const style = document.createElement('style');
  style.textContent = `
    #jigg-messenger { position:fixed; right:max(20px,env(safe-area-inset-right)); bottom:max(20px,env(safe-area-inset-bottom)); z-index:9990; display:flex; align-items:center; gap:11px; padding:8px 18px 8px 8px; border:1px solid #ffffff70; border-radius:999px; background:#fff; color:#1c1c1c; box-shadow:0 6px 28px #0003; font:600 14px/1.25 Arial,sans-serif; text-decoration:none; transition:transform .2s ease,box-shadow .2s ease; animation:jiggMessengerEnter .45s ease both; }
    #jigg-messenger:hover { transform:translateY(-3px); box-shadow:0 10px 30px #0004; }
    #jigg-messenger:focus-visible { outline:3px solid #ffb900; outline-offset:5px; }
    #jigg-messenger .jigg-messenger-icon { display:grid; place-items:center; width:44px; height:44px; flex-shrink:0; border-radius:50%; background:#0866ff; }
    #jigg-messenger svg { display:block; width:28px; height:28px; fill:#fff; }
    body:has(#codexChatBubbleModal.is-open) #jigg-messenger { visibility:hidden; }
    @keyframes jiggMessengerEnter { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @media(max-width:767px) {
      #jigg-messenger { right:max(16px,env(safe-area-inset-right)); bottom:max(16px,env(safe-area-inset-bottom)); padding:0; border:2px solid #fff; }
      #jigg-messenger .jigg-messenger-icon { width:52px; height:52px; }
      #jigg-messenger .jigg-messenger-label { display:none; }
    }
    @media(prefers-reduced-motion:reduce) { #jigg-messenger { animation:none; transition:none; } #jigg-messenger:hover { transform:none; } }
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
  document.body.appendChild(link);
})();
