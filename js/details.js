const user = requireLogin();
const issueId = Number(new URLSearchParams(window.location.search).get('id'));
const BACK = { student: 'student.html', technician: 'technician.html', admin: 'admin.html' };

if (user) {
  renderLayout(user, BACK[user.role]);
  document.getElementById('backLink').href = BACK[user.role];
  showPage();
  document.getElementById('detailBox').addEventListener('click', onClick);
}

function fmtId(id) {
  return 'CF-' + String(id).padStart(4, '0');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function canView(issue) {
  if (user.role === 'admin') return true;
  if (user.role === 'student') return issue.reporterId === user.id;
  if (user.role === 'technician') return issue.assignedTo === user.id;
  return false;
}

function canAddNote(issue) {
  return user.role === 'admin' || (user.role === 'technician' && issue.assignedTo === user.id);
}

function showPage() {
  const issue = getById('issues', issueId);
  const box = document.getElementById('detailBox');

  if (!issue || !canView(issue)) {
    box.innerHTML = '<div class="card empty-state"><h2>Issue not found</h2>' +
      '<p>This issue does not exist or you do not have access to it.</p></div>';
    return;
  }
  box.innerHTML = buildPage(issue);
}

function buildStepper(status) {
  const steps = ['Open', 'In Progress', 'Resolved'];
  const current = steps.indexOf(status);
  return '<div class="stepper">' + steps.map(function (s, i) {
    const cls = i < current ? 'done' : i === current ? 'current' : '';
    return '<div class="step-item ' + cls + '"><span class="step-dot">' + (i < current ? '✓' : i + 1) + '</span><p>' + s + '</p></div>';
  }).join('') + '</div>';
}

function buildTimeline(issue) {
  const list = getAll('updates')
    .filter(function (u) { return u.issueId === issue.id; })
    .sort(function (a, b) { return a.id - b.id; });

  if (!list.length) return '<p class="empty">No activity yet.</p>';
  return '<div class="timeline">' + list.map(function (u) {
    return '<div class="tl-item"><span class="tl-dot tl-' + u.status.replace(' ', '').toLowerCase() + '"></span>' +
      '<div class="tl-body"><p><strong>' + esc(u.text) + '</strong></p>' +
      '<small>' + esc(u.date) + '</small> ' + statusBadge(u.status) + '</div></div>';
  }).join('') + '</div>';
}

function buildNotes(issue) {
  const notes = getAll('notes')
    .filter(function (n) { return n.issueId === issue.id; })
    .sort(function (a, b) { return b.id - a.id; });

  const form = canAddNote(issue)
    ? '<div class="note-form"><textarea id="newNote" rows="2" placeholder="Write an internal note"></textarea>' +
      '<small class="error" id="newNoteError"></small>' +
      '<button class="btn btn-primary btn-sm" data-action="addnote">+ Add Note</button></div>'
    : '';

  const items = notes.length
    ? notes.map(function (n) {
        const canDelete = user.role === 'admin' || n.authorId === user.id;
        return '<div class="note-item"><div><p>' + esc(n.text) + '</p>' +
          '<small>' + esc(n.authorName) + ' | ' + esc(n.date) + '</small></div>' +
          (canDelete ? '<div class="note-actions"><button class="btn btn-danger btn-sm" data-action="delnote" data-id="' + n.id + '">Delete</button></div>' : '') +
          '</div>';
      }).join('')
    : '<p class="empty">No notes yet.</p>';

  return '<div class="card"><h3 class="card-title">Internal Notes (' + notes.length + ')</h3>' + form + items + '</div>';
}

function buildPage(issue) {
  const reporter = getById('users', issue.reporterId);
  const tech = issue.assignedTo ? getById('users', issue.assignedTo) : null;
  const urgent = issue.priority === 'Critical' && issue.status !== 'Resolved';

  const rows = [
    ['Category', esc(issue.category)],
    ['Building', esc(issue.building)],
    ['Room / Location', esc(issue.room)],
    ['Reported by', esc(reporter ? reporter.name : 'Unknown')],
    ['Reported on', esc(issue.createdAt)],
    ['Assigned technician', tech ? esc(tech.name) : '<span class="muted">Not assigned yet</span>']
  ];
  if (issue.startedAt) rows.push(['Work started', esc(issue.startedAt)]);
  if (issue.resolvedAt) rows.push(['Resolved on', esc(issue.resolvedAt)]);

  const info = rows.map(function (r) {
    return '<div class="info-row"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div>';
  }).join('');

  const photo = issue.photo
    ? '<h3 class="card-title" style="margin-top:18px">Photo</h3><img class="detail-photo" src="' + esc(issue.photo) + '" alt="Issue photo">'
    : '';

  return (urgent ? '<div class="alert-critical">🚨 Critical safety issue. This needs immediate attention.</div>' : '') +
    '<div class="page-head"><div>' +
      '<h1>' + fmtId(issue.id) + ' - ' + esc(issue.title) + '</h1>' +
      '<p class="page-sub">' + priorityBadge(issue.priority) + ' ' + statusBadge(issue.status) + '</p>' +
    '</div></div>' +
    '<div class="card" style="margin-bottom:20px"><h3 class="card-title">Progress</h3>' + buildStepper(issue.status) + '</div>' +
    '<div class="detail-grid">' +
      '<div>' +
        '<div class="card" style="margin-bottom:20px"><h3 class="card-title">Details</h3>' + info +
          '<h3 class="card-title" style="margin-top:18px">Description</h3><p class="detail-desc">' + esc(issue.description) + '</p>' + photo + '</div>' +
        (user.role !== 'student' ? buildNotes(issue) : '') +
      '</div>' +
      '<div class="card"><h3 class="card-title">Activity Timeline</h3>' + buildTimeline(issue) + '</div>' +
    '</div>';
}

function onClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const issue = getById('issues', issueId);
  if (!issue) return;

  if (btn.dataset.action === 'addnote' && canAddNote(issue)) {
    const field = document.getElementById('newNote');
    const text = field.value.trim();
    const err = document.getElementById('newNoteError');
    if (text.length < 3) { err.textContent = 'Write at least 3 characters'; return; }

    addItem('notes', { issueId: issueId, authorId: user.id, authorName: user.name, text: text, date: today() });
    showToast('Note added');
    showPage();
  }

  if (btn.dataset.action === 'delnote') {
    const note = getById('notes', btn.dataset.id);
    if (!note || (user.role !== 'admin' && note.authorId !== user.id)) return;
    confirmDialog('Delete this note?', function () {
      deleteItem('notes', note.id);
      showToast('Note deleted');
      showPage();
    });
  }
}