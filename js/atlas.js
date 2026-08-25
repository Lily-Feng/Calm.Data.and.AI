/**
 * Calm Data and AI atlas taxonomy.
 *
 * This file describes the knowledge graph: domains, clusters, concepts, and
 * the detailed guides they connect to. Detailed guide content remains in
 * knowledge.js so the map and the articles can evolve independently.
 */

const ATLAS = {
    root: {
        title: "Engineering Knowledge",
        summary: "The reusable mental models behind reliable platforms, clear code, and strong technical decisions."
    },
    domains: {
        cloud: {
            thesis: "Design from workload requirements and failure domains; translate the pattern to each provider only after the architecture is clear.",
            principles: ["Requirements before services", "Failure domains are design inputs", "Identity is the control plane"],
            clusters: [
                {
                    id: "cloud-foundations",
                    label: "Cloud foundations",
                    summary: "The vocabulary and boundaries used to reason about every cloud design.",
                    nodes: [
                        { id: "shared-responsibility", label: "Shared responsibility", summary: "Separate provider-owned controls from the configuration, data, identity, and application risks you still own." },
                        { id: "failure-domains", label: "Regions & zones", summary: "Treat zones and regions as distinct blast-radius and recovery boundaries." },
                        { id: "resource-hierarchy", label: "Resource hierarchy", summary: "Use organization, account/subscription/project, environment, naming, and tags as governance primitives." }
                    ]
                },
                {
                    id: "cloud-compute",
                    label: "Compute & placement",
                    summary: "Choose an execution model by workload shape, operational control, and scaling behavior.",
                    nodes: [
                        { id: "stateless-scaling", label: "Stateless scaling", summary: "Externalize durable state so instances can scale, fail, and be replaced independently." },
                        { id: "compute-spectrum", label: "VM → container → function", summary: "Trade control and portability against operational effort and event-driven constraints." },
                        { id: "workload-placement", label: "Workload placement", summary: "Place latency-sensitive, regulated, bursty, and data-intensive work using explicit constraints." }
                    ]
                },
                {
                    id: "cloud-networking",
                    label: "Networking",
                    summary: "Control reachability and traffic flow before optimizing individual services.",
                    nodes: [
                        { id: "network-boundaries", label: "Network boundaries", summary: "Design address space, segmentation, ingress, and egress around trust zones." },
                        { id: "private-connectivity", label: "Private connectivity", summary: "Connect workloads and managed services without unnecessarily exposing public endpoints." },
                        { id: "global-routing", label: "DNS & global routing", summary: "Use health-aware routing to direct traffic, while recognizing that routing alone does not replicate state." }
                    ]
                },
                {
                    id: "cloud-data",
                    label: "Data & messaging",
                    summary: "Match persistence and communication guarantees to the business invariant.",
                    nodes: [
                        { id: "storage-selection", label: "Storage selection", summary: "Choose object, block, file, relational, document, or key-value storage from access patterns." },
                        { id: "consistency-replication", label: "Consistency & replication", summary: "Explain where consistency is required and what latency or availability trade-off replication introduces." },
                        { id: "reliable-messaging", label: "Reliable messaging", summary: "Design for duplicates, retries, poison messages, ordering, and backpressure.", guide: "cloud-reliable-messaging" }
                    ]
                },
                {
                    id: "cloud-security",
                    label: "Identity & security",
                    summary: "Make identity, policy, secrets, and evidence part of the architecture.",
                    nodes: [
                        { id: "least-privilege", label: "Least privilege", summary: "Reduce broad access to observable, short-lived, resource-scoped permissions.", guide: "cloud-least-privilege" },
                        { id: "secrets-encryption", label: "Secrets & encryption", summary: "Manage keys and secrets through dedicated services, rotation, and explicit access paths." },
                        { id: "policy-guardrails", label: "Policy guardrails", summary: "Use preventive controls, detection, and reviewable exceptions at the right organizational layer." }
                    ]
                },
                {
                    id: "cloud-reliability",
                    label: "Reliability & operations",
                    summary: "Connect availability goals to redundancy, recovery, observability, and cost.",
                    nodes: [
                        { id: "slos-error-budgets", label: "SLOs & error budgets", summary: "Turn reliability into a measurable product decision instead of a vague aspiration." },
                        { id: "regional-failure", label: "Regional failure", summary: "Separate zonal high availability from cross-region disaster recovery.", guide: "cloud-high-availability" },
                        { id: "observability-finops", label: "Observability & FinOps", summary: "Make health, ownership, unit cost, and capacity visible enough to guide decisions." }
                    ]
                }
            ]
        },
        "data-platform": {
            thesis: "Build a governed path from source change to trusted consumption, then select platform products by workload and operating model.",
            principles: ["Start from workload and data contracts", "Separate storage, compute, and semantics", "Governance must travel with the data"],
            clusters: [
                {
                    id: "data-architecture",
                    label: "Platform architecture",
                    summary: "Define the platform shape before comparing products.",
                    nodes: [
                        { id: "lakehouse-warehouse", label: "Lakehouse vs warehouse", summary: "Compare openness, workload breadth, management model, and data-copy patterns." },
                        { id: "data-layers", label: "Data layers", summary: "Separate raw fidelity, validated reusable data, and consumption-ready products without copying blindly." },
                        { id: "platform-selection", label: "Platform selection", summary: "Evaluate Databricks, Snowflake, and Fabric using representative workloads and operating constraints.", guide: "data-platform-selection" }
                    ]
                },
                {
                    id: "data-ingestion",
                    label: "Ingestion & change",
                    summary: "Bring data in with explicit freshness, replay, and correctness guarantees.",
                    nodes: [
                        { id: "batch-cdc-stream", label: "Batch, CDC & streaming", summary: "Choose the simplest change-delivery model that meets freshness and recovery needs." },
                        { id: "incremental-processing", label: "Incremental processing", summary: "Use durable boundaries and idempotent writes so changed data can be replayed safely.", guide: "data-incremental-pipelines" },
                        { id: "schema-contracts", label: "Schema contracts", summary: "Treat schema, compatibility, ownership, and quality expectations as producer-consumer agreements." }
                    ]
                },
                {
                    id: "data-storage",
                    label: "Storage & layout",
                    summary: "Organize physical data so engines can prune, compact, evolve, and share it.",
                    nodes: [
                        { id: "files-table-formats", label: "Files & table formats", summary: "Understand how Parquet plus a transactional table layer provides snapshots, schema evolution, and concurrency." },
                        { id: "partition-cluster", label: "Partition & cluster", summary: "Align layout with selective access patterns without creating tiny files or high-cardinality partitions." },
                        { id: "retention-recovery", label: "Retention & recovery", summary: "Balance time travel, compliance deletion, backup, and storage cost." }
                    ]
                },
                {
                    id: "data-processing",
                    label: "Processing & quality",
                    summary: "Make transformations testable, observable, and safe to rerun.",
                    nodes: [
                        { id: "transformation-model", label: "Transformation model", summary: "Choose SQL, Spark, streaming, and procedural tools according to data shape and team ownership." },
                        { id: "orchestration", label: "Orchestration", summary: "Coordinate dependencies, retries, backfills, parameters, and operational ownership." },
                        { id: "quality-lineage", label: "Quality & lineage", summary: "Measure data contracts and trace where outputs came from, who owns them, and what breaks downstream." }
                    ]
                },
                {
                    id: "data-serving",
                    label: "Serving & semantics",
                    summary: "Expose trusted data through interfaces suited to analytics, applications, and AI.",
                    nodes: [
                        { id: "semantic-layer", label: "Semantic layer", summary: "Centralize governed metric definitions without hiding the data grain and filters." },
                        { id: "data-products-sharing", label: "Data products & sharing", summary: "Publish discoverable, owned interfaces instead of distributing unmanaged extracts." },
                        { id: "ai-feature-serving", label: "AI & feature serving", summary: "Connect offline training data to consistent online or batch inference paths." }
                    ]
                },
                {
                    id: "data-operations",
                    label: "Governance & performance",
                    summary: "Operate the platform through identity, evidence, workload isolation, and cost visibility.",
                    nodes: [
                        { id: "catalog-access", label: "Catalog & access", summary: "Apply identity-aware discovery, ownership, row/column controls, and audit evidence." },
                        { id: "query-diagnosis", label: "Query diagnosis", summary: "Distinguish scan, shuffle, skew, spill, and queueing before applying a fix.", guide: "data-performance" },
                        { id: "workload-cost", label: "Workload & cost", summary: "Isolate competing workloads and optimize useful work per unit cost, not only raw speed." }
                    ]
                }
            ]
        },
        python: {
            thesis: "Recognize the structural signal in a problem, state the invariant, then choose the smallest data structure that maintains it.",
            principles: ["Pattern recognition beats memorization", "State the invariant before coding", "Complexity follows the operations"],
            clusters: [
                {
                    id: "python-foundations",
                    label: "Reasoning foundations",
                    summary: "The analysis habits behind every strong coding solution.",
                    nodes: [
                        { id: "complexity", label: "Time & space complexity", summary: "Count dominant operations and explain the input characteristic that drives them." },
                        { id: "python-semantics", label: "Python semantics", summary: "Use mutability, hashing, slicing, iteration, and object identity intentionally." },
                        { id: "edge-cases", label: "Constraints & edge cases", summary: "Convert constraints into algorithm choices and tests before writing the main loop." }
                    ]
                },
                {
                    id: "python-sequences",
                    label: "Sequences",
                    summary: "Exploit ordering and contiguous structure in arrays and strings.",
                    nodes: [
                        { id: "two-pointers", label: "Two pointers", summary: "Move coordinated indices when order lets you discard impossible candidates." },
                        { id: "sliding-window", label: "Sliding window", summary: "Maintain a valid contiguous range by updating only the state that enters or leaves.", guide: "python-sliding-window" },
                        { id: "prefix-sums", label: "Prefix sums", summary: "Turn repeated range calculations into differences between accumulated boundaries." }
                    ]
                },
                {
                    id: "python-lookup-order",
                    label: "Lookup & ordering",
                    summary: "Trade memory for fast membership, frequency, threshold, and order operations.",
                    nodes: [
                        { id: "hash-maps", label: "Hash maps & sets", summary: "Use key-based lookup to replace repeated scans and track membership or frequency." },
                        { id: "heaps-top-k", label: "Heaps & Top K", summary: "Maintain the current threshold when only the best k candidates matter.", guide: "python-top-k" },
                        { id: "binary-search", label: "Binary search", summary: "Search a sorted space or a monotonic answer predicate by proving which half can be discarded." }
                    ]
                },
                {
                    id: "python-structures",
                    label: "Core structures",
                    summary: "Map structure-specific operations to the behavior the problem requires.",
                    nodes: [
                        { id: "stack-queue", label: "Stacks & queues", summary: "Use LIFO for unresolved nested work and FIFO for arrival order or breadth layers." },
                        { id: "linked-lists", label: "Linked lists", summary: "Manipulate local pointer relationships with sentinels, slow/fast pointers, and explicit ownership." },
                        { id: "trees-bst", label: "Trees & BSTs", summary: "Choose traversal order from when a node's value must be processed relative to its children." }
                    ]
                },
                {
                    id: "python-graphs",
                    label: "Graphs",
                    summary: "Model entities as nodes and allowed transitions as edges.",
                    nodes: [
                        { id: "bfs-dfs", label: "BFS & DFS", summary: "Use traversal for reachability and components; use BFS layers for shortest unweighted hops.", guide: "python-graph-traversal" },
                        { id: "union-find", label: "Union–find", summary: "Maintain evolving connectivity with near-constant-time merge and component queries." },
                        { id: "topological-sort", label: "Topological sort", summary: "Order dependencies in a DAG and detect when prerequisite cycles make ordering impossible." }
                    ]
                },
                {
                    id: "python-optimization",
                    label: "Search & optimization",
                    summary: "Explore choices while eliminating repeated or provably inferior work.",
                    nodes: [
                        { id: "backtracking", label: "Backtracking", summary: "Build a choice path, prune invalid branches, and undo state exactly once." },
                        { id: "greedy", label: "Greedy", summary: "Commit to a locally optimal choice only when an exchange argument preserves a global optimum." },
                        { id: "dynamic-programming", label: "Dynamic programming", summary: "Identify repeated subproblems, define state and transition, then choose memoization or tabulation." }
                    ]
                }
            ]
        },
        sql: {
            thesis: "Reason from row grain and relational transformations; use SQL syntax only to express the proven sequence.",
            principles: ["Name the grain first", "Think in sets and transformations", "Make ordering and ties explicit"],
            clusters: [
                {
                    id: "sql-foundations",
                    label: "Execution model",
                    summary: "Understand what rows exist at each logical stage of a query.",
                    nodes: [
                        { id: "logical-order", label: "Logical query order", summary: "Reason through FROM/JOIN, WHERE, GROUP, HAVING, SELECT, windows, ORDER, and LIMIT." },
                        { id: "null-logic", label: "NULL & three-valued logic", summary: "Handle unknown values explicitly in comparisons, joins, filters, and aggregates." },
                        { id: "grain-cardinality", label: "Grain & cardinality", summary: "State what one row represents and predict how every join or aggregation changes row count." }
                    ]
                },
                {
                    id: "sql-relational",
                    label: "Relational operations",
                    summary: "Combine and compare sets without accidentally changing the business population.",
                    nodes: [
                        { id: "join-semantics", label: "Join semantics", summary: "Choose inner, outer, cross, and lateral behavior from which unmatched rows must survive." },
                        { id: "existence", label: "Existence & anti-joins", summary: "Use EXISTS and NOT EXISTS when the question concerns presence rather than row multiplication." },
                        { id: "set-operations", label: "Set operations", summary: "Use UNION, INTERSECT, and EXCEPT with deliberate duplicate handling and compatible grain." }
                    ]
                },
                {
                    id: "sql-aggregation",
                    label: "Aggregation",
                    summary: "Collapse rows into business groups while preserving the intended denominator.",
                    nodes: [
                        { id: "group-having", label: "GROUP BY & HAVING", summary: "Filter source rows before aggregation and aggregated groups afterward." },
                        { id: "conditional-aggregation", label: "Conditional aggregation", summary: "Calculate multiple metrics over one grouped population with explicit CASE conditions." },
                        { id: "top-n-group", label: "Top N per group", summary: "Rank within each business group and filter in a separate query layer.", guide: "sql-top-n-per-group" }
                    ]
                },
                {
                    id: "sql-windows",
                    label: "Window analytics",
                    summary: "Calculate across related rows without collapsing the result grain.",
                    nodes: [
                        { id: "ranking", label: "Ranking", summary: "Choose ROW_NUMBER, RANK, or DENSE_RANK according to uniqueness and tie semantics." },
                        { id: "window-frames", label: "Window frames", summary: "Control which ordered neighboring rows participate in running and moving calculations." },
                        { id: "lag-lead-sessions", label: "LAG, LEAD & sessions", summary: "Compare adjacent events, detect boundaries, and turn them into stable groups.", guide: "sql-sessions" }
                    ]
                },
                {
                    id: "sql-data-quality",
                    label: "Data quality patterns",
                    summary: "Resolve duplicate, historical, and continuity problems deterministically.",
                    nodes: [
                        { id: "deduplicate-latest", label: "Deduplicate latest", summary: "Pick one winning row using a complete, defensible ordering.", guide: "sql-deduplicate" },
                        { id: "slowly-changing", label: "Slowly changing dimensions", summary: "Represent current and historical attribute values with explicit effective intervals." },
                        { id: "gaps-islands", label: "Gaps & islands", summary: "Identify consecutive runs by detecting boundaries and assigning a cumulative group ID." }
                    ]
                },
                {
                    id: "sql-performance",
                    label: "Modeling & performance",
                    summary: "Design queryable models and optimize using evidence from the execution plan.",
                    nodes: [
                        { id: "keys-modeling", label: "Keys & dimensional models", summary: "Make fact grain, dimensions, relationships, and history explicit." },
                        { id: "pruning-indexes", label: "Pruning & indexes", summary: "Reduce scanned work through selective predicates, useful layout, and engine-specific access paths." },
                        { id: "explain-plans", label: "Explain plans", summary: "Find the expensive operator and fix the data flow before scaling compute." }
                    ]
                }
            ]
        },
        go: {
            thesis: "Treat every goroutine as an owned resource with bounded work, explicit communication, and a defined exit path.",
            principles: ["Concurrency is not parallelism", "Own channel closure", "Every goroutine needs a lifecycle"],
            clusters: [
                {
                    id: "go-runtime",
                    label: "Runtime model",
                    summary: "Understand what Go schedules, shares, allocates, and protects.",
                    nodes: [
                        { id: "goroutine-scheduler", label: "Goroutines & scheduler", summary: "Know how lightweight goroutines are multiplexed onto threads and where blocking occurs." },
                        { id: "memory-model", label: "Memory model", summary: "Establish happens-before relationships instead of reasoning from timing accidents." },
                        { id: "race-detection", label: "Data races", summary: "Prevent concurrent unsynchronized access and verify with the race detector." }
                    ]
                },
                {
                    id: "go-channels",
                    label: "Channels",
                    summary: "Use channels for coordination and ownership transfer, not as a default queue for everything.",
                    nodes: [
                        { id: "channel-ownership", label: "Ownership & closure", summary: "The sending side normally owns closure; receivers range until the lifecycle is complete." },
                        { id: "buffer-backpressure", label: "Buffers & backpressure", summary: "Choose buffer capacity from bounded burst absorption, not as a way to hide blocked consumers." },
                        { id: "select-fan", label: "Select, fan-out & fan-in", summary: "Coordinate multiple communication paths while preserving cancellation and completion." }
                    ]
                },
                {
                    id: "go-synchronization",
                    label: "Synchronization",
                    summary: "Choose the primitive that makes shared ownership clearest.",
                    nodes: [
                        { id: "mutex-atomic", label: "Mutexes & atomics", summary: "Protect compound invariants with locks; reserve atomics for simple, proven state transitions." },
                        { id: "waitgroup", label: "WaitGroup", summary: "Count goroutine completion without using it for error propagation or cancellation." },
                        { id: "errgroup", label: "Errgroup", summary: "Run related tasks with shared cancellation and first-error propagation." }
                    ]
                },
                {
                    id: "go-lifecycle",
                    label: "Lifecycle & cancellation",
                    summary: "Make timeouts, cancellation, and cleanup travel through every blocking boundary.",
                    nodes: [
                        { id: "context-cancellation", label: "Context cancellation", summary: "Pass request-scoped deadlines and cancellation down the call tree.", guide: "go-cancellation" },
                        { id: "timeouts-cleanup", label: "Timeouts & cleanup", summary: "Bound external calls and always release bodies, timers, connections, and other resources." },
                        { id: "goroutine-leaks", label: "Goroutine leaks", summary: "Find blocked goroutines, define termination, and verify the count returns to baseline.", guide: "go-goroutine-leaks" }
                    ]
                },
                {
                    id: "go-patterns",
                    label: "Concurrency patterns",
                    summary: "Compose bounded, cancellable units instead of scattering goroutines.",
                    nodes: [
                        { id: "worker-pools", label: "Worker pools", summary: "Bound pressure on a downstream resource and close result streams from one coordinator.", guide: "go-worker-pool" },
                        { id: "pipelines", label: "Pipelines", summary: "Connect stages with clear channel ownership and cancellation that can stop the entire chain." },
                        { id: "rate-limiting", label: "Rate limiting", summary: "Control admission with token buckets, semaphores, or timed pacing based on the protected resource." }
                    ]
                },
                {
                    id: "go-production",
                    label: "Production operations",
                    summary: "Observe, profile, and shut down concurrent services without losing work.",
                    nodes: [
                        { id: "profiling", label: "Profiling & tracing", summary: "Use pprof, runtime metrics, and traces to locate CPU, allocation, blocking, and contention costs." },
                        { id: "graceful-shutdown", label: "Graceful shutdown", summary: "Stop accepting work, drain in-flight operations, and exit within a bounded deadline." },
                        { id: "distributed-boundaries", label: "Distributed boundaries", summary: "Carry deadlines, idempotency, retry budgets, and observability across process boundaries." }
                    ]
                }
            ]
        }
    }
};

window.PATTERNBOOK_ATLAS = ATLAS;
