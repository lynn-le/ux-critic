// js/results.js
// Renders structured API results into HTML.

function scoreStyle(score) {
  if (score >= 8) return { color: '#16a085', bg: 'rgba(22,160,133,0.1)', border: 'rgba(22,160,133,0.3)' };
  if (score >= 5) return { color: '#e67e22', bg: 'rgba(230,126,34,0.1)', border: 'rgba(230,126,34,0.3)' };
  return { color: '#c0392b', bg: 'rgba(192,57,43,0.12)', border: 'rgba(192,57,43,0.3)' };
}

function sevClass(s) {
  const map = { critical: 'sev-critical', major: 'sev-major', minor: 'sev-minor', positive: 'sev-positive' };
  return map[s] || 'sev-minor';
}

function renderResults(data, container, { showSave = true, savedId = null } = {}) {
  const style = scoreStyle(data.overallScore);
  let html = `
    <div class="results-header">
      <div class="results-title">Critique results</div>
      <div class="score-badge" style="color:${style.color};background:${style.bg};border-color:${style.border}">
        ${data.overallScore}/10
      </div>
    </div>`;

  (data.sections || []).forEach((sec, i) => {
    const count = (sec.issues || []).length;
    html += `
      <div class="section-block">
        <button class="section-toggle" onclick="toggleSection(this, 'issues-${i}')">
          <span class="section-label">${sec.label}</span>
          <span class="section-count">${count} finding${count !== 1 ? 's' : ''}</span>
          <span class="section-chevron">▼</span>
        </button>
        <div class="issues-container" id="issues-${i}">`;
    (sec.issues || []).forEach(issue => {
      html += `
          <div class="issue-row">
            <span class="sev ${sevClass(issue.severity)}">${issue.severity}</span>
            <div class="issue-body">
              <div class="issue-title">${escHtml(issue.title)}</div>
              <div class="issue-detail">${escHtml(issue.detail)}</div>
            </div>
          </div>`;
    });
    html += `</div></div>`;
  });

  html += `
    <div class="summary-box">
      <strong>Overall assessment</strong>
      ${escHtml(data.overallSummary)}
    </div>`;

  if (showSave) {
    html += `
      <div class="save-row">
        <button class="save-btn" id="saveBtn" onclick="triggerSave()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save to history
        </button>
      </div>`;
  }

  container.innerHTML = html;
}

function toggleSection(btn, targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;
  const isCollapsed = btn.classList.toggle('collapsed');
  container.style.display = isCollapsed ? 'none' : '';
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Renders a compact read-only result for history/compare views
function renderCompact(data, container) {
  renderResults(data, container, { showSave: false });
}
