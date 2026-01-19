const API_URL = "https://freeai.logise1123.workers.dev/";
let chatData = {
    participants: [],
    messages: [],
    metadata: {},
    currentTopic: ""
};
let selectedExportFormat = 'txt';

// Навигация
function goHome() {
    window.location.href = "https://bahrlab.github.io";
}

// Загрузка примера
function loadExample() {
    document.getElementById('chatName').value = "Friends Planning Party";
    document.getElementById('chatTheme').value = "friends";
    document.getElementById('chatTopic').value = "Planning a surprise birthday party for Sarah. Alex wants something big at a club, Jordan prefers a cozy dinner at home, Taylor is worried about costs, and Morgan just wants everyone to agree on something.";
    
    // Очищаем текущих участников
    document.getElementById('participantsContainer').innerHTML = '';
    
    // Добавляем пример участников
    const exampleParticipants = [
        {
            name: "Alex",
            personality: "Energetic and extravagant, loves big parties",
            avatar: "A",
            talkativeness: 8,
            emojiLevel: 7
        },
        {
            name: "Jordan",
            personality: "Practical and budget-conscious, prefers intimate gatherings",
            avatar: "J",
            talkativeness: 6,
            emojiLevel: 4
        },
        {
            name: "Taylor",
            personality: "Anxious but caring, worried about everything going perfectly",
            avatar: "T",
            talkativeness: 7,
            emojiLevel: 6
        },
        {
            name: "Morgan",
            personality: "Chill and diplomatic, tries to keep peace in the group",
            avatar: "M",
            talkativeness: 5,
            emojiLevel: 5
        }
    ];
    
    chatData.participants = exampleParticipants;
    renderParticipants();
    
    // Обновляем настройки
    document.getElementById('chatLength').value = 25;
    document.getElementById('lengthValue').textContent = "25";
    document.getElementById('responseSpeed').value = 5;
    document.getElementById('emojiUsage').value = 6;
}

// Сброс настроек
function resetSettings() {
    if (confirm("Reset all settings to default?")) {
        document.getElementById('chatName').value = "Group Chat";
        document.getElementById('chatTheme').value = "casual";
        document.getElementById('chatTopic').value = "";
        document.getElementById('chatLength').value = 20;
        document.getElementById('lengthValue').textContent = "20";
        document.getElementById('responseSpeed').value = 5;
        document.getElementById('emojiUsage').value = 5;
        document.getElementById('includeTyping').checked = true;
        document.getElementById('includeRead').checked = true;
        document.getElementById('includeTime').checked = true;
        document.getElementById('includeReactions').checked = false;
        
        // Очищаем участников
        document.getElementById('participantsContainer').innerHTML = '';
        chatData.participants = [];
        
        // Добавляем двух участников по умолчанию
        addDefaultParticipants();
    }
}

// Добавление участников по умолчанию
function addDefaultParticipants() {
    const defaultParticipants = [
        {
            name: "Alex",
            personality: "Friendly and talkative",
            avatar: "A",
            talkativeness: 7,
            emojiLevel: 5
        },
        {
            name: "Sam",
            personality: "Reserved but thoughtful",
            avatar: "S",
            talkativeness: 5,
            emojiLevel: 3
        }
    ];
    
    chatData.participants = defaultParticipants;
    renderParticipants();
}

// Рендер участников
function renderParticipants() {
    const container = document.getElementById('participantsContainer');
    container.innerHTML = '';
    
    chatData.participants.forEach((participant, index) => {
        const participantCard = document.createElement('div');
        participantCard.className = 'participant-card';
        participantCard.innerHTML = `
            <div class="participant-header">
                <div class="participant-avatar" style="background: linear-gradient(135deg, ${getAvatarColor(index)});">
                    ${participant.avatar}
                </div>
                <div class="participant-info">
                    <div class="participant-name">${participant.name}</div>
                    <div class="participant-personality">${participant.personality}</div>
                </div>
            </div>
            <div class="participant-controls">
                <button class="participant-btn" onclick="editParticipant(${index})">
                    Edit
                </button>
                <button class="participant-btn remove" onclick="removeParticipant(${index})">
                    Remove
                </button>
            </div>
        `;
        container.appendChild(participantCard);
    });
}

// Цвета для аватаров
function getAvatarColor(index) {
    const colors = [
        '#667eea, #764ba2',
        '#f093fb, #f5576c',
        '#4facfe, #00f2fe',
        '#43e97b, #38f9d7',
        '#fa709a, #fee140',
        '#30cfd0, #330867',
        '#a3bded, #6991c7',
        '#5ee7df, #b490ca'
    ];
    return colors[index % colors.length];
}

// Добавление участника
function addParticipant() {
    const name = prompt("Enter participant name:", `Participant ${chatData.participants.length + 1}`);
    if (!name || name.trim() === '') return;
    
    const personality = prompt("Describe their personality:", "Friendly and conversational");
    if (!personality) return;
    
    const newParticipant = {
        name: name.trim(),
        personality: personality.trim(),
        avatar: name.trim().charAt(0).toUpperCase(),
        talkativeness: 5,
        emojiLevel: 5
    };
    
    chatData.participants.push(newParticipant);
    renderParticipants();
}

// Редактирование участника
function editParticipant(index) {
    const participant = chatData.participants[index];
    
    const name = prompt("Edit name:", participant.name);
    if (name === null) return;
    
    const personality = prompt("Edit personality:", participant.personality);
    if (personality === null) return;
    
    if (name.trim() !== '') {
        participant.name = name.trim();
        participant.avatar = name.trim().charAt(0).toUpperCase();
    }
    
    if (personality.trim() !== '') {
        participant.personality = personality.trim();
    }
    
    renderParticipants();
}

// Удаление участника
function removeParticipant(index) {
    if (chatData.participants.length <= 1) {
        alert("You need at least one participant!");
        return;
    }
    
    if (confirm(`Remove ${chatData.participants[index].name} from the chat?`)) {
        chatData.participants.splice(index, 1);
        renderParticipants();
    }
}

// Обновление значения длины
document.getElementById('chatLength').addEventListener('input', function() {
    document.getElementById('lengthValue').textContent = this.value;
});

// Генерация чата
async function generateChat() {
    // Проверяем участников
    if (chatData.participants.length < 1) {
        alert("Please add at least one participant!");
        return;
    }
    
    const topic = document.getElementById('chatTopic').value.trim();
    if (!topic) {
        alert("Please enter a chat topic!");
        return;
    }
    
    // Сохраняем метаданные
    chatData.metadata = {
        name: document.getElementById('chatName').value.trim() || "Group Chat",
        theme: document.getElementById('chatTheme').value,
        topic: topic,
        settings: {
            length: parseInt(document.getElementById('chatLength').value),
            speed: parseInt(document.getElementById('responseSpeed').value),
            emoji: parseInt(document.getElementById('emojiUsage').value),
            includeTyping: document.getElementById('includeTyping').checked,
            includeRead: document.getElementById('includeRead').checked,
            includeTime: document.getElementById('includeTime').checked,
            includeReactions: document.getElementById('includeReactions').checked
        }
    };
    
    chatData.currentTopic = topic;
    chatData.messages = [];
    
    // Переключаемся на страницу чата
    document.getElementById('setupPage').style.display = 'none';
    document.getElementById('chatPage').style.display = 'block';
    
    // Обновляем информацию чата
    updateChatInfo();
    
    // Показываем индикатор
    showIndicator("Generating chat...");
    
    // Генерируем чат
    await generateChatMessages(chatData.metadata.settings.length);
    
    // Скрываем индикатор
    hideIndicator();
}

// Обновление информации чата
function updateChatInfo() {
    document.getElementById('chatTitle').textContent = chatData.metadata.name;
    document.getElementById('participantCount').textContent = `${chatData.participants.length} participants`;
    document.getElementById('currentTopic').textContent = chatData.currentTopic;
    
    // Обновляем панель участников
    const participantsBar = document.getElementById('participantsBar');
    participantsBar.innerHTML = '';
    
    chatData.participants.forEach((participant, index) => {
        const badge = document.createElement('div');
        badge.className = 'participant-badge';
        badge.innerHTML = `
            <div class="participant-badge-avatar" style="background: linear-gradient(135deg, ${getAvatarColor(index)});">
                ${participant.avatar}
            </div>
            <span class="participant-badge-name">${participant.name}</span>
        `;
        participantsBar.appendChild(badge);
    });
    
    // Обновляем статистику
    updateStats();
}

// Генерация сообщений
async function generateChatMessages(count) {
    const messagesContainer = document.getElementById('messagesContainer');
    const emptyChat = document.getElementById('emptyChat');
    
    if (emptyChat) {
        emptyChat.style.display = 'none';
    }
    
    // Очищаем сообщения
    messagesContainer.innerHTML = '';
    chatData.messages = [];
    
    // Генерируем промпт для ИИ
    const prompt = createChatPrompt(count);
    
    try {
        // Показываем индикатор типинга для первого участника
        if (chatData.metadata.settings.includeTyping) {
            addTypingIndicator(chatData.participants[0]);
        }
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        // Убираем индикатор типинга
        if (chatData.metadata.settings.includeTyping) {
            removeTypingIndicator();
        }
        
        const data = await response.json();
        const aiResponse = data?.choices?.[0]?.message?.content || "";
        
        // Парсим ответ ИИ
        parseChatResponse(aiResponse);
        
        // Добавляем временные метки
        addTimestamps();
        
        // Добавляем реакции если нужно
        if (chatData.metadata.settings.includeReactions) {
            addRandomReactions();
        }
        
        // Добавляем read receipts если нужно
        if (chatData.metadata.settings.includeRead) {
            addReadReceipts();
        }
        
        // Прокручиваем вниз
        scrollToBottom();
        
    } catch (error) {
        console.error("Error generating chat:", error);
        hideIndicator();
        
        // Fallback: создаем простой чат
        createFallbackChat(count);
    }
}

// Создание промпта для чата
function createChatPrompt(messageCount) {
    const participantsText = chatData.participants.map((p, i) => 
        `${p.name}: ${p.personality}. Talkativeness: ${p.talkativeness}/10, Emoji usage: ${p.emojiLevel}/10`
    ).join('\n');
    
    const emojiLevel = chatData.metadata.settings.emoji;
    const emojiInstruction = emojiLevel < 3 ? "Use no emojis." : 
                           emojiLevel < 7 ? "Use emojis occasionally." : 
                           "Use emojis frequently.";
    
    return `Generate a ${messageCount}-message chat conversation.

Participants:
${participantsText}

Chat Theme: ${chatData.metadata.theme}
Topic: ${chatData.currentTopic}

Instructions:
- Write in natural messaging style with short messages
- ${emojiInstruction}
- Each message should show who is speaking
- Include natural pauses and overlaps
- Show character personalities through their messages
- End naturally

Format each message like this:
[Name]: Message text

Example:
[Alex]: Hey everyone! So about Sarah's party...
[Jordan]: I still think we should keep it small
[Taylor]: But she'll be 30! That's a big milestone!
[Morgan]: Can we at least agree on a budget first?

Now generate the chat:`;
}

// Парсинг ответа ИИ
function parseChatResponse(response) {
    const lines = response.split('\n').filter(line => line.trim() !== '');
    const messagesContainer = document.getElementById('messagesContainer');
    
    lines.forEach(line => {
        // Ищем паттерн [Name]: message
        const match = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
        if (match) {
            const name = match[1].trim();
            const text = match[2].trim();
            
            // Находим участника
            const participant = chatData.participants.find(p => 
                p.name.toLowerCase() === name.toLowerCase() ||
                p.name.split(' ')[0].toLowerCase() === name.toLowerCase()
            );
            
            if (participant) {
                addMessageToChat(participant, text, false);
            } else {
                // Если участник не найден, используем первого
                addMessageToChat(chatData.participants[0], text, false);
            }
        }
    });
    
    // Если сообщений мало, добавляем больше
    if (chatData.messages.length < 5) {
        setTimeout(() => generateMore(10), 500);
    }
}

// Добавление сообщения в чат
function addMessageToChat(participant, text, isUserAdded = false) {
    const messageId = Date.now() + Math.random();
    const timestamp = new Date();
    
    const message = {
        id: messageId,
        participant: participant,
        text: text,
        timestamp: timestamp,
        reactions: [],
        readBy: [],
        isUserAdded: isUserAdded
    };
    
    chatData.messages.push(message);
    displayMessage(message);
    
    // Обновляем статистику
    updateStats();
    
    return message;
}

// Отображение сообщения
function displayMessage(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Определяем порядок (входящее/исходящее)
    const isOutgoing = Math.random() > 0.5; // Для разнообразия
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
    messageElement.id = `msg-${message.id}`;
    
    // Генерируем аватар
    const participantIndex = chatData.participants.findIndex(p => p.name === message.participant.name);
    const avatarColor = getAvatarColor(participantIndex);
    
    // Форматируем время
    const timeStr = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="message-avatar" style="background: linear-gradient(135deg, ${avatarColor});">
            ${message.participant.avatar}
        </div>
        <div class="message-content">
            <div class="message-text">${formatMessageText(message.text)}</div>
            <div class="message-time">${timeStr}</div>
            ${message.reactions.length > 0 ? `
                <div class="message-reactions">
                    ${message.reactions.map(r => `
                        <div class="reaction">${r.emoji} ${r.count}</div>
                    `).join('')}
                </div>
            ` : ''}
            ${message.readBy.length > 0 ? `
                <div class="read-receipt">
                    <span>✓✓</span>
                    <span>Read by ${message.readBy.length}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    
    // Прокручиваем к новому сообщению
    setTimeout(() => {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
}

// Форматирование текста сообщения
function formatMessageText(text) {
    // Заменяем **bold** на <strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Заменяем *italic* на <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Добавляем переносы строк
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Добавление индикатора типинга
function addTypingIndicator(participant) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const typingElement = document.createElement('div');
    typingElement.className = 'typing-indicator';
    typingElement.id = 'typing-indicator';
    
    const participantIndex = chatData.participants.findIndex(p => p.name === participant.name);
    const avatarColor = getAvatarColor(participantIndex);
    
    typingElement.innerHTML = `
        <div class="message-avatar" style="background: linear-gradient(135deg, ${avatarColor});">
            ${participant.avatar}
        </div>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    messagesContainer.appendChild(typingElement);
    scrollToBottom();
}

// Удаление индикатора типинга
function removeTypingIndicator() {
    const typingElement = document.getElementById('typing-indicator');
    if (typingElement) {
        typingElement.remove();
    }
}

// Добавление временных меток
function addTimestamps() {
    if (!chatData.metadata.settings.includeTime) return;
    
    // Сортируем сообщения по времени
    chatData.messages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Добавляем временные метки каждые 10 сообщений
    for (let i = 0; i < chatData.messages.length; i += 10) {
        const message = chatData.messages[i];
        const timeStr = message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        // Можно добавить временные метки как отдельные элементы
        // Для простоты пока пропускаем
    }
}

// Добавление случайных реакций
function addRandomReactions() {
    if (!chatData.metadata.settings.includeReactions) return;
    
    const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
    
    // Добавляем реакции к случайным сообщениям
    const messageCount = Math.min(5, Math.floor(chatData.messages.length / 3));
    
    for (let i = 0; i < messageCount; i++) {
        const randomIndex = Math.floor(Math.random() * chatData.messages.length);
        const message = chatData.messages[randomIndex];
        
        // Не добавляем реакции к своим сообщениям
        if (message.participant.name === chatData.participants[0].name) continue;
        
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        const existingReaction = message.reactions.find(r => r.emoji === randomReaction);
        
        if (existingReaction) {
            existingReaction.count++;
        } else {
            message.reactions.push({
                emoji: randomReaction,
                count: 1
            });
        }
        
        // Обновляем отображение сообщения
        updateMessageDisplay(message);
    }
}

// Добавление read receipts
function addReadReceipts() {
    if (!chatData.metadata.settings.includeRead) return;
    
    // Последние несколько сообщений отмечаем как прочитанные
    const recentMessages = chatData.messages.slice(-3);
    
    recentMessages.forEach(message => {
        // Случайные участники прочитали сообщение
        const readers = chatData.participants
            .filter(p => p.name !== message.participant.name)
            .filter(() => Math.random() > 0.5)
            .map(p => p.name);
        
        message.readBy = readers;
        updateMessageDisplay(message);
    });
}

// Обновление отображения сообщения
function updateMessageDisplay(message) {
    const messageElement = document.getElementById(`msg-${message.id}`);
    if (!messageElement) return;
    
    // Обновляем реакции
    const reactionsContainer = messageElement.querySelector('.message-reactions');
    if (reactionsContainer) {
        if (message.reactions.length > 0) {
            reactionsContainer.innerHTML = message.reactions.map(r => 
                `<div class="reaction">${r.emoji} ${r.count}</div>`
            ).join('');
        } else {
            reactionsContainer.remove();
        }
    }
    
    // Обновляем read receipts
    const readReceipt = messageElement.querySelector('.read-receipt');
    if (readReceipt) {
        if (message.readBy.length > 0) {
            readReceipt.innerHTML = `
                <span>✓✓</span>
                <span>Read by ${message.readBy.length}</span>
            `;
        } else {
            readReceipt.remove();
        }
    }
}

// Fallback чат
function createFallbackChat(count) {
    const topics = [
        "I think we should go with option A",
        "But option B is cheaper and just as good",
        "Has anyone considered option C?",
        "Let's vote on it",
        "I'm fine with whatever everyone decides",
        "We need to make a decision soon",
        "Can we schedule another meeting?",
        "I'll send a calendar invite",
        "Thanks everyone!",
        "Talk to you all later 👋"
    ];
    
    for (let i = 0; i < Math.min(count, topics.length); i++) {
        const participant = chatData.participants[i % chatData.participants.length];
        addMessageToChat(participant, topics[i], false);
    }
}

// Прокрутка вниз
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Обновление статистики
function updateStats() {
    document.getElementById('statMessages').textContent = chatData.messages.length;
    document.getElementById('statParticipants').textContent = chatData.participants.length;
    
    const wordCount = chatData.messages.reduce((total, msg) => 
        total + (msg.text || '').split(/\s+/).length, 0);
    document.getElementById('statWords').textContent = wordCount;
    
    // Вычисляем длительность
    if (chatData.messages.length > 1) {
        const first = chatData.messages[0].timestamp;
        const last = chatData.messages[chatData.messages.length - 1].timestamp;
        const duration = Math.floor((last - first) / (1000 * 60)); // в минутах
        document.getElementById('statTime').textContent = `${duration}:00`;
    }
}

// Индикатор
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

// Добавление сообщения пользователем
function addMessage() {
    if (chatData.participants.length === 0) {
        alert("No participants in chat!");
        return;
    }
    
    const text = prompt("Enter message text:");
    if (!text || text.trim() === '') return;
    
    // Выбираем случайного участника
    const randomIndex = Math.floor(Math.random() * chatData.participants.length);
    const participant = chatData.participants[randomIndex];
    
    addMessageToChat(participant, text, true);
    scrollToBottom();
}

// Регенерация последних сообщений
async function regenerateLast() {
    if (chatData.messages.length === 0) return;
    
    // Удаляем последние 3 сообщения
    const removed = chatData.messages.splice(-3);
    removed.forEach(msg => {
        const element = document.getElementById(`msg-${msg.id}`);
        if (element) element.remove();
    });
    
    showIndicator("Regenerating last messages...");
    
    // Генерируем новые
    await generateChatMessages(3);
    
    hideIndicator();
}

// Продолжение чата
async function continueChat() {
    const count = parseInt(prompt("How many more messages?", "5"));
    if (!count || count < 1) return;
    
    showIndicator(`Generating ${count} more messages...`);
    
    // Создаем промпт для продолжения
    const lastMessages = chatData.messages.slice(-5).map(msg => 
        `[${msg.participant.name}]: ${msg.text}`
    ).join('\n');
    
    const prompt = `Continue this chat conversation:

Recent messages:
${lastMessages}

Participants: ${chatData.participants.map(p => p.name).join(', ')}
Topic: ${chatData.currentTopic}

Generate ${count} more messages continuing naturally from where it left off.`;

    try {
        if (chatData.metadata.settings.includeTyping) {
            const randomParticipant = chatData.participants[Math.floor(Math.random() * chatData.participants.length)];
            addTypingIndicator(randomParticipant);
        }
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        if (chatData.metadata.settings.includeTyping) {
            removeTypingIndicator();
        }
        
        const data = await response.json();
        const aiResponse = data?.choices?.[0]?.message?.content || "";
        
        parseChatResponse(aiResponse);
        
        hideIndicator();
        
    } catch (error) {
        console.error("Error continuing chat:", error);
        hideIndicator();
        
        // Fallback
        for (let i = 0; i < count; i++) {
            const participant = chatData.participants[i % chatData.participants.length];
            const fallbackText = `Continuing the conversation about ${chatData.currentTopic.toLowerCase()}...`;
            addMessageToChat(participant, fallbackText, false);
        }
    }
}

// Генерация больше сообщений
async function generateMore(count) {
    showIndicator(`Adding ${count} messages...`);
    await generateChatMessages(count);
    hideIndicator();
}

// Изменение темы
function changeTopic() {
    const newTopic = prompt("Enter new chat topic:", chatData.currentTopic);
    if (!newTopic || newTopic.trim() === '') return;
    
    chatData.currentTopic = newTopic.trim();
    document.getElementById('currentTopic').textContent = newTopic;
    
    // Можно сгенерировать новые сообщения на новую тему
    if (confirm("Generate new messages on this topic? (Current chat will be cleared)")) {
        clearChat();
        setTimeout(() => generateChat(), 500);
    }
}

// Очистка чата
function clearChat() {
    if (!confirm("Clear all messages? This cannot be undone.")) return;
    
    chatData.messages = [];
    document.getElementById('messagesContainer').innerHTML = `
        <div class="empty-chat" id="emptyChat">
            <div class="empty-icon">💬</div>
            <h3>Chat is empty</h3>
            <p>Click "Generate Chat" to start the conversation</p>
        </div>
    `;
    updateStats();
}

// Открытие настроек
function openSettings() {
    document.getElementById('chatSidebar').classList.add('active');
}

function closeSidebar() {
    document.getElementById('chatSidebar').classList.remove('active');
}

// Обновление темы
function updateTopic() {
    const newTopic = document.getElementById('editTopic').value.trim();
    if (newTopic) {
        chatData.currentTopic = newTopic;
        document.getElementById('currentTopic').textContent = newTopic;
        document.getElementById('editTopic').value = '';
        showIndicator("Topic updated");
        setTimeout(hideIndicator, 1000);
    }
}

// Добавление нового участника
function addNewParticipant() {
    const name = document.getElementById('newParticipantName').value.trim();
    const personality = document.getElementById('newParticipantPersonality').value.trim();
    
    if (!name) {
        alert("Please enter a name!");
        return;
    }
    
    const newParticipant = {
        name: name,
        personality: personality || "New participant",
        avatar: name.charAt(0).toUpperCase(),
        talkativeness: 5,
        emojiLevel: 5
    };
    
    chatData.participants.push(newParticipant);
    
    // Обновляем UI
    updateChatInfo();
    document.getElementById('newParticipantName').value = '';
    document.getElementById('newParticipantPersonality').value = '';
    
    showIndicator(`${name} added to chat`);
    setTimeout(hideIndicator, 1000);
}

// Быстрые действия
async function addConflict() {
    const conflictMessage = "I can't believe you did that! We need to talk about this now.";
    const randomParticipant = chatData.participants[Math.floor(Math.random() * chatData.participants.length)];
    addMessageToChat(randomParticipant, conflictMessage, false);
    showIndicator("Conflict added");
    setTimeout(hideIndicator, 1000);
}

function addJoke() {
    const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        "What do you call a factory that makes okay products? A satisfactory.",
        "Why did the scarecrow win an award? He was outstanding in his field!"
    ];
    
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    const randomParticipant = chatData.participants[Math.floor(Math.random() * chatData.participants.length)];
    addMessageToChat(randomParticipant, randomJoke + " 😂", false);
    showIndicator("Joke added");
    setTimeout(hideIndicator, 1000);
}

function addSecret() {
    const secrets = [
        "I have something to confess... I've never actually seen that movie everyone's talking about.",
        "Can you keep a secret? I'm actually terrified of butterflies.",
        "Don't tell anyone, but I'm the one who ate the last piece of cake.",
        "I need to tell you something important... I'm moving to another city next month."
    ];
    
    const randomSecret = secrets[Math.floor(Math.random() * secrets.length)];
    const randomParticipant = chatData.participants[Math.floor(Math.random() * chatData.participants.length)];
    addMessageToChat(randomParticipant, randomSecret + " 🤫", false);
    showIndicator("Secret revealed");
    setTimeout(hideIndicator, 1000);
}

function endChat() {
    const endings = [
        "Well, I need to get going. Talk to you all later!",
        "This has been a great conversation, but I have to run.",
        "I think we've covered everything. Until next time!",
        "Gotta go, my battery is about to die. Bye everyone! 👋"
    ];
    
    const randomEnding = endings[Math.floor(Math.random() * endings.length)];
    const randomParticipant = chatData.participants[Math.floor(Math.random() * chatData.participants.length)];
    addMessageToChat(randomParticipant, randomEnding, false);
    showIndicator("Chat ended");
    setTimeout(hideIndicator, 1000);
}

// Экспорт чата
function exportChat() {
    document.getElementById('exportModal').classList.add('active');
    updateExportPreview();
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('active');
}

function selectFormat(format) {
    selectedExportFormat = format;
    
    // Обновляем активный формат
    document.querySelectorAll('.format-option').forEach(option => {
        option.classList.toggle('active', option.dataset.format === format);
    });
    
    updateExportPreview();
}

function updateExportPreview() {
    const preview = document.getElementById('exportPreview');
    
    if (chatData.messages.length === 0) {
        preview.textContent = "No messages to export";
        return;
    }
    
    let previewText = '';
    
    switch(selectedExportFormat) {
        case 'txt':
            previewText = generateTXTPreview();
            break;
        case 'html':
            previewText = generateHTMLPreview();
            break;
        case 'json':
            previewText = generateJSONPreview();
            break;
        case 'image':
            previewText = "Image preview not available. Will generate screenshot on export.";
            break;
    }
    
    preview.textContent = previewText.substring(0, 500) + (previewText.length > 500 ? '...' : '');
}

function generateTXTPreview() {
    let txt = `Chat: ${chatData.metadata.name}\n`;
    txt += `Topic: ${chatData.currentTopic}\n`;
    txt += `Participants: ${chatData.participants.map(p => p.name).join(', ')}\n`;
    txt += `Generated: ${new Date().toLocaleString()}\n`;
    txt += '='.repeat(50) + '\n\n';
    
    chatData.messages.forEach(msg => {
        const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        txt += `[${time}] ${msg.participant.name}: ${msg.text}\n`;
    });
    
    return txt;
}

function generateHTMLPreview() {
    return `HTML preview would show formatted chat with colors and avatars`;
}

function generateJSONPreview() {
    const exportData = {
        metadata: chatData.metadata,
        participants: chatData.participants,
        messages: chatData.messages.map(msg => ({
            participant: msg.participant.name,
            text: msg.text,
            timestamp: msg.timestamp.toISOString(),
            reactions: msg.reactions
        })),
        generatedAt: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
}

function doExport() {
    switch(selectedExportFormat) {
        case 'txt':
            exportAsTXT();
            break;
        case 'html':
            exportAsHTML();
            break;
        case 'json':
            exportAsJSON();
            break;
        case 'image':
            exportAsImage();
            break;
    }
    
    closeExportModal();
}

// Экспорт в TXT
function exportAsTXT() {
    const txtContent = generateTXTPreview();
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatData.metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chat.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showIndicator("Exported as TXT");
    setTimeout(hideIndicator, 1000);
}

// Экспорт в HTML
function exportAsHTML() {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chatData.metadata.name} - Chat Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .chat-header {
            background: white;
            padding: 20px;
            border-radius: 16px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .chat-title {
            font-size: 24px;
            font-weight: 700;
            color: #000;
            margin-bottom: 5px;
        }
        .chat-info {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .message {
            background: white;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 10px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .message-sender {
            font-weight: 600;
            color: #000;
        }
        .message-time {
            color: #666;
            font-size: 12px;
        }
        .message-text {
            line-height: 1.5;
        }
        .export-footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
        }
    </style>
</head>
<body>
    <div class="chat-header">
        <h1 class="chat-title">${chatData.metadata.name}</h1>
        <div class="chat-info">
            <div>Topic: ${chatData.currentTopic}</div>
            <div>Participants: ${chatData.participants.map(p => p.name).join(', ')}</div>
            <div>Messages: ${chatData.messages.length}</div>
            <div>Exported: ${new Date().toLocaleString()}</div>
        </div>
    </div>
    
    <div class="messages">`;
    
    chatData.messages.forEach(msg => {
        const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        html += `
        <div class="message">
            <div class="message-header">
                <span class="message-sender">${msg.participant.name}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${msg.text.replace(/\n/g, '<br>')}</div>
        </div>`;
    });
    
    html += `
    </div>
    
    <div class="export-footer">
        Generated with BAHR LAB AI Chat Generator
    </div>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatData.metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chat.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showIndicator("Exported as HTML");
    setTimeout(hideIndicator, 1000);
}

// Экспорт в JSON
function exportAsJSON() {
    const jsonData = {
        metadata: chatData.metadata,
        participants: chatData.participants,
        messages: chatData.messages.map(msg => ({
            participant: msg.participant.name,
            text: msg.text,
            timestamp: msg.timestamp.toISOString(),
            reactions: msg.reactions
        })),
        generatedAt: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatData.metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chat.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showIndicator("Exported as JSON");
    setTimeout(hideIndicator, 1000);
}

// Экспорт как изображение (имитация)
function exportAsImage() {
    showIndicator("Taking screenshot...");
    
    // В реальности это потребовало бы библиотеки для создания скриншотов
    // Для демо просто экспортируем как HTML
    setTimeout(() => {
        exportAsHTML();
        hideIndicator();
    }, 1500);
}

// Копирование чата
function copyChat() {
    const txtContent = generateTXTPreview();
    
    navigator.clipboard.writeText(txtContent).then(() => {
        showIndicator("Chat copied to clipboard!");
        setTimeout(hideIndicator, 1000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showIndicator("Failed to copy");
        setTimeout(hideIndicator, 1000);
    });
}

// Шаринг чата
function shareChat() {
    if (navigator.share) {
        navigator.share({
            title: chatData.metadata.name,
            text: `Check out this AI-generated chat about: ${chatData.currentTopic}`,
            url: window.location.href
        });
    } else {
        copyChat();
    }
}

// Инициализация
window.onload = function() {
    // Добавляем двух участников по умолчанию
    addDefaultParticipants();
    
    // Обновляем значение длины
    document.getElementById('lengthValue').textContent = document.getElementById('chatLength').value;
    
    // Обработчик изменения длины
    document.getElementById('chatLength').addEventListener('input', function() {
        document.getElementById('lengthValue').textContent = this.value;
    });
    
    // Проверяем URL параметры
    const urlParams = new URLSearchParams(window.location.search);
    const load = urlParams.get('load');
    
    if (load === 'example') {
        setTimeout(loadExample, 500);
    }
};
