const user = requireLogin(['admin']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let editingId = null;

if (user) {
  renderLayout(user, 'users.html');
  renderTable();
  setupEvents();
}

function roleBadge(role) {
  const label = role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1);
  return '<span class="badge badge-role-' + role + '">' + label + '</span>';
}

function issueCount(u) {
  const issues = getAll('issues');
  if (u.role === 'student') {
    return issues.filter(function (i) { return i.reporterId === u.id; }).length + ' reported';
  }
  if (u.role === 'technician') {
    return issues.filter(function (i) { return i.assignedTo === u.id; }).length + ' assigned';
  }
  return '-';
}

function renderTable() {
  const q = document.getElementById('searchBox').value.trim().toLowerCase();
  const role = document.getElementById('roleFilter').value;
  const all = getAll('users');

  const list = all.filter(function (u) {
    const text = (u.name + ' ' + u.email).toLowerCase();
    return (!q || text.indexOf(q) !== -1) && (!role || u.role === role);
  });

  document.getElementById('countText').textContent = list.length + ' of ' + all.length + ' user(s)';
  const body = document.getElementById('userBody');

  if (!list.length) {
    body.innerHTML = '<tr><td colspan="6" class="empty-cell">No users found.</td></tr>';
    return;
  }

  body.innerHTML = list.map(function (u) {
    const isMe = u.id === user.id;
    return '<tr>' +
      '<td>' + u.id + '</td>' +
      '<td><strong>' + esc(u.name) + '</strong>' + (isMe ? ' <small class="muted">(you)</small>' : '') + '</td>' +
      '<td>' + esc(u.email) + '</td>' +
      '<td>' + roleBadge(u.role) + '</td>' +
      '<td>' + issueCount(u) + '</td>' +
      '<td class="actions">' +
        '<button class="btn btn-outline btn-sm" data-action="edit" data-id="' + u.id + '">Edit</button> ' +
        (isMe ? '' : '<button class="btn btn-danger btn-sm" data-action="delete" data-id="' + u.id + '">Delete</button>') +
      '</td>' +
      '</tr>';
  }).join('');
}

function setupEvents() {
  document.getElementById('searchBox').addEventListener('input', renderTable);
  document.getElementById('roleFilter').addEventListener('change', renderTable);
  document.getElementById('addBtn').addEventListener('click', function () { openForm(null); });
  document.getElementById('formCancel').addEventListener('click', closeForm);
  document.getElementById('userForm').addEventListener('submit', saveUser);

  document.getElementById('userBody').addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === 'edit') openForm(id);
    if (btn.dataset.action === 'delete') removeUser(id);
  });
}

function setErr(field, msg) {
  document.getElementById(field + 'Error').textContent = msg;
  document.getElementById(field).classList.toggle('invalid', msg !== '');
  return msg === '';
}

function openForm(id) {
  editingId = id;
  ['uName', 'uEmail', 'uPassword'].forEach(function (f) { setErr(f, ''); });
  const roleSel = document.getElementById('uRole');

  if (id) {
    const u = getById('users', id);
    document.getElementById('formTitle').textContent = 'Edit User';
    document.getElementById('uName').value = u.name;
    document.getElementById('uEmail').value = u.email;
    roleSel.value = u.role;
    roleSel.disabled = (id === user.id);
    document.getElementById('uPassword').value = '';
    document.getElementById('uPassword').placeholder = 'Leave blank to keep current password';
  } else {
    document.getElementById('formTitle').textContent = 'Add User';
    document.getElementById('userForm').reset();
    roleSel.disabled = false;
    document.getElementById('uPassword').placeholder = 'Minimum 8 characters';
  }
  document.getElementById('formOverlay').hidden = false;
}

function closeForm() {
  document.getElementById('formOverlay').hidden = true;
  editingId = null;
}

function saveUser(e) {
  e.preventDefault();
  const name = document.getElementById('uName').value.trim();
  const email = document.getElementById('uEmail').value.trim().toLowerCase();
  const role = document.getElementById('uRole').value;
  const password = document.getElementById('uPassword').value;

  const emailTaken = getAll('users').some(function (u) {
    return u.email.toLowerCase() === email && u.id !== editingId;
  });

  let passMsg = '';
  if (!editingId && !password) passMsg = 'Password is required';
  else if (password && password.length < 8) passMsg = 'Minimum 8 characters';
  else if (password && (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))) passMsg = 'Use letters and numbers';

  const ok = [
    setErr('uName', !name ? 'Name is required' : name.length < 3 ? 'At least 3 characters' : ''),
    setErr('uEmail', !email ? 'Email is required' : !EMAIL_RE.test(email) ? 'Enter a valid email' : emailTaken ? 'This email is already used' : ''),
    setErr('uPassword', passMsg)
  ].every(Boolean);
  if (!ok) return;

  if (editingId) {
    const changes = { name: name, email: email, role: role };
    if (password) changes.password = password;
    updateItem('users', editingId, changes);
    if (editingId === user.id) {
      setSession(getById('users', editingId));
      renderLayout(getCurrentUser(), 'users.html');
    }
    showToast('User updated');
  } else {
    addItem('users', { name: name, email: email, role: role, password: password });
    showToast('User added');
  }
  closeForm();
  renderTable();
}

function removeUser(id) {
  const u = getById('users', id);
  if (!u || id === user.id) return;

  confirmDialog('Delete ' + u.name + '? Their assigned tasks will become unassigned.', function () {
    getAll('issues')
      .filter(function (i) { return i.assignedTo === id; })
      .forEach(function (i) { updateItem('issues', i.id, { assignedTo: null }); });
    deleteItem('users', id);
    showToast('User deleted');
    renderTable();
  });
}