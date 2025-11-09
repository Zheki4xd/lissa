// ===== Helper function for fetch with ngrok headers =====
function apiFetch(url, options = {}) {
    // Add ngrok header to skip browser warning
    const headers = {
        'ngrok-skip-browser-warning': 'true',
        ...options.headers
    };

    return fetch(url, {
        ...options,
        headers
    });
}

// ===== Translation Toggle =====
function toggleTranslation(lang) {
    const section = document.getElementById(`translation-${lang}`);
    const button = document.querySelector(`.translation-toggle[data-lang="${lang}"]`);

    if (section.style.display === 'none') {
        // Show translation section
        section.style.display = 'block';
        button.classList.add('active');
        button.innerHTML = button.innerHTML.replace('+ ', '✓ ').replace('Добавить перевод', 'Перевод добавлен');
    } else {
        // Hide translation section
        section.style.display = 'none';
        button.classList.remove('active');
        button.innerHTML = button.innerHTML.replace('✓ ', '+ ').replace('Перевод добавлен', 'Добавить перевод');
    }
}

// ===== Authentication =====
let isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';

if (isLoggedIn) {
    showAdminPanel();
} else {
    showLoginScreen();
}

// Login form handling
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await apiFetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
            loadPortfolio();
            loadContacts();
        } else {
            showError('loginError', data.error || 'Ошибка входа');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', 'Ошибка соединения. Попробуйте снова.');
    }
});

// Show/Hide screens
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadPortfolio();
    loadContacts();
}

// Logout
function logout() {
    localStorage.removeItem('adminLoggedIn');
    // Redirect to main site instead of showing login screen
    window.location.href = '/';
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ===== Portfolio Management with Multiple Images =====

// Global variables for image management
let selectedFiles = [];
let existingImages = [];
let currentEditId = null;

// Load portfolio items
async function loadPortfolio() {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/portfolio`);
        const items = await response.json();

        const grid = document.getElementById('portfolioGrid');

        if (items.length === 0) {
            grid.innerHTML = '<p>Пока нет проектов. Добавьте первый проект!</p>';
            return;
        }

        grid.innerHTML = items.map(item => {
            const firstImage = item.images[0] || '/placeholder.jpg';
            const imageCount = item.images.length;

            // Use Russian as primary, fallback to Montenegrin
            const title = item.title_ru || item.title || 'Без названия';
            const description = item.description_ru || item.description || '';

            return `
                <div class="portfolio-card" draggable="true" data-item-id="${item.id}">
                    <div class="portfolio-card-image">
                        <img src="${firstImage}" alt="${title}" draggable="false">
                        ${imageCount > 1 ? `<span class="image-count">${imageCount} фото</span>` : ''}
                        <span class="drag-handle-card">⋮⋮</span>
                    </div>
                    <h3>${title}</h3>
                    <p>${description}</p>
                    <div class="actions">
                        <button class="btn-success" onclick="editItem(${item.id})">Редактировать</button>
                        <button class="btn-danger" onclick="deleteItem(${item.id})">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');

        // Enable drag and drop for reordering
        initPortfolioDragDrop();
    } catch (error) {
        console.error('Error loading portfolio:', error);
        document.getElementById('portfolioGrid').innerHTML = '<p>Ошибка загрузки портфолио.</p>';
    }
}

// Load contact messages
async function loadContacts() {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/contacts`);
        const contacts = await response.json();

        const table = document.getElementById('contactsTable');

        if (contacts.length === 0) {
            table.innerHTML = '<tr><td colspan="4" style="text-align: center;">Пока нет сообщений.</td></tr>';
            return;
        }

        table.innerHTML = contacts.map(contact => `
            <tr>
                <td>${new Date(contact.created_at).toLocaleString()}</td>
                <td>${contact.name}</td>
                <td>${contact.phone}</td>
                <td>${contact.message}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading contacts:', error);
        document.getElementById('contactsTable').innerHTML = '<tr><td colspan="4" style="text-align: center;">Ошибка загрузки сообщений.</td></tr>';
    }
}

// ===== Modal Handling =====

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Добавить проект';
    document.getElementById('portfolioForm').reset();
    document.getElementById('itemId').value = '';
    currentEditId = null;
    selectedFiles = [];
    existingImages = [];
    updateImagePreview();
    document.getElementById('portfolioModal').classList.add('active');
}

function closeModal() {
    document.getElementById('portfolioModal').classList.remove('active');
    selectedFiles = [];
    existingImages = [];
    currentEditId = null;

    // Reset translation sections
    ['me', 'en', 'uk'].forEach(lang => {
        const section = document.getElementById(`translation-${lang}`);
        const button = document.querySelector(`.translation-toggle[data-lang="${lang}"]`);
        if (section) section.style.display = 'none';
        if (button) {
            button.classList.remove('active');
            button.innerHTML = button.innerHTML.replace('✓ ', '+ ').replace('Перевод добавлен', 'Добавить перевод');
        }
    });
}

async function editItem(id) {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/portfolio/${id}`);
        const item = await response.json();

        document.getElementById('modalTitle').textContent = 'Редактировать проект';
        document.getElementById('itemId').value = item.id;

        // Russian (main)
        document.getElementById('title_ru').value = item.title_ru || '';
        document.getElementById('description_ru').value = item.description_ru || '';

        // Montenegrin
        document.getElementById('title').value = item.title || '';
        document.getElementById('description').value = item.description || '';
        // Show Montenegrin section if there's actual content (not empty string)
        if ((item.title && item.title.trim() !== '') || (item.description && item.description.trim() !== '')) {
            const meSection = document.getElementById('translation-me');
            const meButton = document.querySelector('.translation-toggle[data-lang="me"]');
            meSection.style.display = 'block';
            meButton.classList.add('active');
            meButton.innerHTML = meButton.innerHTML.replace('+ ', '✓ ').replace('Перевод добавлен', 'Перевод добавлен');
        }

        // English
        document.getElementById('title_en').value = item.title_en || '';
        document.getElementById('description_en').value = item.description_en || '';
        // Show English section if there's actual content (not empty string)
        if ((item.title_en && item.title_en.trim() !== '') || (item.description_en && item.description_en.trim() !== '')) {
            const enSection = document.getElementById('translation-en');
            const enButton = document.querySelector('.translation-toggle[data-lang="en"]');
            enSection.style.display = 'block';
            enButton.classList.add('active');
            enButton.innerHTML = enButton.innerHTML.replace('+ ', '✓ ').replace('Добавить перевод', 'Перевод добавлен');
        }

        // Ukrainian
        document.getElementById('title_uk').value = item.title_uk || '';
        document.getElementById('description_uk').value = item.description_uk || '';
        // Show Ukrainian section if there's actual content (not empty string)
        if ((item.title_uk && item.title_uk.trim() !== '') || (item.description_uk && item.description_uk.trim() !== '')) {
            const ukSection = document.getElementById('translation-uk');
            const ukButton = document.querySelector('.translation-toggle[data-lang="uk"]');
            ukSection.style.display = 'block';
            ukButton.classList.add('active');
            ukButton.innerHTML = ukButton.innerHTML.replace('+ ', '✓ ').replace('Добавить перевод', 'Перевод добавлен');
        }

        currentEditId = item.id;
        selectedFiles = [];
        existingImages = [...item.images];

        updateImagePreview();
        document.getElementById('portfolioModal').classList.add('active');
    } catch (error) {
        console.error('Error fetching item:', error);
        alert('Ошибка загрузки данных проекта');
    }
}

async function deleteItem(id) {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) {
        return;
    }

    try {
        const response = await apiFetch(`${API_BASE_URL}/api/portfolio/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadPortfolio();
        } else {
            alert('Ошибка при удалении проекта');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Ошибка при удалении проекта');
    }
}

// ===== Drag-and-Drop Image Upload =====

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');

// Click to select files
dropZone.addEventListener('click', () => {
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    handleFiles(files);
});

// Handle selected files
function handleFiles(files) {
    const validImages = Array.from(files).filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert(`Неверный тип файла: ${file.name}. Разрешены только JPEG, PNG и WebP.`);
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert(`Файл слишком большой: ${file.name}. Максимальный размер 10 МБ.`);
            return false;
        }
        return true;
    });

    selectedFiles = [...selectedFiles, ...validImages];
    updateImagePreview();
}

// Update image preview with drag-to-reorder
function updateImagePreview() {
    imagePreview.innerHTML = '';

    let itemIndex = 0;

    // Show existing images first
    existingImages.forEach((imgUrl) => {
        const previewItem = createPreviewItem(imgUrl, itemIndex, 'existing', imgUrl);
        imagePreview.appendChild(previewItem);
        itemIndex++;
    });

    // Show newly selected files
    selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = createPreviewItem(e.target.result, itemIndex, 'new', file);
            imagePreview.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
        itemIndex++;
    });

    // Always show drop zone for adding more images
    dropZone.style.display = 'block';
}

// Create preview item element
function createPreviewItem(src, index, type, data) {
    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.draggable = true;
    item.dataset.type = type;

    // Store the actual data reference
    if (type === 'existing') {
        item.dataset.imageUrl = data;
    } else {
        item.dataset.fileName = data.name;
    }

    const isFirst = index === 0;

    item.innerHTML = `
        <img src="${src}" alt="Preview" draggable="false">
        ${isFirst ? '<span class="main-badge">Главное фото</span>' : ''}
        <button type="button" class="remove-image">&times;</button>
        <div class="drag-handle">⋮⋮</div>
    `;

    // Remove image button
    item.querySelector('.remove-image').addEventListener('click', (e) => {
        e.stopPropagation();
        if (type === 'existing') {
            const urlToRemove = item.dataset.imageUrl;
            existingImages = existingImages.filter(url => url !== urlToRemove);
        } else {
            const fileToRemove = item.dataset.fileName;
            selectedFiles = selectedFiles.filter(file => file.name !== fileToRemove);
        }
        updateImagePreview();
    });

    // Drag and drop for reordering
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);

    return item;
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target.closest('.image-preview-item');
    draggedElement.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetItem = e.target.closest('.image-preview-item');
    if (targetItem && targetItem !== draggedElement) {
        const rect = targetItem.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;

        if (e.clientX < midpoint) {
            targetItem.parentNode.insertBefore(draggedElement, targetItem);
        } else {
            targetItem.parentNode.insertBefore(draggedElement, targetItem.nextSibling);
        }
    }
}

function handleDrop(e) {
    e.preventDefault();
    reorderImages();
}

function handleDragEnd(e) {
    draggedElement.classList.remove('dragging');
    draggedElement = null;
}

// Reorder arrays based on DOM order
function reorderImages() {
    const items = Array.from(imagePreview.querySelectorAll('.image-preview-item'));

    const newExistingImages = [];
    const newSelectedFiles = [];

    items.forEach(item => {
        const type = item.dataset.type;

        if (type === 'existing') {
            const url = item.dataset.imageUrl;
            newExistingImages.push(url);
        } else if (type === 'new') {
            const fileName = item.dataset.fileName;
            const file = selectedFiles.find(f => f.name === fileName);
            if (file) {
                newSelectedFiles.push(file);
            }
        }
    });

    existingImages = newExistingImages;
    selectedFiles = newSelectedFiles;

    updateImagePreview();
}

// ===== Portfolio Form Submission =====

document.getElementById('portfolioForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemId = document.getElementById('itemId').value;
    const formData = new FormData();

    // Russian (main)
    formData.append('title_ru', document.getElementById('title_ru').value);
    formData.append('description_ru', document.getElementById('description_ru').value);

    // Montenegrin - only if section is visible
    const meSection = document.getElementById('translation-me');
    if (meSection && meSection.style.display !== 'none') {
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
    } else {
        // Clear Montenegrin fields if section is hidden
        formData.append('title', '');
        formData.append('description', '');
    }

    // English - only if section is visible
    const enSection = document.getElementById('translation-en');
    if (enSection && enSection.style.display !== 'none') {
        formData.append('title_en', document.getElementById('title_en').value);
        formData.append('description_en', document.getElementById('description_en').value);
    } else {
        // Clear English fields if section is hidden
        formData.append('title_en', '');
        formData.append('description_en', '');
    }

    // Ukrainian - only if section is visible
    const ukSection = document.getElementById('translation-uk');
    if (ukSection && ukSection.style.display !== 'none') {
        formData.append('title_uk', document.getElementById('title_uk').value);
        formData.append('description_uk', document.getElementById('description_uk').value);
    } else {
        // Clear Ukrainian fields if section is hidden
        formData.append('title_uk', '');
        formData.append('description_uk', '');
    }

    // Add existing images (for edit mode)
    if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
    }

    // Add new image files
    selectedFiles.forEach(file => {
        formData.append('images', file);
    });

    // Validate: must have at least one image
    if (existingImages.length === 0 && selectedFiles.length === 0) {
        alert('Добавьте хотя бы одно фото');
        return;
    }

    try {
        const url = itemId ? `${API_BASE_URL}/api/portfolio/${itemId}` : `${API_BASE_URL}/api/portfolio`;
        const method = itemId ? 'PUT' : 'POST';

        const response = await apiFetch(url, {
            method: method,
            body: formData
        });

        if (response.ok) {
            closeModal();
            loadPortfolio();
            alert(itemId ? 'Проект успешно обновлен!' : 'Проект успешно добавлен!');
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка при сохранении проекта');
        }
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Ошибка при сохранении проекта');
    }
});

// ===== Modal Close Events =====

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('portfolioModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Helper function to show errors
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');

    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

// ===== Portfolio Cards Drag and Drop =====

let draggedCard = null;

function initPortfolioDragDrop() {
    const cards = document.querySelectorAll('.portfolio-card');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleCardDragStart);
        card.addEventListener('dragover', handleCardDragOver);
        card.addEventListener('drop', handleCardDrop);
        card.addEventListener('dragend', handleCardDragEnd);
        card.addEventListener('dragenter', handleCardDragEnter);
        card.addEventListener('dragleave', handleCardDragLeave);
    });
}

function handleCardDragStart(e) {
    draggedCard = e.currentTarget;
    draggedCard.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedCard.innerHTML);
}

function handleCardDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const target = e.currentTarget;
    if (target !== draggedCard && !target.classList.contains('drag-over')) {
        target.classList.add('drag-over');
    }

    return false;
}

function handleCardDragEnter(e) {
    e.preventDefault();
    const target = e.currentTarget;
    if (target !== draggedCard) {
        target.classList.add('drag-over');
    }
}

function handleCardDragLeave(e) {
    // Only remove if we're actually leaving the element (not entering a child)
    const target = e.currentTarget;
    const relatedTarget = e.relatedTarget;

    if (!target.contains(relatedTarget)) {
        target.classList.remove('drag-over');
    }
}

function handleCardDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    target.classList.remove('drag-over');

    if (draggedCard !== target) {
        // Get all cards and their IDs
        const grid = document.getElementById('portfolioGrid');
        const allCards = Array.from(grid.querySelectorAll('.portfolio-card'));
        const draggedIndex = allCards.indexOf(draggedCard);
        const targetIndex = allCards.indexOf(target);

        // Reorder in DOM
        if (draggedIndex < targetIndex) {
            target.parentNode.insertBefore(draggedCard, target.nextSibling);
        } else {
            target.parentNode.insertBefore(draggedCard, target);
        }

        // Save new order to server
        savePortfolioOrder();
    }

    return false;
}

function handleCardDragEnd(e) {
    e.currentTarget.classList.remove('dragging');

    // Remove drag-over class from all cards
    document.querySelectorAll('.portfolio-card').forEach(card => {
        card.classList.remove('drag-over');
    });

    draggedCard = null;
}

async function savePortfolioOrder() {
    const grid = document.getElementById('portfolioGrid');
    const cards = Array.from(grid.querySelectorAll('.portfolio-card'));
    const order = cards.map(card => parseInt(card.dataset.itemId));

    console.log('Saving portfolio order:', order);

    try {
        const response = await apiFetch(`${API_BASE_URL}/api/portfolio/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Server returned non-JSON response:', text);
            alert('Ошибка сервера. Проверьте, что сервер перезапущен!');
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            console.error('Failed to save portfolio order:', result);
            alert('Ошибка при сохранении порядка: ' + (result.error || 'Unknown error'));
        } else {
            console.log('Portfolio order saved successfully:', result);
            // Reload portfolio after a short delay to reflect the new order
            setTimeout(() => {
                loadPortfolio();
            }, 300);
        }
    } catch (error) {
        console.error('Error saving portfolio order:', error);
        alert('Ошибка при сохранении порядка: ' + error.message);
    }
}
