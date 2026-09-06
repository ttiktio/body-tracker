// The supplied anatomy illustration is displayed semitransparently. Landmarks
// are mapped to that exact image, independent of viewport size and zoom.
(function () {
  const $ = id => document.getElementById(id);
  const guide = $('anatomyGuide'), figure = $('anatomyFigure'), image = $('anatomyImage');
  const t = key => window.bodyTrackerText?.(key) || key;
  const W = 1008, H = 1792;
  const zones = {
    neck: { x: 510, y: 281, rx: 58, ry: 13 },
    chest: { x: 502, y: 436, rx: 167, ry: 18 },
    waist: { x: 497, y: 677, rx: 151, ry: 17 },
    hip: { x: 500, y: 830, rx: 179, ry: 20 },
    arm: { x: 304, y: 482, rx: 37, ry: 11, angle: 12 },
    thigh: { x: 406, y: 1055, rx: 67, ry: 14 }
  };
  let zoom = 1, status = 'loading';
  let selected = guide.dataset.part || 'waist', sex = guide.dataset.sex || 'male';
  function landmark(part) {
    const zone = { ...zones[part] };
    if (part === 'waist' && sex === 'female') { zone.y = 615; zone.rx = 145; }
    return zone;
  }
  const set = (id, attrs) => Object.entries(attrs).forEach(([key, value]) => $(id).setAttribute(key, String(value)));
  function updateZoom() {
    const zone = landmark(selected);
    figure.style.transformOrigin = `${zone.x / W * 100}% ${zone.y / H * 100}%`;
    figure.style.transform = `scale(${zoom})`;
    $('anatomyZoomReset').textContent = `${Number(zoom.toFixed(2))}×`;
    $('anatomyZoomIn').disabled = zoom >= 2;
    $('anatomyZoomOut').disabled = zoom <= 1;
  }
  function showPart(part) {
    selected = zones[part] ? part : 'waist';
    const z = landmark(selected), rotation = `rotate(${z.angle || 0} ${z.x} ${z.y})`;
    const ellipse = { cx: z.x, cy: z.y, rx: z.rx, ry: z.ry, transform: rotation };
    set('tapeBack', ellipse); set('tapeBand', ellipse);
    set('tapeFront', { d: `M ${z.x-z.rx} ${z.y} A ${z.rx} ${z.ry} 0 0 0 ${z.x+z.rx} ${z.y}`, transform: rotation });
    const left = selected === 'arm';
    const start = z.x + (left ? -z.rx : z.rx), end = left ? 183 : 795;
    set('tapeLeader', { d: `M ${start} ${z.y} L ${end} ${z.y}` });
    set('tapeDot', { cx: start, cy: z.y });
    const callout = $('anatomyCallout');
    callout.textContent = t(selected);
    callout.style.top = `${z.y/H*100}%`;
    callout.style.left = `${end/W*100}%`;
    callout.classList.toggle('callout-left', left);
    document.querySelectorAll('.anatomy-hotspot').forEach(button => {
      const zone = landmark(button.dataset.part);
      button.style.left = `${(zone.x-zone.rx)/W*100}%`;
      button.style.top = `${(zone.y-27)/H*100}%`;
      button.style.width = `${zone.rx*2/W*100}%`;
      button.style.height = `${54/H*100}%`;
      button.setAttribute('aria-label', t(button.dataset.part));
      button.setAttribute('aria-pressed', String(button.dataset.part === selected));
    });
    updateZoom();
  }
  for (const part of Object.keys(zones)) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'anatomy-hotspot'; button.dataset.part = part;
    button.addEventListener('click', () => window.selectBodyGuide(part));
    $('anatomyHotspots').appendChild(button);
  }
  function setStatus(value) {
    status = value;
    $('modelStatus').classList.toggle('hidden', value === 'ready');
    $('modelStatus').dataset.error = String(value === 'error');
    $('modelStatusText').textContent = t(value === 'error' ? 'modelError' : 'loadingModel');
    $('retryModel').classList.toggle('hidden', value !== 'error');
    $('anatomyOverlay').classList.toggle('hidden', value !== 'ready');
    $('anatomyHotspots').classList.toggle('hidden', value !== 'ready');
    $('anatomyCallout').classList.toggle('hidden', value !== 'ready');
  }
  image.addEventListener('load', () => setStatus('ready'));
  image.addEventListener('error', () => setStatus('error'));
  $('retryModel').addEventListener('click', () => {
    setStatus('loading');
    image.src = `./assets/anatomy-reference.jpg?retry=${Date.now()}`;
  });
  $('anatomyZoomIn').addEventListener('click', () => { zoom = Math.min(2, zoom+.25); updateZoom(); });
  $('anatomyZoomOut').addEventListener('click', () => { zoom = Math.max(1, zoom-.25); updateZoom(); });
  $('anatomyZoomReset').addEventListener('click', () => { zoom = 1; updateZoom(); });
  document.addEventListener('body-guide-change', event => { sex = event.detail.sex; showPart(event.detail.part); });
  document.addEventListener('body-language-change', () => { setStatus(status); showPart(selected); });
  setStatus(image.complete ? (image.naturalWidth > 0 ? 'ready' : 'error') : 'loading');
  showPart(selected);
  if (!measurements.length) showPage('add');
})();
