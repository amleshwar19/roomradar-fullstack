/* ==================== DATA */ // Canonical 9-period day (from official timetables), minutes since midnight
const PERIODS=[
 {n:1,s:540,e:590},{n:2,s:590,e:640},{n:3,s:650,e:700},{n:4,s:700,e:750},
 {n:5,s:750,e:800},{n:6,s:800,e:850},{n:7,s:850,e:900},{n:8,s:910,e:960},{n:9,s:960,e:1010}
];
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday"];
// Slots whose classes happen OUTSIDE the home classroom (labs / CDC / workshop / NSS / yoga)
const OFFSITE=new Set(["H","LAB","Workshop","NSS","Yoga"]);
// slot -> short display name per section
const SECTIONS=[
{id:"II-BME",label:"II BME",room:"IST 602",names:{A:"Transforms & BVP",B:"Biomedical Signals",C:"Electric & Electronic Ckts",D:"Digital Logic (Med)",E:"Medical Physics",F:"Professional Ethics",G:"Human Values-II",I:"Social Engineering"}},
{id:"II-ECE-DS-A",label:"II ECE-DS A",room:"IST 416",names:{A:"Transforms & BVP",B:"Solid State Devices",C:"Comp. Organization",D:"Digital Logic Design",E:"EM Theory",F:"Professional Ethics",G:"Human Values-II",I:"Social Engineering"}},
{id:"II-ECE-DS-B",label:"II ECE-DS B",room:"IST 411",names:{A:"Transforms & BVP",B:"Solid State Devices",C:"Comp. Organization",D:"Digital Logic Design",E:"EM Theory",F:"Professional Ethics",G:"Human Values-II",I:"Social Engineering"}},
{id:"III-BME",label:"III BME",room:"IST 211",names:{A:"Probability & Stats",B:"Microcontrollers (Med)",C:"Biomedical Signal Proc.",D:"Biometrics",E:"Wireless Comm.",F:"Medical Imaging",G:"Analytical Thinking",H:"Indian Art Form",I:"Community Connect"}},
{id:"III-ECE-A",label:"III ECE A",room:"IST 518",names:{A:"Discrete Maths",B:"Microprocessors",C:"VLSI Design",D:"Network on Chip",E:"Machine Learning",F:"Community Connect",G:"Analytical Thinking",H:"Indian Art Form"}},
{id:"III-ECE-B",label:"III ECE B",room:"IST 518",names:{A:"Discrete Maths",B:"Microprocessors",C:"VLSI Design",D:"Network on Chip",E:"Machine Learning",F:"Community Connect",G:"Analytical Thinking",H:"Indian Art Form"}},
{id:"III-ECE-DS",label:"III ECE DS",room:"IST 519",names:{A:"Discrete Maths",B:"Microprocessors",C:"VLSI Design",D:"Machine Learning",E:"Database Design",F:"Community Connect",G:"Analytical Thinking",H:"Indian Art Form"}},
{id:"IV-ECE-A",label:"IV ECE A",room:"IST 225",names:{A:"Behavioural Psychology",B:"Wireless Comm. & Antennas",C:"Network Security",D:"Semiconductor Memory",E:"Scripting for EDA",F:"Machine Learning"}},
{id:"IV-ECE-B",label:"IV ECE B",room:"IST 227",names:{A:"Behavioural Psychology",B:"Wireless Comm. & Antennas",C:"Network Security",D:"Semiconductor Memory",E:"Scripting for EDA",F:"Machine Learning"}}
];
const WEEKS={
"II-BME":{Monday:["E","C","I","I",null,"D","D",null,null],Tuesday:["C","E","B","A",null,"H","H",null,null],Wednesday:["B","D","A",null,null,"H","G",null,null],Thursday:["A","E","B","D",null,null,null,"D","D"],Friday:["F","A","C","D",null,null,null,"G","G"]},
"II-ECE-DS-A":{Monday:["E","A","I","I",null,"G","G","LAB","LAB"],Tuesday:["C","A","E","D",null,"G",null,"H","H"],Wednesday:["A","B","C","D",null,null,"H",null,null],Thursday:["B","C","A","F",null,"LAB","LAB",null,null],Friday:["D","B","E","C",null,null,null,null,null]},
"II-ECE-DS-B":{Monday:[null,null,"LAB","LAB",null,"D","B","C","I"],Tuesday:["LAB","LAB",null,null,null,"C","D","E","A"],Wednesday:["G",null,null,null,null,"I","E","A","D"],Thursday:["G","G","H","H",null,"A","C","B","E"],Friday:["H",null,null,null,null,"F","A","B","C"]},
"III-BME":{Monday:["G","G","B","B",null,"E","B","F","H"],Tuesday:["C","C","G",null,null,"C","D","A","B"],Wednesday:[null,null,null,null,null,"C","A","F","D"],Thursday:[null,null,null,"I",null,"A","C","E","B"],Friday:["I",null,null,null,null,"F","A","D","E"]},
"III-ECE-A":{Monday:["E","B","B","A",null,"G","G",null,null],Tuesday:["H","D","B","B",null,null,"G",null,null],Wednesday:["C","A","D","F",null,null,null,"LAB","LAB"],Thursday:["A","E","C","F",null,null,null,null,null],Friday:["D","A","E","C",null,"LAB","LAB",null,null]},
"III-ECE-B":{Monday:["LAB","LAB",null,null,null,"E","B","A","D"],Tuesday:["G","G",null,null,null,"F","B","D","C"],Wednesday:["G",null,null,null,null,"B","B","A","H"],Thursday:["LAB","LAB",null,null,null,"A","C","E","F"],Friday:[null,null,null,null,null,"C","A","E","D"]},
"III-ECE-DS":{Monday:["E","B","C","A",null,null,null,null,null],Tuesday:["C","B","D","F",null,"LAB","LAB",null,null],Wednesday:["H","B","A","C",null,null,null,"G","G"],Thursday:["A","D","E","F",null,null,null,null,null],Friday:["D","A","E","B",null,"G",null,"LAB","LAB"]},
"IV-ECE-A":{Monday:["C",null,"A","D",null,null,null,null,null],Tuesday:["C","D","B","F",null,null,null,null,null],Wednesday:["B","LAB","E","F",null,null,null,null,null],Thursday:["F","A","E","B",null,null,null,null,null],Friday:["C","A","D","E",null,null,null,null,null]},
"IV-ECE-B":{Monday:["C","A","E","F",null,null,null,null,null],Tuesday:["C","E","F","B",null,null,null,null,null],Wednesday:["C","D","A","B",null,null,null,null,null],Thursday:["D","B","LAB","A",null,null,null,null,null],Friday:["E","D","F",null,null,null,null,null,null]}
};
const ROOMS=[
 {no:"IST 602",floor:6,cap:72,ac:true,proj:true,secs:["II-BME"]},
 {no:"IST 519",floor:5,cap:60,ac:true,proj:true,secs:["III-ECE-DS"]},
 {no:"IST 518",floor:5,cap:60,ac:true,proj:true,secs:["III-ECE-A","III-ECE-B"]},
 {no:"IST 416",floor:4,cap:66,ac:true,proj:true,secs:["II-ECE-DS-A"]},
 {no:"IST 411",floor:4,cap:66,ac:true,proj:true,secs:["II-ECE-DS-B"]},
 {no:"IST 227",floor:2,cap:60,ac:true,proj:true,secs:["IV-ECE-B"]},
 {no:"IST 225",floor:2,cap:60,ac:true,proj:true,secs:["IV-ECE-A"]},
 {no:"IST 211",floor:2,cap:60,ac:true,proj:true,secs:["III-BME"]}
];
const FLOORS=[6,5,4,2];
const secById=id=>SECTIONS.find(s=>s.id===id);
const slotName=(secId,slot)=>{const s=secById(secId);return (s.names&&s.names[slot])||({"LAB":"Lab session","H":"Verbal Reasoning (CDC)","Workshop":"Workshop","NSS":"NSS","Yoga":"Yoga","CDC":"Aptitude","German":"German","Japanese":"Japanese"}[slot]||slot);};

/* ==================== ENGINE */ const fmtT=m=>{let h=Math.floor(m/60),mm=m%60,ap=h>=12?"PM":"AM";h=h%12||12;return h+":"+String(mm).padStart(2,"0")+" "+ap;};
function periodAt(min){for(let i=0;i<PERIODS.length;i++){if(min>=PERIODS[i].s&&min<PERIODS[i].e)return i;}return -1;}
// what occupies a room at (dayIdx 0-4, minute)? -> {secId,slot} or null
function roomBusyAt(room,day,min){
  if(day<0||day>4) return null;
  const p=periodAt(min); if(p<0) return null;
  const dayName=DAYS[day];
  for(const sid of room.secs){
    const slot=WEEKS[sid][dayName][p];
    if(slot&&!OFFSITE.has(slot)) return {secId:sid,slot};
  }
  return null;
}
// is room free for the whole [start,end) window?
function roomFreeFor(room,day,start,end){
  if(day<0||day>4) return true;
  for(const P of PERIODS){
    if(P.s<end&&P.e>start&&roomBusyAt(room,day,Math.max(P.s,start))) return false;
  }
  return true;
}
function freeUntil(room,day,from){
  for(const P of PERIODS){ if(P.e<=from) continue;
    if(roomBusyAt(room,day,Math.max(P.s,from))) return P.s;
  } return 1010;
}
function busyUntil(room,day,from){
  let end=from;
  for(const P of PERIODS){ if(P.e<=from) continue; if(P.s>end) break;
    if(roomBusyAt(room,day,Math.max(P.s,from))) end=P.e; else break;
  } return end;
}
function freeWindows(room,day){
  if(day<0||day>4) return [{s:540,e:1010,label:"All day (no classes scheduled)"}];
  const out=[]; let cur=null;
  for(const P of PERIODS){
    const busy=!!roomBusyAt(room,day,P.s+1);
    if(!busy&&!cur) cur={s:P.s,e:P.e};
    else if(!busy) cur.e=P.e;
    else if(cur){out.push(cur);cur=null;}
  }
  if(cur) out.push(cur);
  return out.filter(w=>w.e-w.s>=20);
}


module.exports={PERIODS,DAYS,OFFSITE,SECTIONS,WEEKS,ROOMS,FLOORS,secById,slotName,fmtT,periodAt,roomBusyAt,roomFreeFor,freeUntil,busyUntil,freeWindows};
