// Success / error message (3 second por nijei chole jabe)
function showToast(message, type) {
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastBox';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'success');
  t.textContent = message;
  box.appendChild(t);
  setTimeout(function () { t.remove(); }, 3000);
}

// Delete er age "Are you sure?" popup
function confirmDialog(message, onYes) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal"><h3>Are you sure?</h3><p></p>' +
    '<div class="modal-actions">' +
    '<button class="btn btn-outline" id="cfNo">Cancel</button>' +
    '<button class="btn btn-danger" id="cfYes">Yes, continue</button>' +
    '</div></div>';
  overlay.querySelector('p').textContent = message;
  document.body.appendChild(overlay);
  overlay.querySelector('#cfNo').onclick = function () { overlay.remove(); };
  overlay.querySelector('#cfYes').onclick = function () { overlay.remove(); onYes(); };
}

// Status ar priority badge (porer page gulo te lagbe)
function statusBadge(status) {
  const map = { 'Open': 'badge-open', 'In Progress': 'badge-progress', 'Resolved': 'badge-resolved' };
  return '<span class="badge ' + (map[status] || '') + '">' + status + '</span>';
}

function priorityBadge(priority) {
  const map = { 'Normal': 'badge-normal', 'High': 'badge-high', 'Critical': 'badge-critical' };
  return '<span class="badge ' + (map[priority] || '') + '">' + priority + '</span>';
}
function esc(text) {
  const d = document.createElement('div');
  d.textContent = text == null ? '' : text;
  return d.innerHTML;
}