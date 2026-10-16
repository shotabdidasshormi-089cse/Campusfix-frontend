const user = requireLogin(['admin']);

// Kon list er kon field issue te use hoy
const CONFIG = {
  buildings: { bodyId: 'buildingBody', inputId: 'buildingInput', errId: 'buildingError', field: 'building', label: 'Building' },
  categories: { bodyId: 'categoryBody', inputId: 'categoryInput', errId: 'categoryError', field: 'category', label: 'Category' }
};
let editing = null; // { type, id }

if (user) {
  renderLayout(user, 'categories.html');
  renderList('buildings');
  renderList('categories');
  setupEvents();
}

function usageCount(type, name) {
  const field = CONFIG[type].field;
  return getAll('issues').filter(function (i) { return i[field] === name; }).length;
}

function renderList(type) {
  const cfg = CONFIG[type];
  const list = getAll(type);
  const body = document.getElementById(cfg.bodyId);

  if (!list.length) {
    body.innerHTML = '<tr><td colspan="4" class="empty-cell">Nothing added yet.</td></tr>';
    return;
  }
  body.innerHTML = list.map(function (item) {
    const n = usageCount(type, item.name);
    return '<tr>' +
      '<td>' + item.id + '</td>' +
      '<td><strong>' + esc(item.name) + '</strong></td>' +
      '<td>' + n + ' issue(s)</td>' +
      '<td class="actions">' +
        '<button class="btn btn-outline btn-sm" data-action="edit" data-type="' + type + '" data-id="' + item.id + '">Edit</button> ' +
        '<button class="btn btn-danger btn-sm" data-action="delete" data-type="' + type + '" data-id="' + item.id + '">Delete</button>' +
      '</td></tr>';
  }).join('');
}

// Naam check: faka, choto, ba duplicate hole error message dibe
function checkName(type, name, ignoreId) {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'At least 2 characters';
  const dup = getAll(type).some(function (x) {
    return x.name.toLowerCase() === name.toLowerCase() && x.id !== ignoreId;
  });
  return dup ? 'This name already exists' : '';
}

function setupEvents() {
  // ADD
  document.querySelectorAll('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () { addEntry(btn.dataset.add); });
  });
  ['buildings', 'categories'].forEach(function (type) {
    document.getElementById(CONFIG[type].inputId).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addEntry(type);
    });
  });

  // EDIT / DELETE (table button click)
  ['buildingBody', 'categoryBody'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const type = btn.dataset.type;
      const itemId = Number(btn.dataset.id);
      if (btn.dataset.action === 'edit') openEdit(type, itemId);
      if (btn.dataset.action === 'delete') removeEntry(type, itemId);
    });
  });

  document.getElementById('editCancel').addEventListener('click', closeEdit);
  document.getElementById('editForm').addEventListener('submit', saveEdit);
}

function addEntry(type) {
  const cfg = CONFIG[type];
  const input = document.getElementById(cfg.inputId);
  const name = input.value.trim();
  const msg = checkName(type, name, null);

  document.getElementById(cfg.errId).textContent = msg;
  input.classList.toggle('invalid', msg !== '');
  if (msg) return;

  addItem(type, { name: name });
  input.value = '';
  showToast(cfg.label + ' added');
  renderList(type);
}

function openEdit(type, id) {
  const item = getById(type, id);
  if (!item) return;
  editing = { type: type, id: id };
  document.getElementById('editTitle').textContent = 'Edit ' + CONFIG[type].label;
  document.getElementById('editName').value = item.name;
  document.getElementById('editNameError').textContent = '';
  document.getElementById('editOverlay').hidden = false;
}

function closeEdit() {
  document.getElementById('editOverlay').hidden = true;
  editing = null;
}

function saveEdit(e) {
  e.preventDefault();
  if (!editing) return;
  const type = editing.type;
  const old = getById(type, editing.id);
  const name = document.getElementById('editName').value.trim();
  const msg = checkName(type, name, editing.id);

  document.getElementById('editNameError').textContent = msg;
  if (msg) return;

  // Naam bodlale issue gulo te o notun naam boshbe
  if (old.name !== name) {
    const field = CONFIG[type].field;
    getAll('issues').forEach(function (i) {
      if (i[field] === old.name) {
        const change = {};
        change[field] = name;
        updateItem('issues', i.id, change);
      }
    });
  }
  updateItem(type, editing.id, { name: name });
  closeEdit();
  showToast(CONFIG[type].label + ' updated');
  renderList(type);
}

function removeEntry(type, id) {
  const item = getById(type, id);
  if (!item) return;
  const n = usageCount(type, item.name);

  if (n > 0) {
    showToast('Cannot delete: used in ' + n + ' issue(s)', 'error');
    return;
  }
  confirmDialog('Delete "' + item.name + '"?', function () {
    deleteItem(type, id);
    showToast(CONFIG[type].label + ' deleted');
    renderList(type);
  });
}