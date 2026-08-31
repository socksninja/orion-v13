const opportunities = [
  {
    id:'o1', topic:'AI Infrastructure', title:'SMB AI inference cost-control opportunity', score:91, priority:91,
    confidence:0.78, status:'ACT NOW', thesis:'Rising inference spend creates a concrete cost-reduction wedge for small AI product teams.',
    evidence:['Multiple public signals indicate inference costs are becoming a budget concern.','The buyer can quantify savings from a small technical audit.'],
    action:'Interview 3 AI product owners and offer a 30-minute inference cost teardown.',
    success:'At least 1 of 3 agrees to share a real workload/cost snapshot and asks for a paid audit.',
    falsifier:'No buyer will share cost data, or the pain is viewed as too small to pay for.', cost:'¥0–¥50', time:'1 day', next:'Contact 3 founders / CTOs and test the offer before building software.'
  },
  {
    id:'o2', topic:'Export / B2B', title:'Supplier-to-buyer matching for niche industrial parts', score:84, priority:84,
    confidence:0.68, status:'VALIDATE NEXT', thesis:'Fragmented supplier catalogs and narrow buyer needs create a high-value manual matching workflow.',
    evidence:['Industrial buyers often search by specification rather than brand.','A successful match can have high transaction value even at low volume.'],
    action:'Manually source 10 buyer requirements and match them to 20 suppliers.',
    success:'2+ buyers accept a qualified supplier shortlist and 1 agrees to a paid sourcing trial.',
    falsifier:'Requirements are too inconsistent to match efficiently or buyers already have a superior sourcing route.', cost:'¥0', time:'2 days', next:'Pick one product category and run 10 manual matches.'
  },
  {
    id:'o3', topic:'Data / MDM', title:'Lightweight product-data normalization for cross-border sellers', score:76, priority:76,
    confidence:0.61, status:'VALIDATE NEXT', thesis:'Messy product attributes create repetitive catalog cleanup work across marketplaces and distributors.',
    evidence:['Cross-channel catalogs commonly contain inconsistent attribute formats.','A manual before/after sample makes ROI easy to demonstrate.'],
    action:'Take one messy catalog and normalize 50 SKUs into a target schema.',
    success:'Client accepts the normalized sample and asks for the remaining catalog to be processed.',
    falsifier:'Data quality is already good enough or normalization creates no measurable downstream value.', cost:'¥0–¥30', time:'1 day', next:'Ask one seller for a 50-SKU sample and quote a fixed-price cleanup.'
  },
  {
    id:'o4', topic:'Robotics', title:'Component shortage intelligence for small robotics teams', score:68, priority:68,
    confidence:0.55, status:'WATCH', thesis:'Small robotics companies can be exposed to component availability changes without dedicated procurement intelligence.',
    evidence:['Long-tail components can create disproportionate project delays.','Monitoring is potentially valuable but urgency varies by team.'],
    action:'Track 20 high-risk components for 7 days and record meaningful changes.',
    success:'A team confirms at least one monitored change would alter a purchase decision.',
    falsifier:'Alerts are too noisy or teams already have procurement monitoring in place.', cost:'¥0', time:'7 days', next:'Observe first; only sell after a decision-changing alert appears.'
  },
  {
    id:'o5', topic:'Market Intelligence', title:'Competitor-change alerts for niche B2B manufacturers', score:62, priority:62,
    confidence:0.5, status:'WATCH', thesis:'Niche manufacturers may care about competitor launches, pricing, distributors, and certifications—but urgency is uncertain.',
    evidence:['Competitive changes are observable from public sources.','Value depends strongly on whether a change affects an active account or market.'],
    action:'Monitor 5 direct competitors for 7 days and log only decision-relevant changes.',
    success:'One change causes a concrete commercial reaction from a target company.',
    falsifier:'Monitoring produces interesting news but no decisions.', cost:'¥0', time:'7 days', next:'Do not build a dashboard yet; prove one decision-changing signal first.'
  }
];

function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
function cls(status){return status==='ACT NOW'?'act':status==='VALIDATE NEXT'?'validate':'watch'}
function renderQueue(selected){
  const q=[...opportunities].sort((a,b)=>b.priority-a.priority);
  document.getElementById('queue').innerHTML=q.map((o,i)=>`<div class="row ${o.id===selected?'active':''}" data-id="${o.id}"><div class="rowtop"><strong>#${i+1} · ${esc(o.title)}</strong><span class="score">${o.priority}</span></div><div class="sub"><span class="decision ${cls(o.status)}">${o.status}</span> · ${esc(o.next)}</div></div>`).join('');
  document.querySelectorAll('.row').forEach(el=>el.addEventListener('click',()=>renderAll(el.dataset.id)));
}
function renderDetail(id){
  const o=opportunities.find(x=>x.id===id)||opportunities[0];
  document.getElementById('detail').innerHTML=`
    <div class="meta"><span class="pill hot">PRIORITY ${o.priority}</span><span class="pill">CONFIDENCE ${Math.round(o.confidence*100)}%</span><span class="pill ${cls(o.status)}">${o.status}</span><span class="pill">COST ${esc(o.cost)}</span><span class="pill">TIME ${esc(o.time)}</span></div>
    <h2>${esc(o.title)}</h2>
    <div class="section"><b>WHY THIS MATTERS</b><p>${esc(o.thesis)}</p></div>
    <div class="section"><b>MINIMUM VALIDATION</b><p>${esc(o.action)}</p></div>
    <div class="section"><b>SUCCESS CRITERIA</b><p>${esc(o.success)}</p></div>
    <div class="section"><b>FALSIFIER</b><p>${esc(o.falsifier)}</p></div>
    <div class="section action"><div><b>RECOMMENDED NEXT ACTION</b><p>${esc(o.next)}</p></div><button class="btn primary" id="testBtn">RUN TEST</button></div>
    <div class="result" id="result">Test logged. Evidence should change the decision, not merely increase confidence.</div>
  `;
  document.getElementById('testBtn').addEventListener('click',()=>{const r=document.getElementById('result');r.classList.add('show');r.textContent=`MINIMUM TEST: ${o.action} Decision checkpoint: success = ${o.success}`});
}
function renderCards(){
  document.getElementById('cards').innerHTML=opportunities.map(o=>`<article class="panel mini"><div class="label">${esc(o.topic)} · ${o.status}</div><h3>${esc(o.title)}</h3><p>${esc(o.thesis)}</p><div class="k"><span>Priority ${o.priority}</span><span>Evidence ${o.evidence.length}</span></div></article>`).join('');
}
function renderAll(id){renderQueue(id);renderDetail(id);renderCards();}
renderAll('o1');
