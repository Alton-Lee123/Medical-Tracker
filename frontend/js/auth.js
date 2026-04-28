// MedTrack Auth — used by login.html and register.html only

const API_URL = 'http://localhost/medtrack/backend/api';

function saveAuth(data) {
    localStorage.setItem('medtrack_token', data.token);
    localStorage.setItem('medtrack_user', JSON.stringify({
        id:      data.user_id,
        name:    data.name,
        surname: data.surname,
        role:    data.role
    }));
}

function getToken() { return localStorage.getItem('medtrack_token'); }
function getUser()  { const u = localStorage.getItem('medtrack_user'); return u ? JSON.parse(u) : null; }

async function apiFetch(endpoint, method, body) {
    const response = await fetch(API_URL + endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────

const loginForm = document.getElementById('login-form');
if (loginForm) {
    // If already logged in, go straight to app
    if (getToken() && getUser()) {
        window.location.href = 'index.html';
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl  = document.getElementById('login-error');
        errorEl.classList.add('hidden');

        const btn = loginForm.querySelector('button[type="submit"]');
        btn.textContent = 'Logging in...';
        btn.disabled = true;

        try {
            const data = await apiFetch('/auth/login', 'POST', { email, password });
            saveAuth(data);
            window.location.href = 'index.html';
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
            btn.textContent = 'Log In';
            btn.disabled = false;
        }
    });
}

// ── REGISTER PAGE ─────────────────────────────────────────────────────────────

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name     = document.getElementById('reg-name').value.trim();
        const surname  = document.getElementById('reg-surname').value.trim();
        const email    = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm  = document.getElementById('reg-confirm') ? document.getElementById('reg-confirm').value : password;
        const role     = document.getElementById('reg-role').value;
        const errorEl  = document.getElementById('reg-error');
        errorEl.classList.add('hidden');

        if (password !== confirm) {
            errorEl.textContent = 'Passwords do not match.';
            errorEl.classList.remove('hidden');
            return;
        }

        if (password.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters.';
            errorEl.classList.remove('hidden');
            return;
        }

        const btn = registerForm.querySelector('button[type="submit"]');
        btn.textContent = 'Creating account...';
        btn.disabled = true;

        try {
            await apiFetch('/auth/register', 'POST', { name, surname, email, password, role });
            const data = await apiFetch('/auth/login', 'POST', { email, password });
            saveAuth(data);
            window.location.href = 'index.html';
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
            btn.textContent = 'Create Account';
            btn.disabled = false;
        }
    });
}
