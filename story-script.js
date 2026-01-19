// story-script.js - Полный рабочий код редактора сюжетов
const API_URL = "https://freeai.logise1123.workers.dev/";

let storyState = {
    nodes: {},
    connections: [],
    selectedNodeId: null,
    nextNodeId: 1,
    settings: {
        globalStyle: 'realistic',
        maxBranches: 3,
        aiCreativity: 7,
        showConnections: true,
        colorByType: true,
        autoArrange: false
    },
    viewport: {
        x: 0,
        y: 0,
        scale: 1
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Навигация
    document.getElementById('homeLogo').addEventListener('click', goHome);
    
    // Главная страница
    document.getElementById('startStoryBtn').addEventListener('click', startNewStory);
    document.getElementById('storyPrompt').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') startNewStory();
    });
    
    // Примеры быстрого старта
    document.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('click', function() {
            const prompt = this.dataset.prompt;
            document.getElementById('storyPrompt').value = prompt;
            startNewStory();
        });
    });
    
    // Кнопки редактора
    document.getElementById('addNodeBtn').addEventListener('click', addManualNode);
    document.getElementById('aiExpandBtn').addEventListener('click', aiExpandSelected);
    document.getElementById('randomWalkBtn').addEventListener('click', showRandomWalkModal);
    document.getElementById('settingsBtn').addEventListener('click', showSettingsModal);
    document.getElementById('exportBtn').addEventListener('click', showExportModal);
    document.getElementById('saveBtn').addEventListener('click', saveStory);
    
    // Детали узла
    document.getElementById('closeDetailsBtn').addEventListener('click', closeNodeDetails);
    document.getElementById('generateBranchesBtn').addEventListener('click', generateBranchesForNode);
    document.getElementById('addBranchBtn').addEventListener('click', addManualBranch);
    document.getElementById('deleteNodeBtn').addEventListener('click', deleteSelectedNode);
    document.getElementById('nodeText').addEventListener('input', updateNodeText);
    document.getElementById('branchStyle').addEventListener('change', updateNodeStyle);
    document.getElementById('consequenceType').addEventListener('change', updateNodeConsequence);
    
    // Настройки
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);
    document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettingsModal);
    document.getElementById('applySettingsBtn').addEventListener('click', applySettings);
    document.getElementById('maxBranches').addEventListener('input', function() {
        document.getElementById('branchesValue').textContent = this.value;
    });
    document.getElementById('aiCreativity').addEventListener('input', function() {
        updateCreativityLabels(this.value);
    });
    document.getElementById('exportJsonBtn').addEventListener('click', exportStoryJson);
    document.getElementById('importJsonBtn').addEventListener('click', importStoryJson);
    document.getElementById('clearStoryBtn').addEventListener('click', clearStory);
    
    // Экспорт
    document.getElementById('closeExportBtn').addEventListener('click', closeExportModal);
    document.getElementById('cancelExportBtn').addEventListener('click', closeExportModal);
    document.getElementById('doExportBtn').addEventListener('click', performExport);
    document.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', function() {
            selectExportFormat(this.dataset.format);
        });
    });
    
    // Случайное прохождение
    document.getElementById('closeWalkBtn').addEventListener('click', closeWalkModal);
    document.getElementById('cancelWalkBtn').addEventListener('click', closeWalkModal);
    document.getElementById('generateWalkBtn').addEventListener('click', generateRandomWalk);
    document.getElementById('exportWalkBtn').addEventListener('click', exportRandomWalk);
    document.getElementById('walkSteps').addEventListener('input', function() {
        document.getElementById('stepsValue').textContent = this.value;
    });
    
    // Нажатие на область истории закрывает детали
    document.getElementById('storyArea').addEventListener('click', function(e) {
        if (e.target === this || e.target.classList.contains('timeline-container')) {
            storyState.selectedNodeId = null;
            closeNodeDetails();
            renderStory();
        }
    });
    
    // Инициализация значений
    updateCreativityLabels(7);
    
    // Загрузка сохраненных историй
    loadRecentStories();
    
    console.log("Story Editor initialized!");
}

// Вспомогательные функции
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Навигация
function goHome() {
    if (Object.keys(storyState.nodes).length > 0) {
        if (confirm("You have unsaved changes. Leave anyway?")) {
            window.location.href = "https://bahrlab.github.io";
        }
    } else {
        window.location.href = "https://bahrlab.github.io";
    }
}

// Загрузка недавних историй
function loadRecentStories() {
    const recent = localStorage.getItem('recentStories');
    if (recent) {
        try {
            const stories = JSON.parse(recent);
            if (stories.length > 0) {
                document.getElementById('recentStories').style.display = 'block';
                const list = document.getElementById('recentList');
                
                stories.slice(0, 3).forEach(story => {
                    const item = document.createElement('div');
                    item.className = 'story-card';
                    item.innerHTML = `
                        <div class="story-icon">📖</div>
                        <div class="story-info">
                            <div class="story-title">${story.title || 'Untitled'}</div>
                            <div class="story-desc">${story.nodes} nodes, created ${story.date}</div>
                        </div>
                    `;
                    item.addEventListener('click', () => loadStory(story.id));
                    list.appendChild(item);
                });
            }
        } catch (e) {
            console.error("Error loading recent stories:", e);
        }
    }
}

// Начало новой истории
function startNewStory() {
    const prompt = document.getElementById('storyPrompt').value.trim();
    if (!prompt) {
        alert("Please enter a starting point for your story!");
        return;
    }
    
    // Очищаем предыдущую историю
    storyState.nodes = {};
    storyState.connections = [];
    storyState.nextNodeId = 1;
    storyState.selectedNodeId = null;
    
    // Создаем начальный узел
    const startNode = createNode({
        id: 1,
        text: prompt,
        x: 400,
        y: 300,
        type: 'start',
        consequence: 'neutral',
        style: storyState.settings.globalStyle
    });
    
    storyState.nodes[1] = startNode;
    storyState.selectedNodeId = 1;
    
    // Переходим в редактор
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('editorPage').style.display = 'block';
    
    // Обновляем заголовок
    document.getElementById('storyTitle').textContent = truncateText(prompt, 30);
    
    // Рендерим историю
    renderStory();
    updateStats();
    showNodeDetails(1);
    
    // Сохраняем в недавние
    saveToRecent(prompt);
}

function saveToRecent(prompt) {
    const recent = JSON.parse(localStorage.getItem('recentStories') || '[]');
    const story = {
        id: Date.now(),
        title: truncateText(prompt, 20),
        nodes: 1,
        date: new Date().toLocaleDateString(),
        data: JSON.parse(JSON.stringify(storyState)) // Копируем данные
    };
    
    // Добавляем в начало и ограничиваем 5
    recent.unshift(story);
    if (recent.length > 5) recent.pop();
    
    localStorage.setItem('recentStories', JSON.stringify(recent));
}

function loadStory(storyId) {
    const recent = JSON.parse(localStorage.getItem('recentStories') || '[]');
    const story = recent.find(s => s.id === storyId);
    
    if (story && story.data) {
        if (confirm("Load this story? Current story will be lost.")) {
            // Восстанавливаем состояние
            storyState = JSON.parse(JSON.stringify(story.data));
            
            // Переходим в редактор
            document.getElementById('mainPage').style.display = 'none';
            document.getElementById('editorPage').style.display = 'block';
            
            // Обновляем заголовок
            document.getElementById('storyTitle').textContent = story.title || 'Loaded Story';
            
            // Рендерим историю
            renderStory();
            updateStats();
            
            if (Object.keys(storyState.nodes).length > 0) {
                storyState.selectedNodeId = Object.keys(storyState.nodes)[0];
                showNodeDetails(storyState.selectedNodeId);
            }
        }
    } else {
        alert("Story not found or corrupted");
    }
}

// Создание узла
function createNode(data) {
    const node = {
        id: data.id,
        text: data.text,
        x: data.x || 0,
        y: data.y || 0,
        type: data.type || 'event',
        consequence: data.consequence || 'neutral',
        style: data.style || storyState.settings.globalStyle,
        branches: data.branches || []
    };
    
    storyState.nextNodeId = Math.max(storyState.nextNodeId, data.id + 1);
    return node;
}

// Рендеринг истории
function renderStory() {
    const container = document.getElementById('timelineContainer');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если нет узлов, показываем пустое состояние
    if (Object.keys(storyState.nodes).length === 0) {
        document.getElementById('emptyTimeline').style.display = 'block';
        return;
    }
    
    document.getElementById('emptyTimeline').style.display = 'none';
    
    // Рендерим соединения
    if (storyState.settings.showConnections) {
        renderConnections(container);
    }
    
    // Рендерим узлы
    Object.values(storyState.nodes).forEach(node => {
        renderNode(container, node);
    });
    
    // Авто-расположение если включено
    if (storyState.settings.autoArrange) {
        autoArrangeNodes();
    }
}

function renderNode(container, node) {
    const nodeElement = document.createElement('div');
    nodeElement.className = `story-node ${node.type}-node`;
    if (storyState.selectedNodeId === node.id) {
        nodeElement.classList.add('selected');
    }
    
    // Определяем цвет типа
    let typeClass = 'neutral';
    if (storyState.settings.colorByType) {
        typeClass = node.consequence;
    }
    
    nodeElement.innerHTML = `
        <div class="node-header">
            <span class="node-id">#${node.id}</span>
            <span class="node-type ${typeClass}">${node.consequence}</span>
        </div>
        <div class="node-content">${truncateText(node.text, 100)}</div>
        <div class="node-footer">
            <div class="branch-count">
                <span>${node.branches.length} branches</span>
            </div>
            <button class="add-branch-btn" data-node="${node.id}">+</button>
        </div>
    `;
    
    // Позиционирование
    nodeElement.style.left = `${node.x}px`;
    nodeElement.style.top = `${node.y}px`;
    
    // Обработчики событий
    nodeElement.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNode(node.id);
    });
    
    // Кнопка добавления ветки
    const addBtn = nodeElement.querySelector('.add-branch-btn');
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        storyState.selectedNodeId = node.id;
        addManualBranch();
    });
    
    // Перетаскивание
    makeDraggable(nodeElement, node);
    
    container.appendChild(nodeElement);
}

function makeDraggable(element, node) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDragTouch, { passive: false });
    
    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = node.x;
        initialY = node.y;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function startDragTouch(e) {
        if (e.touches.length !== 1) return;
        e.preventDefault();
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        initialX = node.x;
        initialY = node.y;
        
        document.addEventListener('touchmove', dragTouch, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }
    
    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        node.x = initialX + dx;
        node.y = initialY + dy;
        
        element.style.left = `${node.x}px`;
        element.style.top = `${node.y}px`;
        
        // Обновляем соединения
        if (storyState.settings.showConnections) {
            renderConnections(document.getElementById('timelineContainer'));
        }
    }
    
    function dragTouch(e) {
        if (!isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        
        node.x = initialX + dx;
        node.y = initialY + dy;
        
        element.style.left = `${node.x}px`;
        element.style.top = `${node.y}px`;
        
        if (storyState.settings.showConnections) {
            renderConnections(document.getElementById('timelineContainer'));
        }
    }
    
    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', dragTouch);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
    }
}

function renderConnections(container) {
    // Удаляем старые соединения
    const oldConnections = container.querySelectorAll('.connection');
    oldConnections.forEach(conn => conn.remove());
    
    storyState.connections.forEach(conn => {
        const fromNode = storyState.nodes[conn.from];
        const toNode = storyState.nodes[conn.to];
        
        if (!fromNode || !toNode) return;
        
        // Создаем SVG для соединения
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connection');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
        
        // Рассчитываем позиции
        const x1 = fromNode.x + 100; // центр узла
        const y1 = fromNode.y + 60;
        const x2 = toNode.x + 100;
        const y2 = toNode.y + 60;
        
        // Рисуем кривую Безье
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlOffset = 50;
        const d = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
        path.setAttribute('d', d);
        path.classList.add('line', conn.type);
        path.setAttribute('stroke', getConnectionColor(conn.type));
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        
        // Добавляем стрелку
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', `arrow-${conn.from}-${conn.to}`);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowPath.setAttribute('d', 'M0,0 L0,6 L9,3 z');
        arrowPath.setAttribute('fill', getConnectionColor(conn.type));
        
        marker.appendChild(arrowPath);
        svg.appendChild(marker);
        
        // Применяем маркер к линии
        path.setAttribute('marker-end', `url(#arrow-${conn.from}-${conn.to})`);
        svg.appendChild(path);
        
        container.appendChild(svg);
    });
}

function getConnectionColor(type) {
    const colors = {
        'positive': '#4CAF50',
        'negative': '#f44336',
        'neutral': '#607d8b',
        'extreme': '#9c27b0'
    };
    return colors[type] || '#607d8b';
}

// Выбор узла
function selectNode(nodeId) {
    storyState.selectedNodeId = nodeId;
    renderStory();
    showNodeDetails(nodeId);
}

function showNodeDetails(nodeId) {
    const node = storyState.nodes[nodeId];
    if (!node) return;
    
    const details = document.getElementById('nodeDetails');
    details.classList.add('active');
    
    // Заполняем данные
    document.getElementById('nodeText').value = node.text;
    document.getElementById('branchStyle').value = node.style;
    document.getElementById('consequenceType').value = node.consequence;
    
    // Обновляем список веток
    updateBranchesList(node);
}

function closeNodeDetails() {
    document.getElementById('nodeDetails').classList.remove('active');
}

function updateNodeText() {
    const nodeId = storyState.selectedNodeId;
    if (!nodeId) return;
    
    const text = document.getElementById('nodeText').value.trim();
    if (text) {
        storyState.nodes[nodeId].text = text;
        renderStory();
    }
}

function updateNodeStyle() {
    const nodeId = storyState.selectedNodeId;
    if (!nodeId) return;
    
    const style = document.getElementById('branchStyle').value;
    storyState.nodes[nodeId].style = style;
}

function updateNodeConsequence() {
    const nodeId = storyState.selectedNodeId;
    if (!nodeId) return;
    
    const consequence = document.getElementById('consequenceType').value;
    storyState.nodes[nodeId].consequence = consequence;
    renderStory();
}

function updateBranchesList(node) {
    const list = document.getElementById('branchesList');
    list.innerHTML = '<h4>Branches from this node:</h4>';
    
    if (node.branches.length === 0) {
        list.innerHTML += '<p style="color: #666; font-style: italic;">No branches yet</p>';
        return;
    }
    
    node.branches.forEach(branchId => {
        const branchNode = storyState.nodes[branchId];
        if (!branchNode) return;
        
        const item = document.createElement('div');
        item.className = 'branch-item';
        item.innerHTML = `
            <div class="branch-text">${truncateText(branchNode.text, 40)}</div>
            <div class="branch-actions">
                <button class="branch-action-btn" data-branch="${branchId}" data-action="view">👁️</button>
                <button class="branch-action-btn" data-branch="${branchId}" data-action="delete">🗑️</button>
            </div>
        `;
        
        list.appendChild(item);
    });
    
    // Обработчики для кнопок веток
    document.querySelectorAll('.branch-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const branchId = parseInt(this.dataset.branch);
            const action = this.dataset.action;
            
            if (action === 'view') {
                selectNode(branchId);
            } else if (action === 'delete') {
                if (confirm("Delete this branch and all its children?")) {
                    deleteBranch(branchId);
                }
            }
        });
    });
}

// Добавление узлов
function addManualNode() {
    const text = prompt("Enter event description:");
    if (!text || !text.trim()) return;
    
    const nodeId = storyState.nextNodeId++;
    const newNode = createNode({
        id: nodeId,
        text: text.trim(),
        x: Math.random() * 500 + 200,
        y: Math.random() * 300 + 100,
        type: 'event',
        consequence: 'neutral',
        style: storyState.settings.globalStyle
    });
    
    storyState.nodes[nodeId] = newNode;
    
    // Если есть выбранный узел, создаем соединение
    if (storyState.selectedNodeId) {
        const fromNode = storyState.selectedNodeId;
        storyState.connections.push({
            from: fromNode,
            to: nodeId,
            type: 'neutral'
        });
        
        // Добавляем в ветки родительского узла
        storyState.nodes[fromNode].branches.push(nodeId);
    }
    
    selectNode(nodeId);
    renderStory();
    updateStats();
}

function addManualBranch() {
    const fromNodeId = storyState.selectedNodeId;
    if (!fromNodeId) {
        alert("Select a node first!");
        return;
    }
    
    const text = prompt("Enter what happens next:");
    if (!text || !text.trim()) return;
    
    const nodeId = storyState.nextNodeId++;
    const fromNode = storyState.nodes[fromNodeId];
    
    const newNode = createNode({
        id: nodeId,
        text: text.trim(),
        x: fromNode.x + 250,
        y: fromNode.y + (Math.random() * 100 - 50),
        type: 'event',
        consequence: document.getElementById('consequenceType').value || 'neutral',
        style: fromNode.style
    });
    
    storyState.nodes[nodeId] = newNode;
    
    // Создаем соединение
    storyState.connections.push({
        from: fromNodeId,
        to: nodeId,
        type: newNode.consequence
    });
    
    // Добавляем в ветки родительского узла
    fromNode.branches.push(nodeId);
    
    selectNode(nodeId);
    renderStory();
    updateStats();
}

// Генерация веток AI
async function generateBranchesForNode() {
    const nodeId = storyState.selectedNodeId;
    if (!nodeId) {
        alert("Select a node first!");
        return;
    }
    
    const node = storyState.nodes[nodeId];
    const maxBranches = parseInt(document.getElementById('maxBranches').value);
    
    // Показываем индикатор загрузки
    showAILoading(true);
    
    try {
        const branches = await generateAIBranches(node, maxBranches);
        
        // Создаем новые узлы
        branches.forEach((branchText, index) => {
            const branchId = storyState.nextNodeId++;
            
            const newNode = createNode({
                id: branchId,
                text: branchText,
                x: node.x + 250,
                y: node.y + (index * 100 - (maxBranches * 50)),
                type: 'event',
                consequence: getRandomConsequence(),
                style: node.style
            });
            
            storyState.nodes[branchId] = newNode;
            
            // Создаем соединение
            storyState.connections.push({
                from: nodeId,
                to: branchId,
                type: newNode.consequence
            });
            
            // Добавляем в ветки родительского узла
            node.branches.push(branchId);
        });
        
        // Обновляем отображение
        renderStory();
        updateStats();
        updateBranchesList(node);
        
        alert(`Generated ${branches.length} new branches!`);
        
    } catch (error) {
        console.error("Error generating branches:", error);
        alert("Failed to generate branches. Please try again.");
    } finally {
        showAILoading(false);
    }
}

async function aiExpandSelected() {
    await generateBranchesForNode();
}

async function generateAIBranches(node, count) {
    const creativity = storyState.settings.aiCreativity;
    const style = node.style;
    
    const prompt = `Generate ${count} different story branches continuing from this event:
    
Current event: "${node.text}"
Style: ${style}
Creativity level: ${creativity}/10 (1=realistic, 10=crazy/imaginative)

Generate ${count} distinct possibilities for what happens next. Each should be 1-2 sentences. Format each branch on a new line. Make them varied and interesting.`;

    try {
        console.log("Sending AI request:", prompt);
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("AI response:", data);
        
        const aiResponse = data?.choices?.[0]?.message?.content || data?.message?.content || "";
        
        // Парсим ответ
        const lines = aiResponse.split('\n')
            .map(line => line.trim())
            .filter(line => line && 
                   !line.startsWith('Branch') && 
                   !line.match(/^\d+[\.\)]/) &&
                   !line.includes('Here are') &&
                   line.length > 10)
            .map(line => line.replace(/^[-•*]\s*/, '')) // Убираем маркеры списка
            .slice(0, count);
        
        // Если AI не дал достаточно вариантов, создаем fallback
        if (lines.length < count) {
            const fallbacks = [
                "Things take an unexpected turn.",
                "A new character enters the scene.",
                "The situation becomes more complicated.",
                "A surprising revelation occurs.",
                "Events escalate dramatically.",
                "An unexpected obstacle appears.",
                "A decision must be made.",
                "The stakes get higher.",
                "Something unexpected is discovered.",
                "A twist changes everything."
            ];
            
            while (lines.length < count) {
                const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
                if (!lines.includes(randomFallback)) {
                    lines.push(randomFallback);
                }
            }
        }
        
        return lines;
        
    } catch (error) {
        console.error("AI generation error:", error);
        
        // Fallback варианты
        return [
            "The story takes an unexpected turn.",
            "A new development occurs.",
            "Things become more complicated.",
            "A surprising event happens.",
            "The situation escalates."
        ].slice(0, count);
    }
}

function getRandomConsequence() {
    const types = ['neutral', 'positive', 'negative', 'extreme'];
    return types[Math.floor(Math.random() * types.length)];
}

// Удаление
function deleteSelectedNode() {
    const nodeId = storyState.selectedNodeId;
    if (!nodeId) return;
    
    if (confirm("Delete this node and all its branches?")) {
        deleteBranch(nodeId);
        storyState.selectedNodeId = null;
        closeNodeDetails();
        renderStory();
        updateStats();
    }
}

function deleteBranch(nodeId) {
    // Рекурсивное удаление всех дочерних веток
    const deleteRecursive = (id) => {
        const node = storyState.nodes[id];
        if (!node) return;
        
        // Удаляем все дочерние ветки
        node.branches.forEach(branchId => {
            deleteRecursive(branchId);
        });
        
        // Удаляем соединения с этим узлом
        storyState.connections = storyState.connections.filter(
            conn => conn.from !== id && conn.to !== id
        );
        
        // Удаляем ссылки на этот узел из родительских веток
        Object.values(storyState.nodes).forEach(parentNode => {
            parentNode.branches = parentNode.branches.filter(branch => branch !== id);
        });
        
        // Удаляем сам узел
        delete storyState.nodes[id];
    };
    
    deleteRecursive(nodeId);
}

// Статистика
function updateStats() {
    const nodes = Object.keys(storyState.nodes).length;
    let branches = 0;
    Object.values(storyState.nodes).forEach(node => {
        branches += node.branches.length;
    });
    
    // Вычисляем глубину
    const depth = calculateStoryDepth();
    
    document.getElementById('nodeCount').textContent = nodes;
    document.getElementById('branchCount').textContent = branches;
    document.getElementById('depthCount').textContent = depth;
}

function calculateStoryDepth() {
    if (Object.keys(storyState.nodes).length === 0) return 0;
    
    const visited = new Set();
    let maxDepth = 0;
    
    const calculateDepth = (nodeId, currentDepth) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        maxDepth = Math.max(maxDepth, currentDepth);
        
        const node = storyState.nodes[nodeId];
        if (node && node.branches) {
            node.branches.forEach(branchId => {
                calculateDepth(branchId, currentDepth + 1);
            });
        }
    };
    
    // Находим начальные узлы (те, у которых нет входящих соединений)
    const hasIncoming = new Set();
    storyState.connections.forEach(conn => {
        hasIncoming.add(conn.to);
    });
    
    Object.keys(storyState.nodes).forEach(nodeId => {
        if (!hasIncoming.has(parseInt(nodeId))) {
            calculateDepth(parseInt(nodeId), 1);
        }
    });
    
    return maxDepth;
}

// AI индикатор
function showAILoading(show) {
    const loading = document.getElementById('aiLoading');
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

// Настройки
function showSettingsModal() {
    // Заполняем текущие настройки
    document.getElementById('globalStyle').value = storyState.settings.globalStyle;
    document.getElementById('maxBranches').value = storyState.settings.maxBranches;
    document.getElementById('branchesValue').textContent = storyState.settings.maxBranches;
    document.getElementById('aiCreativity').value = storyState.settings.aiCreativity;
    updateCreativityLabels(storyState.settings.aiCreativity);
    document.getElementById('showConnections').checked = storyState.settings.showConnections;
    document.getElementById('colorByType').checked = storyState.settings.colorByType;
    document.getElementById('autoArrange').checked = storyState.settings.autoArrange;
    
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function applySettings() {
    storyState.settings.globalStyle = document.getElementById('globalStyle').value;
    storyState.settings.maxBranches = parseInt(document.getElementById('maxBranches').value);
    storyState.settings.aiCreativity = parseInt(document.getElementById('aiCreativity').value);
    storyState.settings.showConnections = document.getElementById('showConnections').checked;
    storyState.settings.colorByType = document.getElementById('colorByType').checked;
    storyState.settings.autoArrange = document.getElementById('autoArrange').checked;
    
    // Применяем изменения
    renderStory();
    
    closeSettingsModal();
}

function updateCreativityLabels(value) {
    const labels = document.querySelectorAll('.range-labels span');
    if (labels.length >= 3) {
        labels[0].style.fontWeight = value <= 3 ? 'bold' : 'normal';
        labels[1].style.fontWeight = value > 3 && value <= 7 ? 'bold' : 'normal';
        labels[2].style.fontWeight = value > 7 ? 'bold' : 'normal';
    }
}

// Экспорт
function showExportModal() {
    // Обновляем статистику
    document.getElementById('exportNodeCount').textContent = Object.keys(storyState.nodes).length;
    document.getElementById('exportBranchCount').textContent = storyState.connections.length;
    document.getElementById('exportDepthCount').textContent = calculateStoryDepth();
    
    // Показываем превью
    updateExportPreview('text');
    
    document.getElementById('exportModal').style.display = 'flex';
}

function closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

function selectExportFormat(format) {
    // Обновляем активный формат
    document.querySelectorAll('.export-option').forEach(option => {
        option.classList.remove('active');
    });
    
    const selected = document.querySelector(`.export-option[data-format="${format}"]`);
    if (selected) {
        selected.classList.add('active');
    }
    
    // Обновляем превью
    updateExportPreview(format);
}

function updateExportPreview(format) {
    const preview = document.getElementById('exportPreview');
    
    if (Object.keys(storyState.nodes).length === 0) {
        preview.textContent = "No story to export";
        return;
    }
    
    let previewText = '';
    
    switch(format) {
        case 'text':
            previewText = generateTextExport();
            break;
        case 'tree':
            previewText = generateTreeExport();
            break;
        case 'json':
            previewText = generateJsonExport();
            break;
        case 'image':
            previewText = "Image export preview not available. Will generate diagram on export.";
            break;
    }
    
    preview.textContent = previewText.substring(0, 300) + (previewText.length > 300 ? '...' : '');
}

function performExport() {
    const activeOption = document.querySelector('.export-option.active');
    if (!activeOption) return;
    
    const format = activeOption.dataset.format;
    
    switch(format) {
        case 'text':
            exportAsText();
            break;
        case 'tree':
            exportAsTree();
            break;
        case 'json':
            exportStoryJson();
            break;
        case 'image':
            exportAsImage();
            break;
    }
    
    closeExportModal();
}

function exportAsText() {
    const text = generateTextExport();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateTextExport() {
    let text = `Story: ${document.getElementById('storyTitle').textContent}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Total Nodes: ${Object.keys(storyState.nodes).length}\n`;
    text += '='.repeat(50) + '\n\n';
    
    // Находим начальные узлы (те, у которых нет входящих соединений)
    const hasIncoming = new Set();
    storyState.connections.forEach(conn => {
        hasIncoming.add(conn.to);
    });
    
    const startNodes = Object.values(storyState.nodes).filter(node => 
        !hasIncoming.has(node.id)
    );
    
    // Рекурсивно генерируем текст
    const generateBranchText = (nodeId, depth = 0) => {
        const node = storyState.nodes[nodeId];
        if (!node) return '';
        
        let branchText = '  '.repeat(depth) + `• ${node.text}\n`;
        
        node.branches.forEach(branchId => {
            branchText += generateBranchText(branchId, depth + 1);
        });
        
        return branchText;
    };
    
    startNodes.forEach((node, index) => {
        text += generateBranchText(node.id, 0);
        if (index < startNodes.length - 1) text += '\n';
    });
    
    return text;
}

function exportAsTree() {
    const tree = generateTreeExport();
    const blob = new Blob([tree], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story_tree_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateTreeExport() {
    let tree = '';
    
    const buildTree = (nodeId, prefix = '', isLast = true) => {
        const node = storyState.nodes[nodeId];
        if (!node) return '';
        
        const connector = isLast ? '└── ' : '├── ';
        tree += prefix + connector + `[${node.consequence}] ${node.text}\n`;
        
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        
        node.branches.forEach((branchId, index) => {
            const isLastChild = index === node.branches.length - 1;
            buildTree(branchId, childPrefix, isLastChild);
        });
    };
    
    // Находим начальные узлы
    const hasIncoming = new Set();
    storyState.connections.forEach(conn => {
        hasIncoming.add(conn.to);
    });
    
    const startNodes = Object.values(storyState.nodes).filter(node => 
        !hasIncoming.has(node.id)
    );
    
    startNodes.forEach((node, index) => {
        const isLast = index === startNodes.length - 1;
        buildTree(node.id, '', isLast);
        if (!isLast) tree += '\n';
    });
    
    return tree;
}

function exportStoryJson() {
    const exportData = {
        story: storyState,
        metadata: {
            title: document.getElementById('storyTitle').textContent,
            exported: new Date().toISOString(),
            version: '1.0'
        }
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importStoryJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm("Load this story? Current story will be lost.")) {
                    storyState = data.story || data;
                    
                    // Восстанавливаем nextNodeId
                    if (storyState.nodes && Object.keys(storyState.nodes).length > 0) {
                        const maxId = Math.max(...Object.keys(storyState.nodes).map(id => parseInt(id)));
                        storyState.nextNodeId = maxId + 1;
                    }
                    
                    // Переходим в редактор
                    document.getElementById('mainPage').style.display = 'none';
                    document.getElementById('editorPage').style.display = 'block';
                    
                    // Обновляем заголовок
                    document.getElementById('storyTitle').textContent = 
                        data.metadata?.title || 'Imported Story';
                    
                    // Рендерим историю
                    renderStory();
                    updateStats();
                    
                    if (Object.keys(storyState.nodes).length > 0) {
                        storyState.selectedNodeId = Object.keys(storyState.nodes)[0];
                        showNodeDetails(storyState.selectedNodeId);
                    }
                    
                    alert("Story imported successfully!");
                }
            } catch (error) {
                console.error("Import error:", error);
                alert("Error importing story: Invalid file format");
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function exportAsImage() {
    alert("Image export would generate a visual diagram of your story. This feature is coming soon!");
    // В реальном приложении здесь был бы код для создания скриншота с помощью html2canvas
}

// Сохранение истории
function saveStory() {
    const storyData = {
        id: Date.now(),
        title: document.getElementById('storyTitle').textContent,
        data: JSON.parse(JSON.stringify(storyState)), // Глубокая копия
        timestamp: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    const savedStories = JSON.parse(localStorage.getItem('savedStories') || '[]');
    savedStories.push(storyData);
    
    // Ограничиваем 10 сохранениями
    if (savedStories.length > 10) savedStories.shift();
    
    localStorage.setItem('savedStories', JSON.stringify(savedStories));
    
    // Сохраняем в недавние
    saveToRecent(storyData.title);
    
    alert("Story saved successfully!");
}

// Очистка истории
function clearStory() {
    if (confirm("Clear the entire story? This cannot be undone.")) {
        storyState.nodes = {};
        storyState.connections = [];
        storyState.selectedNodeId = null;
        storyState.nextNodeId = 1;
        
        closeNodeDetails();
        renderStory();
        updateStats();
        
        // Возвращаем на главную
        document.getElementById('editorPage').style.display = 'none';
        document.getElementById('mainPage').style.display = 'block';
        document.getElementById('storyPrompt').value = '';
    }
}

// Случайное прохождение
function showRandomWalkModal() {
    if (Object.keys(storyState.nodes).length === 0) {
        alert("Create a story first!");
        return;
    }
    
    // Заполняем список начальных узлов
    const select = document.getElementById('startNodeSelect');
    select.innerHTML = '';
    
    // Находим узлы, у которых нет входящих соединений (начальные)
    const hasIncoming = new Set();
    storyState.connections.forEach(conn => {
        hasIncoming.add(conn.to);
    });
    
    Object.values(storyState.nodes).forEach(node => {
        if (!hasIncoming.has(node.id)) {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = `#${node.id}: ${truncateText(node.text, 40)}`;
            select.appendChild(option);
        }
    });
    
    // Если нет начальных узлов, используем первый
    if (select.children.length === 0) {
        const firstNode = Object.values(storyState.nodes)[0];
        const option = document.createElement('option');
        option.value = firstNode.id;
        option.textContent = `#${firstNode.id}: ${truncateText(firstNode.text, 40)}`;
        select.appendChild(option);
    }
    
    document.getElementById('randomWalkModal').style.display = 'flex';
}

function closeWalkModal() {
    document.getElementById('randomWalkModal').style.display = 'none';
}

function generateRandomWalk() {
    const startNodeId = parseInt(document.getElementById('startNodeSelect').value);
    const maxSteps = parseInt(document.getElementById('walkSteps').value);
    const includeDeadEnds = document.getElementById('includeDeadEnds').checked;
    const preferBranches = document.getElementById('preferBranches').checked;
    
    const path = [];
    let currentNodeId = startNodeId;
    let steps = 0;
    
    while (steps < maxSteps && currentNodeId) {
        const node = storyState.nodes[currentNodeId];
        if (!node) break;
        
        path.push({
            id: node.id,
            text: node.text,
            consequence: node.consequence
        });
        
        // Выбираем следующую ветку
        if (node.branches.length === 0) {
            if (includeDeadEnds) {
                // Достигли конца ветки
                break;
            } else {
                // Возвращаемся назад или заканчиваем
                break;
            }
        }
        
        // Выбираем следующую ветку
        if (preferBranches && node.branches.length > 1) {
            // Предпочитаем ветки с большим количеством дальнейших ветвлений
            let bestBranch = node.branches[0];
            let maxFutureBranches = 0;
            
            node.branches.forEach(branchId => {
                const branchNode = storyState.nodes[branchId];
                if (branchNode && branchNode.branches.length > maxFutureBranches) {
                    maxFutureBranches = branchNode.branches.length;
                    bestBranch = branchId;
                }
            });
            
            currentNodeId = bestBranch;
        } else {
            // Случайный выбор
            const randomIndex = Math.floor(Math.random() * node.branches.length);
            currentNodeId = node.branches[randomIndex];
        }
        
        steps++;
    }
    
    // Отображаем путь
    displayRandomWalk(path);
}

function displayRandomWalk(path) {
    const pathList = document.getElementById('pathList');
    pathList.innerHTML = '';
    
    if (path.length === 0) {
        pathList.innerHTML = '<p style="color: #666; font-style: italic;">No path generated</p>';
        return;
    }
    
    path.forEach((step, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'path-step';
        stepElement.innerHTML = `
            <strong>Step ${index + 1} [${step.consequence}]</strong><br>
            ${step.text}
        `;
        pathList.appendChild(stepElement);
    });
}

function exportRandomWalk() {
    const pathList = document.getElementById('pathList');
    const steps = pathList.querySelectorAll('.path-step');
    
    if (steps.length === 0) {
        alert("Generate a walk first!");
        return;
    }
    
    let text = `Random Story Walk\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Total Steps: ${steps.length}\n`;
    text += '='.repeat(50) + '\n\n';
    
    steps.forEach((step, index) => {
        const strong = step.querySelector('strong');
        const content = step.textContent.replace(strong?.textContent || '', '').trim();
        text += `${index + 1}. ${content}\n\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `random_walk_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Авто-расположение узлов
function autoArrangeNodes() {
    if (Object.keys(storyState.nodes).length === 0) return;
    
    const nodes = Object.values(storyState.nodes);
    const levelMap = new Map();
    
    // Определяем уровни для каждого узла
    const calculateLevel = (nodeId, visited = new Set()) => {
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);
        
        const node = storyState.nodes[nodeId];
        if (!node) return 0;
        
        if (levelMap.has(nodeId)) {
            return levelMap.get(nodeId);
        }
        
        let maxChildLevel = 0;
        node.branches.forEach(childId => {
            const childLevel = calculateLevel(childId, visited);
            maxChildLevel = Math.max(maxChildLevel, childLevel);
        });
        
        const level = maxChildLevel + 1;
        levelMap.set(nodeId, level);
        return level;
    };
    
    // Вычисляем уровни для всех узлов
    nodes.forEach(node => {
        if (!levelMap.has(node.id)) {
            calculateLevel(node.id);
        }
    });
    
    // Группируем узлы по уровням
    const levels = {};
    levelMap.forEach((level, nodeId) => {
        if (!levels[level]) levels[level] = [];
        levels[level].push(nodeId);
    });
    
    // Располагаем узлы
    const maxLevel = Math.max(...Object.keys(levels).map(Number));
    const startX = 100;
    const startY = 100;
    const xSpacing = 300;
    const ySpacing = 150;
    
    for (let level = 1; level <= maxLevel; level++) {
        const levelNodes = levels[level] || [];
        const yBase = startY + (maxLevel - level) * ySpacing;
        
        levelNodes.forEach((nodeId, index) => {
            const node = storyState.nodes[nodeId];
            if (node) {
                node.x = startX + (level - 1) * xSpacing;
                node.y = yBase + (index - levelNodes.length / 2) * 100;
            }
        });
    }
    
    renderStory();
}

// Инициализация при загрузке
window.onload = initApp;
