/**
 * Code365 - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    await initApp();
});

async function initApp() {
    // Load all challenges
    showLoading();
    await window.loadAllChallenges();

    // Load today's challenge
    await loadTodaysChallenge();

    // Setup navigation
    setupNavigation();

    // Setup tabs
    setupTabs();
}

function showLoading() {
    document.getElementById('challenge-title').textContent = 'Loading challenges...';
}

async function loadTodaysChallenge() {
    const challenge = window.getTodaysChallenge();
    if (challenge) {
        await displayChallenge(challenge);
    } else {
        document.getElementById('challenge-title').textContent = 'No challenges found';
    }
}

async function displayChallenge(challenge) {
    // Update meta
    document.getElementById('challenge-category').textContent = challenge.categoryLabel;
    const diffBadge = document.getElementById('challenge-difficulty');
    diffBadge.textContent = challenge.difficulty;
    diffBadge.className = `difficulty-badge ${challenge.difficulty}`;

    // Update title
    document.getElementById('challenge-title').textContent = challenge.title;

    // Update learning objectives
    const objectivesList = document.getElementById('objectives-list');
    objectivesList.innerHTML = challenge.learningObjectives
        .map(obj => `<li>${obj}</li>`)
        .join('');

    // Update problem
    document.getElementById('problem-content').innerHTML = challenge.problem;

    // Load and display solution from actual source file
    document.getElementById('solution-filename').textContent = challenge.solutionFile;
    const codeEl = document.getElementById('solution-code');
    codeEl.textContent = 'Loading solution...';

    const solutionCode = await window.loadSolutionCode(challenge);
    codeEl.textContent = solutionCode;
    codeEl.className = `language-${challenge.language}`;

    // Re-highlight code
    if (window.Prism) {
        Prism.highlightElement(codeEl);
    }

    // Update explanation
    document.getElementById('explanation-content').innerHTML = challenge.explanation;

    // Show challenge card, hide grid
    document.getElementById('challenge-card').classList.remove('hidden');
    document.getElementById('challenge-grid').classList.add('hidden');
    document.getElementById('page-title').textContent = "Today's Challenge";
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            if (category === 'all') {
                showChallengeGrid(window.getChallengesByCategory('all'), 'All Challenges');
            } else {
                const challenges = window.getChallengesByCategory(category);
                const label = item.textContent.trim();
                if (challenges.length > 0) {
                    showChallengeGrid(challenges, `${label} Challenges`);
                } else {
                    showEmptyState(label);
                }
            }
        });
    });
}

function showChallengeGrid(challenges, title) {
    document.getElementById('challenge-card').classList.add('hidden');
    document.getElementById('challenge-grid').classList.remove('hidden');
    document.getElementById('grid-title').textContent = title;
    document.getElementById('challenge-count').textContent = `${challenges.length} challenge${challenges.length !== 1 ? 's' : ''}`;
    document.getElementById('page-title').textContent = title;

    const container = document.getElementById('grid-container');
    container.innerHTML = challenges.map(challenge => `
        <div class="grid-card" onclick="selectChallenge('${challenge.id}')">
            <div class="grid-card-meta">
                <span class="category-badge">${challenge.categoryLabel}</span>
                <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty}</span>
            </div>
            <h3 class="grid-card-title">${challenge.title}</h3>
            <p class="grid-card-desc">${challenge.learningObjectives.slice(0, 2).join(' • ')}</p>
        </div>
    `).join('');
}

function showEmptyState(category) {
    document.getElementById('challenge-card').classList.add('hidden');
    document.getElementById('challenge-grid').classList.remove('hidden');
    document.getElementById('grid-title').textContent = `${category} Challenges`;
    document.getElementById('challenge-count').textContent = '0 challenges';
    document.getElementById('page-title').textContent = `${category} Challenges`;

    const container = document.getElementById('grid-container');
    container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
            <h3 style="color: var(--text-secondary); margin-bottom: 8px;">No challenges yet</h3>
            <p>Add a challenge to this category!</p>
        </div>
    `;
}

async function selectChallenge(id) {
    const challenge = window.getChallengeById(id);
    if (challenge) {
        await displayChallenge(challenge);

        // Reset tabs to problem
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab[data-tab="problem"]').classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById('problem-tab').classList.add('active');
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

function copyCode() {
    const code = document.getElementById('solution-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

// Make selectChallenge available globally
window.selectChallenge = selectChallenge;
