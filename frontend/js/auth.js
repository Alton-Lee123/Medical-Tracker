var API_BASE = 'http://localhost/Medical-Tracker/backend/api';

// Login
var loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var email    = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value.trim();

        fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.token) {
                localStorage.setItem('medtrack_token',   data.token);
                localStorage.setItem('medtrack_user_id', data.user_id);
                localStorage.setItem('medtrack_name',    data.name);
                localStorage.setItem('medtrack_role',    data.role);
                window.location.href = 'index.html';
            } else {
                document.getElementById('login-error').classList.remove('hidden');
            }
        })
        .catch(function() {
            document.getElementById('login-error').classList.remove('hidden');
        });
    });
}

// Register
var registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        var password = document.getElementById('reg-password').value.trim();
        var confirm  = document.getElementById('reg-confirm').value.trim();
        var error    = document.getElementById('reg-error');

        if (password !== confirm) {
            error.textContent = 'Passwords do not match.';
            error.classList.remove('hidden');
            return;
        }

        fetch(API_BASE + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name:     document.getElementById('reg-name').value.trim(),
                surname:  document.getElementById('reg-surname').value.trim(),
                email:    document.getElementById('reg-email').value.trim(),
                password: password,
                role:     document.getElementById('reg-role').value
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.user_id) {
                window.location.href = 'login.html';
            } else {
                error.textContent = data.error || 'Registration failed.';
                error.classList.remove('hidden');
            }
        })
        .catch(function() {
            error.textContent = 'Could not connect to server.';
            error.classList.remove('hidden');
        });
    });
}

// Logout
function logout() {
    var token = localStorage.getItem('medtrack_token');
    if (token) {
        fetch(API_BASE + '/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
    }
    localStorage.removeItem('medtrack_token');
    localStorage.removeItem('medtrack_user_id');
    localStorage.removeItem('medtrack_name');
    localStorage.removeItem('medtrack_role');
    window.location.href = 'login.html';
}
