(() => {
  const C=window.MEMORIAL_CONFIG, $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const getToken=()=>localStorage.getItem('saleh_admin_token')||'';
  const api=async(action,params={})=>{const r=await fetch(C.apiUrl,{method:'POST',body:new URLSearchParams({action,token:getToken(),...params})});const d=await r.json();if(!d.ok)throw new Error(d.error||'حدث خطأ');return d;};
  async function load(){const r=await fetch(C.apiUrl+'?action=readAdmin&token='+encodeURIComponent(getToken()),{cache:'no-store'});const d=await r.json();if(!d.ok)throw new Error(d.error||'غير مصرح');render(d);}
  function render(d){
    const p=d.profile||{};
    Object.entries({name:p.name,location:p.location,tagline:p.tagline,intro:p.intro,birth:p.birth,death:p.death,job:p.job,martyrdomDate:p.martyrdomDate,martyrdomPlace:p.martyrdomPlace,hero_image:p.hero_image,bio:p.bio,story:p.story,departure:p.departure,sonLetter:p.sonLetter}).forEach(([k,v])=>{const el=$(`[name="${k}"]`);if(el)el.value=v||'';});
    $('#memoriesTable').innerHTML=(d.memories||[]).map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.relation)}</td><td>${esc(m.title)}</td><td>${esc(m.story)}</td><td>${esc(m.status)}</td><td><select data-id="${esc(m.id)}" class="memStatus"><option value="pending" ${m.status==='pending'?'selected':''}>pending</option><option value="approved" ${m.status==='approved'?'selected':''}>approved</option><option value="rejected" ${m.status==='rejected'?'selected':''}>rejected</option></select></td></tr>`).join('')||'<tr><td colspan="6">لا توجد ذكريات.</td></tr>';
  }
  async function login(){const t=$('#token').value.trim();if(!t)return;localStorage.setItem('saleh_admin_token',t);try{await load();$('#login').hidden=true;$('#panel').hidden=false;}catch(e){localStorage.removeItem('saleh_admin_token');$('#loginMsg').textContent=e.message;}}
  $('#loginForm').addEventListener('submit',e=>{e.preventDefault();login();});
  $('#profileForm').addEventListener('submit',async e=>{e.preventDefault();try{const obj={};e.target.querySelectorAll('[name]').forEach(x=>obj[x.name]=x.value);await api('upsertProfile',{profile:JSON.stringify(obj)});$('#saveMsg').textContent='تم الحفظ.';}catch(err){$('#saveMsg').textContent=err.message;}});
  $('#memoriesTable').addEventListener('change',async e=>{if(!e.target.matches('.memStatus'))return;try{await api('setMemoryStatus',{id:e.target.dataset.id,status:e.target.value});}catch(err){alert(err.message);}});
  $('#logout').addEventListener('click',()=>{localStorage.removeItem('saleh_admin_token');location.reload();});
  if(getToken()) load().then(()=>{$('#login').hidden=true;$('#panel').hidden=false;}).catch(()=>{localStorage.removeItem('saleh_admin_token');});
})();
