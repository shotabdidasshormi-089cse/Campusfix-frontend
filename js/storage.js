const DB_NAMES = ['users', 'buildings', 'categories', 'issues', 'updates', 'notes', 'notifications'];
function initDB() {
  DB_NAMES.forEach(function (name) {
    if (!localStorage.getItem('cf_' + name)) {
      localStorage.setItem('cf_' + name, JSON.stringify(SEED[name] || []));
    }
  });
}

function getAll(name) {
  return JSON.parse(localStorage.getItem('cf_' + name)) || [];
}

function saveAll(name, list) {
  localStorage.setItem('cf_' + name, JSON.stringify(list));
}

function getById(name, id) {
  return getAll(name).find(function (item) { return item.id === Number(id); });
}

// ADD
function addItem(name, item) {
  const list = getAll(name);
  item.id = list.length ? Math.max.apply(null, list.map(function (i) { return i.id; })) + 1 : 1;
  list.push(item);
  saveAll(name, list);
  return item;
}

// UPDATE
function updateItem(name, id, changes) {
  const list = getAll(name);
  const index = list.findIndex(function (i) { return i.id === Number(id); });
  if (index === -1) return null;
  list[index] = Object.assign({}, list[index], changes);
  saveAll(name, list);
  return list[index];
}

// DELETE
function deleteItem(name, id) {
  const list = getAll(name).filter(function (i) { return i.id !== Number(id); });
  saveAll(name, list);
}

initDB();