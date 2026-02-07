// DuckDB Challenge: Window Functions
// Solution file: window_functions.sql (in same folder)

const challenge = {
    id: "duckdb-001",
    title: "Analytics with DuckDB - Window Functions",
    category: "duckdb",
    categoryLabel: "DuckDB",
    difficulty: "intermediate",
    dateAdded: "2024-02-08",

    learningObjectives: [
        "DuckDB installation and setup",
        "Window functions (ROW_NUMBER, LAG, LEAD)",
        "Analytics queries"
    ],

    solutionFile: "window_functions.sql",
    language: "sql",

    problem: `
        <h3>The Challenge</h3>
        <p>Use DuckDB to analyze sales data and calculate running totals, rankings, and period-over-period changes.</p>
        
        <h3>Requirements</h3>
        <ul>
            <li>Create a sales table with: date, product, region, amount</li>
            <li>Calculate running total of sales per product</li>
            <li>Rank products by total sales within each region</li>
            <li>Calculate month-over-month change using LAG</li>
        </ul>
        
        <h3>How to Run</h3>
        <pre><code># Install DuckDB
pip install duckdb

# Run the SQL file
duckdb < window_functions.sql</code></pre>
    `,

    explanation: `
        <p><strong>Window Functions Explained:</strong></p>
        <ul>
            <li><strong>PARTITION BY:</strong> Divides rows into groups (like GROUP BY but keeps individual rows)</li>
            <li><strong>ORDER BY:</strong> Defines the order within each partition</li>
            <li><strong>SUM() OVER:</strong> Calculates running totals across ordered rows</li>
            <li><strong>LAG():</strong> Accesses previous row's value - perfect for period-over-period comparisons</li>
            <li><strong>RANK():</strong> Assigns rankings within partitions</li>
        </ul>
        <p><strong>Why DuckDB?</strong> DuckDB is an embedded analytical database - runs in-process, no server needed. Perfect for data analysis and learning SQL analytics!</p>
    `
};

if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
