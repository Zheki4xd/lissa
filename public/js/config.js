// API Configuration
// Определяем URL API в зависимости от окружения

const API_CONFIG = {
    // Локальная разработка
    local: 'http://localhost:3000',

    // ngrok URL (для тестирования)
    ngrok: 'https://c0a88f261987.ngrok-free.app',

    // Продакшн backend на Railway
    // ВАЖНО: После деплоя на Railway замените на свой URL
    production: 'https://lissa-1n3y.onrender.com'
};

// Автоматическое определение окружения
function getApiUrl() {
    const hostname = window.location.hostname;

    // Если сайт на localhost - используем локальный API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return API_CONFIG.local;
    }

    // Если сайт на Netlify или любом другом хостинге - используем production API
    if (hostname.includes('netlify.app') || hostname.includes('.') && !hostname.includes('localhost')) {
        return API_CONFIG.production;
    }

    // По умолчанию локальный
    return API_CONFIG.local;
}

// Экспортируем базовый URL API
const API_BASE_URL = getApiUrl();

console.log('🌐 API Base URL:', API_BASE_URL);
