/**
 * Patternbook knowledge base.
 *
 * Keep every note in this file so the site remains easy to publish on GitHub
 * Pages. A topic is intentionally compact: one prompt, one repeatable approach,
 * common traps, and a short interview-ready explanation.
 */

const TRACKS = [
    {
        id: "cloud",
        name: "Cloud systems",
        shortName: "Cloud",
        mark: "CL",
        color: "#b8d9ff",
        description: "Architecture patterns compared across AWS, Azure, and GCP.",
        topics: "Availability · identity · messaging"
    },
    {
        id: "data-platform",
        name: "Data platforms",
        shortName: "Data Platform",
        mark: "DP",
        color: "#ffcbb2",
        description: "Practical platform decisions across Databricks, Snowflake, and Fabric.",
        topics: "Architecture · pipelines · performance"
    },
    {
        id: "python",
        name: "Python patterns",
        shortName: "Python",
        mark: "PY",
        color: "#f9e293",
        description: "LeetCode patterns learned through signals, templates, and trade-offs.",
        topics: "Windows · graphs · heaps"
    },
    {
        id: "sql",
        name: "SQL reasoning",
        shortName: "SQL",
        mark: "SQ",
        color: "#d9cdfd",
        description: "Queries explained as transformations, not syntax to memorize.",
        topics: "Windows · dedup · sessions"
    },
    {
        id: "go",
        name: "Go concurrency",
        shortName: "Go",
        mark: "GO",
        color: "#bfe8cf",
        description: "Safe, bounded concurrency patterns for production systems.",
        topics: "Workers · cancellation · ownership"
    }
];

const TOPICS = [
    {
        id: "cloud-high-availability",
        track: "cloud",
        type: "System design",
        title: "Design for regional failure",
        difficulty: "Intermediate",
        minutes: 18,
        summary: "Build a highly available service without tying the reasoning to one cloud vendor.",
        prompt: "A customer-facing API must survive a zonal failure and recover from a regional failure with minimal data loss. Walk through your design.",
        approach: [
            "Start with explicit SLOs: target availability, RTO, RPO, and consistency needs.",
            "Spread stateless compute across zones behind a health-aware load balancer.",
            "Choose regional replication for data, then explain failover and split-brain controls.",
            "Add cross-region traffic routing, tested backups, and a rehearsed recovery runbook."
        ],
        pitfalls: [
            "Calling multi-zone the same as multi-region.",
            "Claiming zero RPO without synchronous cross-region writes and their latency cost.",
            "Designing failover that has never been exercised."
        ],
        answer: "I would make the normal path resilient to a zonal outage first, because it is the cheaper and more frequent failure domain. A separate regional recovery path is driven by the required RTO and RPO. Stateless services can be warm or active-active, while the data strategy depends on consistency. DNS or global routing is only the switch; replicated state, idempotent writes, and rehearsed recovery make the design credible.",
        tags: ["AWS", "Azure", "GCP", "RTO/RPO", "resilience"],
        platformMap: [
            "AWS: ALB + Multi-AZ compute + Aurora Global Database / DynamoDB global tables",
            "Azure: Front Door + zone-redundant compute + Cosmos DB multi-region / SQL failover groups",
            "GCP: Global external load balancer + regional MIG/GKE + Spanner / cross-region database replica"
        ]
    },
    {
        id: "cloud-least-privilege",
        track: "cloud",
        type: "Security scenario",
        title: "Reason about least privilege",
        difficulty: "Intermediate",
        minutes: 14,
        summary: "Turn a broad cloud permission into a small, reviewable access path.",
        prompt: "A data pipeline currently uses an administrator credential. How would you replace it without breaking production?",
        approach: [
            "Inventory the principal, actual API calls, resources, environments, and trust boundary.",
            "Use a workload identity and short-lived credentials instead of a stored user secret.",
            "Create read/write roles scoped by resource and condition; test in audit or shadow mode.",
            "Roll out gradually, monitor denied actions, then remove the administrator path."
        ],
        pitfalls: [
            "Treating a managed identity as automatically least-privileged.",
            "Scoping actions but leaving resources as a wildcard.",
            "Removing access before observing real workload behavior."
        ],
        answer: "Least privilege is a feedback loop, not a one-time policy document. I begin from observed calls, issue short-lived workload identity credentials, constrain both action and resource, and use conditions where possible. I validate the new policy alongside the old path, monitor denies, and only then revoke the administrator credential. Ownership and periodic access review keep it from expanding again.",
        tags: ["IAM", "Entra ID", "Cloud IAM", "security"],
        platformMap: [
            "AWS: IAM role + STS + resource policies + Access Analyzer",
            "Azure: managed identity + Azure RBAC + PIM / access reviews",
            "GCP: service account or workload identity + IAM Conditions + Policy Analyzer"
        ]
    },
    {
        id: "cloud-reliable-messaging",
        track: "cloud",
        type: "Architecture pattern",
        title: "Make message processing reliable",
        difficulty: "Advanced",
        minutes: 17,
        summary: "Handle retries, duplicates, poison messages, and backpressure explicitly.",
        prompt: "Orders are processed asynchronously. Consumers sometimes crash after charging a card but before acknowledging the message. Prevent double charges without losing orders.",
        approach: [
            "Assume at-least-once delivery and make the business operation idempotent.",
            "Store an idempotency key with the durable transaction before acknowledging the message.",
            "Use bounded retries with jitter, then isolate poison messages in a dead-letter queue.",
            "Expose queue age, retry count, dead-letter volume, and processing latency."
        ],
        pitfalls: [
            "Promising exactly-once behavior end to end.",
            "Retrying immediately and amplifying an outage.",
            "Using an in-memory deduplication cache as the source of truth."
        ],
        answer: "The broker can redeliver, so the consumer must make the charge operation idempotent. I use an order or payment attempt ID as the idempotency key and persist the result atomically with the local state transition. A duplicate returns the stored result. Retries are bounded and delayed; poison messages move to a dead-letter queue with enough context to replay safely.",
        tags: ["queues", "idempotency", "retries", "backpressure"],
        platformMap: [
            "AWS: SQS/SNS or EventBridge + DLQ",
            "Azure: Service Bus queues/topics + dead-letter subqueue",
            "GCP: Pub/Sub + dead-letter topic"
        ]
    },
    {
        id: "data-platform-selection",
        track: "data-platform",
        type: "Platform decision",
        title: "Choose the shape of a data platform",
        difficulty: "Intermediate",
        minutes: 20,
        summary: "Compare Databricks, Snowflake, and Fabric through workload needs and operating context.",
        prompt: "A company needs BI, streaming, data science, and governed self-service analytics. How would you evaluate Databricks, Snowflake, and Fabric?",
        approach: [
            "Separate workload needs: SQL BI, engineering, streaming, ML/AI, sharing, and operational serving.",
            "Map team skills, cloud strategy, ecosystem commitments, governance, and openness requirements.",
            "Prototype representative workloads and measure latency, concurrency, developer effort, and cost.",
            "Choose an operating model and migration path, not only a feature checklist."
        ],
        pitfalls: [
            "Declaring one platform universally best.",
            "Comparing list prices without workload behavior and idle time.",
            "Ignoring identity, lineage, CI/CD, and day-two operations."
        ],
        answer: "I would not start with product names. I first weight the actual workloads and constraints, then run a small bake-off using the same datasets and success measures. Databricks often fits engineering, open lakehouse, streaming, and ML-heavy teams; Snowflake is strong for managed SQL analytics, sharing, and low-ops elasticity; Fabric can be compelling for Microsoft-centered organizations seeking an integrated Power BI experience. The final choice includes governance and operating cost, not only query speed.",
        tags: ["Databricks", "Snowflake", "Fabric", "architecture"],
        platformMap: [
            "Databricks: lakehouse, Spark, Delta, streaming and ML/AI workflows",
            "Snowflake: managed data cloud, elastic SQL, sharing and separation of storage/compute",
            "Fabric: SaaS analytics suite, OneLake, Power BI and Microsoft ecosystem integration"
        ]
    },
    {
        id: "data-incremental-pipelines",
        track: "data-platform",
        type: "Pipeline pattern",
        title: "Build an incremental pipeline",
        difficulty: "Intermediate",
        minutes: 18,
        summary: "Process changes safely with checkpoints, idempotency, and late-data handling.",
        prompt: "A daily full refresh no longer finishes in its window. Redesign it for incremental processing while preserving correctness.",
        approach: [
            "Identify a trustworthy change signal: log sequence, commit version, update timestamp, or source CDC.",
            "Persist the processing boundary and make each write idempotent with MERGE or append plus deduplication.",
            "Define late-arrival and deletion behavior explicitly.",
            "Add reconciliation: source counts, freshness, duplicates, and periodic backfill tests."
        ],
        pitfalls: [
            "Using timestamps without overlap or clock-skew protection.",
            "Advancing the checkpoint before the target commit succeeds.",
            "Ignoring deletes and schema evolution."
        ],
        answer: "I choose a monotonic source boundary when possible, store it only after a successful target commit, and make replay safe. Each batch reads an overlap or version range, deduplicates by business key and sequence, and merges into the target. Late events have a defined watermark or correction path. Reconciliation metrics prove that the faster pipeline is still complete.",
        tags: ["CDC", "MERGE", "checkpoints", "late data"],
        platformMap: [
            "Databricks: Auto Loader / streaming tables + checkpoints + Delta MERGE",
            "Snowflake: streams + tasks / dynamic tables + MERGE",
            "Fabric: pipelines / Dataflow Gen2 + incremental refresh + Delta tables in OneLake"
        ]
    },
    {
        id: "data-performance",
        track: "data-platform",
        type: "Troubleshooting",
        title: "Diagnose a slow analytical query",
        difficulty: "Advanced",
        minutes: 16,
        summary: "Use the query profile to distinguish scan, shuffle, skew, spill, and concurrency problems.",
        prompt: "A dashboard query went from 8 seconds to 90 seconds after data volume doubled. What do you inspect, in what order?",
        approach: [
            "Confirm the regression and compare query plans, inputs, cache state, and concurrency.",
            "Locate the dominant operator: scan, join/shuffle, sort, spill, or queueing.",
            "Reduce data early, fix statistics and pruning, then address join strategy or skew.",
            "Scale compute last, after proving the workload is compute-bound."
        ],
        pitfalls: [
            "Increasing warehouse or cluster size before reading the profile.",
            "Optimizing an isolated query while production is queue-bound.",
            "Adding partitions with low selectivity or excessive small files."
        ],
        answer: "I first separate execution time from queue time and compare the old and new plans. Then I find where bytes and time accumulate: scanning too much, a join producing shuffle, a skewed key, or memory spill. I reduce data before joins, restore pruning and statistics, and fix layout or join logic. Scaling is a valid final lever, but only when the profile shows useful parallel work.",
        tags: ["query profile", "pruning", "skew", "cost"],
        platformMap: [
            "Databricks: Spark UI/query profile, Photon, liquid clustering, statistics",
            "Snowflake: Query Profile, pruning, clustering, warehouse/concurrency controls",
            "Fabric: Query Insights, V-Order, partitioning and capacity metrics"
        ]
    },
    {
        id: "python-sliding-window",
        track: "python",
        type: "LeetCode pattern",
        title: "Sliding window",
        difficulty: "Intermediate",
        minutes: 12,
        summary: "Recognize contiguous range problems and maintain only the state that changes.",
        prompt: "Given a string, return the length of the longest substring without repeating characters.",
        approach: [
            "The answer is a contiguous substring, which signals a window.",
            "Expand right; track the latest index of each character.",
            "When a duplicate appears inside the window, jump left past its previous index.",
            "Update the best length after restoring the invariant."
        ],
        pitfalls: [
            "Moving left backward when the duplicate is already outside the window.",
            "Rebuilding a set for each substring and falling back to O(n²).",
            "Updating the answer before the window is valid."
        ],
        answer: "The invariant is that the window contains unique characters. Each character enters once as right advances. A last-seen map lets left jump directly to max(left, previous + 1), so left never moves backward. That makes the solution O(n) time and O(k) space for the character set.",
        tags: ["array/string", "two pointers", "O(n)"],
        code: {
            language: "python",
            value: [
                "def longest_unique(s: str) -> int:",
                "    left = best = 0",
                "    last_seen = {}",
                "",
                "    for right, char in enumerate(s):",
                "        if char in last_seen:",
                "            left = max(left, last_seen[char] + 1)",
                "        last_seen[char] = right",
                "        best = max(best, right - left + 1)",
                "",
                "    return best"
            ].join("\n")
        }
    },
    {
        id: "python-graph-traversal",
        track: "python",
        type: "LeetCode pattern",
        title: "BFS or DFS?",
        difficulty: "Intermediate",
        minutes: 15,
        summary: "Choose traversal from the question: reachability, shortest hops, components, or path state.",
        prompt: "Given a grid of land and water, count the number of islands. Then explain how the solution changes if asked for the shortest path.",
        approach: [
            "Model cells as nodes and valid neighbor moves as edges.",
            "For each unvisited land cell, start a traversal and increment the component count.",
            "Mark visited when enqueuing or entering—not after processing—to avoid duplicates.",
            "Use BFS for shortest unweighted hops; DFS is sufficient for connectivity."
        ],
        pitfalls: [
            "Forgetting bounds or water checks.",
            "Marking visited too late and adding the same node many times.",
            "Using recursive DFS where input depth can overflow the stack."
        ],
        answer: "Counting islands is connected-components detection, so either BFS or DFS works in O(rows × columns). I scan the grid; every unseen land cell begins one traversal and therefore one island. For shortest path in an unweighted grid I switch to BFS, because it visits nodes in distance layers and the first arrival is shortest.",
        tags: ["graph", "grid", "BFS", "DFS"],
        code: {
            language: "python",
            value: [
                "from collections import deque",
                "",
                "def visit(grid, start, seen):",
                "    q = deque([start])",
                "    seen.add(start)",
                "    while q:",
                "        r, c = q.popleft()",
                "        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):",
                "            nxt = (r + dr, c + dc)",
                "            if is_land(grid, nxt) and nxt not in seen:",
                "                seen.add(nxt)",
                "                q.append(nxt)"
            ].join("\n")
        }
    },
    {
        id: "python-top-k",
        track: "python",
        type: "LeetCode pattern",
        title: "Top K with a heap",
        difficulty: "Intermediate",
        minutes: 13,
        summary: "Keep only the best k candidates instead of sorting everything.",
        prompt: "Return the k most frequent values in a large stream. Explain the trade-off between a heap and bucket sort.",
        approach: [
            "Count frequencies when the input is finite; for a stream, update counts incrementally.",
            "Maintain a min-heap of at most k frequency/value pairs.",
            "Replace the smallest candidate when a better one appears.",
            "State when bucket sort is preferable: bounded integer frequencies and O(n) extra space."
        ],
        pitfalls: [
            "Using a max-heap of all n values and losing the space advantage.",
            "Ignoring stable or tie-breaking requirements.",
            "Calling the approach streaming when exact changing counts require updates or recomputation."
        ],
        answer: "A size-k min-heap keeps the current threshold at the root. After counting m unique values, each candidate costs at most O(log k), so total work is O(n + m log k) and heap space is O(k). Bucket sort can be O(n), but allocates buckets by frequency and is less flexible when the score is not a small integer.",
        tags: ["heap", "frequency map", "streaming"],
        code: {
            language: "python",
            value: [
                "from collections import Counter",
                "import heapq",
                "",
                "def top_k(nums, k):",
                "    heap = []",
                "    for value, count in Counter(nums).items():",
                "        heapq.heappush(heap, (count, value))",
                "        if len(heap) > k:",
                "            heapq.heappop(heap)",
                "    return [value for _, value in heap]"
            ].join("\n")
        }
    },
    {
        id: "sql-top-n-per-group",
        track: "sql",
        type: "Query pattern",
        title: "Top N per group",
        difficulty: "Intermediate",
        minutes: 12,
        summary: "Rank rows within each business group, then filter in a separate query layer.",
        prompt: "Return the three highest-paid employees in each department, including deterministic tie handling.",
        approach: [
            "Define the group with PARTITION BY department.",
            "Define rank order with salary descending and an explicit tie-breaker.",
            "Choose ROW_NUMBER, RANK, or DENSE_RANK based on the tie requirement.",
            "Filter the rank in an outer query or QUALIFY where supported."
        ],
        pitfalls: [
            "Using LIMIT, which applies to the whole result.",
            "Leaving ties nondeterministic.",
            "Filtering before ranking and changing the population."
        ],
        answer: "This is a window-function problem because I need row detail and a calculation within each department. ROW_NUMBER gives exactly three rows when I add a stable tie-breaker. If the business wants all people tied for third, I use RANK or DENSE_RANK and explain the difference in skipped rank numbers.",
        tags: ["window functions", "ranking", "QUALIFY"],
        code: {
            language: "sql",
            value: [
                "WITH ranked AS (",
                "  SELECT",
                "    employee_id, department_id, salary,",
                "    ROW_NUMBER() OVER (",
                "      PARTITION BY department_id",
                "      ORDER BY salary DESC, employee_id",
                "    ) AS position",
                "  FROM employees",
                ")",
                "SELECT *",
                "FROM ranked",
                "WHERE position <= 3;"
            ].join("\n")
        }
    },
    {
        id: "sql-deduplicate",
        track: "sql",
        type: "Query pattern",
        title: "Keep the latest record",
        difficulty: "Intermediate",
        minutes: 13,
        summary: "Deduplicate by business key using an ordering that can be defended.",
        prompt: "An ingestion table contains multiple customer records per customer_id. Keep the latest valid version and explain how you handle exact ties.",
        approach: [
            "Name the business key and the event/version column separately.",
            "Rank within each business key by event time, ingestion time, then a stable sequence.",
            "Keep row number one; quarantine ambiguous exact ties if correctness matters.",
            "Make the downstream write idempotent."
        ],
        pitfalls: [
            "Using MAX(timestamp) then joining back and reintroducing duplicates.",
            "Treating ingestion time as event time without saying so.",
            "Using SELECT DISTINCT, which does not express which row wins."
        ],
        answer: "I use ROW_NUMBER because deduplication requires one winner. The ORDER BY must fully express recency and be deterministic; event version is stronger than arrival time when available. I also inspect exact ties instead of silently picking a row if they indicate a source-quality issue.",
        tags: ["deduplication", "ROW_NUMBER", "data quality"],
        code: {
            language: "sql",
            value: [
                "SELECT * EXCEPT (record_rank)",
                "FROM (",
                "  SELECT source.*,",
                "    ROW_NUMBER() OVER (",
                "      PARTITION BY customer_id",
                "      ORDER BY event_version DESC, ingested_at DESC",
                "    ) AS record_rank",
                "  FROM customer_updates AS source",
                ")",
                "WHERE record_rank = 1;"
            ].join("\n")
        }
    },
    {
        id: "sql-sessions",
        track: "sql",
        type: "Analytics pattern",
        title: "Sessionize event data",
        difficulty: "Advanced",
        minutes: 19,
        summary: "Detect boundaries with LAG, then turn boundary flags into stable groups.",
        prompt: "Group user events into sessions. A new session begins after more than 30 minutes of inactivity.",
        approach: [
            "Use LAG to read the prior event time within each user.",
            "Flag the first event or any gap greater than 30 minutes as a new session.",
            "Cumulatively sum the flag to create a session number.",
            "Aggregate by user and session number to produce start, end, and event count."
        ],
        pitfalls: [
            "Using greater-than-or-equal when the requirement says more than 30 minutes.",
            "Mixing timestamp time zones.",
            "Trying to nest window functions in one expression on engines that disallow it."
        ],
        answer: "Sessionization is a gaps-and-islands problem. I first identify gaps using LAG, then convert each boundary into 1. A running sum of those flags within a user produces the island ID. Keeping these as separate CTEs makes the ordering and window stages clear and portable.",
        tags: ["LAG", "running sum", "gaps and islands"],
        code: {
            language: "sql",
            value: [
                "WITH gaps AS (",
                "  SELECT events.*,",
                "    LAG(event_at) OVER (PARTITION BY user_id ORDER BY event_at) AS prev_at",
                "  FROM events",
                "), boundaries AS (",
                "  SELECT gaps.*,",
                "    CASE WHEN prev_at IS NULL",
                "      OR event_at > prev_at + INTERVAL '30 minutes' THEN 1 ELSE 0 END AS starts_new",
                "  FROM gaps",
                ")",
                "SELECT boundaries.*,",
                "  SUM(starts_new) OVER (PARTITION BY user_id ORDER BY event_at) AS session_id",
                "FROM boundaries;"
            ].join("\n")
        }
    },
    {
        id: "go-worker-pool",
        track: "go",
        type: "Concurrency pattern",
        title: "Bounded worker pool",
        difficulty: "Intermediate",
        minutes: 17,
        summary: "Limit concurrency, establish channel ownership, and collect every result safely.",
        prompt: "Process 100,000 jobs concurrently without opening 100,000 database connections. Design a Go worker pool.",
        approach: [
            "Choose the worker limit from the downstream resource, not CPU count alone.",
            "One producer owns and closes the jobs channel; workers only receive.",
            "Use a WaitGroup to know when workers finish, then close results from a coordinator.",
            "Propagate context cancellation and return structured errors."
        ],
        pitfalls: [
            "Letting receivers close a shared channel.",
            "Waiting for workers before draining an unbuffered results channel.",
            "Spawning one goroutine per item and calling it a worker pool."
        ],
        answer: "The pool bounds pressure on the database. A producer sends jobs and is the only owner that closes the jobs channel. N workers range over jobs and respect context cancellation. A separate coordinator waits for the workers and closes results, allowing the caller to range until completion without guessing counts. The worker number is tuned against connection limits and observed latency.",
        tags: ["goroutines", "channels", "WaitGroup", "backpressure"],
        code: {
            language: "go",
            value: [
                "func run(ctx context.Context, jobs <-chan Job, workers int) <-chan Result {",
                "    results := make(chan Result)",
                "    var wg sync.WaitGroup",
                "    wg.Add(workers)",
                "    for i := 0; i < workers; i++ {",
                "        go func() {",
                "            defer wg.Done()",
                "            for job := range jobs {",
                "                select {",
                "                case results <- process(job):",
                "                case <-ctx.Done(): return",
                "                }",
                "            }",
                "        }()",
                "    }",
                "    go func() { wg.Wait(); close(results) }()",
                "    return results",
                "}"
            ].join("\n")
        }
    },
    {
        id: "go-cancellation",
        track: "go",
        type: "Concurrency pattern",
        title: "Cancellation with context",
        difficulty: "Intermediate",
        minutes: 14,
        summary: "Make cancellation travel down the call tree and release every resource on the way out.",
        prompt: "An HTTP request fans out to three services. If the client disconnects or one required call fails, stop the remaining work.",
        approach: [
            "Accept context as the first parameter and do not store it in a struct.",
            "Derive a timeout at the request boundary and always defer cancel.",
            "Pass the context into outbound requests and select on ctx.Done in loops or sends.",
            "Use errgroup when sibling errors should cancel the shared group."
        ],
        pitfalls: [
            "Creating context.Background inside a request path and severing cancellation.",
            "Using context values for optional function parameters.",
            "Returning without stopping tickers, closing bodies, or unblocking goroutines."
        ],
        answer: "Context represents request-scoped cancellation and deadline, so I pass it through every blocking boundary. At the handler I derive a timeout and defer cancel. For related fan-out calls, errgroup gives a derived context that cancels siblings on the first error. Each goroutine must actually observe the context; otherwise cancellation exists only on paper.",
        tags: ["context", "errgroup", "timeouts", "cleanup"],
        code: {
            language: "go",
            value: [
                "group, ctx := errgroup.WithContext(request.Context())",
                "for _, endpoint := range endpoints {",
                "    endpoint := endpoint",
                "    group.Go(func() error {",
                "        req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)",
                "        if err != nil { return err }",
                "        response, err := client.Do(req)",
                "        if response != nil { defer response.Body.Close() }",
                "        return err",
                "    })",
                "}",
                "return group.Wait()"
            ].join("\n")
        }
    },
    {
        id: "go-goroutine-leaks",
        track: "go",
        type: "Debugging scenario",
        title: "Prevent goroutine leaks",
        difficulty: "Advanced",
        minutes: 16,
        summary: "Find goroutines blocked forever on I/O, channel operations, or missing termination signals.",
        prompt: "Memory and goroutine counts grow after traffic spikes but never return to baseline. How do you investigate and fix the leak?",
        approach: [
            "Confirm the trend with runtime metrics and capture goroutine profiles under load.",
            "Group repeated stack traces to find blocked channel sends, receives, locks, or I/O.",
            "Trace the lifecycle: who starts the goroutine, what stops it, and who owns each channel.",
            "Add cancellation, timeouts, bounded buffers, and a test that asserts goroutines settle."
        ],
        pitfalls: [
            "Increasing channel buffer size as the only fix.",
            "Closing a channel from multiple writers.",
            "Launching a goroutine without defining its exit condition."
        ],
        answer: "I use goroutine profiles to identify where the accumulating goroutines are blocked, then reason about ownership and termination. Every goroutine needs a bounded lifetime: completed work, closed input, or observed cancellation. A send must not wait forever when its consumer exits. After the fix, I load-test and assert that goroutine count returns near baseline rather than only checking functional output.",
        tags: ["pprof", "leaks", "channel ownership", "testing"]
    }
];

window.PATTERNBOOK = { tracks: TRACKS, topics: TOPICS };
