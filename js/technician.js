const user = requireLogin(['technician']);
let noteTarget = null; // { issueId, noteId }

if (user) {
  renderLayout(user, 'technician.html');
  renderTasks();
  setupEvents();
}

function fmtId(id) {
  return 'CF-' + String(id).padStart(4, '0');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addUpdate(issueId, text, status) {
  addItem('updates', { issueId: issueId, text: text, status: status, date: today() });
}

function isUrgent(i) {
  return i.priority === 'Critical' && i.status !== 'Resolved';
}

function renderTasks() {
  const st = document.getElementById('statusFilter').value;
  const mine = getAll('issues').filter(function (i) { return i.assignedTo === user.id; });

  const list = mine.filter(function (i) {
    return !st || i.status === st;
  }).sort(function (a, b) {
    return (isUrgent(b) ? 1 : 0) - (isUrgent(a) ? 1 : 0) || b.id - a.id;
  });

  document.getElementById('countText').textContent = list.length + ' of ' + mine.length + ' task(s)';
  const box = document.getElementById('taskList');

  if (!list.length) {
    box.innerHTML = '<div class="card empty">No tasks found.</div>';
    return;
  }
  box.innerHTML = list.map(taskCard).join('');
}

function taskCard(i) {
  const urgent = isUrgent(i);
  const reporter = getById('users', i.reporterId);
  const notes = getAll('notes')
    .filter(function (n) { return n.issueId === i.id; })
    .sort(function (a, b) { return b.id - a.id; });

  let cls = 'task-card';
  if (i.status === 'Open') cls += ' task-open';
  if (i.status === 'Resolved') cls += ' task-resolved';
  if (urgent) cls += ' task-critical';

  let actions = '';
  if (i.status === 'Open') {
    actions += '<button class="btn btn-primary btn-sm" data-action="start" data-id="' + i.id + '">▶ Start Task</button>';
  }
  if (i.status === 'In Progress') {
    actions += '<button class="btn btn-success btn-sm" data-action="complete" data-id="' + i.id + '">✔ Mark Completed</button>';
  }
  actions += '<button class="btn btn-outline btn-sm" data-action="addnote" data-id="' + i.id + '">+ Add Note</button>';
  actions += '<a href="details.html?id=' + i.id + '" class="btn btn-outline btn-sm">View</a>';

  const noteHtml = notes.length
    ? notes.map(function (n) {
        const mineNote = n.authorId === user.id;
        return '<div class="note-item">' +
          '<div><p>' + esc(n.text) + '</p><small>' + esc(n.authorName) + ' | ' + esc(n.date) + '</small></div>' +
          (mineNote
            ? '<div class="note-actions">' +
                '<button class="btn btn-outline btn-sm" data-action="editnote" data-id="' + n.id + '" data-issue="' + i.id + '">Edit</button>' +
                '<button class="btn btn-danger btn-sm" data-action="delnote" data-id="' + n.id + '">Delete</button>' +
              '</div>'
            : '') +
          '</div>';
      }).join('')
    : '<p class="empty">No notes yet.</p>';

  return '<div class="' + cls + '">' +
    '<div class="task-head">' +
      '<div>' +
        '<h3 class="task-title">' + fmtId(i.id) + ' - ' + esc(i.title) + '</h3>' +
        '<p class="task-meta">' + esc(i.category) + ' | ' + esc(i.building) + ' - ' + esc(i.room) +
          ' | Reported by ' + esc(reporter ? reporter.name : 'Unknown') + ' on ' + esc(i.createdAt) + '</p>' +
      '</div>' +
      '<div class="task-badges">' +
        (urgent ? '<span class="urgent-tag">URGENT</span>' : '') +
        priorityBadge(i.priority) + statusBadge(i.status) +
      '</div>' +
    '</div>' +
    '<p class="task-desc">' + esc(i.description) + '</p>' +
    '<div class="task-actions">' + actions + '</div>' +
    '<div class="notes-box"><h4>Notes (' + notes.length + ')</h4>' + noteHtml + '</div>' +
  '</div>';
}

function setupEvents() {
  document.getElementById('statusFilter').addEventListener('change', renderTasks);

  document.getElementById('taskList').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);

    if (action === 'start') startTask(id);
    if (action === 'complete') completeTask(id);
    if (action === 'addnote') openNote(id, null);
    if (action === 'editnote') openNote(Number(btn.dataset.issue), id);
    if (action === 'delnote') removeNote(id);
  });

  document.getElementById('noteCancel').addEventListener('click', closeNote);
  document.getElementById('noteForm').addEventListener('submit', saveNote);
}

function myIssue(id) {
  const issue = getById('issues', id);
  return issue && issue.assignedTo === user.id ? issue : null;
}

function startTask(id) {
  const issue = myIssue(id);
  if (!issue || issue.status !== 'Open') return;
  updateItem('issues', id, { status: 'In Progress', startedAt: today() });
  addUpdate(id, 'Technician started work', 'In Progress');
  showToast('Task started');
  renderTasks();
}

function completeTask(id) {
  const issue = myIssue(id);
  if (!issue || issue.status !== 'In Progress') return;
  confirmDialog('Mark ' + fmtId(id) + ' as completed?', function () {
    updateItem('issues', id, { status: 'Resolved', resolvedAt: today() });
    addUpdate(id, 'Task completed by technician', 'Resolved');
    showToast('Task marked as completed');
    renderTasks();
  });
}

function openNote(issueId, noteId) {
  if (!myIssue(issueId)) return;
  noteTarget = { issueId: issueId, noteId: noteId };
  document.getElementById('noteTitle').textContent = noteId ? 'Edit Note' : 'Add Note';
  document.getElementById('noteText').value = noteId ? getById('notes', noteId).text : '';
  document.getElementById('noteTextError').textContent = '';
  document.getElementById('noteOverlay').hidden = false;
}

function closeNote() {
  document.getElementById('noteOverlay').hidden = true;
  noteTarget = null;
}

function saveNote(e) {
  e.preventDefault();
  if (!noteTarget) return;
  const text = document.getElementById('noteText').value.trim();
  const err = document.getElementById('noteTextError');

  if (!text) { err.textContent = 'Note cannot be empty'; return; }
  if (text.length < 3) { err.textContent = 'At least 3 characters'; return; }

  if (noteTarget.noteId) {
    updateItem('notes', noteTarget.noteId, { text: text });
    showToast('Note updated');
  } else {
    addItem('notes', {
      issueId: noteTarget.issueId,
      authorId: user.id,
      authorName: user.name,
      text: text,
      date: today()
    });
    showToast('Note added');
  }
  closeNote();
  renderTasks();
}

function removeNote(id) {
  const note = getById('notes', id);
  if (!note || note.authorId !== user.id) return;
  confirmDialog('Delete this note?', function () {
    deleteItem('notes', id);
    showToast('Note deleted');
    renderTasks();
  });
}