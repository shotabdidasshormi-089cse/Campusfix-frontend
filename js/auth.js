function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('cf_session')); }
  catch (e) { return null; }
}

function setSession(user) {
  localStorage.setItem('cf_session', JSON.stringify({
    id: user.id, name: user.name, email: user.email, role: user.role
  }));
}

function clearSession() {
  localStorage.removeItem('cf_session');
}

// Route guard: login chara ba vul role e dhukte dibe na
function requireLogin(allowedRoles) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
    window.location.href = 'dashboard.html';
    return null;
  }
  return user;
}

function logout() {
  clearSession();
  window.location.href = 'logout.html';
}