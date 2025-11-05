// ===== Glassmorphism Floating Navigation =====

// Delay before showing navigation (1.5 seconds)
const NAV_DELAY = 1500;

// Show navigation after delay
setTimeout(() => {
    const floatingNav = document.querySelector('.floating-nav');
    if (floatingNav) {
        floatingNav.classList.add('visible');
    }
}, NAV_DELAY);

// Get all navigation items and sections
const navLinks = document.querySelectorAll('.nav-dot-link');
const navSections = document.querySelectorAll('.fullpage-section[data-section]');
const navBlob = document.querySelector('.nav-blob');

// Debounce timer for blob updates
let blobUpdateTimeout;
let currentActiveLink = null;

// Function to update blob position with debounce
function updateBlobPosition(activeLink, immediate = false) {
    if (!navBlob || !activeLink) return;

    // Prevent unnecessary updates if same link
    if (currentActiveLink === activeLink && !immediate) return;
    currentActiveLink = activeLink;

    // Clear existing timeout
    if (blobUpdateTimeout) {
        clearTimeout(blobUpdateTimeout);
    }

    const updateBlob = () => {
        const linkRect = activeLink.getBoundingClientRect();
        const containerRect = activeLink.parentElement.getBoundingClientRect();

        const left = linkRect.left - containerRect.left;
        const width = linkRect.width;

        navBlob.style.width = `${width}px`;
        navBlob.style.left = `${left}px`;
    };

    // Immediate update or debounced
    if (immediate) {
        updateBlob();
    } else {
        blobUpdateTimeout = setTimeout(updateBlob, 50);
    }
}

// Initial blob position - с задержкой для правильной анимации
if (navLinks.length > 0) {
    setTimeout(() => {
        updateBlobPosition(navLinks[0], true); // immediate update
    }, NAV_DELAY + 300); // Увеличенная задержка для ПК
}

// НОВАЯ ЛОГИКА: определяем активную секцию по положению центра экрана
let lastActiveSectionId = null;

function updateActiveSection() {
    // Получаем центр видимой области экрана
    const windowHeight = window.innerHeight;
    const centerY = window.scrollY + (windowHeight / 2);

    // Находим все секции и их позиции
    let closestSection = null;
    let minDistance = Infinity;

    navSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const sectionTop = window.scrollY + rect.top;
        const sectionBottom = sectionTop + rect.height;
        const sectionCenter = sectionTop + (rect.height / 2);

        // Расстояние от центра экрана до центра секции
        const distance = Math.abs(centerY - sectionCenter);

        // Проверяем, что секция хотя бы частично видна
        const isVisible = (sectionTop < centerY && sectionBottom > centerY) ||
                         distance < rect.height;

        if (isVisible && distance < minDistance) {
            minDistance = distance;
            closestSection = section;
        }
    });

    if (closestSection) {
        const sectionId = closestSection.getAttribute('data-section');

        if (sectionId && sectionId !== lastActiveSectionId) {
            lastActiveSectionId = sectionId;

            console.log('👁️ Активная секция:', sectionId, '(расстояние от центра:', Math.round(minDistance), 'px)');

            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));

            // Add active class to current link
            const activeLink = document.querySelector(`.nav-dot-link[data-target="${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
                updateBlobPosition(activeLink, false);
            }
        }
    }
}

// Вызываем обновление при скролле
let scrollUpdateTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollUpdateTimeout);
    scrollUpdateTimeout = setTimeout(updateActiveSection, 50);
}, { passive: true });

// Первоначальная установка
setTimeout(updateActiveSection, 500);

// Click handlers for navigation links - УПРОЩЁННАЯ ВЕРСИЯ
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        const targetId = link.getAttribute('data-target');

        // Ищем секцию по data-section ИЛИ по ID
        let targetSection = document.querySelector(`[data-section="${targetId}"]`);
        if (!targetSection) {
            targetSection = document.getElementById(targetId);
        }

        console.log('📱 Клик по навигации:', targetId);
        console.log('🎯 Секция найдена:', targetSection);

        if (targetSection) {
            // Update last active section ID
            lastActiveSectionId = targetId;

            // Remove active from all
            navLinks.forEach(navLink => navLink.classList.remove('active'));

            // Add active to clicked
            link.classList.add('active');
            updateBlobPosition(link, true); // Immediate update on click

            // ПРОСТОЙ scrollIntoView вместо window.scrollTo
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            console.warn('⚠️ Секция не найдена для:', targetId);
        }
    });
});

// Update blob on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const activeLink = document.querySelector('.nav-dot-link.active');
        if (activeLink) {
            updateBlobPosition(activeLink);
        }
    }, 100);
}, { passive: true });

console.log('✨ Glassmorphism navigation initialized');
console.log('📱 Найдено навигационных ссылок:', navLinks.length);
console.log('📄 Найдено секций:', navSections.length);
