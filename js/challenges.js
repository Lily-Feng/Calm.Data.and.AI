/**
 * Code365 - Challenge Index
 * 
 * This file registers all challenges. To add a new challenge:
 * 1. Create a new folder or use existing one in challenges/
 * 2. Add your-challenge.js with the challenge metadata
 * 3. Add your solution file (e.g., solution.go, solution.py)
 * 4. Register it in the CHALLENGE_INDEX below
 */

const CHALLENGE_INDEX = [
    // ===== LANGUAGES =====
    { path: "challenges/languages/go/go-001.js" },
    { path: "challenges/languages/python/py-001.js" },
    { path: "challenges/languages/typescript/ts-001.js" },
    { path: "challenges/languages/rust/rust-001.js" },

    // ===== FRAMEWORKS =====
    { path: "challenges/frameworks/react/react-001.js" },

    // ===== DATABASES =====
    { path: "challenges/databases/duckdb/duckdb-001.js" },

    // ===== BIG DATA =====
    { path: "challenges/bigdata/spark-basic/spark-001.js" },

    // ===== ADD NEW CHALLENGES HERE =====
    // { path: "challenges/languages/scala/scala-001.js" },
    // { path: "challenges/ml/pytorch/pytorch-001.js" },
];

// Loaded challenges will be stored here
let CHALLENGES = [];

/**
 * Load all challenges from the index
 */
async function loadAllChallenges() {
    const loadedChallenges = [];

    for (const entry of CHALLENGE_INDEX) {
        try {
            // Load the challenge JS file
            const response = await fetch(entry.path);
            const jsCode = await response.text();

            // Execute it to get the challenge object
            const challenge = extractChallenge(jsCode);
            if (challenge) {
                // Store the base path for loading solution files
                challenge.basePath = entry.path.substring(0, entry.path.lastIndexOf('/'));
                loadedChallenges.push(challenge);
            }
        } catch (error) {
            console.warn(`Failed to load challenge: ${entry.path}`, error);
        }
    }

    // Sort by dateAdded
    loadedChallenges.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));

    CHALLENGES = loadedChallenges;
    return loadedChallenges;
}

/**
 * Extract challenge object from JS code
 */
function extractChallenge(jsCode) {
    try {
        // Find the challenge object in the code
        const match = jsCode.match(/const challenge\s*=\s*(\{[\s\S]*?\});/);
        if (match) {
            // Safely evaluate the object
            return eval('(' + match[1] + ')');
        }
    } catch (e) {
        console.error('Error parsing challenge:', e);
    }
    return null;
}

/**
 * Load solution code from the actual source file
 */
async function loadSolutionCode(challenge) {
    try {
        const solutionPath = `${challenge.basePath}/${challenge.solutionFile}`;
        const response = await fetch(solutionPath);
        if (response.ok) {
            return await response.text();
        }
    } catch (error) {
        console.warn(`Failed to load solution: ${challenge.solutionFile}`, error);
    }
    return '// Solution file not found';
}

/**
 * Get today's challenge based on date
 */
function getTodaysChallenge() {
    if (CHALLENGES.length === 0) return null;
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % CHALLENGES.length;
    return CHALLENGES[index];
}

/**
 * Get challenges by category
 */
function getChallengesByCategory(category) {
    if (category === 'all') return CHALLENGES;
    return CHALLENGES.filter(c => c.category === category);
}

/**
 * Get challenge by ID
 */
function getChallengeById(id) {
    return CHALLENGES.find(c => c.id === id);
}

// Export functions
window.loadAllChallenges = loadAllChallenges;
window.loadSolutionCode = loadSolutionCode;
window.getTodaysChallenge = getTodaysChallenge;
window.getChallengesByCategory = getChallengesByCategory;
window.getChallengeById = getChallengeById;
window.CHALLENGES = CHALLENGES;
