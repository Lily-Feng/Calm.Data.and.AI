/**
 * Patternbook manifest.
 *
 * TRACKS and guide metadata only. Each guide's body lives in its own
 * fragment at guides/<id>.html (see guides/README.md for the authoring
 * contract) and is fetched at runtime by js/app.js.
 */

const TRACKS = [
    {
        "id": "cloud",
        "name": "Cloud systems",
        "shortName": "Cloud",
        "mark": "CL",
        "color": "#b8d9ff",
        "description": "Architecture patterns compared across AWS, Azure, and GCP.",
        "topics": "Availability · identity · messaging"
    },
    {
        "id": "data-platform",
        "name": "Data platforms",
        "shortName": "Data Platform",
        "mark": "DP",
        "color": "#ffcbb2",
        "description": "Practical platform decisions across Databricks, Snowflake, and Fabric.",
        "topics": "Architecture · pipelines · performance"
    },
    {
        "id": "python",
        "name": "Python patterns",
        "shortName": "Python",
        "mark": "PY",
        "color": "#f9e293",
        "description": "LeetCode patterns learned through signals, templates, and trade-offs.",
        "topics": "Windows · graphs · heaps"
    },
    {
        "id": "sql",
        "name": "SQL reasoning",
        "shortName": "SQL",
        "mark": "SQ",
        "color": "#d9cdfd",
        "description": "Queries explained as transformations, not syntax to memorize.",
        "topics": "Windows · dedup · sessions"
    },
    {
        "id": "go",
        "name": "Go concurrency",
        "shortName": "Go",
        "mark": "GO",
        "color": "#bfe8cf",
        "description": "Safe, bounded concurrency patterns for production systems.",
        "topics": "Workers · cancellation · ownership"
    }
];

const GUIDES = [
    {
        id: "cloud-high-availability",
        track: "cloud",
        type: "System design",
        title: "Design for regional failure",
        difficulty: "Intermediate",
        minutes: 18,
        summary: "Build a highly available service without tying the reasoning to one cloud vendor.",
        tags: ["AWS", "Azure", "GCP", "RTO/RPO", "resilience"],
        bodyUrl: "guides/cloud-high-availability.html"
    },
    {
        id: "cloud-least-privilege",
        track: "cloud",
        type: "Security scenario",
        title: "Reason about least privilege",
        difficulty: "Intermediate",
        minutes: 14,
        summary: "Turn a broad cloud permission into a small, reviewable access path.",
        tags: ["IAM", "Entra ID", "Cloud IAM", "security"],
        bodyUrl: "guides/cloud-least-privilege.html"
    },
    {
        id: "cloud-reliable-messaging",
        track: "cloud",
        type: "Architecture pattern",
        title: "Make message processing reliable",
        difficulty: "Advanced",
        minutes: 17,
        summary: "Handle retries, duplicates, poison messages, and backpressure explicitly.",
        tags: ["queues", "idempotency", "retries", "backpressure"],
        bodyUrl: "guides/cloud-reliable-messaging.html"
    },
    {
        id: "data-platform-selection",
        track: "data-platform",
        type: "Platform decision",
        title: "Choose the shape of a data platform",
        difficulty: "Intermediate",
        minutes: 20,
        summary: "Compare Databricks, Snowflake, and Fabric through workload needs and operating context.",
        tags: ["Databricks", "Snowflake", "Fabric", "architecture"],
        bodyUrl: "guides/data-platform-selection.html"
    },
    {
        id: "data-incremental-pipelines",
        track: "data-platform",
        type: "Pipeline pattern",
        title: "Build an incremental pipeline",
        difficulty: "Intermediate",
        minutes: 18,
        summary: "Process changes safely with checkpoints, idempotency, and late-data handling.",
        tags: ["CDC", "MERGE", "checkpoints", "late data"],
        bodyUrl: "guides/data-incremental-pipelines.html"
    },
    {
        id: "data-performance",
        track: "data-platform",
        type: "Troubleshooting",
        title: "Diagnose a slow analytical query",
        difficulty: "Advanced",
        minutes: 16,
        summary: "Use the query profile to distinguish scan, shuffle, skew, spill, and concurrency problems.",
        tags: ["query profile", "pruning", "skew", "cost"],
        bodyUrl: "guides/data-performance.html"
    },
    {
        id: "python-sliding-window",
        track: "python",
        type: "LeetCode pattern",
        title: "Sliding window",
        difficulty: "Intermediate",
        minutes: 12,
        summary: "Recognize contiguous range problems and maintain only the state that changes.",
        tags: ["array/string", "two pointers", "O(n)"],
        bodyUrl: "guides/python-sliding-window.html"
    },
    {
        id: "python-graph-traversal",
        track: "python",
        type: "LeetCode pattern",
        title: "BFS or DFS?",
        difficulty: "Intermediate",
        minutes: 15,
        summary: "Choose traversal from the question: reachability, shortest hops, components, or path state.",
        tags: ["graph", "grid", "BFS", "DFS"],
        bodyUrl: "guides/python-graph-traversal.html"
    },
    {
        id: "python-top-k",
        track: "python",
        type: "LeetCode pattern",
        title: "Top K with a heap",
        difficulty: "Intermediate",
        minutes: 13,
        summary: "Keep only the best k candidates instead of sorting everything.",
        tags: ["heap", "frequency map", "streaming"],
        bodyUrl: "guides/python-top-k.html"
    },
    {
        id: "sql-top-n-per-group",
        track: "sql",
        type: "Query pattern",
        title: "Top N per group",
        difficulty: "Intermediate",
        minutes: 12,
        summary: "Rank rows within each business group, then filter in a separate query layer.",
        tags: ["window functions", "ranking", "QUALIFY"],
        bodyUrl: "guides/sql-top-n-per-group.html"
    },
    {
        id: "sql-deduplicate",
        track: "sql",
        type: "Query pattern",
        title: "Keep the latest record",
        difficulty: "Intermediate",
        minutes: 13,
        summary: "Deduplicate by business key using an ordering that can be defended.",
        tags: ["deduplication", "ROW_NUMBER", "data quality"],
        bodyUrl: "guides/sql-deduplicate.html"
    },
    {
        id: "sql-sessions",
        track: "sql",
        type: "Analytics pattern",
        title: "Sessionize event data",
        difficulty: "Advanced",
        minutes: 19,
        summary: "Detect boundaries with LAG, then turn boundary flags into stable groups.",
        tags: ["LAG", "running sum", "gaps and islands"],
        bodyUrl: "guides/sql-sessions.html"
    },
    {
        id: "go-worker-pool",
        track: "go",
        type: "Concurrency pattern",
        title: "Bounded worker pool",
        difficulty: "Intermediate",
        minutes: 17,
        summary: "Limit concurrency, establish channel ownership, and collect every result safely.",
        tags: ["goroutines", "channels", "WaitGroup", "backpressure"],
        bodyUrl: "guides/go-worker-pool.html"
    },
    {
        id: "go-cancellation",
        track: "go",
        type: "Concurrency pattern",
        title: "Cancellation with context",
        difficulty: "Intermediate",
        minutes: 14,
        summary: "Make cancellation travel down the call tree and release every resource on the way out.",
        tags: ["context", "errgroup", "timeouts", "cleanup"],
        bodyUrl: "guides/go-cancellation.html"
    },
    {
        id: "go-goroutine-leaks",
        track: "go",
        type: "Debugging scenario",
        title: "Prevent goroutine leaks",
        difficulty: "Advanced",
        minutes: 16,
        summary: "Find goroutines blocked forever on I/O, channel operations, or missing termination signals.",
        tags: ["pprof", "leaks", "channel ownership", "testing"],
        bodyUrl: "guides/go-goroutine-leaks.html"
    }
];

window.PATTERNBOOK = { tracks: TRACKS, topics: GUIDES };
