const PROJECTS_URL = "https://raw.githubusercontent.com/bahrlab/bahrlab.github.io/refs/heads/main/pages/all";

// Навигация
document.querySelector('.logo').addEventListener('click', () => {
    window.location.href = 'https://bahrlab.github.io';
});

function searchTools() {
    const query = document.getElementById('mainSearch').value.toLowerCase().trim();
    if (!query) return;
    
    // Простой поиск по проектам
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        const name = card.querySelector('.project-name').textContent.toLowerCase();
        const desc = card.querySelector('.project-desc').textContent.toLowerCase();
        
        if (name.includes(query) || desc.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Загрузка проектов
async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    
    try {
        const response = await fetch(PROJECTS_URL);
        const projects = await response.json();
        
        if (!projects || !Array.isArray(projects)) {
            throw new Error('Invalid data format');
        }
        
        displayProjects(projects);
        
    } catch (error) {
        console.error('Error loading projects:', error);
        showError();
    }
}

function displayProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    
    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="emoji">📭</div>
                <div>No projects available</div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = projects.map(project => `
        <a href="${project.link}" class="project-card" target="_blank">
            <img src="${project.prev}" alt="${project.name}" class="project-preview" onerror="this.src='https://via.placeholder.com/400x180/f8f9fa/666?text=${encodeURIComponent(project.name)}'">
            <div class="project-info">
                <div class="project-name">${project.name}</div>
                <div class="project-desc">${project.desc}</div>
            </div>
        </a>
    `).join('');
}

function showError() {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = `
        <div class="error-box">
            <h3>Unable to load projects</h3>
            <p>Please check your connection and try again.</p>
            <button class="retry-button" onclick="loadProjects()">Retry</button>
        </div>
    `;
}

// Поиск по Enter
document.getElementById('mainSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchTools();
    }
});

// Загрузка при старте
window.onload = loadProjects;
