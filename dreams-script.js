const API_URL = "https://freeai.logise1123.workers.dev/";
let dreamState = {
    type: 'normal',
    intensity: 5,
    emotion: 'curious',
    realism: 6,
    elements: ['flying', 'water', 'strangers'],
    dreamHistory: []
};

// Инициализация
function initApp() {
    // Навигация
    document.getElementById('homeLogo').addEventListener('click', goHome);
    
    // Главная страница
    document.getElementById('quickDreamBtn').addEventListener('click', generateRandomDream);
    document.getElementById('customizeBtn').addEventListener('click', showCustomize);
    
    // Настройка
    document.getElementById('backBtn').addEventListener('click', goBack);
    document.getElementById('generateDreamBtn').addEventListener('click', generateCustomDream);
    
    // Выбор типа
    document.querySelectorAll('.type-option').forEach(option => {
        option.addEventListener('click', function() {
            selectDreamType(this.dataset.type);
        });
    });
    
    // Выбор эмоции
    document.querySelectorAll('.emotion-option').forEach(option => {
        option.addEventListener('click', function() {
            selectEmotion(this.dataset.emotion);
        });
    });
    
    // Слайдеры
    const intensitySlider = document.getElementById('intensitySlider');
    const realismSlider = document.getElementById('realismSlider');
    
    intensitySlider.addEventListener('input', function() {
        document.getElementById('intensityValue').textContent = `${this.value}/10`;
        dreamState.intensity = parseInt(this.value);
    });
    
    realismSlider.addEventListener('input', function() {
        dreamState.realism = parseInt(this.value);
    });
    
    // Чекбоксы элементов
    document.querySelectorAll('.element-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const element = this.nextElementSibling.nextElementSibling.textContent.toLowerCase();
            updateDreamElements(element, this.checked);
        });
    });
    
    // Страница сна
    document.getElementById('regenerateBtn').addEventListener('click', regenerateDream);
    document.getElementById('newDreamBtn').addEventListener('click', showCustomize);
    document.getElementById('saveDreamBtn').addEventListener('click', showSaveModal);
    document.getElementById('shareDreamBtn').addEventListener('click', shareDream);
    
    // Модальное окно сохранения
    document.getElementById('closeSaveModal').addEventListener('click', closeSaveModal);
    document.getElementById('cancelSaveBtn').addEventListener('click', closeSaveModal);
    document.getElementById('confirmSaveBtn').addEventListener('click', saveDream);
    
    // Загружаем типы снов
    loadDreamTypes();
    
    // Загружаем историю из localStorage
    loadDreamHistory();
    
    console.log("Dream Generator initialized!");
}

// Навигация
function goHome() {
    window.location.href = "https://bahrlab.github.io";
}

// Загрузка типов снов
const dreamTypes = [
    {
        icon: '😴',
        title: 'Normal Dreams',
        desc: 'Everyday dream experiences',
        type: 'normal'
    },
    {
        icon: '😱',
        title: 'Nightmares',
        desc: 'Frightening or disturbing dreams',
        type: 'nightmare'
    },
    {
        icon: '👁️',
        title: 'Lucid Dreams',
        desc: 'Aware you\'re dreaming',
        type: 'lucid'
    },
    {
        icon: '🔮',
        title: 'Prophetic Dreams',
        desc: 'Symbolic or meaningful dreams',
        type: 'prophetic'
    },
    {
        icon: '🚀',
        title: 'Adventure Dreams',
        desc: 'Action and exploration',
        type: 'adventure'
    },
    {
        icon: '🏰',
        title: 'Fantasy Dreams',
        desc: 'Magical and impossible worlds',
        type: 'fantasy'
    }
];

function loadDreamTypes() {
    const grid = document.getElementById('typeGrid');
    grid.innerHTML = dreamTypes.map(type => `
        <div class="type-card" data-type="${type.type}">
            <div class="type-icon">${type.icon}</div>
            <h3>${type.title}</h3>
            <p>${type.desc}</p>
        </div>
    `).join('');
    
    // Добавляем обработчики
    document.querySelectorAll('.type-card').forEach(card => {
        card.addEventListener('click', function() {
            const type = this.dataset.type;
            loadDreamType(type);
        });
    });
}

function loadDreamType(type) {
    const dreamType = dreamTypes.find(t => t.type === type);
    if (!dreamType) return;
    
    // Устанавливаем тип
    selectDreamType(type);
    
    // Показываем настройки
    showCustomize();
    
    // Показываем уведомление
    showNotification(`Selected: ${dreamType.title}`);
}

// Показать настройки
function showCustomize() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('setupPage').style.display = 'block';
}

function goBack() {
    document.getElementById('setupPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
}

// Выбор типа сна
function selectDreamType(type) {
    dreamState.type = type;
    
    // Обновляем UI
    document.querySelectorAll('.type-option').forEach(option => {
        option.classList.remove('active');
    });
    
    const activeOption = document.querySelector(`.type-option[data-type="${type}"]`);
    if (activeOption) {
        activeOption.classList.add('active');
    }
}

// Выбор эмоции
function selectEmotion(emotion) {
    dreamState.emotion = emotion;
    
    // Обновляем UI
    document.querySelectorAll('.emotion-option').forEach(option => {
        option.classList.remove('active');
    });
    
    const activeOption = document.querySelector(`.emotion-option[data-emotion="${emotion}"]`);
    if (activeOption) {
        activeOption.classList.add('active');
    }
}

// Обновление элементов
function updateDreamElements(element, isChecked) {
    if (isChecked) {
        if (!dreamState.elements.includes(element)) {
            dreamState.elements.push(element);
        }
    } else {
        const index = dreamState.elements.indexOf(element);
        if (index > -1) {
            dreamState.elements.splice(index, 1);
        }
    }
}

// Генерация случайного сна
async function generateRandomDream() {
    // Случайные параметры
    const types = ['normal', 'lucid', 'nightmare', 'prophetic', 'adventure', 'fantasy'];
    const emotions = ['neutral', 'curious', 'peaceful', 'anxious', 'joyful', 'mysterious'];
    
    dreamState.type = types[Math.floor(Math.random() * types.length)];
    dreamState.intensity = 3 + Math.floor(Math.random() * 7);
    dreamState.emotion = emotions[Math.floor(Math.random() * emotions.length)];
    dreamState.realism = 3 + Math.floor(Math.random() * 7);
    
    // Случайные элементы
    const allElements = ['flying', 'water', 'chase', 'falling', 'strangers', 'teeth'];
    dreamState.elements = allElements.filter(() => Math.random() > 0.5);
    
    // Показываем индикатор загрузки
    showLoading();
    
    // Генерируем сон
    await generateAndDisplayDream();
    
    // Скрываем индикатор
    hideLoading();
}

// Генерация кастомного сна
async function generateCustomDream() {
    // Собираем элементы из чекбоксов
    const checkboxes = document.querySelectorAll('.element-checkbox input:checked');
    dreamState.elements = Array.from(checkboxes).map(cb => 
        cb.nextElementSibling.nextElementSibling.textContent.toLowerCase()
    );
    
    // Показываем индикатор загрузки
    showLoading();
    
    // Генерируем сон
    await generateAndDisplayDream();
    
    // Скрываем индикатор
    hideLoading();
}

// Генерация и отображение сна
async function generateAndDisplayDream() {
    try {
        // Генерируем сон
        const dream = await generateDream();
        
        // Генерируем символы
        const symbols = await generateSymbols(dream);
        
        // Генерируем интерпретацию
        const interpretation = await generateInterpretation(dream, symbols);
        
        // Отображаем всё
        displayDream(dream, symbols, interpretation);
        
        // Переходим на страницу сна
        document.getElementById('setupPage').style.display = 'none';
        document.getElementById('dreamPage').style.display = 'block';
        
        // Добавляем в историю
        addToHistory(dream);
        
    } catch (error) {
        console.error("Error generating dream:", error);
        showNotification("Error generating dream. Please try again.");
        hideLoading();
    }
}

// Генерация сна через ИИ
async function generateDream() {
    const prompt = `Generate a ${dreamState.type} dream.
    
Intensity: ${dreamState.intensity}/10
Emotional tone: ${dreamState.emotion}
Realism level: ${dreamState.realism}/10 (1=fantasy, 10=realistic)
Common dream elements: ${dreamState.elements.join(', ') || 'none specified'}

Write a vivid dream description in 3-4 paragraphs. Use sensory details and emotions. Don't explain the dream, just describe it as if it's happening.

Start with "I find myself..."`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        const dreamText = data?.choices?.[0]?.message?.content || getFallbackDream();
        
        return {
            text: dreamText,
            type: dreamState.type,
            intensity: dreamState.intensity,
            emotion: dreamState.emotion,
            timestamp: new Date(),
            id: Date.now()
        };
        
    } catch (error) {
        console.error("Dream generation error:", error);
        return {
            text: getFallbackDream(),
            type: dreamState.type,
            intensity: dreamState.intensity,
            emotion: dreamState.emotion,
            timestamp: new Date(),
            id: Date.now()
        };
    }
}

// Генерация символов
async function generateSymbols(dream) {
    const prompt = `Analyze this dream and identify 3-4 key symbolic elements:

Dream: ${dream.text.substring(0, 500)}...

For each symbol, provide:
1. The symbol name
2. Its common meaning in dream interpretation
3. How it might relate to this specific dream

Format as JSON array:
[
{
"symbol": "symbol name",
"meaning": "common interpretation",
"relation": "how it relates to this dream"
}
]`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        const responseText = data?.choices?.[0]?.message?.content || "[]";
        
        // Пытаемся распарсить JSON
        try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error("JSON parse error:", e);
        }
        
        // Fallback символы
        return getFallbackSymbols();
        
    } catch (error) {
        console.error("Symbols generation error:", error);
        return getFallbackSymbols();
    }
}

// Генерация интерпретации
async function generateInterpretation(dream, symbols) {
    const prompt = `Interpret this dream:

Dream Type: ${dream.type}
Intensity: ${dream.intensity}/10
Emotional Tone: ${dream.emotion}

Dream Content: ${dream.text.substring(0, 400)}...

Key Symbols: ${symbols.map(s => s.symbol).join(', ')}

Provide a dream interpretation in 2-3 paragraphs. Focus on:
1. Overall meaning and themes
2. Emotional significance
3. Potential real-life connections
4. Common interpretations for this type of dream

Write in a thoughtful, analytical tone.`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        const interpretation = data?.choices?.[0]?.message?.content || getFallbackInterpretation();
        
        return interpretation;
        
    } catch (error) {
        console.error("Interpretation generation error:", error);
        return getFallbackInterpretation();
    }
}

// Отображение сна
function displayDream(dream, symbols, interpretation) {
    // Заголовок
    const typeName = getTypeName(dream.type);
    document.getElementById('dreamTitle').textContent = `${typeName} Dream`;
    
    // Метаданные
    document.getElementById('dreamType').textContent = typeName;
    document.getElementById('dreamIntensity').textContent = `Intensity: ${dream.intensity}/10`;
    document.getElementById('dreamTime').textContent = 'Just now';
    
    // Сцена сна
    const scene = document.getElementById('dreamScene');
    scene.innerHTML = formatDreamText(dream.text);
    
    // Символы
    const symbolsGrid = document.getElementById('symbolsGrid');
    symbolsGrid.innerHTML = symbols.map(symbol => `
        <div class="symbol-card">
            <div class="symbol-icon">${getSymbolIcon(symbol.symbol)}</div>
            <div class="symbol-name">${symbol.symbol}</div>
            <div class="symbol-meaning">${symbol.meaning}</div>
        </div>
    `).join('');
    
    // Интерпретация
    const interpretationText = document.getElementById('interpretationText');
    interpretationText.innerHTML = formatDreamText(interpretation);
}

// Форматирование текста сна
function formatDreamText(text) {
    return text
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/"(.*?)"/g, '<em>"$1"</em>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Иконки для символов
function getSymbolIcon(symbol) {
    const iconMap = {
        'water': '💧',
        'flight': '🕊️',
        'falling': '⬇️',
        'chase': '🏃',
        'door': '🚪',
        'key': '🔑',
        'mirror': '🪞',
        'teeth': '🦷',
        'snake': '🐍',
        'tree': '🌳',
        'house': '🏠',
        'road': '🛣️',
        'light': '💡',
        'darkness': '🌑',
        'animal': '🐾',
        'child': '👶',
        'teacher': '👨‍🏫'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
        if (symbol.toLowerCase().includes(key)) {
            return icon;
        }
    }
    
    return '🌀';
}

// Название типа сна
function getTypeName(type) {
    const typeMap = {
        'normal': 'Normal',
        'nightmare': 'Nightmare',
        'lucid': 'Lucid',
        'prophetic': 'Prophetic',
        'adventure': 'Adventure',
        'fantasy': 'Fantasy'
    };
    
    return typeMap[type] || 'Dream';
}

// Fallback контент
function getFallbackDream() {
    const dreams = [
        `I find myself walking through an endless library. The shelves stretch further than I can see, filled with books that glow with soft light. Each book seems to hum with a different melody, creating a symphony of whispers. As I reach for one, the entire shelf shifts and rearranges itself.`,
        
        `I'm standing at the edge of a cliff overlooking a city made of crystal. The buildings shimmer with rainbow colors as sunlight passes through them. I realize I can understand the language of the birds flying overhead—they're discussing philosophy and the nature of reality.`,
        
        `I'm in a familiar room that keeps changing shape. The walls breathe like living things, and furniture floats gently above the floor. People I know enter the room but don't recognize me. Their faces shift between different emotions faster than I can process.`,
        
        `I'm swimming through clouds that have the consistency of water. Fish made of light swim around me, leaving trails of stardust. In the distance, a clocktower chimes, but each chime creates ripples in the cloud-water that rearrange the landscape.`
    ];
    
    return dreams[Math.floor(Math.random() * dreams.length)];
}

function getFallbackSymbols() {
    return [
        {
            symbol: "Library",
            meaning: "Knowledge and memory",
            relation: "Search for understanding or forgotten information"
        },
        {
            symbol: "Flying",
            meaning: "Freedom and perspective",
            relation: "Desire for escape or new viewpoints"
        },
        {
            symbol: "Water",
            meaning: "Emotions and subconscious",
            relation: "Emotional state or hidden feelings"
        },
        {
            symbol: "Clock",
            meaning: "Time and urgency",
            relation: "Concern about deadlines or passage of time"
        }
    ];
}

function getFallbackInterpretation() {
    return `This dream appears to reflect a search for meaning and understanding in your waking life. The shifting landscapes and changing elements suggest adaptability and the fluid nature of your current circumstances.

The presence of both familiar and unfamiliar elements indicates a blending of conscious experiences with deeper subconscious material. Your mind is processing information and emotions, creating new connections between seemingly unrelated aspects of your life.

Consider what elements felt most significant or emotional in the dream. These often point to areas in your waking life that deserve attention or reflection.`;
}

// Регенерация сна
async function regenerateDream() {
    showLoading();
    await generateAndDisplayDream();
    hideLoading();
}

// История снов
function loadDreamHistory() {
    const saved = localStorage.getItem('dreamHistory');
    if (saved) {
        try {
            dreamState.dreamHistory = JSON.parse(saved);
            updateHistoryList();
        } catch (e) {
            console.error("Error loading dream history:", e);
            dreamState.dreamHistory = [];
        }
    }
}

function addToHistory(dream) {
    // Ограничиваем историю последними 10 снами
    dreamState.dreamHistory.unshift({
        id: dream.id,
        title: `${getTypeName(dream.type)} Dream`,
        type: dream.type,
        intensity: dream.intensity,
        timestamp: dream.timestamp,
        preview: dream.text.substring(0, 100) + '...'
    });
    
    if (dreamState.dreamHistory.length > 10) {
        dreamState.dreamHistory = dreamState.dreamHistory.slice(0, 10);
    }
    
    // Сохраняем
    localStorage.setItem('dreamHistory', JSON.stringify(dreamState.dreamHistory));
    
    // Обновляем список
    updateHistoryList();
}

function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (dreamState.dreamHistory.length === 0) {
        historyList.innerHTML = '<div class="history-item">No dreams saved yet</div>';
        return;
    }
    
    historyList.innerHTML = dreamState.dreamHistory.map(dream => `
        <div class="history-item" data-id="${dream.id}">
            <div class="history-title">${dream.title}</div>
            <div class="history-meta">
                <span>Intensity: ${dream.intensity}/10</span>
                <span>${formatTimeAgo(dream.timestamp)}</span>
            </div>
            <div style="font-size: 13px; color: #666; margin-top: 5px;">${dream.preview}</div>
        </div>
    `).join('');
    
    // Добавляем обработчики
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function() {
            const dreamId = this.dataset.id;
            loadDreamFromHistory(dreamId);
        });
    });
}

function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

function loadDreamFromHistory(dreamId) {
    // В реальном приложении здесь бы загружался полный сон
    showNotification("Dream history feature coming soon!");
}

// Сохранение сна
function showSaveModal() {
    document.getElementById('dreamSaveTitle').value = `${getTypeName(dreamState.type)} Dream`;
    document.getElementById('dreamNotes').value = '';
    document.getElementById('saveModal').style.display = 'flex';
}

function closeSaveModal() {
    document.getElementById('saveModal').style.display = 'none';
}

function saveDream() {
    const title = document.getElementById('dreamSaveTitle').value.trim();
    const notes = document.getElementById('dreamNotes').value.trim();
    
    if (!title) {
        alert("Please enter a title for your dream!");
        return;
    }
    
    // Здесь можно добавить сохранение в базу данных
    // Для демо просто показываем уведомление
    showNotification("Dream saved successfully!");
    closeSaveModal();
}

// Шаринг сна
function shareDream() {
    const dreamText = document.getElementById('dreamScene').textContent.substring(0, 200) + '...';
    const shareText = `I just had an AI-generated ${dreamState.type} dream:\n\n"${dreamText}"\n\nGenerated with BAHR LAB Dream Generator`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My AI-Generated Dream',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification("Dream copied to clipboard!");
        });
    }
}

// Вспомогательные функции
function showLoading() {
    // Можно добавить спиннер или индикатор
    document.body.style.cursor = 'wait';
}

function hideLoading() {
    document.body.style.cursor = 'default';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        animation: fadeInOut 3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Запуск приложения
window.addEventListener('DOMContentLoaded', initApp);
