// js/app.js
// Main application controller — wires all modules together.

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  let imageBase64 = null;
  let imageMediaType = null;
  let selectedMode = 'full';
  let currentResult = null;
  let currentThumb = null;
  let currentFileName = null;
  let currentFileSize = null;
  let selectedHistoryId = null;

  // ── DOM refs ───────────────────────────────────────────
  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const previewRow     = document.getElementById('previewRow');
  const previewImg     = document.getElementById('previewImg');
  const previewName    = document.getElementById('previewName');
  const previewSize    = document.getElementById('previewSize');
  const removeBtn      = document.getElementById('removeBtn');
  const analyzeBtn     = document.getElementById('analyzeBtn');
  const btnSpinner     = document.getElementById('btnSpinner');
  const btnIcon        = document.getElementById('btnIcon');
  const btnLabel       = document.getElementById('btnLabel');
  const errorMsg       = document.getElementById('errorMsg');
  const resultsContainer = document.getElementById('resultsContainer');
  const apiKeyInput    = document.getElementById('apiKey');
  const toggleKey      = document.getElementById('toggleKey');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // ── Init ───────────────────────────────────────────────
  // Restore saved API key
  const savedKey = localStorage.getItem('ux_critic_api_key');
  if (savedKey) apiKeyInput.value = savedKey;

  apiKeyInput.addEventListener('input', () => {
    localStorage.setItem('ux_critic_api_key', apiKeyInput.value.trim());
    updateAnalyzeBtn();
  });

  // ── Navigation ─────────────────────────────────────────
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
      });
      const target = document.getElementById('view-' + view);
      if (target) { target.classList.remove('hidden'); target.classList.add('active'); }

      if (view === 'history') renderHistory();
      if (view === 'compare') renderCompareView();
    });
  });

  // ── Upload ─────────────────────────────────────────────
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  removeBtn.addEventListener('click', resetUpload);

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      imageBase64 = dataUrl.split(',')[1];
      imageMediaType = file.type;
      currentThumb = dataUrl;
      currentFileName = file.name;
      currentFileSize = (file.size / 1024).toFixed(0) + ' KB';

      previewImg.src = dataUrl;
      previewName.textContent = file.name;
      previewSize.textContent = currentFileSize;
      previewRow.classList.remove('hidden');
      dropZone.querySelector('.upload-inner').style.display = 'none';
      dropZone.style.padding = '0';
      dropZone.querySelector('input').style.display = 'none';

      resultsContainer.classList.add('hidden');
      resultsContainer.innerHTML = '';
      errorMsg.classList.add('hidden');
      currentResult = null;

      updateAnalyzeBtn();
    };
    reader.readAsDataURL(file);
  }

  function resetUpload() {
    imageBase64 = null;
    imageMediaType = null;
    currentThumb = null;
    currentFileName = null;
    currentResult = null;
    previewRow.classList.add('hidden');
    dropZone.querySelector('.upload-inner').style.display = '';
    dropZone.style.padding = '';
    dropZone.querySelector('input').style.display = '';
    resultsContainer.classList.add('hidden');
    resultsContainer.innerHTML = '';
    errorMsg.classList.add('hidden');
    fileInput.value = '';
    updateAnalyzeBtn();
  }

  // ── Mode selection ─────────────────────────────────────
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedMode = card.dataset.mode;
    });
  });

  // ── API key toggle ─────────────────────────────────────
  toggleKey.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
  });

  // ── Analyze button state ───────────────────────────────
  function updateAnalyzeBtn() {
    analyzeBtn.disabled = !imageBase64 || !apiKeyInput.value.trim();
  }

  // ── Analyze ────────────────────────────────────────────
  analyzeBtn.addEventListener('click', runAnalysis);

  async function runAnalysis() {
    if (!imageBase64 || !apiKeyInput.value.trim()) return;
    setLoading(true);
    errorMsg.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    resultsContainer.innerHTML = '';

    const apiKey = apiKeyInput.value.trim();
    const prompt = PROMPTS[selectedMode];

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: imageMediaType, data: imageBase64 } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error?.message || `API error ${res.status}`);

      const raw = responseData.content.map(b => b.text || '').join('');
      const clean = raw.replace(/```json|```/g, '').trim();
      currentResult = JSON.parse(clean);

      resultsContainer.classList.remove('hidden');
      renderResults(currentResult, resultsContainer, { showSave: true });

    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    } finally {
      setLoading(false);
    }
  }

  function setLoading(on) {
    analyzeBtn.disabled = on;
    btnSpinner.classList.toggle('hidden', !on);
    btnIcon.classList.toggle('hidden', on);
    btnLabel.textContent = on ? 'Analyzing…' : 'Analyze screenshot';
  }

  // ── Save to history (called from results.js rendered HTML) ──
  window.triggerSave = function () {
    if (!currentResult) return;
    const entry = {
      id: Storage.generateId(),
      name: currentFileName || 'Screenshot',
      size: currentFileSize || '',
      mode: selectedMode,
      thumb: currentThumb,
      data: currentResult,
      timestamp: Date.now()
    };
    Storage.save(entry);
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = '✓ Saved';
    }
  };

  // ── History view ───────────────────────────────────────
  function renderHistory() {
    const list = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    const detail = document.getElementById('historyDetail');
    const entries = Storage.getAll();

    detail.classList.add('hidden');
    detail.innerHTML = '';
    selectedHistoryId = null;

    if (!entries.length) {
      list.innerHTML = '';
      list.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    list.classList.remove('hidden');

    list.innerHTML = entries.map(e => {
      const s = scoreStyle(e.data.overallScore);
      return `<div class="history-item" data-id="${e.id}" onclick="openHistoryItem('${e.id}')">
        <img class="history-thumb" src="${e.thumb}" alt="" />
        <div class="history-info">
          <div class="history-name">${escHtml(e.name)}</div>
          <div class="history-meta">${e.mode} · ${formatDate(e.timestamp)}</div>
        </div>
        <div class="history-score" style="color:${s.color};background:${s.bg};border-color:${s.border}">${e.data.overallScore}/10</div>
        <button class="history-del" onclick="deleteHistory(event,'${e.id}')" aria-label="Delete">✕</button>
      </div>`;
    }).join('');
  }

  window.openHistoryItem = function (id) {
    const entries = Storage.getAll();
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('selected'));
    const el = document.querySelector(`.history-item[data-id="${id}"]`);
    if (el) el.classList.add('selected');

    const detail = document.getElementById('historyDetail');
    detail.classList.remove('hidden');
    detail.innerHTML = `
      <div class="history-detail">
        <button class="back-btn" onclick="backToList()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to history
        </button>
        <div id="historyResultDetail"></div>
      </div>`;
    renderCompact(entry.data, document.getElementById('historyResultDetail'));
  };

  window.backToList = function () {
    const detail = document.getElementById('historyDetail');
    detail.classList.add('hidden');
    detail.innerHTML = '';
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('selected'));
  };

  window.deleteHistory = function (e, id) {
    e.stopPropagation();
    Storage.delete(id);
    renderHistory();
    refreshCompareSelects();
  };

  // ── Compare view ───────────────────────────────────────
  function renderCompareView() {
    refreshCompareSelects();
    renderCompare(null, null);
  }

  function refreshCompareSelects() {
    const entries = Storage.getAll();
    const selA = document.getElementById('selectA');
    const selB = document.getElementById('selectB');
    if (!selA || !selB) return;

    const valA = selA.value;
    const valB = selB.value;

    const opts = entries.map(e =>
      `<option value="${e.id}">${escHtml(e.name)} — ${e.mode} (${e.data.overallScore}/10)</option>`
    ).join('');

    selA.innerHTML = `<option value="">— choose analysis —</option>${opts}`;
    selB.innerHTML = `<option value="">— choose analysis —</option>${opts}`;
    selA.value = valA;
    selB.value = valB;
  }

  document.getElementById('selectA').addEventListener('change', doCompare);
  document.getElementById('selectB').addEventListener('change', doCompare);

  function doCompare() {
    const idA = document.getElementById('selectA').value;
    const idB = document.getElementById('selectB').value;
    if (!idA || !idB || idA === idB) {
      renderCompare(null, null);
      return;
    }
    const entries = Storage.getAll();
    const entryA = entries.find(e => e.id === idA);
    const entryB = entries.find(e => e.id === idB);
    renderCompare(entryA, entryB);
  }

  // ── Clear history ──────────────────────────────────────
  clearHistoryBtn.addEventListener('click', () => {
    if (!confirm('Clear all saved analyses? This cannot be undone.')) return;
    Storage.clear();
    renderHistory();
    refreshCompareSelects();
  });

  // ── Shared helpers exposed to inline HTML ──────────────
  window.toggleSection = toggleSection;

})();
