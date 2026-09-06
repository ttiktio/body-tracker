(function(){
  function create(canvas){
    if(!canvas) return null;
    const ctx=canvas.getContext('2d');
    let yaw=-0.28;
    let selected='waist';
    let dragging=false;
    let lastX=0;
    let raf=0;

    const zones={
      neck:{y:2.88,rx:.34,rz:.30,x:0},
      chest:{y:2.05,rx:1.02,rz:.55,x:0},
      waist:{y:.92,rx:.78,rz:.44,x:0},
      hip:{y:.05,rx:.92,rz:.52,x:0},
      arm:{y:1.45,rx:.25,rz:.25,x:1.28},
      thigh:{y:-1.12,rx:.36,rz:.36,x:.50}
    };

    function resize(){
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const rect=canvas.getBoundingClientRect();
      canvas.width=Math.max(1,Math.round(rect.width*dpr));
      canvas.height=Math.max(1,Math.round(rect.height*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
      draw();
    }

    function project(x,y,z,w,h){
      const c=Math.cos(yaw), s=Math.sin(yaw);
      const xr=x*c+z*s;
      const zr=-x*s+z*c;
      const p=1/(1-zr*.055);
      const scale=Math.min(w/4.8,h/8.7)*p;
      return {x:w/2+xr*scale,y:h*.49-y*scale,scale,z:zr};
    }

    function projectedRadius(rx,rz,scale){
      const c=Math.cos(yaw),s=Math.sin(yaw);
      return Math.sqrt((rx*c)*(rx*c)+(rz*s)*(rz*s))*scale;
    }

    function limb(a,b,r,w,h,shade){
      const p1=project(a[0],a[1],a[2],w,h), p2=project(b[0],b[1],b[2],w,h);
      const z=(p1.z+p2.z)/2;
      return {z,draw(){
        const grad=ctx.createLinearGradient(p1.x,p1.y,p2.x,p2.y);
        grad.addColorStop(0,shade[0]); grad.addColorStop(.5,shade[1]); grad.addColorStop(1,shade[0]);
        ctx.strokeStyle=grad; ctx.lineWidth=r*((p1.scale+p2.scale)/2)*2; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
      }};
    }

    function ellipsoid(x,y,z,rx,ry,rz,w,h,shade){
      const p=project(x,y,z,w,h);
      const rw=projectedRadius(rx,rz,p.scale), rh=ry*p.scale;
      return {z:p.z,draw(){
        const grad=ctx.createRadialGradient(p.x-rw*.28,p.y-rh*.24,1,p.x,p.y,Math.max(rw,rh));
        grad.addColorStop(0,shade[1]); grad.addColorStop(.72,shade[0]); grad.addColorStop(1,shade[2]);
        ctx.fillStyle=grad; ctx.beginPath(); ctx.ellipse(p.x,p.y,rw,rh,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1; ctx.stroke();
      }};
    }

    function drawZone(w,h){
      const z=zones[selected]||zones.waist;
      const p=project(z.x,z.y,0,w,h);
      const rx=projectedRadius(z.rx,z.rz,p.scale);
      const ry=Math.max(5,z.rz*p.scale*.34);
      ctx.save();
      ctx.shadowColor='rgba(255,255,255,.9)'; ctx.shadowBlur=15;
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
      ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.ellipse(p.x,p.y,rx+6,ry+4,0,0,Math.PI*2); ctx.stroke();
      ctx.restore();
    }

    function draw(){
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        const w=canvas.clientWidth||320, h=canvas.clientHeight||430;
        ctx.clearRect(0,0,w,h);
        const glow=ctx.createRadialGradient(w/2,h*.46,10,w/2,h*.46,Math.min(w,h)*.58);
        glow.addColorStop(0,'rgba(255,255,255,.055)'); glow.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);

        const skin=['#75757c','#a5a5ad','#48484e'];
        const parts=[];
        parts.push(ellipsoid(0,3.72,0,.47,.58,.43,w,h,skin));
        parts.push(ellipsoid(0,3.02,0,.29,.35,.27,w,h,skin));
        parts.push(ellipsoid(0,1.75,0,1.02,1.35,.56,w,h,skin));
        parts.push(ellipsoid(0,.20,0,.88,.70,.52,w,h,skin));
        parts.push(limb([-1.03,2.28,0],[-1.32,.72,0],.23,w,h,skin));
        parts.push(limb([1.03,2.28,0],[1.32,.72,0],.23,w,h,skin));
        parts.push(limb([-1.32,.72,0],[-1.26,-.48,.02],.19,w,h,skin));
        parts.push(limb([1.32,.72,0],[1.26,-.48,.02],.19,w,h,skin));
        parts.push(limb([-.48,-.18,0],[-.50,-2.10,.02],.31,w,h,skin));
        parts.push(limb([.48,-.18,0],[.50,-2.10,.02],.31,w,h,skin));
        parts.push(limb([-.50,-2.05,.02],[-.48,-3.55,.10],.23,w,h,skin));
        parts.push(limb([.50,-2.05,.02],[.48,-3.55,.10],.23,w,h,skin));
        parts.sort((a,b)=>a.z-b.z).forEach(p=>p.draw());
        drawZone(w,h);
      });
    }

    function pointerDown(e){dragging=true;lastX=e.clientX;canvas.setPointerCapture?.(e.pointerId)}
    function pointerMove(e){if(!dragging)return; const dx=e.clientX-lastX;lastX=e.clientX;yaw+=dx*.012;draw()}
    function pointerUp(){dragging=false}
    canvas.addEventListener('pointerdown',pointerDown);
    canvas.addEventListener('pointermove',pointerMove);
    canvas.addEventListener('pointerup',pointerUp);
    canvas.addEventListener('pointercancel',pointerUp);
    canvas.addEventListener('dblclick',()=>{yaw=-.28;draw()});
    window.addEventListener('resize',resize);

    const ro='ResizeObserver' in window?new ResizeObserver(resize):null;
    ro?.observe(canvas);
    resize();

    return {
      setPart(part){selected=zones[part]?part:'waist';draw()},
      rotate(delta){yaw+=delta;draw()},
      reset(){yaw=-.28;draw()},
      destroy(){ro?.disconnect();window.removeEventListener('resize',resize)}
    };
  }
  window.BodyGuide3D={create};

  // Load the V3 enhancement only after app.js has initialized its base globals.
  document.addEventListener('DOMContentLoaded',()=>{
    if(document.querySelector('script[data-body-v3]')) return;
    const script=document.createElement('script');
    script.src='./units.js';
    script.dataset.bodyV3='true';
    document.body.appendChild(script);
  });
})();
