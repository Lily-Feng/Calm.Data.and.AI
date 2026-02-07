// Python Challenge: Async HTTP Client
// Solution file: async_http_client.py (in same folder)

const challenge = {
    id: "py-001",
    title: "Async HTTP Client with aiohttp",
    category: "python",
    categoryLabel: "Python",
    difficulty: "intermediate",
    dateAdded: "2024-02-07",

    learningObjectives: [
        "Python async/await syntax",
        "aiohttp library",
        "Concurrent I/O operations"
    ],

    solutionFile: "async_http_client.py",
    language: "python",

    problem: `
        <h3>The Challenge</h3>
        <p>Build an async HTTP client using Python's <code>aiohttp</code> library that can fetch multiple APIs concurrently.</p>
        
        <h3>Requirements</h3>
        <ul>
            <li>Use <code>async/await</code> syntax</li>
            <li>Fetch multiple URLs concurrently with <code>asyncio.gather()</code></li>
            <li>Handle exceptions gracefully for failed requests</li>
            <li>Add timeout handling (5 second timeout per request)</li>
        </ul>
        
        <h3>Example Output</h3>
        <pre><code>🚀 Fetching URLs concurrently...
✅ https://api.github.com: Status=200, Size=2345
✅ https://httpbin.org/get: Status=200, Size=456
❌ https://httpbin.org/delay/10: Timeout</code></pre>
    `,

    explanation: `
        <p><strong>Key Concepts Demonstrated:</strong></p>
        <ul>
            <li><strong>async/await:</strong> Python's syntax for asynchronous programming. Functions marked <code>async</code> can use <code>await</code> to pause execution.</li>
            <li><strong>aiohttp:</strong> Async HTTP client library - much faster than <code>requests</code> for concurrent operations.</li>
            <li><strong>asyncio.gather():</strong> Runs multiple coroutines concurrently and waits for all to complete.</li>
            <li><strong>Context Managers:</strong> <code>async with</code> ensures proper cleanup of sessions and connections.</li>
        </ul>
        <p><strong>When to Use:</strong> Use async when you have I/O-bound operations (HTTP requests, database queries, file operations) that can run concurrently.</p>
    `
};

if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
