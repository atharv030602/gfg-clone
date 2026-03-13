/**
 * Skeleton Loader Component
 * Creates animated placeholder UI while content loads.
 */

export function createCardSkeleton(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card fade-in" style="animation-delay: ${i * 0.1}s">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-header"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
            </div>
        `;
    }
    return html;
}

export function createListSkeleton(count = 5) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card" style="padding: 12px; margin-bottom: 8px; animation-delay: ${i * 0.05}s">
                <div class="skeleton skeleton-text" style="width: ${60 + Math.random() * 30}%"></div>
            </div>
        `;
    }
    return html;
}

export function showSkeleton(container, type = 'card', count = 3) {
    if (!container) return;
    container.innerHTML = type === 'card' ? createCardSkeleton(count) : createListSkeleton(count);
}

export function hideSkeleton(container) {
    if (!container) return;
    const skeletons = container.querySelectorAll('.skeleton-card');
    skeletons.forEach(s => s.remove());
}
