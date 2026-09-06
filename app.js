const STORAGE_KEY = "bodyTrackerDataV1";
const SETTINGS_KEY = "bodyTrackerSettingsV1";

let measurements = loadMeasurements();
let settings = loadSettings();
let deferredPrompt = null;

const $ = (id) => document.getElementById(id);

function loadMeasurements(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveMeasurements(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
}
function loadSettings(){
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { height: 183, sex: "male" };
  } catch {
    return { height: 183, sex: "male" };
  }
}
function saveSettingsData(){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function num(v){ return v === "" || v == null ? null : Number(v); }
function fmt(v, digits=1){ return Number.isFinite(v) ? v.toFixed(digits) : "--"; }

function calcBMI(weight, heightCm){
  if(!weight || !heightCm) return null;
  const m = heightCm/100;
  return weight/(m*m);
}

// U.S. Navy formula using circumference in inches.
// Male: 86.010*log10(waist-neck) - 70.041*log10(height) + 36.76
// Female: 163.205*log10(waist+hip-neck) - 97.684*log10(height) - 78.387
function calcBodyFat({sex, height, waist, neck, hip}){
  if(!height || !waist || !neck) return null;
  const toIn = cm => cm / 2.54;
  const h = toIn(height), w = toIn(waist), n = toIn(neck);
  let bf;

  if(sex === "female"){
    if(!hip) return null;
    const hp = toIn(hip);
    const x = w + hp - n;
    if(x <= 0) return null;
    bf = 163.205*Math.log10(x) - 97.684*Math.log10(h) - 78.387;
  } else {
    const x = w - n;
    if(x <= 0) return null;
    bf = 86.010*Math.log10(x) - 70.041*Math.log10(h) + 36.76;
  }

  if(!Number.isFinite(bf)) return null;
  return Math.max(2, Math.min(75, bf));
}

function enrich(m){
  const bodyFat = calcBodyFat({
    sex: settings.sex,
    height: settings.height,
    waist: m.waist,
    neck: m.neck,
    hip: m.hip
  });
  const bmi = calcBMI(m.weight, settings.height);
  const fatMass = bodyFat != null ? m.weight*(bodyFat/100) : null;
  const leanMass = bodyFat != null ? m.weight-fatMass : null;
  return {...m, bodyFat, bmi, fatMass, leanMass};
}

function sorted(){
  return [...measurements].sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function latest(){
  const arr = sorted();
  return arr.length ? enrich(arr[arr.length-1]) : null;
}

function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  $(name+"Page").classList.add("active");
  document.querySelector(`[data-page="${name}"]`)?.classList.add("active");

  if(name==="home") renderHome();
  if(name==="history") renderHistory();
  if(name==="charts") renderMainChart();
  if(name==="settings") renderSettings();
  if(name==="add") prepareAdd();
  document.querySelectorAll("[data-page]").forEach(button=>button.setAttribute("aria-current",button.dataset.page===name?"page":"false"));
}

function prepareAdd(){
  if(!$("date").value) $("date").value = new Date().toISOString().slice(0,10);
  updateFemaleFields();
  updatePreview();
}

function updateFemaleFields(){
  document.querySelectorAll(".female-only").forEach(el=>{
    el.classList.toggle("hidden", settings.sex !== "female");
  });
  $("editHipWrap").classList.toggle("hidden", settings.sex !== "female");
}

function updatePreview(){
  const m = {
    weight:num($("weight").value),
    waist:num($("waist").value),
    neck:num($("neck").value),
    hip:num($("hip").value)
  };
  const e = enrich(m);
  $("previewBodyFat").textContent = e.bodyFat != null ? `${fmt(e.bodyFat)}%` : "--%";
  $("previewLeanMass").textContent = e.leanMass != null ? `${fmt(e.leanMass)} kg` : "-- kg";
  $("previewFatMass").textContent = e.fatMass != null ? `${fmt(e.fatMass)} kg` : "-- kg";
}

function renderHome(){
  const l = latest();
  if(!l){
    $("heroBodyFat").textContent="--%";
    $("heroBodyFatChange").textContent="ยังไม่มีข้อมูล";
    $("homeWeight").textContent="-- kg";
    $("homeWaist").textContent="-- cm";
    $("homeBmi").textContent="--";
    $("homeLeanMass").textContent="-- kg";
  } else {
    $("heroBodyFat").textContent = l.bodyFat != null ? `${fmt(l.bodyFat)}%` : "--%";
    const arr = sorted().map(enrich).filter(x=>x.bodyFat != null);
    if(arr.length>=2){
      const diff = arr[arr.length-1].bodyFat - arr[0].bodyFat;
      $("heroBodyFatChange").textContent = `${diff>0?"+":""}${fmt(diff)}% since first entry`;
    } else {
      $("heroBodyFatChange").textContent = "บันทึกครั้งแรกแล้ว";
    }
    $("homeWeight").textContent=`${fmt(l.weight)} kg`;
    $("homeWaist").textContent=`${fmt(l.waist)} cm`;
    $("homeBmi").textContent=fmt(l.bmi);
    $("homeLeanMass").textContent=l.leanMass!=null?`${fmt(l.leanMass)} kg`:"-- kg";
  }
  drawChart($("homeChart"), $("homeChartMetric").value, 90);
}

function renderHistory(){
  const list = $("historyList");
  const arr = sorted().reverse().map(enrich);
  if(!arr.length){
    list.innerHTML=`<div class="empty">ยังไม่มีข้อมูล<br>กด + เพื่อเพิ่มการวัดครั้งแรก</div>`;
    return;
  }

  list.innerHTML = arr.map(m=>`
    <div class="history-item">
      <div class="history-top">
        <div>
          <div class="history-date">${new Date(m.date+"T00:00:00").toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"})}</div>
          <div class="history-meta">Waist ${fmt(m.waist)} cm · Neck ${fmt(m.neck)} cm${m.chest?` · Chest ${fmt(m.chest)} cm`:""}</div>
        </div>
        <div class="history-values">
          <div><strong>${fmt(m.weight)}</strong><span>kg</span></div>
          <div><strong>${m.bodyFat!=null?fmt(m.bodyFat):"--"}</strong><span>% fat</span></div>
        </div>
      </div>
      <div class="history-actions">
        <button class="secondary" onclick="openEdit('${m.id}')">Edit</button>
        <button class="danger" onclick="deleteMeasurement('${m.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function filterByRange(arr, range){
  if(range==="all") return arr;
  const days=Number(range);
  const cutoff=new Date();
  cutoff.setHours(0,0,0,0);
  cutoff.setDate(cutoff.getDate()-days);
  return arr.filter(x=>new Date(x.date+"T00:00:00")>=cutoff);
}

function metricMeta(metric){
  return {
    weight:{label:"Weight",unit:"kg"},
    bodyFat:{label:"Body Fat",unit:"%"},
    waist:{label:"Waist",unit:"cm"},
    chest:{label:"Chest",unit:"cm"},
    arm:{label:"Arm",unit:"cm"},
    thigh:{label:"Thigh",unit:"cm"}
  }[metric];
}

function getMetricValue(m, metric){
  const e=enrich(m);
  return e[metric];
}

function renderMainChart(){
  const metric=$("chartMetric").value;
  const range=$("chartRange").value;
  drawChart($("mainChart"),metric,range);
  const arr=filterByRange(sorted(),range).map(m=>({date:m.date,value:getMetricValue(m,metric)})).filter(x=>Number.isFinite(x.value));
  const meta=metricMeta(metric);
  if(arr.length>=2){
    const diff=arr[arr.length-1].value-arr[0].value;
    $("chartSummary").textContent=`${meta.label}: ${diff>0?"+":""}${fmt(diff)} ${meta.unit} ในช่วงที่เลือก`;
  } else if(arr.length===1){
    $("chartSummary").textContent=`${meta.label}: ${fmt(arr[0].value)} ${meta.unit}`;
  } else {
    $("chartSummary").textContent="ยังไม่มีข้อมูล";
  }
}

function drawChart(canvas, metric, range){
  const ctx=canvas.getContext("2d");
  const dpr=window.devicePixelRatio||1;
  const cssW=canvas.clientWidth||320;
  const cssH=Number(canvas.dataset.chartHeight)||(canvas.id==="mainChart"?260:220);
  canvas.dataset.chartHeight=cssH;
  canvas.width=cssW*dpr;
  canvas.height=cssH*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,cssW,cssH);

  let arr=sorted();
  arr=filterByRange(arr,range);
  const pts=arr.map(m=>({date:m.date,value:getMetricValue(m,metric)})).filter(x=>Number.isFinite(x.value));

  ctx.font="12px -apple-system, sans-serif";
  ctx.fillStyle="#9a9aa1";

  if(!pts.length){
    ctx.textAlign="center";
    ctx.fillText("ยังไม่มีข้อมูลสำหรับกราฟ",cssW/2,cssH/2);
    return;
  }

  const pad={l:44,r:14,t:20,b:34};
  const values=pts.map(p=>p.value);
  let min=Math.min(...values), max=Math.max(...values);
  if(min===max){ min-=1; max+=1; }
  const margin=(max-min)*0.15;
  min-=margin; max+=margin;

  const x = i => pad.l + (pts.length===1 ? (cssW-pad.l-pad.r)/2 : i*(cssW-pad.l-pad.r)/(pts.length-1));
  const y = v => pad.t + (max-v)*(cssH-pad.t-pad.b)/(max-min);

  ctx.strokeStyle="#2a2a2e";
  ctx.lineWidth=1;
  ctx.beginPath();
  for(let i=0;i<4;i++){
    const yy=pad.t+i*(cssH-pad.t-pad.b)/3;
    ctx.moveTo(pad.l,yy); ctx.lineTo(cssW-pad.r,yy);
    const val=max-i*(max-min)/3;
    ctx.fillStyle="#9a9aa1";
    ctx.textAlign="right";
    ctx.fillText(val.toFixed(1),pad.l-8,yy+4);
  }
  ctx.stroke();

  ctx.strokeStyle="#f5f5f7";
  ctx.lineWidth=2.5;
  ctx.beginPath();
  pts.forEach((p,i)=>{
    if(i===0) ctx.moveTo(x(i),y(p.value));
    else ctx.lineTo(x(i),y(p.value));
  });
  ctx.stroke();

  ctx.fillStyle="#f5f5f7";
  pts.forEach((p,i)=>{
    ctx.beginPath();
    ctx.arc(x(i),y(p.value),4,0,Math.PI*2);
    ctx.fill();
  });

  const first=pts[0], last=pts[pts.length-1];
  ctx.fillStyle="#9a9aa1";
  ctx.textAlign="left";
  ctx.fillText(new Date(first.date+"T00:00:00").toLocaleDateString("th-TH",{day:"numeric",month:"short"}),pad.l,cssH-10);
  if(pts.length>1){
    ctx.textAlign="right";
    ctx.fillText(new Date(last.date+"T00:00:00").toLocaleDateString("th-TH",{day:"numeric",month:"short"}),cssW-pad.r,cssH-10);
  }
}

function openEdit(id){
  const m=measurements.find(x=>x.id===id);
  if(!m) return;
  $("editId").value=m.id;
  $("editDate").value=m.date;
  $("editWeight").value=m.weight ?? "";
  $("editWaist").value=m.waist ?? "";
  $("editNeck").value=m.neck ?? "";
  $("editHip").value=m.hip ?? "";
  $("editChest").value=m.chest ?? "";
  $("editArm").value=m.arm ?? "";
  $("editThigh").value=m.thigh ?? "";
  updateFemaleFields();
  $("editDialog").showModal();
}

function deleteMeasurement(id){
  if(!confirm("ลบรายการนี้ใช่ไหม?")) return;
  measurements=measurements.filter(x=>x.id!==id);
  saveMeasurements();
  renderHistory();
  renderHome();
}

window.openEdit=openEdit;
window.deleteMeasurement=deleteMeasurement;

$("measurementForm").addEventListener("submit",e=>{
  e.preventDefault();
  const m={
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date:$("date").value,
    weight:num($("weight").value),
    waist:num($("waist").value),
    neck:num($("neck").value),
    hip:num($("hip").value),
    chest:num($("chest").value),
    arm:num($("arm").value),
    thigh:num($("thigh").value)
  };
  const test=enrich(m);
  if(test.bodyFat==null){
    alert(settings.sex==="female" ? "กรุณากรอก Waist, Neck, Hip และตั้งค่า Height" : "กรุณากรอก Waist, Neck และตั้งค่า Height");
    return;
  }
  measurements.push(m);
  saveMeasurements();
  e.target.reset();
  $("date").value=new Date().toISOString().slice(0,10);
  showPage("home");
});

["weight","waist","neck","hip"].forEach(id=>$(id).addEventListener("input",updatePreview));

$("saveEditBtn").addEventListener("click",e=>{
  e.preventDefault();
  const id=$("editId").value;
  const i=measurements.findIndex(x=>x.id===id);
  if(i<0) return;
  measurements[i]={
    ...measurements[i],
    date:$("editDate").value,
    weight:num($("editWeight").value),
    waist:num($("editWaist").value),
    neck:num($("editNeck").value),
    hip:num($("editHip").value),
    chest:num($("editChest").value),
    arm:num($("editArm").value),
    thigh:num($("editThigh").value)
  };
  saveMeasurements();
  $("editDialog").close();
  renderHistory();
  renderHome();
});

function renderSettings(){
  $("height").value=settings.height ?? "";
  $("sex").value=settings.sex;
  updateFemaleFields();
}

$("saveSettings").addEventListener("click",()=>{
  const height=num($("height").value);
  if(!height){ alert("กรุณากรอกส่วนสูง"); return; }
  settings={height,sex:$("sex").value};
  saveSettingsData();
  updateFemaleFields();
  alert("บันทึกการตั้งค่าแล้ว");
  renderHome();
});

$("exportBtn").addEventListener("click",()=>{
  const payload={
    app:"Body Tracker",
    version:1,
    units:{height:"cm",circumferences:"in",weight:"kg"},
    exportedAt:new Date().toISOString(),
    settings,
    measurements
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`body-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("importInput").addEventListener("change",async e=>{
  const file=e.target.files?.[0];
  if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    if(!Array.isArray(data.measurements)) throw new Error("invalid");
    measurements=data.measurements;
    settings=data.settings || settings;
    saveMeasurements();
    saveSettingsData();
    alert("นำเข้าข้อมูลสำเร็จ");
    renderSettings();
    renderHome();
  }catch{
    alert("ไฟล์ backup ไม่ถูกต้อง");
  }
  e.target.value="";
});

$("deleteAllBtn").addEventListener("click",()=>{
  if(!confirm("ลบข้อมูลการวัดทั้งหมด? การกระทำนี้ย้อนกลับไม่ได้")) return;
  measurements=[];
  saveMeasurements();
  renderHome();
  alert("ลบข้อมูลทั้งหมดแล้ว");
});

document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.page)));
document.querySelectorAll("[data-go]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.go)));
$("homeChartMetric").addEventListener("change",renderHome);
$("chartMetric").addEventListener("change",renderMainChart);
$("chartRange").addEventListener("change",renderMainChart);

window.addEventListener("resize",()=>{
  if($("homePage").classList.contains("active")) renderHome();
  if($("chartsPage").classList.contains("active")) renderMainChart();
});

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();
  deferredPrompt=e;
  $("installBtn").classList.remove("hidden");
});

$("installBtn").addEventListener("click",async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt=null;
  $("installBtn").classList.add("hidden");
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
}

$("date").value=new Date().toISOString().slice(0,10);
renderSettings();
renderHome();
