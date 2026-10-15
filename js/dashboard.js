const user = requireLogin();
if (user) {
  renderLayout(user, 'dashboard.html');
  document.getElementById('welcome').textContent = 'Welcome, ' + user.name;
  loadDashboard(user);
}

function getMyIssues(u) {
  const all = getAll('issues');
  if (u.role === 'student') return all.filter(function (i) { return i.reporterId === u.id; });
  if (u.role === 'technician') return all.filter(function (i) { return i.assignedTo === u.id; });
  return all;
}

function loadDashboard(u) {
  const issues = getMyIssues(u);
  const total = issues.length;
  const open = issues.filter(function (i) { return i.status === 'Open'; }).length;
  const progress = issues.filter(function (i) { return i.status === 'In Progress'; }).length;
  const resolved = issues.filter(function (i) { return i.status === 'Resolved'; }).length;

  document.getElementById('statGrid').innerHTML =
    statCard('Total Issues', total, 'stat-total') +
    statCard('Open', open, 'stat-open') +
    statCard('In Progress', progress, 'stat-progress') +
    statCard('Resolved', resolved, 'stat-resolved');

  // Recent activity
  const ids = issues.map(function (i) { return i.id; });
  const recent = getAll('updates')
    .filter(function (x) { return ids.indexOf(x.issueId) !== -1; })
    .sort(function (a, b) { return b.id - a.id; })
    .slice(0, 5);

  const box = document.getElementById('activityList');
  if (!recent.length) {
    box.innerHTML = '<p class="empty">No recent activity yet.</p>';
  } else {
    box.innerHTML = recent.map(function (x) {
      const issue = getById('issues', x.issueId);
      return '<div class="activity-item">' +
        '<div><strong>' + esc(issue ? issue.title : 'Issue') + '</strong>' +
        '<p>' + esc(x.text) + '</p></div>' +
        '<div class="activity-right">' + statusBadge(x.status) + '<small>' + esc(x.date) + '</small></div>' +
        '</div>';
    }).join('');
  }

  // Quick links
  const links = (MENUS[u.role] || []).filter(function (m) { return m.href !== 'dashboard.html'; });
  document.getElementById('quickLinks').innerHTML = links.map(function (m) {
    return '<a href="' + m.href + '" class="quick-link">' + m.icon + ' ' + m.label + '</a>';
  }).join('');
}

function statCard(label, value, cls) {
  return '<div class="stat-card ' + cls + '"><p>' + label + '</p><h3>' + value + '</h3></div>';
}