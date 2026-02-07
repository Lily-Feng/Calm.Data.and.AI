# Code365 - Agent Guide

Instructions for AI agents to add new coding challenges to this platform.

## Architecture Overview

```
challenges/
├── languages/{lang}/
│   ├── {lang}-001.js     ← Metadata (problem, explanation, objectives)
│   └── solution.{ext}     ← Actual runnable code file
├── frameworks/
├── databases/
├── bigdata/
└── ml/

js/
├── challenges.js          ← CHALLENGE_INDEX (register challenges here)
└── app.js                 ← Loads challenges, fetches solution files
```

## How It Works

1. **Index** (`js/challenges.js`): Lists paths to all challenge `.js` files
2. **On page load**: `loadAllChallenges()` fetches each `.js` file, parses metadata
3. **Solution display**: `loadSolutionCode()` fetches the actual source file as text
4. **Rendering**: Code inserted into `<code>` element, Prism.js highlights it

## Adding a New Challenge

### Step 1: Create the solution file

```bash
# Create the actual runnable code
vim challenges/languages/rust/my_solution.rs
```

### Step 2: Create the metadata file

Create `challenges/languages/rust/rust-002.js`:

```javascript
// Description comment at top
// Solution file: my_solution.rs (in same folder)

const challenge = {
    id: "rust-002",                    // Unique: {category}-{number}
    title: "Challenge Title",
    category: "rust",                  // Must match sidebar categories
    categoryLabel: "Rust",             // Display name
    difficulty: "beginner",            // beginner | intermediate | advanced
    dateAdded: "2024-02-12",           // YYYY-MM-DD
    
    learningObjectives: [
        "Objective 1",
        "Objective 2"
    ],
    
    solutionFile: "my_solution.rs",    // File in same folder
    language: "rust",                  // For Prism.js syntax highlighting
    
    problem: `
        <h3>The Challenge</h3>
        <p>Description...</p>
        
        <h3>Requirements</h3>
        <ul>
            <li>Requirement 1</li>
        </ul>
    `,
    
    explanation: `
        <p><strong>Key Concepts:</strong></p>
        <ul>
            <li>Concept explanation</li>
        </ul>
    `
};

if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
```

### Step 3: Register in index

Edit `js/challenges.js`, add to `CHALLENGE_INDEX`:

```javascript
const CHALLENGE_INDEX = [
    // ... existing entries ...
    { path: "challenges/languages/rust/rust-002.js" },  // ADD THIS
];
```

## Category Reference

| Category | `category` value | `language` (syntax) |
|----------|------------------|---------------------|
| Go | `go` | `go` |
| Python | `python` | `python` |
| Rust | `rust` | `rust` |
| TypeScript | `typescript` | `typescript` |
| Scala | `scala` | `scala` |
| C# | `csharp` | `csharp` |
| C++ | `cpp` | `cpp` |
| Java | `java` | `java` |
| React | `react` | `typescript` |
| Angular | `angular` | `typescript` |
| Spring Boot | `springboot` | `java` |
| FastAPI | `fastapi` | `python` |
| DuckDB | `duckdb` | `sql` |
| PostgreSQL | `postgresql` | `sql` |
| Spark | `spark` | `python` |
| Iceberg | `iceberg` | `python` |
| Delta Lake | `delta` | `python` |
| PyTorch | `pytorch` | `python` |
| TensorFlow | `tensorflow` | `python` |
| Databricks | `databricks` | `python` |

## Guidelines for Good Challenges

1. **Pick problems that showcase the technology's strengths**
   - Rust: ownership, memory safety
   - Go: concurrency, goroutines
   - Spark: large-scale data processing
   - DuckDB: analytical queries, window functions

2. **Include "How to Run" in problem section**
   ```html
   <h3>How to Run</h3>
   <pre><code>rustc solution.rs && ./solution</code></pre>
   ```

3. **Make explanation educational**
   - Explain WHY, not just WHAT
   - Compare to other languages when relevant
   - Highlight key concepts

4. **Solution file should be fully runnable**
   - Include all imports
   - Include a `main()` function
   - Add helpful comments
