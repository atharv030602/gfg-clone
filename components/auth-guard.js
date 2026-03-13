/**
 * Auth Guard - Firebase authentication state management
 * Include this on every page to sync navbar auth state and protect routes.
 */

import { auth, isFirebaseConfigured } from '../database/firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getUserProfile } from '../api/firebase-client.js';

const PROTECTED_PAGES = ['dashboard.html', 'profile.html'];

let currentUser = null;

function isProtectedPage() {
    const path = window.location.pathname;
    return PROTECTED_PAGES.some(p => path.endsWith(p));
}

function updateNavbar(user) {
    const loginBtn = document.querySelector('.login-btn');
    const userMenuBtn = document.getElementById('userMenuBtn');

    if (!loginBtn) return;

    if (user) {
        // Replace login button with user menu
        loginBtn.textContent = user.displayName || user.email.split('@')[0];
        loginBtn.href = 'profile.html';
        loginBtn.classList.add('user-logged-in');

        // Add logout option
        if (!document.getElementById('logoutBtn')) {
            const logoutLi = document.createElement('li');
            logoutLi.innerHTML = '<a href="#" id="logoutBtn" class="logout-btn">Logout</a>';
            loginBtn.parentElement.parentElement.appendChild(logoutLi);

            document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                await signOut(auth);
                window.location.href = 'index.html';
            });
        }
    } else {
        loginBtn.textContent = 'Login';
        loginBtn.href = 'login.html';
        loginBtn.classList.remove('user-logged-in');

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.parentElement.remove();
    }
}

export function initAuthGuard() {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured. Auth features disabled.');
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        currentUser = user;

        if (user) {
            // Try to load profile data for display name
            try {
                const profile = await getUserProfile(user.uid);
                if (profile) {
                    updateNavbar({ ...user, displayName: profile.displayName || user.displayName });
                } else {
                    updateNavbar(user);
                }
            } catch {
                updateNavbar(user);
            }
        } else {
            updateNavbar(null);

            // Redirect from protected pages
            if (isProtectedPage()) {
                window.location.href = 'login.html';
            }
        }
    });
}

export function getCurrentUser() {
    return currentUser;
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthGuard);
} else {
    initAuthGuard();
}
