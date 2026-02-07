// Go Challenge: Concurrent Web Scraper
// Solution file: concurrent_scraper.go (in same folder)

const challenge = {
    id: "go-001",
    title: "Concurrent Web Scraper with Goroutines",
    category: "go",
    categoryLabel: "Go",
    difficulty: "intermediate",
    dateAdded: "2024-02-06",

    learningObjectives: [
        "Goroutines and channels",
        "HTTP requests in Go",
        "Worker pool pattern"
    ],

    solutionFile: "concurrent_scraper.go",
    language: "go",

    problem: `
        <h3>The Challenge</h3>
        <p>Build a concurrent web scraper in Go that can fetch multiple URLs simultaneously using goroutines.</p>
        
        <h3>Requirements</h3>
        <ul>
            <li>Accept a list of URLs as input</li>
            <li>Fetch all URLs concurrently using goroutines</li>
            <li>Use a channel to collect results</li>
            <li>Implement a worker pool with max 3 concurrent workers</li>
            <li>Return the response status code and content length for each URL</li>
        </ul>
        
        <h3>Example Usage</h3>
        <pre><code>urls := []string{
    "https://golang.org",
    "https://google.com",
    "https://github.com",
}
results := FetchAll(urls, 3)
// Results: [{URL: "https://golang.org", Status: 200, Size: 12345}, ...]</code></pre>
    `,

    explanation: `
        <p><strong>Key Concepts Demonstrated:</strong></p>
        <ul>
            <li><strong>Goroutines:</strong> Lightweight threads managed by Go runtime. We spawn multiple workers as goroutines.</li>
            <li><strong>Channels:</strong> Used for communication between goroutines - <code>urlChan</code> distributes work, <code>resultChan</code> collects results.</li>
            <li><strong>Worker Pool Pattern:</strong> Instead of spawning unlimited goroutines, we limit to <code>maxWorkers</code> to prevent overwhelming the system.</li>
            <li><strong>sync.WaitGroup:</strong> Coordinates waiting for all workers to finish before closing the results channel.</li>
        </ul>
        <p><strong>Why This Pattern?</strong> Worker pools prevent resource exhaustion when dealing with many concurrent tasks, making your Go programs more efficient and predictable.</p>
    `
};

// Export for the loader
if (typeof window !== 'undefined') {
    window.__CHALLENGE__ = challenge;
}
