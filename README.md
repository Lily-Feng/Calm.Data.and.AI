# 🚀 Code365 - Daily Coding Challenges

Learn something new every day through bite-sized coding challenges with real, runnable code.

## 🏃 Quick Start

```bash
# Start a local server (required for loading files)
python3 -m http.server 8080
# Open http://localhost:8080
```

## 📝 Adding a New Challenge

### Step 1: Create the solution file

```bash
# Example: Add a Scala challenge
echo 'object MyApp extends App { println("Hello!") }' > challenges/languages/scala/collections.scala
```

### Step 2: Create the challenge metadata file

Create `challenges/languages/scala/scala-001.js`:

```javascript
// Scala Challenge: Functional Collections
// Solution file: collections.scala (in same folder)

const challenge = {
    id: "scala-001",
    title: "Functional Collections in Scala",
    category: "scala",
    categoryLabel: "Scala",
    difficulty: "beginner",  // beginner | intermediate | advanced
    dateAdded: "2024-02-12",
    
    learningObjectives: [
        "map, filter, reduce",
        "Immutable collections",
        "Pattern matching"
    ],
    
    solutionFile: "collections.scala",  // File in same folder
    language: "scala",                   // For syntax highlighting
    
    problem: `
        <h3>The Challenge</h3>
        <p>Your problem description here...</p>
        
        <h3>Requirements</h3>
        <ul>
            <li>Requirement 1</li>
            <li>Requirement 2</li>
        </ul>
    `,
    
    explanation: `
        <p><strong>Key Concepts:</strong></p>
        <ul>
            <li>Concept 1</li>
            <li>Concept 2</li>
        </ul>
    `
};

if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
```

### Step 3: Register in the index

Edit `js/challenges.js` and add to `CHALLENGE_INDEX`:

```javascript
const CHALLENGE_INDEX = [
    // ... existing challenges ...
    { path: "challenges/languages/scala/scala-001.js" },  // Add this!
];
```

### Step 4: Commit & Push

```bash
git add .
git commit -m "Add Scala collections challenge"
git push
```

## 📂 Project Structure

```
GenAI-learning/
├── index.html
├── js/
│   ├── challenges.js       # Index of all challenges
│   └── app.js              # Application logic
├── challenges/
│   ├── languages/
│   │   ├── go/
│   │   │   ├── go-001.js           # Challenge metadata
│   │   │   └── concurrent_scraper.go  # Solution file
│   │   ├── python/
│   │   │   ├── py-001.js
│   │   │   └── async_http_client.py
│   │   └── ...
│   ├── frameworks/
│   ├── databases/
│   ├── bigdata/
│   └── ml/
└── README.md
```

## 🎨 Categories

| Category | Key | Syntax |
|----------|-----|--------|
| Go | `go` | `go` |
| Python | `python` | `python` |
| Scala | `scala` | `scala` |
| TypeScript | `typescript` | `typescript` |
| React | `react` | `typescript` |
| DuckDB | `duckdb` | `sql` |
| Spark | `spark` | `python` |
| Iceberg | `iceberg` | `python` |
| Delta Lake | `delta` | `python` |
| PyTorch | `pytorch` | `python` |

## 📅 Daily Rotation

Uses `dayOfYear % totalChallenges` to pick today's challenge - everyone sees the same challenge each day!
