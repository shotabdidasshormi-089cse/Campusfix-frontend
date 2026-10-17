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

let bellOutsideBound = false;

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

// Ekjon user ke notification pathao
function notify(userId, issueId, text) {
  if (!userId || !getById('users', userId)) return;
  addItem('notifications', {
    userId: Number(userId),
    issueId: issueId || null,
    text: text,
    date: nowDate(),
    read: false
  });
}

// Ekta role er shobai ke pathao (jemon sob admin)
function notifyRole(role, issueId, text) {
  getAll('users')
    .filter(function (u) { return u.role === role; })
    .forEach(function (u) { notify(u.id, issueId, text); });
}

function myNotifications(u) {
  return getAll('notifications')
    .filter(function (n) { return n.userId === u.id; })
    .sort(function (a, b) { return b.id - a.id; });
}

function renderBell(u) {
  const list = myNotifications(u);
  const unread = list.filter(function (n) { return !n.read; }).length;
  const badge = document.getElementById('bellCount');
  badge.textContent = unread > 9 ? '9+' : unread;
  badge.hidden = unread === 0;

  const box = document.getElementById('bellList');
  if (!list.length) {
    box.innerHTML = '<p class="bell-empty">No notifications yet.</p>';
    return;
  }
  box.innerHTML = list.slice(0, 15).map(function (n) {
    return '<div class="bell-item' + (n.read ? '' : ' unread') + '" data-id="' + n.id + '" data-issue="' + (n.issueId || '') + '">' +
      '<div class="bell-text"><p>' + esc(n.text) + '</p><small>' + esc(n.date) + '</small></div>' +
      '<button class="bell-del" data-del="' + n.id + '" aria-label="Delete">×</button>' +
      '</div>';
  }).join('');
}

function setupBell(u) {
  const btn = document.getElementById('bellBtn');
  const panel = document.getElementById('bellPanel');
  renderBell(u);

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    renderBell(u);
    panel.hidden = !panel.hidden;
  });

  panel.addEventListener('click', function (e) {
    e.stopPropagation();
    const del = e.target.closest('[data-del]');
    if (del) {
      deleteItem('notifications', Number(del.dataset.del));
      renderBell(u);
      return;
    }
    const item = e.target.closest('.bell-item');
    if (item) {
      updateItem('notifications', Number(item.dataset.id), { read: true });
      if (item.dataset.issue) {
        window.location.href = 'details.html?id=' + item.dataset.issue;
      } else {
        renderBell(u);
      }
    }
  });

  document.getElementById('markAllBtn').addEventListener('click', function () {
    myNotifications(u).filter(function (n) { return !n.read; }).forEach(function (n) {
      updateItem('notifications', n.id, { read: true });
    });
    renderBell(u);
  });

  document.getElementById('clearAllBtn').addEventListener('click', function () {
    if (!myNotifications(u).length) return;
    confirmDialog('Delete all your notifications?', function () {
      myNotifications(u).forEach(function (n) { deleteItem('notifications', n.id); });
      renderBell(u);
    });
  });

  if (!bellOutsideBound) {
    bellOutsideBound = true;
    document.addEventListener('click', function () {
      const p = document.getElementById('bellPanel');
      if (p) p.hidden = true;
    });
  }
}

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
      '<div class="bell-wrap">' +
        '<button class="bell-btn" id="bellBtn" aria-label="Notifications">🔔<span class="bell-count" id="bellCount" hidden>0</span></button>' +
        '<div class="bell-panel" id="bellPanel" hidden>' +
          '<div class="bell-head"><strong>Notifications</strong>' +
            '<div><button class="link-btn" id="markAllBtn">Mark all read</button>' +
            '<button class="link-btn" id="clearAllBtn">Clear all</button></div></div>' +
          '<div id="bellList"></div>' +
        '</div>' +
      '</div>' +
      '<div class="user-chip"><strong id="topName"></strong><small id="topRole"></small></div>' +
      '<button class="btn btn-outline btn-sm" id="logoutBtn">Logout</button>' +
    '</div>';

  document.getElementById('topName').textContent = user.name;
  document.getElementById('topRole').textContent = user.role;
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('menuBtn').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
  });
  setupBell(user);
}