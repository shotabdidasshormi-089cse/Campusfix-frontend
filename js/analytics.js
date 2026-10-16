const PALETTE = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#4b5563'];
const user = requireLogin(['admin']);

if (user) {
  renderLayout(user, 'analytics.html');
  try {
    const issues = getAll('issues');
    renderSummary(issues);
    drawAll(issues);
  } catch (err) {
    // Kono error hole page ei dekhabe
    const box = document.getElementById('chartError');
    box.hidden = false;
    box.textContent = 'Error: ' + err.message;
  }
}

function countBy(list, key, names) {
  const result = {};
  (names || []).forEach(function (n) { result[n] = 0; });
  list.forEach(function (i) {
    const v = i[key] || 'Unknown';
    result[v] = (result[v] || 0) + 1;
  });
  return result;
}

function avgResolveDays(issues) {
  const done = issues.filter(function (i) { return i.status === 'Resolved' && i.resolvedAt && i.createdAt; });
  if (!done.length) return null;
  const total = done.reduce(function (sum, i) {
    const days = (new Date(i.resolvedAt) - new Date(i.createdAt)) / 86400000;
    return sum + Math.max(days, 0);
  }, 0);
  return (total / done.length).toFixed(1);
}

function summaryCard(label, value, cls) {
  return '<div class="stat-card ' + cls + '"><p>' + label + '</p><h3>' + value + '</h3></div>';
}

function renderSummary(issues) {
  const total = issues.length;
  const resolved = issues.filter(function (i) { return i.status === 'Resolved'; }).length;
  const rate = total ? Math.round((resolved / total) * 100) : 0;
  const critical = issues.filter(function (i) { return i.priority === 'Critical' && i.status !== 'Resolved'; }).length;
  const avg = avgResolveDays(issues);

  document.getElementById('summaryGrid').innerHTML =
    summaryCard('Total Issues', total, 'stat-total') +
    summaryCard('Resolved Rate', rate + '%', 'stat-resolved') +
    summaryCard('Avg. Resolution Time', avg === null ? '-' : avg + ' days', 'stat-progress') +
    summaryCard('Open Critical Issues', critical, 'stat-critical');
}


// Bar chart: library lage na
function drawBars(canvasId, counts, colors) {
  const holder = document.getElementById(canvasId).parentElement;
  const names = Object.keys(counts);

  if (!names.length) {
    holder.innerHTML = '<p class="empty">No data yet.</p>';
    return;
  }

  const values = names.map(function (n) { return counts[n]; });
  const max = Math.max.apply(null, values.concat([1]));
  const total = values.reduce(function (s, v) { return s + v; }, 0);

  holder.innerHTML = names.map(function (n, i) {
    const v = counts[n];
    const width = Math.round((v / max) * 100);
    const pct = total ? Math.round((v / total) * 100) : 0;
    const color = (colors && colors[n]) || PALETTE[i % PALETTE.length];
    return '<div class="bar-row">' +
      '<div class="bar-label">' + esc(n) + '</div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + width + '%;background:' + color + '"></div></div>' +
      '<div class="bar-value">' + v + ' (' + pct + '%)</div>' +
      '</div>';
  }).join('');
}

function drawAll(issues) {
  const buildingNames = getAll('buildings').map(function (b) { return b.name; });
  const categoryNames = getAll('categories').map(function (c) { return c.name; });

  drawBars('buildingChart', countBy(issues, 'building', buildingNames));
  drawBars('categoryChart', countBy(issues, 'category', categoryNames));
  drawBars('priorityChart', countBy(issues, 'priority', ['Normal', 'High', 'Critical']),
    { 'Normal': '#6b7280', 'High': '#ea580c', 'Critical': '#dc2626' });
  drawBars('statusChart', countBy(issues, 'status', ['Open', 'In Progress', 'Resolved']),
    { 'Open': '#f59e0b', 'In Progress': '#3b82f6', 'Resolved': '#16a34a' });
}