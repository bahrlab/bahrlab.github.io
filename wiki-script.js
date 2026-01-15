const API_URL = "https://freeai.logise1123.workers.dev/";
let currentTopic = '';

const topics = [
    { title: "Artificial Intelligence", desc: "Machine learning, neural networks, and AI applications" },
    { title: "Ancient Rome", desc: "Roman Empire, culture, architecture, and history" },
    { title: "Quantum Physics", desc: "Quantum mechanics, particles, and quantum theory" },
    { title: "Climate Change", desc: "Global warming, environmental impact, and solutions" },
    { title: "Human Brain", desc: "Neuroscience, cognition, and brain functions" },
    { title: "Space Exploration", desc: "NASA, SpaceX, planets, and universe discoveries" },
    { title: "Ancient Egypt", desc: "Pyramids, pharaohs, and Egyptian civilization" },
    { title: "Renewable Energy", desc: "Solar, wind, and sustainable power sources" },
    { title: "Genetics", desc: "DNA, inheritance, and genetic engineering" },
    { title: "World War II", desc: "History, battles, and global impact" },
    { title: "Artificial Neural Networks", desc: "Deep learning and AI architecture" },
    { title: "Marine Biology", desc: "Ocean life, ecosystems, and marine science" }
];

function goHome() {
    window.location.href = "https://bahrlab.github.io";
}

function searchTopic() {
    const topic = document.getElementById('searchInput').value.trim();
    if (topic) {
        window.location.href = `https://bahrlab.github.io/wiki?d=${encodeURIComponent(topic)}`;
    }
}

function goToTopic(topic) {
    window.location.href = `https://bahrlab.github.io/wiki?d=${encodeURIComponent(topic)}`;
}

function generateImage(prompt) {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=600&height=400`;
}

async function generateWikiPage(topic) {
    currentTopic = topic;
    
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('wikiPage').style.display = 'block';
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('errorSection').style.display = 'none';
    document.getElementById('contentSection').style.display = 'none';
    
    document.getElementById('pageTitle').textContent = topic;
    document.getElementById('pageCategory').textContent = "Loading...";
    document.getElementById('pageIntro').textContent = "";
    
    // Начинаем загрузку изображения отдельно
    loadImage(topic);
    
    try {
        // СУПЕР ПРОСТОЙ ПРОМТ КАК В ПЕРЕВОДЧИКЕ
        const prompt = `Write a short encyclopedia article about "${topic}". 
Start with category in brackets like [Science].
Then write 2-3 paragraph introduction.
Then list 4 key facts with -.
End with a conclusion.`;
        
        console.log("Sending request to AI...");
        const startTime = Date.now();
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        console.log("Response received in:", Date.now() - startTime, "ms");
        
        if (!response.ok) {
            throw new Error('API error: ' + response.status);
        }
        
        const data = await response.json();
        const aiResponse = data?.choices?.[0]?.message?.content || "";
        
        console.log("AI Response:", aiResponse.substring(0, 200));
        
        if (!aiResponse || aiResponse.includes('[object Object]') || aiResponse.length < 50) {
            throw new Error('Empty or invalid response');
        }
        
        // Парсим простой ответ
        const wikiData = parseSimpleResponse(aiResponse, topic);
        displayWikiPage(wikiData);
        
    } catch (error) {
        console.error('Error generating article:', error);
        
        // Быстрый фоллбек - показываем хотя бы что-то
        const fallbackData = createQuickFallback(topic);
        displayWikiPage(fallbackData);
    }
    
    document.getElementById('loadingSection').style.display = 'none';
}

function parseSimpleResponse(text, topic) {
    // Ищем категорию в скобках
    const categoryMatch = text.match(/\[(.*?)\]/);
    const category = categoryMatch ? categoryMatch[1] : "General Knowledge";
    
    // Убираем категорию из текста
    let content = text.replace(/\[.*?\]/, '').trim();
    
    // Разделяем на абзацы
    const paragraphs = content.split(/\n\n+/);
    
    // Первые 2-3 абзаца - введение
    const intro = paragraphs.slice(0, Math.min(3, paragraphs.length)).join('\n\n');
    
    // Ищем факты с дефисами
    const facts = [];
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.trim().startsWith('-') && facts.length < 4) {
            const factText = line.trim().substring(1).trim();
            facts.push({
                title: factText.split(':')[0]?.trim() || "Fact",
                content: factText.split(':').slice(1).join(':').trim() || factText
            });
        }
    }
    
    // Если фактов нет, создаем дефолтные
    if (facts.length === 0) {
        facts.push(
            { title: "Definition", content: `Study of ${topic}` },
            { title: "Importance", content: "Significant field of research" },
            { title: "Applications", content: "Various practical uses" },
            { title: "Research", content: "Ongoing studies" }
        );
    }
    
    // Создаем секции из оставшегося текста
    const sections = [];
    if (paragraphs.length > 3) {
        sections.push({
            title: "Detailed Information",
            content: paragraphs.slice(3).join('\n\n')
        });
    } else {
        sections.push({
            title: "Overview",
            content: intro || `${topic} is an important topic worth exploring.`
        });
    }
    
    return {
        title: topic,
        category: category,
        intro: intro || `${topic} is a fascinating subject with broad implications.`,
        key_facts: facts.slice(0, 4),
        sections: sections
    };
}

function createQuickFallback(topic) {
    return {
        title: topic,
        category: ["Science", "History", "Technology"][Math.floor(Math.random() * 3)],
        intro: `${topic} is an important area of study with significant implications across various fields. This article provides key insights and information.`,
        key_facts: [
            { title: "Definition", content: `The study and application of ${topic}` },
            { title: "Significance", content: "Important field with wide relevance" },
            { title: "Key Aspects", content: "Multiple dimensions and perspectives" },
            { title: "Future", content: "Continued research and development" }
        ],
        sections: [
            {
                title: "Overview",
                content: `**${topic}** encompasses a range of concepts and applications. Its study has evolved over time and continues to be relevant in contemporary discourse.`
            }
        ]
    };
}

function loadImage(topic) {
    const imageUrl = generateImage(topic);
    const img = new Image();
    
    img.onload = function() {
        document.getElementById('imageContainer').innerHTML = `
            <img src="${imageUrl}" alt="${topic}" class="wiki-image">
        `;
    };
    
    img.onerror = function() {
        document.getElementById('imageContainer').innerHTML = `
            <div class="image-loading">Image not available</div>
        `;
    };
    
    img.src = imageUrl;
}

function formatText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p class="wiki-text">')
        .replace(/\n/g, '<br>');
}

function displayWikiPage(wikiData) {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('contentSection').style.display = 'block';
    
    document.getElementById('pageTitle').textContent = wikiData.title || currentTopic;
    document.getElementById('pageCategory').textContent = wikiData.category || "General Knowledge";
    document.getElementById('pageIntro').innerHTML = formatText(wikiData.intro);
    
    const factsHtml = (wikiData.key_facts || []).map(fact => `
        <div class="info-card">
            <div class="info-title">${fact.title || "Fact"}</div>
            <div>${formatText(fact.content)}</div>
        </div>
    `).join('');
    document.getElementById('keyFactsGrid').innerHTML = factsHtml;
    
    const sectionsHtml = (wikiData.sections || []).map(section => `
        <div class="content-section">
            <h2 class="section-title">${section.title || "Section"}</h2>
            <div class="wiki-text">${formatText(section.content)}</div>
        </div>
    `).join('');
    document.getElementById('contentSections').innerHTML = sectionsHtml;
}

function displayHomeTopics() {
    const grid = document.getElementById('topicsGrid');
    grid.innerHTML = topics.map(topic => `
        <div class="topic-card" onclick="goToTopic('${topic.title}')">
            <div class="topic-title">${topic.title}</div>
            <div class="topic-desc">${topic.desc}</div>
        </div>
    `).join('');
}

function retryGeneration() {
    if (currentTopic) {
        generateWikiPage(currentTopic);
    }
}

function checkUrlForTopic() {
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('d');
    
    if (topic) {
        document.getElementById('searchInput').value = topic;
        generateWikiPage(topic);
    } else {
        document.getElementById('homePage').style.display = 'block';
        document.getElementById('wikiPage').style.display = 'none';
        displayHomeTopics();
    }
}

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchTopic();
    }
});

window.onload = function() {
    checkUrlForTopic();
    document.getElementById('searchInput').focus();
};
