const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  document.getElementById(errorId).textContent = message;
  input.classList.toggle('invalid', message !== '');
  return message === '';
}

function checkName() {
  const v = document.getElementById('name').value.trim();
  if (!v) return showError('name', 'nameError', 'Name is required');
  if (v.length < 3) return showError('name', 'nameError', 'Name must be at least 3 characters');
  return showError('name', 'nameError', '');
}

function checkEmail() {
  const v = document.getElementById('email').value.trim();
  if (!v) return showError('email', 'emailError', 'Email is required');
  if (!emailPattern.test(v)) return showError('email', 'emailError', 'Enter a valid email address');
  return showError('email', 'emailError', '');
}

function checkRole() {
  const v = document.getElementById('role').value;
  if (!v) return showError('role', 'roleError', 'Please select a role');
  return showError('role', 'roleError', '');
}

function checkPassword(isRegister) {
  const v = document.getElementById('password').value;
  if (!v) return showError('password', 'passwordError', 'Password is required');
  if (isRegister) {
    if (v.length < 8) return showError('password', 'passwordError', 'Minimum 8 characters');
    if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v))
      return showError('password', 'passwordError', 'Use letters and numbers');
  }
  return showError('password', 'passwordError', '');
}

function checkConfirm() {
  const p = document.getElementById('password').value;
  const c = document.getElementById('confirmPassword').value;
  if (!c) return showError('confirmPassword', 'confirmError', 'Please confirm your password');
  if (p !== c) return showError('confirmPassword', 'confirmError', 'Passwords do not match');
  return showError('confirmPassword', 'confirmError', '');
}

// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const ok = [checkEmail(), checkPassword(false)].every(Boolean);
    if (ok) alert('Login validation passed (real login coming in next step)');
  });
}

// Register form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const ok = [checkName(), checkEmail(), checkRole(), checkPassword(true), checkConfirm()].every(Boolean);
    if (ok) alert('Register validation passed (saving coming in next step)');
  });
}