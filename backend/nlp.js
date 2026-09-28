 const EXAMPLES=[
 "I need an AC room on the ground floor for me and my team for the next 2 hours.",
 "Free room on floor 5 for 8 people with a projector for 1 hour",
 "Any room free tomorrow afternoon for 3 hours?",
 "Quiet room on floor 2 for just me for 30 minutes",
 "Room for 20 people on the top floor for the next hour"
];

function parseQuery(q, nowMinVal){
  const t=q.toLowerCase();
  const out={floors:null,minCap:1,durMin:60,startMin:null,dayOffset:0,dayName:null,ac:false,proj:false,notes:[]};
  // floor
  if(/ground floor/.test(t)) out.floors=[0];
  else if(/top floor|highest floor/.test(t)) out.floors=[Math.max(...FLOORS)];
  else if(/upper floors?/.test(t)) out.floors=[5,6];
  else if(/lower floors?/.test(t)) out.floors=[2];
  else{const m=t.match(/floor\s*(\d)|(\d)(?:st|nd|rd|th)\s*floor/); if(m) out.floors=[+(m[1]||m[2])];}
  // duration
  let m=t.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/); if(m) out.durMin=Math.round(+m[1]*60);
  else if(m=t.match(/(\d+)\s*(minutes?|mins?)\b/)) out.durMin=+m[1];
  else if(/whole day|all day/.test(t)) out.durMin=470;
  // capacity
  if(m=t.match(/(\d+)\s*(people|persons|students|of us|members)/)) out.minCap=+m[1];
  else if(m=t.match(/team of (\d+)/)) out.minCap=+m[1];
  else if(/just me|only me|for me\b(?! and)/.test(t)&&!/team/.test(t)) out.minCap=2;
  else if(/my team|our team|team/.test(t)){out.minCap=6;out.notes.push("“team” → assumed 6 seats");}
  // amenities
  if(/\bac\b|\ba\/c\b|air[- ]?condition/.test(t)) out.ac=true;
  if(/non[\s-]?ac/.test(t)) out.ac=false;
  if(/projector|presentation|\bppt\b|screen/.test(t)) out.proj=true;
  // day
  const dm=t.match(/\b(monday|tuesday|wednesday|thursday|friday)\b/);
  if(dm){out.dayName=dm[1][0].toUpperCase()+dm[1].slice(1);}
  else if(/day after tomorrow/.test(t)) out.dayOffset=2;
  else if(/tomorrow/.test(t)) out.dayOffset=1;
  // start time
  if(/from\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*to\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/.test(t)){
    const mm=t.match(/from\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/); out.startMin=toMin(mm);
  } else if(m=t.match(/at\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/)){ out.startMin=toMin(m); }
  else if(/morning/.test(t)) out.startMin=(out.dayOffset||out.dayName)?540:Math.max(nowMinVal,540);
  else if(/afternoon/.test(t)) out.startMin=out.dayOffset?750:Math.max(nowMinVal,750);
  else if(/evening/.test(t)) out.startMin=910;
  if(out.startMin==null) out.startMin=Math.max(nowMinVal,540);
  return out;
}
function toMin(m){
  let h=+m[1], mi=+(m[2]||0); const ap=(m[3]||"").toLowerCase();
  if(ap==="pm"&&h<12)h+=12; if(ap==="am"&&h===12)h=0;
  return h*60+mi;
}
function resolveDay(p, jsDay){
  
  if(p.dayName){const idx=DAYS.indexOf(p.dayName);return idx;}
  let d=jsDay+p.dayOffset;
  const map={0:-1,1:0,2:1,3:2,4:3,5:4,6:-1};
  let guard=0;
  while(map[((d%7)+7)%7]===-1&&guard<8){d++;guard++;}
  return map[((d%7)+7)%7];
}
function aiSearch(){
  const p=parseQuery(q);
  const day=resolveDay(p);
  const start=Math.min(Math.max(p.startMin,540),1010);
  const end=Math.min(start+p.durMin,1010);
  // intent chips
  const chips=[];
  chips.push(`📍 Floor: <b>${p.floors?p.floors.map(f=>f===0?"ground":f).join(", "):"any"}</b>`);
  chips.push(`⏱ Duration: <b>${p.durMin>=60?(p.durMin/60)+"h":p.durMin+"m"}</b>`);
  chips.push(`👥 Seats: <b>${p.minCap}+</b>`);
  if(p.ac)chips.push(`❄️ <b>AC</b>`);
  if(p.proj)chips.push(`📽 <b>Projector</b>`);
  chips.push(`🕐 From: <b>${day<0?"weekend":DAYS[day]} ${fmtT(start)}</b>`);
  p.notes.forEach(n=>chips.push(`💭 ${n}`));
  // match
  if(p.floors&&p.floors.every(f=>!FLOORS.includes(f))){
    html+=`<div class="note">⚠️ The dataset has no ${p.floors.includes(0)?"ground-floor":""} rooms — tracked floors are ${FLOORS.join(", ")}. Showing the closest matches on available floors instead.</div>`;
    p.floors=null;
  }
  const matches=[], nearMiss=[];
  for(const r of ROOMS){
    const reasons=[];
    if(p.floors&&!p.floors.includes(r.floor)){nearMiss.push({r,why:`on floor ${r.floor}, not ${p.floors.join("/")}`});continue;}
    if(r.cap<p.minCap){nearMiss.push({r,why:`only ${r.cap} seats (need ${p.minCap})`});continue;}
    if(p.ac&&!r.ac){nearMiss.push({r,why:"no AC"});continue;}
    if(p.proj&&!r.proj){nearMiss.push({r,why:"no projector"});continue;}
    if(!roomFreeFor(r,day,start,end)){
      const b=roomBusyAt(r,day,start);
      nearMiss.push({r,why:b?`occupied ${fmtT(start)}–${fmtT(busyUntil(r,day,start))} by ${secById(b.secId).label}`:"partially occupied in window"});
      continue;
    }
    if(p.floors)reasons.push(`floor ${r.floor} ✓`);
    reasons.push(`free ${fmtT(start)}–${fmtT(end)} ✓`);
    reasons.push(`${r.cap} seats ✓`);
    if(p.ac)reasons.push("AC ✓"); if(p.proj)reasons.push("projector ✓");
    matches.push({r,reasons});
  }
  if(!matches.length){
    html+=`<div class="empty">😕 No room matches everything. ${nearMiss.length?`Closest options are listed below — try relaxing a filter (e.g. a different floor or shorter duration).`:`Try a different time or duration.`}</div>`;
  } else {
    html+=matches.map(({r,reasons})=>`<div class="res">
      <h4>🟢 ${r.no} <span style="color:var(--mut);font-weight:400">· Floor ${r.floor}</span></h4>
      <div class="why">${reasons.map(x=>`<b>${x}</b>`).join(" · ")}</div></div>`).join("");
  }
  if(nearMiss.length&&matches.length<3){
    html+=`<div class="sub" style="color:var(--mut);font-size:12.5px;margin-top:6px">Also free-ish, but ruled out:</div>`+
      nearMiss.slice(0,4).map(({r,why})=>`<div class="res miss"><h4>${r.no} <span style="color:var(--mut);font-weight:400">· Floor ${r.floor}</span></h4><div class="why">✖ ${why}</div></div>`).join("");
  }
  res.innerHTML=html;
}


module.exports={EXAMPLES,parseQuery,resolveDay,toMin};
