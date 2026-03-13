/**
 * Firebase Client - Firestore CRUD helpers
 * Provides data access for users, progress, favorites, and chat history.
 */

import { db, auth, isFirebaseConfigured } from '../database/firebase-config.js';
import {
    doc, getDoc, setDoc, updateDoc, deleteDoc,
    collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp,
    arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ============ USER PROFILE ============

export async function createUserProfile(uid, data) {
    await setDoc(doc(db, 'users', uid), {
        displayName: data.displayName || '',
        email: data.email || '',
        avatar: data.avatar || '',
        createdAt: serverTimestamp(),
        ...data
    });
}

export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
    await updateDoc(doc(db, 'users', uid), data);
}

// ============ COURSE PROGRESS ============

export async function getProgress(uid) {
    const snap = await getDoc(doc(db, 'progress', uid));
    return snap.exists() ? snap.data() : {};
}

export async function updateLessonProgress(uid, courseId, lessonId, completed) {
    const progressRef = doc(db, 'progress', uid);
    const snap = await getDoc(progressRef);

    let courseProgress = {};
    if (snap.exists()) {
        courseProgress = snap.data()[courseId] || { completedLessons: [], percentage: 0 };
    } else {
        await setDoc(progressRef, {});
    }

    let lessons = courseProgress.completedLessons || [];
    if (completed && !lessons.includes(lessonId)) {
        lessons.push(lessonId);
    } else if (!completed) {
        lessons = lessons.filter(l => l !== lessonId);
    }

    await updateDoc(progressRef, {
        [`${courseId}.completedLessons`]: lessons,
        [`${courseId}.percentage`]: Math.round((lessons.length / (courseProgress.totalLessons || 1)) * 100)
    });

    return { completedLessons: lessons, percentage: Math.round((lessons.length / (courseProgress.totalLessons || 1)) * 100) };
}

export async function initCourseProgress(uid, courseId, totalLessons) {
    const progressRef = doc(db, 'progress', uid);
    const snap = await getDoc(progressRef);

    if (!snap.exists()) {
        await setDoc(progressRef, {
            [courseId]: { completedLessons: [], percentage: 0, totalLessons }
        });
    } else if (!snap.data()[courseId]) {
        await updateDoc(progressRef, {
            [courseId]: { completedLessons: [], percentage: 0, totalLessons }
        });
    }
}

// ============ FAVORITES ============

export async function getFavorites(uid) {
    const snap = await getDoc(doc(db, 'favorites', uid));
    return snap.exists() ? (snap.data().articleIds || []) : [];
}

export async function toggleFavorite(uid, articleId) {
    const favRef = doc(db, 'favorites', uid);
    const snap = await getDoc(favRef);

    if (!snap.exists()) {
        await setDoc(favRef, { articleIds: [articleId] });
        return true; // added
    }

    const current = snap.data().articleIds || [];
    if (current.includes(articleId)) {
        await updateDoc(favRef, { articleIds: arrayRemove(articleId) });
        return false; // removed
    } else {
        await updateDoc(favRef, { articleIds: arrayUnion(articleId) });
        return true; // added
    }
}

// ============ CHAT HISTORY ============

export async function saveConversation(uid, conversationId, messages) {
    const convRef = doc(db, 'chatHistory', uid, 'conversations', conversationId);
    await setDoc(convRef, {
        messages,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function getConversations(uid, maxResults = 10) {
    const convCol = collection(db, 'chatHistory', uid, 'conversations');
    const q = query(convCol, orderBy('updatedAt', 'desc'), limit(maxResults));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getConversation(uid, conversationId) {
    const snap = await getDoc(doc(db, 'chatHistory', uid, 'conversations', conversationId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ============ UTILITY ============

export function getCurrentUser() {
    return auth.currentUser;
}

export { isFirebaseConfigured };
