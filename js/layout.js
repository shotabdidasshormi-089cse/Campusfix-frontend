const MENUS = {
  student: [
    { label: 'Dashboard', icon: '🏠', href: 'dashboard.html' },
    { label: 'Report New Issue', icon: '📝', href: 'report.html' },
    { label: 'My Reports', icon: '📋', href: 'student.html' },
    { label: 'Profile', icon: '👤', href: 'profile.html' }
  ],
  technician: [
    { label: 'Dashboard', icon: '🏠', href: 'dashboard.html' },
    { label: 'My Tasks', icon: '🛠️', href: 'technician.html' },
    { label: 'Profile', icon: '👤', href: 'profile.html' }
  ],
  admin: [
    { label: 'Dashboard', icon: '🏠', href: 'dashboard.html' },
    { label: 'All Issues', icon: '📋', href: 'admin.html' },
    { label: 'Manage Users', icon: '👥', href: 'users.html' },
    { label: 'Buildings & Categories', icon: '🏢', href: 'categories.html' },
    { label: 'Analytics', icon: '📊', href: 'analytics.html' },
    { label: 'Profile', icon: '👤', href: 'profile.html' }
  ]
};

function renderLayout(user, activeHref) {
  const items = MENUS[user.role] || [];
  const links = items.map(function (m) {
    const active = m.href === activeHref ? ' active' : '';
    return '<a href="' + m.href + '" class="side-link' + active + '"><span>' + m.icon + '</span>' + m.label + '</a>';
  }).join('');

  document.getElementById('sidebar').innerHTML =
    '<a href="dashboard.html" class="logo side-logo">CampusFix <span>AI</span></a>' +
    '<nav class="side-nav">' + links + '</nav>';

  document.getElementById('topbar').innerHTML =
    '<button class="menu-btn" id="menuBtn">☰</button>' +
    '<div class="top-right">' +
    '<div class="user-chip"><strong id="uName"></strong><small id="uRole"></small></div>' +
    '<button class="btn btn-outline btn-sm" id="logoutBtn">Logout</button>' +
    '</div>';

  document.getElementById('uName').textContent = user.name;
  document.getElementById('uRole').textContent = user.role;
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('menuBtn').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
  });
}