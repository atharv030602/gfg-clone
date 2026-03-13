/**
 * AI-Powered Search Component
 * Replaces basic keyword filtering with Gemini-powered natural language search.
 * Shows results in a dropdown below the search input.
 */

import { aiSearch } from '../api/gemini.js';

let searchTimeout = null;

function injectSearchStyles() {
    if (document.getElementById('ai-search-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-search-styles';
    style.textContent = `
        .search-container { position: relative; }
        .ai-search-results { position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-secondary, #fff); border: 1px solid var(--border-color, #dee2e6); border-radius: 0 0 8px 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 100; max-height: 400px; overflow-y: auto; display: none; }
        .ai-search-results.visible { display: block; animation: fadeInDown 0.2s ease; }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .search-result-item { padding: 12px 16px; border-bottom: 1px solid var(--border-color, #eee); cursor: pointer; transition: background 0.2s; display: flex; flex-direction: column; gap: 4px; }
        .search-result-item:hover { background: var(--bg-tertiary, #f0f0f0); }
        .search-result-item:last-child { border-bottom: none; }
        .search-result-title { font-weight: 600; color: var(--text-primary, #333); font-size: 0.95rem; }
        .search-result-desc { color: var(--text-secondary, #666); font-size: 0.8rem; }
        .search-result-meta { display: flex; gap: 8px; align-items: center; }
        .search-result-badge { background: var(--bg-tertiary, #e9ecef); color: var(--text-accent, #2F8D46); padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 500; }
        .search-result-score { color: var(--text-secondary, #999); font-size: 0.7rem; }
        .search-ai-badge { text-align: center; padding: 6px; font-size: 0.7rem; color: var(--text-accent, #2F8D46); border-top: 1px solid var(--border-color, #eee); }
        .search-loading { padding: 20px; text-align: center; color: var(--text-secondary, #666); font-size: 0.9rem; }
        .search-no-results { padding: 20px; text-align: center; color: var(--text-secondary, #666); font-size: 0.9rem; }
    `;
    document.head.appendChild(style);
}

function createResultsContainer(searchContainer) {
    let resultsDiv = searchContainer.querySelector('.ai-search-results');
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.className = 'ai-search-results';
        searchContainer.appendChild(resultsDiv);
    }
    return resultsDiv;
}

function displayResults(resultsDiv, data) {
    if (!data.results || data.results.length === 0) {
        resultsDiv.innerHTML = '<div class="search-no-results">No matching articles found.</div>';
        resultsDiv.classList.add('visible');
        return;
    }

    let html = data.results.map(r => `
        <a href="${r.url}" class="search-result-item" style="text-decoration:none">
            <div class="search-result-title">${r.title}</div>
            <div class="search-result-desc">${r.description || r.reason || ''}</div>
            <div class="search-result-meta">
                <span class="search-result-badge">${r.difficulty || ''}</span>
                ${r.relevanceScore ? `<span class="search-result-score">${r.relevanceScore}% match</span>` : ''}
            </div>
        </a>
    `).join('');

    if (data.aiPowered) {
        html += '<div class="search-ai-badge">✨ AI-powered results</div>';
    }

    resultsDiv.innerHTML = html;
    resultsDiv.classList.add('visible');
}

export function initAISearch() {
    injectSearchStyles();

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    const searchContainer = document.querySelector('.search-container');

    if (!searchInput || !searchContainer) return;

    const resultsDiv = createResultsContainer(searchContainer);

    async function performSearch(query) {
        if (!query || query.length < 2) {
            resultsDiv.classList.remove('visible');
            return;
        }

        resultsDiv.innerHTML = '<div class="search-loading">🔍 Searching...</div>';
        resultsDiv.classList.add('visible');

        try {
            const data = await aiSearch(query);
            displayResults(resultsDiv, data);
        } catch (err) {
            resultsDiv.innerHTML = '<div class="search-no-results">Search failed. Is the backend running?</div>';
        }
    }

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(e.target.value.trim()), 500);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            performSearch(e.target.value.trim());
        }
    });

    if (searchBtn) {
        searchBtn.addEventListener('click', () => performSearch(searchInput.value.trim()));
    }

    // Close results on outside click
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            resultsDiv.classList.remove('visible');
        }
    });
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAISearch);
} else {
    initAISearch();
}
