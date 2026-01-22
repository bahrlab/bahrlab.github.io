const API_URL = "https://freeai.logise1123.workers.dev/";
let currentQuote = null;
let settings = {
    theme: 'inspiration',
    language: 'en',
    style: 'inspirational',
    length: 3,
    authorMode: 'ai',
    customAuthor: '',
    design: 'classic',
    colors: {
        text: '#000000',
        background: '#ffffff',
        accent: '#4a6fa5'
    }
};

let quotesHistory = [];
let favoriteQuotes = [];
let generatedCount = 0;

// Теми
const themes = [
    { id: 'inspiration', name: 'Inspiration', emoji: '🌟' },
    { id: 'life', name: 'Life', emoji: '🌱' },
    { id: 'love', name: 'Love', emoji: '❤️' },
    { id: 'wisdom', name: 'Wisdom', emoji: '🧠' },
    { id: 'success', name: 'Success', emoji: '🏆' },
    { id: 'motivation', name: 'Motivation', emoji: '💪' },
    { id: 'nature', name: 'Nature', emoji: '🌳' },
    { id: 'art', name: 'Art', emoji: '🎨' },
    { id: 'science', name: 'Science', emoji: '🔬' },
    { id: 'technology', name: 'Technology', emoji: '💻' },
    { id: 'philosophy', name: 'Philosophy', emoji: '🤔' },
    { id: 'happiness', name: 'Happiness', emoji: '😊' }
];

// Стили для разных языков
const languageNames = {
    'en': 'English',
    'ru': 'Russian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'zh': 'Chinese'
};

// Навигация
function goHome() {
    window.location.href = "https://bahrlab.github.io";
}

// Инициализация
function initApp() {
    loadThemes();
    loadSettings();
    loadFavorites();
    updateStats();
    
    // Загрузка из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    const theme = urlParams.get('theme');
    const lang = urlParams.get('lang');
    
    if (theme) {
        const themeObj = themes.find(t => t.id === theme);
        if (themeObj) {
            setTheme(themeObj.id);
        }
    }
    
    if (lang && languageNames[lang]) {
        setLanguage(lang);
    }
}

function loadThemes() {
    const grid = document.getElementById('themesGrid');
    grid.innerHTML = themes.map(theme => `
        <button class="theme-option ${theme.id === settings.theme ? 'active' : ''}" 
                onclick="setTheme('${theme.id}')">
            ${theme.emoji} ${theme.name}
        </button>
    `).join('');
}

// Настройки
function setTheme(themeId) {
    settings.theme = themeId;
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    document.getElementById('customTheme').value = '';
}

function setLanguage(lang) {
    settings.language = lang;
    
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
}

function setStyle(style) {
    settings.style = style;
    
    document.querySelectorAll('.style-option').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
}

function setAuthorMode(mode) {
    settings.authorMode = mode;
    const customAuthorInput = document.getElementById('customAuthor');
    
    if (mode === 'custom') {
        customAuthorInput.style.display = 'block';
        if (!customAuthorInput.value && currentQuote) {
            customAuthorInput.value = currentQuote.author;
        }
    } else {
        customAuthorInput.style.display = 'none';
    }
}

function setDesign(design) {
    settings.design = design;
    
    document.querySelectorAll('.design-option').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Применяем предустановленные цвета для дизайна
    applyDesignColors(design);
}

function applyDesignColors(design) {
    const colors = {
        classic: { text: '#000000', background: '#ffffff', accent: '#4a6fa5' },
        modern: { text: '#333333', background: '#f8f9fa', accent: '#000000' },
        elegant: { text: '#5a4a6a', background: '#fffaf0', accent: '#c06c84' },
        bold: { text: '#222222', background: '#ffffff', accent: '#ff6b6b' }
    };
    
    if (colors[design]) {
        settings.colors = colors[design];
        document.getElementById('textColor').value = colors[design].text;
        document.getElementById('bgColor').value = colors[design].background;
        document.getElementById('accentColor').value = colors[design].accent;
        updateQuoteDisplay();
    }
}

// Сброс цветов
function resetColors() {
    applyDesignColors(settings.design);
}

// Показать индикатор
function showIndicator(text) {
    const indicator = document.getElementById('generationIndicator');
    document.getElementById('indicatorText').textContent = text;
    indicator.classList.add('active');
}

function hideIndicator() {
    const indicator = document.getElementById('generationIndicator');
    setTimeout(() => {
        indicator.classList.remove('active');
    }, 500);
}

// Генерация цитаты
async function generateQuote() {
    const customTheme = document.getElementById('customTheme').value.trim();
    const theme = customTheme || settings.theme;
    const length = parseInt(document.getElementById('lengthSlider').value);
    
    if (settings.authorMode === 'custom') {
        settings.customAuthor = document.getElementById('customAuthor').value.trim();
    }
    
    showIndicator("Creating quote...");
    
    try {
        const prompt = createGenerationPrompt(theme, length);
        const response = await callAI(prompt);
        
        if (response) {
            const quoteData = parseAIResponse(response);
            quoteData.theme = theme;
            quoteData.language = settings.language;
            quoteData.style = settings.style;
            quoteData.timestamp = new Date().toISOString();
            quoteData.id = Date.now();
            
            // Если выбран пользовательский автор
            if (settings.authorMode === 'custom' && settings.customAuthor) {
                quoteData.author = settings.customAuthor;
            }
            
            currentQuote = quoteData;
            displayQuote(quoteData);
            addToHistory(quoteData);
            updateStats();
            
            // Включаем кнопку регенерации
            document.getElementById('regenerateBtn').disabled = false;
        }
        
    } catch (error) {
        console.error("Error generating quote:", error);
        showError("Failed to generate quote. Please try again.");
    } finally {
        hideIndicator();
    }
}

function createGenerationPrompt(theme, length) {
    const lengthText = ['very short', 'short', 'medium', 'long', 'very long'][length - 1];
    const styleText = {
        'inspirational': 'inspirational and uplifting',
        'philosophical': 'philosophical and thought-provoking',
        'humorous': 'humorous and witty',
        'poetic': 'poetic and lyrical',
        'minimalist': 'minimalist and concise',
        'deep': 'deep and profound'
    }[settings.style] || 'inspirational';
    
    const authorPart = settings.authorMode === 'ai' 
        ? 'Generate a fitting author name that matches the quote.' 
        : 'Use the author name provided by the user.';
    
    return `Create a ${lengthText} ${styleText} quote about ${theme} in ${languageNames[settings.language]}.
    
Requirements:
- The quote should be meaningful and memorable
- It should reflect the theme deeply
- Use appropriate language style
- ${authorPart}
- Format response as JSON: {"quote": "the quote text", "author": "author name"}
- Only return valid JSON, no other text`;
}

async function callAI(prompt) {
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
        return data?.choices?.[0]?.message?.content || '';
        
    } catch (error) {
        console.error("AI call error:", error);
        throw error;
    }
}

function parseAIResponse(response) {
    try {
        // Пытаемся найти JSON в ответе
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
                text: data.quote || response,
                author: data.author || 'Unknown'
            };
        }
        
        // Если JSON не найден, пробуем другие форматы
        const lines = response.split('\n').filter(line => line.trim());
        if (lines.length >= 2) {
            return {
                text: lines[0].replace(/^["']|["']$/g, '').trim(),
                author: lines[1].replace(/^[-—]\s*/, '').trim()
            };
        }
        
        // Fallback
        return {
            text: response.trim(),
            author: 'AI Wisdom'
        };
        
    } catch (error) {
        console.error("Parse error:", error);
        return {
            text: response.trim(),
            author: 'AI Generated'
        };
    }
}

// Отображение цитаты
function displayQuote(quoteData) {
    const display = document.getElementById('quoteDisplay');
    
    const wordCount = quoteData.text.split(/\s+/).length;
    const themeName = themes.find(t => t.id === quoteData.theme)?.name || quoteData.theme;
    
    display.innerHTML = `
        <div class="quote-content" style="color: ${settings.colors.text};">
            <div class="quote-text">${quoteData.text}</div>
            <div class="quote-author" style="color: ${settings.colors.accent};">— ${quoteData.author}</div>
            <div class="quote-meta">
                <span>Theme: ${themeName}</span>
                <span>Style: ${settings.style}</span>
                <span>${wordCount} words</span>
            </div>
        </div>
    `;
    
    display.classList.add('has-quote');
    display.style.backgroundColor = settings.colors.background;
    
    // Обновляем информацию о генерации
    updateGenerationInfo(quoteData);
}

function updateGenerationInfo(quoteData) {
    const info = document.getElementById('generationInfo');
    const date = new Date(quoteData.timestamp).toLocaleString();
    
    info.innerHTML = `
        <div>Generated on: ${date}</div>
        <div>Language: ${languageNames[quoteData.language]}</div>
        <div>ID: ${quoteData.id.toString().slice(-6)}</div>
    `;
}

// История
function addToHistory(quoteData) {
    quotesHistory.unshift(quoteData);
    if (quotesHistory.length > 10) {
        quotesHistory = quotesHistory.slice(0, 10);
    }
    
    generatedCount++;
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historySection = document.getElementById('historySection');
    const historyContainer = document.getElementById('quotesHistory');
    
    if (quotesHistory.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    
    historyContainer.innerHTML = quotesHistory.map((quote, index) => `
        <div class="quote-card" onclick="loadFromHistory(${index})">
            <div class="quote-card-text">"${quote.text.substring(0, 100)}${quote.text.length > 100 ? '...' : ''}"</div>
            <div class="quote-card-author">— ${quote.author}</div>
            <div class="quote-card-meta">
                <span>${new Date(quote.timestamp).toLocaleDateString()}</span>
                <span>${quote.theme}</span>
            </div>
        </div>
    `).join('');
}

function loadFromHistory(index) {
    if (quotesHistory[index]) {
        currentQuote = quotesHistory[index];
        displayQuote(currentQuote);
        
        // Обновляем настройки
        setTheme(currentQuote.theme);
        setStyle(currentQuote.style);
        
        showIndicator("Quote loaded from history");
        setTimeout(hideIndicator, 1000);
    }
}

// Регенерация
async function regenerateQuote() {
    if (!currentQuote) return;
    
    showIndicator("Regenerating quote...");
    
    try {
        const prompt = `Regenerate this quote with a different variation:
        
Original: "${currentQuote.text}"
Author: ${currentQuote.author}
Theme: ${currentQuote.theme}
Style: ${currentQuote.style}
Language: ${languageNames[currentQuote.language]}

Create a new quote on the same theme but with different wording. Keep the same style and language.
Return JSON: {"quote": "new quote", "author": "${currentQuote.author}"}`;
        
        const response = await callAI(prompt);
        if (response) {
            const newQuote = parseAIResponse(response);
            newQuote.theme = currentQuote.theme;
            newQuote.language = currentQuote.language;
            newQuote.style = currentQuote.style;
            newQuote.timestamp = new Date().toISOString();
            newQuote.id = Date.now();
            
            currentQuote = newQuote;
            displayQuote(newQuote);
            addToHistory(newQuote);
        }
        
    } catch (error) {
        console.error("Error regenerating:", error);
        showError("Failed to regenerate quote.");
    } finally {
        hideIndicator();
    }
}

// Множественные цитаты
async function generateMultiple() {
    showIndicator("Generating 5 quotes...");
    
    const multipleSection = document.getElementById('multipleQuotesSection');
    const grid = document.getElementById('multipleQuotesGrid');
    
    grid.innerHTML = '<div class="loading">Generating quotes...</div>';
    multipleSection.style.display = 'block';
    
    try {
        const theme = document.getElementById('customTheme').value.trim() || settings.theme;
        const prompt = `Generate 5 different quotes about ${theme} in ${languageNames[settings.language]}.
        
        Style: ${settings.style}
        Format: Return as JSON array: [{"quote": "text1", "author": "author1"}, ...]
        Make each quote unique and meaningful.`;
        
        const response = await callAI(prompt);
        
        if (response) {
            let quotes;
            try {
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    quotes = JSON.parse(jsonMatch[0]);
                } else {
                    // Fallback parsing
                    quotes = response.split('\n\n').map(q => {
                        const lines = q.split('\n');
                        return {
                            quote: lines[0]?.replace(/^["']|["']$/g, '').trim() || q,
                            author: lines[1]?.replace(/^[-—]\s*/, '').trim() || 'Unknown'
                        };
                    }).filter(q => q.quote && q.quote.length > 10);
                    
                    if (quotes.length > 5) quotes = quotes.slice(0, 5);
                }
            } catch (e) {
                console.error("Parse error:", e);
                quotes = [];
            }
            
            if (quotes.length > 0) {
                grid.innerHTML = quotes.map((q, i) => `
                    <div class="quote-card" onclick="selectMultipleQuote(${i})">
                        <div class="quote-card-text">"${q.quote.substring(0, 80)}${q.quote.length > 80 ? '...' : ''}"</div>
                        <div class="quote-card-author">— ${q.author}</div>
                        <div class="quote-card-meta">
                            <span>Quote ${i + 1}</span>
                            <button class="favorite-action" onclick="saveMultipleQuote(${i}, event)">⭐</button>
                        </div>
                    </div>
                `).join('');
                
                // Сохраняем для доступа
                window.multipleQuotes = quotes;
            } else {
                grid.innerHTML = '<div class="error">Failed to generate multiple quotes.</div>';
            }
        }
        
    } catch (error) {
        console.error("Error generating multiple:", error);
        grid.innerHTML = '<div class="error">Failed to generate quotes.</div>';
    } finally {
        hideIndicator();
    }
}

function selectMultipleQuote(index) {
    if (window.multipleQuotes && window.multipleQuotes[index]) {
        const quote = window.multipleQuotes[index];
        const quoteData = {
            text: quote.quote,
            author: quote.author,
            theme: document.getElementById('customTheme').value.trim() || settings.theme,
            language: settings.language,
            style: settings.style,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        
        currentQuote = quoteData;
        displayQuote(quoteData);
        addToHistory(quoteData);
        
        showIndicator("Quote selected");
        setTimeout(hideIndicator, 1000);
    }
}

function saveMultipleQuote(index, event) {
    event.stopPropagation();
    
    if (window.multipleQuotes && window.multipleQuotes[index]) {
        const quote = window.multipleQuotes[index];
        const quoteData = {
            text: quote.quote,
            author: quote.author,
            theme: document.getElementById('customTheme').value.trim() || settings.theme,
            language: settings.language,
            style: settings.style,
            timestamp: new Date().toISOString(),
            id: Date.now() + index
        };
        
        saveToFavorites(quoteData);
    }
}

// Избранное
function saveToFavorites() {
    if (!currentQuote) {
        showError("No quote to save!");
        return;
    }
    
    // Проверяем, нет ли уже такой цитаты
    const exists = favoriteQuotes.some(fav => 
        fav.text === currentQuote.text && fav.author === currentQuote.author);
    
    if (exists) {
        showError("This quote is already in favorites!");
        return;
    }
    
    favoriteQuotes.unshift(currentQuote);
    if (favoriteQuotes.length > 50) {
        favoriteQuotes = favoriteQuotes.slice(0, 50);
    }
    
    saveFavorites();
    updateStats();
    
    showIndicator("Added to favorites ⭐");
    setTimeout(hideIndicator, 1000);
}

function viewFavorites() {
    const modal = document.getElementById('favoritesModal');
    const list = document.getElementById('favoritesList');
    const actions = document.getElementById('favoritesActions');
    
    if (favoriteQuotes.length === 0) {
        list.innerHTML = '<div class="empty-state">No favorite quotes yet.</div>';
        actions.style.display = 'none';
    } else {
        list.innerHTML = favoriteQuotes.map((quote, index) => `
            <div class="favorite-item">
                <div class="favorite-text">"${quote.text.substring(0, 80)}${quote.text.length > 80 ? '...' : ''}"</div>
                <div class="favorite-author">— ${quote.author}</div>
                <div class="favorite-actions">
                    <button class="favorite-action" onclick="loadFavorite(${index})" title="Load">↻</button>
                    <button class="favorite-action" onclick="removeFavorite(${index})" title="Remove">×</button>
                    <button class="favorite-action" onclick="shareFavorite(${index})" title="Share">🔗</button>
                </div>
            </div>
        `).join('');
        
        actions.style.display = 'flex';
    }
    
    modal.classList.add('active');
}

function loadFavorite(index) {
    if (favoriteQuotes[index]) {
        currentQuote = { ...favoriteQuotes[index] };
        displayQuote(currentQuote);
        closeFavoritesModal();
        
        showIndicator("Favorite loaded");
        setTimeout(hideIndicator, 1000);
    }
}

function removeFavorite(index) {
    if (confirm("Remove this quote from favorites?")) {
        favoriteQuotes.splice(index, 1);
        saveFavorites();
        viewFavorites();
        updateStats();
    }
}

function clearFavorites() {
    if (confirm("Remove all favorite quotes?")) {
        favoriteQuotes = [];
        saveFavorites();
        viewFavorites();
        updateStats();
    }
}

function shareFavorite(index) {
    if (favoriteQuotes[index]) {
        const quote = favoriteQuotes[index];
        const text = `"${quote.text}" — ${quote.author}\n\nGenerated with BAHR LAB AI Quote Generator`;
        
        if (navigator.share) {
            navigator.share({
                title: 'AI Generated Quote',
                text: text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                showIndicator("Copied to clipboard!");
                setTimeout(hideIndicator, 1000);
            });
        }
    }
}

function exportFavorites() {
    const data = {
        favorites: favoriteQuotes,
        exported: new Date().toISOString(),
        source: 'BAHR LAB AI Quote Generator'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-favorites-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showIndicator("Favorites exported");
    setTimeout(hideIndicator, 1000);
}

// Модальные окна
function closeFavoritesModal() {
    document.getElementById('favoritesModal').classList.remove('active');
}

function openExportModal() {
    if (!currentQuote) {
        showError("Generate a quote first!");
        return;
    }
    
    document.getElementById('exportModal').classList.add('active');
    updateExportPreview();
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('active');
}

function editQuote() {
    if (!currentQuote) {
        showError("No quote to edit!");
        return;
    }
    
    document.getElementById('editQuoteText').value = currentQuote.text;
    document.getElementById('editQuoteAuthor').value = currentQuote.author;
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

function saveEditedQuote() {
    if (!currentQuote) return;
    
    const newText = document.getElementById('editQuoteText').value.trim();
    const newAuthor = document.getElementById('editQuoteAuthor').value.trim();
    const styleChange = document.getElementById('editQuoteStyle').value;
    
    if (!newText) {
        showError("Quote text cannot be empty!");
        return;
    }
    
    currentQuote.text = newText;
    if (newAuthor) {
        currentQuote.author = newAuthor;
    }
    
    if (styleChange !== 'none') {
        applyStyleChange(styleChange);
    }
    
    currentQuote.timestamp = new Date().toISOString();
    displayQuote(currentQuote);
    closeEditModal();
    
    showIndicator("Changes saved");
    setTimeout(hideIndicator, 1000);
}

async function aiEnhanceQuote() {
    const text = document.getElementById('editQuoteText').value.trim();
    const style = document.getElementById('editQuoteStyle').value;
    
    if (!text) {
        showError("Enter some text first!");
        return;
    }
    
    showIndicator("Enhancing with AI...");
    
    try {
        const prompt = `Improve this quote: "${text}"
        
        Make it ${style === 'none' ? 'more impactful and memorable' : style.replace('_', ' ')}.
        Keep the same meaning but enhance the language.
        Return only the improved quote text.`;
        
        const response = await callAI(prompt);
        if (response) {
            document.getElementById('editQuoteText').value = response.trim();
        }
        
    } catch (error) {
        console.error("Enhance error:", error);
        showError("Failed to enhance quote.");
    } finally {
        hideIndicator();
    }
}

function applyStyleChange(style) {
    const prompts = {
        'more_poetic': 'Make this quote more poetic and lyrical.',
        'more_concise': 'Make this quote more concise and to the point.',
        'more_formal': 'Make this quote more formal and elegant.',
        'more_casual': 'Make this quote more casual and conversational.',
        'more_profound': 'Make this quote more profound and deep.'
    };
    
    if (prompts[style]) {
        // Можно добавить AI-улучшение здесь
        console.log("Style change requested:", style);
    }
}

// Экспорт
function updateExportPreview() {
    const preview = document.getElementById('exportPreview');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 600;
    canvas.height = 300;
    
    // Рисуем превью
    ctx.fillStyle = settings.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = settings.colors.text;
    ctx.font = '24px Georgia';
    ctx.textAlign = 'center';
    
    const text = currentQuote.text;
    const author = `— ${currentQuote.author}`;
    
    // Разбиваем текст на строки
    const maxWidth = 500;
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    
    // Рисуем строки
    let y = 100;
    lines.forEach(line => {
        ctx.fillText(line, canvas.width / 2, y);
        y += 35;
    });
    
    // Рисуем автора
    ctx.font = 'italic 20px Georgia';
    ctx.fillStyle = settings.colors.accent;
    ctx.fillText(author, canvas.width / 2, y + 40);
    
    preview.innerHTML = '<h4>Preview:</h4>';
    preview.appendChild(canvas);
}

// Экспорт текста
function exportAsText(format) {
    if (!currentQuote) return;
    
    let content, filename, mimeType;
    
    switch(format) {
        case 'txt':
            content = `"${currentQuote.text}"\n\n— ${currentQuote.author}\n\nTheme: ${currentQuote.theme}\nStyle: ${currentQuote.style}\nGenerated: ${new Date(currentQuote.timestamp).toLocaleString()}\n\nGenerated with BAHR LAB AI Quote Generator`;
            filename = `quote-${currentQuote.id}.txt`;
            mimeType = 'text/plain';
            break;
            
        case 'json':
            content = JSON.stringify({
                quote: currentQuote.text,
                author: currentQuote.author,
                theme: currentQuote.theme,
                style: currentQuote.style,
                language: currentQuote.language,
                timestamp: currentQuote.timestamp,
                id: currentQuote.id,
                generated_with: 'BAHR LAB AI Quote Generator'
            }, null, 2);
            filename = `quote-${currentQuote.id}.json`;
            mimeType = 'application/json';
            break;
            
        case 'html':
            content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Generated Quote</title>
    <style>
        body {
            font-family: Georgia, serif;
            background: ${settings.colors.background};
            color: ${settings.colors.text};
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .quote-container {
            max-width: 600px;
            text-align: center;
        }
        .quote-text {
            font-size: 24px;
            line-height: 1.6;
            margin-bottom: 30px;
            position: relative;
        }
        .quote-text:before {
            content: '"';
            font-size: 60px;
            color: ${settings.colors.accent}20;
            position: absolute;
            left: -40px;
            top: -20px;
        }
        .quote-author {
            font-size: 20px;
            color: ${settings.colors.accent};
            font-style: italic;
            margin-top: 40px;
            position: relative;
        }
        .quote-author:before {
            content: '';
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 2px;
            background: ${settings.colors.accent};
        }
        .quote-meta {
            margin-top: 40px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="quote-container">
        <div class="quote-text">${currentQuote.text}</div>
        <div class="quote-author">— ${currentQuote.author}</div>
        <div class="quote-meta">
            <p>Generated with BAHR LAB AI Quote Generator</p>
            <p>${new Date(currentQuote.timestamp).toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
            filename = `quote-${currentQuote.id}.html`;
            mimeType = 'text/html';
            break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showIndicator(`Exported as ${format.toUpperCase()}`);
    setTimeout(hideIndicator, 1000);
}

// Экспорт изображений
function exportAsImage(format) {
    if (!currentQuote) return;
    
    const canvas = document.getElementById('quoteCanvas');
    const ctx = canvas.getContext('2d');
    
    // Размеры
    canvas.width = 1200;
    canvas.height = 630; // Оптимально для социальных сетей
    
    // Фон
    ctx.fillStyle = settings.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Декоративные элементы
    drawBackgroundPattern(ctx);
    
    // Текст цитаты
    ctx.fillStyle = settings.colors.text;
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    
    const text = `"${currentQuote.text}"`;
    const author = `— ${currentQuote.author}`;
    
    // Разбиваем текст
    const maxWidth = 1000;
    const lineHeight = 60;
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    
    // Рисуем строки
    let y = 180;
    lines.forEach(line => {
        ctx.fillText(line, canvas.width / 2, y);
        y += lineHeight;
    });
    
    // Автор
    ctx.font = 'italic 36px Georgia';
    ctx.fillStyle = settings.colors.accent;
    ctx.fillText(author, canvas.width / 2, y + 40);
    
    // Подпись
    ctx.font = '20px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Generated with BAHR LAB AI Quote Generator', canvas.width / 2, canvas.height - 40);
    
    // Экспорт
    let mimeType, extension;
    switch(format) {
        case 'png':
            mimeType = 'image/png';
            extension = 'png';
            break;
        case 'jpg':
            mimeType = 'image/jpeg';
            extension = 'jpg';
            break;
        case 'svg':
            // Для SVG нужно другое решение
            exportAsSVG();
            return;
    }
    
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${currentQuote.id}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, mimeType);
    
    showIndicator(`Image exported as ${format.toUpperCase()}`);
    setTimeout(hideIndicator, 1000);
}

function drawBackgroundPattern(ctx) {
    // Простой узор на фоне
    ctx.strokeStyle = settings.colors.accent + '20';
    ctx.lineWidth = 1;
    
    // Вертикальные линии
    for (let i = 0; i < ctx.canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, ctx.canvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let i = 0; i < ctx.canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(ctx.canvas.width, i);
        ctx.stroke();
    }
    
    // Декоративные круги
    ctx.fillStyle = settings.colors.accent + '10';
    ctx.beginPath();
    ctx.arc(100, 100, 60, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(ctx.canvas.width - 100, ctx.canvas.height - 100, 80, 0, Math.PI * 2);
    ctx.fill();
}

function exportAsSVG() {
    if (!currentQuote) return;
    
    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${settings.colors.background};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${settings.colors.accent}20;stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <rect width="100%" height="100%" fill="url(#bgGradient)"/>
    
    <g font-family="Georgia" text-anchor="middle">
        <text x="600" y="200" font-size="48" fill="${settings.colors.text}" font-weight="bold">
            "${currentQuote.text}"
        </text>
        <text x="600" y="500" font-size="36" fill="${settings.colors.accent}" font-style="italic">
            — ${currentQuote.author}
        </text>
        <text x="600" y="580" font-size="20" fill="#666666">
            Generated with BAHR LAB AI Quote Generator
        </text>
    </g>
</svg>`;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-${currentQuote.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyQuoteImage() {
    if (!currentQuote) return;
    
    const canvas = document.getElementById('quoteCanvas');
    canvas.toBlob(blob => {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
            showIndicator("Image copied to clipboard!");
            setTimeout(hideIndicator, 1000);
        }).catch(err => {
            console.error("Copy failed:", err);
            showError("Failed to copy image");
        });
    });
}

function shareOnTwitter() {
    if (!currentQuote) return;
    
    const text = `"${currentQuote.text}" — ${currentQuote.author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=AIQuote,BAHRLAB`;
    
    window.open(url, '_blank');
}

function downloadSocialImage() {
    // Изменяем размер для социальных сетей
    const canvas = document.getElementById('quoteCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1080;
    canvas.height = 1080; // Квадрат для Instagram
    
    // Перерисовываем с новыми размерами
    exportAsImage('png'); // Используем существующую функцию
}

// Другие функции
function copyQuote() {
    if (!currentQuote) {
        showError("No quote to copy!");
        return;
    }
    
    const text = `"${currentQuote.text}"\n\n— ${currentQuote.author}\n\nGenerated with BAHR LAB AI Quote Generator`;
    
    navigator.clipboard.writeText(text).then(() => {
        showIndicator("Copied to clipboard!");
        setTimeout(hideIndicator, 1000);
    });
}

function shareQuote() {
    if (!currentQuote) {
        showError("No quote to share!");
        return;
    }
    
    const text = `"${currentQuote.text}" — ${currentQuote.author}\n\nGenerated with BAHR LAB AI Quote Generator`;
    
    if (navigator.share) {
        navigator.share({
            title: 'AI Generated Quote',
            text: text,
            url: window.location.href
        });
    } else {
        copyQuote();
    }
}

function updateStats() {
    document.getElementById('quoteCount').textContent = generatedCount;
    document.getElementById('favoriteCount').textContent = favoriteQuotes.length;
    
    if (currentQuote) {
        const wordCount = currentQuote.text.split(/\s+/).length;
        document.getElementById('quoteLength').textContent = `${wordCount} words`;
    }
}

function updateQuoteDisplay() {
    if (currentQuote) {
        displayQuote(currentQuote);
    }
}

// Сохранение/загрузка
function loadSettings() {
    try {
        const saved = localStorage.getItem('quoteSettings');
        if (saved) {
            const data = JSON.parse(saved);
            settings = { ...settings, ...data };
            
            // Обновляем UI
            document.getElementById('lengthSlider').value = settings.length;
            if (settings.authorMode === 'custom') {
                document.getElementById('authorCustom').checked = true;
                document.getElementById('customAuthor').style.display = 'block';
                document.getElementById('customAuthor').value = settings.customAuthor || '';
            }
            
            setDesign(settings.design);
        }
    } catch (e) {
        console.error("Load settings error:", e);
    }
}

function saveSettings() {
    settings.length = parseInt(document.getElementById('lengthSlider').value);
    settings.customAuthor = document.getElementById('customAuthor').value;
    
    localStorage.setItem('quoteSettings', JSON.stringify(settings));
}

function loadFavorites() {
    try {
        const saved = localStorage.getItem('favoriteQuotes');
        if (saved) {
            favoriteQuotes = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Load favorites error:", e);
    }
}

function saveFavorites() {
    localStorage.setItem('favoriteQuotes', JSON.stringify(favoriteQuotes));
}

// Обработчики изменений
document.getElementById('textColor').addEventListener('input', function() {
    settings.colors.text = this.value;
    updateQuoteDisplay();
});

document.getElementById('bgColor').addEventListener('input', function() {
    settings.colors.background = this.value;
    updateQuoteDisplay();
});

document.getElementById('accentColor').addEventListener('input', function() {
    settings.colors.accent = this.value;
    updateQuoteDisplay();
});

document.getElementById('lengthSlider').addEventListener('input', function() {
    saveSettings();
});

document.getElementById('customAuthor').addEventListener('input', function() {
    saveSettings();
});

// Вспомогательные функции
function showError(message) {
    const indicator = document.getElementById('generationIndicator');
    document.getElementById('indicatorText').textContent = message;
    indicator.style.background = '#fff3f3';
    indicator.style.color = '#d32f2f';
    indicator.classList.add('active');
    
    setTimeout(() => {
        indicator.classList.remove('active');
        indicator.style.background = '';
        indicator.style.color = '';
    }, 2000);
}

// Инициализация при загрузке
window.onload = initApp;
