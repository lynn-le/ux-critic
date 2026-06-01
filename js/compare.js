// js/compare.js
// Renders the side-by-side comparison view.

function renderCompare(entryA, entryB) {
  const container = document.getElementById('compareResults');
  const empty = document.getElementById('compareEmpty');
  if (!entryA || !entryB) {
    container.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  container.classList.remove('hidden');

  const sA = scoreStyle(entryA.data.overallScore);
  const sB = scoreStyle(entryB.data.overallScore);

  // Build section score maps
  const sectionsA = buildSectionMap(entryA.data.sections);
  const sectionsB = buildSectionMap(entryB.data.sections);
  const allSectionIds = [...new Set([...Object.keys(sectionsA), ...Object.keys(sectionsB)])];

  let html = `<div class="compare-grid">`;

  // Column A
  html += `<div class="compare-col">
    <div class="compare-col-header">
      <img class="compare-col-thumb" src="${entryA.thumb}" alt="" />
      <div>
        <div class="compare-col-name">${escHtml(entryA.name)}</div>
        <div class="compare-col-meta">${entryA.mode} · ${formatDate(entryA.timestamp)}</div>
      </div>
    </div>
    <div class="score-badge" style="color:${sA.color};background:${sA.bg};border-color:${sA.border};display:inline-block;margin-bottom:12px">
      Overall: ${entryA.data.overallScore}/10
    </div>`;
  allSectionIds.forEach(id => {
    const sec = sectionsA[id];
    if (!sec) return;
    html += `<div class="compare-score-row">
      <span class="compare-section-name">${escHtml(sec.label)}</span>
      <span class="compare-section-val">${sec.critCount}c · ${sec.majorCount}m</span>
    </div>`;
  });
  html += `</div>`;

  // Column B
  html += `<div class="compare-col">
    <div class="compare-col-header">
      <img class="compare-col-thumb" src="${entryB.thumb}" alt="" />
      <div>
        <div class="compare-col-name">${escHtml(entryB.name)}</div>
        <div class="compare-col-meta">${entryB.mode} · ${formatDate(entryB.timestamp)}</div>
      </div>
    </div>
    <div class="score-badge" style="color:${sB.color};background:${sB.bg};border-color:${sB.border};display:inline-block;margin-bottom:12px">
      Overall: ${entryB.data.overallScore}/10
    </div>`;
  allSectionIds.forEach(id => {
    const sec = sectionsB[id];
    if (!sec) return;
    html += `<div class="compare-score-row">
      <span class="compare-section-name">${escHtml(sec.label)}</span>
      <span class="compare-section-val">${sec.critCount}c · ${sec.majorCount}m</span>
    </div>`;
  });
  html += `</div></div>`;

  // Delta bar (issue severity comparison)
  const delta = entryA.data.overallScore - entryB.data.overallScore;
  const winner = delta > 0 ? entryA.name : delta < 0 ? entryB.name : null;

  html += `<div class="delta-bar">
    <h3>Issue severity breakdown</h3>`;

  const cats = [
    { label: 'Critical issues', key: 'critical', col: '#c0392b' },
    { label: 'Major issues',    key: 'major',    col: '#e67e22' },
    { label: 'Minor issues',    key: 'minor',    col: '#7f8c8d' },
    { label: 'Positives',       key: 'positive', col: '#16a085' }
  ];

  cats.forEach(cat => {
    const countA = countSeverity(entryA.data.sections, cat.key);
    const countB = countSeverity(entryB.data.sections, cat.key);
    const maxVal = Math.max(countA, countB, 1);
    const pctA = Math.round((countA / maxVal) * 100);
    const pctB = Math.round((countB / maxVal) * 100);
    html += `
      <div class="delta-row">
        <span class="delta-name">${cat.label}</span>
        <div style="flex:1;display:flex;flex-direction:column;gap:3px">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:10px;color:var(--text-3);width:12px">A</span>
            <div class="delta-track"><div class="delta-fill" style="width:${pctA}%;background:${cat.col}"></div></div>
            <span class="delta-label">${countA}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:10px;color:var(--text-3);width:12px">B</span>
            <div class="delta-track"><div class="delta-fill" style="width:${pctB}%;background:${cat.col};opacity:0.5"></div></div>
            <span class="delta-label">${countB}</span>
          </div>
        </div>
      </div>`;
  });

  if (winner) {
    html += `<p style="font-size:12px;color:var(--text-2);margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
      <strong style="color:var(--text)">${escHtml(winner)}</strong> scores ${Math.abs(delta)} point${Math.abs(delta) !== 1 ? 's' : ''} higher overall.
    </p>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}

function buildSectionMap(sections) {
  const map = {};
  (sections || []).forEach(sec => {
    map[sec.id] = {
      label: sec.label,
      critCount: (sec.issues || []).filter(i => i.severity === 'critical').length,
      majorCount: (sec.issues || []).filter(i => i.severity === 'major').length
    };
  });
  return map;
}

function countSeverity(sections, sev) {
  return (sections || []).reduce((sum, sec) => {
    return sum + (sec.issues || []).filter(i => i.severity === sev).length;
  }, 0);
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
