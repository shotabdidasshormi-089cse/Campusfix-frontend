const user = requireLogin(['student']);
let photoData = '';

if (user) {
  renderLayout(user, 'report.html');
  fillSelects();
  setupPhoto();
  setupForm();
}

function fillSelects() {
  const cat = document.getElementById('category');
  const bld = document.getElementById('building');
  cat.innerHTML = '<option value="">Select category</option>' +
    getAll('categories').map(function (c) {
      return '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
    }).join('');
  bld.innerHTML = '<option value="">Select building</option>' +
    getAll('buildings').map(function (b) {
      return '<option value="' + esc(b.name) + '">' + esc(b.name) + '</option>';
    }).join('');
}

function setErr(id, msg) {
  document.getElementById(id + 'Error').textContent = msg;
  document.getElementById(id).classList.toggle('invalid', msg !== '');
  return msg === '';
}

function setupPhoto() {
  const input = document.getElementById('photo');
  const box = document.getElementById('photoPreview');
  const img = document.getElementById('previewImg');

  input.addEventListener('change', function () {
    const file = input.files[0];
    photoData = '';
    box.hidden = true;
    setErr('photo', '');
    if (!file) return;

    if (file.type.indexOf('image/') !== 0) {
      setErr('photo', 'Please choose an image file');
      input.value = '';
      return;
    }
    if (file.size > 500 * 1024) {
      setErr('photo', 'Image is too large (max 500 KB)');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      photoData = e.target.result;
      img.src = photoData;
      box.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('removePhoto').addEventListener('click', function () {
    input.value = '';
    photoData = '';
    box.hidden = true;
  });
}

function setupForm() {
  document.getElementById('reportForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const building = document.getElementById('building').value;
    const room = document.getElementById('room').value.trim();
    const priority = document.getElementById('priority').value;
    const description = document.getElementById('description').value.trim();

    const ok = [
      setErr('title', !title ? 'Title is required' : title.length < 5 ? 'At least 5 characters' : ''),
      setErr('category', !category ? 'Select a category' : ''),
      setErr('building', !building ? 'Select a building' : ''),
      setErr('room', !room ? 'Room or location is required' : ''),
      setErr('description', !description ? 'Description is required' : description.length < 10 ? 'At least 10 characters' : '')
    ].every(Boolean);
    if (!ok) return;

    const today = new Date().toISOString().slice(0, 10);
    try {
      const issue = addItem('issues', {
        title: title, category: category, building: building, room: room,
        priority: priority, status: 'Open', description: description,
        photo: photoData, reporterId: user.id, assignedTo: null, createdAt: today
      });
      addItem('updates', { issueId: issue.id, text: 'Issue reported', status: 'Open', date: today });

      document.getElementById('reportId').textContent = 'CF-' + String(issue.id).padStart(4, '0');
      document.getElementById('formCard').hidden = true;
      document.getElementById('successBox').hidden = false;
      showToast('Report submitted successfully');
    } catch (err) {
      showToast('Could not save. Try a smaller photo.', 'error');
    }
  });

  document.getElementById('newReportBtn').addEventListener('click', function () {
    window.location.reload();
  });
}