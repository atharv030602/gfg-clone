/**
 * Progress Tracker - Course progress management
 * Adds checkboxes to lecture items and progress bars to sections.
 * Syncs progress with Firestore for logged-in users.
 */

import { auth, isFirebaseConfigured } from '../database/firebase-config.js';
import { getProgress, updateLessonProgress, initCourseProgress } from '../api/firebase-client.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const COURSE_ID = document.body.dataset.courseId || 'dsa-course';
let currentUid = null;
let progressData = { completedLessons: [], percentage: 0, totalLessons: 0 };

function injectProgressStyles() {
    if (document.getElementById('progress-tracker-styles')) return;
    const style = document.createElement('style');
    style.id = 'progress-tracker-styles';
    style.textContent = `
        .lesson-checkbox { width: 18px; height: 18px; accent-color: #2F8D46; cursor: pointer; flex-shrink: 0; }
        .lecture-item { display: flex; align-items: center; gap: 10px; }
        .lecture-item.completed .lecture-title { text-decoration: line-through; opacity: 0.6; }
        .section-progress-bar { width: 100%; height: 6px; background: var(--bg-tertiary, #e9ecef); border-radius: 3px; margin-top: 8px; overflow: hidden; }
        .section-progress-fill { height: 100%; background: linear-gradient(90deg, #2F8D46, #4CAF50); border-radius: 3px; transition: width 0.4s ease; }
        .section-progress-text { font-size: 0.8rem; color: var(--text-secondary, #666); margin-top: 4px; }
        .course-overall-progress { background: var(--bg-secondary, #fff); padding: 16px 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 10px var(--shadow-light, rgba(0,0,0,0.1)); border: 1px solid var(--border-color, #dee2e6); }
        .course-overall-progress h3 { margin: 0 0 8px; font-size: 1rem; color: var(--text-primary, #333); }
        .overall-progress-bar { width: 100%; height: 10px; background: var(--bg-tertiary, #e9ecef); border-radius: 5px; overflow: hidden; }
        .overall-progress-fill { height: 100%; background: linear-gradient(90deg, #2F8D46, #4CAF50); border-radius: 5px; transition: width 0.5s ease; }
        .overall-progress-text { font-size: 0.9rem; color: var(--text-accent, #2F8D46); font-weight: 600; margin-top: 6px; }
    `;
    document.head.appendChild(style);
}

function addCheckboxesToLectures() {
    const lectureItems = document.querySelectorAll('.lecture-item');
    lectureItems.forEach((item, index) => {
        if (item.querySelector('.lesson-checkbox')) return;

        const lessonId = `lesson-${index}`;
        item.dataset.lessonId = lessonId;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'lesson-checkbox';
        checkbox.checked = progressData.completedLessons.includes(lessonId);
        if (checkbox.checked) item.classList.add('completed');

        checkbox.addEventListener('change', async () => {
            if (checkbox.checked) {
                item.classList.add('completed');
            } else {
                item.classList.remove('completed');
            }

            if (currentUid && isFirebaseConfigured()) {
                try {
                    progressData = await updateLessonProgress(currentUid, COURSE_ID, lessonId, checkbox.checked);
                } catch (e) {
                    console.warn('Failed to save progress:', e);
                }
            } else {
                // Local-only tracking
                if (checkbox.checked && !progressData.completedLessons.includes(lessonId)) {
                    progressData.completedLessons.push(lessonId);
                } else if (!checkbox.checked) {
                    progressData.completedLessons = progressData.completedLessons.filter(l => l !== lessonId);
                }
                progressData.percentage = Math.round((progressData.completedLessons.length / progressData.totalLessons) * 100);
                localStorage.setItem(`progress_${COURSE_ID}`, JSON.stringify(progressData));
            }

            updateProgressBars();
        });

        item.insertBefore(checkbox, item.firstChild);
    });
}

function addSectionProgressBars() {
    const sections = document.querySelectorAll('.curriculum-section');
    sections.forEach(section => {
        if (section.querySelector('.section-progress-bar')) return;

        const content = section.querySelector('.section-content');
        if (!content) return;

        const lessons = content.querySelectorAll('.lecture-item');
        const total = lessons.length;
        const completed = Array.from(lessons).filter(l => l.classList.contains('completed')).length;

        const header = section.querySelector('.section-header');
        if (header) {
            const bar = document.createElement('div');
            bar.className = 'section-progress-bar';
            bar.innerHTML = `<div class="section-progress-fill" style="width: ${total > 0 ? (completed / total * 100) : 0}%"></div>`;
            header.appendChild(bar);

            const text = document.createElement('div');
            text.className = 'section-progress-text';
            text.textContent = `${completed}/${total} completed`;
            header.appendChild(text);
        }
    });
}

function addOverallProgressBar() {
    const curriculum = document.querySelector('.course-curriculum');
    if (!curriculum || document.querySelector('.course-overall-progress')) return;

    const overall = document.createElement('div');
    overall.className = 'course-overall-progress';
    overall.innerHTML = `
        <h3>Course Progress</h3>
        <div class="overall-progress-bar"><div class="overall-progress-fill" id="overallFill" style="width: ${progressData.percentage}%"></div></div>
        <div class="overall-progress-text" id="overallText">${progressData.percentage}% complete (${progressData.completedLessons.length}/${progressData.totalLessons} lessons)</div>
    `;
    curriculum.insertBefore(overall, curriculum.firstChild);
}

function updateProgressBars() {
    // Update overall
    const fill = document.getElementById('overallFill');
    const text = document.getElementById('overallText');
    if (fill) fill.style.width = `${progressData.percentage}%`;
    if (text) text.textContent = `${progressData.percentage}% complete (${progressData.completedLessons.length}/${progressData.totalLessons} lessons)`;

    // Update section bars
    document.querySelectorAll('.curriculum-section').forEach(section => {
        const content = section.querySelector('.section-content');
        if (!content) return;
        const lessons = content.querySelectorAll('.lecture-item');
        const total = lessons.length;
        const completed = Array.from(lessons).filter(l => l.classList.contains('completed')).length;

        const sectionFill = section.querySelector('.section-progress-fill');
        const sectionText = section.querySelector('.section-progress-text');
        if (sectionFill) sectionFill.style.width = `${total > 0 ? (completed / total * 100) : 0}%`;
        if (sectionText) sectionText.textContent = `${completed}/${total} completed`;
    });
}

export async function initProgressTracker() {
    injectProgressStyles();

    const allLessons = document.querySelectorAll('.lecture-item');
    progressData.totalLessons = allLessons.length;

    if (isFirebaseConfigured()) {
        onAuthStateChanged(auth, async (user) => {
            currentUid = user?.uid || null;
            if (currentUid) {
                try {
                    await initCourseProgress(currentUid, COURSE_ID, allLessons.length);
                    const allProgress = await getProgress(currentUid);
                    if (allProgress[COURSE_ID]) {
                        progressData = { ...allProgress[COURSE_ID], totalLessons: allLessons.length };
                    }
                } catch (e) { console.warn('Failed to load progress:', e); }
            } else {
                // Load from localStorage
                const stored = localStorage.getItem(`progress_${COURSE_ID}`);
                if (stored) progressData = JSON.parse(stored);
            }
            addCheckboxesToLectures();
            addSectionProgressBars();
            addOverallProgressBar();
        });
    } else {
        const stored = localStorage.getItem(`progress_${COURSE_ID}`);
        if (stored) progressData = JSON.parse(stored);
        addCheckboxesToLectures();
        addSectionProgressBars();
        addOverallProgressBar();
    }
}

// Auto-init if on a course page
if (document.querySelector('.curriculum-section')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProgressTracker);
    } else {
        initProgressTracker();
    }
}
