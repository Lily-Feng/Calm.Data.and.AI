// Editorial content for the homepage atlas that is not part of the taxonomy:
// role trails, guided questions, the modern-stack milestones and editorial notes.
// Every step and milestone points at a topic id in data-ai-knowledge-graph.yaml;
// knowledge-atlas.js drops (and logs) any reference it cannot resolve.

window.ATLAS_CONTENT = {
  // Seven-stop introductions, from foundations to outcomes.
  trails: {
    platform: {
      label: "Platform architect",
      topics: ["cpu-architecture", "cloud-networking", "table-format-fundamentals", "workflow-orchestration", "inference-autoscaling", "online-inference-endpoints", "visualization-accessibility"]
    },
    data_engineer: {
      label: "Data engineer",
      topics: ["object-store-as-primary", "parquet", "log-based-cdc", "dimensional-modeling", "data-contracts", "analytics-apis", "self-service-analytics"]
    },
    analytics_engineer: {
      label: "Analytics engineer",
      topics: ["columnar-warehouses", "sql-transformation-modeling", "grain-and-key-design", "metric-definitions", "headless-bi", "natural-language-to-sql", "data-storytelling"]
    },
    ml_engineer: {
      label: "ML engineer",
      topics: ["gpu-and-accelerators", "vector-index-hnsw", "feature-types-and-encoding", "point-in-time-correctness", "distributed-training-strategies", "context-assembly", "model-gateways-and-routing"]
    },
    scientist: {
      label: "Data scientist",
      topics: ["numerical-precision-formats", "dataframe-apis", "feature-selection", "supervised-learning", "model-evaluation", "reproducible-analysis", "causal-inference"]
    },
    analyst: {
      label: "Analyst",
      topics: ["relational-model", "query-planning", "dimensional-modeling", "metric-definitions", "self-service-analytics", "visual-encoding", "decision-workflows"]
    }
  },

  // Guided questions. `m` narrates the MicroStrategy lens, `n` the modern field.
  // A step's topic may differ by lens: { m: "in-memory-cubes", n: "materialized-views" }.
  questions: {
    owners: {
      label: "Who owns each definition?",
      color: "#d58cff",
      steps: [
        { topic: "sql-transformation-modeling", title: "Data structure", m: "The warehouse and ETL team — outside MicroStrategy.", n: "Transformation code: SQL models in version control." },
        { topic: "metric-definitions", title: "Business meaning", m: "MicroStrategy metadata: attributes, facts and metrics.", n: "A semantic layer, a BI model, or both — decide which one is the system of record." },
        { topic: "policy-management", title: "Policy", m: "MicroStrategy roles, ACLs and security filters.", n: "Identity and catalog policies shared by every consumer." },
        { topic: "dashboard-design", title: "Presentation", m: "Reports, documents and dossiers.", n: "BI tools, notebooks, applications and AI interfaces." },
        { topic: null, title: "The trade", m: "Three of the four definitions lived inside one metadata boundary — coherent, but closed.", n: "Each definition can live in a different system. The connections between them become the design problem." }
      ]
    },
    request: {
      label: "Where does each computation run?",
      color: "#7aa2ff",
      steps: [
        { topic: "self-service-analytics", m: "A user opens a dossier or report. The request starts inside MicroStrategy.", n: "A user opens a dashboard, notebook or embedded view." },
        { topic: "filters-and-prompts", m: "Prompts, filters and custom groups set the scope of the question.", n: "Parameters, saved filters and BI controls set the scope — often split between the tool and the semantic layer." },
        { topic: "authorization-models", m: "Security filters attach to the user inside the server's metadata boundary.", n: "Identity and catalog policies — row filters, column masks — apply closer to the data, for every consumer." },
        { topic: "metric-definitions", m: "Metrics resolve to facts and attributes from the same metadata repository.", n: "Metric definitions resolve in a semantic layer, a BI model or transformation code." },
        { topic: "semantic-sql-generation", m: "The SQL Engine picks join paths and fact tables, and writes multi-pass SQL for non-additive metrics.", n: "A semantic compiler or BI query generator chooses joins and grain and stages the calculation." },
        { topic: { m: "in-memory-cubes", n: "materialized-views" }, m: "Dynamic Sourcing checks whether an Intelligent Cube can answer instead of the warehouse.", n: "Aggregate awareness or query rewrite looks for a materialized result that is still correct." },
        { topic: "query-planning", m: "Database-specific settings shape the SQL for Teradata, Oracle or Netezza.", n: "SQL is pushed down; the engine's optimizer — and adaptive execution at runtime — revises the plan." },
        { topic: { m: "columnar-warehouses", n: "mpp-execution" }, m: "The warehouse executes — the one step that runs outside MicroStrategy.", n: "An elastic compute pool executes over shared storage, sized for this workload." },
        { topic: "post-query-calculation", m: "The Analytical Engine finishes subtotals, ranking and cross-tabs in memory.", n: "Most calculation was pushed into SQL; the remainder runs in the client or application runtime." },
        { topic: "dashboard-design", m: "Rendered. The request crossed two systems: the warehouse and one server.", n: "Rendered. Count the systems the request crossed — each is a place a definition could drift." }
      ]
    },
    change: {
      label: "What happens when something changes?",
      color: "#ffb057",
      steps: [
        { topic: "schema-drift-handling", m: "A warehouse column changes upstream — owned by the ETL team, outside MicroStrategy.", n: "A source column changes — perhaps arriving as a CDC event or a new file schema." },
        { topic: "sql-transformation-modeling", m: "Warehouse and logical views absorb the change or pass it on.", n: "SQL models are versioned; the change shows up as a reviewable pull request." },
        { topic: "environments-and-promotion", m: "Object Manager moves the fix and its dependencies between environments.", n: "Git, CI and deployment pipelines promote the change, running tests on the way." },
        { topic: "column-level-lineage", m: "The metadata object graph shows which metrics and reports depend on it.", n: "Lineage crosses more tools — but only as far as each tool emits lineage." },
        { topic: "metric-definitions", m: "Affected metrics are inspectable in the same metadata.", n: "Metric definitions in the semantic layer, and any copies in BI models, need revalidation." },
        { topic: { m: "in-memory-cubes", n: "materialized-views" }, m: "Intelligent Cubes must be republished or they serve the old answer.", n: "Materialized views and pre-aggregations must refresh to stay consistent with on-demand results." },
        { topic: "report-regression-testing", m: "Integrity Manager compares report output before and after.", n: "Data tests, diffs, semantic validation and dashboard checks each cover part of the risk." },
        { topic: { m: "report-distribution", n: "conversational-analytics" }, m: "Reports, subscriptions and APIs downstream all inherit the change.", n: "Dashboards, APIs, alerts and AI assistants inherit it. Can you trace it to every one of them?" }
      ]
    },
    cdc: {
      label: "Follow the CDC thread",
      color: "#4fd1ff",
      modernOnly: true,
      steps: [
        { topic: "acid-and-isolation", n: "The source database's transaction log — the system that owns the truth." },
        { topic: "log-based-cdc", n: "A CDC connector (for example, Debezium) captures inserts, updates and deletes at the source. Capture, not processing." },
        { topic: "log-based-brokers", n: "An event log (for example, Kafka) keeps change events durable for several independent consumers." },
        { topic: "stateful-processing", n: "Stream processing deduplicates and orders the changes; Spark's foreachBatch hands each micro-batch to MERGE logic." },
        { topic: "cdc-to-analytics", n: "A transactional lake table applies the inserts, updates and deletes." },
        { topic: "table-format-fundamentals", n: "The table's change data feed publishes changes made to the analytical table — a separate boundary from source CDC." },
        { topic: "incremental-models", n: "Downstream jobs read the current table or its change feed. Keep the boundaries straight to reason about ordering, retries, deletes and schema changes." }
      ]
    }
  },

  // When the modern data stack took shape: public papers or releases, not the
  // invention of every underlying idea.
  milestones: [
    { year: 2004, name: "MapReduce", why: "A framework could partition data, schedule tasks and retry failures across ordinary machines.", topics: ["distributed-execution-model"], url: "https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/" },
    { year: 2006, name: "Amazon S3 launched", why: "Durable storage became an on-demand service rather than capacity tied to a particular compute cluster.", topics: ["object-store-as-primary"], url: "https://aws.amazon.com/about-aws/whats-new/2006/03/13/announcing-amazon-s3---simple-storage-service/" },
    { year: 2010, name: "Spark open-sourced", why: "Iterative and interactive jobs could avoid writing every intermediate step to disk.", topics: ["distributed-execution-model", "dataframe-apis"], url: "https://spark.apache.org/history" },
    { year: 2011, name: "Kafka open-sourced", why: "High-volume events got a durable log that producers and several consumers could use independently.", topics: ["log-based-brokers"], url: "https://www.linkedin.com/blog/engineering/open-source/project-kafka-distributed-publish-subscribe-messaging-system-reaches-v06" },
    { year: 2013, name: "Parquet", why: "Analytical scans got compact columnar files that skip irrelevant columns and are readable by different engines.", topics: ["parquet"], url: "https://parquet.apache.org/docs/learning-resources/presentations/strata-2013/" },
    { year: 2014, name: "Snowflake virtual warehouses", why: "Storage and compute could scale separately; workloads could use different compute pools over shared data.", topics: ["columnar-warehouses", "mpp-execution"], url: "https://www.snowflake.com/en/blog/behind-snowflakes-name/" },
    { year: 2015, name: "Airflow", why: "Multi-step pipelines got explicit dependencies, scheduling, retries and a visible run history.", topics: ["workflow-orchestration"], url: "https://airflow.apache.org/docs/apache-airflow/1.10.11/project.html" },
    { year: 2015, name: "Spark SQL and DataFrames", why: "Describe what to compute while the Catalyst optimizer chooses and revises the plan.", topics: ["query-planning", "dataframe-apis"], url: "https://people.csail.mit.edu/matei/papers/2015/sigmod_spark_sql.pdf" },
    { year: 2016, name: "Debezium", why: "An open connector path for log-based CDC: database log changes become events.", topics: ["log-based-cdc"], url: "https://debezium.io/archives/" },
    { year: 2016, name: "dbt", why: "Warehouse SQL became modular, tested, versioned models with reviewable changes.", topics: ["sql-transformation-modeling", "version-control-and-cicd"], url: "https://www.getdbt.com/blog/dbt-core-v1-is-here" },
    { year: 2016, name: "Structured Streaming", why: "Unbounded events processed with the same DataFrame model used for batch data.", topics: ["stream-table-duality"], url: "https://spark.apache.org/releases/spark-release-2-0-0.html" },
    { year: 2018, name: "Spark foreachBatch", why: "Each micro-batch handed to custom sink logic — a bridge from change events to upserts.", topics: ["cdc-to-analytics"], url: "https://spark.apache.org/releases/spark-release-2-4-0.html" },
    { year: 2018, name: "Iceberg enters Apache incubation", why: "A table abstraction over files, so engines share schemas and snapshots without trusting directory listings.", topics: ["table-format-fundamentals"], url: "https://incubator.apache.org/projects/iceberg.html" },
    { year: 2019, name: "Delta Lake open-sourced", why: "A transaction log on lake files: reliable updates and deletes for incremental pipelines.", topics: ["acid-on-object-storage"], url: "https://delta.io/blog/2019-04-22-delta-lake-0-1-0-released/" },
    { year: 2020, name: "Adaptive query execution", why: "Runtime statistics revise a plan whose pre-execution estimates were wrong.", topics: ["query-planning"], url: "https://spark.apache.org/releases/spark-release-3-0-0.html" },
    { year: 2022, name: "Unity Catalog preview", why: "More engines, workspaces and asset types needed shared permissions, lineage and auditability.", topics: ["data-catalogs", "policy-management"], url: "https://www.databricks.com/blog/2022/04/20/announcing-gated-public-preview-of-unity-catalog-on-aws-and-azure.html" },
    { year: 2023, name: "Delta change data feed in SQL", why: "Downstream consumers query row-level table changes without comparing whole snapshots.", topics: ["cdc-to-analytics", "incremental-models"], url: "https://delta.io/blog/2023-05-02-delta-lake-2-3-0-released/" },
    { year: 2023, name: "dbt Semantic Layer GA", why: "Metrics defined in transformation code served consistently to multiple consumers.", topics: ["metric-definitions", "headless-bi"], url: "https://docs.getdbt.com/blog/product-analytics-pipeline-with-dbt-semantic-layer" }
  ],

  editorialNotes: {
    "block-file-object-media": "Block, file, and object describe storage access interfaces—not physical media. The revised label keeps that distinction visible while retaining the topic in the infrastructure layer.",
    "delivery-semantics": "Treat delivery guarantees and end-to-end processing outcomes separately. “Exactly once” is scoped: it depends on transaction boundaries and cooperation from sinks outside the streaming system.",
    "ai-specific-threats": "Modern AI application security extends beyond prompt injection and model theft. It also includes unsafe agency, sensitive disclosure, poisoned dependencies, unbounded consumption, and insecure output handling.",
    "slos-and-error-budgets": "Reliability is now its own cross-cutting compass point. SLOs and error budgets are operational control mechanisms, not simply cost-management techniques.",
    "table-format-fundamentals": "Snapshots, manifest lists, manifests, and atomic metadata commits are central concepts in modern open table formats; they belong together as the foundation of this group.",
    "log-based-cdc": "CDC is capture at the source; a stream processor is a consumer of the resulting events. A table change feed is a third boundary: it publishes changes made to the analytical table. Keeping them separate makes ordering, retries, deletes and schema changes easier to reason about.",
    "semantic-sql-generation": "An apparently simple semantic definition can hide a hard planning problem: join path and grain, aggregate choice, multi-stage calculation for ratios and distinct counts, dialect and pushdown, and whether people can inspect the generated query.",
    "level-aware-metrics": "The hardest semantic cases are where a metric changes meaning with its grain, filter context or join path. Some semantic layers express level-aware aggregation directly; elsewhere it falls back to careful SQL."
  }
};
