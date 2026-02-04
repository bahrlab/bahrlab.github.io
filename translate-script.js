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
+        partOfSpeech: "Part of speech",
+        transcription: "Transcription",
+        definition: "Definition",
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
+        partOfSpeech: "Часть речи",
+        transcription: "Транскрипция",
+        definition: "Определение",
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
+        partOfSpeech: "Parte de la oración",
+        transcription: "Transcripción",
+        definition: "Definición",
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
+        partOfSpeech: "Nature grammaticale",
+        transcription: "Transcription",
+        definition: "Définition",
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
 
-function setLanguage(lang) {
+function setLanguage(lang, button) {
     currentLanguage = lang;
     
     document.querySelectorAll('.lang-btn').forEach(btn => {
         btn.classList.remove('active');
     });
     
-    event.target.classList.add('active');
+    if (button) {
+        button.classList.add('active');
+    } else {
+        const activeButton = document.querySelector(`.lang-btn[data-lang="${lang}"]`);
+        if (activeButton) {
+            activeButton.classList.add('active');
+        }
+    }
     
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
-    
-    const infoTitles = document.querySelectorAll('.info-title');
-    if (infoTitles.length >= 5) {
-        infoTitles[2].innerHTML = `📊 ${t.frequency}`;
-        infoTitles[3].innerHTML = `🎭 ${t.style}`;
-        infoTitles[4].innerHTML = `💬 ${t.examples}`;
-        infoTitles[5].innerHTML = `🔤 ${t.synonyms}`;
-    }
+
+    const posTitle = document.getElementById('posTitle');
+    if (posTitle) posTitle.innerHTML = `📚 ${t.partOfSpeech}`;
+    const transcriptionTitle = document.getElementById('transcriptionTitle');
+    if (transcriptionTitle) transcriptionTitle.innerHTML = `🔊 ${t.transcription}`;
+    const frequencyTitle = document.getElementById('frequencyTitle');
+    if (frequencyTitle) frequencyTitle.innerHTML = `📊 ${t.frequency}`;
+    const styleTitle = document.getElementById('styleTitle');
+    if (styleTitle) styleTitle.innerHTML = `🎭 ${t.style}`;
+    const examplesTitle = document.getElementById('examplesTitle');
+    if (examplesTitle) examplesTitle.innerHTML = `💬 ${t.examples}`;
+    const synonymsTitle = document.getElementById('synonymsTitle');
+    if (synonymsTitle) synonymsTitle.innerHTML = `🔤 ${t.synonyms}`;
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
@@ -357,54 +381,55 @@ function displayWordAnalysis(word, wordLang, analysis) {
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
+        const t = translations[currentLanguage] || translations.en;
         const definitionCard = document.createElement('div');
         definitionCard.className = 'info-card definition-card';
         definitionCard.innerHTML = `
-            <div class="info-title">📖 Definition</div>
+            <div class="info-title">📖 ${t.definition}</div>
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
@@ -477,51 +502,51 @@ function typeText(text) {
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
-            if (btn.textContent === languageNames[lang] || btn.textContent === lang) {
+            if (btn.dataset.lang === lang) {
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
