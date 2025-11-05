// ===== ПРОСТАЯ НАВИГАЦИЯ БЕЗ FULLPAGE SCROLL =====
// Fullpage scroll ПОЛНОСТЬЮ ОТКЛЮЧЕН - он мешал нормальной работе
// Теперь используется только обычный scroll + glassmorphism навигация

// Smooth scroll для всех ссылок и кнопок
function initSmoothScroll() {
    // Находим ВСЕ ссылки с #
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();

            // Получаем ID секции
            const targetId = href.replace('#', '');

            // Ищем секцию по data-section ИЛИ по ID
            let targetSection = document.querySelector(`[data-section="${targetId}"]`);
            if (!targetSection) {
                targetSection = document.getElementById(targetId);
            }

            console.log('🔗 Клик по ссылке:', href);
            console.log('🎯 Найдена секция:', targetSection);

            if (targetSection) {
                // Плавный скролл к секции
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                console.warn('⚠️ Секция не найдена:', href);
            }
        });
    });

    console.log('✅ Навигация инициализирована для', document.querySelectorAll('a[href^="#"]').length, 'ссылок');
}

// ===== Portfolio Loading with Image Carousel =====

// Helper function to get localized portfolio text
function getLocalizedText(item, field) {
    const lang = localStorage.getItem('language') || 'me';

    // Russian is the main language now
    const ruField = `${field}_ru`;

    if (lang === 'ru') {
        // For Russian, use Russian field
        return item[ruField] || '';
    } else if (lang === 'me') {
        // For Montenegrin, try: Montenegrin field -> Russian (main) -> empty
        return item[field] || item[ruField] || '';
    } else {
        // For other languages (en, uk), try: requested language -> Russian (main) -> Montenegrin -> empty
        const langField = `${field}_${lang}`;
        return item[langField] || item[ruField] || item[field] || '';
    }
}

// Глобальные переменные (оставлены для совместимости)
let currentProjectSlide = 0;
let portfolioProjects = [];

async function loadPortfolio() {
    const portfolioGrid = document.getElementById('portfolioGrid');

    try {
        const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const items = await response.json();

        if (items.length === 0) {
            portfolioGrid.innerHTML = '<div class="portfolio-placeholder"><p data-translate="portfolio.loading">Пока нет проектов</p></div>';
            return;
        }

        // Сохраняем проекты для карусели
        portfolioProjects = items;

        // Создаём обёртку для карусели (3 карточки в ряд на ПК, слайдинг влево-вправо)
        portfolioGrid.innerHTML = `
            <div class="portfolio-carousel-wrapper">
                <button class="portfolio-nav-btn portfolio-nav-prev" onclick="changeProjectSlide(-1)">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>

                <div class="portfolio-carousel-container">
                    ${items.map((item, index) => {
            const title = getLocalizedText(item, 'title');
            const description = getLocalizedText(item, 'description');

            return `
            <div class="portfolio-item" data-item-id="${item.id}" data-item-index="${index}">
                <div class="portfolio-carousel">
                    ${item.images.map((img, imgIndex) => `
                        <img src="${img}"
                             alt="${title}"
                             class="portfolio-image ${imgIndex === 0 ? 'active' : ''}"
                             data-index="${imgIndex}"
                             draggable="false"
                             onclick="openImageZoom(${index}, ${imgIndex})">
                    `).join('')}
                    ${item.images.length > 1 ? `
                        <button class="carousel-btn carousel-prev" onclick="changeImage(${index}, -1)">‹</button>
                        <button class="carousel-btn carousel-next" onclick="changeImage(${index}, 1)">›</button>
                        <div class="carousel-dots">
                            ${item.images.map((_, dotIndex) => `
                                <span class="carousel-dot ${dotIndex === 0 ? 'active' : ''}"
                                      onclick="goToImage(${index}, ${dotIndex})"></span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <button class="zoom-btn" onclick="event.stopPropagation(); openImageZoomCurrent(${index})">
                        <img src="https://cdn-icons-png.flaticon.com/512/5049/5049893.png" alt="Zoom">
                    </button>
                </div>
                <div class="portfolio-info">
                    <h3 class="portfolio-title">${title}</h3>
                    <div class="portfolio-description-wrapper">
                        <p class="portfolio-description" data-full-text="${description.replace(/"/g, '&quot;')}">${description}</p>
                        <button class="portfolio-expand-btn" onclick="toggleProjectDescription(${index})">
                            <span class="expand-text" data-translate="portfolio.readMore">Читать далее</span>
                            <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
                }).join('')}
                </div>

                <button class="portfolio-nav-btn portfolio-nav-next" onclick="changeProjectSlide(1)">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        `;

        // Инициализируем карусель проектов
        initProjectsCarousel();

    } catch (error) {
        console.error('Error loading portfolio:', error);
        portfolioGrid.innerHTML = '<div class="portfolio-placeholder"><p>Не удалось загрузить портфолио. Попробуйте позже.</p></div>';
    }
}

// ===== КАРУСЕЛЬ ПРОЕКТОВ (адаптивная для всех устройств) =====
function initProjectsCarousel() {
    currentProjectSlide = 0;
    updateProjectsCarousel();
    initTouchSwipe(); // Добавляем свайпы для мобильных
}

function getCardsPerView() {
    const width = window.innerWidth;
    if (width >= 1024) return 3; // Десктоп: 3 карточки
    if (width >= 768) return 2;  // Планшет: 2 карточки
    return 1; // Мобильный: 1 карточка
}

function updateProjectsCarousel() {
    const container = document.querySelector('.portfolio-carousel-container');
    const items = document.querySelectorAll('.portfolio-item');
    const prevBtn = document.querySelector('.portfolio-nav-prev');
    const nextBtn = document.querySelector('.portfolio-nav-next');

    if (!container || items.length === 0) return;

    const cardsPerView = getCardsPerView();
    const containerStyles = window.getComputedStyle(container);
    const gap = parseInt(containerStyles.gap) || 0;

    // Ограничиваем слайды
    const maxSlides = Math.max(0, items.length - cardsPerView);
    if (currentProjectSlide < 0) currentProjectSlide = 0;
    if (currentProjectSlide > maxSlides) currentProjectSlide = maxSlides;

    // Берем реальную ширину карточки (включая все отступы)
    const itemWidth = items[0].offsetWidth;
    const offset = -(currentProjectSlide * (itemWidth + gap));

    container.style.transform = `translateX(${offset}px)`;
    container.style.transition = 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';

    // Обновляем состояние кнопок (активность/неактивность)
    if (prevBtn) {
        prevBtn.disabled = currentProjectSlide <= 0;
        prevBtn.style.opacity = currentProjectSlide <= 0 ? '0.3' : '1';
    }
    if (nextBtn) {
        nextBtn.disabled = currentProjectSlide >= maxSlides;
        nextBtn.style.opacity = currentProjectSlide >= maxSlides ? '0.3' : '1';
    }

    // Обновляем индикаторы точек
    updateCarouselDots();
}

// Блокировка быстрых нажатий
let isSliding = false;

window.changeProjectSlide = function(direction) {
    // Если уже идет анимация - игнорируем клик
    if (isSliding) return;

    isSliding = true;

    const items = document.querySelectorAll('.portfolio-item');
    const cardsPerView = getCardsPerView();
    const maxSlides = Math.max(0, items.length - cardsPerView);

    currentProjectSlide += direction;
    if (currentProjectSlide < 0) currentProjectSlide = 0;
    if (currentProjectSlide > maxSlides) currentProjectSlide = maxSlides;

    updateProjectsCarousel();

    // Разблокируем через 500мс (длительность анимации)
    setTimeout(() => {
        isSliding = false;
    }, 500);
};

// Добавляем индикаторы точек для мобильной карусели
function updateCarouselDots() {
    const items = document.querySelectorAll('.portfolio-item');
    const cardsPerView = getCardsPerView();
    const maxSlides = items.length - cardsPerView;

    let dotsContainer = document.querySelector('.portfolio-carousel-dots');

    // Показываем точки только на мобильных и планшетах
    if (window.innerWidth >= 1024 || items.length <= cardsPerView) {
        if (dotsContainer) dotsContainer.style.display = 'none';
        return;
    }

    if (!dotsContainer) {
        dotsContainer = document.createElement('div');
        dotsContainer.className = 'portfolio-carousel-dots';
        document.querySelector('.portfolio-carousel-wrapper').appendChild(dotsContainer);
    }

    dotsContainer.style.display = 'flex';
    dotsContainer.innerHTML = '';

    for (let i = 0; i <= maxSlides; i++) {
        const dot = document.createElement('span');
        dot.className = 'portfolio-dot' + (i === currentProjectSlide ? ' active' : '');
        dot.onclick = () => {
            currentProjectSlide = i;
            updateProjectsCarousel();
        };
        dotsContainer.appendChild(dot);
    }
}

// Touch swipe для мобильных устройств (улучшенная версия)
function initTouchSwipe() {
    const container = document.querySelector('.portfolio-carousel-container');
    if (!container) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isSwiping = false;

    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isSwiping = false;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!isSwiping) {
            const currentX = e.changedTouches[0].screenX;
            const currentY = e.changedTouches[0].screenY;
            const diffX = Math.abs(currentX - touchStartX);
            const diffY = Math.abs(currentY - touchStartY);

            // Определяем что это горизонтальный свайп (не вертикальный скролл)
            if (diffX > diffY && diffX > 10) {
                isSwiping = true;
            }
        }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;

        if (isSwiping) {
            handleSwipe();
        }
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 75; // Увеличили порог для более уверенного свайпа
        const diffX = touchStartX - touchEndX;
        const diffY = Math.abs(touchStartY - touchEndY);

        // Проверяем что это горизонтальный свайп
        if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > diffY * 2) {
            if (diffX > 0) {
                // Свайп влево - следующий слайд
                changeProjectSlide(1);
            } else {
                // Свайп вправо - предыдущий слайд
                changeProjectSlide(-1);
            }
        }
    }
}

// Обновляем карусель при изменении размера окна
let carouselResizeTimeout;
let lastWindowWidth = window.innerWidth;

window.addEventListener('resize', () => {
    clearTimeout(carouselResizeTimeout);
    carouselResizeTimeout = setTimeout(() => {
        const newWidth = window.innerWidth;

        // Сбрасываем только если действительно изменился размер экрана (не просто скролл)
        if (Math.abs(newWidth - lastWindowWidth) > 10) {
            if (portfolioProjects.length > 0) {
                currentProjectSlide = 0;
                updateProjectsCarousel();
            }
            lastWindowWidth = newWidth;
        } else {
            // Просто обновляем без сброса позиции
            if (portfolioProjects.length > 0) {
                updateProjectsCarousel();
            }
        }
    }, 200);
});

// ===== КАРУСЕЛЬ ИЗОБРАЖЕНИЙ ВНУТРИ ПРОЕКТА (старая логика) =====
// Carousel navigation functions
window.changeImage = function(itemIndex, direction) {
    const item = document.querySelectorAll('.portfolio-item')[itemIndex];
    if (!item) return;

    const images = item.querySelectorAll('.portfolio-image');
    const dots = item.querySelectorAll('.carousel-dot');
    let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));

    images[currentIndex].classList.remove('active');
    dots[currentIndex]?.classList.remove('active');

    currentIndex = (currentIndex + direction + images.length) % images.length;

    images[currentIndex].classList.add('active');
    dots[currentIndex]?.classList.add('active');
}

window.goToImage = function(itemIndex, imageIndex) {
    const item = document.querySelectorAll('.portfolio-item')[itemIndex];
    if (!item) return;

    const images = item.querySelectorAll('.portfolio-image');
    const dots = item.querySelectorAll('.carousel-dot');

    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    images[imageIndex].classList.add('active');
    dots[imageIndex].classList.add('active');
}

// Auto-advance carousel
function startAutoplay() {
    setInterval(() => {
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        portfolioItems.forEach((item, index) => {
            const images = item.querySelectorAll('.portfolio-image');
            if (images.length > 1) {
                changeImage(index, 1);
            }
        });
    }, 5000); // Change every 5 seconds
}

// ===== Contact Form Removed - Now using Google Maps =====

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.stat-box, .info-item').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
});

// ===== Secret Admin Access (3 taps on logo) =====
let tapCount = 0;
let tapTimer = null;

const logoTitle = document.getElementById('logoTitle');
if (logoTitle) {
    logoTitle.addEventListener('click', () => {
        tapCount++;

        // Clear previous timer
        if (tapTimer) {
            clearTimeout(tapTimer);
        }

        // If 3 taps detected, redirect to admin
        if (tapCount === 3) {
            console.log('🔐 Secret admin access activated!');

            // Check if user is already logged in
            const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';

            if (isLoggedIn) {
                // If logged in, go directly to admin panel
                window.location.href = '/admin';
            } else {
                // If not logged in, go to login page
                window.location.href = '/admin';
            }

            tapCount = 0;
            return;
        }

        // Reset counter after 1 second of inactivity
        tapTimer = setTimeout(() => {
            tapCount = 0;
        }, 1000);
    });

    // Add cursor pointer on hover
    logoTitle.style.cursor = 'pointer';
    logoTitle.style.userSelect = 'none';
}

// ===== Image Zoom Modal =====
let currentZoomItemIndex = 0;
let currentZoomImageIndex = 0;
let zoomImages = [];

window.openImageZoom = function(itemIndex, imageIndex) {
    // Берём изображения напрямую из массива проектов, а не из DOM
    const project = portfolioProjects[itemIndex];
    if (!project || !project.images) return;

    zoomImages = project.images;
    currentZoomItemIndex = itemIndex;
    currentZoomImageIndex = imageIndex;

    const modal = document.getElementById('imageZoomModal');
    const zoomImage = document.getElementById('zoomImage');
    const zoomDots = document.getElementById('zoomDots');

    zoomImage.src = zoomImages[imageIndex];
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Create dots for zoom modal
    if (zoomImages.length > 1) {
        zoomDots.innerHTML = zoomImages.map((_, idx) => `
            <span class="zoom-dot ${idx === imageIndex ? 'active' : ''}"
                  onclick="goToZoomImage(${idx})"></span>
        `).join('');
        document.querySelector('.zoom-prev').style.display = 'flex';
        document.querySelector('.zoom-next').style.display = 'flex';
    } else {
        zoomDots.innerHTML = '';
        document.querySelector('.zoom-prev').style.display = 'none';
        document.querySelector('.zoom-next').style.display = 'none';
    }
}

// Open zoom with current active image
window.openImageZoomCurrent = function(itemIndex) {
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const item = portfolioItems[itemIndex];
    if (!item) return;

    const images = item.querySelectorAll('.portfolio-image');
    const activeImage = item.querySelector('.portfolio-image.active');
    const currentIndex = Array.from(images).indexOf(activeImage);

    openImageZoom(itemIndex, currentIndex >= 0 ? currentIndex : 0);
}

window.closeImageZoom = function() {
    const modal = document.getElementById('imageZoomModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

let isZoomChanging = false;

window.changeZoomImage = function(direction) {
    if (isZoomChanging) return; // Prevent rapid clicks

    isZoomChanging = true;

    currentZoomImageIndex = (currentZoomImageIndex + direction + zoomImages.length) % zoomImages.length;

    const zoomImage = document.getElementById('zoomImage');
    zoomImage.src = zoomImages[currentZoomImageIndex];

    // Update dots
    const dots = document.querySelectorAll('.zoom-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentZoomImageIndex);
    });

    // Allow next click after delay
    setTimeout(() => {
        isZoomChanging = false;
    }, 300);
}

window.goToZoomImage = function(index) {
    currentZoomImageIndex = index;

    const zoomImage = document.getElementById('zoomImage');
    zoomImage.src = zoomImages[index];

    // Update dots
    const dots = document.querySelectorAll('.zoom-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
    });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageZoom();
    }
});

// Touch swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let isSwipeInProgress = false;

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('imageZoomModal');

    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isSwipeInProgress = false;
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
        // Prevent default scrolling while swiping
        const touchX = e.changedTouches[0].screenX;
        const touchY = e.changedTouches[0].screenY;
        const deltaX = Math.abs(touchX - touchStartX);
        const deltaY = Math.abs(touchY - touchStartY);

        // If horizontal swipe is dominant, prevent vertical scroll
        if (deltaX > deltaY && deltaX > 10) {
            e.preventDefault();
        }
    }, { passive: false });

    modal.addEventListener('touchend', (e) => {
        if (isSwipeInProgress) return; // Prevent multiple triggers

        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Check if it's a horizontal swipe (not vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
            isSwipeInProgress = true;

            if (deltaX < 0) {
                // Swipe left - next image
                changeZoomImage(1);
            } else {
                // Swipe right - previous image
                changeZoomImage(-1);
            }

            // Reset after a delay to allow next swipe
            setTimeout(() => {
                isSwipeInProgress = false;
            }, 300);
        }
    }
});

// ===== Раскрытие/сворачивание текста (как в Telegram) =====
window.toggleProjectDescription = function(itemIndex) {
    const portfolioItem = document.querySelectorAll('.portfolio-item')[itemIndex];
    if (!portfolioItem) return;

    const wrapper = portfolioItem.querySelector('.portfolio-description-wrapper');
    const description = portfolioItem.querySelector('.portfolio-description');
    const button = portfolioItem.querySelector('.portfolio-expand-btn');
    const expandText = button.querySelector('.expand-text');
    const expandIcon = button.querySelector('.expand-icon');

    const isExpanded = wrapper.classList.contains('expanded');

    // Получаем переводы для текущего языка
    const readMoreText = translations[currentLang]?.portfolio?.readMore || 'Read more';
    const collapseText = translations[currentLang]?.portfolio?.collapse || 'Collapse';

    if (isExpanded) {
        // Сворачиваем
        wrapper.classList.remove('expanded');
        expandText.textContent = readMoreText;
        expandIcon.style.transform = 'rotate(0deg)';
    } else {
        // Разворачиваем
        wrapper.classList.add('expanded');
        expandText.textContent = collapseText;
        expandIcon.style.transform = 'rotate(180deg)';
    }
};

// ===== ЗАПАСНОЙ ВАРИАНТ: Модалка с полным описанием проекта =====
// Отключена, но оставлена на будущее
/*
window.openProjectDetails = function(itemIndex) {
    const item = portfolioProjects[itemIndex];
    if (!item) return;

    const title = getLocalizedText(item, 'title');
    const description = getLocalizedText(item, 'description');

    const portfolioItem = document.querySelectorAll('.portfolio-item')[itemIndex];
    const activeImage = portfolioItem.querySelector('.portfolio-image.active');
    const imageSrc = activeImage ? activeImage.src : item.images[0];

    const modal = document.createElement('div');
    modal.className = 'project-details-modal';
    modal.innerHTML = `
        <div class="project-details-overlay" onclick="closeProjectDetails()"></div>
        <div class="project-details-content">
            <button class="project-details-close" onclick="closeProjectDetails()">&times;</button>
            <img src="${imageSrc}" alt="${title}" class="project-details-image">
            <div class="project-details-text">
                <h3 class="project-details-title">${title}</h3>
                <p class="project-details-description">${description}</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
};

window.closeProjectDetails = function() {
    const modal = document.querySelector('.project-details-modal');
    if (!modal) return;

    modal.classList.remove('active');

    setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
    }, 300);
};
*/

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadPortfolio();
    initSmoothScroll(); // Initialize smooth scroll for CTA buttons
    // startAutoplay(); // Uncomment if you want auto-advancing carousel

    console.log('🪑 Lissa Furniture website initialized');
    console.log('🌍 Current language:', currentLang);
    console.log('✅ Smooth scroll navigation active');
});
