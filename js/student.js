const user = requireLogin(['student']);

if (user) {
  renderLayout(user, 'student.html');
  fillEditSelects();
  renderTable();
  setupActions();
  setupEditForm();
}

function fmtId(id) {
  return 'CF-' + String(id).padStart(4, '0');
}

function fillEditSelects() {
  document.getElementById('editCategory').innerHTML = getAll('categories').map(function (c) {
    return '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
  }).join('');
  document.getElementById('editBuilding').innerHTML = getAll('buildings').map(function (b) {
    return '<option value="' + esc(b.name) + '">' + esc(b.name) + '</option>';
  }).join('');
}

function latestUpdate(issueId) {
  const list = getAll('updates')
    .filter(function (u) { return u.issueId === issueId; })
    .sort(function (a, b) { return b.id - a.id; });
  return list.length ? list[0].text : '-';
}

function renderTable() {
  const issues = getAll('issues')
    .filter(function (i) { return i.reporterId === user.id; })
    .sort(function (a, b) { return b.id - a.id; });

  document.getElementById('countText').textContent = issues.length + ' report(s) submitted';
  const body = document.getElementById('issueBody');

  if (!issues.length) {
    body.innerHTML = '<tr><td colspan="8" class="empty-cell">You have not reported any issue yet.</td></tr>';
    return;
  }

  body.innerHTML = issues.map(function (i) {
    const open = i.status === 'Open';
    const actions =
      '<a href="details.html?id=' + i.id + '" class="btn btn-outline btn-sm">View</a> ' +
      (open
        ? '<button class="btn btn-outline btn-sm" data-action="edit" data-id="' + i.id + '">Edit</button> ' +
          '<button class="btn btn-danger btn-sm" data-action="delete" data-id="' + i.id + '">Delete</button>'
        : '');
    return '<tr>' +
      '<td>' + fmtId(i.id) + '</td>' +
      '<td><strong>' + esc(i.title) + '</strong><br><small class="muted">' + esc(i.building) + ' - ' + esc(i.room) + '</small></td>' +
      '<td>' + esc(i.category) + '</td>' +
      '<td>' + priorityBadge(i.priority) + '</td>' +
      '<td>' + statusBadge(i.status) + '</td>' +
      '<td>' + esc(latestUpdate(i.id)) + '</td>' +
      '<td>' + esc(i.createdAt) + '</td>' +
      '<td class="actions">' + actions + '</td>' +
      '</tr>';
  }).join('');
}

function setupActions() {
  document.getElementById('issueBody').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'edit') openEdit(id);
    if (btn.dataset.action === 'delete') removeIssue(id);
  });
}

function removeIssue(id) {
  const issue = getById('issues', id);
  if (!issue || issue.status !== 'Open') {
    showToast('Only open reports can be deleted', 'error');
    return;
  }
  confirmDialog('Delete report ' + fmtId(id) + '? This cannot be undone.', function () {
    getAll('updates')
      .filter(function (u) { return u.issueId === id; })
      .forEach(function (u) { deleteItem('updates', u.id); });
    deleteItem('issues', id);
    showToast('Report deleted');
    renderTable();
  });
}

function openEdit(id) {
  const issue = getById('issues', id);
  if (!issue || issue.status !== 'Open') {
    showToast('Only open reports can be edited', 'error');
    return;
  }
  document.getElementById('editId').value = id;
  document.getElementById('editTitle').value = issue.title;
  document.getElementById('editCategory').value = issue.category;
  document.getElementById('editPriority').value = issue.priority;
  document.getElementById('editBuilding').value = issue.building;
  document.getElementById('editRoom').value = issue.room;
  document.getElementById('editDescription').value = issue.description;
  document.getElementById('editError').textContent = '';
  document.getElementById('editOverlay').hidden = false;
}

function setupEditForm() {
  document.getElementById('editCancel').addEventListener('click', function () {
    document.getElementById('editOverlay').hidden = true;
  });

  document.getElementById('editForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const id = Number(document.getElementById('editId').value);
    const title = document.getElementById('editTitle').value.trim();
    const room = document.getElementById('editRoom').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const err = document.getElementById('editError');

    if (title.length < 5) { err.textContent = 'Title must be at least 5 characters'; return; }
    if (!room) { err.textContent = 'Room or location is required'; return; }
    if (description.length < 10) { err.textContent = 'Description must be at least 10 characters'; return; }

    updateItem('issues', id, {
      title: title,
      category: document.getElementById('editCategory').value,
      priority: document.getElementById('editPriority').value,
      building: document.getElementById('editBuilding').value,
      room: room,
      description: description
    });
    addItem('updates', {
      issueId: id,
      text: 'Report edited by student',
      status: 'Open',
      date: new Date().toISOString().slice(0, 10)
    });

    document.getElementById('editOverlay').hidden = true;
    showToast('Report updated');
    renderTable();
  });
}