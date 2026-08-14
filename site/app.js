(() => {
  const C = window.MEMORIAL_CONFIG;
  const $ = (s, r=document) => r.querySelector(s);
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const api = async (action, params={}) => {
    const body = new URLSearchParams({action, ...params});
    const r = await fetch(C.apiUrl, {method:'POST', body});
    const data = await r.json();
    if (!data.ok) throw new Error(data.error || 'حدث خطأ');
    return data;
  };
  const publicApi = async () => {
    const r = await fetch(C.apiUrl + '?action=readPublic', {cache:'no-store'});
    return r.json();
  };

  function setText(sel, text) { const el=$(sel); if (el) el.textContent = text || ''; }
  function render(data) {
    const p = data.profile || {};
    document.title = `الشهيد صالح سالم الشعب | سيرة وذكريات من عرفوه`;
    setText('#profileName', p.name || 'صالح سالم الشعب');
    setText('#profileLocation', p.location || 'البيضاء - اليمن');
    setText('#tagline', p.tagline || 'سيرة رجل ترك أثرًا في قلوب من عرفوه');
    setText('#intro', p.intro || 'أرشيف شخصي لحفظ سيرته ومواقفه وذكريات من عرفوه.');
    setText('#bio', p.bio);
    setText('#story', p.story);
    setText('#departure', p.departure);
    setText('#sonLetter', p.sonLetter);
    const hero = $('#heroImage'); if (hero && p.hero_image) hero.src = p.hero_image;
    setText('#birth', p.birth); setText('#death', p.death); setText('#job', p.job); setText('#martyrdomDate', p.martyrdomDate); setText('#martyrdomPlace', p.martyrdomPlace);

    $('#timeline').innerHTML = (data.timeline||[]).map(x=>`<article class="timeline-item"><div class="dot"></div><div><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></div></article>`).join('') || empty('لم تُضف محطات بعد.');
    $('#achievements').innerHTML = (data.achievements||[]).map(x=>`<article class="card"><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p>${x.date?`<small>${esc(x.date)}</small>`:''}</article>`).join('') || empty('لم تُضف الأعمال والمواقف بعد.');
    $('#stories').innerHTML = (data.stories||[]).map(x=>`<article class="card"><h3>${esc(x.title)}</h3><p>${esc(x.content)}</p><div class="meta">${esc(x.author||'')} ${x.relation?`· ${esc(x.relation)}`:''} ${x.date?`· ${esc(x.date)}`:''}</div></article>`).join('') || empty('لم تُضف مواقف بعد.');
    $('#memories').innerHTML = (data.memories||[]).map(x=>`<article class="memory"><div class="quote-mark">“</div><h3>${esc(x.title || 'ذكرى')}</h3><p>${esc(x.story)}</p><div class="meta">${esc(x.name)}${x.relation?` · ${esc(x.relation)}`:''}</div></article>`).join('') || empty('لم تُنشر ذكريات بعد.');
    $('#quotes').innerHTML = (data.quotes||[]).map(x=>`<blockquote>“${esc(x.quote)}”</blockquote>`).join('') || empty('لم تُضف أقوال بعد.');
    $('#gallery').innerHTML = (data.gallery||[]).map(x=>`<figure><img src="${esc(x.image)}" alt="${esc(x.title||'صورة من حياة صالح سالم الشعب')}" loading="lazy"><figcaption>${esc(x.title||'')}${x.description?`<small>${esc(x.description)}</small>`:''}</figcaption></figure>`).join('') || empty('لم تُضف صور بعد.');
  }
  const empty = t => `<div class="empty">${esc(t)}</div>`;

  async function share(type) {
    const text = type==='memory'
      ? `أريد منك شيئًا بسيطًا:\nاكتب موقفًا أو قصة حقيقية وقعت معك أنت والشهيد صالح سالم الشعب، وساهم في حفظ ذكراه.\n\nاكتب ذكريتك هنا:`
      : `هل عرفت الشهيد صالح سالم الشعب؟\nشاركنا موقفًا أو قصة حقيقية وقعت معك أنت والشهيد صالح الشعب، وساهم في حفظ ذكراه.`;
    const url = new URL(C.siteUrl || location.origin, location.href);
    if (type==='memory') url.searchParams.set('remember','1');
    const full = `${text}\n${url.toString()}`;
    if (navigator.share) { try { await navigator.share({title:'الشهيد صالح سالم الشعب', text:full, url:url.toString()}); return; } catch(e){} }
    location.href = `https://wa.me/?text=${encodeURIComponent(full)}`;
  }

  function setupMemoryForm() {
    const form = $('#memoryForm'); if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      const msg = $('#memoryMsg');
      try {
        const fd = new FormData(form); await api('createMemory', Object.fromEntries(fd.entries()));
        msg.textContent = 'شكرًا لك. وصلت ذكريتك وستتم مراجعتها قبل نشرها.'; msg.className='success'; form.reset();
      } catch(err) { msg.textContent = err.message; msg.className='error'; }
      btn.disabled = false;
    });
  }
  document.addEventListener('click', e => {
    const shareBtn=e.target.closest('[data-share]'); if(shareBtn) share(shareBtn.dataset.share);
    const open=e.target.closest('[data-open-memory]'); if(open) { document.querySelector('#memorySection')?.scrollIntoView({behavior:'smooth'}); }
  });
  setupMemoryForm();
  publicApi().then(d=>{ if(d.ok) render(d); if(new URLSearchParams(location.search).get('remember')==='1') document.querySelector('#memorySection')?.scrollIntoView({behavior:'smooth'}); }).catch(err=>{console.error(err);});
})();
