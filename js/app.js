/**
 * Patternbook application shell.
 * No dependencies, build step, account, or backend are required.
 */

const { tracks, topics } = window.PATTERNBOOK;
const STORAGE_KEY = "patternbook-progress-v1";
const STATUS_ORDER = ["new", "learning", "review", "mastered"];
const STATUS_LABELS = {
    new: "Not started",
    learning: "Learning",
    review: "Review",
    mastered: "Mastered"
};

const elements = {
    body: document.body,
    homeView: document.getElementById("home-view"),
    libraryView: document.getElementById("library-view"),
    trackNavigation: document.getElementById("track-navigation"),
    trackGrid: document.getElementById("track-grid"),
    statGrid: document.getElementById("stat-grid"),
    topicList: document.getElementById("topic-list"),
    emptyState: document.getElementById("empty-state"),
    search: document.getElementById("global-search"),
    libraryEyebrow: document.getElementById("library-eyebrow"),
    libraryTitle: document.getElementById("library-title"),
    libraryDescription: document.getElementById("library-description"),
    libraryCount: document.getElementById("library-count"),
    progressSummary: document.getElementById("progress-summary"),
    reviewCount: document.getElementById("review-count"),
    weeklyCount: document.getElementById("weekly-count"),
    weeklyProgress: document.getElementById("weekly-progress"),
    practiceCard: document.getElementById("practice-card"),
    topicDialog: document.getElementById("topic-dialog"),
    dialogContent: document.getElementById("dialog-content"),
    toast: document.getElementById("toast")
};

let progress = loadProgress();
let activeTrack = "all";
let activeStatus = "all";
let practiceIndex = 0;
let toastTimer;

function loadProgress() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return {
            statuses: stored?.statuses || {},
            sessions: Array.isArray(stored?.sessions) ? stored.sessions : []
        };
    } catch (error) {
        return { statuses: {}, sessions: [] };
    }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getTrack(trackId) {
    return tracks.find((track) => track.id === trackId);
}

function getTopic(topicId) {
    return topics.find((topic) => topic.id === topicId);
}

function getStatus(topicId) {
    return progress.statuses[topicId] || "new";
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function startOfWeek() {
    const now = new Date();
    const day = (now.getDay() + 6) % 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    return start.getTime();
}

function weeklySessions() {
    const boundary = startOfWeek();
    return progress.sessions.filter((session) => new Date(session.at).getTime() >= boundary);
}

function recordSession(topicId) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${today}:${topicId}`;
    if (!progress.sessions.some((session) => session.key === key)) {
        progress.sessions.push({ key, topicId, at: new Date().toISOString() });
        progress.sessions = progress.sessions.slice(-120);
        saveProgress();
        renderProgress();
    }
}

function renderNavigation() {
    elements.trackNavigation.innerHTML = tracks.map((track) => `
        <button class="nav-item" type="button" data-track="${escapeHtml(track.id)}">
            <span class="nav-symbol">${escapeHtml(track.mark)}</span>
            <span>${escapeHtml(track.shortName)}</span>
        </button>
    `).join("");
}

function renderTrackGrid() {
    elements.trackGrid.innerHTML = tracks.map((track) => {
        const trackTopics = topics.filter((topic) => topic.track === track.id);
        const mastered = trackTopics.filter((topic) => getStatus(topic.id) === "mastered").length;
        return `
            <button class="track-card" type="button" data-track="${escapeHtml(track.id)}" style="--track-color: ${track.color}">
                <span class="track-card__top">
                    <span class="track-mark">${escapeHtml(track.mark)}</span>
                    <span class="track-arrow">↗</span>
                </span>
                <h3>${escapeHtml(track.name)}</h3>
                <p>${escapeHtml(track.description)}</p>
                <span class="track-card__meta">${trackTopics.length} notes · ${mastered} mastered</span>
            </button>
        `;
    }).join("");
}

function renderProgress() {
    const counts = STATUS_ORDER.reduce((result, status) => {
        result[status] = topics.filter((topic) => getStatus(topic.id) === status).length;
        return result;
    }, {});
    const completedMinutes = topics
        .filter((topic) => getStatus(topic.id) === "mastered")
        .reduce((total, topic) => total + topic.minutes, 0);
    const completion = Math.round((counts.mastered / topics.length) * 100);
    const sessions = weeklySessions().length;

    elements.statGrid.innerHTML = `
        <div class="stat-card"><span>Mastered</span><strong>${counts.mastered}<small> / ${topics.length}</small></strong></div>
        <div class="stat-card"><span>In progress</span><strong>${counts.learning}</strong></div>
        <div class="stat-card"><span>Review queue</span><strong>${counts.review}</strong></div>
        <div class="stat-card"><span>Focused minutes</span><strong>${completedMinutes}</strong></div>
    `;
    elements.progressSummary.textContent = completion
        ? `${completion}% mastered. Keep the review loop moving.`
        : "Start with one pattern today.";
    elements.reviewCount.textContent = counts.review;
    elements.weeklyCount.textContent = `${Math.min(sessions, 5)} / 5`;
    elements.weeklyProgress.style.width = `${Math.min((sessions / 5) * 100, 100)}%`;

    renderTrackGrid();
}

function renderPractice() {
    const topic = topics[practiceIndex % topics.length];
    const track = getTrack(topic.track);
    elements.practiceCard.style.setProperty("--topic-color", track.color);
    elements.practiceCard.innerHTML = `
        <div class="practice-prompt">
            <span class="practice-label">${escapeHtml(track.shortName)} · ${escapeHtml(topic.difficulty)}</span>
            <h3>${escapeHtml(topic.prompt)}</h3>
            <p>Try to structure your answer before opening the playbook.</p>
        </div>
        <div class="practice-plan">
            <h4>A strong approach</h4>
            <ol>${topic.approach.slice(0, 3).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
            <button class="secondary-button" type="button" data-open-topic="${escapeHtml(topic.id)}">Open full playbook →</button>
        </div>
    `;
}

function setView(view, trackId = "all") {
    const showHome = view === "home";
    elements.homeView.classList.toggle("hidden", !showHome);
    elements.libraryView.classList.toggle("hidden", showHome);

    if (!showHome) {
        activeTrack = trackId;
        renderLibrary();
        window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
        activeTrack = "all";
        elements.search.value = "";
        renderProgress();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
        const isHome = showHome && item.dataset.view === "home";
        const isTrack = !showHome && item.dataset.track === trackId;
        item.classList.toggle("active", isHome || isTrack);
    });
    closeSidebar();
}

function filteredTopics() {
    const query = elements.search.value.trim().toLowerCase();
    return topics.filter((topic) => {
        const track = getTrack(topic.track);
        const matchesTrack = activeTrack === "all" || topic.track === activeTrack;
        const matchesStatus = activeStatus === "all" || getStatus(topic.id) === activeStatus;
        const searchText = [
            topic.title,
            topic.summary,
            topic.prompt,
            topic.type,
            track.name,
            ...(topic.tags || []),
            ...(topic.platformMap || [])
        ].join(" ").toLowerCase();
        return matchesTrack && matchesStatus && (!query || searchText.includes(query));
    });
}

function renderLibrary() {
    const track = activeTrack === "all" ? null : getTrack(activeTrack);
    const results = filteredTopics();
    const query = elements.search.value.trim();

    elements.libraryEyebrow.textContent = query ? "Search results" : track ? "Focus area" : "Knowledge library";
    elements.libraryTitle.textContent = query ? `“${query}”` : track ? track.name : "All topics";
    elements.libraryDescription.textContent = track
        ? `${track.description} ${track.topics}.`
        : "Practical patterns and representative interview problems across all five tracks.";
    elements.libraryCount.textContent = `${results.length} topic${results.length === 1 ? "" : "s"}`;

    elements.topicList.innerHTML = results.map((topic) => {
        const topicTrack = getTrack(topic.track);
        const status = getStatus(topic.id);
        return `
            <button class="topic-card" type="button" data-open-topic="${escapeHtml(topic.id)}" style="--topic-color: ${topicTrack.color}">
                <span class="topic-card__top">
                    <span class="topic-type">${escapeHtml(topicTrack.shortName)} · ${escapeHtml(topic.type)}</span>
                    <span class="topic-status" data-status="${status}">${STATUS_LABELS[status]}</span>
                </span>
                <h2>${escapeHtml(topic.title)}</h2>
                <p>${escapeHtml(topic.summary)}</p>
                <span class="topic-card__footer">
                    <span>${escapeHtml(topic.difficulty)} · ${topic.minutes} min</span>
                    <span>→</span>
                </span>
            </button>
        `;
    }).join("");

    elements.topicList.classList.toggle("hidden", results.length === 0);
    elements.emptyState.classList.toggle("hidden", results.length !== 0);
}

function renderList(items) {
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function openTopic(topicId, options = {}) {
    const topic = getTopic(topicId);
    if (!topic) return;
    const track = getTrack(topic.track);
    const status = getStatus(topic.id);
    const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % STATUS_ORDER.length];
    const platformBlock = topic.platformMap ? `
        <div class="content-block answer-block">
            <span>Platform translation</span>
            <h2>Same pattern, different names</h2>
            ${renderList(topic.platformMap)}
        </div>
    ` : "";
    const codeBlock = topic.code ? `
        <div class="code-panel">
            <div class="code-panel__header">
                <span>${escapeHtml(topic.code.language)} pattern</span>
                <button class="copy-button" type="button" data-copy-code="${escapeHtml(topic.id)}">Copy code</button>
            </div>
            <pre><code>${escapeHtml(topic.code.value)}</code></pre>
        </div>
    ` : "";

    elements.dialogContent.innerHTML = `
        <div class="dialog-hero" style="--topic-color: ${track.color}">
            <p class="eyebrow">${escapeHtml(track.name)} · ${escapeHtml(topic.type)}</p>
            <h1>${escapeHtml(topic.title)}</h1>
            <p>${escapeHtml(topic.summary)}</p>
            <div class="dialog-meta">
                <span>${escapeHtml(topic.difficulty)}</span>
                <span>${topic.minutes} minutes</span>
                <span>${escapeHtml(STATUS_LABELS[status])}</span>
            </div>
        </div>
        <div class="dialog-body">
            <div class="prompt-box">
                <span>Interview prompt</span>
                <p>${escapeHtml(topic.prompt)}</p>
            </div>
            <div class="dialog-grid">
                <div class="content-block">
                    <span>Reasoning sequence</span>
                    <h2>Approach</h2>
                    <ol>${topic.approach.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
                </div>
                <div class="content-block">
                    <span>Failure modes</span>
                    <h2>Watch for</h2>
                    ${renderList(topic.pitfalls)}
                </div>
            </div>
            <div class="content-block answer-block">
                <span>60-second answer</span>
                <h2>Say it clearly</h2>
                <p>${escapeHtml(topic.answer)}</p>
            </div>
            ${platformBlock}
            ${codeBlock}
            <div class="dialog-actions">
                <p>Current status: <strong>${escapeHtml(STATUS_LABELS[status])}</strong></p>
                <button class="status-button" type="button" data-advance-status="${escapeHtml(topic.id)}">
                    ${nextStatus === "new" ? "Start status over" : `Mark as ${STATUS_LABELS[nextStatus].toLowerCase()}`} →
                </button>
            </div>
        </div>
    `;

    if (!elements.topicDialog.open) elements.topicDialog.showModal();
    recordSession(topic.id);
    if (!options.fromHash) history.replaceState(null, "", `#topic=${encodeURIComponent(topic.id)}`);
}

function closeTopic() {
    if (elements.topicDialog.open) elements.topicDialog.close();
    if (location.hash.startsWith("#topic=")) {
        history.replaceState(null, "", `${location.pathname}${location.search}`);
    }
}

function advanceStatus(topicId) {
    const current = getStatus(topicId);
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
    progress.statuses[topicId] = next;
    saveProgress();
    renderProgress();
    renderLibrary();
    openTopic(topicId);
    showToast(`Moved to ${STATUS_LABELS[next].toLowerCase()}.`);
}

async function copyCode(topicId) {
    const topic = getTopic(topicId);
    if (!topic?.code) return;
    try {
        await navigator.clipboard.writeText(topic.code.value);
        showToast("Code copied.");
    } catch (error) {
        showToast("Copy was blocked by the browser.");
    }
}

function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 1800);
}

function openSidebar() {
    elements.body.classList.add("sidebar-open");
}

function closeSidebar() {
    elements.body.classList.remove("sidebar-open");
}

function setupEvents() {
    document.addEventListener("click", (event) => {
        const viewButton = event.target.closest("[data-view]");
        const trackButton = event.target.closest("[data-track]");
        const topicButton = event.target.closest("[data-open-topic]");
        const statusButton = event.target.closest("[data-advance-status]");
        const copyButton = event.target.closest("[data-copy-code]");

        if (viewButton) setView(viewButton.dataset.view === "library" ? "library" : "home");
        if (trackButton) setView("library", trackButton.dataset.track);
        if (topicButton) openTopic(topicButton.dataset.openTopic);
        if (statusButton) advanceStatus(statusButton.dataset.advanceStatus);
        if (copyButton) copyCode(copyButton.dataset.copyCode);
    });

    document.querySelectorAll(".filter-chip").forEach((button) => {
        button.addEventListener("click", () => {
            activeStatus = button.dataset.status;
            document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
            renderLibrary();
        });
    });

    elements.search.addEventListener("input", () => {
        if (!elements.search.value && elements.libraryView.classList.contains("hidden")) return;
        if (elements.libraryView.classList.contains("hidden")) setView("library");
        else renderLibrary();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && document.activeElement !== elements.search) {
            event.preventDefault();
            elements.search.focus();
        }
    });

    document.getElementById("start-session").addEventListener("click", () => {
        const next = topics.find((topic) => getStatus(topic.id) === "review")
            || topics.find((topic) => getStatus(topic.id) === "learning")
            || topics.find((topic) => getStatus(topic.id) === "new")
            || topics[0];
        openTopic(next.id);
    });

    document.getElementById("review-button").addEventListener("click", () => {
        activeStatus = "review";
        document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.status === "review"));
        setView("library");
    });

    document.getElementById("next-practice").addEventListener("click", () => {
        practiceIndex = (practiceIndex + 1) % topics.length;
        renderPractice();
    });

    document.getElementById("reset-progress").addEventListener("click", () => {
        if (!window.confirm("Reset every topic status and weekly session on this device?")) return;
        progress = { statuses: {}, sessions: [] };
        saveProgress();
        renderProgress();
        renderLibrary();
        showToast("Progress reset.");
    });

    document.getElementById("menu-button").addEventListener("click", openSidebar);
    document.getElementById("sidebar-close").addEventListener("click", closeSidebar);
    document.getElementById("sidebar-scrim").addEventListener("click", closeSidebar);
    document.getElementById("dialog-close").addEventListener("click", closeTopic);
    elements.topicDialog.addEventListener("click", (event) => {
        if (event.target === elements.topicDialog) closeTopic();
    });
    elements.topicDialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeTopic();
    });
}

function init() {
    renderNavigation();
    renderProgress();
    renderPractice();
    setupEvents();

    const topicId = new URLSearchParams(location.hash.slice(1)).get("topic");
    if (topicId && getTopic(topicId)) openTopic(topicId, { fromHash: true });
}

init();
