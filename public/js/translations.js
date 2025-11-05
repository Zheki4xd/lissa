// ЖЁСТКАЯ ОЧИСТКА СТАРОГО ЯЗЫКА ПРИ КАЖДОЙ ЗАГРУЗКЕ
(function() {
    const savedLang = localStorage.getItem('language');
    console.log('💾 Saved language:', savedLang);

    // Если чешский - удаляем и ставим черногорский
    if (savedLang === 'cs') {
        console.warn('🔥 REMOVING OLD CZECH LANGUAGE');
        localStorage.removeItem('language');
    }
})();

// Translations object with all languages
const translations = {
    me: {  // ЧЕРНОГОРСКИЙ (вместо чешского cs)
        hero: {
            title: "Lissa",
            subtitle: "Ekskluzivni namještaj po mjeri",
            description: "Kvalitetna izrada sa zaštitom od vlage i plijesni.<br>Proizvodnja od 30 radnih dana.",
            feature1: "Zaštita od vlage",
            feature2: "30 radnih dana",
            feature3: "Besplatna konsultacija",
            cta: "Kontaktirajte nas",
            portfolio: "Portfolio"
        },
        about: {
            title: "O kompaniji Lissa D.O.O.",
            subtitle: "Profesionalna proizvodnja namještaja po mjeri",
            text1: "Kompanija Lissa D.O.O. specijalizovana je za proizvodnju visokokvalitetnog namještaja po mjeri. Svaki komad izrađen je s pažnjom i pažnjom prema detaljima.",
            text2: "Naši proizvodi su zaštićeni od vlage i plijesni, što garantuje dugovječnost i očuvanje lijepog izgleda mnogo godina.",
            stat1: "Zadovoljnih klijenata",
            stat2: "Dana proizvodnje",
            stat3: "Kvalitet"
        },
        portfolio: {
            title: "Naš rad",
            subtitle: "Projekti stvoreni s ljubavlju prema detaljima",
            loading: "Učitavanje portfolija...",
            readMore: "Pročitaj više",
            collapse: "Sakrij"
        },
        contact: {
            title: "Kontaktirajte nas",
            subtitle: "Spremni smo realizovati vaš projekat",
            info: "Kontakt informacije",
            phone: "Telefon / WhatsApp",
            messengers: "Messenger aplikacije",
            company: "Kompanija",
            mapTitle: "Naša lokacija"
        },
        footer: {
            rights: "Sva prava zadržana."
        },
        nav: {
            home: "Početna",
            about: "O nama",
            portfolio: "Naš rad",
            contact: "Kontakt"
        }
    },
    ru: {
        hero: {
            title: "Lissa",
            subtitle: "Эксклюзивная мебель на заказ",
            description: "Качественное ремесло с защитой от влаги и плесени.<br>Изготовление от 30 рабочих дней.",
            feature1: "Защита от влаги",
            feature2: "30 рабочих дней",
            feature3: "Бесплатная консультация",
            cta: "Свяжитесь с нами",
            portfolio: "Портфолио"
        },
        about: {
            title: "О компании Lissa D.O.O.",
            subtitle: "Профессиональное производство мебели на заказ",
            text1: "Компания Lissa D.O.O. специализируется на производстве высококачественной мебели на заказ. Каждое изделие создается с тщательностью и вниманием к деталям.",
            text2: "Наши изделия защищены от влаги и плесени, что гарантирует долгий срок службы и сохранение красивого внешнего вида на долгие годы.",
            stat1: "Довольных клиентов",
            stat2: "Дней производства",
            stat3: "Качество"
        },
        portfolio: {
            title: "Наши работы",
            subtitle: "Проекты, созданные с любовью к деталям",
            loading: "Загрузка портфолио...",
            readMore: "Читать далее",
            collapse: "Свернуть"
        },
        contact: {
            title: "Свяжитесь с нами",
            subtitle: "Мы готовы реализовать ваш проект",
            info: "Контактная информация",
            phone: "Телефон / WhatsApp",
            messengers: "Мессенджеры",
            company: "Компания",
            mapTitle: "Наше местоположение"
        },
        footer: {
            rights: "Все права защищены."
        },
        nav: {
            home: "Главная",
            about: "О нас",
            portfolio: "Наши работы",
            contact: "Контакты"
        }
    },
    en: {
        hero: {
            title: "Lissa",
            subtitle: "Exclusive custom furniture",
            description: "Quality craftsmanship with moisture and mold protection.<br>Production from 30 working days.",
            feature1: "Moisture protection",
            feature2: "30 working days",
            feature3: "Free consultation",
            cta: "Contact us",
            portfolio: "Portfolio"
        },
        about: {
            title: "About Lissa D.O.O.",
            subtitle: "Professional custom furniture manufacturing",
            text1: "Lissa D.O.O. specializes in manufacturing high-quality custom furniture. Each piece is crafted with care and attention to detail.",
            text2: "Our products are protected against moisture and mold, guaranteeing long service life and maintaining beautiful appearance for many years.",
            stat1: "Satisfied customers",
            stat2: "Production days",
            stat3: "Quality"
        },
        portfolio: {
            title: "Our work",
            subtitle: "Projects created with love for detail",
            loading: "Loading portfolio...",
            readMore: "Read more",
            collapse: "Collapse"
        },
        contact: {
            title: "Contact us",
            subtitle: "We are ready to realize your project",
            info: "Contact information",
            phone: "Phone / WhatsApp",
            messengers: "Messenger apps",
            company: "Company",
            mapTitle: "Our location"
        },
        footer: {
            rights: "All rights reserved."
        },
        nav: {
            home: "Home",
            about: "About",
            portfolio: "Our work",
            contact: "Contact"
        }
    },
    uk: {
        hero: {
            title: "Lissa",
            subtitle: "Ексклюзивні меблі на замовлення",
            description: "Якісне ремесло із захистом від вологи та цвілі.<br>Виготовлення від 30 робочих днів.",
            feature1: "Захист від вологи",
            feature2: "30 робочих днів",
            feature3: "Безкоштовна консультація",
            cta: "Зв'яжіться з нами",
            portfolio: "Портфоліо"
        },
        about: {
            title: "Про компанію Lissa D.O.O.",
            subtitle: "Професійне виробництво меблів на замовлення",
            text1: "Компанія Lissa D.O.O. спеціалізується на виробництві високоякісних меблів на замовлення. Кожен виріб створюється з ретельністю та увагою до деталей.",
            text2: "Наші вироби захищені від вологи та цвілі, що гарантує довгий термін служби та збереження красивого зовнішнього вигляду на довгі роки.",
            stat1: "Задоволених клієнтів",
            stat2: "Днів виробництва",
            stat3: "Якість"
        },
        portfolio: {
            title: "Наші роботи",
            subtitle: "Проекти, створені з любов'ю до деталей",
            loading: "Завантаження портфоліо...",
            readMore: "Читати далі",
            collapse: "Згорнути"
        },
        contact: {
            title: "Зв'яжіться з нами",
            subtitle: "Ми готові реалізувати ваш проект",
            info: "Контактна інформація",
            phone: "Телефон / WhatsApp",
            messengers: "Месенджери",
            company: "Компанія",
            mapTitle: "Наше розташування"
        },
        footer: {
            rights: "Усі права захищені."
        },
        nav: {
            home: "Головна",
            about: "Про нас",
            portfolio: "Наші роботи",
            contact: "Контакти"
        }
    }
};

// Language configuration
const langConfig = {
    me: { flag: '🇲🇪', code: 'ME', name: 'Crnogorski' },  // ЧЕРНОГОРСКИЙ (вместо чешского)
    ru: { flag: '🇷🇺', code: 'RU', name: 'Русский' },
    en: { flag: '🇬🇧', code: 'EN', name: 'English' },
    uk: { flag: '🇺🇦', code: 'UK', name: 'Українська' }
};

// Get saved language or default to Montenegrin
let currentLang = localStorage.getItem('language') || 'me';

// ПРИНУДИТЕЛЬНАЯ ОЧИСТКА СТАРОГО ЧЕШСКОГО ЯЗЫКА
if (currentLang === 'cs') {
    console.warn('Removing old Czech language, switching to Montenegrin');
    localStorage.removeItem('language');
    currentLang = 'me';
}

// Проверка что сохранённый язык существует
if (!translations[currentLang]) {
    console.warn(`Saved language ${currentLang} not found, resetting to Montenegrin (me)`);
    currentLang = 'me';
    localStorage.setItem('language', 'me');
}

// Set HTML lang attribute
document.documentElement.lang = currentLang;

// Function to translate the page
function translatePage(lang) {
    // Проверка что язык существует, иначе используем черногорский
    if (!translations[lang]) {
        console.warn(`Language ${lang} not found, using Montenegrin (me)`);
        lang = 'me';
    }

    currentLang = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;

    // Update all elements with data-translate attribute
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        const keys = key.split('.');
        let translation = translations[lang];

        // Navigate through nested object
        for (const k of keys) {
            translation = translation[k];
            if (!translation) break;
        }

        if (translation) {
            element.innerHTML = translation;
        }
    });

    // Update "Read more" buttons in portfolio
    updateExpandButtonsLanguage(lang);

    // Update language switcher
    updateLangSwitcher(lang);

    // Reload portfolio with new language
    if (typeof loadPortfolio === 'function') {
        loadPortfolio();
    }
}

// Update language switcher UI
function updateLangSwitcher(lang) {
    const config = langConfig[lang];
    const langFlag = document.querySelector('.lang-flag');
    const langCode = document.querySelector('.lang-code');

    if (langFlag && langCode && config) {
        langFlag.textContent = config.flag;
        langCode.textContent = config.code;
    }

    // Update active state
    const langOptions = document.querySelectorAll('.lang-option');
    langOptions.forEach(option => {
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    translatePage(currentLang);

    // Language switcher toggle functionality
    const langToggle = document.getElementById('langToggle');
    const langSwitcher = document.querySelector('.lang-switcher');
    const langDropdown = document.querySelector('.lang-dropdown');

    // Toggle dropdown on mobile
    if (langToggle && langDropdown) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langSwitcher.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!langSwitcher.contains(e.target)) {
                langSwitcher.classList.remove('active');
            }
        });
    }

    // Add click handlers to language options
    const langOptions = document.querySelectorAll('.lang-option');
    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = option.getAttribute('data-lang');
            translatePage(lang);

            // Close dropdown after selection on mobile
            langSwitcher.classList.remove('active');
        });
    });
});

// Function to update "Read more" / "Collapse" buttons when language changes
function updateExpandButtonsLanguage(lang) {
    const expandButtons = document.querySelectorAll('.portfolio-expand-btn .expand-text');
    const readMoreText = translations[lang]?.portfolio?.readMore || 'Read more';
    const collapseText = translations[lang]?.portfolio?.collapse || 'Collapse';

    expandButtons.forEach(button => {
        const wrapper = button.closest('.portfolio-description-wrapper');
        const isExpanded = wrapper?.classList.contains('expanded');

        // Update text based on current state
        button.textContent = isExpanded ? collapseText : readMoreText;
    });
}
