// Spark Challenge: DataFrame Basics
// Solution file: dataframe_basics.py (in same folder)

const challenge = {
    id: "spark-001",
    title: "Spark DataFrame Basics",
    category: "spark",
    categoryLabel: "Apache Spark",
    difficulty: "beginner",
    dateAdded: "2024-02-09",

    learningObjectives: [
        "Creating Spark DataFrames",
        "Basic transformations (filter, select, groupBy)",
        "Actions (show, count, collect)"
    ],

    solutionFile: "dataframe_basics.py",
    language: "python",

    problem: `
        <h3>The Challenge</h3>
        <p>Learn Spark DataFrame fundamentals by analyzing a dataset of user events.</p>
        
        <h3>Requirements</h3>
        <ul>
            <li>Create a DataFrame from sample data</li>
            <li>Filter events by type</li>
            <li>Group by user and count events</li>
            <li>Calculate aggregations (sum, avg)</li>
        </ul>
        
        <h3>How to Run</h3>
        <pre><code># Install PySpark
pip install pyspark

# Run the script
python dataframe_basics.py</code></pre>
    `,

    explanation: `
        <p><strong>Spark DataFrame Concepts:</strong></p>
        <ul>
            <li><strong>SparkSession:</strong> Entry point for Spark - creates the connection to Spark cluster (or local mode)</li>
            <li><strong>Transformations (lazy):</strong> <code>filter()</code>, <code>select()</code>, <code>groupBy()</code> - define what to do, but don't execute</li>
            <li><strong>Actions (eager):</strong> <code>show()</code>, <code>count()</code>, <code>collect()</code> - trigger actual computation</li>
            <li><strong>col():</strong> References a column by name for use in expressions</li>
        </ul>
        <p><strong>Key Insight:</strong> Spark uses lazy evaluation - transformations build up a query plan, actions execute it. This enables optimization!</p>
    `
};

if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
