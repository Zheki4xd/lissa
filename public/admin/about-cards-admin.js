// ===== ABOUT CARDS MANAGEMENT =====

let aboutCardSelectedFile = null;
let aboutCardCurrentEditId = null;

// Load about cards
async function loadAboutCards() {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/about-cards`);
        const items = await response.json();

        const grid = document.getElementById('aboutCardsGrid');

        if (items.length === 0) {
            grid.innerHTML = '<p>Пока нет карточек. Добавьте первую!</p>';
            return;
        }

        grid.innerHTML = items.map(item => {
            const title = item.title_ru || item.title || 'Без названия';
            const description = item.description_ru || item.description || '';
            const imageUrl = item.image || '/placeholder.jpg';

            return `
                <div class="portfolio-card" draggable="true" data-item-id="${item.id}">
                    <div class="portfolio-card-image">
                        <img src="${imageUrl}" alt="${title}" draggable="false">
                        <span class="drag-handle-card">⋮⋮</span>
                    </div>
                    <h3>${title}</h3>
                    <p>${description}</p>
                    <div class="actions">
                        <button class="btn-success" onclick="editAboutCard(${item.id})">Редактировать</button>
                        <button class="btn-danger" onclick="deleteAboutCard(${item.id})">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');

        // Enable drag and drop for reordering
        initAboutCardsDragDrop();
    } catch (error) {
        console.error('Error loading about cards:', error);
        document.getElementById('aboutCardsGrid').innerHTML = '<p>Ошибка загрузки карточек.</p>';
    }
}

// Open add modal
function openAddAboutCardModal() {
    document.getElementById('aboutCardModalTitle').textContent = 'Добавить карточку';
    document.getElementById('aboutCardForm').reset();
    document.getElementById('aboutCardId').value = '';
    aboutCardCurrentEditId = null;
    aboutCardSelectedFile = null;
    updateAboutCardImagePreview();
    document.getElementById('aboutCardModal').classList.add('active');
}

// Close modal
function closeAboutCardModal() {
    document.getElementById('aboutCardModal').classList.remove('active');
    aboutCardSelectedFile = null;
    aboutCardCurrentEditId = null;

    // Reset translation sections
    ['me', 'en', 'uk'].forEach(lang => {
        const section = document.getElementById(`about-translation-${lang}`);
        const button = document.querySelector(`.about-translation-toggle[data-lang="${lang}"]`);
        if (section) section.style.display = 'none';
        if (button) {
            button.classList.remove('active');
            button.innerHTML = button.innerHTML.replace('✓ ', '+ ').replace('Перевод добавлен', 'Добавить перевод');
        }
    });
}

// Toggle translation section
function toggleAboutTranslation(lang) {
    const section = document.getElementById(`about-translation-${lang}`);
    const button = document.querySelector(`.about-translation-toggle[data-lang="${lang}"]`);

    if (section.style.display === 'none') {
        section.style.display = 'block';
        button.classList.add('active');
        button.innerHTML = button.innerHTML.replace('+ ', '✓ ').replace('Добавить перевод', 'Перевод добавлен');
    } else {
        section.style.display = 'none';
        button.classList.remove('active');
        button.innerHTML = button.innerHTML.replace('✓ ', '+ ').replace('Перевод добавлен', 'Добавить перевод');
    }
}

// Edit about card
async function editAboutCard(id) {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/about-cards/${id}`);
        const item = await response.json();

        document.getElementById('aboutCardModalTitle').textContent = 'Редактировать карточку';
        document.getElementById('aboutCardId').value = item.id;

        // Russian (main)
        document.getElementById('about_title_ru').value = item.title_ru || '';
        document.getElementById('about_description_ru').value = item.description_ru || '';

        // Montenegrin
        document.getElementById('about_title').value = item.title || '';
        document.getElementById('about_description').value = item.description || '';
        if ((item.title && item.title.trim() !== '') || (item.description && item.description.trim() !== '')) {
            const meSection = document.getElementById('about-translation-me');
            const meButton = document.querySelector('.about-translation-toggle[data-lang="me"]');
            meSection.style.display = 'block';
            meButton.classList.add('active');
            meButton.innerHTML = meButton.innerHTML.replace('+ ', '✓ ').replace('Добавить перевод', 'Перевод добавлен');
        }

        // English
        document.getElementById('about_title_en').value = item.title_en || '';
        document.getElementById('about_description_en').value = item.description_en || '';
        if ((item.title_en && item.title_en.trim() !== '') || (item.description_en && item.description_en.trim() !== '')) {
            const enSection = document.getElementById('about-translation-en');
            const enButton = document.querySelector('.about-translation-toggle[data-lang="en"]');
            enSection.style.display = 'block';
            enButton.classList.add('active');
            enButton.innerHTML = enButton.innerHTML.replace('+ ', '✓ ').replace('Добавить перевод', 'Перевод добавлен');
        }

        // Ukrainian
        document.getElementById('about_title_uk').value = item.title_uk || '';
        document.getElementById('about_description_uk').value = item.description_uk || '';
        if ((item.title_uk && item.title_uk.trim() !== '') || (item.description_uk && item.description_uk.trim() !== '')) {
            const ukSection = document.getElementById('about-translation-uk');
            const ukButton = document.querySelector('.about-translation-toggle[data-lang="uk"]');
            ukSection.style.display = 'block';
            ukButton.classList.add('active');
            ukButton.innerHTML = ukButton.innerHTML.replace('+ ', '✓ ').replace('Добавить перевод', 'Перевод добавлен');
        }

        aboutCardCurrentEditId = item.id;
        aboutCardSelectedFile = null;

        // Show existing image
        if (item.image) {
            const preview = document.getElementById('aboutCardImagePreview');
            preview.innerHTML = `
                <div class="image-preview-item">
                    <img src="${item.image}" alt="Preview">
                    <button type="button" class="remove-image" onclick="removeAboutCardImage()">&times;</button>
                </div>
            `;
        }

        document.getElementById('aboutCardModal').classList.add('active');
    } catch (error) {
        console.error('Error fetching about card:', error);
        alert('Ошибка загрузки данных карточки');
    }
}

// Delete about card
async function deleteAboutCard(id) {
    if (!confirm('Вы уверены, что хотите удалить эту карточку?')) {
        return;
    }

    try {
        const response = await apiFetch(`${API_BASE_URL}/api/about-cards/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadAboutCards();
        } else {
            alert('Ошибка при удалении карточки');
        }
    } catch (error) {
        console.error('Error deleting about card:', error);
        alert('Ошибка при удалении карточки');
    }
}

// Image upload handling
const aboutCardDropZone = document.getElementById('aboutCardDropZone');
const aboutCardFileInput = document.getElementById('aboutCardImage');

aboutCardDropZone.addEventListener('click', () => {
    aboutCardFileInput.click();
});

aboutCardFileInput.addEventListener('change', (e) => {
    handleAboutCardFile(e.target.files[0]);
});

aboutCardDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    aboutCardDropZone.classList.add('drag-over');
});

aboutCardDropZone.addEventListener('dragleave', () => {
    aboutCardDropZone.classList.remove('drag-over');
});

aboutCardDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    aboutCardDropZone.classList.remove('drag-over');
    handleAboutCardFile(e.dataTransfer.files[0]);
});

function handleAboutCardFile(file) {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Неверный тип файла. Разрешены только JPEG, PNG и WebP.');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 10 МБ.');
        return;
    }

    aboutCardSelectedFile = file;
    updateAboutCardImagePreview();
}

function updateAboutCardImagePreview() {
    const preview = document.getElementById('aboutCardImagePreview');

    if (aboutCardSelectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <div class="image-preview-item">
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-image" onclick="removeAboutCardImage()">&times;</button>
                </div>
            `;
        };
        reader.readAsDataURL(aboutCardSelectedFile);
    } else {
        preview.innerHTML = '';
    }
}

function removeAboutCardImage() {
    aboutCardSelectedFile = null;
    updateAboutCardImagePreview();
}

// Form submission
document.getElementById('aboutCardForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardId = document.getElementById('aboutCardId').value;
    const formData = new FormData();

    // Russian (main)
    formData.append('title_ru', document.getElementById('about_title_ru').value);
    formData.append('description_ru', document.getElementById('about_description_ru').value);

    // Montenegrin
    const meSection = document.getElementById('about-translation-me');
    if (meSection && meSection.style.display !== 'none') {
        formData.append('title', document.getElementById('about_title').value);
        formData.append('description', document.getElementById('about_description').value);
    } else {
        formData.append('title', '');
        formData.append('description', '');
    }

    // English
    const enSection = document.getElementById('about-translation-en');
    if (enSection && enSection.style.display !== 'none') {
        formData.append('title_en', document.getElementById('about_title_en').value);
        formData.append('description_en', document.getElementById('about_description_en').value);
    } else {
        formData.append('title_en', '');
        formData.append('description_en', '');
    }

    // Ukrainian
    const ukSection = document.getElementById('about-translation-uk');
    if (ukSection && ukSection.style.display !== 'none') {
        formData.append('title_uk', document.getElementById('about_title_uk').value);
        formData.append('description_uk', document.getElementById('about_description_uk').value);
    } else {
        formData.append('title_uk', '');
        formData.append('description_uk', '');
    }

    // Add image if selected
    if (aboutCardSelectedFile) {
        formData.append('image', aboutCardSelectedFile);
    }

    try {
        const url = cardId ? `${API_BASE_URL}/api/about-cards/${cardId}` : `${API_BASE_URL}/api/about-cards`;
        const method = cardId ? 'PUT' : 'POST';

        const response = await apiFetch(url, {
            method: method,
            body: formData
        });

        if (response.ok) {
            closeAboutCardModal();
            loadAboutCards();
            alert(cardId ? 'Карточка успешно обновлена!' : 'Карточка успешно добавлена!');
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка при сохранении карточки');
        }
    } catch (error) {
        console.error('Error saving about card:', error);
        alert('Ошибка при сохранении карточки');
    }
});

// Drag and drop for reordering
let draggedAboutCard = null;

function initAboutCardsDragDrop() {
    const cards = document.querySelectorAll('#aboutCardsGrid .portfolio-card');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleAboutCardDragStart);
        card.addEventListener('dragover', handleAboutCardDragOver);
        card.addEventListener('drop', handleAboutCardDrop);
        card.addEventListener('dragend', handleAboutCardDragEnd);
        card.addEventListener('dragenter', handleAboutCardDragEnter);
        card.addEventListener('dragleave', handleAboutCardDragLeave);
    });
}

function handleAboutCardDragStart(e) {
    draggedAboutCard = e.currentTarget;
    draggedAboutCard.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedAboutCard.innerHTML);
}

function handleAboutCardDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const target = e.currentTarget;
    if (target !== draggedAboutCard && !target.classList.contains('drag-over')) {
        target.classList.add('drag-over');
    }

    return false;
}

function handleAboutCardDragEnter(e) {
    e.preventDefault();
    const target = e.currentTarget;
    if (target !== draggedAboutCard) {
        target.classList.add('drag-over');
    }
}

function handleAboutCardDragLeave(e) {
    const target = e.currentTarget;
    const relatedTarget = e.relatedTarget;

    if (!target.contains(relatedTarget)) {
        target.classList.remove('drag-over');
    }
}

function handleAboutCardDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    target.classList.remove('drag-over');

    if (draggedAboutCard !== target) {
        const grid = document.getElementById('aboutCardsGrid');
        const allCards = Array.from(grid.querySelectorAll('.portfolio-card'));
        const draggedIndex = allCards.indexOf(draggedAboutCard);
        const targetIndex = allCards.indexOf(target);

        if (draggedIndex < targetIndex) {
            target.parentNode.insertBefore(draggedAboutCard, target.nextSibling);
        } else {
            target.parentNode.insertBefore(draggedAboutCard, target);
        }

        saveAboutCardsOrder();
    }

    return false;
}

function handleAboutCardDragEnd(e) {
    e.currentTarget.classList.remove('dragging');

    document.querySelectorAll('#aboutCardsGrid .portfolio-card').forEach(card => {
        card.classList.remove('drag-over');
    });

    draggedAboutCard = null;
}

async function saveAboutCardsOrder() {
    const grid = document.getElementById('aboutCardsGrid');
    const cards = Array.from(grid.querySelectorAll('.portfolio-card'));
    const order = cards.map(card => parseInt(card.dataset.itemId));

    try {
        const response = await apiFetch(`${API_BASE_URL}/api/about-cards/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order })
        });

        if (!response.ok) {
            const result = await response.json();
            console.error('Failed to save about cards order:', result);
            alert('Ошибка при сохранении порядка: ' + (result.error || 'Unknown error'));
        } else {
            console.log('About cards order saved successfully');
            setTimeout(() => {
                loadAboutCards();
            }, 300);
        }
    } catch (error) {
        console.error('Error saving about cards order:', error);
        alert('Ошибка при сохранении порядка: ' + error.message);
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('aboutCardModal');
    if (e.target === modal) {
        closeAboutCardModal();
    }
});

// Load about cards when switching to About tab
const originalSwitchTab = window.switchTab;
window.switchTab = function(tabName) {
    originalSwitchTab(tabName);
    if (tabName === 'about') {
        loadAboutCards();
    }
};
