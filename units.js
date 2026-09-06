// Body Tracker V3 enhancement layer
// Height: cm | Circumferences: inches | Weight: kg | Thai/English UI | 3D measurement guide
(function(){
  const UNIT_VERSION_KEY='bodyTrackerUnitVersion';
  const LANG_KEY='bodyTrackerLangV1';
  const IN_PER_CM=1/2.54;
  let lang=localStorage.getItem(LANG_KEY)||'th';
  let selectedGuide='waist';
  let guide3d=null;

  const TEXT={
    th:{appTitle:'ติดตามความเปลี่ยนแปลง',install:'ติดตั้ง',bodyFat:'เปอร์เซ็นต์ไขมัน',bodyFatTitle:'Body Fat',weight:'น้ำหนัก',waist:'รอบเอว',leanMass:'มวลไร้ไขมัน',progress:'ความคืบหน้า',addMeasurement:'+ เพิ่มการวัด',new:'ใหม่',measurement:'บันทึกสัดส่วน',measurementGuide:'คู่มือวัดสัดส่วน',guideSubtitle:'แตะส่วนของร่างกาย แล้วลากโมเดลเพื่อหมุนดู',dragRotate:'ลากเพื่อหมุน',neck:'รอบคอ',chest:'รอบอก',hip:'รอบสะโพก',arm:'รอบต้นแขน',thigh:'รอบต้นขา',where:'วัดตรงไหน?',date:'วันที่',estimatedBodyFat:'Body fat โดยประมาณ',fatMass:'มวลไขมัน',formulaNote:'% Body Fat เป็นค่าประมาณจากสูตร U.S. Navy โดยส่วนสูงกรอกเป็น cm และรอบสัดส่วนกรอกเป็นนิ้ว',saveMeasurement:'บันทึกการวัด',your:'ของคุณ',history:'ประวัติ',charts:'กราฟ',app:'แอป',settings:'ตั้งค่า',height:'ส่วนสูง',sexFormula:'เพศสำหรับสูตร U.S. Navy',male:'ชาย',female:'หญิง',saveSettings:'บันทึกการตั้งค่า',data:'ข้อมูล',exportBackup:'ส่งออก Backup',importBackup:'นำเข้า Backup',deleteAll:'ลบข้อมูลทั้งหมด',privacy:'ความเป็นส่วนตัว',privacyNote:'ข้อมูลสัดส่วนเก็บอยู่ในอุปกรณ์นี้ผ่าน localStorage และไม่ถูกส่งไปยัง GitHub หรือเซิร์ฟเวอร์ของแอป',home:'หน้าแรก',editMeasurement:'แก้ไขการวัด',cancel:'ยกเลิก',save:'บันทึก',noData:'ยังไม่มีข้อมูล',firstEntry:'บันทึกครั้งแรกแล้ว',sinceFirst:'จากครั้งแรก',emptyHistory:'ยังไม่มีข้อมูล<br>กด + เพื่อเพิ่มการวัดครั้งแรก',edit:'แก้ไข',delete:'ลบ',chartNoData:'ยังไม่มีข้อมูลสำหรับกราฟ',inSelectedRange:'ในช่วงที่เลือก',heightRequired:'กรุณากรอกส่วนสูง',settingsSaved:'บันทึกการตั้งค่าแล้ว',importSuccess:'นำเข้าข้อมูลสำเร็จ',invalidBackup:'ไฟล์ backup ไม่ถูกต้อง',confirmDeleteAll:'ลบข้อมูลการวัดทั้งหมด? การกระทำนี้ย้อนกลับไม่ได้',allDeleted:'ลบข้อมูลทั้งหมดแล้ว',confirmDeleteOne:'ลบรายการนี้ใช่ไหม?',requiredMale:'กรุณากรอก Waist, Neck และตั้งค่า Height',requiredFemale:'กรุณากรอก Waist, Neck, Hip และตั้งค่า Height',navyUsed:'ใช้คำนวณ Body Fat',trackingOnly:'ใช้ติดตามสัดส่วน',guide:{neck:'พันสายวัดรอบคอใต้กล่องเสียงเล็กน้อย ให้สายวัดแนบผิวแต่ไม่รัดแน่น และวางเอียงลงเล็กน้อยทางด้านหน้า',chest:'วัดรอบอกบริเวณที่กว้างที่สุด ให้สายวัดขนานกับพื้น หายใจตามปกติและไม่เกร็งอก',waist:'ผู้ชาย: วัดรอบท้องระดับสะดือสำหรับสูตร Navy • ผู้หญิง: วัดบริเวณเอวที่คอดที่สุด โดยให้สายวัดขนานกับพื้น',hip:'วัดรอบส่วนที่กว้างที่สุดของสะโพกและก้น ให้สายวัดขนานกับพื้น ใช้ในสูตร Navy สำหรับผู้หญิง',arm:'วัดรอบต้นแขนบริเวณที่ใหญ่ที่สุด ปล่อยแขนสบาย ไม่เกร็งกล้ามเนื้อ และใช้จุดเดิมทุกครั้ง',thigh:'วัดรอบต้นขาบริเวณที่ใหญ่ที่สุด และใช้จุดเดิมทุกครั้งเพื่อเทียบแนวโน้มได้แม่นขึ้น'}},
    en:{appTitle:'Progress Tracker',install:'Install',bodyFat:'BODY FAT',bodyFatTitle:'Body Fat',weight:'Weight',waist:'Waist',leanMass:'Lean mass',progress:'Progress',addMeasurement:'+ Add measurement',new:'NEW',measurement:'Measurement',measurementGuide:'Measurement Guide',guideSubtitle:'Tap a body part, then drag the model to rotate it.',dragRotate:'Drag to rotate',neck:'Neck',chest:'Chest',hip:'Hip',arm:'Arm',thigh:'Thigh',where:'Where?',date:'Date',estimatedBodyFat:'Estimated body fat',fatMass:'Fat mass',formulaNote:'Body fat is an estimate using the U.S. Navy formula. Height is entered in cm; circumferences are entered in inches.',saveMeasurement:'Save measurement',your:'YOUR',history:'History',charts:'Charts',app:'APP',settings:'Settings',height:'Height',sexFormula:'Sex for U.S. Navy formula',male:'Male',female:'Female',saveSettings:'Save settings',data:'Data',exportBackup:'Export backup',importBackup:'Import backup',deleteAll:'Delete all data',privacy:'Privacy',privacyNote:'Measurements are stored locally on this device and are not sent to GitHub or an app server.',home:'Home',editMeasurement:'Edit measurement',cancel:'Cancel',save:'Save',noData:'No data yet',firstEntry:'First entry saved',sinceFirst:'since first entry',emptyHistory:'No data yet<br>Tap + to add your first measurement',edit:'Edit',delete:'Delete',chartNoData:'No data for this chart yet',inSelectedRange:'in selected range',heightRequired:'Please enter your height',settingsSaved:'Settings saved',importSuccess:'Data imported successfully',invalidBackup:'Invalid backup file',confirmDeleteAll:'Delete all measurements? This cannot be undone.',allDeleted:'All data deleted',confirmDeleteOne:'Delete this entry?',requiredMale:'Enter Waist, Neck and set Height first',requiredFemale:'Enter Waist, Neck, Hip and set Height first',navyUsed:'Used for Body Fat',trackingOnly:'Tracking only',guide:{neck:'Wrap the tape just below the larynx. Keep it snug without compressing the skin, with a slight downward angle at the front.',chest:'Measure around the fullest part of the chest. Keep the tape level with the floor and breathe normally without flexing.',waist:'Men: measure the abdomen at navel level for the Navy formula. Women: measure the natural waist at its narrowest point, keeping the tape level.',hip:'Measure around the widest part of the hips and buttocks, keeping the tape level. This is used in the Navy formula for women.',arm:'Measure around the largest part of the upper arm with the arm relaxed. Use the same spot each time.',thigh:'Measure around the largest part of the thigh. Use the same landmark each time for consistent trend tracking.'}}
  };

  const t=key=>key.split('.').reduce((o,k)=>o?.[k],TEXT[lang])??key;

  function migrate(){
    const version=localStorage.getItem(UNIT_VERSION_KEY);
    if(version==='in-v2'){
      if(Number(settings.height)>0&&Number(settings.height)<100) settings.height=+(Number(settings.height)*2.54).toFixed(1);
    }else if(version!=='mixed-v3'){
      measurements=measurements.map(m=>{
        const copy={...m};
        ['waist','neck','hip','chest','arm','thigh'].forEach(k=>{if(Number(copy[k])>0)copy[k]=+(Number(copy[k])*IN_PER_CM).toFixed(2)});
        return copy;
      });
    }
    saveSettingsData(); saveMeasurements(); localStorage.setItem(UNIT_VERSION_KEY,'mixed-v3');
  }
  migrate();

  calcBodyFat=function({sex,height,waist,neck,hip}){
    if(!height||!waist||!neck)return null;
    const h=Number(height)*IN_PER_CM,w=Number(waist),n=Number(neck); let bf;
    if(sex==='female'){
      if(!hip)return null; const x=w+Number(hip)-n; if(x<=0)return null;
      bf=163.205*Math.log10(x)-97.684*Math.log10(h)-78.387;
    }else{
      const x=w-n;if(x<=0)return null;
      bf=86.010*Math.log10(x)-70.041*Math.log10(h)+36.76;
    }
    return Number.isFinite(bf)?Math.max(2,Math.min(75,bf)):null;
  };

  metricMeta=function(metric){return{weight:{label:t('weight'),unit:'kg'},bodyFat:{label:t('bodyFatTitle'),unit:'%'},waist:{label:t('waist'),unit:'in'},chest:{label:t('chest'),unit:'in'},arm:{label:t('arm'),unit:'in'},thigh:{label:t('thigh'),unit:'in'}}[metric]};

  renderHome=function(){
    const l=latest();
    if(!l){$('heroBodyFat').textContent='--%';$('heroBodyFatChange').textContent=t('noData');$('homeWeight').textContent='-- kg';$('homeWaist').textContent='-- in';$('homeBmi').textContent='--';$('homeLeanMass').textContent='-- kg'}
    else{
      $('heroBodyFat').textContent=l.bodyFat!=null?`${fmt(l.bodyFat)}%`:'--%';
      const arr=sorted().map(enrich).filter(x=>x.bodyFat!=null);
      if(arr.length>=2){const diff=arr[arr.length-1].bodyFat-arr[0].bodyFat;$('heroBodyFatChange').textContent=`${diff>0?'+':''}${fmt(diff)}% ${t('sinceFirst')}`}else $('heroBodyFatChange').textContent=t('firstEntry');
      $('homeWeight').textContent=`${fmt(l.weight)} kg`;$('homeWaist').textContent=`${fmt(l.waist)} in`;$('homeBmi').textContent=fmt(l.bmi);$('homeLeanMass').textContent=l.leanMass!=null?`${fmt(l.leanMass)} kg`:'-- kg';
    }
    drawChart($('homeChart'),$('homeChartMetric').value,90);
  };

  renderHistory=function(){
    const list=$('historyList'),arr=sorted().reverse().map(enrich);
    if(!arr.length){list.innerHTML=`<div class="empty">${t('emptyHistory')}</div>`;return}
    const locale=lang==='th'?'th-TH':'en-US';
    list.innerHTML=arr.map(m=>`<div class="history-item"><div class="history-top"><div><div class="history-date">${new Date(m.date+'T00:00:00').toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric'})}</div><div class="history-meta">${t('waist')} ${fmt(m.waist)} in · ${t('neck')} ${fmt(m.neck)} in${m.chest?` · ${t('chest')} ${fmt(m.chest)} in`:''}</div></div><div class="history-values"><div><strong>${fmt(m.weight)}</strong><span>kg</span></div><div><strong>${m.bodyFat!=null?fmt(m.bodyFat):'--'}</strong><span>% fat</span></div></div></div><div class="history-actions"><button class="secondary" onclick="openEdit('${m.id}')">${t('edit')}</button><button class="danger" onclick="deleteMeasurement('${m.id}')">${t('delete')}</button></div></div>`).join('');
  };

  drawChart=function(canvas,metric,range){
    if(!canvas)return;const ctx=canvas.getContext('2d'),dpr=window.devicePixelRatio||1,cssW=canvas.clientWidth||320,cssH=Number(canvas.getAttribute('height'))||220;
    canvas.width=cssW*dpr;canvas.height=cssH*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssW,cssH);
    const pts=filterByRange(sorted(),range).map(m=>({date:m.date,value:getMetricValue(m,metric)})).filter(x=>Number.isFinite(x.value));ctx.font='12px -apple-system, sans-serif';ctx.fillStyle='#9a9aa1';
    if(!pts.length){ctx.textAlign='center';ctx.fillText(t('chartNoData'),cssW/2,cssH/2);return}
    const pad={l:44,r:14,t:20,b:34},values=pts.map(p=>p.value);let min=Math.min(...values),max=Math.max(...values);if(min===max){min-=1;max+=1}const margin=(max-min)*.15;min-=margin;max+=margin;
    const x=i=>pad.l+(pts.length===1?(cssW-pad.l-pad.r)/2:i*(cssW-pad.l-pad.r)/(pts.length-1)),y=v=>pad.t+(max-v)*(cssH-pad.t-pad.b)/(max-min);
    ctx.strokeStyle='#2a2a2e';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<4;i++){const yy=pad.t+i*(cssH-pad.t-pad.b)/3;ctx.moveTo(pad.l,yy);ctx.lineTo(cssW-pad.r,yy);const val=max-i*(max-min)/3;ctx.fillStyle='#9a9aa1';ctx.textAlign='right';ctx.fillText(val.toFixed(1),pad.l-8,yy+4)}ctx.stroke();
    ctx.strokeStyle='#f5f5f7';ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(x(i),y(p.value)):ctx.lineTo(x(i),y(p.value)));ctx.stroke();ctx.fillStyle='#f5f5f7';pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(x(i),y(p.value),4,0,Math.PI*2);ctx.fill()});
    const locale=lang==='th'?'th-TH':'en-US',first=pts[0],last=pts[pts.length-1];ctx.fillStyle='#9a9aa1';ctx.textAlign='left';ctx.fillText(new Date(first.date+'T00:00:00').toLocaleDateString(locale,{day:'numeric',month:'short'}),pad.l,cssH-10);if(pts.length>1){ctx.textAlign='right';ctx.fillText(new Date(last.date+'T00:00:00').toLocaleDateString(locale,{day:'numeric',month:'short'}),cssW-pad.r,cssH-10)}
  };

  renderMainChart=function(){
    const metric=$('chartMetric').value,range=$('chartRange').value;drawChart($('mainChart'),metric,range);
    const arr=filterByRange(sorted(),range).map(m=>({date:m.date,value:getMetricValue(m,metric)})).filter(x=>Number.isFinite(x.value)),meta=metricMeta(metric);
    if(arr.length>=2){const diff=arr[arr.length-1].value-arr[0].value;$('chartSummary').textContent=`${meta.label}: ${diff>0?'+':''}${fmt(diff)} ${meta.unit} ${t('inSelectedRange')}`}
    else if(arr.length===1)$('chartSummary').textContent=`${meta.label}: ${fmt(arr[0].value)} ${meta.unit}`;else $('chartSummary').textContent=t('noData');
  };

  deleteMeasurement=function(id){if(!confirm(t('confirmDeleteOne')))return;measurements=measurements.filter(x=>x.id!==id);saveMeasurements();renderHistory();renderHome()};
  window.deleteMeasurement=deleteMeasurement;

  function updateGuide(part){
    selectedGuide=part||'waist';guide3d?.setPart(selectedGuide);
    document.querySelectorAll('.guide-chip').forEach(b=>b.classList.toggle('active',b.dataset.guide===selectedGuide));
    if($('guidePartTitle'))$('guidePartTitle').textContent=t(selectedGuide);
    if($('guidePartText'))$('guidePartText').textContent=t(`guide.${selectedGuide}`);
    if($('guideUnitTag'))$('guideUnitTag').textContent='in';
    const used=['neck','waist'].includes(selectedGuide)||(selectedGuide==='hip'&&settings.sex==='female');if($('guideUseTag'))$('guideUseTag').textContent=t(used?'navyUsed':'trackingOnly');
  }

  function applyLanguage(){
    document.documentElement.lang=lang;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const value=t(el.dataset.i18n);if(typeof value==='string')el.textContent=value});
    $('langToggle').textContent=lang==='th'?'EN':'TH';
    renderHome();renderHistory();renderMainChart();updateGuide(selectedGuide);
  }

  guide3d=window.BodyGuide3D?.create($('bodyGuideCanvas'))||null;
  document.querySelectorAll('.guide-chip').forEach(btn=>btn.addEventListener('click',()=>updateGuide(btn.dataset.guide)));
  document.querySelectorAll('[data-show-guide]').forEach(btn=>btn.addEventListener('click',()=>{updateGuide(btn.dataset.showGuide);$('bodyGuideCanvas')?.scrollIntoView({behavior:'smooth',block:'center'})}));
  ['waist','neck','hip','chest','arm','thigh'].forEach(id=>$(id)?.addEventListener('focus',()=>updateGuide(id)));
  document.querySelectorAll('[data-page="add"],[data-go="add"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>guide3d?.reset(),20)));

  $('langToggle').addEventListener('click',()=>{lang=lang==='th'?'en':'th';localStorage.setItem(LANG_KEY,lang);applyLanguage()});
  $('homeChartMetric').addEventListener('change',renderHome);$('chartMetric').addEventListener('change',renderMainChart);$('chartRange').addEventListener('change',renderMainChart);

  $('saveSettings').addEventListener('click',e=>{
    e.stopImmediatePropagation();e.preventDefault();const height=num($('height').value);if(!height){alert(t('heightRequired'));return}
    settings={height,sex:$('sex').value};saveSettingsData();updateFemaleFields();updateGuide(selectedGuide);alert(t('settingsSaved'));renderHome();
  },true);

  $('measurementForm').addEventListener('submit',e=>{
    const test=enrich({weight:num($('weight').value),waist:num($('waist').value),neck:num($('neck').value),hip:num($('hip').value)});
    if(test.bodyFat==null){e.preventDefault();e.stopImmediatePropagation();alert(settings.sex==='female'?t('requiredFemale'):t('requiredMale'))}
  },true);

  $('deleteAllBtn').addEventListener('click',e=>{
    e.stopImmediatePropagation();e.preventDefault();if(!confirm(t('confirmDeleteAll')))return;measurements=[];saveMeasurements();renderHome();renderHistory();alert(t('allDeleted'));
  },true);

  $('importInput').addEventListener('change',async e=>{
    e.stopImmediatePropagation();const file=e.target.files?.[0];if(!file)return;
    try{const data=JSON.parse(await file.text());if(!Array.isArray(data.measurements))throw new Error('invalid');measurements=data.measurements;settings=data.settings||settings;if(Number(settings.height)>0&&Number(settings.height)<100)settings.height=+(Number(settings.height)*2.54).toFixed(1);saveMeasurements();saveSettingsData();localStorage.setItem(UNIT_VERSION_KEY,'mixed-v3');alert(t('importSuccess'));renderSettings();applyLanguage()}catch{alert(t('invalidBackup'))}e.target.value='';
  },true);

  window.addEventListener('resize',()=>{if($('homePage').classList.contains('active'))renderHome();if($('chartsPage').classList.contains('active'))renderMainChart()});
  renderSettings();applyLanguage();updateGuide('waist');
})();
