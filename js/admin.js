const user = requireLogin(['admin']);

if (user) {
  renderLayout(user, 'admin.html');
  fillEditSelects();
  renderTable();
  setupFilters();
  setupTableActions();
  setupEditForm();
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

function getTechnicians() {
  return getAll('users').filter(function (u) { return u.role === 'technician'; });
}

function fillEditSelects() {
  document.getElementById('editCategory').innerHTML = getAll('categories').map(function (c) {
    return '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
  }).join('');
  document.getElementById('editBuilding').innerHTML = getAll('buildings').map(function (b) {
    return '<option value="' + esc(b.name) + '">' + esc(b.name) + '</option>';
  }).join('');
}

function renderTable() {
  const q = document.getElementById('searchBox').value.trim().toLowerCase();
  const st = document.getElementById('statusFilter').value;
  const techs = getTechnicians();
  const all = getAll('issues');

  // Critical alert banner
  const urgent = all.filter(function (i) { return i.priority === 'Critical' && i.status !== 'Resolved'; });
  const banner = document.getElementById('criticalAlert');
  if (urgent.length) {
    banner.hidden = false;
    banner.textContent = '🚨 ' + urgent.length + ' critical safety issue(s) need immediate attention.';
  } else {
    banner.hidden = true;
  }

  const list = all.filter(function (i) {
    const reporter = getById('users', i.reporterId);
    const text = (fmtId(i.id) + ' ' + i.title + ' ' + i.building + ' ' + i.room + ' ' + (reporter ? reporter.name : '')).toLowerCase();
    return (!q || text.indexOf(q) !== -1) && (!st || i.status === st);
  }).sort(function (a, b) {
    const ca = a.priority === 'Critical' && a.status !== 'Resolved' ? 1 : 0;
    const cb = b.priority === 'Critical' && b.status !== 'Resolved' ? 1 : 0;
    return cb - ca || b.id - a.id;
  });

  document.getElementById('countText').textContent = list.length + ' of ' + all.length + ' issue(s)';
  const body = document.getElementById('issueBody');

  if (!list.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty-cell">No issues found.</td></tr>';
    return;
  }

  body.innerHTML = list.map(function (i) {
    const reporter = getById('users', i.reporterId);
    const critical = i.priority === 'Critical' && i.status !== 'Resolved';

    const prioritySelect = '<select class="inline-select" data-field="priority" data-id="' + i.id + '">' +
      ['Normal', 'High', 'Critical'].map(function (p) {
        return '<option value="' + p + '"' + (p === i.priority ? ' selected' : '') + '>' + p + '</option>';
      }).join('') + '</select>';

    const techSelect = '<select class="inline-select" data-field="tech" data-id="' + i.id + '">' +
      '<option value="">Unassigned</option>' +
      techs.map(function (t) {
        return '<option value="' + t.id + '"' + (t.id === i.assignedTo ? ' selected' : '') + '>' + esc(t.name) + '</option>';
      }).join('') + '</select>';

    return '<tr class="' + (critical ? 'row-critical' : '') + '">' +
      '<td>' + fmtId(i.id) + '</td>' +
      '<td><strong>' + esc(i.title) + '</strong><br><small class="muted">' + esc(i.category) + ' | ' + esc(i.building) + ' - ' + esc(i.room) + '</small></td>' +
      '<td>' + esc(reporter ? reporter.name : 'Unknown') + '</td>' +
      '<td>' + prioritySelect + '</td>' +
      '<td>' + statusBadge(i.status) + '</td>' +
      '<td>' + techSelect + '</td>' +
      '<td class="actions">' +
        '<a href="details.html?id=' + i.id + '" class="btn btn-outline btn-sm">View</a> ' +
        '<button class="btn btn-outline btn-sm" data-action="edit" data-id="' + i.id + '">Edit</button> ' +
        '<button class="btn btn-danger btn-sm" data-action="delete" data-id="' + i.id + '">Delete</button>' +
      '</td>' +
      '</tr>';
  }).join('');
}

function setupFilters() {
  document.getElementById('searchBox').addEventListener('input', renderTable);
  document.getElementById('statusFilter').addEventListener('change', renderTable);
}

function setupTableActions() {
  const body = document.getElementById('issueBody');

  body.addEventListener('change', function (e) {
    const sel = e.target.closest('select[data-field]');
    if (!sel) return;
    const id = Number(sel.dataset.id);
    const issue = getById('issues', id);
    if (!issue) return;

    if (sel.dataset.field === 'priority') {
      updateItem('issues', id, { priority: sel.value });
      addUpdate(id, 'Priority set to ' + sel.value + ' by admin', issue.status);
      showToast('Priority updated');
    }

    if (sel.dataset.field === 'tech') {
      if (sel.value === '') {
        updateItem('issues', id, { assignedTo: null });
        addUpdate(id, 'Technician unassigned', issue.status);
        showToast('Technician removed');
      } else {
        const tech = getById('users', sel.value);
        updateItem('issues', id, { assignedTo: tech.id });
        addUpdate(id, 'Assigned to ' + tech.name, issue.status);
        showToast('Assigned to ' + tech.name);
      }
    }
    renderTable();
  });

  body.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'edit') openEdit(id);
    if (btn.dataset.action === 'delete') removeIssue(id);
  });
}

function removeIssue(id) {
  confirmDialog('Delete issue ' + fmtId(id) + '? This cannot be undone.', function () {
    getAll('updates')
      .filter(function (u) { return u.issueId === id; })
      .forEach(function (u) { deleteItem('updates', u.id); });
    deleteItem('issues', id);
    showToast('Issue deleted');
    renderTable();
  });
}

function openEdit(id) {
  const issue = getById('issues', id);
  if (!issue) return;
  document.getElementById('editId').value = id;
  document.getElementById('editTitle').value = issue.title;
  document.getElementById('editCategory').value = issue.category;
  document.getElementById('editStatus').value = issue.status;
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
    const old = getById('issues', id);
    const title = document.getElementById('editTitle').value.trim();
    const room = document.getElementById('editRoom').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const status = document.getElementById('editStatus').value;
    const err = document.getElementById('editError');

    if (title.length < 5) { err.textContent = 'Title must be at least 5 characters'; return; }
    if (!room) { err.textContent = 'Room or location is required'; return; }
    if (description.length < 10) { err.textContent = 'Description must be at least 10 characters'; return; }

    updateItem('issues', id, {
      title: title,
      category: document.getElementById('editCategory').value,
      building: document.getElementById('editBuilding').value,
      room: room,
      description: description,
      status: status
    });
    addUpdate(id, old.status !== status ? 'Status changed to ' + status + ' by admin' : 'Issue edited by admin', status);

    document.getElementById('editOverlay').hidden = true;
    showToast('Issue updated');
    renderTable();
  });
}