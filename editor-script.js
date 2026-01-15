const API_URL = "https://freeai.logise1123.workers.dev/";
let currentText = '';
let selectedText = '';
let selectionStart = 0;
let selectionEnd = 0;
let creationMode = 'ai';
let selectedKeywords = [];

// Навигация
function goHome() {
    window.location.href = "https://bahrlab.github.io";
}

// Установка режима создания
function setCreationMode(mode) {
    creationMode = mode;
    
    document.getElementById('aiOption').classList.remove('active');
    document.getElementById('pasteOption').classList.remove('active');
    
    if (mode === 'ai') {
        document.getElementById('aiOption').classList.add('active');
        document.getElementById('aiPromptSection').style.display = 'block';
        document.getElementById('pasteSection').style.display = 'none';
    } else {
        document.getElementById('pasteOption').classList.add('active');
        document.getElementById('aiPromptSection').style.display = 'none';
        document.getElementById('pasteSection').style.display = 'block';
    }
}

// Показать индикатор генерации
function showGenerationIndicator(text = "Applying changes...") {
    const indicator = document.getElementById('generationIndicator');
    document.getElementById('indicatorText').textContent = text;
    indicator.classList.add('active');
    
    return indicator;
}

// Скрыть индикатор
function hideGenerationIndicator() {
    const indicator = document.getElementById('generationIndicator');
    setTimeout(() => {
        indicator.classList.remove('active');
    }, 500);
}

// Генерация текста AI
async function generateText() {
    const prompt = document.getElementById('aiPrompt').value.trim();
    if (!prompt) {
        alert('Please enter a description for your text');
        return;
    }
    
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('errorSection').style.display = 'none';
    
    try {
        const aiPrompt = `Write a text about: "${prompt}"
        
        Requirements:
        - Write in natural, flowing language
        - Appropriate length (3-5 paragraphs)
        - Include varied sentence structure
        - ${selectedKeywords.length > 0 ? 'Include these keywords: ' + selectedKeywords.join(', ') : ''}
        
        Return only the text, no explanations.`;
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: aiPrompt }]
            })
        });
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        const aiText = data?.choices?.[0]?.message?.content || "";
        
        if (!aiText || aiText.includes('[object Object]')) {
            throw new Error('Invalid response');
        }
        
        currentText = aiText;
        showEditor(aiText);
        
    } catch (error) {
        console.error('Error generating text:', error);
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'block';
    }
}

// Загрузка вставленного текста
function loadPastedText() {
    const text = document.getElementById('pasteText').value.trim();
    if (!text) {
        alert('Please paste some text');
        return;
    }
    
    currentText = text;
    showEditor(text);
}

// Показать редактор
function showEditor(text) {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('editorPage').style.display = 'block';
    
    const editor = document.getElementById('textEditor');
    editor.value = text;
    currentText = text;
    
    updateStats();
    updateTextSelection();
}

// Создать новый текст
function createNew() {
    document.getElementById('editorPage').style.display = 'none';
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('aiPrompt').value = '';
    document.getElementById('pasteText').value = '';
    setCreationMode('ai');
}

// Обновить статистику
function updateStats() {
    const text = document.getElementById('textEditor').value;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = text.length;
    
    document.getElementById('wordCount').textContent = words;
    document.getElementById('charCount').textContent = chars;
}

// Выделение текста
function selectText() {
    const editor = document.getElementById('textEditor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    
    if (start === end) {
        alert('Please select some text first');
        return;
    }
    
    selectedText = editor.value.substring(start, end);
    selectionStart = start;
    selectionEnd = end;
    
    document.getElementById('selectedTextPreview').innerHTML = 
        `<strong>Selected:</strong> "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`;
    
    document.getElementById('selectBtn').classList.add('active');
}

// Обновление выделения
function updateTextSelection() {
    const editor = document.getElementById('textEditor');
    editor.addEventListener('mouseup', function() {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        
        if (start !== end) {
            selectedText = this.value.substring(start, end);
            selectionStart = start;
            selectionEnd = end;
            
            document.getElementById('selectedTextPreview').innerHTML = 
                `<strong>Selected:</strong> "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`;
        }
    });
    
    editor.addEventListener('keyup', function() {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        
        if (start !== end) {
            selectedText = this.value.substring(start, end);
            selectionStart = start;
            selectionEnd = end;
            
            document.getElementById('selectedTextPreview').innerHTML = 
                `<strong>Selected:</strong> "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`;
        }
    });
}

// Панель редактирования
function openEditPanel() {
    if (!selectedText) {
        alert('Please select some text first');
        return;
    }
    
    document.getElementById('editPanel').classList.add('active');
}

function closeEditPanel() {
    document.getElementById('editPanel').classList.remove('active');
    document.getElementById('customEditPrompt').value = '';
}

// Применение редактирования
async function applyEdit(action) {
    if (!selectedText) return;
    
    const indicator = showGenerationIndicator(getEditActionText(action));
    
    try {
        const instruction = getEditInstruction(action, selectedText);
        const newText = await callAI(instruction);
        
        if (newText) {
            applyTextChange(newText);
            closeEditPanel();
        }
    } catch (error) {
        console.error('Edit error:', error);
        alert('Error applying edit. Please try again.');
    } finally {
        hideGenerationIndicator();
    }
}

function getEditActionText(action) {
    const actions = {
        'simplify': 'Simplifying text...',
        'explain': 'Explaining meaning...',
        'rephrase': 'Rephrasing text...',
        'formal': 'Making formal...',
        'casual': 'Making casual...',
        'expand': 'Expanding text...',
        'shorten': 'Shortening text...',
        'remove': 'Removing text...'
    };
    return actions[action] || 'Applying changes...';
}

function getEditInstruction(action, text) {
    switch(action) {
        case 'simplify':
            return `Simplify this text to make it easier to understand: "${text}"`;
        case 'explain':
            return `Explain the meaning of this text clearly: "${text}"`;
        case 'rephrase':
            return `Rephrase this text using different words: "${text}"`;
        case 'formal':
            return `Make this text more formal and professional: "${text}"`;
        case 'casual':
            return `Make this text more casual and conversational: "${text}"`;
        case 'expand':
            return `Expand this text with more details: "${text}"`;
        case 'shorten':
            return `Make this text more concise: "${text}"`;
        case 'remove':
            return `Suggest a removal for: "${text}"`;
        default:
            return `Improve this text: "${text}"`;
    }
}

// Кастомное редактирование
async function applyCustomEdit() {
    const customPrompt = document.getElementById('customEditPrompt').value.trim();
    if (!customPrompt || !selectedText) return;
    
    const indicator = showGenerationIndicator('Applying custom edit...');
    
    try {
        const instruction = `Regarding this text: "${selectedText}"
        
        Please do this: ${customPrompt}
        
        Return only the modified text.`;
        
        const newText = await callAI(instruction);
        
        if (newText) {
            applyTextChange(newText);
            document.getElementById('customEditPrompt').value = '';
            closeEditPanel();
        }
    } catch (error) {
        console.error('Custom edit error:', error);
        alert('Error applying custom edit.');
    } finally {
        hideGenerationIndicator();
    }
}

// Применение изменения текста
function applyTextChange(newText) {
    const editor = document.getElementById('textEditor');
    const fullText = editor.value;
    
    const updatedText = fullText.substring(0, selectionStart) + 
                       newText + 
                       fullText.substring(selectionEnd);
    
    editor.value = updatedText;
    currentText = updatedText;
    
    // Обновляем позицию выделения
    selectionEnd = selectionStart + newText.length;
    selectedText = newText;
    
    updateStats();
}

// Вызов AI
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
        return data?.choices?.[0]?.message?.content || null;
        
    } catch (error) {
        console.error('AI call error:', error);
        throw error;
    }
}

// Трансформация всего текста
async function transformEntireText(style) {
    const editor = document.getElementById('textEditor');
    const text = editor.value;
    
    if (!text.trim()) {
        alert('Please enter some text first');
        return;
    }
    
    const indicator = showGenerationIndicator(getTransformText(style));
    
    try {
        const instruction = getTransformInstruction(style, text);
        const newText = await callAI(instruction);
        
        if (newText) {
            editor.value = newText;
            currentText = newText;
            updateStats();
        }
    } catch (error) {
        console.error('Transform error:', error);
        alert('Error transforming text.');
    } finally {
        hideGenerationIndicator();
    }
}

function getTransformText(style) {
    const texts = {
        'simplify': 'Simplifying entire text...',
        'formal': 'Making text formal...',
        'creative': 'Making text creative...'
    };
    return texts[style] || 'Transforming text...';
}

function getTransformInstruction(style, text) {
    switch(style) {
        case 'simplify':
            return `Simplify this entire text to make it easier to understand:\n\n${text}`;
        case 'formal':
            return `Rewrite this text in a more formal and professional style:\n\n${text}`;
        case 'creative':
            return `Make this text more creative and engaging:\n\n${text}`;
        default:
            return `Improve this text:\n\n${text}`;
    }
}

// Модальные окна
function openExportModal() {
    document.getElementById('exportModal').classList.add('active');
}

function openKeywordsModal() {
    document.getElementById('keywordsModal').classList.add('active');
    updateKeywordsPreview();
}

function openLengthModal() {
    document.getElementById('lengthModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Ключевые слова
function updateKeywordsPreview() {
    const preview = document.getElementById('keywordsPreview');
    if (selectedKeywords.length === 0) {
        preview.innerHTML = '<em>No keywords added yet</em>';
    } else {
        preview.innerHTML = selectedKeywords.map(keyword => 
            `<span class="keyword-tag">${keyword} <span onclick="removeKeyword('${keyword}')" style="cursor:pointer;margin-left:5px;">×</span></span>`
        ).join('');
    }
}

function removeKeyword(keyword) {
    selectedKeywords = selectedKeywords.filter(k => k !== keyword);
    updateKeywordsPreview();
}

async function applyKeywords() {
    const input = document.getElementById('keywordsInput').value.trim();
    if (input) {
        const newKeywords = input.split(',').map(k => k.trim()).filter(k => k);
        selectedKeywords = [...new Set([...selectedKeywords, ...newKeywords])];
        document.getElementById('keywordsInput').value = '';
        updateKeywordsPreview();
    }
    
    if (selectedKeywords.length > 0) {
        const editor = document.getElementById('textEditor');
        const text = editor.value;
        
        if (text) {
            const indicator = showGenerationIndicator('Adding keywords...');
            
            try {
                const keywordInstruction = `Rewrite this text to naturally include these keywords: ${selectedKeywords.join(', ')}\n\nText to modify:\n${text}`;
                const newText = await callAI(keywordInstruction);
                
                if (newText) {
                    editor.value = newText;
                    currentText = newText;
                    updateStats();
                }
            } catch (error) {
                console.error('Keywords error:', error);
                alert('Error adding keywords.');
            } finally {
                hideGenerationIndicator();
            }
        }
    }
    
    closeModal('keywordsModal');
}

// Изменение длины
async function changeLength(type) {
    const editor = document.getElementById('textEditor');
    const text = editor.value;
    
    if (!text.trim()) {
        alert('Please enter some text first');
        return;
    }
    
    const indicator = showGenerationIndicator(getLengthText(type));
    
    try {
        const instruction = getLengthInstruction(type, text);
        const newText = await callAI(instruction);
        
        if (newText) {
            editor.value = newText;
            currentText = newText;
            updateStats();
        }
        
        closeModal('lengthModal');
        
    } catch (error) {
        console.error('Length change error:', error);
        alert('Error changing text length.');
    } finally {
        hideGenerationIndicator();
    }
}

function getLengthText(type) {
    const texts = {
        'shorter': 'Making text shorter...',
        'slightly_shorter': 'Making text slightly shorter...',
        'longer': 'Making text longer...',
        'slightly_longer': 'Making text slightly longer...'
    };
    return texts[type] || 'Changing length...';
}

function getLengthInstruction(type, text) {
    switch(type) {
        case 'shorter':
            return `Make this text 50% shorter while keeping the main ideas:\n\n${text}`;
        case 'slightly_shorter':
            return `Make this text 25% shorter:\n\n${text}`;
        case 'longer':
            return `Expand this text to be 50% longer, adding relevant details:\n\n${text}`;
        case 'slightly_longer':
            return `Make this text 25% longer:\n\n${text}`;
        default:
            return `Adjust the length of this text:\n\n${text}`;
    }
}

// Экспорт и загрузка
function copyText() {
    const text = document.getElementById('textEditor').value;
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Text copied to clipboard!');
    });
}

function downloadText(format) {
    const text = document.getElementById('textEditor').value;
    const filename = `bahrlab-text-${Date.now()}`;
    
    let content, mimeType, extension;
    
    switch(format) {
        case 'txt':
            content = text;
            mimeType = 'text/plain';
            extension = '.txt';
            break;
        case 'doc':
            // Создаем простой HTML документ для .doc
            content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BAHR LAB Document</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
    </style>
</head>
<body>
    ${text.replace(/\n/g, '<br>')}
</body>
</html>`;
            mimeType = 'application/msword';
            extension = '.doc';
            break;
        case 'pdf':
            // Для PDF используем сторонний сервис или сохраняем как HTML
            showNotification('PDF export requires server-side processing. Downloading as HTML instead.');
            content = `<html><body style="font-family: Arial; padding: 20px;">${text.replace(/\n/g, '<br>')}</body></html>`;
            mimeType = 'text/html';
            extension = '.html';
            break;
        default:
            content = text;
            mimeType = 'text/plain';
            extension = '.txt';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + extension;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`File downloaded as ${extension}`);
}

function shareText() {
    const text = document.getElementById('textEditor').value;
    
    if (navigator.share) {
        navigator.share({
            title: 'Text from BAHR LAB Editor',
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            url: window.location.href
        });
    } else {
        copyText();
    }
}

function clearEditor() {
    if (confirm('Are you sure you want to clear all text?')) {
        document.getElementById('textEditor').value = '';
        currentText = '';
        selectedText = '';
        updateStats();
    }
}

// Уведомления
function showNotification(message) {
    // Создаем временное уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 4000;
        animation: fadeInOut 3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Проверка URL
function checkUrlForPrompt() {
    const urlParams = new URLSearchParams(window.location.search);
    const prompt = urlParams.get('p');
    const text = urlParams.get('text');
    
    if (prompt) {
        document.getElementById('aiPrompt').value = prompt;
        generateText();
    } else if (text) {
        document.getElementById('pasteText').value = decodeURIComponent(text);
        setCreationMode('paste');
        loadPastedText();
    } else {
        document.getElementById('homePage').style.display = 'block';
    }
}

// Глобальные обработчики
document.addEventListener('click', function(event) {
    const editPanel = document.getElementById('editPanel');
    if (editPanel.classList.contains('active') && 
        !editPanel.contains(event.target) && 
        !event.target.closest('.tool-button')) {
        closeEditPanel();
    }
});

// Инициализация
window.onload = function() {
    checkUrlForPrompt();
    document.getElementById('aiPrompt').focus();
    
    // Стили для анимации уведомлений
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
};
