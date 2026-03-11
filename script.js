// GeeksforGeeks Clone JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initializeTheme();
    
    // Initialize search functionality
    initializeSearch();
    
    // Hamburger Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Smooth Scrolling for Navigation Links
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only apply smooth scrolling to anchor links
            if (href.startsWith('#')) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 70; // Account for fixed header
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
                
                // Close mobile menu if open
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.article-card, .practice-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // CTA Button Click Animation
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    }

    // Header background change on scroll
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'linear-gradient(135deg, #2F8D46, #0F7B0F)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'linear-gradient(135deg, #2F8D46, #0F7B0F)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });
});

// Add CSS for mobile menu
const mobileMenuStyles = `
@media (max-width: 768px) {
    .nav-menu {
        position: fixed;
        left: -100%;
        top: 70px;
        flex-direction: column;
        background: linear-gradient(135deg, #2F8D46, #0F7B0F);
        width: 100%;
        text-align: center;
        transition: 0.3s;
        box-shadow: 0 10px 27px rgba(0, 0, 0, 0.05);
        z-index: 999;
    }

    .nav-menu.active {
        left: 0;
    }

    .nav-links {
        flex-direction: column;
        gap: 0;
        padding: 20px 0;
    }

    .nav-links li {
        margin: 10px 0;
    }

    .nav-links li a {
        padding: 15px 20px;
        display: block;
        border-radius: 0;
    }

    .hamburger.active .bar:nth-child(2) {
        opacity: 0;
    }

    .hamburger.active .bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
    }

    .hamburger.active .bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
    }
}
`;

// Inject mobile menu styles
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileMenuStyles;
document.head.appendChild(styleSheet);

// Theme functionality
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            filterArticles(query);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.toLowerCase();
                filterArticles(query);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput ? searchInput.value.toLowerCase() : '';
            filterArticles(query);
        });
    }
}

function filterArticles(query) {
    const articles = document.querySelectorAll('.article-card');
    
    articles.forEach(article => {
        const title = article.querySelector('h3') ? article.querySelector('h3').textContent.toLowerCase() : '';
        const content = article.querySelector('p') ? article.querySelector('p').textContent.toLowerCase() : '';
        
        if (query === '' || title.includes(query) || content.includes(query)) {
            article.style.display = 'block';
            article.style.animation = 'fadeIn 0.5s ease';
        } else {
            article.style.display = 'none';
        }
    });
}

// Add fade in animation
const fadeInStyles = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
`;

const fadeInStyleSheet = document.createElement('style');
fadeInStyleSheet.textContent = fadeInStyles;
document.head.appendChild(fadeInStyleSheet);

// Performance optimization - Lazy loading
function initializeLazyLoading() {
    const images = document.querySelectorAll('img');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        img.classList.add('lazy-image');
        imageObserver.observe(img);
    });
}

// Filter and Sort functionality
const articles = [
    {
        title: 'Complete Guide to Data Structures',
        topic: 'data-structures',
        difficulty: 'intermediate',
        readTime: 8,
        date: '2025-10-09',
        popularity: 120,
        element: null
    },
    {
        title: 'Algorithm Design Patterns',
        topic: 'algorithms',
        difficulty: 'advanced',
        readTime: 12,
        date: '2025-10-08',
        popularity: 95,
        element: null
    },
    {
        title: 'Technical Interview Preparation',
        topic: 'interview',
        difficulty: 'intermediate',
        readTime: 10,
        date: '2025-10-07',
        popularity: 180,
        element: null
    },
    {
        title: 'Python Programming Fundamentals',
        topic: 'python',
        difficulty: 'beginner',
        readTime: 15,
        date: '2025-10-06',
        popularity: 200,
        element: null
    },
    {
        title: 'Modern Web Development',
        topic: 'web-development',
        difficulty: 'intermediate',
        readTime: 20,
        date: '2025-10-05',
        popularity: 150,
        element: null
    },
    {
        title: 'Introduction to Machine Learning',
        topic: 'machine-learning',
        difficulty: 'advanced',
        readTime: 18,
        date: '2025-10-04',
        popularity: 175,
        element: null
    }
];

function initializeFilterSort() {
    const articlesGrid = document.getElementById('articlesGrid');
    const articleElements = articlesGrid ? articlesGrid.querySelectorAll('.article-card') : [];
    
    // Map article elements to data
    articles.forEach((article, index) => {
        if (articleElements[index]) {
            article.element = articleElements[index];
        }
    });

    // Add event listeners
    const difficultyFilter = document.getElementById('difficultyFilter');
    const topicFilter = document.getElementById('topicFilter');
    const sortButtons = document.querySelectorAll('.sort-btn');

    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', applyFilters);
    }
    
    if (topicFilter) {
        topicFilter.addEventListener('change', applyFilters);
    }

    sortButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            sortButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });
}

function applyFilters() {
    const difficultyFilter = document.getElementById('difficultyFilter');
    const topicFilter = document.getElementById('topicFilter');
    const activeSort = document.querySelector('.sort-btn.active');
    
    const difficulty = difficultyFilter ? difficultyFilter.value : 'all';
    const topic = topicFilter ? topicFilter.value : 'all';
    const sortBy = activeSort ? activeSort.dataset.sort : 'date';

    // Filter articles
    let filteredArticles = articles.filter(article => {
        const matchesDifficulty = difficulty === 'all' || article.difficulty === difficulty;
        const matchesTopic = topic === 'all' || article.topic === topic;
        return matchesDifficulty && matchesTopic;
    });

    // Sort articles
    filteredArticles.sort((a, b) => {
        switch(sortBy) {
            case 'popular':
                return b.popularity - a.popularity;
            case 'read-time':
                return a.readTime - b.readTime;
            case 'date':
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });

    // Show/hide articles with animation
    articles.forEach(article => {
        if (article.element) {
            const shouldShow = filteredArticles.includes(article);
            if (shouldShow) {
                article.element.style.display = 'block';
                article.element.style.animation = 'fadeIn 0.5s ease';
            } else {
                article.element.style.display = 'none';
            }
        }
    });

    // Reorder visible articles
    const articlesGrid = document.getElementById('articlesGrid');
    if (articlesGrid) {
        filteredArticles.forEach((article, index) => {
            if (article.element) {
                article.element.style.order = index;
            }
        });
    }
}

// Enhanced mobile hamburger functionality
function initializeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

// Performance Optimization Class
class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.init();
    }

    init() {
        this.initContentCaching();
        this.preloadCriticalResources();
        this.monitorPerformance();
    }

    // Content Caching System
    initContentCaching() {
        this.cacheAPI = {
            set: (key, data, expiry = 300000) => {
                const item = { data, timestamp: Date.now(), expiry };
                try {
                    localStorage.setItem(`gfg_${key}`, JSON.stringify(item));
                    this.cache.set(key, data);
                } catch (e) {
                    console.warn('LocalStorage full, using memory cache only');
                    this.cache.set(key, data);
                }
            },

            get: (key) => {
                if (this.cache.has(key)) return this.cache.get(key);
                
                try {
                    const item = localStorage.getItem(`gfg_${key}`);
                    if (!item) return null;
                    
                    const parsed = JSON.parse(item);
                    if (Date.now() - parsed.timestamp > parsed.expiry) {
                        localStorage.removeItem(`gfg_${key}`);
                        return null;
                    }
                    
                    this.cache.set(key, parsed.data);
                    return parsed.data;
                } catch (e) {
                    return null;
                }
            },

            clear: () => {
                this.cache.clear();
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('gfg_')) localStorage.removeItem(key);
                });
            }
        };
    }

    // Preload Critical Resources
    preloadCriticalResources() {
        const resources = [{ href: 'styles.css', as: 'style' }];
        
        resources.forEach(resource => {
            if (!document.querySelector(`link[href="${resource.href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.href;
                link.as = resource.as;
                document.head.appendChild(link);
            }
        });
    }

    // Performance Monitoring
    monitorPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                    
                    console.log('📊 Performance:', {
                        'Load Time': `${loadTime}ms`,
                        'DOM Time': `${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`
                    });
                    
                    if (loadTime > 3000) {
                        console.warn('⚠️ Slow page load detected');
                    }
                }, 0);
            });
        }
    }

    // Utility Functions
    static debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    static throttle(func, delay) {
        let lastCall = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    }
}

// Initialize Performance Optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Enhanced Search with Performance
function enhancedSearch(query) {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = performanceOptimizer.cacheAPI.get(cacheKey);
    
    if (cached) {
        displaySearchResults(cached);
        return;
    }
    
    // Show loading
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.innerHTML = '<div class="pulse-loader"><div class="pulse-dot"></div></div>';
    }
    
    // Simulate API call
    setTimeout(() => {
        const results = [
            { title: `${query} Tutorial`, type: 'article' },
            { title: `${query} Practice`, type: 'practice' }
        ];
        
        performanceOptimizer.cacheAPI.set(cacheKey, results, 600000);
        displaySearchResults(results);
        
        if (searchBtn) searchBtn.innerHTML = '🔍';
    }, 300);
}

function displaySearchResults(results) {
    console.log('🔍 Results:', results);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('✅ SW registered'))
            .catch(err => console.log('❌ SW failed'));
    });
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Core functionality
    initializeTheme();
    initializeSearch();
    initializeLazyLoading();
    initializeFilterSort();
    initializeMobileMenu();
    initializeProgressTracking();
    initializeChatbot();
    
    // Performance optimizations
    document.querySelectorAll('.fade-in').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.1}s`;
    });
    
    // Clean up old cache
    setInterval(() => {
        const oldKeys = Object.keys(localStorage).filter(key => {
            if (!key.startsWith('gfg_')) return false;
            try {
                const item = JSON.parse(localStorage.getItem(key));
                return Date.now() - item.timestamp > item.expiry;
            } catch { return true; }
        });
        oldKeys.forEach(key => localStorage.removeItem(key));
    }, 300000);
    
    console.log('🚀 GeeksforGeeks Clone initialized with optimizations!');
});

function initializeChatbot() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const chatbot = document.getElementById('chatbot');
    const closeBtn = document.getElementById('chatbot-close');
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
    const messagesEl = document.getElementById('chatbot-messages');

    if (!toggleBtn || !chatbot || !closeBtn || !form || !input || !messagesEl) return;

    const openChat = () => {
        chatbot.classList.add('chatbot-open');
        setTimeout(() => input.focus(), 0);
    };

    const closeChat = () => {
        chatbot.classList.remove('chatbot-open');
    };

    toggleBtn.addEventListener('click', () => {
        if (chatbot.classList.contains('chatbot-open')) closeChat();
        else openChat();
    });

    closeBtn.addEventListener('click', closeChat);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeChat();
    });

    const appendMessage = ({ role, text }) => {
        const wrapper = document.createElement('div');
        wrapper.className = `chatbot-message chatbot-message-${role}`;

        const sender = document.createElement('div');
        sender.className = 'chatbot-message-sender';
        sender.textContent = role === 'user' ? 'You' : 'AI';

        const bubble = document.createElement('div');
        bubble.className = 'chatbot-message-bubble';
        bubble.textContent = text;

        wrapper.appendChild(sender);
        wrapper.appendChild(bubble);
        messagesEl.appendChild(wrapper);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const getApiKey = () => localStorage.getItem('gemini_api_key') || '';

    const ensureApiKey = () => {
        let key = getApiKey();
        if (key) return key;
        key = window.prompt('Enter your Gemini API key (it will be stored in this browser).');
        if (!key) return '';
        localStorage.setItem('gemini_api_key', key.trim());
        return key.trim();
    };

    const callGemini = async ({ apiKey, userText }) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: userText }] }],
                generationConfig: {
                    temperature: 0.6,
                    maxOutputTokens: 512
                }
            })
        });

        const data = await res.json();
        if (!res.ok) {
            const message = data?.error?.message || `Request failed (${res.status})`;
            throw new Error(message);
        }

        const text =
            data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') ||
            '';
        return text || "I couldn't generate a response.";
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userText = input.value.trim();
        if (!userText) return;

        appendMessage({ role: 'user', text: userText });
        input.value = '';

        const apiKey = ensureApiKey();
        if (!apiKey) {
            appendMessage({ role: 'ai', text: 'Missing API key. Please add one to continue.' });
            return;
        }

        appendMessage({ role: 'ai', text: 'Thinking…' });
        const thinkingNode = messagesEl.lastElementChild;

        try {
            const reply = await callGemini({ apiKey, userText });
            if (thinkingNode) thinkingNode.querySelector('.chatbot-message-bubble').textContent = reply;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Something went wrong.';
            if (thinkingNode) thinkingNode.querySelector('.chatbot-message-bubble').textContent = `Error: ${msg}`;
        }
    });
}
