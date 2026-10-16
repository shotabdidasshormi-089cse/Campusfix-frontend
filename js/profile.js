const user = requireLogin();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (user) {
  if (!getById('users', user.id)) {
    // Admin ei account muche dile session thakbe na
    clearSession();
    window.location.href = 'login.html';
  } else {
    renderLayout(user, 'profile.html');
    showProfile();
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    document.getElementById('passwordForm').addEventListener('submit', savePassword);
    document.getElementById('deleteBtn').addEventListener('click', deleteAccount);
  }
}

function roleLabel(role) {
  return role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1);
}

function setErr(id, msg) {
  document.getElementById(id + 'Error').textContent = msg;
  document.getElementById(id).classList.toggle('invalid', msg !== '');
  return msg === '';
}

function statBox(label, value) {
  return '<div class="pstat"><strong>' + value + '</strong><span>' + label + '</span></div>';
}

function showProfile() {
  const u = getById('users', user.id);
  const issues = getAll('issues');

  document.getElementById('avatar').textContent = u.name.charAt(0).toUpperCase();
  document.getElementById('pTitle').textContent = u.name;
  document.getElementById('pMail').textContent = u.email;
  document.getElementById('pRole').innerHTML = '<span class="badge badge-role-' + u.role + '">' + roleLabel(u.role) + '</span>';

  document.getElementById('pName').value = u.name;
  document.getElementById('pEmail').value = u.email;
  document.getElementById('pRoleInput').value = roleLabel(u.role);

  let stats = '';
  if (u.role === 'student') {
    const mine = issues.filter(function (i) { return i.reporterId === u.id; });
    stats = statBox('Reported', mine.length) +
      statBox('Resolved', mine.filter(function (i) { return i.status === 'Resolved'; }).length);
  } else if (u.role === 'technician') {
    const mine = issues.filter(function (i) { return i.assignedTo === u.id; });
    stats = statBox('Assigned', mine.length) +
      statBox('Completed', mine.filter(function (i) { return i.status === 'Resolved'; }).length);
  } else {
    stats = statBox('Total issues', issues.length) +
      statBox('Users', getAll('users').length);
  }
  document.getElementById('pStats').innerHTML = stats;
}

function saveProfile(e) {
  e.preventDefault();
  const name = document.getElementById('pName').value.trim();
  const email = document.getElementById('pEmail').value.trim().toLowerCase();

  const taken = getAll('users').some(function (u) {
    return u.email.toLowerCase() === email && u.id !== user.id;
  });

  const ok = [
    setErr('pName', !name ? 'Name is required' : name.length < 3 ? 'At least 3 characters' : ''),
    setErr('pEmail', !email ? 'Email is required' : !EMAIL_RE.test(email) ? 'Enter a valid email' : taken ? 'This email is already used' : '')
  ].every(Boolean);
  if (!ok) return;

  const updated = updateItem('users', user.id, { name: name, email: email });
  setSession(updated);
  renderLayout(getCurrentUser(), 'profile.html');
  showProfile();
  showToast('Profile updated');
}

function savePassword(e) {
  e.preventDefault();
  const u = getById('users', user.id);
  const cur = document.getElementById('curPass').value;
  const np = document.getElementById('newPass').value;
  const cp = document.getElementById('confPass').value;

  let newMsg = '';
  if (!np) newMsg = 'New password is required';
  else if (np.length < 8) newMsg = 'Minimum 8 characters';
  else if (!/[A-Za-z]/.test(np) || !/[0-9]/.test(np)) newMsg = 'Use letters and numbers';
  else if (np === cur) newMsg = 'New password must be different';

  const ok = [
    setErr('curPass', !cur ? 'Enter your current password' : cur !== u.password ? 'Current password is wrong' : ''),
    setErr('newPass', newMsg),
    setErr('confPass', !cp ? 'Please confirm the new password' : cp !== np ? 'Passwords do not match' : '')
  ].every(Boolean);
  if (!ok) return;

  updateItem('users', user.id, { password: np });
  document.getElementById('passwordForm').reset();
  showToast('Password updated');
}

function deleteAccount() {
  const u = getById('users', user.id);
  const pass = document.getElementById('delPass').value;

  const admins = getAll('users').filter(function (x) { return x.role === 'admin'; });
  let msg = '';
  if (!pass) msg = 'Enter your password';
  else if (pass !== u.password) msg = 'Password is wrong';
  else if (u.role === 'admin' && admins.length <= 1) msg = 'You are the only administrator. Add another admin first.';

  if (!setErr('delPass', msg)) return;

  confirmDialog('Delete your account permanently? This cannot be undone.', function () {
    if (u.role === 'technician') {
      getAll('issues')
        .filter(function (i) { return i.assignedTo === u.id; })
        .forEach(function (i) { updateItem('issues', i.id, { assignedTo: null }); });
    }
    deleteItem('users', u.id);
    clearSession();
    window.location.href = 'logout.html';
  });
}