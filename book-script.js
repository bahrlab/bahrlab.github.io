const API_URL = "https://freeai.logise1123.workers.dev/";
let currentBook = null;
let currentPageIndex = 0;
let bookData = {
    pages: [],
    metadata: {},
    history: []
};
let isEditMode = false;
let fontSize = 1.0; // множитель шрифта

// Навигация
function goHome() {
    window.location.href = "https://bahrlab.github.io";
}

// Загрузка примера
function loadExample() {
    document.getElementById('bookTitle').value = "The Memory Keeper's Journey";
    document.getElementById('bookAuthor').value = "AI Story Weaver";
    document.getElementById('storyPremise').value = "In a world where memories are physical objects that can be stolen or traded, a young librarian discovers she can read memories from old books. When she uncovers a plot to erase all memories of a forgotten war, she must race against time to preserve history while avoiding those who want to control the past.";
    document.getElementById('mainCharacters').value = "Liora: The librarian protagonist, quiet but observant, with a mysterious past she can't remember.\n\nKael: A memory hunter with conflicted loyalties, both helping and hindering Liora.\n\nArchivist Silas: The wise but secretive keeper of the forbidden archives.\n\nThe Amnesiac Council: Rulers who have erased their own memories to remain impartial.";
    document.getElementById('worldSetting').value = "The city of Mnemosyne floats on memory clouds, with districts separated by memory types. The Grand Library is a living building that grows new rooms as memories are added. Memory storms occasionally sweep through, causing people to temporarily forget who they are.";
}

// Создание книги
async function createBook() {
    const bookData = {
        title: document.getElementById('bookTitle').value.trim() || "Untitled Story",
        author: document.getElementById('bookAuthor').value.trim() || "Anonymous",
        genre: document.getElementById('bookGenre').value,
        style: document.getElementById('writingStyle').value,
        premise: document.getElementById('storyPremise').value.trim(),
        characters: document.getElementById('mainCharacters').value.trim(),
        world: document.getElementById('worldSetting').value.trim(),
        chapterLength: parseInt(document.getElementById('chapterLength').value),
        complexity: parseInt(document.getElementById('plotComplexity').value)
    };
    
    if (!bookData.premise) {
        alert("Please enter a story premise!");
        return;
    }
    
    // Сохраняем метаданные книги
    window.bookData = {
        pages: [],
        metadata: bookData,
        history: [],
        currentChapter: 1,
        currentPage: 1
    };
    
    // Показываем страницу чтения
    document.getElementById('creationPage').style.display = 'none';
    document.getElementById('readingPage').style.display = 'block';
    
    // Обновляем заголовок
    document.getElementById('currentBookTitle').textContent = bookData.title;
    
    // Генерируем первую страницу
    await generateFirstPage();
}

// Генерация первой страницы
async function generateFirstPage() {
    showProgress("Starting your story...", 10);
    
    const prompt = `Write the opening page of a ${window.bookData.metadata.genre} story.
    
Title: "${window.bookData.metadata.title}"
Author: "${window.bookData.metadata.author}"
Writing Style: ${window.bookData.metadata.style}
Story Premise: ${window.bookData.metadata.premise}
Main Characters: ${window.bookData.metadata.characters}
World Setting: ${window.bookData.metadata.world}
Chapter Length: ${window.bookData.metadata.chapterLength}/10
Plot Complexity: ${window.bookData.metadata.complexity}/10

Write an engaging opening that introduces the world and main character. End with a hook that makes the reader want to continue. Use rich descriptions and show, don't tell.`;

    try {
        showProgress("Creating opening scene...", 30);
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        showProgress("Formatting story...", 70);
        
        const data = await response.json();
        const pageContent = data?.choices?.[0]?.message?.content || "The story begins...";
        
        // Создаем первую страницу
        const firstPage = {
            id: Date.now(),
            chapter: 1,
            page: 1,
            content: formatPageContent(pageContent, 1, 1),
            rawContent: pageContent,
            timestamp: new Date().toISOString()
        };
        
        window.bookData.pages.push(firstPage);
        window.bookData.history.push({ action: "create", pageId: firstPage.id });
        
        showProgress("Finalizing...", 90);
        
        // Отображаем страницу
        displayPage(firstPage);
        
        // Обновляем навигацию
        updateNavigation();
        
        setTimeout(() => {
            hideProgress();
        }, 500);
        
    } catch (error) {
        console.error("Error generating first page:", error);
        hideProgress();
        
        // Fallback content
        const fallbackPage = {
            id: Date.now(),
            chapter: 1,
            page: 1,
            content: formatPageContent(`<h1>${window.bookData.metadata.title}</h1>
<p><strong>By ${window.bookData.metadata.author}</strong></p>
<br>
<p>The story begins in ${window.bookData.metadata.world.toLowerCase()}. ${window.bookData.metadata.premise}</p>
<p>The air was thick with the scent of old memories and possibilities. Somewhere in the distance, a clock tower chimed, marking the hour when everything would change.</p>
<p><em>To be continued...</em></p>`, 1, 1),
            rawContent: "Fallback content",
            timestamp: new Date().toISOString()
        };
        
        window.bookData.pages.push(fallbackPage);
        displayPage(fallbackPage);
        updateNavigation();
    }
}

// Форматирование контента страницы
function formatPageContent(content, chapter, page) {
    // Очищаем контент от лишних форматирований AI
    let formatted = content
        .replace(/```[\s\S]*?```/g, '') // Удаляем блоки кода
        .replace(/^[\s\*\-_]*$/gm, '') // Удаляем пустые строки с символами
        .trim();
    
    // Добавляем заголовок главы для первой страницы главы
    if (page === 1) {
        formatted = `<h1>Chapter ${chapter}</h1>` + formatted;
    }
    
    // Преобразуем разметку
    formatted = formatted
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^(#{1,6})\s*(.*?)$/gm, (match, hashes, text) => {
            const level = hashes.length;
            return `<h${level}>${text}</h${level}>`;
        })
        .replace(/^>\s*(.*?)$/gm, '<blockquote>$1</blockquote>')
        .replace(/\n\s*\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    // Обертываем в параграфы если нужно
    if (!formatted.startsWith('<h') && !formatted.startsWith('<blockquote>')) {
        formatted = '<p>' + formatted.replace(/<\/p><p>/g, '</p>\n<p>') + '</p>';
    }
    
    return formatted;
}

// Отображение страницы
function displayPage(page) {
    const pageContent = document.getElementById('pageContent');
    pageContent.innerHTML = page.content;
    
    // Применяем текущий размер шрифта
    applyFontSize();
    
    // Обновляем информацию о текущей странице
    document.getElementById('currentChapter').textContent = `Chapter ${page.chapter}`;
    document.getElementById('currentPage').textContent = page.page;
    
    // Сохраняем текущий индекс
    currentPageIndex = window.bookData.pages.findIndex(p => p.id === page.id);
    
    // Обновляем кнопки навигации
    updateNavigation();
}

// Обновление навигации
function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentPageIndex <= 0;
    nextBtn.disabled = currentPageIndex >= window.bookData.pages.length - 1;
}

// Предыдущая страница
function previousPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        displayPage(window.bookData.pages[currentPageIndex]);
    }
}

// Следующая страница
function nextPage() {
    if (currentPageIndex < window.bookData.pages.length - 1) {
        currentPageIndex++;
        displayPage(window.bookData.pages[currentPageIndex]);
    }
}

// Генерация следующей страницы
async function generateNextPage() {
    const currentPage = window.bookData.pages[currentPageIndex];
    const nextPageNumber = currentPage.page + 1;
    
    // Проверяем, нужно ли начать новую главу
    const maxPagesPerChapter = Math.max(3, Math.min(10, window.bookData.metadata.chapterLength * 2));
    let nextChapter = currentPage.chapter;
    
    if (nextPageNumber > maxPagesPerChapter) {
        nextChapter++;
        nextPageNumber = 1;
    }
    
    showProgress("Imagining what happens next...", 20);
    
    // Получаем историю для контекста
    const recentPages = window.bookData.pages.slice(Math.max(0, window.bookData.pages.length - 3));
    const context = recentPages.map(p => p.rawContent).join('\n\n');
    
    const prompt = `Continue the story from where it left off.
    
Genre: ${window.bookData.metadata.genre}
Writing Style: ${window.bookData.metadata.style}
Story Premise: ${window.bookData.metadata.premise}
Plot Complexity: ${window.bookData.metadata.complexity}/10

Recent Story Context:
${context}

Continue the narrative naturally. End with a smooth transition to the next scene. If this is a new chapter (Chapter ${nextChapter}), provide a good chapter opening that advances the plot.`;

    try {
        showProgress("Writing next page...", 50);
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        showProgress("Crafting the narrative...", 80);
        
        const data = await response.json();
        const newContent = data?.choices?.[0]?.message?.content || "The story continues...";
        
        const newPage = {
            id: Date.now(),
            chapter: nextChapter,
            page: nextPageNumber,
            content: formatPageContent(newContent, nextChapter, nextPageNumber),
            rawContent: newContent,
            timestamp: new Date().toISOString()
        };
        
        window.bookData.pages.push(newPage);
        window.bookData.history.push({ 
            action: "generate", 
            pageId: newPage.id,
            previousPageId: currentPage.id 
        });
        
        showProgress("Finalizing page...", 95);
        
        // Переходим на новую страницу
        currentPageIndex = window.bookData.pages.length - 1;
        displayPage(newPage);
        
        setTimeout(() => {
            hideProgress();
            
            // Авто-генерация следующей страницы если включено
            const autoGenerate = document.getElementById('autoGenerate');
            if (autoGenerate && autoGenerate.checked) {
                setTimeout(generateNextPage, 1000);
            }
        }, 500);
        
    } catch (error) {
        console.error("Error generating next page:", error);
        hideProgress();
        alert("Error generating page. Please try again.");
    }
}

// Генерация следующей главы
async function generateNextChapter() {
    const currentPage = window.bookData.pages[currentPageIndex];
    const nextChapter = currentPage.chapter + 1;
    
    showProgress("Starting new chapter...", 10);
    
    const prompt = `Start Chapter ${nextChapter} of the story.
    
Title: "${window.bookData.metadata.title}"
Genre: ${window.bookData.metadata.genre}
Writing Style: ${window.bookData.metadata.style}
Story So Far: ${window.bookData.metadata.premise}
Plot Complexity: ${window.bookData.metadata.complexity}/10

Write a compelling chapter opening that advances the main plot. Introduce new developments or conflicts that build upon previous events. End the first page with a strong hook.`;

    try {
        showProgress("Creating chapter opening...", 40);
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        showProgress("Building narrative...", 70);
        
        const data = await response.json();
        const newContent = data?.choices?.[0]?.message?.content || `Chapter ${nextChapter} begins...`;
        
        const newPage = {
            id: Date.now(),
            chapter: nextChapter,
            page: 1,
            content: formatPageContent(newContent, nextChapter, 1),
            rawContent: newContent,
            timestamp: new Date().toISOString()
        };
        
        window.bookData.pages.push(newPage);
        window.bookData.history.push({ 
            action: "new_chapter", 
            pageId: newPage.id,
            chapter: nextChapter 
        });
        
        showProgress("Finalizing chapter...", 90);
        
        currentPageIndex = window.bookData.pages.length - 1;
        displayPage(newPage);
        
        setTimeout(() => {
            hideProgress();
        }, 500);
        
    } catch (error) {
        console.error("Error generating next chapter:", error);
        hideProgress();
        alert("Error generating chapter. Please try again.");
    }
}

// Прогресс бар
function showProgress(text, percent) {
    const progress = document.getElementById('generationProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progress.style.display = 'block';
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

function hideProgress() {
    const progress = document.getElementById('generationProgress');
    progress.style.display = 'none';
}

// Режим редактирования
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('editModeBtn');
    const editSidebar = document.getElementById('editSidebar');
    
    if (isEditMode) {
        editBtn.style.background = '#000';
        editBtn.style.color = 'white';
        editSidebar.classList.add('active');
        
        // Загружаем текущий текст для редактирования
        const currentPage = window.bookData.pages[currentPageIndex];
        document.getElementById('editPageText').value = currentPage.rawContent;
    } else {
        editBtn.style.background = '';
        editBtn.style.color = '';
        editSidebar.classList.remove('active');
    }
}

function closeEditSidebar() {
    isEditMode = false;
    document.getElementById('editModeBtn').style.background = '';
    document.getElementById('editModeBtn').style.color = '';
    document.getElementById('editSidebar').classList.remove('active');
}

// Показать индикатор редактирования
function showEditIndicator(text = "Applying changes...") {
    const indicator = document.getElementById('editIndicator');
    indicator.querySelector('span').textContent = text;
    indicator.classList.add('active');
    
    return indicator;
}

function hideEditIndicator() {
    const indicator = document.getElementById('editIndicator');
    setTimeout(() => {
        indicator.classList.remove('active');
    }, 500);
}

// Регенерация текущей страницы
async function regeneratePage() {
    const currentPage = window.bookData.pages[currentPageIndex];
    const instruction = document.getElementById('editInstruction').value.trim();
    
    showEditIndicator("Regenerating page...");
    
    const prompt = `Rewrite this page of the story${instruction ? ' with the following changes: ' + instruction : ''}.
    
Current Page Content:
${currentPage.rawContent}

Keep the same chapter and page number. Maintain consistency with the story so far.`;
    
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
        const newContent = data?.choices?.[0]?.message?.content || currentPage.rawContent;
        
        // Обновляем страницу
        currentPage.content = formatPageContent(newContent, currentPage.chapter, currentPage.page);
        currentPage.rawContent = newContent;
        currentPage.timestamp = new Date().toISOString();
        
        // Добавляем в историю
        window.bookData.history.push({
            action: "regenerate",
            pageId: currentPage.id,
            instruction: instruction
        });
        
        // Обновляем отображение
        displayPage(currentPage);
        document.getElementById('editInstruction').value = '';
        
        hideEditIndicator();
        
    } catch (error) {
        console.error("Error regenerating page:", error);
        hideEditIndicator();
        alert("Error regenerating page. Please try again.");
    }
}

// Редактирование и продолжение
async function editAndContinue() {
    const instruction = document.getElementById('editInstruction').value.trim();
    if (!instruction) {
        alert("Please enter an instruction for the AI.");
        return;
    }
    
    await regeneratePage(); // Сначала переписываем текущую страницу
    
    // Затем генерируем следующую
    setTimeout(async () => {
        showEditIndicator("Continuing with changes...");
        await generateNextPage();
        hideEditIndicator();
    }, 1000);
}

// Переписать с этой точки
async function rewriteFromHere() {
    if (!confirm("This will delete all pages after this one and rewrite the story from here. Continue?")) {
        return;
    }
    
    const instruction = document.getElementById('editInstruction').value.trim();
    if (!instruction) {
        alert("Please enter instructions for how the story should continue differently.");
        return;
    }
    
    showEditIndicator("Rewriting story from here...");
    
    // Удаляем все страницы после текущей
    window.bookData.pages = window.bookData.pages.slice(0, currentPageIndex + 1);
    
    // Добавляем в историю
    window.bookData.history.push({
        action: "rewrite_from",
        pageId: window.bookData.pages[currentPageIndex].id,
        instruction: instruction
    });
    
    // Регенерируем текущую страницу с изменениями
    const currentPage = window.bookData.pages[currentPageIndex];
    
    const prompt = `Rewrite this page with these changes: ${instruction}
    
Then continue the story in a new direction based on these changes.
    
Current Page Content:
${currentPage.rawContent}`;
    
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
        const newContent = data?.choices?.[0]?.message?.content || currentPage.rawContent;
        
        // Обновляем текущую страницу
        currentPage.content = formatPageContent(newContent, currentPage.chapter, currentPage.page);
        currentPage.rawContent = newContent;
        
        displayPage(currentPage);
        
        // Генерируем следующую страницу
        await generateNextPage();
        
        hideEditIndicator();
        
    } catch (error) {
        console.error("Error rewriting story:", error);
        hideEditIndicator();
        alert("Error rewriting story. Please try again.");
    }
}

// Функции сюжетных изменений
async function addPlotTwist() {
    document.getElementById('editInstruction').value = "Add a major plot twist that changes everything the reader thought they knew. Make it surprising but plausible within the established world.";
    showEditIndicator("Adding plot twist...");
    await regeneratePage();
    hideEditIndicator();
}

async function introduceCharacter() {
    document.getElementById('editInstruction').value = "Introduce a new important character who will significantly impact the story. Describe them vividly and show how they enter the narrative.";
    showEditIndicator("Introducing new character...");
    await regeneratePage();
    hideEditIndicator();
}

async function changeSetting() {
    document.getElementById('editInstruction').value = "Change the setting to a new location. Describe it in detail and show how the characters interact with this new environment.";
    showEditIndicator("Changing setting...");
    await regeneratePage();
    hideEditIndicator();
}

async function resolveConflict() {
    document.getElementById('editInstruction').value = "Resolve a major conflict or reveal important information that has been building up. Make it satisfying but leave room for new developments.";
    showEditIndicator("Resolving conflict...");
    await regeneratePage();
    hideEditIndicator();
}

// Модальные окна
function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
    
    // Загружаем текущие настройки
    if (window.bookData && window.bookData.metadata) {
        document.getElementById('settingsGenre').value = window.bookData.metadata.genre;
        document.getElementById('settingsStyle').value = window.bookData.metadata.style;
    }
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

function openExportModal() {
    document.getElementById('exportModal').classList.add('active');
    
    // Обновляем статистику
    if (window.bookData && window.bookData.pages) {
        const chapters = new Set(window.bookData.pages.map(p => p.chapter)).size;
        const pages = window.bookData.pages.length;
        const words = window.bookData.pages.reduce((total, page) => 
            total + (page.rawContent || '').split(/\s+/).length, 0);
        
        document.getElementById('exportChapters').textContent = chapters;
        document.getElementById('exportPages').textContent = pages;
        document.getElementById('exportWords').textContent = words.toLocaleString();
    }
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('active');
}

// Применение настроек
function applySettings() {
    if (window.bookData && window.bookData.metadata) {
        window.bookData.metadata.genre = document.getElementById('settingsGenre').value;
        window.bookData.metadata.style = document.getElementById('settingsStyle').value;
        
        // Показываем уведомление
        showEditIndicator("Settings applied");
        setTimeout(hideEditIndicator, 1000);
    }
    
    closeSettingsModal();
}

// Изменение размера шрифта
function changeFontSize(delta) {
    fontSize += delta * 0.1;
    fontSize = Math.max(0.8, Math.min(2.0, fontSize)); // Ограничиваем от 80% до 200%
    applyFontSize();
    
    const sizeDisplay = document.getElementById('fontSizeDisplay');
    if (fontSize < 1.0) sizeDisplay.textContent = 'Small';
    else if (fontSize > 1.2) sizeDisplay.textContent = 'Large';
    else sizeDisplay.textContent = 'Medium';
}

function applyFontSize() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
        pageContent.style.fontSize = `${fontSize}em`;
        pageContent.style.lineHeight = `${1.2 * fontSize}em`;
    }
}

// Изменение темы
function changeTheme(theme) {
    document.body.className = theme + '-theme';
    
    // Обновляем активные кнопки
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// Экспорт
function exportBook() {
    openExportModal();
}

function exportAsTXT() {
    if (!window.bookData || !window.bookData.pages.length) return;
    
    let text = `${window.bookData.metadata.title}\n`;
    text += `by ${window.bookData.metadata.author}\n\n`;
    text += `Generated with BAHR LAB Infinite AI Book\n\n`;
    text += '='.repeat(50) + '\n\n';
    
    let currentChapter = 0;
    window.bookData.pages.forEach(page => {
        if (page.chapter !== currentChapter) {
            text += `\nCHAPTER ${page.chapter}\n\n`;
            currentChapter = page.chapter;
        }
        text += `[Page ${page.page}]\n`;
        text += page.rawContent + '\n\n';
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${window.bookData.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showEditIndicator("Exported as TXT");
    setTimeout(hideEditIndicator, 1000);
}

function exportAsPDF() {
    showEditIndicator("PDF export requires external service. Exporting as HTML instead.");
    setTimeout(() => {
        exportAsHTML();
        hideEditIndicator();
    }, 1500);
}

function exportAsEPUB() {
    showEditIndicator("EPUB format coming soon! Exporting as TXT for now.");
    setTimeout(() => {
        exportAsTXT();
        hideEditIndicator();
    }, 1500);
}

function exportAsHTML() {
    if (!window.bookData || !window.bookData.pages.length) return;
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${window.bookData.metadata.title}</title>
    <style>
        body {
            font-family: Georgia, serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: #fffef5;
            color: #333;
        }
        h1 { font-size: 2.5em; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        h2 { font-size: 1.8em; margin: 40px 0 20px; color: #000; }
        p { margin-bottom: 20px; text-indent: 30px; }
        p:first-child { text-indent: 0; }
        .chapter { margin-bottom: 60px; }
        .page-break { page-break-after: always; }
        .book-title { text-align: center; margin-bottom: 40px; }
        .book-title h1 { border: none; }
        .metadata { text-align: center; color: #666; margin-bottom: 40px; }
        @media print {
            body { font-size: 12pt; }
            .page-break { display: block; }
        }
    </style>
</head>
<body>
    <div class="book-title">
        <h1>${window.bookData.metadata.title}</h1>
        <div class="metadata">
            <p>by ${window.bookData.metadata.author}</p>
            <p>Generated with BAHR LAB Infinite AI Book</p>
        </div>
    </div>
    <hr style="margin: 40px 0;">
`;
    
    let currentChapter = 0;
    window.bookData.pages.forEach((page, index) => {
        if (page.chapter !== currentChapter) {
            html += `<div class="chapter" id="chapter-${page.chapter}">\n`;
            html += `<h2>Chapter ${page.chapter}</h2>\n`;
            currentChapter = page.chapter;
        }
        
        html += page.content + '\n';
        
        if (index < window.bookData.pages.length - 1 && 
            window.bookData.pages[index + 1].chapter !== page.chapter) {
            html += '</div>\n<div class="page-break"></div>\n';
        }
    });
    
    if (currentChapter > 0) {
        html += '</div>\n';
    }
    
    html += `</body>\n</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${window.bookData.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showEditIndicator("Exported as HTML");
    setTimeout(hideEditIndicator, 1000);
}

// Инициализация
window.onload = function() {
    // Проверяем URL параметры
    const urlParams = new URLSearchParams(window.location.search);
    const load = urlParams.get('load');
    
    if (load === 'example') {
        loadExample();
    }
    
    // Инициализируем тему
    const savedTheme = localStorage.getItem('book-theme') || 'light';
    changeTheme(savedTheme);
    
    // Инициализируем размер шрифта
    const savedFontSize = localStorage.getItem('book-fontsize');
    if (savedFontSize) {
        fontSize = parseFloat(savedFontSize);
        applyFontSize();
    }
    
    // Сохраняем настройки при изменении
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', function() {
            localStorage.setItem('book-theme', this.dataset.theme);
        });
    });
    
    // Сохраняем размер шрифта
    window.addEventListener('beforeunload', function() {
        localStorage.setItem('book-fontsize', fontSize.toString());
    });
};
