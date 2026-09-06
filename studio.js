// Keep tracking and translations available even if WebGL or model loading fails.
(function () {
  let guide = null, loading = false, status = 'loading', autoRotate = false;
  const canvas = document.getElementById('bodyGuideCanvas');
  const overlay = document.getElementById('modelStatus');
  const retry = document.getElementById('retryModel');
  const t = key => window.bodyTrackerText?.(key) || key;

  function setStatus(value) {
    status = value;
    overlay.classList.toggle('hidden', value === 'ready');
    overlay.dataset.error = String(value === 'error');
    document.getElementById('modelStatusText').textContent = t(value === 'error' ? 'modelError' : 'loadingModel');
    retry.classList.toggle('hidden', value !== 'error');
    document.querySelectorAll('.view-controls button').forEach(button => { button.disabled = value !== 'ready'; });
  }
  async function loadGuide() {
    if (loading || guide || !document.getElementById('addPage').classList.contains('active')) return;
    loading = true; setStatus('loading');
    try {
      const module = await import('./body3d.js?v=4');
      guide = await module.create(canvas, {
        sex: canvas.dataset.sex || 'male',
        onSelect: part => window.selectBodyGuide(part),
        onStatus: setStatus
      });
      guide.setPart(canvas.dataset.part || 'waist');
      guide.setSex(canvas.dataset.sex || 'male');
      setStatus('ready');
    } catch (error) {
      console.error('Body model could not load:', error);
      guide?.destroy(); guide = null; setStatus('error');
    } finally { loading = false; }
  }
  retry.addEventListener('click', () => { guide?.destroy(); guide = null; loadGuide(); });
  document.addEventListener('body-guide-change', event => { guide?.setSex(event.detail.sex); guide?.setPart(event.detail.part); });
  document.addEventListener('body-language-change', () => setStatus(status));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    autoRotate = false; guide?.setAutoRotate(false);
    document.getElementById('autoRotate').setAttribute('aria-pressed', 'false');
    guide?.setView(button.dataset.view);
    document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button));
  }));
  document.getElementById('autoRotate').addEventListener('click', event => {
    autoRotate = !autoRotate; guide?.setAutoRotate(autoRotate);
    event.currentTarget.setAttribute('aria-pressed', String(autoRotate));
    document.querySelectorAll('[data-view]').forEach(button => button.classList.remove('active'));
  });
  canvas.addEventListener('pointerdown', () => document.querySelectorAll('[data-view]').forEach(button => button.classList.remove('active')));
  const pageObserver = new MutationObserver(loadGuide);
  pageObserver.observe(document.getElementById('addPage'), { attributes: true, attributeFilter: ['class'] });
  // First-time users can begin measuring immediately; existing users keep their dashboard.
  if (!measurements.length) showPage('add');
  loadGuide();
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    guide?.destroy(); guide = null; pageObserver.disconnect();
  });
})();
