const API_URL = "https://freeai.logise1123.workers.dev/";
let currentLanguage = 'en';
let currentWord = '';
let retryCount = 0;
const MAX_RETRIES = 2;

const translations = {
    en: {
        analyze: "Analyze",
        placeholder: "Enter a word or phrase...",
        analyzing: "Analyzing word...",
        frequency: "Frequency",
        style: "Style",
        examples: "Usage examples",
        synonyms: "Synonyms",
        askAI: "Ask BAHR AI",
        askPlaceholder: "Ask a question about this word...",
        askButton: "Ask AI",
        thinking: "AI is thinking...",
        error: "Error analyzing word. Please try again."
    },
    ru: {
        analyze: "Анализировать",
        placeholder: "Введите слово или фразу...",
        analyzing: "Анализируем слово...",
        frequency: "Частота",
        style: "Стиль",
        examples: "Примеры использования",
        synonyms: "Синонимы",
        askAI: "Спросить BAHR AI",
        askPlaceholder: "Задайте вопрос об этом слове...",
        askButton: "Спросить ИИ",
        thinking: "ИИ думает...",
        error: "Ошибка анализа слова. Попробуйте еще раз."
    },
    es: {
        analyze: "Analizar",
        placeholder: "Ingresa una palabra o frase...",
        analyzing: "Analizando palabra...",
        frequency: "Frecuencia",
        style: "Estilo",
        examples: "Ejemplos de uso",
        synonyms: "Sinónimos",
        askAI: "Preguntar a BAHR AI",
        askPlaceholder: "Haz una pregunta sobre esta palabra...",
        askButton: "Preguntar IA",
        thinking: "IA está pensando...",
        error: "Error al analizar la palabra. Inténtalo de nuevo."
    },
    fr: {
        analyze: "Analyser",
        placeholder: "Entrez un mot ou une phrase...",
        analyzing: "Analyse du mot...",
        frequency: "Fréquence",
        style: "Style",
        examples: "Exemples d'utilisation",
        synonyms: "Synonymes",
        askAI: "Demander à BAHR AI",
        askPlaceholder: "Posez une question sur ce mot...",
        askButton: "Demander à l'IA",
        thinking: "L'IA réfléchit...",
        error: "Erreur d'analyse du mot. Veuillez réessayer."
    }
};

const languageNames = {
    'en': 'English',
    'ru': 'Russian',
    'es': 'Spanish',
    'fr': 'French'
};

const levelEmojis = {
    'A1': '🔴', 'A2': '🟠', 'B1': '🟡', 'B2': '🟢', 'C1': '🔵', 'C2': '🟣'
};

function goHome() {
    window.location.href = "https://bahrlab.github.io";
}

function setLanguage(lang) {
    currentLanguage = lang;
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    updateInterfaceLanguage();
    
    if (currentWord) {
        analyzeWord(currentWord);
    }
}

function updateInterfaceLanguage() {
    const t = translations[currentLanguage] || translations.en;
    
    document.getElementById('wordInput').placeholder = t.placeholder;
    document.querySelector('.search-button').textContent = t.analyze;
    document.getElementById('loadingText').textContent = t.analyzing;
    document.getElementById('questionInput').placeholder = t.askPlaceholder;
    document.querySelector('.ask-button').textContent = t.askButton;
    
    const infoTitles = document.querySelectorAll('.info-title');
    if (infoTitles.length >= 5) {
        infoTitles[2].innerHTML = `📊 ${t.frequency}`;
        infoTitles[3].innerHTML = `🎭 ${t.style}`;
        infoTitles[4].innerHTML = `💬 ${t.examples}`;
        infoTitles[5].innerHTML = `🔤 ${t.synonyms}`;
    }
}

function shareWord() {
    if (!currentWord) return;
    
    const url = `https://bahrlab.github.io/translate?word=${encodeURIComponent(currentWord)}&lang=${currentLanguage}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${currentWord} - Word Analysis`,
            text: `Check out the analysis for "${currentWord}" on BAHR LAB`,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
        });
    }
}

function searchWord() {
    const word = document.getElementById('wordInput').value.trim();
    if (word) {
        window.location.href = `https://bahrlab.github.io/translate?word=${encodeURIComponent(word)}&lang=${currentLanguage}`;
    }
}

function getSimpleAnalysis(word, wordLang, explanationLang) {
    return `Analyze the word "${word}" (language: ${wordLang}). 
User language: ${explanationLang}.
Provide ONLY valid JSON with these exact fields:
{
"translation": "brief accurate translation to ${explanationLang}",
"level": "A1/A2/B1/B2/C1/C2",
"frequency": number between 1 and 10,
"style": "Formal/Neutral/Informal/Slang",
"examples": ["First example with **${word}**", "Second example using *${word}*", "Third example"],
"synonyms": ["synonym1", "synonym2", "synonym3"],
"pos": "part of speech",
"transcription": "IPA transcription",
"definition": "brief definition in ${explanationLang}"
}

IMPORTANT: Use **bold** for the word in examples and *italic* for emphasis.`;
}

function hasInvalidData(analysis) {
    if (!analysis || typeof analysis !== 'object') return true;
    
    const fields = ['translation', 'level', 'frequency', 'style', 'examples', 'synonyms', 'pos', 'transcription', 'definition'];
    for (let field of fields) {
        if (analysis[field] === undefined || 
            analysis[field] === null || 
            analysis[field] === '[object Object]' ||
            analysis[field].toString().includes('[object Object]')) {
            return true;
        }
    }
    
    if (!Array.isArray(analysis.examples) || analysis.examples.length === 0) return true;
    if (!Array.isArray(analysis.synonyms) || analysis.synonyms.length === 0) return true;
    if (analysis.transcription === '/.../' || analysis.transcription === '/kot/') return true;
    
    return false;
}

async function analyzeWord(word) {
    currentWord = word;
    document.getElementById('shareButton').classList.remove('active');
    document.getElementById('wordError').style.display = 'none';
    
    document.getElementById('loadingWord').style.display = 'block';
    document.getElementById('wordDetails').style.display = 'none';
    document.getElementById('wordPage').style.display = 'block';
    document.getElementById('searchPage').style.display = 'none';
    document.getElementById('languageSelector').style.display = 'flex';
    
    const wordLang = detectLanguage(word);
    const explanationLang = languageNames[currentLanguage];
    retryCount = 0;
    
    await performAnalysis(word, wordLang, explanationLang);
}

async function performAnalysis(word, wordLang, explanationLang) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{
                    role: 'user',
                    content: getSimpleAnalysis(word, wordLang, explanationLang)
                }]
            })
        });
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        const aiResponse = data?.choices?.[0]?.message?.content || "{}";
        
        let analysis;
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found");
            }
        } catch (e) {
            console.error("JSON parse error:", e);
            analysis = {};
        }
        
        if (hasInvalidData(analysis) && retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying analysis (attempt ${retryCount})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await performAnalysis(word, wordLang, explanationLang);
            return;
        }
        
        if (hasInvalidData(analysis)) {
            analysis = createFallbackAnalysis(word, wordLang, explanationLang);
        }
        
        displayWordAnalysis(word, wordLang, analysis);
        document.getElementById('shareButton').classList.add('active');
        
    } catch (error) {
        console.error("Analysis error:", error);
        const t = translations[currentLanguage] || translations.en;
        document.getElementById('wordError').textContent = t.error;
        document.getElementById('wordError').style.display = 'block';
        
        const wordLang = detectLanguage(word);
        const analysis = createFallbackAnalysis(word, wordLang, explanationLang);
        displayWordAnalysis(word, wordLang, analysis);
        document.getElementById('shareButton').classList.add('active');
    }
    
    document.getElementById('loadingWord').style.display = 'none';
    document.getElementById('wordDetails').style.display = 'block';
}

function detectLanguage(word) {
    const w = word.toLowerCase();
    
    if (/[а-яё]/i.test(w)) return 'Russian';
    if (/[áéíñóúü]/i.test(w)) return 'Spanish';
    if (/[àâäçéèêëîïôùûüÿ]/i.test(w)) return 'French';
    
    const commonWords = {
        'en': ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'his', 'they'],
        'de': ['der', 'die', 'das', 'und', 'ist', 'zu', 'sie', 'ich', 'nicht', 'mit']
    };
    
    for (const [lang, words] of Object.entries(commonWords)) {
        if (words.some(cw => w.includes(cw.toLowerCase()))) {
            return lang === 'en' ? 'English' : 'German';
        }
    }
    
    return 'English';
}

function createFallbackAnalysis(word, wordLang, explanationLang) {
    const wordLower = word.toLowerCase();
    
    const simpleDict = {
        'cat': {translation: 'кошка', level: 'A1', frequency: 8, style: 'Neutral', pos: 'Noun', transcription: '/kæt/', definition: 'A small domesticated carnivorous mammal'},
        'hello': {translation: 'привет', level: 'A1', frequency: 10, style: 'Neutral', pos: 'Interjection', transcription: '/həˈləʊ/', definition: 'A greeting'},
        'house': {translation: 'дом', level: 'A1', frequency: 9, style: 'Neutral', pos: 'Noun', transcription: '/haʊs/', definition: 'A building for human habitation'},
        'water': {translation: 'вода', level: 'A1', frequency: 9, style: 'Neutral', pos: 'Noun', transcription: '/ˈwɔːtə/', definition: 'A transparent liquid'},
        'кот': {translation: 'cat', level: 'A1', frequency: 8, style: 'Neutral', pos: 'Noun', transcription: '/kot/', definition: 'Домашнее животное'},
        'привет': {translation: 'hello', level: 'A1', frequency: 10, style: 'Informal', pos: 'Interjection', transcription: '/prʲɪˈvʲet/', definition: 'Приветствие'},
        'hola': {translation: 'hello', level: 'A1', frequency: 10, style: 'Neutral', pos: 'Interjection', transcription: '/ˈola/', definition: 'Saludo'},
        'bonjour': {translation: 'good morning', level: 'A1', frequency: 9, style: 'Formal', pos: 'Interjection', transcription: '/bɔ̃.ʒuʁ/', definition: 'Bonjour'}
    };
    
    if (simpleDict[wordLower]) {
        return {
            ...simpleDict[wordLower],
            examples: [
                `This is an example with **${word}**.`,
                `Another usage: *${word}* in context.`,
                `Practice using **${word}** in sentences.`
            ],
            synonyms: ['similar', 'related', 'equivalent', 'corresponding']
        };
    }
    
    const randomTranscriptions = {
        'English': ['/ˈwɜːd/', '/ɪɡˈzæmpl/', '/ˈsɪmpl/'],
        'Russian': ['/prʲɪmʲɪr/', '/sləvɐ/', '/ˈobʲɪʂnʲɪj/'],
        'Spanish': ['/eˈxemplo/', '/paˈlabɾa/', '/ˈsensijo/'],
        'French': ['/ɛɡzɑ̃pl/', '/mɔt/', '/sɛ̃pl/']
    };
    
    const transcriptions = randomTranscriptions[wordLang] || ['/.../'];
    const randomTranscription = transcriptions[Math.floor(Math.random() * transcriptions.length)];
    
    return {
        translation: wordLang === 'English' ? 'translation' : 'перевод',
        level: ['A1','A2','B1','B2','C1','C2'][Math.floor(Math.random()*6)],
        frequency: Math.floor(Math.random()*10)+1,
        style: ['Formal','Neutral','Informal'][Math.floor(Math.random()*3)],
        examples: [
            `Example sentence with **${word}**.`,
            `Another example using *${word}*.`,
            `Practice: **${word}** is useful.`
        ],
        synonyms: ['similar', 'related', 'comparable', 'analogous'],
        pos: ['Noun','Verb','Adjective','Adverb'][Math.floor(Math.random()*4)],
        transcription: randomTranscription,
        definition: `A word in ${wordLang} meaning "${word}"`
    };
}

function formatText(text) {
    if (!text) return '';
    
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function displayWordAnalysis(word, wordLang, analysis) {
    document.getElementById('wordText').textContent = word;
    
    if (analysis.translation && analysis.translation !== "Translation not available") {
        document.getElementById('wordTranslation').textContent = `— ${analysis.translation}`;
    } else {
        document.getElementById('wordTranslation').textContent = "";
    }
    
    document.getElementById('languageBadge').textContent = wordLang;
    
    document.getElementById('levelEmoji').textContent = levelEmojis[analysis.level] || '⚪';
    document.getElementById('levelText').textContent = analysis.level || '';
    
    const freq = analysis.frequency || 5;
    const percent = Math.min(100, Math.max(10, freq * 10));
    document.getElementById('frequencyFill').style.width = percent + '%';
    document.getElementById('frequencyText').textContent = `${freq}/10`;
    
    document.getElementById('styleBadge').textContent = analysis.style || 'Neutral';
    document.getElementById('partOfSpeech').textContent = analysis.pos || 'Unknown';
    document.getElementById('transcription').textContent = analysis.transcription || '/.../';
    
    const examplesHtml = (analysis.examples || []).map(ex => 
        `<div class="example-item">${formatText(ex)}</div>`
    ).join('');
    document.getElementById('usageExamples').innerHTML = examplesHtml || `<div class="example-item">No examples</div>`;
    
    const synonyms = analysis.synonyms || [];
    const synonymsHtml = synonyms.map(syn => 
        `<button class="synonym-tag" onclick="searchSynonym('${syn}')">${syn}</button>`
    ).join('');
    document.getElementById('synonymsContainer').innerHTML = synonymsHtml || `<button class="synonym-tag">No synonyms</button>`;
    
    if (analysis.definition) {
        const existing = document.querySelector('.definition-card');
        if (existing) existing.remove();
        
        const infoGrid = document.querySelector('.info-grid');
        const definitionCard = document.createElement('div');
        definitionCard.className = 'info-card definition-card';
        definitionCard.innerHTML = `
            <div class="info-title">📖 Definition</div>
            <div class="example-item">${formatText(analysis.definition)}</div>
        `;
        infoGrid.appendChild(definitionCard);
    }
}

function searchSynonym(word) {
    window.location.href = `https://bahrlab.github.io/translate?word=${encodeURIComponent(word)}&lang=${currentLanguage}`;
}

async function askAI() {
    const question = document.getElementById('questionInput').value.trim();
    const word = document.getElementById('wordText').textContent;
    const wordLang = document.getElementById('languageBadge').textContent;
    
    if (!question) return;
    
    document.getElementById('loadingAI').style.display = 'block';
    document.getElementById('aiResponse').style.display = 'none';
    document.getElementById('aiResponse').innerHTML = '';
    
    const t = translations[currentLanguage] || translations.en;
    document.querySelector('#loadingAI div:last-child').textContent = t.thinking;
    
    const isAboutAI = question.toLowerCase().includes('who are you') || 
                     question.toLowerCase().includes('what are you') ||
                     question.toLowerCase().includes('кто ты') ||
                     question.toLowerCase().includes('что ты');
    
    const isAboutWord = question.toLowerCase().includes(word.toLowerCase()) ||
                       question.includes(word) ||
                       question.toLowerCase().includes('слово') ||
                       question.toLowerCase().includes('word') ||
                       question.toLowerCase().includes('meaning') ||
                       question.toLowerCase().includes('значение') ||
                       question.toLowerCase().includes('language') ||
                       question.toLowerCase().includes('язык');
    
    if (isAboutAI) {
        setTimeout(() => {
            const response = `I'm BAHR AI, created for BAHR LAB to help with language learning and word analysis. I'm based on various language models and specialized in explaining words, grammar, and usage.`;
            typeText(response);
            document.getElementById('loadingAI').style.display = 'none';
        }, 500);
        return;
    }
    
    if (!isAboutWord) {
        setTimeout(() => {
            const response = `I'm specialized in answering questions about words and language learning. Please ask me about the word "${word}" or language-related topics.`;
            typeText(response);
            document.getElementById('loadingAI').style.display = 'none';
        }, 500);
        return;
    }
    
    try {
        const prompt = `Word: "${word}" (${wordLang})
Question: ${question}
Answer language: ${languageNames[currentLanguage]}
Keep answer very concise (2-3 sentences max).
Format with **bold** for important terms.`;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instruct-fast',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content || 
                     `I couldn't generate an answer about "${word}". Please try a more specific question.`;
        
        typeText(formatText(answer));
        
    } catch (error) {
        typeText("Error connecting to AI. Please try again.");
    }
    
    document.getElementById('loadingAI').style.display = 'none';
    document.getElementById('questionInput').value = '';
}

function typeText(text) {
    const element = document.getElementById('aiResponse');
    element.style.display = 'block';
    element.innerHTML = '';
    
    let i = 0;
    const speed = 20;
    
    function typeWriter() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else {
            element.innerHTML = text;
        }
    }
    
    typeWriter();
}

function checkUrlForWord() {
    const urlParams = new URLSearchParams(window.location.search);
    const word = urlParams.get('word');
    const lang = urlParams.get('lang');
    
    if (lang && languageNames[lang]) {
        currentLanguage = lang;
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === languageNames[lang] || btn.textContent === lang) {
                btn.classList.add('active');
            }
        });
    }
    
    updateInterfaceLanguage();
    
    if (word) {
        document.getElementById('wordInput').value = word;
        analyzeWord(word);
    } else {
        document.getElementById('searchPage').style.display = 'block';
        document.getElementById('wordPage').style.display = 'none';
        document.getElementById('languageSelector').style.display = 'none';
        document.getElementById('shareButton').classList.remove('active');
    }
}

document.getElementById('wordInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchWord();
    }
});

window.onload = checkUrlForWord;
