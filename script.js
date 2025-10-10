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

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', function() {
    initializeLazyLoading();
    initializeFilterSort();
    initializeMobileMenu();
});
