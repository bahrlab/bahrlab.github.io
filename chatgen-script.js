const API_URL = "https://freeai.logise1123.workers.dev/";
let chatState = {
    participants: [],
    messages: [],
    isGenerating: false,
    isPaused: false,
    currentParticipantIndex: 0,
    messageCount: 0,
    maxMessages: 20,
    generationSpeed: 'normal',
    chatName: 'Chat'
};

// Навигация
function goHome() {
    window.location.href = "https://bahrlab.github.io";
}

// Загрузка примеров
const examples = [
    {
        title: "Friends Planning Trip",
        desc: "Group of friends deciding where to go for vacation",
        participants: 4,
        scenario: "Friends arguing about vacation destination. Some want beach, others want mountains."
    },
    {
        title: "Work Project Discussion",
        desc: "Colleagues brainstorming new project ideas",
        participants: 3,
        scenario: "Team meeting to discuss new marketing campaign. Different creative approaches."
    },
    {
        title: "Family Dinner Plans",
        desc: "Family chat about weekend dinner arrangements",
        participants: 5,
        scenario: "Planning family dinner. Debating restaurant vs home cooking, who brings what."
    },
    {
        title: "Study Group Session",
        desc: "Students preparing for exams together",
        participants: 4,
        scenario: "Study group helping each other with difficult topics. Mix of serious and funny moments."
    }
];

function loadExamples() {
    const grid = document.getElementById('examplesGrid');
    grid.innerHTML = examples.map(example => `
        <div class="example-card" onclick="loadExample('${example.scenario}', ${example.participants})">
            <div class="example-title">${example.title}</div>
            <div class="example-desc">${example.desc}</div>
            <div class="example-meta">
                <span>👥 ${example.participants} people</span>
                <span>💬 Group chat</span>
            </div>
        </div>
    `).join('');
}

function loadExample(scenario, participantCount) {
    document.getElementById('scenario').value = scenario;
    
    // Создаем участников
    const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey'];
    const personalities = [
        "Friendly and enthusiastic",
        "Practical and logical",
        "Creative and spontaneous",
        "Organized and detail-oriented",
        "Chill and easygoing",
        "Ambitious and driven"
    ];
    
    chatState.participants = [];
    for (let i = 0; i < participantCount; i++) {
        chatState.participants.push({
            name: names[i % names.length],
            personality: personalities[i % personalities.length],
            avatar: names[i % names.length].charAt(0)
        });
    }
    
    showAdvancedSetup();
    renderParticipants();
}

// Навигация по страницам
function showAdvancedSetup() {
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('setupPage').style.display = 'block';
    
    // Если участников нет, создаем двух по умолчанию
    if (chatState.participants.length === 0) {
        chatState.participants = [
            {
                name: "Alex",
                personality: "Friendly and talkative",
                avatar: "A"
            },
            {
                name: "Sam",
                personality: "Reserved but thoughtful",
                avatar: "S"
            }
        ];
        renderParticipants();
    }
}

function goBack() {
    document.getElementById('setupPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
}

function startChat() {
    const scenario = document.getElementById('scenario').value.trim();
    if (!scenario) {
        alert("Please describe the chat scenario!");
        return;
    }
    
    if (chatState.participants.length < 2) {
        alert("Add at least 2 participants!");
        return;
    }
    
    // Сохраняем настройки
    chatState.chatName = document.getElementById('chatName').value.trim() || "Chat";
    chatState.maxMessages = parseInt(document.getElementById('maxMessages').value);
    chatState.autoContinue = document.getElementById('autoContinue').checked;
    chatState.showTyping = document.getElementById('showTyping').checked;
    chatState.addReactions = document.getElementById('addReactions').checked;
    
    // Очищаем предыдущий чат
    chatState.messages = [];
    chatState.messageCount = 0;
    chatState.currentParticipantIndex = 0;
    chatState.isGenerating = false;
    chatState.isPaused = false;
    
    // Переключаемся на страницу чата
    document.getElementById('setupPage').style.display = 'none';
    document.getElementById('chatPage').style.display = 'block';
    
    // Обновляем UI
    document.getElementById('chatTitle').textContent = chatState.chatName;
    document.getElementById('participantCount').textContent = `${chatState.participants.length} online`;
    document.getElementById('totalCount').textContent = chatState.maxMessages;
    document.getElementById('progressCount').textContent = '0';
    document.getElementById('progressFill').style.width = '0%';
    
    // Очищаем чат
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '<div class="empty-state" id="emptyState"><div class="empty-icon">💬</div><h3>Chat is empty</h3><p>Starting generation...</p></div>';
    
    // Начинаем генерацию
    setTimeout(() => {
        startGeneration();
    }, 1000);
}

// Управление участниками
function renderParticipants() {
    const list = document.getElementById('participantsList');
    list.innerHTML = '';
    
    chatState.participants.forEach((participant, index) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <div class="participant-avatar">${participant.avatar}</div>
            <div class="participant-info">
                <div class="participant-name">${participant.name}</div>
                <div class="participant-desc">${participant.personality}</div>
            </div>
            <button class="remove-participant" onclick="removeParticipant(${index})">×</button>
        `;
        list.appendChild(item);
    });
}

function addParticipant() {
    if (chatState.participants.length >= 6) {
        alert("Maximum 6 participants allowed!");
        return;
    }
    
    const name = prompt("Enter participant name:", `User${chatState.participants.length + 1}`);
    if (!name || name.trim() === '') return;
    
    const personality = prompt("Describe their personality:", "Friendly conversationalist");
    if (!personality) return;
    
    const newParticipant = {
        name: name.trim(),
        personality: personality.trim(),
        avatar: name.trim().charAt(0).toUpperCase()
    };
    
    chatState.participants.push(newParticipant);
    renderParticipants();
}

function removeParticipant(index) {
    if (chatState.participants.length <= 2) {
        alert("You need at least 2 participants!");
        return;
    }
    
    if (confirm(`Remove ${chatState.participants[index].name}?`)) {
        chatState.participants.splice(index, 1);
        renderParticipants();
    }
}

// Скорость генерации
function setSpeed(speed) {
    chatState.generationSpeed = speed;
    
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Генерация чата
async function startGeneration() {
    if (chatState.isGenerating) return;
    
    chatState.isGenerating = true;
    chatState.isPaused = false;
    document.getElementById('pauseBtn').innerHTML = '<span>⏸️</span> Pause';
    
    // Скрываем пустое состояние
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'none';
    
    // Добавляем первое сообщение
    await generateNextMessage();
    
    // Авто-продолжение если включено
    if (chatState.autoContinue) {
        continueGeneration();
    }
}

async function generateNextMessage() {
    if (chatState.messageCount >= chatState.maxMessages || !chatState.isGenerating || chatState.isPaused) {
        return;
    }
    
    // Выбираем участника (чередуем)
    const participant = chatState.participants[chatState.currentParticipantIndex];
    chatState.currentParticipantIndex = (chatState.currentParticipantIndex + 1) % chatState.participants.length;
    
    // Показываем индикатор набора
    if (chatState.showTyping) {
        showTypingIndicator(participant);
    }
    
    // Задержка в зависимости от скорости
    const delay = chatState.generationSpeed === 'fast' ? 1000 :
                 chatState.generationSpeed === 'slow' ? 3000 : 2000;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Скрываем индикатор
    if (chatState.showTyping) {
        hideTypingIndicator();
    }
    
    // Генерируем сообщение
    try {
        const message = await generateAIMessage(participant);
        addMessageToChat(participant, message);
        
        // Обновляем прогресс
        chatState.messageCount++;
        updateProgress();
        
    } catch (error) {
        console.error("Error generating message:", error);
        // Fallback сообщение
        addMessageToChat(participant, "Hmm, let me think about that...");
        chatState.messageCount++;
        updateProgress();
    }
}

async function generateAIMessage(participant) {
    // Получаем контекст из последних сообщений
    const recentMessages = chatState.messages.slice(-5).map(msg => 
        `${msg.participant.name}: ${msg.text}`
    ).join('\n');
    
    const scenario = document.getElementById('scenario').value;
    const otherParticipants = chatState.participants.filter(p => p.name !== participant.name)
        .map(p => `${p.name} (${p.personality})`).join(', ');
    
    const prompt = `You are ${participant.name}, ${participant.personality}.

Other participants: ${otherParticipants}
Chat scenario: ${scenario}

Recent messages:
${recentMessages || "Chat just started."}

Write one natural chat message as ${participant.name}. Keep it short (1-2 sentences max). Be in character.`;

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
        const aiMessage = data?.choices?.[0]?.message?.content || "I agree!";
        
        // Очищаем ответ от лишнего
        let cleanMessage = aiMessage.trim();
        
        // Убираем кавычки если есть
        if (cleanMessage.startsWith('"') && cleanMessage.endsWith('"')) {
            cleanMessage = cleanMessage.slice(1, -1);
        }
        
        // Убираем имя если ИИ его добавил
        if (cleanMessage.toLowerCase().startsWith(`${participant.name.toLowerCase()}:`)) {
            cleanMessage = cleanMessage.substring(participant.name.length + 1).trim();
        }
        
        return cleanMessage || "Interesting point!";
        
    } catch (error) {
        throw error;
    }
}

function addMessageToChat(participant, text) {
    const message = {
        id: Date.now(),
        participant: participant,
        text: text,
        timestamp: new Date(),
        isOutgoing: Math.random() > 0.5 // Для визуального разнообразия
    };
    
    chatState.messages.push(message);
    displayMessage(message);
    
    // Добавляем реакцию если включено
    if (chatState.addReactions && Math.random() > 0.7 && chatState.messages.length > 3) {
        setTimeout(() => addReactionToRandomMessage(), 500);
    }
    
    return message;
}

function displayMessage(message) {
    const chatArea = document.getElementById('chatArea');
    
    // Убираем пустое состояние если оно есть
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.remove();
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.isOutgoing ? 'message-outgoing' : 'message-incoming'}`;
    
    messageElement.innerHTML = `
        <div class="message-avatar">${message.participant.avatar}</div>
        <div class="message-content">
            <div class="message-text">${formatMessageText(message.text)}</div>
            <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
    `;
    
    chatArea.appendChild(messageElement);
    
    // Прокручиваем вниз
    setTimeout(() => {
        chatArea.scrollTop = chatArea.scrollHeight;
    }, 100);
}

function formatMessageText(text) {
    // Простое форматирование
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Индикатор набора
function showTypingIndicator(participant) {
    const indicator = document.getElementById('typingIndicator');
    document.getElementById('typingAvatar').textContent = participant.avatar;
    document.getElementById('typingName').textContent = participant.name;
    indicator.style.display = 'flex';
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'none';
}

// Прогресс
function updateProgress() {
    document.getElementById('progressCount').textContent = chatState.messageCount;
    const percent = (chatState.messageCount / chatState.maxMessages) * 100;
    document.getElementById('progressFill').style.width = percent + '%';
}

// Продолжение генерации
async function continueGeneration() {
    while (chatState.isGenerating && 
           !chatState.isPaused && 
           chatState.messageCount < chatState.maxMessages) {
        
        await generateNextMessage();
        
        // Задержка между сообщениями
        const delay = chatState.generationSpeed === 'fast' ? 1500 :
                     chatState.generationSpeed === 'slow' ? 3500 : 2500;
        
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Если достигли максимума
    if (chatState.messageCount >= chatState.maxMessages) {
        stopGeneration();
    }
}

// Управление генерацией
function togglePause() {
    if (!chatState.isGenerating) return;
    
    chatState.isPaused = !chatState.isPaused;
    const btn = document.getElementById('pauseBtn');
    
    if (chatState.isPaused) {
        btn.innerHTML = '<span>▶️</span> Resume';
    } else {
        btn.innerHTML = '<span>⏸️</span> Pause';
        continueGeneration();
    }
}

function stopGeneration() {
    chatState.isGenerating = false;
    chatState.isPaused = false;
    document.getElementById('pauseBtn').innerHTML = '<span>⏸️</span> Pause';
}

function generateMore(count) {
    if (!chatState.isGenerating) {
        startGeneration();
    }
    
    // Временно увеличиваем максимум
    const oldMax = chatState.maxMessages;
    chatState.maxMessages = Math.max(chatState.maxMessages, chatState.messageCount + count);
    document.getElementById('totalCount').textContent = chatState.maxMessages;
    
    // Продолжаем генерацию если была на паузе
    if (chatState.isPaused) {
        togglePause();
    }
    
    // Возвращаем старый максимум после завершения
    setTimeout(() => {
        if (chatState.messageCount >= chatState.maxMessages) {
            chatState.maxMessages = oldMax;
            document.getElementById('totalCount').textContent = oldMax;
        }
    }, count * 3000);
}

// Реакции
function addReactionToRandomMessage() {
    if (chatState.messages.length < 2) return;
    
    const reactions = ['👍', '❤️', '😂', '😮', '👏', '🔥'];
    const randomIndex = Math.floor(Math.random() * (chatState.messages.length - 1));
    const message = chatState.messages[randomIndex];
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    
    // Добавляем реакцию к элементу DOM
    const messageElement = document.querySelector(`.message:nth-child(${randomIndex + 1}) .message-content`);
    if (messageElement && !messageElement.querySelector('.message-reaction')) {
        const reactionElement = document.createElement('div');
        reactionElement.className = 'message-reaction';
        reactionElement.textContent = reaction;
        messageElement.appendChild(reactionElement);
    }
}

// Регенерация последнего сообщения
async function regenerateLast() {
    if (chatState.messages.length === 0) return;
    
    const lastMessage = chatState.messages[chatState.messages.length - 1];
    const participant = lastMessage.participant;
    
    // Удаляем последнее сообщение
    chatState.messages.pop();
    const chatArea = document.getElementById('chatArea');
    chatArea.removeChild(chatArea.lastChild);
    
    // Обновляем счетчик
    chatState.messageCount--;
    updateProgress();
    
    // Генерируем новое
    if (chatState.showTyping) {
        showTypingIndicator(participant);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (chatState.showTyping) {
        hideTypingIndicator();
    }
    
    const newMessage = await generateAIMessage(participant);
    addMessageToChat(participant, newMessage);
}

// Кастомное сообщение
function addCustomMessage() {
    // Заполняем список участников
    const select = document.getElementById('messageParticipant');
    select.innerHTML = '';
    
    chatState.participants.forEach((participant, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = participant.name;
        select.appendChild(option);
    });
    
    document.getElementById('messageText').value = '';
    document.getElementById('messageModal').style.display = 'flex';
}

function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
}

function sendCustomMessage() {
    const select = document.getElementById('messageParticipant');
    const participantIndex = parseInt(select.value);
    const text = document.getElementById('messageText').value.trim();
    const addReaction = document.getElementById('addReaction').checked;
    
    if (!text) {
        alert("Please enter message text!");
        return;
    }
    
    const participant = chatState.participants[participantIndex];
    const message = addMessageToChat(participant, text);
    
    // Добавляем реакцию если нужно
    if (addReaction && Math.random() > 0.5) {
        setTimeout(() => {
            const reactions = ['👍', '❤️', '😂'];
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];
            const messageElement = document.querySelector(`.message:last-child .message-content`);
            if (messageElement && !messageElement.querySelector('.message-reaction')) {
                const reactionElement = document.createElement('div');
                reactionElement.className = 'message-reaction';
                reactionElement.textContent = reaction;
                messageElement.appendChild(reactionElement);
            }
        }, 500);
    }
    
    closeMessageModal();
}

// Экспорт
function showExport() {
    // Обновляем статистику
    document.getElementById('exportMessageCount').textContent = chatState.messages.length;
    document.getElementById('exportParticipantCount').textContent = chatState.participants.length;
    
    const wordCount = chatState.messages.reduce((total, msg) => 
        total + (msg.text || '').split(/\s+/).length, 0);
    document.getElementById('exportWordCount').textContent = wordCount;
    
    document.getElementById('exportModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('exportModal').style.display = 'none';
}

function exportAsTXT() {
    let txt = `Chat: ${chatState.chatName}\n`;
    txt += `Participants: ${chatState.participants.map(p => p.name).join(', ')}\n`;
    txt += `Scenario: ${document.getElementById('scenario').value}\n`;
    txt += `Generated: ${new Date().toLocaleString()}\n`;
    txt += '='.repeat(50) + '\n\n';
    
    chatState.messages.forEach(msg => {
        const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        txt += `[${time}] ${msg.participant.name}: ${msg.text}\n`;
    });
    
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeModal();
}

function exportAsHTML() {
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${chatState.chatName}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .message { margin-bottom: 15px; padding: 10px; background: white; border-radius: 8px; border-left: 4px solid #000; }
        .message-header { font-weight: bold; color: #000; margin-bottom: 5px; }
        .message-time { color: #666; font-size: 12px; float: right; }
        .message-text { line-height: 1.5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${chatState.chatName}</h1>
        <p><strong>Participants:</strong> ${chatState.participants.map(p => p.name).join(', ')}</p>
        <p><strong>Scenario:</strong> ${document.getElementById('scenario').value}</p>
        <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
    </div>`;
    
    chatState.messages.forEach(msg => {
        const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        html += `
    <div class="message">
        <div class="message-header">
            ${msg.participant.name}
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${msg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>`;
    });
    
    html += `
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeModal();
}

function copyChat() {
    let txt = `Chat: ${chatState.chatName}\n\n`;
    
    chatState.messages.forEach(msg => {
        const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        txt += `${msg.participant.name} (${time}): ${msg.text}\n`;
    });
    
    navigator.clipboard.writeText(txt).then(() => {
        alert("Chat copied to clipboard!");
        closeModal();
    });
}

// Быстрая генерация
function quickGenerate() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        alert("Describe what the chat should be about!");
        return;
    }
    
    document.getElementById('scenario').value = query;
    
    // Создаем случайных участников
    const names = ['Alex', 'Sam', 'Jordan', 'Taylor'];
    const personalities = [
        "Optimistic and energetic",
        "Practical and logical",
        "Creative and spontaneous",
        "Organized and careful"
    ];
    
    const participantCount = 2 + Math.floor(Math.random() * 2); // 2-3 участника
    
    chatState.participants = [];
    for (let i = 0; i < participantCount; i++) {
        chatState.participants.push({
            name: names[i],
            personality: personalities[i],
            avatar: names[i].charAt(0)
        });
    }
    
    showAdvancedSetup();
    renderParticipants();
}

// Инициализация
window.onload = function() {
    loadExamples();
    document.getElementById('searchInput').focus();
    
    // Быстрая генерация по Enter
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            quickGenerate();
        }
    });
};
